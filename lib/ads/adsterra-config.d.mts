export type AdsterraUnit = {
    id: string;
    format: string;
    integration: "publisher-tag-installed" | "smartlink-click-only";
    rewardEligible: false;
};

export const ADSTERRA_UNITS: readonly AdsterraUnit[];

export type AdsterraConfigResult =
    | { enabled: true; smartlinkUrl: string; reason: null }
    | { enabled: false; smartlinkUrl: null; reason: string };

export function resolveAdsterraConfig(input?: {
    authenticated?: boolean;
    publisherSiteApproved?: boolean;
    smartlinkUrl?: string;
}): AdsterraConfigResult;
