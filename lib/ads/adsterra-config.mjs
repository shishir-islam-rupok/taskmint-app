/** @typedef {{ id: string, format: string, integration: 'publisher-tag-required' | 'smartlink-click-only' | 'disabled', rewardEligible: false }} AdsterraUnit */

/** @type {readonly AdsterraUnit[]} */
export const ADSTERRA_UNITS = Object.freeze([
    { id: "6124233", format: "Banner 728x90 (reported approved)", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739189", format: "Popunder", integration: "disabled", rewardEligible: false },
    { id: "31739171", format: "Native Banner", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739172", format: "Social Bar", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739173", format: "Smartlink", integration: "smartlink-click-only", rewardEligible: false },
    { id: "31739190", format: "Banner 160x600", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739191", format: "Banner 300x250", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739192", format: "Banner 468x60", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739193", format: "Banner 160x300", integration: "publisher-tag-required", rewardEligible: false },
    { id: "31739194", format: "Banner 320x50", integration: "publisher-tag-required", rewardEligible: false },
]);

/**
 * @param {{ authenticated?: boolean, publisherSiteApproved?: boolean, smartlinkUrl?: string }} input
 * @returns {{ enabled: true, smartlinkUrl: string, reason: null } | { enabled: false, smartlinkUrl: null, reason: string }}
 */
export function resolveAdsterraConfig(input = {}) {
    if (!input.authenticated) {
        return { enabled: false, smartlinkUrl: null, reason: "Sign in to view sponsored offers." };
    }
    if (!input.publisherSiteApproved) {
        return { enabled: false, smartlinkUrl: null, reason: "The TaskMint publisher site must be approved in Adsterra before ads are enabled." };
    }
    if (!input.smartlinkUrl?.trim()) {
        return { enabled: false, smartlinkUrl: null, reason: "Add the active Smartlink URL copied from your Adsterra Publisher account." };
    }

    try {
        const url = new URL(input.smartlinkUrl);
        if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
            return { enabled: false, smartlinkUrl: null, reason: "The Smartlink must be a valid HTTPS URL copied from Adsterra." };
        }
        return { enabled: true, smartlinkUrl: url.toString(), reason: null };
    } catch {
        return { enabled: false, smartlinkUrl: null, reason: "The configured Adsterra Smartlink URL is invalid." };
    }
}
