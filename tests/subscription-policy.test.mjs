import assert from "node:assert/strict";
import test from "node:test";
import { canActivateSubscriptionWithoutPayment } from "../lib/supabase/subscription-policy.mjs";

test("allows only a zero-priced subscription without payment", () => {
    assert.equal(canActivateSubscriptionWithoutPayment(0), true);
    assert.equal(canActivateSubscriptionWithoutPayment("0"), true);
    assert.equal(canActivateSubscriptionWithoutPayment(1), false);
    assert.equal(canActivateSubscriptionWithoutPayment("1200"), false);
    assert.equal(canActivateSubscriptionWithoutPayment(-1), false);
    assert.equal(canActivateSubscriptionWithoutPayment("1.5"), false);
    assert.equal(canActivateSubscriptionWithoutPayment("not-a-price"), false);
});
