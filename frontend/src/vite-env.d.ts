/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional explicit API origin, e.g. http://localhost:3000 — overrides dev same-origin proxy. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
