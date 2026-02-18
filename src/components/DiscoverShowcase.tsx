import { useState } from "react";
import {
  Shield,
  Car,
  FileText,
  User,
  Map,
  Download,
  ArrowUpRight,
  Sparkles,
  Star,
  FolderOpen,
  Hash,
  Eye,
  ChevronRight,
  Zap,
  Crown,
  Flame,
} from "lucide-react";

// ── Mock data ────────────────────────────────────────────────────────────────
const mockPictos = [
  { name: "Alerte", time: "il y a 2h", tag: "urgence", downloads: 342 },
  { name: "Véhicule", time: "il y a 5h", tag: "transport", downloads: 287 },
  { name: "Document", time: "il y a 1j", tag: "admin", downloads: 156 },
  { name: "Personnel", time: "il y a 2j", tag: "rh", downloads: 98 },
  { name: "Carte", time: "il y a 3j", tag: "geo", downloads: 445 },
];

const mockCollections = [
  { name: "Signalétique terrain", count: 24, desc: "Pictos de signalisation" },
  { name: "Communication interne", count: 18, desc: "Supports visuels" },
  { name: "Opérations", count: 31, desc: "Pictos opérationnels" },
];

const mockTags = [
  { name: "véhicule", count: 45 },
  { name: "alerte", count: 38 },
  { name: "document", count: 32 },
  { name: "terrain", count: 28 },
  { name: "communication", count: 24 },
  { name: "carte", count: 21 },
  { name: "personnel", count: 19 },
  { name: "sécurité", count: 15 },
];

const mockContributor = {
  name: "Marie Dupont",
  username: "mariedupont",
  bio: "Designer pictogrammes SVG",
  count: 47,
  followers: 128,
};

const iconMap = {
  Alerte: Shield,
  Véhicule: Car,
  Document: FileText,
  Personnel: User,
  Carte: Map,
};

function PictoIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name as keyof typeof iconMap] || Shield;
  return <Icon className={className} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTE A — "Orbital"
// Layout orbital : hero central, sections en orbite autour d'un noyau gradient
// Asymétrie totale, cards en tailles variées, effet de profondeur
// ═══════════════════════════════════════════════════════════════════════════════
function VariantOrbital() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fond gradient mesh */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 dark:bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--dsfr-blue-france-sun)]/15 dark:bg-[var(--dsfr-blue-france-sun)]/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-[var(--dsfr-blue-france-main)]/10 dark:bg-[var(--dsfr-blue-france-main)]/5 blur-[100px]" />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* ── HERO ── */}
        <div className="relative mb-16 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-[var(--dsfr-blue-france-sun)]/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] shadow-2xl shadow-primary/30">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mt-8 text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-r from-primary via-[var(--dsfr-blue-france-main)] to-[var(--dsfr-blue-france-sun)] bg-clip-text text-transparent">
            Découvrir
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-md">
            Explorez les dernières créations, collections populaires et tendances
          </p>
        </div>

        {/* ── GRILLE ORBITALE ASYMÉTRIQUE ── */}
        <div className="grid grid-cols-12 gap-5 auto-rows-[80px]">

          {/* Derniers ajouts — grande card horizontale */}
          <div className="col-span-12 lg:col-span-8 row-span-4 group rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20 hover:bg-white/60 dark:hover:bg-white/[0.05]">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] shadow-lg shadow-primary/25">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Derniers ajouts</h2>
                <p className="text-xs text-muted-foreground">Ajoutés récemment</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {mockPictos.map((p, i) => (
                <div
                  key={i}
                  className="group/card relative flex flex-col items-center gap-3 rounded bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm border border-transparent hover:border-primary/30 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-[var(--dsfr-blue-france-sun)]/20 rounded blur-lg opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    <div className="relative w-14 h-14 rounded bg-gradient-to-br from-primary/10 to-[var(--dsfr-blue-france-sun)]/10 dark:from-primary/20 dark:to-[var(--dsfr-blue-france-sun)]/20 flex items-center justify-center">
                      <PictoIcon name={p.name} className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats rapides — colonne droite */}
          <div className="col-span-12 lg:col-span-4 row-span-2 rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] p-8 text-white shadow-2xl shadow-primary/25 flex flex-col justify-center">
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-1">Pictos</p>
            <p className="text-5xl font-black">250+</p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-2xl font-bold">30</p>
                <p className="text-xs text-white/60">collections</p>
              </div>
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-white/60">contributeurs</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1.2k</p>
                <p className="text-xs text-white/60">downloads</p>
              </div>
            </div>
          </div>

          {/* Trending — petite card */}
          <div className="col-span-12 lg:col-span-4 row-span-2 rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Tendances</h3>
            </div>
            <div className="space-y-3">
              {mockPictos.sort((a, b) => b.downloads - a.downloads).slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary/60 w-4">#{i + 1}</span>
                  <PictoIcon name={p.name} className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.downloads}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contributeur vedette — tall card */}
          <div className="col-span-12 lg:col-span-4 row-span-5 rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20">
            {/* Gradient header */}
            <div className="h-32 bg-gradient-to-br from-primary/30 via-[var(--dsfr-blue-france-sun)]/20 to-transparent relative">
              <div className="absolute -bottom-10 left-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] rounded-full blur-md opacity-50" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] ring-4 ring-background" />
                </div>
              </div>
            </div>
            <div className="p-6 pt-14">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Top contributeur</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mt-2">{mockContributor.name}</h3>
              <p className="text-sm text-muted-foreground">@{mockContributor.username}</p>
              <p className="text-sm text-muted-foreground mt-3 italic leading-relaxed">{mockContributor.bio}</p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded bg-primary/5 dark:bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-black text-primary">{mockContributor.count}</p>
                  <p className="text-[10px] text-muted-foreground">pictos</p>
                </div>
                <div className="rounded bg-primary/5 dark:bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-black text-primary">{mockContributor.followers}</p>
                  <p className="text-[10px] text-muted-foreground">followers</p>
                </div>
              </div>

              <button className="mt-6 w-full flex items-center justify-center gap-2 rounded bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Voir le profil
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collections — 2 cards côte à côte */}
          <div className="col-span-12 lg:col-span-8 row-span-3 grid grid-cols-3 gap-5">
            {mockCollections.map((col, i) => (
              <div
                key={i}
                className="group/col relative rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20 hover:-translate-y-1 cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] opacity-0 group-hover/col:opacity-100 transition-opacity" />
                <FolderOpen className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-bold text-foreground">{col.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{col.desc}</p>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-3xl font-black text-primary">{col.count}</p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/col:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>

          {/* Tags — band horizontale */}
          <div className="col-span-12 row-span-2 rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/30 dark:border-white/[0.06] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/20">
            <div className="flex items-center gap-2 mb-5">
              <Hash className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Tags populaires</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {mockTags.map((tag, i) => {
                const intensity = tag.count / 45;
                return (
                  <button
                    key={i}
                    className="group/tag relative px-5 py-2.5 rounded border border-border/60 bg-white/30 dark:bg-white/[0.03] backdrop-blur-sm text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <span className="relative z-10">{tag.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{tag.count}</span>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] rounded-b opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      style={{ transform: `scaleX(${intensity})`, transformOrigin: "left" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTE B — "Parallax Layers"
// Sections superposées avec effet de profondeur, cards qui "flottent"
// au dessus d'un fond stratifié, design éditorial premium
// ═══════════════════════════════════════════════════════════════════════════════
function VariantParallax() {
  return (
    <div className="min-h-screen">
      {/* ── HERO IMMERSIF ── */}
      <div className="relative h-[50vh] min-h-[400px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-[var(--dsfr-blue-france-sun)]/5 to-background" />
        <div className="absolute top-10 right-[10%] w-[400px] h-[400px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-0 left-[20%] w-[300px] h-[300px] rounded-full bg-[var(--dsfr-blue-france-sun)]/10 dark:bg-[var(--dsfr-blue-france-sun)]/5 blur-[80px]" />

        <div className="relative z-10 max-w-[1200px] mx-auto w-full px-8 pb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-3">Explorer</p>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] bg-clip-text text-transparent leading-[0.85]">
            Décou&shy;vrir
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Les tendances, les créations récentes et les collections qui façonnent la galerie.
          </p>
        </div>
      </div>

      {/* ── CONTENU — sections qui remontent sur le hero ── */}
      <div className="relative -mt-8 z-20 max-w-[1200px] mx-auto px-8 pb-20 space-y-6">

        {/* Row 1 : Derniers + Stats */}
        <div className="grid grid-cols-12 gap-6">
          {/* Derniers ajouts - carrousel horizontal */}
          <div className="col-span-12 lg:col-span-9 rounded bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">Derniers ajouts</h2>
            <div className="flex gap-5 overflow-x-auto pb-2 -mx-2 px-2">
              {mockPictos.map((p, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[180px] group/card rounded bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.06] dark:to-white/[0.02] border border-white/50 dark:border-white/[0.08] p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/15 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
                    <PictoIcon name={p.name} className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-bold text-foreground text-sm">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{p.time}</p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Download className="w-3 h-3" />
                    {p.downloads}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stat card - accent */}
          <div className="col-span-12 lg:col-span-3 rounded bg-gradient-to-br from-primary via-[var(--dsfr-blue-france-sun)] to-[var(--dsfr-blue-france-sun)] p-8 text-white shadow-xl shadow-primary/20 flex flex-col justify-between">
            <div>
              <Star className="w-8 h-8 text-white/60 mb-4" />
              <p className="text-6xl font-black leading-none">250</p>
              <p className="text-sm text-white/70 mt-2">pictos disponibles</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
              <Eye className="w-4 h-4" />
              <span>+23 ce mois</span>
            </div>
          </div>
        </div>

        {/* Row 2 : Contributeur + Collections côte à côte */}
        <div className="grid grid-cols-12 gap-6">
          {/* Contributeur — card horizontale premium */}
          <div className="col-span-12 lg:col-span-5 rounded bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-[var(--dsfr-blue-france-sun)]/15 to-[var(--dsfr-blue-france-sun)]/10 relative">
              <div className="absolute -bottom-8 left-8">
                <div className="w-16 h-16 rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] ring-4 ring-white dark:ring-[var(--dsfr-grey-50)] shadow-xl shadow-primary/30" />
              </div>
            </div>
            <div className="p-8 pt-12">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">{mockContributor.name}</h3>
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">@{mockContributor.username}</p>
              <p className="text-sm text-muted-foreground italic">{mockContributor.bio}</p>

              <div className="mt-5 flex gap-6">
                <div>
                  <p className="text-2xl font-black text-primary">{mockContributor.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">pictos</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-black text-primary">{mockContributor.followers}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">followers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collections — empilées verticalement */}
          <div className="col-span-12 lg:col-span-7 rounded bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">Collections à la une</h2>
            <div className="space-y-4">
              {mockCollections.map((col, i) => (
                <div
                  key={i}
                  className="group/col flex items-center gap-5 rounded bg-white/50 dark:bg-white/[0.04] border border-transparent hover:border-primary/20 p-5 transition-all duration-300 cursor-pointer hover:bg-white/70 dark:hover:bg-white/[0.06]"
                >
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/15 to-[var(--dsfr-blue-france-sun)]/15 dark:from-primary/25 dark:to-[var(--dsfr-blue-france-sun)]/25 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{col.name}</p>
                    <p className="text-xs text-muted-foreground">{col.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-primary">{col.count}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover/col:text-primary transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3 : Tags — band full-width glassmorphism */}
        <div className="rounded bg-white/70 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/40 dark:border-white/[0.08] p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">Explorer par tag</h2>
          <div className="flex flex-wrap gap-3">
            {mockTags.map((tag, i) => (
              <button
                key={i}
                className="group/tag px-5 py-3 rounded bg-gradient-to-b from-white/60 to-white/30 dark:from-white/[0.06] dark:to-white/[0.02] border border-border/50 hover:border-primary/40 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
              >
                <Hash className="inline w-3.5 h-3.5 text-primary mr-1 -mt-0.5" />
                {tag.name}
                <span className="ml-2 text-[10px] font-normal text-muted-foreground px-2 py-0.5 rounded bg-primary/10">{tag.count}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTE C — "Neon Glass"
// Esthétique néon — bordures luminescentes, cartes avec glow intense,
// fond très sombre, layout en colonne unique large
// ═══════════════════════════════════════════════════════════════════════════════
function VariantNeonGlass() {
  const maxTag = Math.max(...mockTags.map((t) => t.count));

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient noise */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 dark:bg-primary/5 blur-[150px]" />
      </div>

      <div className="max-w-[1100px] mx-auto px-6 py-16">
        {/* ── HERO ── */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded border border-primary/30 bg-primary/5 text-xs font-semibold text-primary uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Nouveautés
          </div>
          <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
            Découvrir
          </h1>
          <div className="mt-4 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)]" />
        </div>

        {/* ── DERNIERS AJOUTS — Grande grille avec glow ── */}
        <section className="mb-16">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <span className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
            Derniers ajouts
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {mockPictos.map((p, i) => (
              <div
                key={i}
                className="group/card relative rounded bg-white/50 dark:bg-white/[0.03] backdrop-blur-xl border border-border/50 dark:border-white/[0.06] p-6 transition-all duration-500 cursor-pointer hover:border-primary/40 hover:shadow-[0_0_30px_-5px] hover:shadow-primary/20"
              >
                {/* Glow ring on hover */}
                <div className="absolute -inset-px rounded bg-gradient-to-b from-primary/20 to-[var(--dsfr-blue-france-sun)]/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />

                <div className="w-14 h-14 mx-auto rounded bg-gradient-to-br from-primary/10 to-[var(--dsfr-blue-france-sun)]/10 dark:from-primary/20 dark:to-[var(--dsfr-blue-france-sun)]/20 flex items-center justify-center mb-4 group-hover/card:from-primary/20 group-hover/card:to-[var(--dsfr-blue-france-sun)]/20 transition-colors">
                  <PictoIcon name={p.name} className="w-7 h-7 text-primary" />
                </div>
                <p className="text-center text-sm font-bold text-foreground">{p.name}</p>
                <p className="text-center text-[10px] text-muted-foreground mt-1">{p.time}</p>
                <div className="mt-3 mx-auto w-fit flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/5 dark:bg-primary/10 px-2 py-1 rounded">
                  <Download className="w-3 h-3" />
                  {p.downloads}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LAYOUT 2 COLONNES — Contributeur + Collections ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          {/* Contributeur — card avec neon border */}
          <div className="relative rounded p-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent overflow-hidden">
            <div className="rounded bg-white/80 dark:bg-[var(--dsfr-grey-50)] backdrop-blur-2xl p-8 h-full">
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] rounded-full blur-md opacity-40" />
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] ring-2 ring-primary/20" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{mockContributor.name}</h3>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary uppercase">#1</span>
                  </div>
                  <p className="text-xs text-muted-foreground">@{mockContributor.username}</p>
                  <p className="text-sm text-muted-foreground italic mt-2">{mockContributor.bio}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded bg-primary/5 dark:bg-primary/10 p-4 text-center border border-primary/10">
                  <p className="text-3xl font-black text-primary">{mockContributor.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">pictos</p>
                </div>
                <div className="rounded bg-primary/5 dark:bg-primary/10 p-4 text-center border border-primary/10">
                  <p className="text-3xl font-black text-primary">{mockContributor.followers}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">followers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Collections — neon accent */}
          <div className="space-y-4">
            {mockCollections.map((col, i) => (
              <div
                key={i}
                className="group/col relative rounded p-px bg-gradient-to-r from-primary/20 to-transparent hover:from-primary/40 transition-all duration-500 cursor-pointer"
              >
                <div className="rounded bg-white/80 dark:bg-[var(--dsfr-grey-50)] backdrop-blur-2xl p-6 flex items-center gap-5">
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{col.name}</p>
                    <p className="text-xs text-muted-foreground">{col.desc}</p>
                  </div>
                  <p className="text-3xl font-black text-primary flex-shrink-0">{col.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TAGS — Barres de fréquence visuelles ── */}
        <section>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <span className="w-8 h-px bg-gradient-to-r from-primary to-transparent" />
            Tags
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mockTags.map((tag, i) => {
              const pct = (tag.count / maxTag) * 100;
              return (
                <div
                  key={i}
                  className="group/tag rounded bg-white/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/[0.06] p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-[0_0_20px_-5px] hover:shadow-primary/15"
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-foreground">{tag.name}</p>
                    <p className="text-xs text-muted-foreground">{tag.count}</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/30 dark:bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VARIANTE D — "Split Cinematic"
// Layout split-screen, grand visuel à gauche, contenu scrollable à droite
// Style cinématique, typographie expressive, whitespace généreux
// ═══════════════════════════════════════════════════════════════════════════════
function VariantCinematic() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_1.2fr]">
      {/* ── COLONNE GAUCHE — Panel fixe immersif ── */}
      <div className="hidden lg:flex relative sticky top-0 h-screen flex-col justify-between overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-[var(--dsfr-blue-france-sun)]/5 to-background" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/15 dark:bg-primary/10 blur-[120px]" />
        <div className="absolute top-[20%] right-0 w-[250px] h-[250px] rounded-full bg-[var(--dsfr-blue-france-sun)]/10 blur-[80px]" />

        <div className="relative z-10 p-12 flex-1 flex flex-col justify-center">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">Galerie Picto</p>
          <h1 className="text-7xl xl:text-8xl font-black leading-[0.9] tracking-tight">
            <span className="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent">Décou</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] bg-clip-text text-transparent">vrir.</span>
          </h1>
          <p className="mt-8 text-muted-foreground max-w-sm leading-relaxed">
            Plongez dans notre galerie de pictogrammes. Explorez les dernières créations, les collections populaires et les tendances du moment.
          </p>

          {/* Mini stats */}
          <div className="mt-12 flex gap-8">
            {[
              { value: "250+", label: "Pictos" },
              { value: "30", label: "Collections" },
              { value: "1.2k", label: "Downloads" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-black text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient fade to right */}
        <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* ── COLONNE DROITE — Contenu scrollable ── */}
      <div className="relative bg-background min-h-screen">
        <div className="p-8 lg:p-12 space-y-10">

          {/* Mobile hero */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] bg-clip-text text-transparent">Découvrir</h1>
            <p className="mt-2 text-sm text-muted-foreground">Explorez les dernières créations</p>
          </div>

          {/* ── Derniers ajouts ── */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Derniers ajouts</h2>
            <div className="space-y-3">
              {mockPictos.map((p, i) => (
                <div
                  key={i}
                  className="group/card flex items-center gap-5 rounded bg-white/40 dark:bg-white/[0.03] backdrop-blur-lg border border-border/30 dark:border-white/[0.06] p-5 transition-all duration-300 cursor-pointer hover:bg-white/70 dark:hover:bg-white/[0.06] hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded bg-gradient-to-br from-primary/10 to-[var(--dsfr-blue-france-sun)]/10 dark:from-primary/20 dark:to-[var(--dsfr-blue-france-sun)]/20 flex items-center justify-center group-hover/card:from-primary/20 group-hover/card:to-[var(--dsfr-blue-france-sun)]/20 transition-colors">
                      <PictoIcon name={p.name} className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{p.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{p.time}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{p.tag}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Download className="w-3.5 h-3.5" />
                    <span className="font-semibold text-foreground">{p.downloads}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Contributeur vedette ── */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Contributeur vedette</h2>
            <div className="rounded overflow-hidden">
              {/* Header band */}
              <div className="h-20 bg-gradient-to-r from-primary/20 via-[var(--dsfr-blue-france-sun)]/15 to-primary/5 relative">
                <div className="absolute -bottom-8 left-8">
                  <div className="w-16 h-16 rounded bg-gradient-to-br from-primary to-[var(--dsfr-blue-france-sun)] ring-4 ring-background shadow-xl shadow-primary/25" />
                </div>
              </div>
              <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-lg border border-border/30 dark:border-white/[0.06] border-t-0 rounded-b p-8 pt-12">
                <h3 className="text-xl font-black text-foreground">{mockContributor.name}</h3>
                <p className="text-xs text-muted-foreground">@{mockContributor.username}</p>
                <p className="mt-2 text-sm text-muted-foreground italic">{mockContributor.bio}</p>
                <div className="mt-5 flex gap-4">
                  <div className="px-4 py-2 rounded bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <span className="text-xl font-black text-primary">{mockContributor.count}</span>
                    <span className="text-xs text-muted-foreground ml-2">pictos</span>
                  </div>
                  <div className="px-4 py-2 rounded bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <span className="text-xl font-black text-primary">{mockContributor.followers}</span>
                    <span className="text-xs text-muted-foreground ml-2">followers</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Collections ── */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Collections</h2>
            <div className="grid grid-cols-3 gap-4">
              {mockCollections.map((col, i) => (
                <div
                  key={i}
                  className="group/col rounded bg-white/40 dark:bg-white/[0.03] backdrop-blur-lg border border-border/30 dark:border-white/[0.06] p-6 transition-all duration-300 cursor-pointer hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                >
                  <FolderOpen className="w-6 h-6 text-primary mb-3" />
                  <p className="font-bold text-foreground text-sm">{col.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{col.desc}</p>
                  <p className="text-4xl font-black text-primary mt-4">{col.count}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Tags ── */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Tags populaires</h2>
            <div className="flex flex-wrap gap-2">
              {mockTags.map((tag, i) => (
                <button
                  key={i}
                  className="px-4 py-2 rounded bg-white/40 dark:bg-white/[0.03] border border-border/30 dark:border-white/[0.06] text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all duration-300"
                >
                  {tag.name}
                  <span className="ml-1.5 text-[10px] text-muted-foreground">{tag.count}</span>
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHOWCASE — Sélecteur de variantes
// ═══════════════════════════════════════════════════════════════════════════════
const variants = [
  {
    key: "a" as const,
    label: "Orbital",
    desc: "Grille asymétrique 12-col, hero central, cards en orbite",
  },
  {
    key: "b" as const,
    label: "Parallax Layers",
    desc: "Hero immersif, sections superposées, profondeur de champ",
  },
  {
    key: "c" as const,
    label: "Neon Glass",
    desc: "Bordures luminescentes, glow intense, barres de fréquence",
  },
  {
    key: "d" as const,
    label: "Split Cinematic",
    desc: "Split-screen, panel fixe + scroll, typographie expressive",
  },
];

export function DiscoverShowcase() {
  const [variant, setVariant] = useState<"a" | "b" | "c" | "d">("a");

  return (
    <div className="min-h-screen bg-background">
      {/* ── Barre de sélection fixe ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] bg-clip-text text-transparent">
              Design Showcase — Page Découvrir
            </h1>
            <p className="text-xs text-muted-foreground">
              {variants.find((v) => v.key === variant)?.desc}
            </p>
          </div>
          <div className="flex gap-2">
            {variants.map((v) => (
              <button
                key={v.key}
                onClick={() => setVariant(v.key)}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all duration-300 ${
                  variant === v.key
                    ? "bg-gradient-to-r from-primary to-[var(--dsfr-blue-france-sun)] text-white shadow-lg shadow-primary/25"
                    : "bg-white/50 dark:bg-white/[0.04] text-foreground border border-border/50 hover:border-primary/30 hover:bg-white/70 dark:hover:bg-white/[0.06]"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="pt-[88px]">
        {variant === "a" && <VariantOrbital />}
        {variant === "b" && <VariantParallax />}
        {variant === "c" && <VariantNeonGlass />}
        {variant === "d" && <VariantCinematic />}
      </div>
    </div>
  );
}

export default DiscoverShowcase;
