// Minimal smoke test — just checks the app renders without crashing
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /sdui-lab/i })).toBeInTheDocument();
  });
});
