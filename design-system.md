# Design System — Galerie Picto (DSFR Tricolore)

## Identité visuelle
- **Style** : DSFR-inspired, monochrome bleu/gris avec accents tricolores (Bleu France / Rouge Marianne)
- **Fond** : Blanc (`#fff`) avec blobs animés tricolores en arrière-plan (HomePage)
- **Police** : Inter Variable — font-black pour titres, font-extrabold pour noms, font-medium pour body
- **Dot grid pattern** : `radial-gradient(#000 1px, transparent 1px)` à 32px, opacity-[0.03]
- **Dark mode** : Complet, via classe `.dark` + CSS custom properties

## Palette de couleurs

### Tokens principaux (CSS custom properties)
```css
/* Surfaces */
--background: #fff (light) / #161616 (dark)
--card: #fff (light) / #1e1e1e (dark)
--foreground: #161616 (light) / #e5e5e5 (dark)

/* Primary : Blue France */
--primary: #6a6af4 (blue-france-main)
--primary-hover: #9898f8
--primary-active: #aeaef9
--primary-foreground: #ffffff

/* Tertiary : Blue France Sun */
--tertiary: #000091 (light) / #8585f6 (dark)

/* Secondary & Muted */
--secondary: #f6f6f6 (light) / #2a2a2a (dark)
--muted-foreground: #666 (light) / #929292 (dark)

/* Accent */
--accent: #e3e3fd (light) / #1b1b35 (dark)

/* Destructive */
--destructive: #c9191e (light) / #e06670 (dark)

/* Borders */
--border: #ddd (light) / rgba(255,255,255,0.1) (dark)
--input: #ddd (light) / rgba(255,255,255,0.12) (dark)
--ring: #6a6af4
```

### Gradients
```css
--gradient-primary: linear-gradient(to right, #6a6af4, #7a6b9a, #c83f49)  /* Tricolore bleu→rouge */
--gradient-blob-warm: linear-gradient(to top right, #fddede, #c83f49)      /* Blob rouge */
--gradient-blob-cool: linear-gradient(to top right, #e3e3fd, #6a6af4)      /* Blob bleu */
--gradient-blob-mid: linear-gradient(to top right, #ececfe, #adadf9)        /* Blob violet doux */
```

### Badges sémantiques
```css
/* Default (tags) — bleu clair */
--color-badge-bg: #ececfe / rgba(133,133,246,0.15)
--color-badge-border: blue-france-850 / rgba(133,133,246,0.3)
--color-badge-text: #6a6af4 / #adadf9

/* Download — rouge */
--color-badge-download-bg: #fee9e9 / rgba(249,90,92,0.15)
--color-badge-download-text: #c9191e / #e06670

/* File size — amber (inline, pas de token) */
bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400
```

## Typographie

### Hiérarchie
| Niveau | Classes | Usage |
|--------|---------|-------|
| Display | `text-5xl md:text-7xl font-black tracking-tighter leading-[1.1]` | Hero headline |
| H1 | `text-3xl font-black tracking-tight` | Section headers |
| H2 | `text-2xl font-extrabold` | Sous-titres |
| Card title | `text-sm font-extrabold leading-tight` | Noms de pictogrammes |
| Body | `text-sm font-medium` | Description, body copy |
| Meta | `text-xs text-muted-foreground` | Timestamps, metadata |
| Micro | `text-[10px] font-bold` | Badges taille, compteurs |

### Accent gradient (titres)
```tsx
<span className="bg-gradient-to-r from-[#6a6af4] via-[#7a6b9a] to-[#c83f49] bg-clip-text text-transparent">
  texte tricolore
</span>
```

## Composants

### Card (base shadcn/ui)
```tsx
/* Card de base */
<Card className="ring-foreground/5 bg-card text-card-foreground gap-4 overflow-hidden rounded-xl py-4 text-xs/relaxed ring-1">

/* PictoCard — shadow custom + lift hover */
<Card className="group relative overflow-hidden rounded-xl bg-card transition-all duration-300 cursor-pointer
  shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)]
  hover:-translate-y-1.5
  hover:shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)]">
```

### Boutons (CVA variants)
```tsx
/* Variants disponibles */
default:     "bg-primary text-primary-foreground hover:bg-(--primary-hover)"
outline:     "border-border dark:bg-white/[0.04] hover:bg-accent"
secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80"
ghost:       "hover:bg-muted hover:text-foreground dark:hover:bg-white/[0.06]"
destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20"
tertiary:    "bg-tertiary text-tertiary-foreground hover:bg-(--tertiary-hover)"

/* Tailles */
default: "h-9 gap-2 px-4"
xs:      "h-7 gap-1 rounded-sm px-2.5 text-xs"
sm:      "h-8 gap-1.5 px-3 text-sm"
lg:      "h-10 gap-2 px-6"
icon:    "size-9"
icon-sm: "size-8"
icon-xs: "size-7 rounded-sm"

/* Quick action button (dans PictoCard) */
<Button size="sm" variant="secondary"
  className="h-8 w-8 p-0 rounded bg-background shadow-md border border-border hover:shadow-lg transition-all" />
```

### Badges (CVA variants)
```tsx
/* Base */
"h-5 gap-1 rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium"

/* Variants */
default:     "bg-primary text-primary-foreground"
secondary:   "bg-secondary text-secondary-foreground dark:bg-white/[0.06]"
destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20"
outline:     "border-border text-foreground bg-input/20 dark:bg-input/30"

/* Badge taille fichier (inline, PictoCard) */
<span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold
  dark:bg-amber-900/30 dark:text-amber-400">
  1.2 KB
</span>

/* Like button (PictoCard) */
<button className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full transition-all
  ${hasLiked ? 'text-primary-foreground bg-primary' : 'text-muted-foreground hover:bg-muted'}">
```

### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.7);    /* light */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.dark .glass {
  background: rgba(255, 255, 255, 0.04);   /* dark */
  border: 1px solid rgba(255, 255, 255, 0.06);
}
```

### Favoris (coeur)
```tsx
<Heart className="h-5 w-5 drop-shadow-sm transition-colors"
  style={isFavorite
    ? { color: "var(--destructive)", fill: "var(--destructive)" }
    : { color: "var(--muted-foreground)" }
  } />
/* Apparition : opacity-0 scale-75 → group-hover:opacity-100 group-hover:scale-100 */
```

## Spacing & Scale

### Radii
```
--radius: 0.75rem (12px) — base
rounded-sm   = 8px   — boutons xs, icônes mini
rounded-md   = 10px
rounded-lg   = 12px  — boutons standard, inputs
rounded-xl   = 16px  — cards
rounded-2xl  = 20px  — mosaïque items, grandes cards
rounded-3xl  = 24px  — sections décoratives
rounded-full          — badges, pills, avatars
```

### Padding & gaps récurrents
```
gap-1    (4px)   — entre icône et texte dans badge
gap-1.5  (6px)   — entre éléments dans une ligne meta
gap-2    (8px)   — sidebar items, petits groupes
gap-4    (16px)  — entre sections de card
gap-5/6  (20-24px) — grille de pictogrammes
px-2 py-0.5      — badges, mini buttons
px-3.5 pb-3 pt-2.5 — footer de PictoCard
p-6              — zone image PictoCard (normal)
p-2              — zone image PictoCard (compact)
```

## Shadows & Depth

### Stratégie : Shadows + borders subtiles + surface shift
```
/* Repos */
shadow-[0_4px_16px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.04)]  — cards picto

/* Hover */
shadow-[0_20px_60px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.05)] — cards picto hover
hover:-translate-y-1.5                                               — lift physique

/* Petits éléments */
shadow-sm  — badges privés, quick action au repos
shadow-md  — quick action buttons
shadow-lg  — hover quick action, icon containers

/* Dark mode glow */
[data-slot="button"][data-variant="default"]:hover → box-shadow: 0 0 20px rgba(133,133,246,0.25)
[data-slot="card"]:hover → box-shadow: 0 0 30px rgba(133,133,246,0.05) + border-color: rgba(133,133,246,0.15)
```

### Ring pour cards
```tsx
ring-1 ring-foreground/5  /* ring très subtile sur Card de base */
```

## Animations

### Transitions composants
```css
[data-slot="card"], [data-slot="button"], [data-slot="dialog-content"], [data-slot="badge"] {
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, color 0.15s ease;
}
```

### Hover reveals (PictoCard)
```
/* Actions droite — slide in */
opacity-0 translate-x-4 → group-hover:opacity-100 group-hover:translate-x-0 duration-300

/* Actions bas — slide up */
opacity-0 translate-y-2 → group-hover:opacity-100 group-hover:translate-y-0 duration-300

/* Favori — scale in */
opacity-0 scale-75 → group-hover:opacity-100 group-hover:scale-100

/* Image zoom */
group-hover:scale-110 duration-300
```

### Blobs décoratifs (HomePage)
```css
@keyframes blob {
  0%, 100% { transform: scale(1) rotate(0deg); }
  33% { transform: scale(1.1) rotate(60deg); }
  66% { transform: scale(0.9) rotate(-30deg); }
}
.animate-blob { animation: blob 12s ease-in-out infinite; }
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
```

## Icônes
- **Bibliothèque** : Lucide React
- **Tailles** : `size-2.5` (badges), `size-3.5` (meta), `size-4` (boutons), `size-5` (actions)
- **Style** : Inherit color du parent, `shrink-0` en flex
- **Favoris** : `fill-destructive` quand actif
- **Like** : `fill-primary-foreground` quand actif

## Responsive
```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5     — grille normale
grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 — compact
text-5xl md:text-7xl — headlines responsive
gap-5 sm:gap-6       — grille gaps
```

## Tech Stack
- React 19 + TypeScript 5.9
- Tailwind CSS 4 + shadcn/ui (data-slot + CVA)
- framer-motion (animations complexes)
- lucide-react (icônes)
- @fontsource-variable/inter
