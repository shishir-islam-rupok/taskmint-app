/** @typedef {{ id: string, format: string, integration: 'publisher-tag-installed' | 'smartlink-click-only', rewardEligible: false }} AdsterraUnit */

/** @type {readonly AdsterraUnit[]} */
export const ADSTERRA_UNITS = Object.freeze([
    { id: "96771d31781cc5c793b53fcf9039883f", format: "Banner 728x90", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "e5416cf203af6091a4fc5a7b79ddb487", format: "Display ad script", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "c65b80033da7f426f5dc669389b721d7", format: "Native banner", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "e66f50293ab0fc019aa1d1cf818a44ab", format: "Direct-link offer", integration: "smartlink-click-only", rewardEligible: false },
    { id: "e7b0913c722796b0e4db2075f8790661", format: "Banner 160x600", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "47b942527bfc4640535938686f705abf", format: "Banner 300x250", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "fd78d367dedf6971672434512d62ed32", format: "Banner 468x60", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "abd86844ce9bb0ecac2125e6e7ecc5c8", format: "Banner 160x300", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "77bde3b98f87c3b3fde0f9e71e883e99", format: "Banner 320x50", integration: "publisher-tag-installed", rewardEligible: false },
    { id: "smartlink", format: "Sponsored offer Smartlink (configured separately)", integration: "smartlink-click-only", rewardEligible: false },
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
