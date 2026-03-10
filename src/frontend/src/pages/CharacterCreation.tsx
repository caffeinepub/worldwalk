import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Gamepad2, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { CharacterData, WorldData } from "../App";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const COLOR_SWATCHES = [
  { label: "Cyan", value: "#00d4ff", hex: "#00d4ff" },
  { label: "Red", value: "#ff4444", hex: "#ff4444" },
  { label: "Green", value: "#44ff88", hex: "#44ff88" },
  { label: "Purple", value: "#aa44ff", hex: "#aa44ff" },
  { label: "Orange", value: "#ff8844", hex: "#ff8844" },
  { label: "Pink", value: "#ff44aa", hex: "#ff44aa" },
];

interface Props {
  worldData: WorldData;
  onReady: (char: CharacterData) => void;
  onBack: () => void;
}

export default function CharacterCreation({
  worldData,
  onReady,
  onBack,
}: Props) {
  const { actor } = useActor();
  const { identity, login, isLoggingIn, loginStatus } = useInternetIdentity();
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0].value);
  const [joining, setJoining] = useState(false);

  const handleEnterWorld = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter your character name");
      return;
    }
    if (!actor) {
      toast.error("Not connected yet, please wait");
      return;
    }

    setJoining(true);
    try {
      // Get principal - use identity principal or anonymous
      const principal = identity?.getPrincipal();
      if (!principal) {
        throw new Error("Please log in first to join the world");
      }

      const character = {
        principal,
        name: trimmedName,
        color: selectedColor,
      };

      const startPos = { x: 0, y: 1.7, z: 0 };
      await actor.joinWorld(character, startPos, 0);

      toast.success(`Welcome, ${trimmedName}!`);
      onReady({ name: trimmedName, color: selectedColor });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join world");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 70% 50%, oklch(0.12 0.04 220 / 0.5) 0%, oklch(0.07 0.02 260 / 0) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
              style={{ color: "oklch(0.52 0.04 255)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex-1">
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: "oklch(0.74 0.2 195)" }}
              >
                Entering world
              </p>
              <h2 className="text-lg font-bold">{worldData.locationName}</h2>
            </div>
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1 text-xs"
              style={{
                background: "oklch(0.74 0.2 195 / 0.1)",
                border: "1px solid oklch(0.74 0.2 195 / 0.2)",
                color: "oklch(0.74 0.2 195)",
              }}
            >
              <Gamepad2 className="h-3 w-3" />
              {worldData.buildings.length} buildings · {worldData.roads.length}{" "}
              roads
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: character preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex flex-col items-center justify-center rounded-2xl p-8"
              style={{
                background: "oklch(0.11 0.025 255)",
                border: "1px solid oklch(0.2 0.04 255)",
              }}
            >
              <p
                className="mb-6 text-xs uppercase tracking-widest"
                style={{ color: "oklch(0.52 0.04 255)" }}
              >
                Character Preview
              </p>

              {/* Character visual - stylized capsule */}
              <div className="relative flex flex-col items-center">
                {/* Head */}
                <div
                  className="h-14 w-14 rounded-full transition-all duration-300"
                  style={{
                    background: selectedColor,
                    boxShadow: `0 0 30px ${selectedColor}88, 0 0 60px ${selectedColor}44`,
                  }}
                />
                {/* Body */}
                <div
                  className="mt-1 w-10 rounded-b-full transition-all duration-300"
                  style={{
                    height: "56px",
                    background: `linear-gradient(to bottom, ${selectedColor}cc, ${selectedColor}66)`,
                    boxShadow: `0 0 20px ${selectedColor}44`,
                  }}
                />
                {/* Name label */}
                {name && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      background: "oklch(0.07 0.02 260 / 0.9)",
                      border: `1px solid ${selectedColor}66`,
                      color: selectedColor,
                    }}
                  >
                    {name}
                  </motion.div>
                )}
              </div>

              {/* Shadow on ground */}
              <div
                className="mt-3 h-2 w-16 rounded-full opacity-40"
                style={{ background: selectedColor, filter: "blur(4px)" }}
              />
            </motion.div>

            {/* Right: character config */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex flex-col gap-5 rounded-2xl p-8"
              style={{
                background: "oklch(0.11 0.025 255)",
                border: "1px solid oklch(0.2 0.04 255)",
              }}
            >
              <div>
                <h3 className="text-xl font-bold">Create Your Character</h3>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "oklch(0.52 0.04 255)" }}
                >
                  Choose a name and color to represent you in the world.
                </p>
              </div>

              {/* Login prompt */}
              {loginStatus !== "initializing" && !identity && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: "oklch(0.74 0.2 195 / 0.08)",
                    border: "1px solid oklch(0.74 0.2 195 / 0.3)",
                  }}
                >
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.74 0.2 195)" }}
                  >
                    Log in to save your identity across sessions.
                  </p>
                  <Button
                    onClick={login}
                    disabled={isLoggingIn}
                    size="sm"
                    className="mt-2 gap-2"
                    variant="outline"
                    style={{
                      borderColor: "oklch(0.74 0.2 195 / 0.4)",
                      color: "oklch(0.74 0.2 195)",
                    }}
                  >
                    {isLoggingIn ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    Log In
                  </Button>
                </div>
              )}

              {/* Name input */}
              <div className="space-y-2">
                <Label
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "oklch(0.52 0.04 255)" }}
                >
                  Character Name
                </Label>
                <Input
                  data-ocid="char.name_input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={20}
                  style={{
                    background: "oklch(0.15 0.03 255)",
                    border: "1px solid oklch(0.2 0.04 255)",
                    color: "oklch(0.94 0.008 260)",
                  }}
                />
              </div>

              {/* Color selection */}
              <div className="space-y-3">
                <Label
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "oklch(0.52 0.04 255)" }}
                >
                  Color
                </Label>
                <div
                  className="flex gap-3 flex-wrap"
                  data-ocid="char.color_select"
                >
                  {COLOR_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.value}
                      type="button"
                      title={swatch.label}
                      onClick={() => setSelectedColor(swatch.value)}
                      className="relative h-9 w-9 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: swatch.hex,
                        boxShadow:
                          selectedColor === swatch.value
                            ? `0 0 0 2px oklch(0.07 0.02 260), 0 0 0 4px ${swatch.hex}, 0 0 15px ${swatch.hex}88`
                            : `0 0 10px ${swatch.hex}44`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <Button
                data-ocid="char.submit_button"
                onClick={handleEnterWorld}
                disabled={
                  joining ||
                  !name.trim() ||
                  (loginStatus !== "initializing" && !identity)
                }
                className="mt-auto gap-2 font-bold py-6 text-base"
                style={{
                  background: joining
                    ? "oklch(0.74 0.2 195 / 0.4)"
                    : "oklch(0.74 0.2 195)",
                  color: "oklch(0.07 0.02 260)",
                  border: "none",
                }}
              >
                {joining ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Entering World...
                  </>
                ) : (
                  <>
                    <Gamepad2 className="h-5 w-5" />
                    Enter World
                  </>
                )}
              </Button>

              {loginStatus !== "initializing" && !identity && (
                <p
                  className="text-xs text-center"
                  style={{ color: "oklch(0.52 0.04 255)" }}
                >
                  You must log in to enter the world
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
