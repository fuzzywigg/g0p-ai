/**
 * Thin public episode catalog. Hub-approved public bank only.
 * Episode 0005 is hard-excluded even if a caller marks it approved.
 * Provisional wave ids (p01…) are hub-approved; 0006 and 0010 keep numbered ids.
 */

export const EXCLUDED_EPISODE_ID = "0005";

export const HUB_APPROVED_PUBLIC_BANK = Object.freeze([
  Object.freeze({
    id: "0006",
    title: "The Ratchet That Never Turned",
    source: "https://www.fuzzywigg.ai/aesop/the-ratchet-that-never-turned",
    script: "episodes/0006-the-ratchet-that-never-turned.txt",
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p01",
    title: "The Key That Fits the Lock",
    source: "audio 1_4902307316973441769.mp3 (Google Drive id ['1jjdE0onHn8M-JGboEE5LjAw_uXKcj7_q', 3879332])",
    script: "episodes/p01-the-key-that-fits-the-lock.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p02",
    title: "The Call That Couldn't Write Yet",
    source: "audio 1_4902307316973441776.mp3 (Google Drive id ['1-b491PObhqecLyO9aETWAZukfb5bGsZn', 4415991])",
    script: "episodes/p02-the-call-that-couldn-t-write-yet.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p03",
    title: "The Key That Wasn't Supposed to Write",
    source: "audio 1_4904464313973999778.mp3 (Google Drive id ['1B2HHyzHLj0tfEZfqSQoPncANuDTWUeaO', 4850669])",
    script: "episodes/p03-the-key-that-wasn-t-supposed-to-write.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p04",
    title: "The Bandit That Learned Their Names",
    source: "audio 1_4906716113787684731.mp3 (Google Drive id ['1yBuNzJ18rW1QWg2Mja4vFWw1kbP8w-nJ', 5423482])",
    script: "episodes/p04-the-bandit-that-learned-their-names.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p07",
    title: "The GPU Whisper in the WSL Walls",
    source: "audio 1_4936480408947656718.mp3 (Google Drive id ['1Bj6x8C6edtRS5sniYdtEUZyxx0hYHdxk', 5559528])",
    script: "episodes/p07-the-gpu-whisper-in-the-wsl-walls.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "0010",
    title: "The Night We Tamed the Beast",
    source: "audio 1_4943166015170152595.mp3 (Google Drive id ['1hjURHL1fEE2KeBxOWPCgwAXby6QJK72A', 4365209])",
    script: "episodes/0010-the-night-we-tamed-the-beast.txt",
    provisional: false,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p09",
    title: "The Doctor's Order",
    source: "audio 1_4945051033366693981.mp3 (Google Drive id ['1z1PSVbLSxlsWsntsxRfPG9SF9nqE2UMV', 4992566])",
    script: "episodes/p09-the-doctor-s-order.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p10",
    title: "The Backup That Came Back",
    source: "audio 1_4952204838269098082.mp3 (Google Drive id ['1wEKumXiwhSznovLqn_gc__noWSS7x7gr', 5479906])",
    script: "episodes/p10-the-backup-that-came-back.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p14",
    title: "The Image Tides Echo",
    source: "audio 1_4963068872144980346.mp3 (Google Drive id ['1ZDC4PpGctGunFJ3c6lqV5NWJGfyGtM-x', 5015345])",
    script: "episodes/p14-the-image-tides-echo.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p16",
    title: "The Report That Didn't Come",
    source: "audio 1_4971975891287541928.mp3 (Google Drive id ['1H3Qq4m0zO99RhIFKyn2nM2U_wzHCG-CL', 5197575])",
    script: "episodes/p16-the-report-that-didn-t-come.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p17",
    title: "PR Source Failure Signature Changed",
    source: "audio 1_4974227691101227151.mp3 (Google Drive id ['1U5Y_NeGIpE_n7DDiv_xXggHEic96Cdk5', 4738029])",
    script: "episodes/p17-pr-source-failure-signature-changed.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  }),
  Object.freeze({
    id: "p19",
    title: "The Three Quiet Alarms",
    source: "audio 1_4986007283155601546.mp3 (Google Drive id ['1bViwtoVPFlveKF6vuh4WYVSeR4LJiNKD', 6711841])",
    script: "episodes/p19-the-three-quiet-alarms.txt",
    provisional: true,
    hubApproved: true,
    public: true,
  })
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
