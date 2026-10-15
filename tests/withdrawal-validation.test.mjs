import assert from "node:assert/strict";
import test from "node:test";
import { validateWithdrawalRequest } from "../lib/finance/withdrawal-validation.mjs";

const valid = {
    amount: "100",
    method: "bKash",
    details: "0123456789",
    idempotencyKey: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
};

test("accepts a whole BDT withdrawal request with a supported payout method", () => {
    assert.equal(validateWithdrawalRequest(valid).valid, true);
});

test("rejects under-minimum, fractional, over-limit, unsafe, or malformed amounts", () => {
    for (const amount of ["99", "500.5", "100000001", "Infinity", "9007199254740992", "not-a-number"]) {
        assert.equal(validateWithdrawalRequest({ ...valid, amount }).valid, false);
    }
});

test("rejects unsupported methods, empty details, and invalid idempotency keys", () => {
    assert.equal(validateWithdrawalRequest({ ...valid, method: "cash" }).valid, false);
    assert.equal(validateWithdrawalRequest({ ...valid, details: "x" }).valid, false);
    assert.equal(validateWithdrawalRequest({ ...valid, details: "123456\n789" }).valid, false);
    assert.equal(validateWithdrawalRequest({ ...valid, idempotencyKey: "not-a-uuid" }).valid, false);
});
