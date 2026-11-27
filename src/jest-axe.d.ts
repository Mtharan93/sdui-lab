declare module 'jest-axe' {
  export interface AxeViolation {
    id: string;
    impact?: 'minor' | 'moderate' | 'serious' | 'critical' | null;
    description: string;
    help: string;
    helpUrl: string;
    nodes: { html: string; target: string[] }[];
  }

  export interface AxeResults {
    violations: AxeViolation[];
  }

  export function axe(
    html: Element | string,
    options?: Record<string, unknown>,
  ): Promise<AxeResults>;
}
