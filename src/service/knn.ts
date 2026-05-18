const K = 5;
const FRAUD_THRESHOLD = 0.4;

export class KnnIndex {

    private readonly data: Int16Array;
    private readonly labels: Uint8Array;
    private readonly count: number;

    constructor(data: Int16Array, labels: Uint8Array) {
        this.data = data;
        this.labels = labels;
        this.count = labels.length;
    }

    query(transactionVector: Float32Array): { fraud_score: number; approved: boolean } {

        const { data, labels, count } = this;

        const heapDist = new Float32Array(K).fill(Infinity);
        const heapLabel = new Uint8Array(K);
        let worstDist = Infinity;
        let worstSlot = 0;

        for (let i = 0; i < count; i++) {
            const base = i * 14;

            let dist = 0;
            for (let j = 0; j < 14; j++) {
                const diff = data[base + j] / 10000 - transactionVector[j];
                dist += diff * diff;
            }

            if (dist < worstDist) {
                heapDist[worstSlot] = dist;
                heapLabel[worstSlot] = labels[i];

                worstDist = -Infinity;
                for (let k = 0; k < K; k++) {
                    if (heapDist[k] > worstDist) {
                        worstDist = heapDist[k];
                        worstSlot = k;
                    }
                }
            }
        }

        let fraudCount = 0;
        for (let i = 0; i < K; i++) {
            if (heapLabel[i] === 1) fraudCount++;
        }

        const fraud_score = fraudCount / K;
        const approved = fraud_score < FRAUD_THRESHOLD;

        return { fraud_score, approved };
    }
}