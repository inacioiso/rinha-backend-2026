import { readFile } from 'node:fs/promises';
import { join } from "node:path";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { MccRiskMap, NormalizationConstants } from '../types/transaction-type';
import { buildKnnIndex, KnnIndex } from './knn';

export interface DataBundle {
    norm: NormalizationConstants,
    mcc: MccRiskMap,
    index: KnnIndex 
}

const gunzipPromise = promisify(gunzip);
const RESOURCES_DIR = join(process.cwd(), 'resources');

export async function loadSet(): Promise<DataBundle> {
    try {
        const [ normS, mccS, referenceS ] = await Promise.all([
        readFile(join(RESOURCES_DIR, "normalization.json"), "utf-8"),
        readFile(join(RESOURCES_DIR, "mcc_risk.json"), "utf8"),
        readFile(join(RESOURCES_DIR, "references.json.gz"))
    ]);

        const decompressed = await gunzipPromise(referenceS);
        const referencesData = JSON.parse(decompressed.toString('utf8'));

        const norm = JSON.parse(normS);
        const mcc = JSON.parse(mccS);
        const index = buildKnnIndex(referencesData);

        return { norm, mcc, index }

    } catch(e) {
        throw e;
    }
}