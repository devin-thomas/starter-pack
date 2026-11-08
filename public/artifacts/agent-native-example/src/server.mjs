// Start the HTTP projection: node src/server.mjs (PORT=0 picks a free port).
import { startPantryServer } from "./http.mjs";

const { server, url } = await startPantryServer({
  port: Number(process.env.PORT ?? 8787),
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.close());
console.log(`listening=${url}`);
