# ADR 0009 — JWT avec rotation refresh token

## Status
Accepted — 2026-03-08

## Context

Strick'in doit authentifier :
- Les CGPs (logins reguliers depuis un navigateur).
- Les admins.
- Les clients CLI (a terme).
- Eventuellement une app mobile (Sprint 4+).

Choix a faire :
- **Session-based** (cookie session_id + table sessions en DB).
- **JWT stateless** (token auto-porteur).
- **Opaque token** (Redis-backed, similaire a OAuth introspection).

Trade-offs :
- Session-based : simple a revoquer, scale mal (hit DB a chaque request).
- JWT stateless : scale bien, dur a revoquer (il faut une blacklist).
- Opaque token : scale moyen, revoke facile, necessite introspect a
  chaque requete.

Duree de vie :
- Access token courte (15 min) — minimise la fenetre si vol.
- Refresh token longue (30 jours) — UX (user reste logue).
- Rotation : invalider le refresh a chaque usage.

## Decision

Utiliser **JWT HS256** avec une rotation de refresh tokens :

- **Access token** — JWT HS256, TTL 15 min, contient `sub`, `orgId`, `role`.
- **Refresh token** — JWT HS256, TTL 30 jours, contient `sub`, `jti`,
  `typ: 'refresh'`.
- **Rotation** : a chaque `POST /auth/refresh`, l'ancien refresh est
  invalide (flag `revokedAt` en DB + blacklist Redis) et un nouveau couple
  est emis.
- **Reuse detection** : si un refresh deja revoke est reutilise, tous les
  refresh tokens du user sont invalides (vol detecte).

Secrets separes : `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`.

Storage :
- **Browser** : HttpOnly cookies (`strickin_access`, `strickin_refresh`).
  `Secure` + `SameSite=Lax` en prod.
- **CLI / mobile** : Bearer header.

Revocation :
- Refresh tokens : table `RefreshToken` + flag `revokedAt`.
- Access tokens : blacklist Redis (rare — seulement en cas de compromise
  avec effet immediat).

## Consequences

### Positives
- **Stateless pour les access tokens** — pas de hit DB pour chaque request,
  le JwtAuthGuard verifie juste la signature.
- **Scalability** — N instances API sans session sticky requise.
- **Rotation = defense contre replay** — un attaquant qui vole un refresh
  token n'a qu'une fenetre d'usage avant que le user legitime le refresh.
- **Detection de compromise** — le reuse invalide la famille de tokens.
- **Path scope cookie** — le refresh cookie n'est envoye qu'a
  `/api/v1/auth/*`, reduit l'exposition XSS.

### Negatives
- **Complexite** — deux tokens a gerer cote client, rotation a implementer
  cote serveur + client.
- **Storage DB des refresh** — nouvelle table, nouvelle charge SQL.
  Acceptable a notre echelle.
- **Logout imparfait pour l'access token** — si on ne met pas le JTI de
  l'access en blacklist, l'access reste valide jusqu'a son expiration
  (15 min max). On accepte cette fenetre.
- **Secret gerance** — deux secrets a rotater (Sprint 2 Doppler).

### Neutres
- On peut migrer vers RS256 (asymetrique) si plusieurs services
  consomment les tokens. Pas necessaire tant qu'il n'y a que `apps/api`.

## Alternatives considered

- **Sessions classiques** (`session_id` + table sessions)
  - Simple, revocation triviale.
  - **Rejette** — DB hit par request, et on prevoit CLI / mobile cross-origin.
- **Access token seul, long-lived**
  - Pas de rotation.
  - **Rejette** — impossible a revoquer avant expiration, risque trop
    gros en cas de vol.
- **OAuth2 "real"** (Auth0, Clerk, Supabase Auth)
  - Delegate l'auth a un provider.
  - **Rejette pour Sprint 1** — cout + perte de controle sur le flow
    d'onboarding B2B specifique. Re-envisager Sprint 4 pour SSO client
    assureur.
- **JWT sans rotation**
  - Refresh token long-lived sans invalidation.
  - **Rejette** — risque replay attaque.

## Related
- [ADR 0008 — Argon2id](./0008-argon2id-over-bcrypt.md)
- [docs/architecture/07-authentication.md](../07-authentication.md)
- [apps/api/src/auth/auth.service.ts](../../../apps/api/src/auth/auth.service.ts)
- [apps/api/src/auth/services/token.service.ts](../../../apps/api/src/auth/services/token.service.ts)
