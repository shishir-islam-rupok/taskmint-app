const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateWithdrawalRequest(input) {
    const amount = typeof input.amount === "number" ? input.amount : Number(input.amount);
    const method = typeof input.method === "string" ? input.method : "";
    const details = typeof input.details === "string" ? input.details.trim() : "";
    const idempotencyKey = typeof input.idempotencyKey === "string" ? input.idempotencyKey : "";

    if (!Number.isSafeInteger(amount) || amount < 100 || amount > 100000000) {
        return { valid: false, reason: "Enter a whole BDT amount between 100 and 100,000,000." };
    }
    if (!['bKash', 'Nagad', 'Rocket', 'Bank transfer'].includes(method)) {
        return { valid: false, reason: "Choose a supported payout method." };
    }
    if (details.length < 6 || details.length > 120 || /[\u0000-\u001f\u007f]/.test(details)) {
        return { valid: false, reason: "Enter valid payout account details (6 to 120 characters)." };
    }
    if (!uuidPattern.test(idempotencyKey)) {
        return { valid: false, reason: "Refresh the page and submit the request again." };
    }

    return { valid: true, amount, method, details, idempotencyKey };
}
