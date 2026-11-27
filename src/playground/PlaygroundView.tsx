import './playground.css';
import { useEffect, useId, useMemo, useState } from 'react';
import { createDefaultRegistry } from '@/components';
import { SduiRenderer } from '@/runtime';
import { SCHEMA_VERSION_V1, validateRawDocument, type ValidationIssue } from '@/schema';
import { PLAYGROUND_EXAMPLES } from './examples';
import { JsonEditor } from './JsonEditor';
import { ValidationPanel } from './ValidationPanel';

interface ParsedState {
  parsedDocument: unknown;
  syntaxError: string | null;
  issues: ValidationIssue[];
  migratedFrom: number | null;
}

function analyzeJsonText(rawText: string, previousDocument: unknown): ParsedState {
  try {
    const parsed: unknown = JSON.parse(rawText);
    const validation = validateRawDocument(parsed);
    if (validation.valid) {
      return {
        parsedDocument: parsed,
        syntaxError: null,
        issues: [],
        migratedFrom: validation.version === SCHEMA_VERSION_V1 ? SCHEMA_VERSION_V1 : null,
      };
    }
    return {
      parsedDocument: parsed,
      syntaxError: null,
      issues: validation.issues,
      migratedFrom: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return {
      parsedDocument: previousDocument,
      syntaxError: message,
      issues: [],
      migratedFrom: null,
    };
  }
}

export function PlaygroundView() {
  const selectId = useId();
  const registry = useMemo(() => createDefaultRegistry(), []);

  const defaultExample = PLAYGROUND_EXAMPLES[0];
  if (defaultExample === undefined) {
    throw new Error('PLAYGROUND_EXAMPLES must not be empty');
  }

  const [selectedId, setSelectedId] = useState<string>(defaultExample.id);
  const [editorText, setEditorText] = useState<string>(() =>
    JSON.stringify(defaultExample.document, null, 2),
  );
  const [analysis, setAnalysis] = useState<ParsedState>(() =>
    analyzeJsonText(JSON.stringify(defaultExample.document, null, 2), defaultExample.document),
  );
  const [navMessage, setNavMessage] = useState<string | null>(null);

  // Debounce live JSON validation as the user types.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnalysis((prev) => analyzeJsonText(editorText, prev.parsedDocument));
    }, 180);
    return () => {
      window.clearTimeout(timer);
    };
  }, [editorText]);

  const currentExample = PLAYGROUND_EXAMPLES.find((ex) => ex.id === selectedId) ?? defaultExample;

  const loadExample = (exampleId: string) => {
    const target = PLAYGROUND_EXAMPLES.find((ex) => ex.id === exampleId);
    if (!target) {
      return;
    }
    const formatted = JSON.stringify(target.document, null, 2);
    setSelectedId(target.id);
    setEditorText(formatted);
    setAnalysis(analyzeJsonText(formatted, target.document));
    setNavMessage(null);
  };

  const handleFormat = () => {
    try {
      const parsed: unknown = JSON.parse(editorText);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditorText(formatted);
      setAnalysis((prev) => analyzeJsonText(formatted, prev.parsedDocument));
    } catch {
      // Leave text untouched if syntax is invalid; ValidationPanel shows the error.
    }
  };

  const handleNavigate = (targetScreenId: string) => {
    const match = PLAYGROUND_EXAMPLES.find((ex) => ex.id === targetScreenId);
    if (match) {
      loadExample(match.id);
      setNavMessage(`Navigated to "${match.label}".`);
    } else {
      setNavMessage(`Navigation action dispatched for screen "${targetScreenId}".`);
    }
  };

  return (
    <section className="playground" aria-label="SDUI Playground">
      <div className="playground__toolbar">
        <div className="playground__selector">
          <label htmlFor={selectId} className="playground__label">
            Example Screen
          </label>
          <select
            id={selectId}
            className="playground__select"
            value={selectedId}
            onChange={(event) => {
              loadExample(event.target.value);
            }}
          >
            {PLAYGROUND_EXAMPLES.map((example) => (
              <option key={example.id} value={example.id}>
                {example.label}
              </option>
            ))}
          </select>
          <p className="playground__description">{currentExample.description}</p>
        </div>

        <div className="playground__actions">
          <button type="button" className="playground__btn" onClick={handleFormat}>
            Format JSON
          </button>
          <button
            type="button"
            className="playground__btn"
            onClick={() => {
              loadExample(currentExample.id);
            }}
          >
            Reset Example
          </button>
        </div>
      </div>

      {navMessage !== null && (
        <div role="status" className="playground__nav-notice">
          {navMessage}
        </div>
      )}

      <div className="playground__split">
        <div className="playground__pane">
          <JsonEditor value={editorText} onChange={setEditorText} />
          <ValidationPanel
            syntaxError={analysis.syntaxError}
            issues={analysis.issues}
            migratedFrom={analysis.migratedFrom}
          />
        </div>

        <div className="playground__pane">
          <div className="playground__pane-header">
            <h2 className="playground__pane-title">Live Rendered Screen</h2>
            {analysis.syntaxError !== null && (
              <span className="playground__description">Showing last valid JSON</span>
            )}
          </div>
          <div className="playground__preview">
            <SduiRenderer
              document={analysis.parsedDocument}
              registry={registry}
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
