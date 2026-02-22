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
  Zap,
  Quote,
  Layers,
  Download,
  Eye,
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

interface HomePageV1Props {
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

export function HomePageV1({
  onEnterGallery,
  user,
  onLogin,
  onLogout,
}: HomePageV1Props) {
  const { pictograms: allPictograms, loading } = usePictogramsCtx();
  const { galleries } = useGalleriesCtx();

  const pictos = useMemo(
    () => allPictograms.filter((p) => !p.filename.endsWith("_dark.svg")),
    [allPictograms],
  );
  const mosaicPictos = useMemo(() => pictos.slice(0, 40), [pictos]);
  const totalCount = useMemo(() => Math.floor(pictos.length / 10) * 10, [pictos]);
  const collections = galleries.length;

  const [previewPictos, setPreviewPictos] = useState<Pictogram[]>([]);
  useEffect(() => {
    if (pictos.length > 0 && previewPictos.length === 0) {
      setPreviewPictos([...pictos].sort(() => Math.random() - 0.5).slice(0, 12));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pictos.length]);

  const previewUrls = useMemo(() => previewPictos.map((p) => p.url), [previewPictos]);
  useDarkPrefetch(previewUrls);

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      {/* "Comment ça marche" section - Editorial Timeline */}
      <section className="relative py-16 md:py-24 bg-accent/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Comment ça marche
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trois étapes simples pour trouver, personnaliser et organiser vos
              pictogrammes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1: Recherchez */}
            <div className="relative">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground font-black text-4xl shadow-lg">
                  01
                </div>
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2">Recherchez</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Trouvez instantanément le pictogramme dont vous avez besoin
                    par nom, tag ou galerie.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Personnalisez */}
            <div className="relative">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground font-black text-4xl shadow-lg">
                  02
                </div>
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <Palette className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2">Personnalisez</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Changez les couleurs à la volée et téléchargez en SVG ou
                    PNG selon vos besoins.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Organisez */}
            <div className="relative">
              <div className="flex flex-col items-center text-center gap-6">
                <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground font-black text-4xl shadow-lg">
                  03
                </div>
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-extrabold mb-2">Organisez</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Organisez vos pictogrammes en collections thématiques pour
                    vos projets.
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative connector line (hidden on mobile) */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 -z-10" />
          </div>
        </div>
      </section>

      {/* "Aperçu éditorial" section - Magazine Style Grid */}
      <section className="relative py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
              Aperçu éditorial
            </h2>
            <p className="text-muted-foreground text-lg">
              Découvrez une sélection de pictogrammes de notre galerie
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {previewPictos.map((picto, idx) => {
              const isLarge = idx === 0;
              return (
                <div
                  key={picto.id}
                  className={`group relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 cursor-pointer
                    shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)]
                    hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)]
                    ${isLarge ? "md:col-span-2 md:row-span-2" : ""}`}
                >
                  {/* Image container */}
                  <div className="relative bg-secondary overflow-hidden w-full h-40 md:h-64 flex items-center justify-center">
                    <div
                      className="relative w-24 h-24 md:w-32 md:h-32 group-hover:scale-110 transition-transform duration-300"
                      style={{ opacity: 0.7 }}
                    >
                      <DarkAwarePicto
                        pictogram={picto}
                        width={isLarge ? 128 : 96}
                        height={isLarge ? 128 : 96}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-extrabold leading-tight text-foreground mb-1 truncate">
                      {picto.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {picto.tags?.slice(0, 2).join(", ") || "Pictogramme"}
                    </p>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={onEnterGallery}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold
                        opacity-0 group-hover:opacity-100 transform -translate-y-2 group-hover:translate-y-0
                        transition-all duration-300 shadow-lg"
                    >
                      Voir dans la galerie
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* "Ce qu'ils en disent" section - Testimonials */}
      <section className="relative py-16 md:py-24 bg-accent/40">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Ce qu'ils en disent
            </h2>
            <p className="text-muted-foreground text-lg">
              Retours de nos utilisateurs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="relative glass rounded-xl p-8 border border-border/40">
              <div className="absolute -top-4 -right-4 opacity-10">
                <Quote className="w-16 h-16 text-primary" />
              </div>
              <blockquote className="text-foreground text-lg font-medium mb-6 leading-relaxed relative z-10">
                "Un outil indispensable pour nos projets de communication
                visuelle. La qualité des pictogrammes est exceptionnelle."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  D
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">
                    Designer
                  </p>
                  <p className="text-xs text-muted-foreground">Agence créative</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="relative glass rounded-xl p-8 border border-border/40">
              <div className="absolute -top-4 -right-4 opacity-10">
                <Quote className="w-16 h-16 text-primary" />
              </div>
              <blockquote className="text-foreground text-lg font-medium mb-6 leading-relaxed relative z-10">
                "La personnalisation des couleurs nous fait gagner un temps
                précieux. Plus besoin de modifier les fichiers en post-prod."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  CP
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">
                    Chef de projet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Organisation publique
                  </p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="relative glass rounded-xl p-8 border border-border/40">
              <div className="absolute -top-4 -right-4 opacity-10">
                <Quote className="w-16 h-16 text-primary" />
              </div>
              <blockquote className="text-foreground text-lg font-medium mb-6 leading-relaxed relative z-10">
                "Enfin une bibliothèque de pictogrammes SVG vraiment libre et
                complète. Intégration fluide dans nos applications React."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  D
                </div>
                <div>
                  <p className="font-extrabold text-sm text-foreground">
                    Développeur
                  </p>
                  <p className="text-xs text-muted-foreground">Startup SaaS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub Bonus section */}
      {!user && (
        <section className="relative py-16 md:py-24 bg-card border-y border-border/50">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left side - Text */}
              <div className="flex flex-col gap-8">
                <div>
                  <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
                    Bonus GitHub
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                    Débloquez des fonctionnalités exclusives
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Connectez-vous avec votre compte GitHub pour accéder à des
                    fonctionnalités avancées et personnaliser votre expérience.
                  </p>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground mb-1">
                        Favoris synchronisés
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Marquez vos pictogrammes préférés et accédez-les depuis
                        n'importe quel appareil.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <UploadCloud className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground mb-1">
                        Téléchargement en masse
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Téléchargez plusieurs pictogrammes à la fois dans vos
                        couleurs personnalisées.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-foreground mb-1">
                        Collections personnalisées
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Créez vos propres collections pour organiser vos
                        pictogrammes par projet.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogin}
                  className="px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 w-fit bg-primary text-primary-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-5 h-5" />
                    Se connecter avec GitHub
                  </span>
                </button>
              </div>

              {/* Right side - Feature cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-background border border-border p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform">
                  <Zap className="w-8 h-8 text-primary" />
                  <h4 className="font-extrabold text-foreground text-sm">
                    Import / Export
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Gérez vos fichiers facilement
                  </p>
                </div>

                <div className="rounded-xl bg-background border border-border p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform">
                  <Eye className="w-8 h-8 text-primary" />
                  <h4 className="font-extrabold text-foreground text-sm">
                    Prévisualisations
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Aperçu avant téléchargement
                  </p>
                </div>

                <div className="rounded-xl bg-background border border-border p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform">
                  <Download className="w-8 h-8 text-primary" />
                  <h4 className="font-extrabold text-foreground text-sm">
                    Batch Download
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Téléchargez en masse
                  </p>
                </div>

                <div className="rounded-xl bg-background border border-border p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 transition-transform">
                  <Layers className="w-8 h-8 text-primary" />
                  <h4 className="font-extrabold text-foreground text-sm">
                    Versioning
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Historique des modifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Prêt à explorer ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Accédez à l'ensemble des pictogrammes, filtrez par collection et
            personnalisez les couleurs pour votre projet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onEnterGallery}
              className="px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground"
            >
              <span className="flex items-center gap-2">
                Ouvrir la galerie
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>

            {!user && (
              <button
                onClick={onLogin}
                className="px-8 py-4 rounded-lg font-bold text-lg border-2 border-foreground transition-all hover:scale-105 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Connexion GitHub
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-card border-t border-border/50 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Logo + Description */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                  <Palette className="size-4" />
                </div>
                <span className="font-black text-sm tracking-tight">
                  La Boite à Pictos
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bibliothèque de pictogrammes SVG libres et personnalisables pour
                vos projets.
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div>
              <h4 className="font-extrabold text-sm mb-4 text-foreground">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={onEnterGallery}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Galerie
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Feedback
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Guides
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h4 className="font-extrabold text-sm mb-4 text-foreground">
                Légal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Licences
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Social */}
            <div>
              <h4 className="font-extrabold text-sm mb-4 text-foreground">
                Suivez-nous
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center size-9 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="border-t border-border/50 pt-6 flex items-center justify-between text-xs text-muted-foreground">
            <p>© 2024 La Boite à Pictos. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
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
