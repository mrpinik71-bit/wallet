import run from "./scan-check.mjs";
async function main() {
  const t = Date.now();
  let out;
  try { out = await run(); } catch (e) { out = { thrown: String(e?.message || e) }; }
  console.log(JSON.stringify({ ms: Date.now() - t, ...out }, null, 1));
  process.exit(0);
}
main();
