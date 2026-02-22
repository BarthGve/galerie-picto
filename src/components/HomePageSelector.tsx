import { lazy, Suspense, useState } from "react";
import type { GitHubUser } from "@/lib/github-auth";

const HomePageV1 = lazy(() =>
  import("./HomePageV1").then((m) => ({ default: m.HomePageV1 })),
);
const HomePageV2 = lazy(() =>
  import("./HomePageV2").then((m) => ({ default: m.HomePageV2 })),
);
const HomePageV3 = lazy(() =>
  import("./HomePageV3").then((m) => ({ default: m.HomePageV3 })),
);
const HomePageV4 = lazy(() =>
  import("./HomePageV4").then((m) => ({ default: m.HomePageV4 })),
);

interface Props {
  onEnterGallery: () => void;
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

const VERSIONS = [
  { id: "v1", label: "V1 — Editorial Magazine", color: "#6a6af4" },
  { id: "v2", label: "V2 — Minimalist Apple", color: "#000091" },
  { id: "v3", label: "V3 — Bento Grid", color: "#009081" },
  { id: "v4", label: "V4 — Immersive Scroll", color: "#c83f49" },
] as const;

export function HomePageSelector(props: Props) {
  const [version, setVersion] = useState<string>("v1");

  return (
    <div className="relative">
      {/* Floating version picker */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-3 py-2 rounded-2xl bg-foreground/90 backdrop-blur-xl shadow-2xl border border-white/10">
        <span className="text-xs font-bold text-background/60 uppercase tracking-wider px-2">
          Version
        </span>
        {VERSIONS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVersion(v.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              version === v.id
                ? "text-white shadow-lg scale-105"
                : "text-background/60 hover:text-background/90 hover:bg-white/10"
            }`}
            style={
              version === v.id
                ? { backgroundColor: v.color }
                : undefined
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Render selected version */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        {version === "v1" && <HomePageV1 {...props} />}
        {version === "v2" && <HomePageV2 {...props} />}
        {version === "v3" && <HomePageV3 {...props} />}
        {version === "v4" && <HomePageV4 {...props} />}
      </Suspense>
    </div>
  );
}
