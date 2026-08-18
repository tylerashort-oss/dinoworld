import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_area",
  title: "Get area details",
  description:
    "Get the layout and enemy waves of one Dino Quest area (level), by world id and area id or index.",
  inputSchema: {
    worldId: z.number().int().describe("World id: 1 Volcanic Lands, 2 Ice World, 3 Poison Jungle."),
    area: z.string().describe("Area id (e.g. 'lava_fields') or 1-based index as a string."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ worldId, area }) => {
    const { WORLDS } = await import("../../../game/worlds");
    const world = WORLDS.find((w) => w.id === worldId);
    if (!world) throw new ToolError(`No world with id ${worldId}.`);
    const index = Number(area);
    const def = Number.isFinite(index)
      ? world.areas[index - 1]
      : world.areas.find((a) => a.id === area);
    if (!def) throw new ToolError(`No area '${area}' in world ${worldId}.`);
    const enemies: Record<string, number> = {};
    for (const wave of def.waves)
      for (const s of wave) enemies[s.type] = (enemies[s.type] ?? 0) + 1;
    const detail = {
      world: world.name,
      id: def.id,
      name: def.name,
      subtitle: def.subtitle,
      theme: def.theme ?? "fire",
      size: { w: def.w, h: def.h },
      checkpoint: Boolean(def.checkpoint),
      hazardPools: def.lava.length,
      rocks: def.rocks.length,
      bones: def.bones.length,
      waves: def.waves.length,
      enemies,
      hasChest: Boolean(def.chest),
      hiddenCave: def.cave?.cardId ?? null,
      eruptionSeconds: def.eruptions,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      structuredContent: detail,
    };
  },
});
