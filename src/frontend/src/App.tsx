import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import type { Building, Road } from "./backend";
import CharacterCreation from "./pages/CharacterCreation";
import GameWorld from "./pages/GameWorld";
import LandingPage from "./pages/LandingPage";

export type AppPage = "landing" | "character" | "game";

export interface WorldData {
  locationName: string;
  buildings: Building[];
  roads: Road[];
  locationCategory?: "real" | "fictional";
}

export interface CharacterData {
  name: string;
  color: string;
}

export default function App() {
  const [page, setPage] = useState<AppPage>("landing");
  const [worldData, setWorldData] = useState<WorldData | null>(null);
  const [characterData, setCharacterData] = useState<CharacterData | null>(
    null,
  );

  const handleWorldCreated = (data: WorldData) => {
    setWorldData(data);
    setPage("character");
  };

  const handleCharacterReady = (char: CharacterData) => {
    setCharacterData(char);
    setPage("game");
  };

  const handleLeaveGame = () => {
    setCharacterData(null);
    setPage("landing");
  };

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      {page === "landing" && (
        <LandingPage onWorldCreated={handleWorldCreated} />
      )}
      {page === "character" && worldData && (
        <CharacterCreation
          worldData={worldData}
          onReady={handleCharacterReady}
          onBack={() => setPage("landing")}
        />
      )}
      {page === "game" && worldData && characterData && (
        <GameWorld
          worldData={worldData}
          characterData={characterData}
          onLeave={handleLeaveGame}
        />
      )}
    </>
  );
}
