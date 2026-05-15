function normalize(num) {
    if (num < 0)
        return 0;
    if (num > 1)
        return 1;
    return num;
}
function normalizeDateTimeUTC(isoString) {
    const date = new Date(isoString);
    const hour = date.getUTCHours() / 23;
    const weekday = ((date.getUTCDay() + 6) % 7) / 6;
    return { hour, weekday };
}
export function toVector(transaction, vector, norm, mccRisk) {
    const { transaction: tx, customer, merchant, terminal, last_transaction } = transaction;
    const { hour, weekday } = normalizeDateTimeUTC(tx.requested_at);
    vector[0] = normalize(tx.amount / norm.max_amount);
    vector[1] = normalize(tx.installments / norm.max_installments);
    vector[2] = normalize((tx.amount / customer.avg_amount) / norm.amount_vs_avg_ratio);
    vector[3] = hour;
    vector[4] = weekday;
    if (last_transaction === null) {
        vector[5] = -1;
        vector[6] = -1;
    }
    else {
        const diff = Date.parse(tx.requested_at) - Date.parse(last_transaction.timestamp);
        const minutes = diff / 60000;
        vector[5] = normalize(minutes / norm.max_minutes);
        vector[6] = normalize(last_transaction.km_from_current / norm.max_km);
    }
    vector[7] = normalize(terminal.km_from_home / norm.max_km);
    vector[8] = normalize(customer.tx_count_24h / norm.max_tx_count_24h);
    vector[9] = terminal.is_online ? 1 : 0;
    vector[10] = terminal.card_present ? 1 : 0;
    vector[11] = !customer.known_merchants.includes(merchant.id) ? 1 : 0;
    vector[12] = mccRisk[merchant.mcc] ?? 0.5;
    vector[13] = normalize(merchant.avg_amount / norm.max_merchant_avg_amount);
}
export const sharedQuery = new Float32Array(14);
