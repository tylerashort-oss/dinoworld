import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "list_bone_forge",
  title: "List Bone Forge upgrades",
  description:
    "List the Bone Forge upgrades players buy with bones, including the cost of every level.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { UPGRADES, upgradeCost, EXTRA_LIFE_COST, CARD_PACK_COST } = await import(
      "../../../game/content"
    );
    const upgrades = UPGRADES.map((u) => ({
      ...u,
      costPerLevel: Array.from({ length: u.max }, (_, i) => upgradeCost(u, i)),
    }));
    const payload = {
      upgrades,
      extraLifeCost: EXTRA_LIFE_COST,
      cardPackCost: CARD_PACK_COST,
      note: "Pink Explorer gets a 25% shop discount and finds 50% more bones.",
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
