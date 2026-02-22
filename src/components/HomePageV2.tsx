import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Palette,
  LogOut,
  ArrowRight,
  Search,
  Github,
  Heart,
  UploadCloud,
  FolderOpen,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PictoMosaic } from "@/components/PictoMosaic";
import { DarkAwarePicto } from "@/components/DarkAwarePicto";
import { useDarkPrefetch } from "@/hooks/useDarkPrefetch";
import { usePictogramsCtx } from "@/contexts/PictogramsContext";
import { useGalleriesCtx } from "@/contexts/GalleriesContext";
import type { Pictogram } from "@/lib/types";
import type { GitHubUser } from "@/lib/github-auth";

declare const __APP_VERSION__: string;

interface HomePageProps {
  onEnterGallery: () => void;
  user: GitHubUser | null;
  onLogin: () => void;
  onLogout: () => void;
}

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const animated = useRef(false);

  const refCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !value || animated.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !animated.current) {
            animated.current = true;
            const start = performance.now();
            const animate = (now: number) => {
              const progress = Math.min((now - start) / 1500, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setDisplay(Math.floor(eased * value));
              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            observer.disconnect();
          }
        },
        { threshold: 0.3 },
      );

      observer.observe(node);
    },
    [value],
  );

  return (
    <span ref={refCallback}>
      {display}
      {suffix}
    </span>
  );
}

export function HomePageV2({
  onEnterGallery,
  user,
  onLogin,
  onLogout,
}: HomePageProps) {
  const { pictograms: allPictograms, loading } = usePictogramsCtx();
  const { galleries } = useGalleriesCtx();

  const pictos = useMemo(
    () => allPictograms.filter((p) => !p.filename.endsWith("_dark.svg")),
    [allPictograms],
  );
  const mosaicPictos = useMemo(() => pictos.slice(0, 40), [pictos]);
  const totalCount = useMemo(() => Math.floor(pictos.length / 10) * 10, [pictos]);
  const collections = galleries.length;

  // Shuffle une seule fois quand les pictos sont disponibles
  const [previewPictos, setPreviewPictos] = useState<Pictogram[]>([]);
  useEffect(() => {
    if (pictos.length > 0 && previewPictos.length === 0) {
      setPreviewPictos([...pictos].sort(() => Math.random() - 0.5).slice(0, 12));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pictos.length]);

  // Prefetch batch des SVGs dark pour les pictos d'aperçu de collection
  const previewUrls = useMemo(() => previewPictos.map((p) => p.url), [previewPictos]);
  useDarkPrefetch(previewUrls);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Background dot pattern */}
      <div
        className="fixed inset-0 -z-20 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated gradient blobs — decorative, kept as explicit gradients */}
      <div className="fixed top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-tr from-[#fddede] to-[#c83f49] rounded-full blur-3xl -z-10 opacity-30 dark:opacity-15 animate-blob" />
      <div className="fixed bottom-[-10%] left-[-5%] w-80 h-80 bg-gradient-to-tr from-[#e3e3fd] to-[#6a6af4] rounded-full blur-3xl -z-10 opacity-30 dark:opacity-15 animate-blob animation-delay-2000" />
      <div className="fixed top-[40%] left-[30%] w-64 h-64 bg-gradient-to-tr from-[#adadf9] to-[#2845c1] rounded-full blur-3xl -z-10 opacity-20 dark:opacity-10 animate-blob animation-delay-4000" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-xl bg-foreground shadow-lg">
              <Palette className="size-5 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter">
              La Boite à Pictos
            </span>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="rounded-full text-xs">
                  {(user.name || user.login).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {user.name || user.login}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 rounded bg-foreground text-background text-sm font-semibold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Github className="size-4" />
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* Hero — EXACTLY AS IN ORIGINAL */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-8 max-w-xl">
              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Vos pictogrammes,{" "}
                <br className="hidden sm:block" />
                <span className="inline-block pr-6">
                  <span style={{ color: 'var(--primary)' }}>prêts </span>
                  <span className="text-white" style={{ WebkitTextStroke: '1.5px rgba(0,0,0,0.5)' }}>à l'</span>
                  <span style={{ color: 'var(--destructive)' }}>emploi</span>
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                Une bibliothèque de pictogrammes SVG libres et personnalisables.
                Recherchez, personnalisez les couleurs et téléchargez en un clic.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <button
                  onClick={onEnterGallery}
                  className="px-8 py-4 rounded font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-(--primary-hover) active:bg-(--primary-active) text-primary-foreground"
                >
                  <span className="flex items-center gap-2">
                    Explorer la galerie
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {totalCount > 0 && (
                  <div className="text-sm font-semibold text-muted-foreground">
                    <span className="text-foreground">
                      <AnimatedCounter value={totalCount} suffix="+" />
                    </span>{" "}
                    pictos
                  </div>
                )}
              </div>

              {/* Stats */}
              {totalCount > 0 && (
                <div className="flex gap-8 pt-4 border-t border-border">
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      <AnimatedCounter value={collections} />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Collections
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      SVG/PNG
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Formats
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground">
                      Libre
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Licence
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mosaic */}
            <div className="hidden lg:block">
              <PictoMosaic pictograms={mosaicPictos} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1: Trouvez en un instant */}
      <section className="py-24 md:py-32 relative border-t border-border">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Trouvez en un instant
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Recherche intelligente par nom, tag ou galerie. Accédez exactement aux pictogrammes que vous cherchez.
          </p>

          {/* Feature visual — 6 pictos in a clean row */}
          {previewPictos.length > 0 && (
            <div className="mt-12 flex justify-center gap-3">
              {previewPictos.slice(0, 6).map((picto) => (
                <div
                  key={picto.id}
                  className="w-20 h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center p-3 transition-all hover:shadow-md hover:scale-110"
                >
                  <DarkAwarePicto
                    pictogram={picto}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature 2: Vos couleurs, votre style */}
      <section className="py-24 md:py-32 relative border-t border-border">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Vos couleurs, votre style
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Personnalisez chaque pictogramme en changant les couleurs en temps réel, puis exportez en SVG ou PNG.
          </p>

          {/* Feature visual — 6 pictos with subtle color variations */}
          {previewPictos.length > 0 && (
            <div className="mt-12 flex justify-center gap-3">
              {previewPictos.slice(6, 12).map((picto, idx) => {
                const colors = [
                  "opacity-100",
                  "opacity-90",
                  "opacity-80",
                  "opacity-100 hue-rotate-12",
                  "opacity-90 hue-rotate-24",
                  "opacity-80 hue-rotate-36",
                ];
                return (
                  <div
                    key={picto.id}
                    className={`w-20 h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center p-3 transition-all hover:shadow-md hover:scale-110 ${colors[idx]}`}
                  >
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Feature 3: Organisez sans effort */}
      <section className="py-24 md:py-32 relative border-t border-border">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Organisez sans effort
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Créez vos propres collections et groupez les pictogrammes par projet, thème ou campagne.
          </p>

          {/* Feature visual — 6 pictos in grouped look */}
          {previewPictos.length > 0 && (
            <div className="mt-12 flex justify-center gap-4">
              <div className="flex flex-col gap-2">
                {previewPictos.slice(0, 2).map((picto) => (
                  <div
                    key={picto.id}
                    className="w-20 h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center p-3 transition-all hover:shadow-md hover:scale-110"
                  >
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {previewPictos.slice(2, 4).map((picto) => (
                  <div
                    key={picto.id}
                    className="w-20 h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center p-3 transition-all hover:shadow-md hover:scale-110"
                  >
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {previewPictos.slice(4, 6).map((picto) => (
                  <div
                    key={picto.id}
                    className="w-20 h-20 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center p-3 transition-all hover:shadow-md hover:scale-110"
                  >
                    <DarkAwarePicto
                      pictogram={picto}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Big numbers section */}
      {totalCount > 0 && (
        <section className="py-24 md:py-32 relative bg-accent border-t border-border">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-7xl md:text-9xl font-black text-foreground leading-none">
                  <AnimatedCounter value={totalCount} suffix="+" />
                </div>
                <p className="mt-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pictogrammes
                </p>
              </div>
              <div>
                <div className="text-7xl md:text-9xl font-black text-foreground leading-none">
                  <AnimatedCounter value={collections} />
                </div>
                <p className="mt-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Collections
                </p>
              </div>
              <div>
                <div className="text-7xl md:text-9xl font-black text-foreground leading-none">
                  2
                </div>
                <p className="mt-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Formats
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Horizontal scroll preview */}
      {previewPictos.length > 0 && (
        <section className="py-24 md:py-32 relative border-t border-border">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8">
              Découvrir la galerie
            </h2>
            <div className="overflow-x-auto snap-x snap-mandatory">
              <div className="flex gap-4 pb-4 min-w-min">
                {previewPictos.map((picto) => (
                  <div
                    key={picto.id}
                    className="w-40 h-40 shrink-0 snap-start bg-card rounded-xl border border-border shadow-sm flex flex-col items-center justify-center p-4 gap-3 transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                    onClick={onEnterGallery}
                  >
                    <div className="w-20 h-20 flex items-center justify-center">
                      <DarkAwarePicto
                        pictogram={picto}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center line-clamp-2">
                      {picto.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GitHub section — elegant horizontal band if not logged in */}
      {!user && (
        <section className="py-24 md:py-32 relative border-t border-border">
          <div className="mx-auto max-w-4xl px-6">
            <div className="bg-card border border-border rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-lg md:text-base text-foreground font-medium max-w-lg">
                Connectez-vous avec GitHub pour débloquer favoris, upload et collections personnalisées.
              </p>
              <button
                onClick={onLogin}
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <Github className="w-4 h-4" />
                Se connecter avec GitHub
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA — ultra-minimal */}
      <section className="py-32 relative border-t border-border">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Prêt à explorer ?
          </h2>
          <div className="mt-12">
            <button
              onClick={onEnterGallery}
              className="px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-(--primary-hover) active:bg-(--primary-active) text-primary-foreground"
            >
              <span className="flex items-center gap-2 justify-center">
                Ouvrir la galerie
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer — single line */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-sm font-semibold text-foreground">
              La Boite à Pictos
            </span>
            <nav className="flex items-center gap-2 flex-wrap justify-center text-xs text-muted-foreground/50">
              <a href="/discover" className="hover:text-muted-foreground transition-colors">Découvrir</a>
              <span>·</span>
              <a href="/gallery" className="hover:text-muted-foreground transition-colors">Galerie</a>
              <span>·</span>
              <a href="/feedback" className="hover:text-muted-foreground transition-colors">Feedback</a>
              <span>·</span>
              <a href="/guides" className="hover:text-muted-foreground transition-colors">Guides</a>
              <span>·</span>
              <a href="/confidentialite" className="hover:text-muted-foreground transition-colors">Confidentialité</a>
              <span>·</span>
              <a href="/cookies" className="hover:text-muted-foreground transition-colors">Cookies</a>
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground/50">v{__APP_VERSION__}</span>
              <a
                href="https://github.com/BarthGve/galerie-picto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                title="Voir le code source"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
