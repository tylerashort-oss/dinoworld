import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { defaultSave, hasSave, loadSave, persistSave, type SaveData } from "@/game/save";
import { GameScreen } from "@/components/game/GameScreen";
import { CharacterSelect, Collection, DinoCamp, MainMenu, SettingsScreen, WorldMap } from "@/components/game/Menus";
import { initAudio, setSoundEnabled } from "@/game/audio";

const TITLE = "Dino Quest — Volcanic Lands";
const DESC =
  "Play Dino Quest: a touch-first dinosaur dungeon crawler. Battle fire raptors, collect bones, pets and cards, and defeat Firesauras inside the volcano.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  ssr: false,
});

type Screen = "menu" | "select" | "map" | "camp" | "collection" | "settings" | "play";

function Index() {
  const [save, setSaveState] = useState<SaveData>(() => defaultSave());
  const [screen, setScreen] = useState<Screen>("menu");
  const [existing, setExisting] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const s = loadSave();
    setSaveState(s);
    setExisting(hasSave() && s.started);
    setSoundEnabled(s.sound);
  }, []);

  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const setSave = useCallback((fn: (s: SaveData) => SaveData) => {
    setSaveState((prev) => {
      const next = fn(prev);
      persistSave(next);
      return next;
    });
  }, []);

  const startNew = () => {
    const fresh = defaultSave();
    setSaveState(fresh);
    persistSave(fresh);
    setScreen("select");
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">Dino Quest — World 1: Volcanic Lands</h1>

      {screen === "menu" && (
        <MainMenu
          hasExisting={existing}
          onNew={startNew}
          onContinue={() => {
            initAudio();
            setScreen("map");
          }}
        />
      )}

      {screen === "select" && (
        <CharacterSelect
          onBack={() => setScreen("menu")}
          onPick={(id) => {
            initAudio();
            setSave((s) => ({ ...s, character: id, started: true }));
            setExisting(true);
            setScreen("play");
          }}
        />
      )}

      {screen === "map" && (
        <WorldMap
          save={save}
          setSave={setSave}
          onPlay={(worldId, areaIndex) => {
            initAudio();
            setSave((s) => ({
              ...s,
              started: true,
              world: worldId,
              // No explicit level picked → always resume at the furthest level reached,
              // never at whatever level was last replayed.
              areaIndex: areaIndex ?? (s.progress?.[String(worldId)] ?? 0),
            }));
            setScreen("play");
          }}
          onCamp={() => setScreen("camp")}
          onCollection={() => setScreen("collection")}
          onSettings={() => setScreen("settings")}
          onMenu={() => setScreen("menu")}
        />
      )}

      {screen === "camp" && (
        <DinoCamp save={save} setSave={setSave} onBack={() => setScreen("map")} onCollection={() => setScreen("collection")} />
      )}

      {screen === "collection" && (
        <Collection save={save} setSave={setSave} onBack={() => setScreen("map")} />
      )}

      {screen === "settings" && <SettingsScreen save={save} setSave={setSave} onBack={() => setScreen("map")} />}

      {screen === "play" && <GameScreen save={save} setSave={setSave} onQuit={(t) => setScreen(t)} />}

      {portrait && (
        <div className="volcanic-bg absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-6xl">🔄</div>
          <p className="text-2xl font-black text-primary">Please turn your iPad sideways to play Dino Quest.</p>
          <p className="text-sm text-muted-foreground">Landscape mode gives you room for the joystick and buttons.</p>
        </div>
      )}
    </main>
  );
}
