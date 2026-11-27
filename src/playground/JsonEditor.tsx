import { useId } from 'react';

export interface JsonEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const editorId = useId();
  const lineCount = value.split('\n').length;

  return (
    <div className="playground__editor">
      <div className="playground__pane-header">
        <label htmlFor={editorId} className="playground__pane-title">
          Screen JSON Document
        </label>
        <span className="playground__description">{lineCount} lines</span>
      </div>
      <textarea
        id={editorId}
        className="playground__textarea"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        spellCheck={false}
        aria-label="Screen JSON Document"
      />
    </div>
  );
}
