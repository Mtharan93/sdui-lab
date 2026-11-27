import './styles/app.css';
import { useState } from 'react';
import { PlaygroundView } from './playground';
import { TradeoffsView } from './tradeoffs';

type ActiveTab = 'playground' | 'tradeoffs';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('playground');

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <h1 className="app-header__title">sdui-lab</h1>
            <p className="app-header__subtitle">
              Typed server-driven UI runtime for React with Zod validation &amp; node isolation
            </p>
          </div>

          <nav className="app-nav" aria-label="Primary navigation">
            <button
              type="button"
              className="app-nav__tab"
              aria-current={activeTab === 'playground' ? 'page' : undefined}
              onClick={() => {
                setActiveTab('playground');
              }}
            >
              Playground
            </button>
            <button
              type="button"
              className="app-nav__tab"
              aria-current={activeTab === 'tradeoffs' ? 'page' : undefined}
              onClick={() => {
                setActiveTab('tradeoffs');
              }}
            >
              Trade-offs
            </button>
          </nav>
        </div>
      </header>

      <main id="main" className="app-main">
        {activeTab === 'playground' ? <PlaygroundView /> : <TradeoffsView />}
      </main>
    </div>
  );
}
