import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_collection",
  title: "List collection",
  description:
    "List Dino Quest collectibles: playable characters, weapons, pets or collector cards with their stats.",
  inputSchema: {
    kind: z
      .enum(["characters", "weapons", "pets", "cards"])
      .describe("Which part of the collection to list."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind }) => {
    let c;
    try {
      c = await import("../../../game/content");
    } catch {
      throw new ToolError("Collection data is unavailable.");
    }
    const strip = <T extends { art?: string }>(v: T) => {
      const { art: _art, ...rest } = v;
      return rest;
    };
    const data =
      kind === "characters"
        ? Object.values(c.CHARACTERS).map(strip)
        : kind === "weapons"
          ? Object.values(c.WEAPONS)
          : kind === "pets"
            ? Object.values(c.PETS).map(strip)
            : Object.values(c.CARDS).map(strip);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { kind, items: data },
    };
  },
});
