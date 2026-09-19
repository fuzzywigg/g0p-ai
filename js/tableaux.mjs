/**
 * Shared tableau templates. Geryon the crab is stamped into every phase;
 * fable imagery (wall copy, badges, encore title) is the only unique paint.
 */

const COLS = 63;
const ROWS = 16;

function blank() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => " "));
}

function stamp(grid, lines, row, col) {
  for (let r = 0; r < lines.length; r++) {
    const line = lines[r];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === " ") continue;
      const rr = row + r;
      const cc = col + c;
      if (rr >= 0 && rr < grid.length && cc >= 0 && cc < grid[rr].length) {
        grid[rr][cc] = ch;
      }
    }
  }
}

function hline(ch, n) {
  return String(ch).repeat(Math.max(0, n));
}

function center(text, width) {
  const t = String(text);
  if (t.length >= width) return t.slice(0, width);
  const left = Math.floor((width - t.length) / 2);
  return " ".repeat(left) + t + " ".repeat(width - left - t.length);
}

function render(grid) {
  return grid
    .map((row) => row.join("").replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

/** Loki crab sprites. Pose changes claws/eyes; body stays a crab. */
export function crabSprite(pose) {
  const eyes = pose === "uneasy" ? "o" : "O";
  switch (pose) {
    case "bow":
      return [
        "      \\/\\/      ",
        "    ##########   ",
        "   ##  " + eyes + "    " + eyes + "  ##  ",
        "    ##########   ",
        "     ## ## ##    ",
      ];
    case "racer":
      return [
        "   \\/  \\/     ______",
        "  ########## /      ",
        " ## " + eyes + " ## " + eyes + " ##======",
        "  ########## O====O>",
        "   ## ## ##         ",
      ];
    case "snap":
      return [
        "    ##     ##   ",
        "   #### > < ####",
        "  ##############",
        " ## " + eyes + " ## " + eyes + " ## ",
        "  ##############",
        "   ## ## ## ##  ",
      ];
    case "pray":
      return [
        "      \\/\\/      ",
        "      /\\/\\      ",
        "    ##########   ",
        "   ##  " + eyes + "    " + eyes + "  ##  ",
        "    ##########   ",
        "     ## ## ##    ",
      ];
    case "enter":
      return [
        " \\/     \\/ ",
        "############",
        "## " + eyes + " ## " + eyes + " ##",
        "############",
        " ## ## ## ##",
      ];
    case "uneasy":
      return [
        " ####              ",
        "########     \\/    ",
        "####  ##########   ",
        "  #### " + eyes + " ## " + eyes + " ##  ",
        "    ##########     ",
        "     ## ## ##      ",
      ];
    case "scar":
      return [
        " \\/            ####",
        " /\\          ########",
        "######      ####  ####",
        "########  ##########  ",
        "## " + eyes + " ## " + eyes + " ##     ",
        "  ##########         ",
        "   ## ## ##          ",
      ];
    case "inspect":
    case "proud":
    default:
      return [
        " ####           \\/   \\/           ####",
        "########         /\\   /\\         ########",
        "####  ####     #############     ####  ####",
        "  ####        ## " + eyes + " ## " + eyes + " ##        ####",
        "    ###################################",
        "     ##  ##  ##           ##  ##  ##",
      ];
  }
}

function wallBlock(copy) {
  const label = center(String(copy || "").slice(0, 14), 14);
  return [
    "##################",
    "##              ##",
    "##" + label + "##",
    "##              ##",
    "##################",
  ];
}

function audienceRow() {
  return [
    " \\/\\/   \\/\\/   \\/\\/       \\/\\/   \\/\\/   \\/\\/",
    " ####   ####   ####       ####   ####   ####",
    "##O##O##O##O##O##O##     ##O##O##O##O##O##O##",
    " ####   ####   ####       ####   ####   ####",
  ];
}

function poseFor(phase, imagery, frame) {
  if (phase.id === "turn") return frame ? imagery?.breakthrough?.pose || "snap" : imagery?.approach?.pose || "racer";
  if (phase.id === "encore") return frame ? "bow" : "enter";
  return imagery?.pose || "proud";
}

function paintSet(grid, imagery, pose, extras) {
  stamp(grid, ["0006"], 0, 29);
  stamp(grid, crabSprite(pose), extras.crabRow ?? 3, extras.crabCol ?? 12);
  if (imagery?.badge) stamp(grid, [String(imagery.badge)], extras.badgeRow ?? 8, extras.badgeCol ?? 28);
  if (imagery?.footer) stamp(grid, [center(imagery.footer, 40)], 14, 11);
}

export function composeTableau(phase, imagery, frame = 0) {
  const grid = blank();
  const pose = poseFor(phase, imagery, frame);
  const template = phase.template;

  switch (template) {
    case "spotlight":
      stamp(grid, ["0006"], 0, 29);
      stamp(grid, ["\\", " \\", "  \\___"], 1, 27);
      stamp(grid, crabSprite(pose), 5, 12);
      stamp(grid, ["#" + hline("#", 45) + "#"], 13, 8);
      if (imagery?.wall) stamp(grid, [String(imagery.wall)], 12, 24);
      if (imagery?.footer) stamp(grid, [center(imagery.footer, 40)], 14, 11);
      break;

    case "set":
      stamp(grid, ["#" + hline("#", 49) + "#"], 2, 6);
      stamp(grid, ["#" + hline(" ", 49) + "#"], 3, 6);
      paintSet(grid, imagery, pose, { crabRow: 4, crabCol: 12, badgeRow: 10, badgeCol: 29 });
      break;

    case "unease":
      stamp(grid, crabSprite(pose), 3, 2);
      stamp(grid, wallBlock(imagery?.badge || imagery?.wall || "??"), 4, 38);
      if (imagery?.footer) stamp(grid, [center(imagery.footer, 40)], 14, 11);
      stamp(grid, ["0006"], 0, 29);
      break;

    case "breakthrough": {
      stamp(grid, ["0006"], 0, 29);
      const shot = frame ? imagery?.breakthrough || {} : imagery?.approach || {};
      if (!frame) {
        stamp(grid, crabSprite(shot.pose || "racer"), 4, 1);
        stamp(grid, [">>>", ">>>", ">>>"], 6, 28);
        stamp(grid, wallBlock(shot.wall || imagery?.wall || "IMAGE"), 4, 40);
        stamp(grid, [center(shot.footer || "THE TURN", 40)], 14, 11);
      } else {
        stamp(grid, [
          "########  ##  ########",
          "####     \\/      ####",
          "##   BREAK THROUGH  ##",
          "####     /\\      ####",
          "########  ##  ########",
        ], 1, 2);
        stamp(grid, crabSprite(shot.pose || "snap"), 6, 8);
        stamp(grid, wallBlock(shot.wall || "TRUE"), 4, 42);
        stamp(grid, [center(shot.footer || "THE TURN", 40)], 14, 11);
      }
      break;
    }

    case "scar":
      stamp(grid, ["0006"], 0, 29);
      stamp(grid, crabSprite(pose), 3, 8);
      if (imagery?.badge) stamp(grid, ["[" + imagery.badge + "]"], 4, 42);
      if (imagery?.footer) stamp(grid, [center(imagery.footer, 40)], 14, 11);
      stamp(grid, ["#" + hline("#", 41) + "#"], 12, 10);
      break;

    case "lesson":
      stamp(grid, ["0006"], 0, 29);
      stamp(grid, ["#" + hline("#", 41) + "#"], 2, 10);
      stamp(grid, crabSprite(pose), 3, 20);
      stamp(grid, ["#" + hline("#", 41) + "#"], 11, 10);
      if (imagery?.badge) stamp(grid, [center(imagery.badge, 24)], 12, 19);
      if (imagery?.footer) stamp(grid, [center(imagery.footer, 40)], 14, 11);
      break;

    case "curtain": {
      stamp(grid, [hline("#", COLS)], 0, 0);
      stamp(grid, ["##" + center("CURTAIN", COLS - 4) + "##"], 1, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 2, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 3, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 4, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 5, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 6, 0);
      stamp(grid, ["##" + hline(" ", COLS - 4) + "##"], 7, 0);
      stamp(grid, [hline("#", COLS)], 8, 0);
      if (!frame) {
        stamp(grid, crabSprite("enter"), 3, 4);
        stamp(grid, [imagery?.title || "0006"], 3, 28);
      } else {
        stamp(grid, crabSprite("bow"), 3, 22);
        stamp(grid, [center(imagery?.footer || "BOW", 20)], 3, 40);
      }
      stamp(grid, audienceRow(), 10, 2);
      break;
    }

    default: {
      const _exhaustive = template;
      stamp(grid, crabSprite(pose), 4, 12);
      stamp(grid, [String(_exhaustive || "set")], 14, 2);
      break;
    }
  }

  return render(grid);
}

export function buildTableaux(fable, phases) {
  return phases.map((phase) => {
    const imagery = fable.imagery[phase.id] || {};
    const n = phase.frames || 1;
    const frames = [];
    for (let f = 0; f < n; f++) frames.push(composeTableau(phase, imagery, f));
    return {
      id: phase.id,
      phase: phase.id,
      title: phase.title,
      template: phase.template,
      pose: poseFor(phase, imagery, 0),
      frames,
      art: frames[0],
    };
  });
}

export function hashDensity(art) {
  return (String(art).match(/#/g) || []).length;
}
