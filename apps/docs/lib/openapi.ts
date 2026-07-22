import { createOpenAPI } from "fumadocs-openapi/server";

// Points at the file apps/api's `export:openapi` script produces. Both apps
// agree on this path: apps/api writes to <repo>/apps/api/openapi.json, and
// this is the same file resolved relative to apps/docs.
export const openapi = createOpenAPI({
  input: ["../api/openapi.json"],
});
