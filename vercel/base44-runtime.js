// Stub for the Base44 runtime module `base44:runtime`, used only by the Vercel static build
// (vite.vercel.config.js). On Vercel the app's API routes are served by Base44 (see the /api
// rewrite in vercel.json), so this build only needs the module to resolve — no secret is read here.
export const secrets = {
  get: () => undefined,
};

export const waitUntil = () => {};

export default { secrets, waitUntil };