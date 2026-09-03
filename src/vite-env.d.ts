/// <reference types="vite/client" />

declare module '*?worker&url' {
  const workerUrl: string;
  export default workerUrl;
}

/**
 * True only when the dev server is serving the local resources library at
 * /library/. Replaced at build time, so the production bundle folds it to
 * `false` and drops every branch that would reference a local file.
 */
declare const __LEARNLOG_LOCAL__: boolean;
