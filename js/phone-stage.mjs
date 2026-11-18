/**
 * Narrow-stage split for the Aesop theater.
 * iPhone SE widths (320 and 375) keep the morph in a hero canvas and the
 * captions in a bottom dock, so the caption band cannot cover the morph peak.
 */

/** CSS px. First-generation SE is 320; SE 2/3 are 375. */
export const PHONE_STAGE_MAX_WIDTH = 375;

/** Bottom fraction reserved for captions. Matches the dream-flash lower pad. */
export const PHONE_CAPTION_DOCK = 0.28;

export function isPhoneStageWidth(width) {
  const w = Number(width);
  return Number.isFinite(w) && w > 0 && w <= PHONE_STAGE_MAX_WIDTH;
}

/**
 * Hero bitmap size for a viewport. On phone widths the caption dock is a
 * bottom band and the hero is everything above it, so captions and the morph
 * do not share pixels.
 */
export function heroStageSize(width, height) {
  const w = Math.max(0, Number(width) || 0);
  const h = Math.max(0, Number(height) || 0);
  const phone = isPhoneStageWidth(w);
  const captionDock = phone ? Math.round(h * PHONE_CAPTION_DOCK) : 0;
  const hero = Math.max(1, h - captionDock);
  return {
    phone,
    width: w,
    height: phone ? hero : Math.max(1, h),
    captionDock,
  };
}
