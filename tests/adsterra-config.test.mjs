import assert from "node:assert/strict";
import test from "node:test";
import { ADSTERRA_UNITS, resolveAdsterraConfig } from "../lib/ads/adsterra-config.mjs";

const approvedConfig = {
    authenticated: true,
    publisherSiteApproved: true,
    smartlinkUrl: "https://publisher-smartlink.example/path?publisher=test",
};

test("does not enable the offer for unauthenticated visitors", () => {
    const result = resolveAdsterraConfig({ ...approvedConfig, authenticated: false });
    assert.equal(result.enabled, false);
    assert.match(result.reason, /sign in/i);
});

test("does not enable the offer until the publisher site is approved", () => {
    const result = resolveAdsterraConfig({ ...approvedConfig, publisherSiteApproved: false });
    assert.equal(result.enabled, false);
    assert.match(result.reason, /approved/i);
});

test("requires an account-provided Smartlink URL", () => {
    const result = resolveAdsterraConfig({ ...approvedConfig, smartlinkUrl: "" });
    assert.equal(result.enabled, false);
    assert.match(result.reason, /Smartlink URL/i);
});

test("rejects non-HTTPS and credential-bearing URLs", () => {
    assert.equal(resolveAdsterraConfig({ ...approvedConfig, smartlinkUrl: "http://ads.example/link" }).enabled, false);
    assert.equal(resolveAdsterraConfig({ ...approvedConfig, smartlinkUrl: "https://user:pass@ads.example/link" }).enabled, false);
    assert.equal(resolveAdsterraConfig({ ...approvedConfig, smartlinkUrl: "javascript:alert(1)" }).enabled, false);
});

test("accepts an HTTPS Smartlink only for an authenticated user on an approved site", () => {
    const result = resolveAdsterraConfig(approvedConfig);
    assert.equal(result.enabled, true);
    assert.equal(result.smartlinkUrl, approvedConfig.smartlinkUrl);
});

test("lists the supplied Adsterra placements without making any ad rewardable", () => {
    assert.equal(ADSTERRA_UNITS.length, 10);
    assert.ok(ADSTERRA_UNITS.every((unit) => unit.rewardEligible === false));
    assert.equal(ADSTERRA_UNITS.find((unit) => unit.id === "96771d31781cc5c793b53fcf9039883f")?.format, "Banner 728x90");
    assert.equal(ADSTERRA_UNITS.find((unit) => unit.id === "e66f50293ab0fc019aa1d1cf818a44ab")?.integration, "smartlink-click-only");
    assert.equal(ADSTERRA_UNITS.find((unit) => unit.id === "smartlink")?.integration, "smartlink-click-only");
});
