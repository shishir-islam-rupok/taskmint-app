export function canActivateSubscriptionWithoutPayment(priceMinor) {
    const price = typeof priceMinor === "number" ? priceMinor : Number(priceMinor);
    return Number.isSafeInteger(price) && price === 0;
}
