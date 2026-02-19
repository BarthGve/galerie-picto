import { useCallback, useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PictoMosaic } from "@/components/PictoMosaic";
import { DarkAwarePicto } from "@/components/DarkAwarePicto";
import { API_URL } from "@/lib/config";
import type { Pictogram, PictogramManifest, GalleriesFile } from "@/lib/types";
import type { GitHubUser } from "@/lib/github-auth";

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

const FEATURES = [
  {
    icon: Search,
    title: "Recherche rapide",
    description:
      "Trouvez instantanément le pictogramme dont vous avez besoin par nom, tag ou galerie.",
    gradient: "from-[var(--dsfr-blue-france-sun)] to-[#1a1aff]",
  },
  {
    icon: Palette,
    title: "Personnalisation",
    description:
      "Changez les couleurs à la volée et téléchargez en SVG ou PNG selon vos besoins.",
    gradient: "from-[var(--dsfr-grey-1000)] to-[var(--dsfr-grey-850)]",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description:
      "Organisez vos pictogrammes en collections thématiques pour vos projets.",
    gradient: "from-[var(--dsfr-red-marianne-sun)] to-[#f95c5e]",
  },
];

const GITHUB_FEATURES = [
  { icon: Heart, label: "Favoris", description: "Sauvegardez vos pictos préférés" },
  { icon: UploadCloud, label: "Upload", description: "Ajoutez vos propres pictogrammes" },
  { icon: FolderOpen, label: "Collections", description: "Créez des collections personnalisées" },
];

export function HomePage({
  onEnterGallery,
  user,
  onLogin,
  onLogout,
}: HomePageProps) {
  const [mosaicPictos, setMosaicPictos] = useState<Pictogram[]>([]);
  const [previewPictos, setPreviewPictos] = useState<Pictogram[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [collections, setCollections] = useState(0);
  const [, setContributors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pictoRes, galleriesRes] = await Promise.all([
          fetch(`${API_URL}/api/pictograms/manifest`),
          fetch(`${API_URL}/api/galleries`),
        ]);

        if (pictoRes.ok) {
          const data: PictogramManifest = await pictoRes.json();
          const pictos = data.pictograms.filter(p => !p.filename.endsWith("_dark.svg"));
          setMosaicPictos(pictos.slice(0, 40));
          const shuffled = [...pictos].sort(() => Math.random() - 0.5);
          setPreviewPictos(shuffled.slice(0, 12));
          setTotalCount(Math.floor(pictos.length / 10) * 10);

          const contribs = new Set(
            pictos.map((p) => p.contributor?.githubUsername).filter(Boolean),
          );
          setContributors(contribs.size);
        }

        if (galleriesRes.ok) {
          const galData: GalleriesFile = await galleriesRes.json();
          setCollections(galData.galleries.length);
        }
      } catch {
        // Silently fail - mosaic just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Background dot pattern */}
      <div
        className="fixed inset-0 -z-20 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
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
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#2845c1] to-[#6a6af4] flex items-center justify-center shadow-lg shadow-[#2845c1]/20">
              <Palette className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground">
              Galerie Picto
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
                  <span style={{ color: 'var(--dsfr-blue-france-sun)' }}>prêts </span>
                  <span className="text-white" style={{ WebkitTextStroke: '1.5px rgba(0,0,0,0.5)' }}>à l'</span>
                  <span style={{ color: 'var(--dsfr-red-marianne-sun)' }}>emploi</span>
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
                  className="btn-cta px-8 py-4 rounded font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: 'var(--dsfr-blue-france-sun)', color: 'var(--dsfr-grey-1000)' }}
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

      {/* Features */}
      <section className="py-16 md:py-24 relative">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Tout ce qu'il vous faut
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Des outils simples et efficaces pour trouver et utiliser vos
              pictogrammes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded bg-card border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative mb-5">
                  <div
                    className={`w-14 h-14 rounded bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-primary-foreground shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview grid */}
      {previewPictos.length > 0 && (
        <section className="py-16 md:py-24 relative">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Aperçu de la collection
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Quelques pictogrammes parmi les {totalCount}+ disponibles.
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {previewPictos.map((picto) => (
                <div
                  key={picto.id}
                  className="group aspect-square rounded bg-card border border-border shadow-sm flex items-center justify-center p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105 cursor-pointer"
                  onClick={onEnterGallery}
                >
                  <DarkAwarePicto
                    pictogram={picto}
                    className="w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GitHub Bonus Section */}
      {!user && (
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="relative p-8 md:p-12 rounded-[2rem] bg-accent border border-github-border shadow-xl overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.07]">
                <Github className="w-48 h-48 rotate-12" />
              </div>

              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-badge-accent-bg border border-badge-accent-border text-badge-accent-text text-xs font-bold uppercase tracking-wider">
                    <Github className="w-3.5 h-3.5" />
                    Bonus GitHub
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    Débloquez des{" "}
                    <span className="text-github-accent">
                      fonctionnalités exclusives
                    </span>
                  </h2>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Connectez-vous avec votre compte GitHub pour accéder à
                    des outils supplémentaires. C'est gratuit et instantané.
                  </p>
                  <button
                    onClick={onLogin}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded bg-github-accent text-primary-foreground font-bold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Github className="w-4 h-4" />
                    Se connecter avec GitHub
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid gap-3">
                  {GITHUB_FEATURES.map((feat) => (
                    <div
                      key={feat.label}
                      className="flex items-center gap-4 p-4 rounded glass"
                    >
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-[#2845c1] to-[#6a6af4] flex items-center justify-center text-primary-foreground shrink-0">
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {feat.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {feat.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
              className="btn-cta px-8 py-4 rounded font-bold text-lg shadow-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: 'var(--dsfr-blue-france-sun)', color: 'var(--dsfr-grey-1000)' }}
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
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2845c1] to-[#6a6af4] flex items-center justify-center">
              <Palette className="size-3 text-primary-foreground" />
            </div>
            <span>
              Galerie Picto — Libre et open source
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Download className="w-3.5 h-3.5 inline" />
            <span>SVG & PNG</span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-mono text-muted-foreground/60 select-none normal-case tracking-normal font-normal">
              v{__APP_VERSION__}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
