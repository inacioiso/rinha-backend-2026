import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KnnIndex } from "./knn.js";
const RESOURCES_DIR = join(process.cwd(), "resources");
const VECTOR_SIZE = 14;
export function loadSet() {
    const norm = JSON.parse(readFileSync(join(RESOURCES_DIR, "normalization.json"), "utf8"));
    const mcc = JSON.parse(readFileSync(join(RESOURCES_DIR, "mcc_risk.json"), "utf8"));
    const bin = readFileSync(join(RESOURCES_DIR, "references.bin"));
    const n = bin.readUInt32LE(0);
    const vectorsOffset = 4;
    const labelsOffset = vectorsOffset + n * VECTOR_SIZE * 2;
    const vectors = new Int16Array(bin.buffer, bin.byteOffset + vectorsOffset, n * VECTOR_SIZE);
    const labels = new Uint8Array(bin.buffer, bin.byteOffset + labelsOffset, n);
    return { norm, mcc, index: new KnnIndex(vectors, labels) };
}
