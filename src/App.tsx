// App.tsx — shell only during M1; real routing added in M8
export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <main id="main">
        <h1>sdui-lab</h1>
        <p>Scaffold ready. Features land in subsequent milestones.</p>
      </main>
    </>
  );
}
