# 🚀 Déploiement sur Vercel

Guide complet pour déployer la galerie de pictogrammes sur Vercel (frontend + backend).

## 🎯 Pourquoi Vercel?

- ✅ **Hébergement frontend** + **API backend** sur une seule plateforme
- ✅ Gratuit pour projets personnels
- ✅ Déploiement automatique sur chaque push
- ✅ CDN global ultra-rapide
- ✅ Preview deployments pour chaque branche
- ✅ Plus simple que GitHub Pages + Vercel Functions séparés

## 📋 Prérequis

1. **Compte Vercel** (gratuit): https://vercel.com/signup
2. **GitHub OAuth App** créée (voir UPLOAD_SETUP.md section 1)

## 🚀 Déploiement initial

### 1. Installer Vercel CLI

```bash
npm i -g vercel
```

### 2. Se connecter à Vercel

```bash
vercel login
```

### 3. Déployer depuis le dossier galerie-app

```bash
cd galerie-app
vercel
```

Répondre aux questions:
- **Set up and deploy?** → Yes
- **Which scope?** → Ton compte personnel
- **Link to existing project?** → No
- **Project name?** → galerie-picto (ou autre)
- **Directory?** → `./` (on est déjà dans galerie-app)
- **Override settings?** → No

Vercel va détecter automatiquement Vite et déployer! 🎉

### 4. Configurer les variables d'environnement

Sur le dashboard Vercel (https://vercel.com/dashboard), aller dans ton projet → Settings → Environment Variables:

#### Frontend
| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_GITHUB_CLIENT_ID` | Ton Client ID | Production, Preview, Development |

#### Backend
| Variable | Value | Environments |
|----------|-------|--------------|
| `GITHUB_CLIENT_SECRET` | Ton Client Secret | Production, Preview, Development |
| `GITHUB_ALLOWED_USERNAME` | `BarthGve` | Production, Preview, Development |
| `GITHUB_REPO_OWNER` | `BarthGve` | Production, Preview, Development |
| `GITHUB_REPO_NAME` | `galerie-picto` | Production, Preview, Development |
| `MINIO_ENDPOINT` | `cdn.kerjean.net` | Production, Preview, Development |
| `MINIO_ACCESS_KEY` | `admin` | Production, Preview, Development |
| `MINIO_SECRET_KEY` | `2Usm1KxV3lcxFHOEQemu1cSG` | Production, Preview, Development |
| `MINIO_BUCKET` | `media` | Production, Preview, Development |
| `MINIO_PREFIX` | `artwork/pictograms` | Production, Preview, Development |

### 5. Mettre à jour l'OAuth App GitHub

Retourner sur https://github.com/settings/developers et mettre à jour:
- **Homepage URL**: `https://ton-projet.vercel.app`
- **Authorization callback URL**: `https://ton-projet.vercel.app/`

### 6. Redéployer pour prendre en compte les env vars

```bash
vercel --prod
```

## 🔄 Déploiement automatique

Une fois configuré, Vercel déploie automatiquement:
- ✅ **Push sur main** → Déploiement en production
- ✅ **Push sur autre branche** → Preview deployment
- ✅ **Pull Request** → Preview deployment avec URL unique

## 📦 Architecture finale

```
┌─────────────────────────────────────────┐
│           Vercel Hosting                │
│  ┌────────────────────────────────────┐ │
│  │   Frontend (React + Vite)          │ │
│  │   https://galerie-picto.vercel.app │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │   Backend (Serverless Functions)   │ │
│  │   /api/auth/*                      │ │
│  │   /api/upload/*                    │ │
│  │   /api/trigger-update              │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
            │                   │
            ↓                   ↓
    ┌──────────────┐    ┌──────────────┐
    │  Minio CDN   │    │  GitHub API  │
    │  (Fichiers)  │    │  (Workflow)  │
    └──────────────┘    └──────────────┘
```

## 🎨 GitHub Actions

Le workflow GitHub reste actif pour:
- ✅ Synchroniser les pictogrammes 2x/jour (8h et 20h)
- ✅ Régénérer le manifest JSON
- ✅ Être déclenché après un upload

**Note**: Le workflow ne déploie plus sur GitHub Pages, mais régénère juste le manifest qui sera récupéré par Vercel au prochain build.

## ✅ Test final

1. Ouvrir https://ton-projet.vercel.app
2. Cliquer sur "Login with GitHub"
3. Autoriser l'application
4. Cliquer sur "Ajouter un pictogramme"
5. Upload un SVG test
6. Attendre 30 secondes → refresh automatique
7. Le nouveau picto apparaît! 🎉

## 🔧 Commandes utiles

```bash
# Voir les logs en temps réel
vercel logs

# Lister les déploiements
vercel list

# Supprimer un déploiement
vercel remove [deployment-url]

# Voir les variables d'environnement
vercel env ls

# Ajouter une variable d'environnement
vercel env add
```

## 🎯 Avantages vs GitHub Pages

| Fonctionnalité | GitHub Pages | Vercel |
|----------------|--------------|--------|
| Frontend static | ✅ | ✅ |
| API backend | ❌ | ✅ |
| CDN global | ✅ | ✅ |
| HTTPS auto | ✅ | ✅ |
| Déploiement auto | ✅ | ✅ |
| Preview branches | ❌ | ✅ |
| Analytics | ❌ | ✅ |
| Edge functions | ❌ | ✅ |
| Custom domain | ✅ | ✅ |

## 🎊 C'est tout!

Plus besoin de GitHub Pages, tout est centralisé sur Vercel. Plus simple, plus rapide, plus puissant!
