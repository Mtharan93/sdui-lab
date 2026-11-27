import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build, createServer } from 'vite';

const repoRoot = resolve(import.meta.dirname, '..');

async function measureBundleContribution() {
  const tempDir = mkdtempSync(join(tmpdir(), 'sdui-lab-bench-'));

  try {
    const handwrittenEntry = join(tempDir, 'handwritten-entry.ts');
    const sduiEntry = join(tempDir, 'sdui-entry.ts');

    writeFileSync(
      handwrittenEntry,
      `export { HandwrittenScreen } from '${resolve(repoRoot, 'src/tradeoffs/HandwrittenScreen.tsx').replace(/\\/g, '/')}';\n`,
    );

    writeFileSync(
      sduiEntry,
      [
        `export { SduiRenderer } from '${resolve(repoRoot, 'src/runtime/renderer.tsx').replace(/\\/g, '/')}';`,
        `export { createDefaultRegistry } from '${resolve(repoRoot, 'src/components/defaultRegistry.ts').replace(/\\/g, '/')}';`,
        `export { BENCHMARK_SCREEN_DOC } from '${resolve(repoRoot, 'src/tradeoffs/benchmarkScreen.ts').replace(/\\/g, '/')}';`,
      ].join('\n'),
    );

    const buildTarget = async (entryPath, name) => {
      const outDir = join(tempDir, `out-${name}`);
      const output = await build({
        configFile: false,
        logLevel: 'silent',
        resolve: {
          alias: {
            '@': resolve(repoRoot, 'src'),
          },
        },
        build: {
          outDir,
          emptyOutDir: true,
          minify: 'esbuild',
          cssCodeSplit: false,
          lib: {
            entry: entryPath,
            formats: ['es'],
            fileName: () => `${name}.js`,
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
          },
        },
      });

      const chunks = Array.isArray(output) ? output[0].output : output.output;
      const jsChunks = chunks.filter((item) => item.type === 'chunk');
      const totalCode = jsChunks.map((chunk) => chunk.code).join('\n');
      const rawBytes = Buffer.byteLength(totalCode, 'utf8');
      const gzipBytes = gzipSync(totalCode).byteLength;
      return { rawBytes, gzipBytes };
    };

    const handwritten = await buildTarget(handwrittenEntry, 'handwritten');
    const sduiRuntime = await buildTarget(sduiEntry, 'sdui-runtime');

    return {
      handwritten,
      sduiRuntime,
      deltaBytes: sduiRuntime.rawBytes - handwritten.rawBytes,
      deltaGzipBytes: sduiRuntime.gzipBytes - handwritten.gzipBytes,
    };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

async function measureProfilerTimings() {
  process.env.NODE_ENV = 'development';
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
  });

  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  const vite = await createServer({
    root: repoRoot,
    mode: 'development',
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { flushSync } = await import('react-dom');
    const { HandwrittenScreen } = await vite.ssrLoadModule('/src/tradeoffs/HandwrittenScreen.tsx');
    const { SduiRenderer } = await vite.ssrLoadModule('/src/runtime/renderer.tsx');
    const { createDefaultRegistry } = await vite.ssrLoadModule(
      '/src/components/defaultRegistry.ts',
    );
    const { BENCHMARK_SCREEN_DOC } = await vite.ssrLoadModule('/src/tradeoffs/benchmarkScreen.ts');

    const iterations = 50;
    const registry = createDefaultRegistry();

    const runScenario = (label, renderElement) => {
      const container = dom.window.document.createElement('div');
      dom.window.document.body.appendChild(container);
      const root = createRoot(container);

      const samples = [];
      const onRender = (_id, phase, actualDuration) => {
        samples.push({ phase, actualDuration });
      };

      flushSync(() => {
        root.render(
          React.createElement(React.Profiler, { id: label, onRender }, renderElement('User 0')),
        );
      });

      const mountSamples = samples.filter((s) => s.phase === 'mount');
      const mountCommits = mountSamples.length;
      const mountDurationMs = mountSamples.reduce((acc, s) => acc + s.actualDuration, 0);

      samples.length = 0;
      for (let i = 1; i <= iterations; i += 1) {
        flushSync(() => {
          root.render(
            React.createElement(
              React.Profiler,
              { id: label, onRender },
              renderElement(`User ${String(i)}`),
            ),
          );
        });
      }

      const updateDurations = samples.map((s) => s.actualDuration).sort((a, b) => a - b);
      const updateCommits = samples.length;
      const medianUpdateMs = updateDurations[Math.floor(updateDurations.length / 2)] ?? 0;
      const totalUpdateMs = updateDurations.reduce((acc, v) => acc + v, 0);

      flushSync(() => {
        root.unmount();
      });
      container.remove();

      if (mountCommits === 0 || updateCommits === 0) {
        throw new Error(
          `React Profiler did not record commits for "${label}" (mount=${mountCommits}, update=${updateCommits}).`,
        );
      }

      return {
        mountCommits,
        mountDurationMs: Number(mountDurationMs.toFixed(3)),
        updateCommits,
        meanUpdateMs: Number((totalUpdateMs / Math.max(1, updateCommits)).toFixed(3)),
        medianUpdateMs: Number(medianUpdateMs.toFixed(3)),
      };
    };

    // Warm up V8 JIT and jsdom element prototypes before recording timings.
    for (let w = 0; w < 3; w += 1) {
      runScenario('warmup-handwritten', (name) =>
        React.createElement(HandwrittenScreen, { externalName: name }),
      );
      runScenario('warmup-sdui', (name) =>
        React.createElement(SduiRenderer, {
          document: {
            ...BENCHMARK_SCREEN_DOC,
            initialState: {
              ...BENCHMARK_SCREEN_DOC.initialState,
              displayName: name,
            },
          },
          registry,
        }),
      );
    }

    const handwritten = runScenario('handwritten', (name) =>
      React.createElement(HandwrittenScreen, { externalName: name }),
    );

    const sdui = runScenario('sdui', (name) =>
      React.createElement(SduiRenderer, {
        document: {
          ...BENCHMARK_SCREEN_DOC,
          initialState: {
            ...BENCHMARK_SCREEN_DOC.initialState,
            displayName: name,
          },
        },
        registry,
      }),
    );

    return {
      iterations,
      environment: `Node ${process.version} (${process.platform}/${process.arch}), jsdom, React dev-mode Profiler`,
      handwritten,
      sdui,
    };
  } finally {
    await vite.close();
    globalThis.window = prevWindow;
    globalThis.document = prevDocument;
  }
}

const bundle = await measureBundleContribution();
const profiler = await measureProfilerTimings();

const report = {
  measuredAt: new Date().toISOString().slice(0, 10),
  bundle,
  profiler,
};

console.log(JSON.stringify(report, null, 2));

if (process.argv.includes('--write')) {
  const outPath = resolve(repoRoot, 'src/tradeoffs/measuredBaseline.json');
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nWrote measured baseline to ${outPath}`);
}
