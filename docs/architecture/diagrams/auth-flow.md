# Diagramme — Flow d'authentification

Register, login, refresh rotation, logout. Voir aussi
[`07-authentication.md`](../07-authentication.md).

---

## Vue Mermaid — global

```mermaid
sequenceDiagram
    actor U as CGP
    participant B as Browser<br/>(Next.js)
    participant API as NestJS<br/>(Railway)
    participant DB as Postgres
    participant R as Redis

    Note over U,R: === REGISTER ===
    U->>B: saisit email, password, firstName, lastName
    B->>API: POST /api/v1/auth/register
    API->>API: ValidationPipe
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: null
    API->>API: argon2.hash (64MB, 3 iter)
    API->>DB: INSERT user + INSERT AuditLog(REGISTER)
    API->>API: generate access + refresh
    API->>DB: INSERT RefreshToken(jti, userId, expiresAt)
    API-->>B: 201 Set-Cookie strickin_access + strickin_refresh
    B-->>U: redirect /onboarding

    Note over U,R: === LOGIN ===
    U->>B: saisit email, password
    B->>API: POST /api/v1/auth/login
    API->>DB: SELECT user with passwordHash
    DB-->>API: user
    API->>API: argon2.verify
    alt credentials OK
        API->>API: generate access + refresh
        API->>DB: INSERT RefreshToken + AuditLog(LOGIN)
        API-->>B: 200 Set-Cookie
    else credentials KO
        API->>DB: INSERT AuditLog(LOGIN_FAILED)
        API-->>B: 401 INVALID_CREDENTIALS
    end

    Note over U,R: === REFRESH (auto sur 401) ===
    B->>API: POST /api/v1/auth/refresh
    API->>API: jwt.verify(refresh)
    API->>DB: SELECT RefreshToken WHERE jti=?
    alt already revoked (token reuse!)
        API->>DB: UPDATE all RefreshToken SET revokedAt WHERE userId=?
        API->>R: SETEX blacklist:user:<userId>
        API-->>B: 401 TOKEN_REUSE_DETECTED
    else valid
        API->>DB: UPDATE RefreshToken SET revokedAt WHERE jti=?
        API->>R: SETEX blacklist:refresh:<old-jti>
        API->>API: generate new access + refresh
        API->>DB: INSERT new RefreshToken
        API-->>B: 200 Set-Cookie
    end

    Note over U,R: === LOGOUT ===
    U->>B: click logout
    B->>API: POST /api/v1/auth/logout (cookie)
    API->>API: jwt.verify(access)
    API->>DB: UPDATE RefreshToken SET revokedAt WHERE userId=?
    API->>R: SETEX blacklist:refresh:<jti>
    API->>DB: INSERT AuditLog(LOGOUT)
    API-->>B: 204 Clear-Cookie strickin_access + strickin_refresh
    B-->>U: redirect /login
```

## Vue Mermaid — state machine tokens

```mermaid
stateDiagram-v2
    [*] --> Anonymous
    Anonymous --> Registered : POST /register (argon2 hash)
    Anonymous --> Authenticated : POST /login (verify)
    Registered --> Authenticated : auto (register emits tokens)

    state Authenticated {
        [*] --> AccessValid
        AccessValid --> AccessExpired : TTL 15min
        AccessExpired --> AccessValid : POST /refresh (rotates)
        AccessExpired --> [*] : refresh also expired
    }

    Authenticated --> Anonymous : POST /logout
    Authenticated --> Compromised : token reuse detected
    Compromised --> Anonymous : all tokens revoked
```

## Vue ASCII — refresh rotation detaille

```
  T=0                T=15m              T=16m
  ├──────── access token valid ─────┤
  │                                 │
  │                                 ▼
  │                          API call retourne 401
  │                                 │
  │                                 ▼
  │                          B: POST /auth/refresh
  │                                 │
  │                          ┌──────┴──────┐
  │                          │             │
  │                          │       jwt.verify(refresh)
  │                          │             │
  │                          │       lookup RefreshToken(jti)
  │                          │             │
  │                          │       ┌─────┴─────┐
  │                          │       │           │
  │                          │   valid     already revoked
  │                          │       │           │
  │                          │       ▼           ▼
  │                          │   rotate      REUSE DETECTED
  │                          │       │           │
  │                          │       ▼           ▼
  │                          │   revoke old   revoke FAMILY
  │                          │   issue new      (all tokens
  │                          │       │          of user)
  │                          │       │           │
  │                          │   200 new     401 FORCED LOGOUT
  │                          │   cookies
  │                          │       │
  │                          └───────┘
  │                                 │
  T=16m                             ├────────── new access valid ────
```

## Points cles

### 1. Rotation systematique
Chaque refresh invalide l'ancien token et emet un nouveau couple.
Un attaquant qui a vole un refresh n'a qu'une fenetre courte (avant le
prochain refresh legitime du user) pour l'utiliser.

### 2. Reuse detection
Si un refresh deja revoque est reutilise, on considere que le token a
ete vole. On invalide **toute la famille** de tokens du user (logout
force sur toutes ses sessions).

### 3. Cookies path-scoped
Le refresh cookie n'est envoye qu'a `/api/v1/auth/*` — reduit
l'exposition XSS.

### 4. Rate limiting
- Register : 5/h par IP.
- Login : 10/min par IP.
- Refresh : 30/min par IP.

### 5. Audit trail
Chaque action (register, login, login_failed, logout, refresh_reused)
ecrit dans `AuditLog` (table Prisma).

## Frontend — auto refresh

Le client API (`apps/web/lib/api/`) intercepte les 401 :

```ts
// pseudo-code
async function fetchWithRefresh(input, init) {
  let response = await fetch(input, init);
  if (response.status === 401 && !input.includes('/auth/')) {
    // try refresh
    const refreshResp = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
    if (refreshResp.ok) {
      // retry original
      response = await fetch(input, init);
    } else {
      // force logout
      window.location.href = '/login';
    }
  }
  return response;
}
```

Un seul refresh concurrent via mutex (pour ne pas en declencher plusieurs
en meme temps sur des requetes paralleles).

## Lectures complementaires

- [`07-authentication.md`](../07-authentication.md)
- [ADR 0008 — Argon2id](../decisions/0008-argon2id-over-bcrypt.md)
- [ADR 0009 — JWT rotation](../decisions/0009-jwt-refresh-rotation.md)
- [apps/api/src/auth/auth.controller.ts](../../../apps/api/src/auth/auth.controller.ts)
