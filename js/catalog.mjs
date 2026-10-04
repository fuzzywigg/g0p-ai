/**
 * Thin public episode catalog. Hub-approved public bank only.
 * Episode 0005 is hard-excluded even if a caller marks it approved.
 */

export const EXCLUDED_EPISODE_ID = "0005";

export const HUB_APPROVED_PUBLIC_BANK = Object.freeze([
  Object.freeze({
    id: "0006",
    title: "The Ratchet That Never Turned",
    source: "https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned",
    hubApproved: true,
    public: true,
  }),
]);

export function normalizeEpisodeId(id) {
  const raw = String(id ?? "").trim();
  if (!raw) return "";
  const digits = raw.replace(/^#/, "").match(/(\d{3,5})/);
  if (digits) return digits[1].padStart(4, "0").slice(-4);
  return raw;
}

export function isHardExcludedEpisode(id) {
  return normalizeEpisodeId(id) === EXCLUDED_EPISODE_ID;
}

export function listHubApprovedPublicEpisodes(bank = HUB_APPROVED_PUBLIC_BANK) {
  const entries = Array.isArray(bank) ? bank : [];
  return entries.filter((ep) => {
    if (!ep || ep.hubApproved !== true || ep.public !== true) return false;
    if (isHardExcludedEpisode(ep.id)) return false;
    return true;
  });
}
