import runApp from "./app";

async function noopSetup() {
  // Frontend is served by the separate stroke-recovery-academy artifact.
  // The api-server only handles API routes.
}

(async () => {
  await runApp(noopSetup);
})();
