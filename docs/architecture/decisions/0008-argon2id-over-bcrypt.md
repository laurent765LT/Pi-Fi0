# ADR 0008 — Argon2id plutot que bcrypt

## Status
Accepted — 2026-03-08

## Context

Le backend doit hasher les passwords des users avant stockage. Choix de
l'algorithme a la creation du module `auth`.

Contexte :
- OWASP ASVS 4.0 (section 2.4) recommande Argon2id comme premier choix
  pour les **nouvelles applications**.
- bcrypt reste acceptable mais souffre :
  - 72-byte limit pas documente.
  - Pas de resistance GPU (cost factor borne en memoire).
  - Pas de parametre memoryCost (seul `cost` iterations).
- Argon2 a gagne la Password Hashing Competition en 2015.
- Node offre une binding native (`argon2` sur npm).

## Decision

Utiliser **Argon2id** via la lib `argon2` (N-API bindings) avec les
parametres :

```ts
const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,   // 64 MB
  timeCost: 3,           // 3 iterations
  parallelism: 1,
} as const;
```

Usage :
```ts
// Hash
const hash = await argon2.hash(plainPassword, ARGON2_OPTS);

// Verify (timing-safe native)
const valid = await argon2.verify(storedHash, plainPassword);
```

## Consequences

### Positives
- **Resistant GPU/ASIC** — le memoryCost rend les attaques paralleles
  couteuses en memoire.
- **Hybrid** — Argon2id resiste aux side-channel ET aux time-memory
  tradeoffs (Argon2i resiste uniquement aux side-channel, Argon2d
  uniquement au time-memory tradeoff).
- **Recommande OWASP** — audit trail clair.
- **Encode les parametres dans le hash** — un hash Argon2 contient les
  parametres utilises (`$argon2id$v=19$m=65536,t=3,p=1$...`), on peut donc
  augmenter les parametres au fil du temps et re-hash lazily au login.

### Negatives
- **Binding native** — `argon2` utilise libargon2 compile. Sur Apple Silicon
  et Docker multi-arch, on a dû valider les builds. Le Dockerfile utilise
  `node:20-bullseye-slim` qui a le compilateur pre-installe.
- **Memoire par hash** — 64 MB par verification. Si on a 1000 logins/s,
  ca fait du hit RAM important. A notre echelle, pas un probleme.
- **Latence** — ~50-100 ms par verification sur les runner Railway. OK pour
  du login (rare).

### Neutres
- Les parametres sont reevaluables : Sprint 4, on benchmarkera un eventuel
  passage a 128 MB / 4 iterations si le hardware permet.
- En cas d'upgrade des parametres, les hashes existants restent valides
  (les parametres sont encodes). Au login reussi, on rehash si les params
  sont obsoletes.

## Alternatives considered

- **bcrypt**
  - Mature, largement deploye.
  - Pas de memoryCost → vulnerable aux attaques GPU.
  - 72-byte limit silently truncate — piege.
  - **Rejette** — OWASP deconseille pour nouveau code.
- **scrypt**
  - Memory-hard comme Argon2.
  - Moins adopte, bindings moins stables.
  - **Rejette** — Argon2id est le successeur designe.
- **PBKDF2**
  - Standard FIPS, disponible partout.
  - Pas memory-hard.
  - **Rejette** — insuffisant pour 2026.

## Related
- [ADR 0009 — JWT refresh rotation](./0009-jwt-refresh-rotation.md)
- [docs/architecture/07-authentication.md#9-password-policy](../07-authentication.md)
- [apps/api/src/auth/auth.service.ts](../../../apps/api/src/auth/auth.service.ts)
