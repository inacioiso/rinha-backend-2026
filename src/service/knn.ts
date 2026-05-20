import { TransactionResponse } from "../types/transaction-type.js";

const K = 5;

class VPNode {
  vantagem: number;
  raio: number;
  dentro: VPNode | null;
  fora: VPNode | null;

  constructor(vantagem: number, raio: number, dentro: VPNode | null,  fora: VPNode | null){
    this.vantagem = vantagem;
    this.raio = raio;
    this.dentro = dentro;
    this.fora = fora;
  }
}

function calcDist(data: Int16Array, idxA: number, idxB: number): number {
  
  let sum = 0;
  
  for(let i=0; i < 14; i++){
      const a = data[idxA*14 + i];
      const b = data[idxB*14 + i];

      sum += (a-b)*(a-b);
  }

  return sum;
}

function distQueryToIdx(query: Float32Array, data: Int16Array, idx: number): number {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const a = query[i];                    
    const b = data[14 * idx + i] / 10000;

    sum += (a-b)*(a-b);
  }
  return sum;
}

function build(indices: number[], data: Int16Array): VPNode | null {
  if (indices.length === 0) return null;
  if (indices.length === 1) return new VPNode(indices[0], 0, null, null);

  const vantagem = indices[0];
  const resto = indices.slice(1);

  const distancias = resto.map(idx  => ({
    idx,
    dist: calcDist(data, vantagem, idx)
  }));

  distancias.sort((a, b) => a.dist - b.dist);

  const mid = Math.floor(distancias.length / 2);
  const raio = distancias[mid].dist;

  const indicesDentro = distancias.slice(0, mid).map((d) => d.idx);

  const indicesFora = distancias.slice(mid).map((d) => d.idx);

  return new VPNode(
    vantagem, 
    raio, 
    build(indicesDentro, data),
    build(indicesFora, data));

}

function search(no: VPNode | null, query: Float32Array, data: Int16Array, labels: Uint8Array, neighbors: Array<{ dist: number, label: number }>): void {
  
  if(no == null) return;

  const dist = distQueryToIdx(query, data, no.vantagem);


  if(neighbors.length < K){
    neighbors.push({ dist, label: labels[no.vantagem] });
  } else {
    let worstIdx = 0;
    for (let i = 1; i < K; i++) {
      if (neighbors[i].dist > neighbors[worstIdx].dist) {
        worstIdx = i;
      }
    }
    if (dist < neighbors[worstIdx].dist) {
      neighbors[worstIdx] = { dist, label: labels[no.vantagem] };
    }
  }

  const worstDist = neighbors.length < K ? Infinity : Math.max(...neighbors.map(d => d.dist));

  if (dist <= no.raio) {
    search(no.dentro, query, data, labels, neighbors);
    if (no.raio - dist < worstDist) {
      search(no.fora, query, data, labels, neighbors);
  }
} else {
    search(no.fora, query, data, labels, neighbors);
    if (dist - no.raio < worstDist) {
      search(no.dentro, query, data, labels, neighbors);
  }
}
}

function query(raiz: VPNode | null, transaction: Float32Array, data: Int16Array, labels: Uint8Array): TransactionResponse {

  const neighbors: Array<{ dist: number, label: number }> = [];

  search(raiz, transaction, data, labels, neighbors);

  const fraudCount = neighbors.reduce((count, neighbor) => count + (neighbor.label === 1 ? 1 : 0), 0);

  const fraud_score = fraudCount / K;

  const approved = fraud_score < 0.6;

  return { fraud_score, approved };
}

export class KnnIndex {
  private readonly raiz: VPNode | null;
  private readonly data: Int16Array;
  private readonly labels: Uint8Array;

  constructor(data: Int16Array, labels: Uint8Array) {
    this.data = data;
    this.labels = labels;
    
    const n = labels.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    this.raiz = build(indices, data);
  }

  query(transaction: Float32Array): TransactionResponse {
    return query(this.raiz, transaction, this.data, this.labels);
  }
}