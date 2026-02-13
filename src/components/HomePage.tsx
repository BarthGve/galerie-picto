import { useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PictoMosaic } from "@/components/PictoMosaic";
import { API_URL } from "@/lib/config";
import type { PictogramManifest } from "@/lib/types";

interface HomePageProps {
  onEnterGallery: () => void;
}

function StatCell({ value, label }: { value: number; label: string }) {
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
      <div className="text-3xl font-bold text-primary-foreground">
        {display}+
      </div>
      <div className="text-sm text-primary-foreground/80">{label}</div>
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
      "Trouvez instantanement le pictogramme dont vous avez besoin par nom, tag ou categorie.",
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

export function HomePage({ onEnterGallery }: HomePageProps) {
  const [pictoUrls, setPictoUrls] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState(0);
  const [contributors, setContributors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPictos() {
      try {
        const res = await fetch(`${API_URL}/api/pictograms/manifest`);
        if (!res.ok) return;
        const data: PictogramManifest = await res.json();

        const nonDark = data.pictograms.filter(
          (p) => !p.filename.endsWith("_dark.svg"),
        );

        setPictoUrls(nonDark.slice(0, 40).map((p) => p.url));
        setTotalCount(nonDark.length);

        const cats = new Set(nonDark.map((p) => p.category).filter(Boolean));
        setCategories(cats.size);

        const contribs = new Set(
          nonDark.map((p) => p.contributor?.githubUsername).filter(Boolean),
        );
        setContributors(contribs.size);
      } catch {
        // Silently fail - mosaic just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchPictos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
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
                <Button size="lg" variant="outline" onClick={onEnterGallery}>
                  En savoir plus
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <PictoMosaic urls={pictoUrls} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Stats */}
      {totalCount > 0 && (
        <section className="bg-primary py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCell value={totalCount} label="Pictogrammes" />
              <StatCell value={categories} label="Categories" />
              <StatCell value={contributors} label="Contributeurs" />
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
      {pictoUrls.length > 0 && (
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
              {pictoUrls.slice(0, 12).map((url, i) => (
                <div
                  key={i}
                  className="group aspect-square rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 flex items-center justify-center p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  style={{
                    boxShadow:
                      "0 4px 20px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                  onClick={onEnterGallery}
                >
                  <img
                    src={url}
                    alt=""
                    width={64}
                    height={64}
                    decoding="async"
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
