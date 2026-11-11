import { describe, expect, it } from "vitest";
import { youtubeId } from "@/lib/youtube";

describe("youtubeId", () => {
  it.each([
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    [" dQw4w9WgXcQ ", "dQw4w9WgXcQ"],
  ])("lê %s", (link, id) => expect(youtubeId(link)).toBe(id));

  it.each(["", "https://vimeo.com/123", "https://youtube.com/watch?v=curto", "https://evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)"])(
    "recusa %s",
    (link) => expect(youtubeId(link)).toBeNull(),
  );
});
