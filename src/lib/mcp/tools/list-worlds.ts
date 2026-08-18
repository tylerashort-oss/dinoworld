import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_worlds",
  title: "List worlds",
  description: "List the worlds of Dino Quest with their theme, final boss and area count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { WORLDS } = await import("../../../game/worlds");
    const worlds = WORLDS.map((w) => ({
      id: w.id,
      name: w.name,
      emoji: w.emoji,
      blurb: w.blurb,
      finalBoss: w.finalBoss,
      areaCount: w.areas.length,
      areas: w.areas.map((a) => a.id),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(worlds, null, 2) }],
      structuredContent: { worlds },
    };
  },
});
