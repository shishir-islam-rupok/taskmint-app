export type WithdrawalRequestInput = {
    amount: number | string;
    method: string;
    details: string;
    idempotencyKey: string;
};

export type WithdrawalRequestValidation =
    | { valid: true; amount: number; method: "bank_transfer" | "mobile_wallet"; details: string; idempotencyKey: string }
    | { valid: false; reason: string };

export function validateWithdrawalRequest(input: WithdrawalRequestInput): WithdrawalRequestValidation;
