# Design System — Galerie Picto (Vibe: Playful Gradient)

## Visual Identity
- **Style**: Playful, vibrant, creative agency feel
- **Background**: White with animated gradient blobs (amber/rose + indigo/cyan)
- **Typography**: Font-extrabold for headlines, font-medium for body, tracking-tight
- **Dot grid pattern**: `radial-gradient(#000 1px, transparent 1px)` at 32px, opacity-[0.03]

## Color Palette
- **Primary gradient**: `from-rose-500 via-fuchsia-600 to-indigo-600` (headline accent, italic)
- **CTA button**: `bg-slate-900` with hover overlay `from-rose-500 to-fuchsia-600`
- **Badge**: `bg-amber-100 border-amber-200 text-amber-700`
- **GitHub card**: `bg-gradient-to-br from-indigo-50 to-white border-indigo-100`
- **Accent text**: `text-indigo-600`
- **Text main**: `text-slate-900`
- **Text muted**: `text-slate-600`
- **Text subtle**: `text-slate-400`
- **Stats border**: `border-slate-100`

## Decorative Elements
- **Blobs**: Large rounded-full elements with blur-3xl, opacity-40, animated scale+rotate
  - Top-right: `from-amber-300 to-rose-400`
  - Bottom-left: `from-indigo-300 to-cyan-400`
- **Floating cards**: White bg, rounded-2xl, shadow-2xl, border-slate-100, animated y+rotate

## Component Patterns

### Badge
```tsx
<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 font-bold text-sm tracking-wide uppercase">
  <Sparkles className="w-4 h-4" />
  100% Gratuit
</div>
```

### Headline
```tsx
<h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
  Vos pictogrammes, <br />
  <span className="bg-gradient-to-r from-rose-500 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent italic">
    prêts à l'emploi
  </span>
</h1>
```

### CTA Button
```tsx
<button className="group relative px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95">
  <span className="relative z-10 flex items-center gap-2">
    Explorer la galerie
    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
  </span>
  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity" />
</button>
```

### Feature Card (GitHub callout style)
```tsx
<div className="relative p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-xl overflow-hidden group">
  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
    <Github className="w-24 h-24 rotate-12" />
  </div>
  <div className="relative z-10 space-y-3">
    <div className="flex items-center gap-2 text-indigo-600 font-bold">
      <Github className="w-5 h-5" />
      Bonus GitHub
    </div>
    <p className="text-slate-600 text-sm font-medium max-w-xs">
      Connectez-vous avec GitHub pour débloquer <span className="text-indigo-600">favoris</span>, <span className="text-indigo-600">upload</span> et <span className="text-indigo-600">collections</span> personnalisées.
    </p>
    <button className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
      Se connecter maintenant <ArrowRight className="w-4 h-4" />
    </button>
  </div>
</div>
```

### Stats Row
```tsx
<div className="flex gap-8 pt-4 border-t border-slate-100">
  <div>
    <div className="text-2xl font-black text-slate-900">15+</div>
    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Collections</div>
  </div>
  ...
</div>
```

### Icon Marquee (scrolling icons)
- Rows of icon cards: `w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl shadow-sm border border-slate-100`
- Hover: `hover:scale-110 hover:shadow-xl`
- Icon color: `text-slate-400` → hover `text-indigo-500`
- Rows tilted: `-rotate-6 scale-110`
- Alternating scroll directions via framer-motion

### Floating Element
- White card with gradient icon (`from-amber-400 to-rose-500`)
- Animated y bounce + slight rotate
- Color dot row: rose-500, amber-400, indigo-600, emerald-500

## Spacing & Scale (Balanced)
- Section padding: `px-6 py-12 md:py-24`
- Max width: `max-w-7xl`
- Grid: `grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8`
- Content spacing: `space-y-8`

## Animations (framer-motion)
- Staggered fade-up: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}` with increasing delay
- Scale-in for cards: `initial={{ opacity: 0, scale: 0.9 }}`
- Blob pulse: `animate={{ scale: [1, 1.1, 1], rotate: [0, ±90, 0] }}` duration 12s infinite
- Floating elements: `animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}` duration 4s infinite

## Tech Stack
- React 19 + TypeScript 5.9
- Tailwind CSS 4
- framer-motion
- lucide-react for icons
