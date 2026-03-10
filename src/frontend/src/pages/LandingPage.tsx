import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Compass,
  Globe,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { WorldData } from "../App";
import { useActor } from "../hooks/useActor";
import { generateFictionalWorld } from "../utils/fictionalWorldGen";
import { fetchOsmData } from "../utils/osmFetch";

interface Props {
  onWorldCreated: (data: WorldData) => void;
}

const REAL_EXAMPLES = [
  "Times Square, New York",
  "Eiffel Tower, Paris",
  "Shibuya, Tokyo",
  "Big Ben, London",
];

const FICTIONAL_EXAMPLES = [
  "Konoha, Naruto",
  "Hyrule Castle Town",
  "Midgar, FF7",
  "Kamurocho, Yakuza",
  "Shiganshina, AoT",
  "Pallet Town, Pokémon",
];

const FICTIONAL_CHIPS = [
  "Konoha",
  "Hyrule Castle Town",
  "Midgar",
  "Kamurocho",
  "Shiganshina",
  "Pallet Town",
  "Kakariko Village",
  "Soul Society",
  "Fairy Tail Guild",
  "Hogwarts",
];

export default function LandingPage({ onWorldCreated }: Props) {
  const { actor } = useActor();
  const [mode, setMode] = useState<"real" | "fictional">("real");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [placeholder, setPlaceholder] = useState(REAL_EXAMPLES[0]);

  const examples = mode === "real" ? REAL_EXAMPLES : FICTIONAL_EXAMPLES;

  useEffect(() => {
    let i = 0;
    setPlaceholder(examples[0]);
    const interval = setInterval(() => {
      i = (i + 1) % examples.length;
      setPlaceholder(examples[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, [examples]);

  const isFictional = mode === "fictional";

  // Primary color values based on mode
  const primaryL = isFictional ? "0.72 0.22 320" : "0.74 0.2 195";
  const primaryColor = `oklch(${primaryL})`;
  const primaryDim = `oklch(${primaryL} / 0.15)`;
  const primaryBorder = `oklch(${primaryL} / 0.4)`;
  const primaryGlow = `oklch(${primaryL} / 0.3)`;

  const handleExplore = async () => {
    const query = location.trim();
    if (!query) {
      toast.error("Enter a location to explore");
      return;
    }

    setLoading(true);
    try {
      if (isFictional) {
        setLoadingStep("Generating fictional world...");
        const result = generateFictionalWorld(query);
        // Still persist to backend if actor available
        if (actor) {
          try {
            await actor.createWorld(
              result.locationName,
              result.buildings,
              result.roads,
            );
          } catch {
            // non-fatal
          }
        }
        toast.success(`World created: ${result.locationName}`);
        onWorldCreated({ ...result, locationCategory: "fictional" });
      } else {
        if (!actor) {
          toast.error("Still connecting... please wait");
          return;
        }
        setLoadingStep("Geocoding location...");
        const osmData = await fetchOsmData(query);
        setLoadingStep("Building your world...");
        await actor.createWorld(
          osmData.locationName,
          osmData.buildings,
          osmData.roads,
        );
        toast.success(`World created: ${osmData.locationName}`);
        onWorldCreated({ ...osmData, locationCategory: "real" });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load location",
      );
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleExplore();
  };

  const realBadges = [
    { icon: MapPin, label: "Real Locations" },
    { icon: Users, label: "Multiplayer" },
    { icon: Compass, label: "First Person" },
  ];

  const fictionalBadges = [
    { icon: Sparkles, label: "Anime Worlds" },
    { icon: Globe, label: "Game Locations" },
    { icon: Compass, label: "First Person" },
  ];

  const badges = isFictional ? fictionalBadges : realBadges;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-50" />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isFictional
            ? "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.12 0.04 300 / 0.8) 0%, oklch(0.07 0.02 260 / 0) 100%)"
            : "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(0.12 0.04 220 / 0.8) 0%, oklch(0.07 0.02 260 / 0) 100%)",
          transition: "background 0.5s ease",
        }}
      />

      {/* Animated corner accents */}
      <div
        className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 transition-colors duration-500"
        style={{ borderColor: primaryBorder }}
      />
      <div
        className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 transition-colors duration-500"
        style={{ borderColor: primaryBorder }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 transition-colors duration-500"
        style={{ borderColor: primaryBorder }}
      />
      <div
        className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 transition-colors duration-500"
        style={{ borderColor: primaryBorder }}
      />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo / Globe icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500"
            style={{
              background: primaryDim,
              boxShadow: `0 0 40px ${primaryGlow}, inset 0 0 20px ${primaryDim}`,
              border: `1px solid ${primaryBorder}`,
            }}
          >
            {isFictional ? (
              <Sparkles className="h-10 w-10" style={{ color: primaryColor }} />
            ) : (
              <Globe className="h-10 w-10" style={{ color: primaryColor }} />
            )}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mb-4 text-center"
        >
          <h1
            className="text-6xl font-black tracking-tight glow-cyan md:text-8xl"
            style={{ color: "oklch(0.94 0.008 260)" }}
          >
            WORLD
            <span
              style={{ color: primaryColor, transition: "color 0.5s ease" }}
            >
              WALK
            </span>
          </h1>
          <p
            className="mt-3 text-base font-medium tracking-widest uppercase"
            style={{ color: "oklch(0.52 0.04 255)" }}
          >
            {isFictional
              ? "Explore anime & game worlds — together"
              : "Explore any place — together"}
          </p>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 flex gap-4 flex-wrap justify-center"
        >
          {badges.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-500"
              style={{
                background: primaryDim,
                border: `1px solid oklch(${primaryL} / 0.2)`,
                color: primaryColor,
              }}
            >
              <Icon className="h-3 w-3" />
              {label}
            </div>
          ))}
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="mb-5"
        >
          <div
            className="flex rounded-full p-1"
            style={{
              background: "oklch(0.14 0.03 255 / 0.9)",
              border: "1px solid oklch(0.2 0.04 255 / 0.6)",
            }}
          >
            <button
              type="button"
              data-ocid="landing.real_tab"
              onClick={() => {
                setMode("real");
                setLocation("");
              }}
              disabled={loading}
              className="rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300"
              style={{
                background:
                  mode === "real" ? "oklch(0.74 0.2 195 / 0.9)" : "transparent",
                color:
                  mode === "real"
                    ? "oklch(0.07 0.02 260)"
                    : "oklch(0.52 0.04 255)",
                boxShadow:
                  mode === "real"
                    ? "0 0 16px oklch(0.74 0.2 195 / 0.4)"
                    : "none",
              }}
            >
              🌍 Real World
            </button>
            <button
              type="button"
              data-ocid="landing.fictional_tab"
              onClick={() => {
                setMode("fictional");
                setLocation("");
              }}
              disabled={loading}
              className="rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-300"
              style={{
                background:
                  mode === "fictional"
                    ? "oklch(0.72 0.22 320 / 0.9)"
                    : "transparent",
                color:
                  mode === "fictional"
                    ? "oklch(0.07 0.02 260)"
                    : "oklch(0.52 0.04 255)",
                boxShadow:
                  mode === "fictional"
                    ? "0 0 16px oklch(0.72 0.22 320 / 0.4)"
                    : "none",
              }}
            >
              ✦ Anime / Game
            </button>
          </div>
        </motion.div>

        {/* Search box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div
            className="overflow-hidden rounded-xl p-[1px] transition-all duration-500"
            style={{
              background: isFictional
                ? "linear-gradient(135deg, oklch(0.72 0.22 320 / 0.5), oklch(0.65 0.25 300 / 0.3))"
                : "linear-gradient(135deg, oklch(0.74 0.2 195 / 0.5), oklch(0.65 0.22 165 / 0.3))",
            }}
          >
            <div
              className="rounded-xl p-4"
              style={{ background: "oklch(0.11 0.025 255 / 0.95)" }}
            >
              <div className="flex gap-3 flex-col sm:flex-row">
                <Input
                  data-ocid="landing.input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={loading}
                  className="flex-1 border-0 bg-transparent text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ color: "oklch(0.94 0.008 260)" }}
                />
                <Button
                  data-ocid="landing.primary_button"
                  onClick={handleExplore}
                  disabled={loading || !location.trim()}
                  className="shrink-0 gap-2 font-bold transition-all duration-500"
                  style={{
                    background: loading
                      ? `${primaryColor.replace(")", " / 0.4)")}`
                      : primaryColor,
                    color: "oklch(0.07 0.02 260)",
                    border: "none",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    <>
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {loadingStep && (
                <p
                  className="mt-3 text-xs text-center"
                  style={{ color: primaryColor }}
                >
                  <span className="inline-block pulse-glow">{loadingStep}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick chips */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {(isFictional ? FICTIONAL_CHIPS : REAL_EXAMPLES).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setLocation(ex)}
                disabled={loading}
                className="rounded-full px-3 py-1 text-xs transition-all hover:scale-105"
                style={{
                  background: "oklch(0.18 0.025 255 / 0.8)",
                  border: "1px solid oklch(0.2 0.04 255)",
                  color: "oklch(0.52 0.04 255)",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="absolute bottom-6 text-center text-xs"
          style={{ color: "oklch(0.35 0.03 255)" }}
        >
          &copy; {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              window.location.hostname,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            caffeine.ai
          </a>
        </motion.footer>
      </div>
    </div>
  );
}
