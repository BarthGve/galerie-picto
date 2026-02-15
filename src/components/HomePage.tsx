import { useCallback, useEffect, useState, useRef } from "react";
import { Palette, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

function StatCell({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
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
    <div ref={refCallback} className="text-center">
      <div className="text-3xl font-bold text-primary">
        {display}
        {suffix}
      </div>
      <div className="text-sm text-foreground/70">{label}</div>
    </div>
  );
}

const FEATURES = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    title: "Recherche rapide",
    description:
      "Trouvez instantanement le pictogramme dont vous avez besoin par nom, tag ou galerie.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
      </svg>
    ),
    title: "Personnalisation",
    description:
      "Changez les couleurs a la volee et telechargez en SVG ou PNG selon vos besoins.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    title: "Collections",
    description:
      "Organisez vos pictogrammes en collections thematiques pour vos projets.",
  },
];

function pairDarkVariants(pictograms: Pictogram[]): Pictogram[] {
  const darkMap = new Map<string, Pictogram>();
  const lightList: Pictogram[] = [];
  for (const picto of pictograms) {
    const baseName = picto.filename.replace(/\.svg$/i, "");
    if (baseName.endsWith("_dark")) {
      darkMap.set(baseName.replace(/_dark$/, ""), picto);
    } else {
      lightList.push(picto);
    }
  }
  return lightList.map((picto) => {
    const dark = darkMap.get(picto.filename.replace(/\.svg$/i, ""));
    return dark ? { ...picto, darkUrl: dark.url } : picto;
  });
}

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
  const [contributors, setContributors] = useState(0);
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
          const paired = pairDarkVariants(data.pictograms);
          setMosaicPictos(paired.slice(0, 40));
          const shuffled = [...paired].sort(() => Math.random() - 0.5);
          setPreviewPictos(shuffled.slice(0, 12));
          setTotalCount(Math.floor(paired.length / 10) * 10);

          const contribs = new Set(
            paired.map((p) => p.contributor?.githubUsername).filter(Boolean),
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
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <span className="text-base font-semibold">Galerie Picto</span>
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar_url} alt={user.login} />
                <AvatarFallback className="rounded-full text-xs">
                  {(user.name || user.login).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">
                {user.name || user.login}
              </span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Deconnexion</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={onLogin}>
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Connexion
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col gap-6 max-w-xl">
              <Badge
                variant="secondary"
                className="w-fit text-xs tracking-wider uppercase"
              >
                Galerie Picto
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Vos pictogrammes,{" "}
                <span className="text-primary">prets a l'emploi</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Une bibliotheque de pictogrammes SVG libres et personnalisables.
                Recherchez, personnalisez les couleurs et telechargez en un
                clic.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" onClick={onEnterGallery}>
                  Explorer la galerie
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <PictoMosaic pictograms={mosaicPictos} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Stats */}
      {totalCount > 0 && (
        <section className="py-12 bg-primary/5 dark:bg-primary/10">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCell value={totalCount} label="Pictogrammes" suffix="+" />
              <StatCell value={collections} label="Collections" />
              <StatCell
                value={contributors}
                label={contributors > 1 ? "Contributeurs" : "Contributeur"}
              />
              <StatCell value={2} label="Formats (SVG/PNG)" />
            </div>
          </div>
        </section>
      )}

      <Separator />

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tout ce qu'il vous faut
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Des outils simples et efficaces pour trouver et utiliser vos
              pictogrammes.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* Preview grid - glassmorphism 3D */}
      {previewPictos.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Apercu de la collection
              </h2>
              <p className="mt-3 text-muted-foreground">
                Quelques pictogrammes parmi les {totalCount} disponibles.
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {previewPictos.map((picto) => (
                <div
                  key={picto.id}
                  className="group aspect-square rounded-xl bg-card/60 dark:bg-card/30 backdrop-blur-md border border-border/50 flex items-center justify-center p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer shadow-sm"
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

      <Separator />

      {/* CTA bottom */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Pret a explorer ?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Accedez a l'ensemble des pictogrammes, filtrez par collection et
            personnalisez les couleurs.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={onEnterGallery}>
              Ouvrir la galerie
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
