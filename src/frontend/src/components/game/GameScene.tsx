import { Html, Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Building, Road } from "../../backend";
import type { LocationTheme } from "../../utils/osmFetch";

const DEFAULT_THEME: LocationTheme = {
  skyColor: "#7a9ab0",
  fogColor: "#8a9aa8",
  fogNear: 100,
  fogFar: 500,
  ambientColor: "#dddddd",
  ambientIntensity: 0.6,
  sunColor: "#ffffff",
  sunIntensity: 1.2,
  groundColor: "#555555",
  buildingPalette: ["#666666", "#777777", "#555555", "#888888", "#606060"],
  roadColor: "#333333",
  region: "default",
};

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
  theme?: LocationTheme;
  buildingPolygons?: Array<{ x: number; z: number }[]>;
}

function BuildingMesh({
  building,
  index,
  polygon,
  palette,
}: {
  building: Building;
  index: number;
  polygon?: { x: number; z: number }[];
  palette: string[];
}) {
  const h = building.size.y;
  const color = palette[index % palette.length];
  const roughness = h > 15 ? 0.2 : h > 8 ? 0.6 : 0.85;
  const metalness = h > 15 ? 0.1 : 0.0;

  const geometry = useMemo(() => {
    if (polygon && polygon.length >= 3) {
      const shape = new THREE.Shape();
      shape.moveTo(polygon[0].x, polygon[0].z);
      for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i].x, polygon[i].z);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: h,
        bevelEnabled: false,
      });
      return geo;
    }
    return new THREE.BoxGeometry(building.size.x, h, building.size.z);
  }, [polygon, h, building.size.x, building.size.z]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
        metalness,
      }),
    [color, roughness, metalness],
  );

  if (polygon && polygon.length >= 3) {
    return (
      <mesh
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      />
    );
  }

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[building.position.x, h / 2, building.position.z]}
      castShadow
      receiveShadow
    />
  );
}

function RoadLine({ road, color }: { road: Road; color: string }) {
  if (road.path.length < 2) return null;
  const points = road.path.map((p) => new THREE.Vector3(p.x, 0.08, p.z));
  return <Line points={points} color={color} lineWidth={4} />;
}

function OtherPlayer({ player }: { player: PlayerState }) {
  const color = player.character.color || "#00d4ff";
  return (
    <group
      position={[player.pos.x, 0, player.pos.z]}
      rotation={[0, player.yaw, 0]}
    >
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 12]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshLambertMaterial color={color} />
      </mesh>
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

    camera.position.set(posRef.current.x, posRef.current.y, posRef.current.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    const now = Date.now();
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      onPositionUpdate({ ...posRef.current }, yawRef.current);
    }
  });

  return null;
}

function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.0} />
    </mesh>
  );
}

export default function GameScene({
  buildings,
  roads,
  otherPlayers,
  posRef,
  yawRef,
  onPositionUpdate,
  theme,
  buildingPolygons = [],
}: Props) {
  const t = theme ?? DEFAULT_THEME;

  return (
    <>
      <fog attach="fog" args={[t.fogColor, t.fogNear, t.fogFar]} />

      <ambientLight color={t.ambientColor} intensity={t.ambientIntensity} />
      <directionalLight
        position={[80, 120, 60]}
        color={t.sunColor}
        intensity={t.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-30, 60, -30]}
        intensity={t.ambientIntensity * 0.4}
        color={t.ambientColor}
      />

      <Ground color={t.groundColor} />

      {roads.map((road) => (
        <RoadLine key={road.id.toString()} road={road} color={t.roadColor} />
      ))}

      {buildings.map((building, i) => {
        const bkey = `b_${building.position.x.toFixed(2)}_${building.position.z.toFixed(2)}_${i}`;
        return (
          <BuildingMesh
            key={bkey}
            building={building}
            index={i}
            polygon={buildingPolygons[i]}
            palette={t.buildingPalette}
          />
        );
      })}

      {otherPlayers.map((player) => (
        <OtherPlayer
          key={`${player.character.name}_${player.pos.x}`}
          player={player}
        />
      ))}

      <FirstPersonCamera
        buildings={buildings}
        posRef={posRef}
        yawRef={yawRef}
        onPositionUpdate={onPositionUpdate}
      />
    </>
  );
}
