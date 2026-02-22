import { useEffect, useMemo, useState, useRef } from "react";
import {
  Palette,
  LogOut,
  ArrowRight,
  Search,
  Github,
  Heart,
  UploadCloud,
  FolderOpen,
  FileType,
  Layers,
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
import { parseSvgColors, replaceSvgColors } from "@/lib/svg-color-parser";
import { API_URL } from "@/lib/config";

declare const __APP_VERSION__: string;

const DSFR_SWATCHES = [
  { label: "Blanc", hex: "#ffffff" },
  { label: "Noir", hex: "#161616" },
  { label: "Bleu France", hex: "#6a6af4" },
  { label: "Rouge Marianne", hex: "#e1000f" },
  { label: "Émeraude", hex: "#00a95f" },
  { label: "Menthe", hex: "#009081" },
  { label: "Écume", hex: "#465f9d" },
  { label: "Glycine", hex: "#a558a0" },
  { label: "Tuile", hex: "#ce614a" },
  { label: "Tournesol", hex: "#c8aa39" },
  { label: "Macaron", hex: "#e18b76" },
  { label: "Gris", hex: "#929292" },
];

interface HomePageV3Props {
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
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!value || animatedRef.current) return;
    animatedRef.current = true;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / 1500, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

export function HomePageV3({
  onEnterGallery,
  user,
  onLogin,
  onLogout,
}: HomePageV3Props) {
  const { pictograms: allPictograms, loading } = usePictogramsCtx();
  const { galleries } = useGalleriesCtx();

  const mosaicPictos = useMemo(() => allPictograms.slice(0, 40), [allPictograms]);
  const totalCount = allPictograms.length;
  const collections = galleries.length;

  // Shuffle galleries once for the Collections card
  const [shuffledGalleries, setShuffledGalleries] = useState<typeof galleries>([]);
  useEffect(() => {
    if (galleries.length > 0 && shuffledGalleries.length === 0) {
      setShuffledGalleries([...galleries].sort(() => Math.random() - 0.5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleries.length]);

  // Shuffle une seule fois quand les pictos sont disponibles
  const [previewPictos, setPreviewPictos] = useState<Pictogram[]>([]);
  useEffect(() => {
    if (allPictograms.length > 0 && previewPictos.length === 0) {
      setPreviewPictos([...allPictograms].sort(() => Math.random() - 0.5).slice(0, 12));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPictograms.length]);

  // Prefetch batch des SVGs dark pour les pictos d'aperçu de collection
  const previewUrls = useMemo(() => previewPictos.map((p) => p.url), [previewPictos]);
  useDarkPrefetch(previewUrls);

  // Bento Grid: real SVG color customization
  const firstPicto = previewPictos[0];
  const [svgText, setSvgText] = useState<string | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [originalColors, setOriginalColors] = useState<string[]>([]);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  // Fetch the SVG source of the first picto via proxy to avoid CORS
  useEffect(() => {
    if (!firstPicto) return;
    let cancelled = false;
    const proxyUrl = `${API_URL}/api/proxy/svg?url=${encodeURIComponent(firstPicto.url)}`;
    fetch(proxyUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        setSvgText(text);
        const { originalColors: colors } = parseSvgColors(text);
        setOriginalColors(colors);
        setColorMap(Object.fromEntries(colors.map((c) => [c, c])));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [firstPicto]);

  // Generate modified SVG blob URL with proper cleanup
  const blobUrlRef = useRef<string | null>(null);
  const modifiedSvgUrl = useMemo(() => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    if (!svgText) { blobUrlRef.current = null; return null; }
    const hasChanges = Object.entries(colorMap).some(([k, v]) => k !== v);
    if (!hasChanges) { blobUrlRef.current = null; return null; }
    const modified = replaceSvgColors(svgText, colorMap);
    const url = URL.createObjectURL(new Blob([modified], { type: "image/svg+xml" }));
    blobUrlRef.current = url;
    return url;
  }, [svgText, colorMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  const exampleTags = useMemo(() => {
    const allTags = new Set<string>();
    allPictograms.forEach((p) => {
      p.tags?.forEach((t) => allTags.add(t));
    });
    return Array.from(allTags).slice(0, 3);
  }, [allPictograms]);

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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-8 max-w-xl">
              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Vos pictogrammes,{" "}
                <br className="hidden sm:block" />
                <span className="inline-block pr-6">
                  <span style={{ color: 'var(--tertiary)' }}>prêts </span>
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

      {/* Bento Grid Section */}
      <section className="py-16 md:py-24 relative">
        <div className="mx-auto max-w-6xl px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Tout ce qu'il vous faut
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Des outils simples et efficaces pour trouver et utiliser vos pictogrammes.
            </p>
          </div>

          {/* Bento Grid — masonry via CSS columns */}
          <div className="columns-1 md:columns-2 gap-6 [column-fill:balance]">
            {/* Card 1: Recherche instantanée */}
            <div className="break-inside-avoid mb-6 group bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <Search className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-extrabold text-foreground mb-4">
                    Recherche instantanée
                  </h3>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary border border-border/50 mb-4">
                    <Search className="size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher un pictogramme..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      disabled
                    />
                  </div>
                  {exampleTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {exampleTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-accent text-primary text-xs font-medium border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Personnalisation */}
            <div className="break-inside-avoid mb-6 group bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <Palette className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    Vos couleurs, votre style
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modifiez chaque couleur du pictogramme indépendamment
                  </p>
                </div>
              </div>

              {/* Live preview with real SVG recoloring */}
              {firstPicto && (
                <div className="flex items-center justify-center bg-secondary rounded-xl p-8 mb-6">
                  <img
                    src={modifiedSvgUrl || firstPicto.url}
                    alt={firstPicto.name}
                    width={128}
                    height={128}
                    decoding="async"
                    className="w-32 h-32 object-contain drop-shadow-sm transition-all duration-300"
                  />
                </div>
              )}

              {/* Per-color pickers — all on one line, drawer below */}
              {originalColors.length > 0 ? (
                <div className="space-y-3">
                  {/* All colors on the same row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {originalColors.map((origColor, idx) => {
                      const current = colorMap[origColor] ?? origColor;
                      const isOpen = openDrawer === origColor;
                      const isChanged = current !== origColor;
                      return (
                        <div key={origColor} className="flex items-center gap-1.5">
                          <div
                            className="w-6 h-6 rounded-lg border border-border shrink-0"
                            style={{ backgroundColor: origColor }}
                          />
                          <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                          <button
                            onClick={() => setOpenDrawer(isOpen ? null : origColor)}
                            className={`w-6 h-6 rounded-lg border-2 shrink-0 transition-all duration-200 hover:scale-110 cursor-pointer ${
                              isOpen ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""
                            }`}
                            style={{
                              backgroundColor: current,
                              borderColor: isChanged ? "var(--primary)" : "var(--border)",
                            }}
                            title={`Couleur ${idx + 1}`}
                          />
                          {isChanged && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setColorMap((prev) => ({ ...prev, [origColor]: origColor }));
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-bold"
                              title="Réinitialiser"
                            >
                              ↺
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Shared drawer area — shows palette for whichever color is open */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: openDrawer ? "120px" : "0px",
                      opacity: openDrawer ? 1 : 0,
                    }}
                  >
                    {openDrawer && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {DSFR_SWATCHES.map((swatch) => {
                          const current = colorMap[openDrawer] ?? openDrawer;
                          return (
                            <button
                              key={swatch.hex}
                              onClick={() => {
                                setColorMap((prev) => ({ ...prev, [openDrawer]: swatch.hex }));
                                setOpenDrawer(null);
                              }}
                              className="w-7 h-7 rounded-lg border transition-all duration-150 hover:scale-110"
                              style={{
                                backgroundColor: swatch.hex,
                                borderColor: current === swatch.hex ? "var(--primary)" : "var(--border)",
                                boxShadow: current === swatch.hex ? "0 0 0 2px var(--primary)" : undefined,
                              }}
                              title={swatch.label}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : firstPicto ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : null}

              <p className="text-sm text-muted-foreground text-center mt-6">
                Changez les couleurs à la volée et téléchargez en SVG ou PNG.
              </p>
            </div>

            {/* Card 3: Chiffres */}
            <div className="break-inside-avoid mb-6 group bg-accent rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-5 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-black text-foreground mb-2">
                <AnimatedCounter value={totalCount} />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Pictogrammes disponibles
              </p>
            </div>

            {/* Card 4: Collections */}
            <div className="break-inside-avoid mb-6 group bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                  <FolderOpen className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-extrabold text-foreground mb-4">
                    Collections
                  </h3>

              {/* Gallery previews — 2 visible, scroll for more */}
              <div className="mb-6 max-h-[4.5rem] overflow-y-auto space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {shuffledGalleries.map((gallery) => (
                  <div key={gallery.id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: gallery.color || "var(--primary)" }}
                    />
                    <span className="text-sm text-foreground truncate">
                      {gallery.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-3xl font-black text-foreground mb-2">
                <AnimatedCounter value={collections} />
              </div>
              <p className="text-xs text-muted-foreground">
                Organisez vos pictos par thème
              </p>
                </div>
              </div>
            </div>

            {/* Card 5: Formats */}
            <div className="break-inside-avoid mb-6 group bg-card rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="grid grid-cols-2 gap-6">
                {/* SVG */}
                <div className="p-6 rounded-lg bg-secondary border border-border/50 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Layers className="size-6" />
                  </div>
                  <h4 className="font-extrabold text-foreground mb-2">SVG</h4>
                  <p className="text-xs text-muted-foreground">
                    Vectoriel · Scalable · Éditable
                  </p>
                </div>

                {/* PNG */}
                <div className="p-6 rounded-lg bg-secondary border border-border/50 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <FileType className="size-6" />
                  </div>
                  <h4 className="font-extrabold text-foreground mb-2">PNG</h4>
                  <p className="text-xs text-muted-foreground">
                    Image · Compatible · Prêt à l'emploi
                  </p>
                </div>
              </div>
            </div>

            {/* Card 6: GitHub Bonus — only if !user */}
            {!user && (
              <div className="break-inside-avoid mb-6 group bg-gradient-to-br from-accent to-primary/5 rounded-xl p-6 md:p-8 border border-border/50 shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-tertiary text-tertiary-foreground flex items-center justify-center">
                    <Github className="size-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    GitHub Bonus
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground mb-6 font-medium">
                  Débloquez des fonctionnalités exclusives
                </p>

                {/* Features row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 text-destructive flex items-center justify-center mb-2">
                      <Heart className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Favoris</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-2">
                      <Palette className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Couleurs</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-2">
                      <UploadCloud className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Upload</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-2">
                      <FolderOpen className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Collections</p>
                  </div>
                </div>

                <button
                  onClick={onLogin}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-(--primary-hover) transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Github className="w-4 h-4" />
                  Se connecter avec GitHub
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Prêt à explorer ?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            Accédez à l'ensemble des pictogrammes, filtrez par collection et
            personnalisez les couleurs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnterGallery}
              className="px-8 py-4 rounded font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-(--primary-hover) active:bg-(--primary-active) text-primary-foreground"
            >
              <span className="flex items-center gap-2 justify-center">
                Ouvrir la galerie
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            {!user && (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-8 py-4 rounded border-2 border-border text-foreground font-bold text-lg hover:bg-muted transition-all justify-center"
              >
                <Github className="w-5 h-5" />
                Connexion GitHub
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="flex items-center justify-center size-8 rounded-xl bg-foreground shadow-lg">
              <Palette className="size-5 text-background" />
            </div>
            <span className="text-xl font-black tracking-tighter">La Boite à Pictos</span>
          </div>
          <nav aria-label="Liens du pied de page" className="flex items-center gap-4 flex-wrap">
            <a href="/discover" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Découvrir</a>
            <a href="/gallery" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Galerie</a>
            <a href="/feedback" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Feedback</a>
            <a href="/guides" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Guides</a>
            <a href="/confidentialite" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Confidentialité</a>
            <a href="/cookies" className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Cookies</a>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 select-none">
              v{__APP_VERSION__}
            </span>
            <a
              href="https://github.com/BarthGve/galerie-picto"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Voir le code source"
            >
              <Github className="w-4 h-4" />
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
