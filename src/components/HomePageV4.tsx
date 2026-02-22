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
  Download,
  Sparkles,
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

interface HomePageV4Props {
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

export function HomePageV4({
  onEnterGallery,
  user,
  onLogin,
  onLogout,
}: HomePageV4Props) {
  const { pictograms: allPictograms, loading } = usePictogramsCtx();
  const { galleries } = useGalleriesCtx();

  const pictos = useMemo(
    () => allPictograms.filter((p) => !p.filename.endsWith("_dark.svg")),
    [allPictograms],
  );
  const mosaicPictos = useMemo(() => pictos.slice(0, 40), [pictos]);
  const totalCount = useMemo(() => Math.floor(pictos.length / 10) * 10, [pictos]);
  const collections = galleries.length;

  const marqueePicktos = useMemo(() => {
    return pictos.slice(0, 20);
  }, [pictos]);

  const featurePictos = useMemo(() => {
    return pictos.slice(0, 6);
  }, [pictos]);

  const colorVariantPickto = useMemo(() => {
    return pictos[0] || null;
  }, [pictos]);

  const collectionCards = useMemo(() => {
    return galleries.slice(0, 3).map((gallery, idx) => ({
      ...gallery,
      rotation: [2, -1, 1][idx] || 0,
    }));
  }, [galleries]);

  const previewUrls = useMemo(() => pictos.slice(0, 12).map((p) => p.url), [pictos]);
  useDarkPrefetch(previewUrls);

  const styles = `
    @keyframes marquee {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    .marquee-animate {
      animation: marquee 30s linear infinite;
    }
  `;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{styles}</style>

      {/* Background dot pattern */}
      <div
        className="fixed inset-0 -z-20 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated gradient blobs */}
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-8 max-w-xl">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Vos pictogrammes,{" "}
                <br className="hidden sm:block" />
                <span className="inline-block pr-6">
                  <span style={{ color: "var(--primary)" }}>prêts </span>
                  <span
                    className="text-white"
                    style={{ WebkitTextStroke: "1.5px rgba(0,0,0,0.5)" }}
                  >
                    à l'
                  </span>
                  <span style={{ color: "var(--destructive)" }}>emploi</span>
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                Une bibliothèque de pictogrammes SVG libres et personnalisables.
                Recherchez, personnalisez les couleurs et téléchargez en un clic.
              </p>

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

            <div className="hidden lg:block">
              <PictoMosaic pictograms={mosaicPictos} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section - Infinite scrolling band of pictograms */}
      {marqueePicktos.length > 0 && (
        <section className="relative py-12 overflow-hidden bg-accent/20">
          <div className="relative h-24 flex items-center">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="flex marquee-animate whitespace-nowrap gap-4">
              {[...marqueePicktos, ...marqueePicktos].map((picto, idx) => (
                <div
                  key={`${picto.id}-${idx}`}
                  className="flex-shrink-0 w-16 h-16 rounded-xl bg-card border border-border/30 shadow-sm flex items-center justify-center overflow-hidden"
                >
                  <div className="w-12 h-12">
                    <DarkAwarePicto pictogram={picto} width={48} height={48} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature 1 - Recherche instantanée */}
      <section className="relative min-h-[70vh] flex items-center bg-background">
        <div className="mx-auto max-w-7xl px-6 w-full">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left: Text */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-primary text-primary-foreground w-fit">
                <Search className="size-8" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Trouvez en un instant
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Recherchez vos pictogrammes par nom, tag ou galerie. Notre moteur
                  de recherche intelligent vous fait gagner du temps.
                </p>
              </div>
              <button
                onClick={onEnterGallery}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm w-fit hover:scale-105 active:scale-95 transition-all"
              >
                <span className="flex items-center gap-2">
                  Explorer <ArrowRight className="size-4" />
                </span>
              </button>
            </div>

            {/* Right: Grid of pictograms */}
            {featurePictos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {featurePictos.map((picto, idx) => (
                  <div
                    key={picto.id}
                    className={`rounded-xl bg-card border transition-all overflow-hidden flex items-center justify-center ${
                      idx === 0
                        ? "ring-2 ring-primary"
                        : "border-border/30 hover:border-border/60"
                    } h-24 md:h-32 shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16">
                      <DarkAwarePicto pictogram={picto} width={64} height={64} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature 2 - Personnalisation */}
      <section className="relative min-h-[70vh] flex items-center bg-accent/30">
        <div className="mx-auto max-w-7xl px-6 w-full">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left: Color variants */}
            {colorVariantPickto && (
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* Center picto */}
                  <div className="absolute w-24 h-24 rounded-xl bg-card border border-border/30 shadow-lg flex items-center justify-center z-10">
                    <div className="w-16 h-16">
                      <DarkAwarePicto
                        pictogram={colorVariantPickto}
                        width={64}
                        height={64}
                      />
                    </div>
                  </div>

                  {/* Variant 1 - 120deg hue */}
                  <div
                    className="absolute w-20 h-20 rounded-xl bg-card border border-border/30 shadow-md flex items-center justify-center"
                    style={{
                      top: "-2rem",
                      right: "2rem",
                      filter: "hue-rotate(120deg)",
                    }}
                  >
                    <div className="w-12 h-12">
                      <DarkAwarePicto
                        pictogram={colorVariantPickto}
                        width={48}
                        height={48}
                      />
                    </div>
                  </div>

                  {/* Variant 2 - 240deg hue */}
                  <div
                    className="absolute w-20 h-20 rounded-xl bg-card border border-border/30 shadow-md flex items-center justify-center"
                    style={{
                      bottom: "0rem",
                      right: "-1rem",
                      filter: "hue-rotate(240deg)",
                    }}
                  >
                    <div className="w-12 h-12">
                      <DarkAwarePicto
                        pictogram={colorVariantPickto}
                        width={48}
                        height={48}
                      />
                    </div>
                  </div>

                  {/* Variant 3 - -120deg hue */}
                  <div
                    className="absolute w-20 h-20 rounded-xl bg-card border border-border/30 shadow-md flex items-center justify-center"
                    style={{
                      bottom: "0rem",
                      left: "-1rem",
                      filter: "hue-rotate(-120deg)",
                    }}
                  >
                    <div className="w-12 h-12">
                      <DarkAwarePicto
                        pictogram={colorVariantPickto}
                        width={48}
                        height={48}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right: Text */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-primary text-primary-foreground w-fit">
                <Palette className="size-8" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Vos couleurs, votre style
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Personnalisez chaque pictogramme avec vos propres couleurs. Changez
                  la teinte en temps réel et téléchargez votre version.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 - Collections */}
      <section className="relative min-h-[70vh] flex items-center bg-background">
        <div className="mx-auto max-w-7xl px-6 w-full">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left: Text */}
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-primary text-primary-foreground w-fit">
                <FolderOpen className="size-8" />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                  Organisez sans effort
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Créez vos propres collections pour organiser vos pictogrammes par
                  projet, thème ou besoin spécifique.
                </p>
              </div>
            </div>

            {/* Right: Collection cards */}
            <div className="relative h-64 flex items-center justify-center">
              {collectionCards.map((gallery, idx) => (
                <div
                  key={gallery.id}
                  className="absolute w-56 rounded-xl bg-card border border-border/30 p-4 shadow-lg transition-all hover:-translate-y-2"
                  style={{
                    transform: `translateY(${idx * 20}px) rotate(${gallery.rotation}deg)`,
                    zIndex: idx,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: gallery.color || "#6a6af4" }}
                    />
                    <h3 className="font-extrabold text-sm truncate text-foreground">
                      {gallery.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    {pictos.slice(0, 2).map((picto, pidx) => (
                      <div
                        key={`${gallery.id}-${pidx}`}
                        className="size-10 rounded-lg bg-secondary flex items-center justify-center"
                      >
                        <div className="w-6 h-6">
                          <DarkAwarePicto
                            pictogram={picto}
                            width={24}
                            height={24}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Big Numbers Section - Inverted */}
      {totalCount > 0 && (
        <section className="relative py-24 bg-foreground text-background">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-primary via-transparent to-primary pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 relative">
            <div className="grid gap-12 md:gap-8 grid-cols-1 md:grid-cols-3 text-center">
              <div>
                <div className="text-7xl md:text-8xl font-black mb-4">
                  <AnimatedCounter value={totalCount} />
                </div>
                <p className="text-lg font-semibold uppercase tracking-wider">
                  Pictogrammes
                </p>
              </div>
              <div>
                <div className="text-7xl md:text-8xl font-black mb-4">
                  <AnimatedCounter value={collections} />
                </div>
                <p className="text-lg font-semibold uppercase tracking-wider">
                  Collections
                </p>
              </div>
              <div>
                <div className="text-7xl md:text-8xl font-black mb-4">2</div>
                <p className="text-lg font-semibold uppercase tracking-wider">
                  Formats
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* GitHub Section */}
      {!user && (
        <section className="relative py-20 bg-[#0d1117] text-white overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <Github className="size-96" />
          </div>

          <div className="mx-auto max-w-7xl px-6 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8">
                Débloquez le plein potentiel
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-xl bg-white/10">
                    <Heart className="size-8" />
                  </div>
                  <h3 className="font-extrabold text-lg">Favoris</h3>
                  <p className="text-sm text-white/70">
                    Marquez vos pictogrammes préférés
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-xl bg-white/10">
                    <UploadCloud className="size-8" />
                  </div>
                  <h3 className="font-extrabold text-lg">Upload</h3>
                  <p className="text-sm text-white/70">
                    Contribuez vos propres pictogrammes
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center size-16 rounded-xl bg-white/10">
                    <FolderOpen className="size-8" />
                  </div>
                  <h3 className="font-extrabold text-lg">Collections</h3>
                  <p className="text-sm text-white/70">
                    Créez vos collections personnelles
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={onLogin}
                className="px-8 py-4 rounded-xl bg-white text-foreground font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Github className="size-5" />
                Se connecter avec GitHub
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-accent/20 via-background to-accent/10">
        <div className="mx-auto max-w-3xl px-6 text-center relative z-10">
          <h2 className="text-5xl font-black tracking-tight mb-8">
            Prêt à explorer ?
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onEnterGallery}
              className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Ouvrir la galerie
              <ArrowRight className="size-5" />
            </button>

            {!user && (
              <button
                onClick={onLogin}
                className="px-8 py-4 rounded-xl border-2 border-foreground font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Github className="size-5" />
                Connexion GitHub
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-card border-t border-border/50 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <Palette className="size-4" />
              </div>
              <span className="font-black text-sm tracking-tight">
                La Boite à Pictos
              </span>
            </div>

            {/* Links */}
            <div className="flex gap-6 text-xs text-muted-foreground">
              <button
                onClick={onEnterGallery}
                className="hover:text-foreground transition-colors"
              >
                Galerie
              </button>
              <a
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Feedback
              </a>
              <a
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Confidentialité
              </a>
            </div>

            {/* Version */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded bg-secondary text-foreground font-bold">
                v{__APP_VERSION__}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
