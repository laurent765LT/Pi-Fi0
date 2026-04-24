# 10 — Deploiement

**Audience** : devs qui deploient, SRE, lead.
**Prerequisites** : Vercel, Railway, GitHub Actions basics.

---

## 1. Topologie

```
   Developer push
        │
        ▼
   GitHub main
        │
        ├──► Vercel (web)  ─► https://strickin-web.vercel.app
        │
        └──► Railway (api) ─► https://strickin-api.railway.app

   PR push
        │
        ├──► Vercel preview  ─► https://<branch>-strickin.vercel.app
        └──► (Sprint 2) CI GitHub Actions : lint + typecheck + tests
```

## 2. Vercel — frontend

### 2.1 Config

| Champ | Valeur |
| --- | --- |
| Projet | `strickin-web` |
| Root | `apps/web/` |
| Framework | Next.js (auto-detecte) |
| Build command | `next build` (defaut) |
| Install command | `npm install` (root monorepo) |
| Output | `.next/` |

### 2.2 Env vars

Declaration via l'UI Vercel. Scope :
- **Production** : `main` branch.
- **Preview** : toute autre branche.
- **Development** : local only.

Liste (extrait) :
- `NEXT_PUBLIC_API_URL` — URL de l'API (prod : Railway ; preview : backend
  staging).
- `NEXT_PUBLIC_USE_REAL_API=true` en prod.
- `NEXT_PUBLIC_SENTRY_DSN` — DSN Sentry web.
- `SENTRY_AUTH_TOKEN` — upload des source maps (build-time).
- `SENTRY_ORG=strickin`.
- `SENTRY_PROJECT_WEB=strickin`.
- `NEXT_PUBLIC_DEMO_MODE_ENABLED` — feature flag demo.

Voir `apps/web/.env.example` pour la liste exhaustive.

### 2.3 Preview deployments

Chaque PR cree automatiquement un deploy preview avec une URL unique
(`https://<branch>-strickin.vercel.app`). Le bot Vercel commente la PR
avec le lien.

**Utilise par :**
- QA / design review sans toucher a local.
- E2E Playwright contre la preview (Sprint 2).

### 2.4 Rollback

1. Vercel dashboard → projet → Deployments.
2. Selectionner un deploy precedent "Stable".
3. Cliquer "Promote to Production".
4. Rollback effectif en ~30 s (flip DNS).

Alternative : `vercel rollback <deployment-id>` via CLI.

## 3. Railway — backend

### 3.1 Config

| Champ | Valeur |
| --- | --- |
| Projet | `strickin-api` |
| Root | `apps/api/` |
| Dockerfile | `apps/api/Dockerfile` |
| Release command | `npx prisma migrate deploy --schema=prisma/schema.prisma` |
| Start command | `node dist/main` |

### 3.2 Env vars

Declaration via l'UI Railway. Liste (extrait) :
- `DATABASE_URL` — pooler Supabase (pgbouncer).
- `DIRECT_URL` — direct connection Supabase (migrations).
- `REDIS_URL` — Upstash.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
- `ANTHROPIC_API_KEY`.
- `SENTRY_DSN_API`.
- `AUTH_COOKIE_NAME=strickin_access`.
- `NODE_ENV=production`.

Voir `apps/api/.env.example` pour la liste exhaustive.

### 3.3 Release flow

Push sur `main` :
1. Railway detecte le changement.
2. Build du Dockerfile.
3. **Execution du release command** (`prisma migrate deploy`).
4. Si le release command echoue → deploy abandonne, l'ancien container
   continue de servir.
5. Si ok → le nouveau container demarre.
6. Railway switch le trafic (rolling, briefly deux containers actifs).

### 3.4 Rollback

1. Railway dashboard → projet → Deployments.
2. Trouver le deploy precedent.
3. Cliquer "Rollback".

**Important** : le rollback code **ne rollback pas la DB**. Si la migration
etait destructive (DROP COLUMN), un rollback code casse. Cf regle
"migrations additive-only en premier" dans [`05-data-layer.md`](./05-data-layer.md#24-strategie-de-migration).

## 4. Database migrations

### 4.1 Ordre de deploy

Pour un release qui contient une migration :

```
1. Merger la PR sur main
2. Railway declenche le build
3. Release command `prisma migrate deploy` → DB mise a jour
4. Container API redeploye → code utilise la nouvelle schema
5. Vercel deploy → frontend utilise le nouveau API
```

Si la migration echoue en etape 3 → le release est abandonne, l'ancien
container continue a servir (schema ancien).

### 4.2 Zero-downtime

Pour une migration complexe (rename, split column) :
- **Phase 1** : ajouter la nouvelle colonne, garder l'ancienne (PR1).
- **Phase 2** : code ecrit sur les deux, lit depuis la nouvelle (PR2).
- **Phase 3** : script de migration des donnees (PR3).
- **Phase 4** : code n'ecrit plus sur l'ancienne (PR4).
- **Phase 5** : drop de l'ancienne colonne (PR5, sprint suivant).

## 5. Secrets

### 5.1 Sprint 1 — 1Password vault

Vault : `Strick'in — Sprint 1`.
Contenu : tous les secrets de `.env.example`.

Process :
1. Nouveau dev rejoint → invitation 1Password.
2. Il copie les secrets dans ses `.env.local` / `.env` locaux.
3. Jamais commit.

### 5.2 Sprint 2 — Doppler

Migration vers Doppler planifiee :
- Integration Vercel + Railway native.
- Audit trail des acces.
- Rotation automatisable.
- Environnements (dev, staging, prod) proprement isoles.

Voir [ADR 0010](./decisions/0010-sentry-over-logrocket.md) (contexte
monitoring) et ticket Sprint 2 infra.

### 5.3 Jamais dans git

- `.env*` git-ignored (sauf `.env.example`).
- `.env.example` contient **uniquement** des placeholders (`xxx`, `changeme`).
- CI check : bloquer un commit qui contient un pattern secret (regex sur
  keys connus Anthropic `sk-ant-`, Supabase `eyJ...` service_role).

## 6. CI/CD

### 6.1 Etat Sprint 1

Aucun pipeline. Deploys = `git push main`.
Risques :
- Un merge qui casse le typecheck **peut** partir en prod.
- Pas de tests executes automatiquement.

### 6.2 Plan Sprint 2 — GitHub Actions

```yaml
name: ci
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint --workspaces --if-present
      - run: npx tsc --noEmit --workspaces --if-present
      - run: npm run test --workspaces --if-present
      - run: npm run build
```

Un PR ne peut merger qu'apres succes du pipeline.

### 6.3 Plan Sprint 3 — E2E sur preview

Apres deploy Vercel preview : run Playwright contre l'URL preview.
Resultat comment sur la PR.

## 7. Environnements

| Env | Frontend URL | Backend URL | DB | Utilisation |
| --- | --- | --- | --- | --- |
| Dev | `localhost:3000` | `localhost:4000` | Docker compose local | Developpement |
| Preview | `<branch>-strickin.vercel.app` | Staging Railway (Sprint 2) | Staging Supabase | Review PR |
| Prod | `strickin-web.vercel.app` (puis custom domain) | `strickin-api.railway.app` | Supabase production | Clients |

Sprint 2 : ajout d'un environnement **staging** stable (pas prod, pas PR)
pour des demos et des tests QA de pre-release.

## 8. Rollback strategy

### 8.1 Cas simple : bug front

Vercel dashboard → Rollback vers deploy precedent.

### 8.2 Cas simple : bug api sans migration

Railway → Rollback vers deploy precedent.

### 8.3 Cas complex : bug + migration

1. Identifier si la migration est retrocompatible (additive-only).
2. Si oui : rollback du container only.
3. Si non : git revert de la migration + commit a vide pour forcer un
   nouveau deploy + rollback manuel DB.

Voir [`runbook-incidents.md`](../runbook-incidents.md) scenario E.

### 8.4 Cas critique : attaque

1. Disable write endpoints via feature flag (Sprint 2 — on expose un
   `DISABLE_WRITES` env var).
2. Rotate immediately : `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` →
   invalide toutes les sessions.
3. Rotate Supabase service key.
4. Forensics sur Sentry + AuditLog.

## 9. Domaine + DNS

Sprint 1 : `strickin-web.vercel.app` (URL Vercel).
Sprint 2 : custom domain `app.strickin.fr` (achat + DNS via Cloudflare).
- Record A/AAAA → Vercel.
- Record `api.strickin.fr` CNAME → Railway.
- HSTS + CAA records.

## 10. Monitoring deploy

- Sentry release creee a chaque push (via `SENTRY_AUTH_TOKEN`).
- Slack `#deploys` (Sprint 2) : webhook Vercel + Railway → message
  "Deploy <app> <sha> success/failed".
- `/health` + `/ready` pinge par Railway automatique.

## 11. Runbook post-deploy

Apres chaque deploy :

1. Verifier `/ready` retourne 200.
2. Ouvrir Sentry Issues — verifier pas de nouvelle erreur.
3. Logger un event Slack avec la SHA.
4. Suivre metric error rate 30 min.

En cas de spike :
- Rollback immediatement.
- Ouvrir un incident (post-mortem).

## 12. Fichiers de reference

- `apps/api/Dockerfile`
- `apps/web/vercel.json`
- `apps/api/.env.example`
- `apps/web/.env.example`
- `docker-compose.yml` (dev local)
- `docs/infra.md` (inventaire complet)
