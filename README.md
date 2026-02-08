# 🎨 Galerie Pictogrammes

Galerie de pictogrammes SVG hébergée sur Railway (frontend + backend) avec auto-update 2 fois par jour depuis un CDN Minio.

## ✨ Fonctionnalités

- 🖼️ **Galerie responsive** - Grid adaptatif de pictogrammes
- 🔍 **Recherche en temps réel** - Filtrage instantané par nom
- ⬇️ **Téléchargement multi-format** :
  - SVG (format natif)
  - PNG (128px, 256px, 512px, 1024px)
- 📋 **Copie rapide** - Copier le code SVG dans le clipboard
- 📤 **Upload authentifié** - Upload de nouveaux pictogrammes via GitHub OAuth
- 🏷️ **Métadonnées enrichies** - Ajout automatique de title, description, tags, author
- 🔄 **Auto-update** - Synchronisation automatique 2x/jour (8h et 20h)
- 🎨 **Design moderne** - ShadCN UI avec thème Mira + Cyan

## 🚀 Stack Technique

- **Frontend** : Vite + React + TypeScript
- **Backend** : Railway Serverless Functions
- **UI** : ShadCN UI (style Mira, thème Cyan)
- **Icônes** : Lucide React
- **CDN** : Minio (S3-compatible)
- **Hébergement** : Railway (frontend + backend)
- **CI/CD** : Railway (auto-deploy) + GitHub Actions (sync pictos)

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

## 🔧 Configuration & Déploiement

### Déploiement sur Railway

📘 **Guide complet**: Voir [UPLOAD_SETUP.md](./UPLOAD_SETUP.md)

**En bref:**
1. Connecter votre repo GitHub à Railway via le dashboard
2. Railway détectera automatiquement la configuration Vite
3. Configurer les variables d'environnement dans Railway
4. Mettre à jour l'OAuth App GitHub avec l'URL Railway

L'URL sera : `https://galerie-picto.railway.app` (ou ton custom domain)

### GitHub Secrets (pour le workflow de sync)

Configure les secrets suivants dans Settings → Secrets and variables → Actions :

- `MINIO_ENDPOINT` : URL de ton endpoint Minio (ex: `https://cdn.kerjean.net`)
- `MINIO_ACCESS_KEY` : Clé d'accès Minio
- `MINIO_SECRET_KEY` : Clé secrète Minio
- `MINIO_BUCKET` : Nom du bucket (ex: `media`)
- `MINIO_PREFIX` : Préfixe du chemin (ex: `artwork/pictograms/`)

## 📅 Auto-Update

La galerie se met automatiquement à jour **2 fois par jour** :
- **8h00** (heure de Paris)
- **20h00** (heure de Paris)

Tu peux aussi déclencher manuellement via Actions → "Update Pictograms Gallery" → Run workflow.

## 📝 Workflow

### Option 1: Upload via l'interface (recommandé)

1. **Connecte-toi** avec ton compte GitHub (BarthGve uniquement)
2. **Clique** sur "Ajouter un pictogramme"
3. **Sélectionne** ton fichier SVG
4. **Ajoute** les métadonnées (titre, description, catégorie, tags)
5. **Upload** - le fichier est envoyé sur le CDN et le workflow se déclenche automatiquement
6. **Attends 30 secondes** - la page se recharge et ton picto apparaît! 🎉

📘 Voir [UPLOAD_SETUP.md](./UPLOAD_SETUP.md) pour la configuration complète

### Option 2: Upload manuel sur le CDN

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
│   │   ├── SearchBar.tsx       # Recherche/filtrage
│   │   ├── LoginButton.tsx     # Auth GitHub OAuth
│   │   └── UploadDialog.tsx    # Upload + métadonnées
│   ├── hooks/
│   │   └── usePictograms.ts    # Hook de chargement
│   ├── lib/
│   │   ├── svg-to-png.ts       # Conversion SVG → PNG
│   │   ├── svg-metadata.ts     # Enrichissement SVG
│   │   ├── github-auth.ts      # OAuth client
│   │   ├── upload.ts           # Upload vers CDN
│   │   ├── types.ts            # Types TypeScript
│   │   └── utils.ts            # Utilitaires
│   └── App.tsx
├── api/
│   ├── auth/
│   │   ├── github.ts           # Railway: OAuth token exchange
│   │   └── verify.ts           # Railway: Permission check
│   └── upload/
│       └── presigned-url.ts    # Railway: Presigned URL Minio
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
