/// <reference types="vite/client" />

// Some parts of the codebase still rely on `process.env.*` being replaced at build time
// (see `vite.config.ts`). Provide a minimal type so `tsc` doesn't fail in strict mode.
declare const process: {
  env: Record<string, string | undefined>;
};

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

