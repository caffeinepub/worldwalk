import { Button } from "@/components/ui/button";
import { Canvas } from "@react-three/fiber";
import { Info, LogOut, MapPin, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CharacterData, WorldData } from "../App";
import GameScene from "../components/game/GameScene";
import { useActor } from "../hooks/useActor";

interface PlayerState {
  pos: { x: number; y: number; z: number };
  yaw: number;
  character: { name: string; color: string };
}

interface Props {
  worldData: WorldData;
  characterData: CharacterData;
  onLeave: () => void;
}

export default function GameWorld({
  worldData,
  characterData,
  onLeave,
}: Props) {
  const { actor } = useActor();
  const [isLocked, setIsLocked] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState<PlayerState[]>([]);
  const [playerCount, setPlayerCount] = useState(0);

  const posRef = useRef({ x: 0, y: 1.7, z: 0 });
  const yawRef = useRef(0);
  const latestPosRef = useRef({ x: 0, y: 1.7, z: 0 });
  const latestYawRef = useRef(0);

  const isFictional = worldData.locationCategory === "fictional";
  const skyColor = worldData.theme?.skyColor ?? "#87CEEB";

  const handlePositionUpdate = useCallback(
    (pos: { x: number; y: number; z: number }, yaw: number) => {
      latestPosRef.current = pos;
      latestYawRef.current = yaw;
    },
    [],
  );

  useEffect(() => {
    const onLockChange = () => {
      setIsLocked(document.pointerLockElement !== null);
    };
    document.addEventListener("pointerlockchange", onLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", onLockChange);
  }, []);

  useEffect(() => {
    if (!actor) return;

    const pollPlayers = async () => {
      try {
        const players = await actor.getPlayers();
        const others: PlayerState[] = [];
        let count = 0;
        for (const [pos, yaw, char] of players) {
          count++;
          if (
            char.name === characterData.name &&
            char.color === characterData.color
          )
            continue;
          others.push({
            pos: { x: pos.x, y: pos.y, z: pos.z },
            yaw,
            character: { name: char.name, color: char.color },
          });
        }
        setOtherPlayers(others);
        setPlayerCount(count);
      } catch {
        // silent fail
      }
    };

    pollPlayers();
    const interval = setInterval(pollPlayers, 500);
    return () => clearInterval(interval);
  }, [actor, characterData.name, characterData.color]);

  useEffect(() => {
    if (!actor) return;
    const interval = setInterval(async () => {
      try {
        await actor.updatePosition(latestPosRef.current, latestYawRef.current);
      } catch {
        // silent fail
      }
    }, 100);
    return () => clearInterval(interval);
  }, [actor]);

  const handleLeave = async () => {
    try {
      await actor?.leaveWorld();
    } catch {
      // ignore
    }
    toast.success("Left the world");
    onLeave();
  };

  const handleCanvasActivate = () => {
    const canvas = document.getElementById("game-canvas");
    if (canvas && document.pointerLockElement === null) {
      canvas.requestPointerLock();
    }
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleCanvasActivate();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 3D Canvas */}
      <div
        id="game-canvas"
        data-ocid="game.canvas_target"
        role="application"
        aria-label="3D game world"
        className="absolute inset-0"
        onClick={handleCanvasActivate}
        onKeyDown={handleCanvasKeyDown}
        style={{ cursor: isLocked ? "none" : "crosshair" }}
      >
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 2000 }}
          shadows
          style={{ background: skyColor }}
          gl={{ antialias: true }}
        >
          <GameScene
            buildings={worldData.buildings}
            roads={worldData.roads}
            otherPlayers={otherPlayers}
            posRef={posRef}
            yawRef={yawRef}
            onPositionUpdate={handlePositionUpdate}
            theme={worldData.theme}
            buildingPolygons={worldData.buildingPolygons ?? []}
          />
        </Canvas>
      </div>

      {/* Crosshair */}
      {isLocked && <div className="crosshair" />}

      {/* Top-left HUD */}
      <div
        className="absolute top-4 left-4 hud-panel flex flex-col gap-1 px-4 py-3"
        style={{ minWidth: 180 }}
      >
        <div className="flex items-center gap-2">
          <MapPin
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{
              color: isFictional
                ? "oklch(0.72 0.22 320)"
                : "oklch(0.74 0.2 195)",
            }}
          />
          <span
            className="text-xs font-bold truncate"
            style={{ maxWidth: 160 }}
          >
            {worldData.locationName}
          </span>
        </div>

        {/* Fictional badge */}
        {isFictional && (
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "oklch(0.72 0.22 320 / 0.15)",
                border: "1px solid oklch(0.72 0.22 320 / 0.4)",
                color: "oklch(0.72 0.22 320)",
              }}
            >
              ✦ Fictional
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Users
            className="h-3.5 w-3.5 flex-shrink-0"
            style={{
              color: isFictional
                ? "oklch(0.72 0.22 320)"
                : "oklch(0.74 0.2 195)",
            }}
          />
          <span className="text-xs" style={{ color: "oklch(0.52 0.04 255)" }}>
            {playerCount} player{playerCount !== 1 ? "s" : ""} online
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: characterData.color }}
          />
          <span className="text-xs font-semibold">{characterData.name}</span>
        </div>
      </div>

      {/* Top-right HUD: leave */}
      <div className="absolute top-4 right-4">
        <Button
          data-ocid="game.leave_button"
          onClick={handleLeave}
          size="sm"
          className="hud-panel gap-2 border-0 font-semibold"
          style={{
            background: "oklch(0.07 0.02 260 / 0.85)",
            color: "oklch(0.62 0.22 25)",
            backdropFilter: "blur(12px)",
          }}
        >
          <LogOut className="h-4 w-4" />
          Leave
        </Button>
      </div>

      {/* Click to play hint */}
      {!isLocked && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hud-panel px-5 py-3 text-center">
          <p
            className="text-sm font-semibold"
            style={{
              color: isFictional
                ? "oklch(0.72 0.22 320)"
                : "oklch(0.74 0.2 195)",
            }}
          >
            Click to look around
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "oklch(0.52 0.04 255)" }}
          >
            WASD to move · ESC to release mouse
          </p>
        </div>
      )}

      {/* Mini controls hint when locked */}
      {isLocked && (
        <div className="absolute bottom-4 right-4 hud-panel px-3 py-2">
          <div className="flex flex-col gap-0.5">
            {[
              ["W/S", "Move forward/back"],
              ["A/D", "Strafe"],
              ["ESC", "Release mouse"],
            ].map(([key, action]) => (
              <div key={key} className="flex items-center gap-2 text-xs">
                <kbd
                  className="rounded px-1.5 py-0.5 font-mono font-bold"
                  style={{
                    background: "oklch(0.2 0.04 255)",
                    color: isFictional
                      ? "oklch(0.72 0.22 320)"
                      : "oklch(0.74 0.2 195)",
                    fontSize: "10px",
                  }}
                >
                  {key}
                </kbd>
                <span style={{ color: "oklch(0.52 0.04 255)" }}>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buildings/paths count */}
      <div className="absolute bottom-4 left-4 hud-panel flex items-center gap-2 px-3 py-2">
        <Info
          className="h-3.5 w-3.5"
          style={{
            color: isFictional ? "oklch(0.72 0.22 320)" : "oklch(0.74 0.2 195)",
          }}
        />
        <span className="text-xs" style={{ color: "oklch(0.52 0.04 255)" }}>
          {worldData.buildings.length} buildings · {worldData.roads.length}{" "}
          {isFictional ? "paths" : "roads"}
        </span>
      </div>
    </div>
  );
}
