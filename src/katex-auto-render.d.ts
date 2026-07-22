declare module 'katex/dist/contrib/auto-render' {
  interface RenderMathInElementOptions {
    delimiters?: {
      left: string;
      right: string;
      display: boolean;
    }[];
    throwOnError?: boolean;
    trust?: boolean;
    output?: 'html' | 'mathml';
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: RenderMathInElementOptions
  ): void;
}
