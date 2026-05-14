import { createReadStream, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { join } from "node:path";

const RESOURCES_DIR = join(process.cwd(), "resources");
const VECTOR_SIZE = 14;

console.log("Lendo references.json.gz...");

const chunks: Buffer[] = [];
await new Promise<void>((resolve, reject) => {
    createReadStream(join(RESOURCES_DIR, "references.json.gz"))
        .pipe(createGunzip())
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", resolve)
        .on("error", reject);
});

console.log("Parseando JSON...");
const records: Array<{ vector: number[]; label: string }> =
    JSON.parse(Buffer.concat(chunks).toString("utf8"));

const n = records.length;
console.log(`Total: ${n} registros`);

const vectors = new Int16Array(n * VECTOR_SIZE);
const labels  = new Uint8Array(n);

for (let i = 0; i < n; i++) {
    const base = i * VECTOR_SIZE;
    for (let d = 0; d < VECTOR_SIZE; d++) {
        vectors[base + d] = Math.round(records[i].vector[d] * 10000);
    }
    labels[i] = records[i].label === "fraud" ? 1 : 0;
}

// formato do arquivo:
// [4 bytes: quantidade de registros]
// [n * 14 * 2 bytes: vetores em Int16]
// [n bytes: labels]
const header = Buffer.allocUnsafe(4);
header.writeUInt32LE(n, 0);

writeFileSync(
    join(RESOURCES_DIR, "references.bin"),
    Buffer.concat([header, Buffer.from(vectors.buffer), Buffer.from(labels.buffer)]),
);

console.log("Salvo em resources/references.bin");