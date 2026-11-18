/**
 * Durable share path for the canonical approved episode.
 * The link is a Vercel alias. It does not point at the apex.
 */

export const APPROVED_EPISODE_ID = "0006";
export const APPROVED_EPISODE_TITLE = "The Ratchet That Never Turned";
export const APPROVED_SHARE_URL = "https://g0p-ai.vercel.app/";

export function sharePayload() {
  return {
    title: APPROVED_EPISODE_TITLE,
    text: APPROVED_EPISODE_TITLE,
    url: APPROVED_SHARE_URL,
  };
}

/** Web Share when the browser offers it; otherwise copy the stable URL. */
export function shareAction(capabilities) {
  const canShare = Boolean(capabilities && capabilities.canShare);
  return canShare ? "share" : "copy";
}
