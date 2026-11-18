/**
 * Keyboard contract for the theater.
 * Enter and Space start or replay only when the canvas or the replay
 * button is focused. Other controls keep their own keys.
 */

export const THEATER_KEY_IDS = Object.freeze(["field", "replay"]);

export function keyboardActivatesTheater(targetId, key) {
  if (key !== "Enter" && key !== " " && key !== "Spacebar") return false;
  return THEATER_KEY_IDS.indexOf(targetId) !== -1;
}

export function playbackStatusText(state) {
  if (state === "playing") return "playing";
  if (state === "done") return "done";
  return "";
}
