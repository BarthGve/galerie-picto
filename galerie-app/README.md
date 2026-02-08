# 🎨 Galerie Pictogrammes

Galerie de pictogrammes SVG hébergée sur GitHub Pages avec auto-update 2 fois par jour depuis un CDN Minio.

## ✨ Fonctionnalités

- 🖼️ **Galerie responsive** - Grid adaptatif de pictogrammes
- 🔍 **Recherche en temps réel** - Filtrage instantané par nom
- ⬇️ **Téléchargement multi-format** :
  - SVG (format natif)
  - PNG (128px, 256px, 512px, 1024px)
- 📋 **Copie rapide** - Copier le code SVG dans le clipboard
- 🔄 **Auto-update** - Synchronisation automatique 2x/jour (8h et 20h)
- 🎨 **Design moderne** - ShadCN UI avec thème Mira + Cyan

## 🚀 Stack Technique

- **Frontend** : Vite + React + TypeScript
- **UI** : ShadCN UI (style Mira, thème Cyan)
- **Icônes** : Lucide React
- **CDN** : Minio (S3-compatible)
- **Hébergement** : GitHub Pages
- **CI/CD** : GitHub Actions

## 🛠️ Installation

```bash
# Clone le repo
git clone https://github.com/BarthGve/galerie-picto.git
cd galerie-picto/galerie-app

# Installer les dépendances
pnpm install

# Lancer en dev
pnpm dev

# Build pour production
pnpm build
```

## 🔧 Configuration

### GitHub Secrets

Configure les secrets suivants dans Settings → Secrets and variables → Actions :

- `MINIO_ENDPOINT` : URL de ton endpoint Minio (ex: `https://cdn.kerjean.net`)
- `MINIO_ACCESS_KEY` : Clé d'accès Minio
- `MINIO_SECRET_KEY` : Clé secrète Minio
- `MINIO_BUCKET` : Nom du bucket (ex: `media`)
- `MINIO_PREFIX` : Préfixe du chemin (ex: `artwork/pictograms/`)

### GitHub Pages

1. Va dans Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `gh-pages` / `root`
4. Sauvegarde

L'URL sera : `https://[username].github.io/galerie-picto/`

## 📅 Auto-Update

La galerie se met automatiquement à jour **2 fois par jour** :
- **8h00** (heure de Paris)
- **20h00** (heure de Paris)

Tu peux aussi déclencher manuellement via Actions → "Update Pictograms Gallery" → Run workflow.

## 📝 Workflow

1. **Ajoute** un nouveau pictogramme SVG sur ton CDN Minio
2. **Attends** le prochain cron (8h ou 20h) OU déclenche manuellement
3. **Voilà !** La galerie est mise à jour automatiquement

## 🏗️ Architecture

```
galerie-app/
├── src/
│   ├── components/
│   │   ├── PictoCard.tsx       # Card individuelle
│   │   ├── PictoGrid.tsx       # Grille de pictos
│   │   ├── PictoModal.tsx      # Modal détails + download
│   │   └── SearchBar.tsx       # Recherche/filtrage
│   ├── hooks/
│   │   └── usePictograms.ts    # Hook de chargement
│   ├── lib/
│   │   ├── svg-to-png.ts       # Conversion SVG → PNG
│   │   ├── types.ts            # Types TypeScript
│   │   └── utils.ts            # Utilitaires
│   └── App.tsx
├── scripts/
│   └── fetch-pictograms.js     # Script Minio (GitHub Action)
├── .github/workflows/
│   └── update-gallery.yml      # CI/CD auto-update
└── public/
    └── pictograms-manifest.json # Manifest généré
```

## 🔐 Sécurité

⚠️ **Important** : Ne commit JAMAIS les credentials Minio dans le code !

- Utilise exclusivement GitHub Secrets
- Après setup, considère régénérer les credentials
- Crée un utilisateur read-only dédié pour la galerie

## 📄 Licence

MIT

---

Développé avec ❤️ par Bruno et l'équipe BMAD
