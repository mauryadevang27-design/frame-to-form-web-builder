import { describe, expect, it } from "vitest";
import {
  buildInviteLink,
  formatRoomCode,
  generateRoomCode,
  isValidRoomCode,
  parseRoomInput,
} from "./room-code";
import { formatTimestamp, parseYouTubeVideoId } from "./youtube";

describe("room codes", () => {
  it("generates 6-character codes that pass validation", () => {
    for (let i = 0; i < 50; i++) expect(isValidRoomCode(generateRoomCode())).toBe(true);
  });

  it("accepts typed codes with lowercase, dashes or spaces", () => {
    expect(parseRoomInput("k7m-4qx")).toEqual({ ok: true, code: "K7M4QX", fromLink: false });
    expect(parseRoomInput(" K7M 4QX ")).toEqual({ ok: true, code: "K7M4QX", fromLink: false });
  });

  it("extracts the code from an invitation link", () => {
    expect(parseRoomInput(buildInviteLink("K7M4QX"))).toEqual({
      ok: true,
      code: "K7M4QX",
      fromLink: true,
    });
    expect(parseRoomInput("togethertube.app/join/prn8tv")).toEqual({
      ok: true,
      code: "PRN8TV",
      fromLink: true,
    });
  });

  it("rejects empty, wrong-length and look-alike characters", () => {
    expect(parseRoomInput("   ")).toEqual({ ok: false, reason: "empty" });
    expect(parseRoomInput("K7M4Q")).toEqual({ ok: false, reason: "invalid" });
    expect(parseRoomInput("K0M4QX")).toEqual({ ok: false, reason: "invalid" });
  });

  it("formats codes as XXX-XXX", () => {
    expect(formatRoomCode("K7M4QX")).toBe("K7M-4QX");
  });
});

describe("youtube links", () => {
  it("reads the video id from common URL shapes", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=10")).toBe(
      "aqz-KE-bpKQ",
    );
    expect(parseYouTubeVideoId("youtu.be/aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ");
    expect(parseYouTubeVideoId("https://youtube.com/shorts/aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ");
  });

  it("rejects non-YouTube links", () => {
    expect(parseYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
    expect(parseYouTubeVideoId("not a link")).toBeNull();
  });

  it("formats timestamps", () => {
    expect(formatTimestamp(75)).toBe("1:15");
    expect(formatTimestamp(3725)).toBe("1:02:05");
  });
});
