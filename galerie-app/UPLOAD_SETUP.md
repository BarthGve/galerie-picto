# 🚀 Configuration Upload Feature

Guide rapide pour activer la fonctionnalité d'upload de pictogrammes.

## 1. Créer une GitHub OAuth App

1. Aller sur https://github.com/settings/developers
2. Cliquer sur "New OAuth App"
3. Remplir:
   - **Application name**: Galerie Pictogrammes
   - **Homepage URL**: `https://votre-app.vercel.app`
   - **Authorization callback URL**: `https://votre-app.vercel.app/`
4. Copier le **Client ID** et générer un **Client Secret**

## 2. Configurer les variables d'environnement

### Frontend (.env local)

Créer un fichier `.env` dans `galerie-app/`:

```bash
VITE_GITHUB_CLIENT_ID=ghp_your_client_id
```

### Backend (Vercel Project Settings)

Dans Vercel Project Settings > Environment Variables, ajouter:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GITHUB_CLIENT_ID` | Votre Client ID | Production, Preview, Development |
| `GITHUB_CLIENT_SECRET` | Votre Client Secret | Production, Preview, Development |
| `GITHUB_ALLOWED_USERNAME` | `BarthGve` | Production, Preview, Development |
| `GITHUB_REPO_OWNER` | `BarthGve` | Production, Preview, Development |
| `GITHUB_REPO_NAME` | `galerie-picto` | Production, Preview, Development |
| `MINIO_ENDPOINT` | `cdn.kerjean.net` | Production, Preview, Development |
| `MINIO_ACCESS_KEY` | `admin` | Production, Preview, Development |
| `MINIO_SECRET_KEY` | `2Usm1KxV3lcxFHOEQemu1cSG` | Production, Preview, Development |
| `MINIO_BUCKET` | `media` | Production, Preview, Development |
| `MINIO_PREFIX` | `artwork/pictograms` | Production, Preview, Development |

## 3. Déployer sur Vercel

```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Se connecter
vercel login

# Déployer
cd galerie-app
vercel
```

Suivre les instructions et sélectionner votre projet.

## 4. Mettre à jour l'OAuth App

Une fois déployé, retourner dans les GitHub OAuth App settings et mettre à jour:
- **Homepage URL**: `https://votre-app-reelle.vercel.app`
- **Authorization callback URL**: `https://votre-app-reelle.vercel.app/`

## 5. Tester

1. Ouvrir l'application déployée
2. Cliquer sur "Login with GitHub"
3. Autoriser l'application
4. Le bouton "Ajouter un pictogramme" devrait apparaître
5. Upload un SVG test

## Architecture

```
Frontend (React)
  ↓ GitHub OAuth
  ↓
Vercel Functions (API Routes)
  ├─ /api/auth/github → Échange code vs token
  ├─ /api/auth/verify → Vérifie permission
  ├─ /api/upload/presigned-url → Génère URL Minio
  └─ /api/trigger-update → Déclenche workflow GitHub
       ↓
Minio CDN (cdn.kerjean.net)
  └─ bucket: media/artwork/pictograms/
       ↓
GitHub Action (update-gallery.yml)
  └─ Régénère manifest + rebuild + déploie
```

## Sécurité

- ✅ Seul l'utilisateur `BarthGve` peut uploader
- ✅ Upload direct vers Minio via presigned URL (pas de transit serveur)
- ✅ Métadonnées enrichies automatiquement dans le SVG
- ✅ Token GitHub stocké en localStorage (rotation automatique)

## Workflow après upload

1. ✅ User upload un SVG via l'interface
2. ✅ Le fichier est ajouté à `media/artwork/pictograms/` sur le CDN
3. ✅ **Le workflow GitHub est déclenché automatiquement** via l'API
4. ✅ Le workflow fetch les pictograms, génère le manifest, build et déploie
5. ✅ Après ~30 secondes, la page se recharge avec le nouveau pictogramme visible

**C'est automatique !** Plus besoin d'attendre le cron (8h/20h) ou de déclencher manuellement. 🎉

Note: Le GitHub Action s'exécute aussi automatiquement 2x/jour (8h et 20h) pour synchroniser les pictogrammes ajoutés manuellement sur le CDN.
