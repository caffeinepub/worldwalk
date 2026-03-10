import { Html, Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useRef } from "react";
import * as THREE from "three";
import type { Building, Road } from "../../backend";

interface PlayerState {
  pos: { x: number; y: number; z: number };
  yaw: number;
  character: { name: string; color: string };
}

interface Props {
  buildings: Building[];
  roads: Road[];
  otherPlayers: PlayerState[];
  posRef: MutableRefObject<{ x: number; y: number; z: number }>;
  yawRef: MutableRefObject<number>;
  onPositionUpdate: (
    pos: { x: number; y: number; z: number },
    yaw: number,
  ) => void;
}

function hashNum(n: number) {
  return Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
}

function BuildingMesh({ building }: { building: Building }) {
  const h = building.size.y;
  const colorSeed = hashNum(building.position.x + building.position.z);
  const lightness = 0.75 + colorSeed * 0.15;
  const color = new THREE.Color().setStyle(
    `oklch(${lightness} 0.02 ${220 + colorSeed * 40})`,
  );
  // Fallback to a beige-ish color
  const meshColor = color.isColor ? color : new THREE.Color(0.88, 0.86, 0.82);
  return (
    <mesh
      position={[building.position.x, h / 2, building.position.z]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[building.size.x, h, building.size.z]} />
      <meshLambertMaterial color={meshColor} />
    </mesh>
  );
}

function RoadLine({ road }: { road: Road }) {
  if (road.path.length < 2) return null;
  const points = road.path.map((p) => new THREE.Vector3(p.x, 0.08, p.z));
  return <Line points={points} color="#4a4a5a" lineWidth={3} />;
}

function OtherPlayer({ player }: { player: PlayerState }) {
  const color = player.character.color || "#00d4ff";
  return (
    <group
      position={[player.pos.x, 0, player.pos.z]}
      rotation={[0, player.yaw, 0]}
    >
      {/* Body */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 12]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Name label */}
      <Html position={[0, 2.3, 0]} center distanceFactor={12}>
        <div
          style={{
            background: "rgba(7, 5, 20, 0.85)",
            border: `1px solid ${color}66`,
            color: color,
            padding: "2px 8px",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {player.character.name}
        </div>
      </Html>
    </group>
  );
}

function FirstPersonCamera({
  buildings,
  posRef,
  yawRef,
  onPositionUpdate,
}: {
  buildings: Building[];
  posRef: MutableRefObject<{ x: number; y: number; z: number }>;
  yawRef: MutableRefObject<number>;
  onPositionUpdate: (
    pos: { x: number; y: number; z: number },
    yaw: number,
  ) => void;
}) {
  const { camera } = useThree();
  const pitchRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      // Prevent scrolling with WASD/arrows in game
      if (
        ["KeyW", "KeyS", "KeyA", "KeyD", "ArrowUp", "ArrowDown"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement == null) return;
      yawRef.current -= e.movementX * 0.002;
      pitchRef.current -= e.movementY * 0.002;
      pitchRef.current = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, pitchRef.current),
      );
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => document.removeEventListener("mousemove", onMouseMove);
  }, [yawRef]);

  useFrame((_, delta) => {
    const speed = 6 * delta;
    const keys = keysRef.current;
    const yaw = yawRef.current;

    let dx = 0;
    let dz = 0;

    if (keys.has("KeyW") || keys.has("ArrowUp")) {
      dx -= Math.sin(yaw) * speed;
      dz -= Math.cos(yaw) * speed;
    }
    if (keys.has("KeyS") || keys.has("ArrowDown")) {
      dx += Math.sin(yaw) * speed;
      dz += Math.cos(yaw) * speed;
    }
    if (keys.has("KeyA")) {
      dx -= Math.cos(yaw) * speed;
      dz += Math.sin(yaw) * speed;
    }
    if (keys.has("KeyD")) {
      dx += Math.cos(yaw) * speed;
      dz -= Math.sin(yaw) * speed;
    }

    if (dx !== 0 || dz !== 0) {
      const px = posRef.current.x;
      const pz = posRef.current.z;
      const newX = px + dx;
      const newZ = pz + dz;

      let canMoveX = true;
      let canMoveZ = true;
      const playerR = 0.5;

      for (const b of buildings) {
        const hwX = b.size.x / 2 + playerR;
        const hwZ = b.size.z / 2 + playerR;
        if (
          Math.abs(newX - b.position.x) < hwX &&
          Math.abs(pz - b.position.z) < hwZ
        ) {
          canMoveX = false;
        }
        if (
          Math.abs(px - b.position.x) < hwX &&
          Math.abs(newZ - b.position.z) < hwZ
        ) {
          canMoveZ = false;
        }
      }

      if (canMoveX) posRef.current.x = newX;
      if (canMoveZ) posRef.current.z = newZ;
    }

    // Update camera
    camera.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    // Notify every ~100ms
    const now = Date.now();
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      onPositionUpdate({ ...posRef.current }, yawRef.current);
    }
  });

  return null;
}

export default function GameScene({
  buildings,
  roads,
  otherPlayers,
  posRef,
  yawRef,
  onPositionUpdate,
}: Props) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-30, 60, -30]}
        intensity={0.4}
        color="#aaccff"
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshLambertMaterial color="#3a4a35" />
      </mesh>

      {/* Sidewalk grid - subtle lines */}
      <gridHelper args={[2000, 200, "#2a3a2a", "#2a3a2a"]} />

      {/* Roads */}
      {roads.map((road) => (
        <RoadLine key={road.id.toString()} road={road} />
      ))}

      {/* Buildings */}
      {buildings.map((building, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable index for buildings
        <BuildingMesh key={i} building={building} />
      ))}

      {/* Other players */}
      {otherPlayers.map((player, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: stable index
        <OtherPlayer key={i} player={player} />
      ))}

      {/* First person controls */}
      <FirstPersonCamera
        buildings={buildings}
        posRef={posRef}
        yawRef={yawRef}
        onPositionUpdate={onPositionUpdate}
      />
    </>
  );
}
