import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app header, navigation, and Playground view by default', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /sdui-lab/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Playground' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByLabelText('Screen JSON Document')).toBeInTheDocument();
  });
});
