import { useId, useState } from 'react';
import { BENCHMARK_CHECKLIST_ITEMS, BENCHMARK_INITIAL_STATE } from './benchmarkScreen';

export interface HandwrittenScreenProps {
  externalName?: string | undefined;
}

/**
 * Hand-written React implementation of the exact same screen as BENCHMARK_SCREEN_DOC.
 * Uses the same CSS classes so DOM structure and visual styling remain directly comparable.
 */
export function HandwrittenScreen({ externalName }: HandwrittenScreenProps) {
  const nameId = useId();
  const roleId = useId();
  const cardHeadingId = useId();

  const [displayName, setDisplayName] = useState<string>(
    externalName ?? BENCHMARK_INITIAL_STATE.displayName,
  );
  const [role, setRole] = useState<string>(BENCHMARK_INITIAL_STATE.role);
  const [showChecklist, setShowChecklist] = useState<boolean>(
    BENCHMARK_INITIAL_STATE.showChecklist,
  );

  const effectiveName = externalName ?? displayName;

  return (
    <div className="sdui-stack sdui-stack--column sdui-stack--gap-md sdui-stack--align-stretch sdui-stack--justify-start">
      <h3 className="sdui-text sdui-text--h3 sdui-text--tone-default">Profile: {effectiveName}</h3>
      <p className="sdui-text sdui-text--caption sdui-text--tone-muted">Role: {role}</p>

      <section className="sdui-card sdui-card--elevated" aria-labelledby={cardHeadingId}>
        <header className="sdui-card__header">
          <h3 id={cardHeadingId} className="sdui-card__title">
            Edit Details
          </h3>
        </header>
        <div className="sdui-card__body">
          <div className="sdui-field">
            <label htmlFor={nameId} className="sdui-field__label">
              Display name
            </label>
            <input
              id={nameId}
              name="displayName"
              type="text"
              className="sdui-field__input"
              value={effectiveName}
              placeholder="Enter name"
              onChange={(event) => {
                setDisplayName(event.target.value);
              }}
            />
          </div>

          <div className="sdui-field">
            <label htmlFor={roleId} className="sdui-field__label">
              Role
            </label>
            <input
              id={roleId}
              name="role"
              type="text"
              className="sdui-field__input"
              value={role}
              placeholder="Enter role"
              onChange={(event) => {
                setRole(event.target.value);
              }}
            />
          </div>

          <div className="sdui-stack sdui-stack--row sdui-stack--gap-sm sdui-stack--align-stretch sdui-stack--justify-start sdui-stack--wrap">
            <button
              type="button"
              className="sdui-button sdui-button--secondary"
              onClick={() => {
                setShowChecklist(false);
              }}
            >
              Hide checklist
            </button>
            <button
              type="button"
              className="sdui-button sdui-button--primary"
              onClick={() => {
                setShowChecklist(true);
              }}
            >
              Show checklist
            </button>
          </div>
        </div>
      </section>

      {showChecklist && (
        <ol className="sdui-list">
          {BENCHMARK_CHECKLIST_ITEMS.map((item) => (
            <li key={item.id} className="sdui-list__item">
              <span className="sdui-list__item-label">{item.label}</span>
              <span className="sdui-list__item-desc">{item.description}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
