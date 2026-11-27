import './tradeoffs.css';
import { Profiler, useCallback, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createDefaultRegistry } from '@/components';
import { SduiRenderer } from '@/runtime';
import { BENCHMARK_SCREEN_DOC } from './benchmarkScreen';
import { HandwrittenScreen } from './HandwrittenScreen';
import measuredBaseline from './measuredBaseline.json';
import {
  applyProfilerSample,
  createInitialProfilerStats,
  createProfilerCallback,
  type ProfilerStats,
} from './profilerHelpers';

interface BrowserBenchmarkResult {
  iterations: number;
  handwrittenTotalMs: number;
  sduiTotalMs: number;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} kB (${bytes.toLocaleString()} B)`;
}

export function TradeoffsView() {
  const registry = useMemo(() => createDefaultRegistry(), []);

  const [handwrittenStats, setHandwrittenStats] = useState<ProfilerStats>(
    createInitialProfilerStats,
  );
  const [sduiStats, setSduiStats] = useState<ProfilerStats>(createInitialProfilerStats);

  // Use refs for live updates inside Profiler callbacks without creating infinite commit loops.
  const handwrittenRef = useRef<ProfilerStats>(createInitialProfilerStats());
  const sduiRef = useRef<ProfilerStats>(createInitialProfilerStats());
  const isBatchRunningRef = useRef(false);

  const [benchmarkIterationName, setBenchmarkIterationName] = useState<string | undefined>(
    undefined,
  );
  const [browserBench, setBrowserBench] = useState<BrowserBenchmarkResult | null>(null);

  const onHandwrittenRender = useMemo(
    () =>
      createProfilerCallback((phase, actualDuration) => {
        handwrittenRef.current = applyProfilerSample(handwrittenRef.current, phase, actualDuration);
        if (!isBatchRunningRef.current) {
          queueMicrotask(() => {
            setHandwrittenStats(handwrittenRef.current);
          });
        }
      }),
    [],
  );

  const onSduiRender = useMemo(
    () =>
      createProfilerCallback((phase, actualDuration) => {
        sduiRef.current = applyProfilerSample(sduiRef.current, phase, actualDuration);
        if (!isBatchRunningRef.current) {
          queueMicrotask(() => {
            setSduiStats(sduiRef.current);
          });
        }
      }),
    [],
  );

  const sduiDoc = useMemo(() => {
    if (benchmarkIterationName === undefined) {
      return BENCHMARK_SCREEN_DOC;
    }
    return {
      ...BENCHMARK_SCREEN_DOC,
      initialState: {
        ...BENCHMARK_SCREEN_DOC.initialState,
        displayName: benchmarkIterationName,
      },
    };
  }, [benchmarkIterationName]);

  const [benchMode, setBenchMode] = useState<'both' | 'handwritten-only' | 'sdui-only'>('both');

  const runBrowserBenchmark = useCallback(() => {
    const iterations = 50;
    isBatchRunningRef.current = true;

    try {
      flushSync(() => {
        setBenchMode('handwritten-only');
      });
      const hwStart = performance.now();
      for (let i = 1; i <= iterations; i += 1) {
        flushSync(() => {
          setBenchmarkIterationName(`Bench User ${String(i)}`);
        });
      }
      const hwElapsed = performance.now() - hwStart;

      flushSync(() => {
        setBenchMode('sdui-only');
      });
      const sduiStart = performance.now();
      for (let i = 1; i <= iterations; i += 1) {
        flushSync(() => {
          setBenchmarkIterationName(`SDUI User ${String(i)}`);
        });
      }
      const sduiElapsed = performance.now() - sduiStart;

      flushSync(() => {
        setBenchMode('both');
        setBenchmarkIterationName(undefined);
      });

      setBrowserBench({
        iterations,
        handwrittenTotalMs: Number(hwElapsed.toFixed(2)),
        sduiTotalMs: Number(sduiElapsed.toFixed(2)),
      });
    } finally {
      isBatchRunningRef.current = false;
      setHandwrittenStats(handwrittenRef.current);
      setSduiStats(sduiRef.current);
    }
  }, []);

  const profilerActiveInBuild = handwrittenStats.commits > 0 || sduiStats.commits > 0;

  return (
    <section className="tradeoffs" aria-label="SDUI Trade-offs and Cost Analysis">
      <div className="tradeoffs__intro">
        <h2 className="tradeoffs__title">What does the abstraction cost?</h2>
        <p className="tradeoffs__lead">
          One screen built two ways: hand-written React vs. the same screen parsed, validated, and
          rendered through the SDUI runtime. Every number below comes from real measurements — run{' '}
          <code className="tradeoffs__mono">pnpm measure:tradeoffs</code> locally to reproduce the
          CLI numbers on your machine.
        </p>
      </div>

      <div className="tradeoffs__panel">
        <div className="tradeoffs__panel-header">
          <h3 className="tradeoffs__panel-title">Live Browser Comparison &amp; Benchmark</h3>
          <button type="button" className="tradeoffs__btn" onClick={runBrowserBenchmark}>
            Run 50-update browser benchmark
          </button>
        </div>

        {!profilerActiveInBuild && (
          <p className="tradeoffs__note">
            Note: React strips <code>&lt;Profiler&gt;</code> callbacks in standard production
            builds. The 50-update wall-clock benchmark above still measures real synchronous{' '}
            <code>flushSync</code> update times in production; run <code>pnpm dev</code> or{' '}
            <code>pnpm measure:tradeoffs</code> to inspect React <code>&lt;Profiler&gt;</code>{' '}
            commit counts and <code>actualDuration</code>.
          </p>
        )}

        {browserBench !== null && (
          <div role="status" className="tradeoffs__note">
            <strong>
              Browser <code>flushSync</code> ({browserBench.iterations} updates):
            </strong>{' '}
            Hand-written React took{' '}
            <span className="tradeoffs__mono">{browserBench.handwrittenTotalMs} ms</span> (
            {(browserBench.handwrittenTotalMs / browserBench.iterations).toFixed(3)} ms/update) vs.
            SDUI runtime <span className="tradeoffs__mono">{browserBench.sduiTotalMs} ms</span> (
            {(browserBench.sduiTotalMs / browserBench.iterations).toFixed(3)} ms/update).
          </div>
        )}

        <div className="tradeoffs__split">
          {benchMode !== 'sdui-only' && (
            <div className="tradeoffs__card">
              <div className="tradeoffs__card-header">
                <h4>Hand-Written React</h4>
                <span className="tradeoffs__stats-row">
                  commits: {handwrittenStats.commits} · last:{' '}
                  {handwrittenStats.lastDurationMs ?? 'n/a'} ms
                </span>
              </div>
              <Profiler id="handwritten-screen" onRender={onHandwrittenRender}>
                <HandwrittenScreen externalName={benchmarkIterationName} />
              </Profiler>
            </div>
          )}

          {benchMode !== 'handwritten-only' && (
            <div className="tradeoffs__card">
              <div className="tradeoffs__card-header">
                <h4>SDUI Runtime</h4>
                <span className="tradeoffs__stats-row">
                  commits: {sduiStats.commits} · last: {sduiStats.lastDurationMs ?? 'n/a'} ms
                </span>
              </div>
              <Profiler id="sdui-screen" onRender={onSduiRender}>
                <SduiRenderer document={sduiDoc} registry={registry} />
              </Profiler>
            </div>
          )}
        </div>
      </div>

      <div className="tradeoffs__panel">
        <div className="tradeoffs__panel-header">
          <h3 className="tradeoffs__panel-title">
            Measured CLI Baseline ({measuredBaseline.measuredAt})
          </h3>
        </div>
        <p className="tradeoffs__note">
          Method: <code>scripts/measure-tradeoffs.mjs</code> bundles both isolated targets with Vite
          (<code>react</code> and <code>react-dom</code> externalized, <code>esbuild</code>{' '}
          minification, <code>zlib.gzipSync</code>) and runs {measuredBaseline.profiler.iterations}{' '}
          warmed <code>flushSync</code> updates under {measuredBaseline.profiler.environment}.
        </p>

        <div className="tradeoffs__table-wrap">
          <table className="tradeoffs__table">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Hand-Written React</th>
                <th scope="col">SDUI Runtime + Zod + Registry</th>
                <th scope="col">Overhead</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Isolated JS bundle (minified)</td>
                <td className="tradeoffs__mono">
                  {formatBytes(measuredBaseline.bundle.handwritten.rawBytes)}
                </td>
                <td className="tradeoffs__mono">
                  {formatBytes(measuredBaseline.bundle.sduiRuntime.rawBytes)}
                </td>
                <td className="tradeoffs__mono">
                  +{formatBytes(measuredBaseline.bundle.deltaBytes)}
                </td>
              </tr>
              <tr>
                <td>Isolated JS bundle (gzip)</td>
                <td className="tradeoffs__mono">
                  {formatBytes(measuredBaseline.bundle.handwritten.gzipBytes)}
                </td>
                <td className="tradeoffs__mono">
                  {formatBytes(measuredBaseline.bundle.sduiRuntime.gzipBytes)}
                </td>
                <td className="tradeoffs__mono">
                  +{formatBytes(measuredBaseline.bundle.deltaGzipBytes)}
                </td>
              </tr>
              <tr>
                <td>Mount commits / duration</td>
                <td className="tradeoffs__mono">
                  {measuredBaseline.profiler.handwritten.mountCommits} commit ·{' '}
                  {measuredBaseline.profiler.handwritten.mountDurationMs} ms
                </td>
                <td className="tradeoffs__mono">
                  {measuredBaseline.profiler.sdui.mountCommits} commit ·{' '}
                  {measuredBaseline.profiler.sdui.mountDurationMs} ms
                </td>
                <td className="tradeoffs__mono">
                  +
                  {(
                    measuredBaseline.profiler.sdui.mountDurationMs -
                    measuredBaseline.profiler.handwritten.mountDurationMs
                  ).toFixed(3)}{' '}
                  ms
                </td>
              </tr>
              <tr>
                <td>50-update commits / median</td>
                <td className="tradeoffs__mono">
                  {measuredBaseline.profiler.handwritten.updateCommits} commits ·{' '}
                  {measuredBaseline.profiler.handwritten.medianUpdateMs} ms
                </td>
                <td className="tradeoffs__mono">
                  {measuredBaseline.profiler.sdui.updateCommits} commits ·{' '}
                  {measuredBaseline.profiler.sdui.medianUpdateMs} ms
                </td>
                <td className="tradeoffs__mono">
                  {(
                    measuredBaseline.profiler.sdui.medianUpdateMs /
                    Math.max(0.001, measuredBaseline.profiler.handwritten.medianUpdateMs)
                  ).toFixed(2)}
                  x slower
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="tradeoffs__panel">
        <h3 className="tradeoffs__panel-title">When SDUI Is Worth It vs. When It Isn&apos;t</h3>
        <div className="tradeoffs__guidance">
          <div>
            <h4>Reach for SDUI when:</h4>
            <ul>
              <li>
                Native mobile or multi-surface release cycles are slow and product copy/layouts
                change weekly without binary re-submissions.
              </li>
              <li>
                Experimentation, onboarding flows, or CMS-driven marketing pages share a finite
                design-system catalog.
              </li>
              <li>
                Backends already own eligibility rules and you want one source of truth across web,
                iOS, and Android.
              </li>
            </ul>
          </div>
          <div>
            <h4>Avoid SDUI when:</h4>
            <ul>
              <li>
                You ship a web-only app with fast CI/CD deploys — React bundles already deploy in
                minutes without schema versioning tax.
              </li>
              <li>
                Screens require rich custom state, drag-and-drop, canvas, or tight cross-widget
                keyboard coordination.
              </li>
              <li>
                Your team isn&apos;t ready to maintain schema migrations, fallback UIs, and the
                debugging indirection of JSON-driven trees.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
