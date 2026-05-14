import { readFileSync } from "node:fs";
import { join } from "node:path";
import { KnnIndex } from "./knn.js";
import { MccRiskMap, NormalizationConstants } from "../types/transaction-type.js";

export interface DataBundle {
    norm: NormalizationConstants;
    mcc: MccRiskMap;
    index: KnnIndex;
}

const RESOURCES_DIR = join(process.cwd(), "resources");
const VECTOR_SIZE = 14;

export function loadSet(): DataBundle {
    const norm: NormalizationConstants = JSON.parse(
        readFileSync(join(RESOURCES_DIR, "normalization.json"), "utf8")
    );
    const mcc: MccRiskMap = JSON.parse(
        readFileSync(join(RESOURCES_DIR, "mcc_risk.json"), "utf8")
    );

    const bin = readFileSync(join(RESOURCES_DIR, "references.bin"));

    const n = bin.readUInt32LE(0);

    const vectorsOffset = 4;
    const labelsOffset  = vectorsOffset + n * VECTOR_SIZE * 2;

    const vectors = new Int16Array(bin.buffer, bin.byteOffset + vectorsOffset, n * VECTOR_SIZE);
    const labels  = new Uint8Array(bin.buffer,  bin.byteOffset + labelsOffset,  n);

    return { norm, mcc, index: new KnnIndex(vectors, labels) };
}