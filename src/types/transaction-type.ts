export interface TransactionRequest {
    id: string, 
    transaction: {
        amount: number,
        installments: number,
        requested_at: string,
    },
    customer: {
        avg_amount: number,
        tx_count_24h: number,
        known_merchants: string[],
    },
    merchant: {
        id: string,
        mcc: string,
        avg_amount: number,
    },
    terminal: {
        is_online: boolean,
        card_present: boolean,
        km_from_home: number,
    },
    last_transaction: null | LastTransaction

}

export interface TransactionResponse {
    fraud_score: number,
    approved: boolean,
}

interface LastTransaction {
    timestamp: string,
    km_from_current: number
}

export interface NormalizationConstants {
  max_amount: number;
  max_installments: number;
  amount_vs_avg_ratio: number;
  max_minutes: number;
  max_km: number;
  max_tx_count_24h: number;
  max_merchant_avg_amount: number;
}

export type MccRiskMap = Record<string, number>;