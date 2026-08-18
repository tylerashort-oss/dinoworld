import { defineMcp, type AnyToolDefinition } from "@lovable.dev/mcp-js";
import listWorlds from "./tools/list-worlds";
import getArea from "./tools/get-area";
import listCollection from "./tools/list-collection";
import listBoneForge from "./tools/list-bone-forge";

export default defineMcp({
  name: "dino-quest-saga",
  title: "Dino Quest Saga",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Dino Quest browser game. Use `list_worlds` for the world list, `get_area` for a level's layout and enemy waves, `list_collection` for characters, weapons, pets and cards, and `list_bone_forge` for the bone upgrade shop.",
  tools: [listWorlds, getArea, listCollection, listBoneForge] as AnyToolDefinition[],
});
