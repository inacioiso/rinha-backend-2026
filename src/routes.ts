import { FastifyInstance } from "fastify";
import { TransactionRequest, TransactionResponse } from "./types/transaction-type";
import { DataBundle } from "./service/loader";
import { sharedQuery, toVector } from "./service/vectorize";

export async function Routes(
    app: FastifyInstance,
    { index, norm, mcc }: DataBundle,
): Promise<void> {
    
    app.get("/ready", async (_, reply) => {
        return reply.status(200).send();
    })

    app.post<{ Body: TransactionRequest; Reply: TransactionResponse }>
    ("/fraud-score", async (req, reply) => {

        try {
            toVector(req.body, sharedQuery, norm, mcc);
            const result = index.query(sharedQuery);

            return reply.send({ fraud_score: result.fraud_score, approved: result.approved });
        } catch (error) {
            return reply.send({ approved: true, fraud_score: 0.0 });
        }
        
    })

}