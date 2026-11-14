/** Room codes: 6 characters from an alphabet without look-alikes (no 0/O, 1/I/L). */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
export const INVITE_BASE_URL = "https://togethertube.app/join/";

const CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

export function generateRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/** "K7M4QX" -> "K7M-4QX" */
export function formatRoomCode(code: string): string {
  if (code.length !== ROOM_CODE_LENGTH) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export function buildInviteLink(code: string): string {
  return `${INVITE_BASE_URL}${code}`;
}

export type RoomInputResult =
  { ok: true; code: string; fromLink: boolean } | { ok: false; reason: "empty" | "invalid" };

/**
 * Accepts a typed code ("k7m-4qx", "K7M 4QX") or a pasted invitation link
 * ("https://togethertube.app/join/K7M4QX" or "...?room=K7M4QX").
 */
export function parseRoomInput(raw: string): RoomInputResult {
  const input = raw.trim();
  if (!input) return { ok: false, reason: "empty" };

  let candidate = input;
  let fromLink = false;
  if (/^https?:\/\//i.test(input) || input.toLowerCase().startsWith("togethertube.app")) {
    fromLink = true;
    try {
      const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
      const fromPath = url.pathname.match(/\/join\/([^/]+)/i)?.[1];
      candidate = fromPath ?? url.searchParams.get("room") ?? "";
    } catch {
      return { ok: false, reason: "invalid" };
    }
  }

  const code = candidate.toUpperCase().replace(/[\s-]/g, "");
  if (!isValidRoomCode(code)) return { ok: false, reason: "invalid" };
  return { ok: true, code, fromLink };
}
