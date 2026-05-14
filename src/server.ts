import Fastify from "fastify";
import { Routes } from "./routes";
import { loadSet } from "./service/loader";

const app = Fastify({ logger: false });

async function main() {
    
    const dataset = loadSet();

    await Routes(app, dataset);

    await app.listen({ port: 9999, host: "0.0.0.0" });
    
    console.log(`Servidor rodando em http://localhost:9999`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})
