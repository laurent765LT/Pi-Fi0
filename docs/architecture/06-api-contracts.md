# 06 — Contrats API

**Audience** : devs frontend (consumers), devs backend (producteurs), QA.
**Prerequisites** : REST, JSON, OpenAPI.

---

## 1. Principes

- L'API est **REST JSON** sur `HTTPS` uniquement.
- **Pas de GraphQL** — on garde la simplicite OpenAPI + le typage
  TanStack Query cote front.
- L'API est **versionnee dans l'URL** (`/api/v1/...`). Un breaking change
  passe en `v2`.
- Les contrats sont genere par Swagger (`@nestjs/swagger`) ; un consumer
  TypeScript peut generer un client si besoin.

## 2. Naming

### 2.1 Paths

- **kebab-case** : `/rfq-screener`, `/insurer-rules`, `/system-health`.
- **Plural nouns** pour les collections : `/products`, `/orders`, `/users`.
- **Singular nouns** pour les ressources singleton du user (`/auth/me`).
- **Pas de verbes** dans les paths — le verbe vient du HTTP method.

### 2.2 Query parameters

- `camelCase` : `?targetMarket=retail&sortBy=createdAt&sortOrder=desc`.
- Filtres : un param = un filtre. Pour les filtres multi-valeurs, repeter
  la cle (`?issuer=BNP&issuer=Natixis`).

### 2.3 Exemples

```
GET  /api/v1/products
GET  /api/v1/products/:id
POST /api/v1/products
GET  /api/v1/products/:id/kid
GET  /api/v1/rfq-screener?status=open&issuer=bnp
POST /api/v1/rfqs
PATCH /api/v1/rfqs/:id
POST /api/v1/rfqs/:id/accept-quote
```

## 3. HTTP methods

| Method | Semantique | Idempotent |
| --- | --- | --- |
| GET | lecture | oui |
| POST | creation / command / action | non |
| PATCH | mise a jour partielle | oui (par design) |
| PUT | replace complet (rare, ex : document KYC) | oui |
| DELETE | suppression | oui |

On prefere `PATCH` a `PUT` par defaut — le client envoie **seulement** les
champs modifies. `PUT` est reserve aux replace complets (upload d'un
document, replacement d'une liste).

## 4. Status codes

| Code | Usage |
| --- | --- |
| **200** OK | Lecture ou update reussi. |
| **201** Created | Creation reussie. `Location: /resource/:id` en header. |
| **202** Accepted | Traitement asynchrone accepte (job en queue). |
| **204** No Content | Action reussie sans corps (logout). |
| **400** Bad Request | Requete malformee (JSON invalide, champs manquants). |
| **401** Unauthorized | Pas de token ou token invalide. |
| **403** Forbidden | Authentifie mais pas autorise (role ou org wrong). |
| **404** Not Found | Ressource inexistante. |
| **409** Conflict | Conflit metier (email deja pris, ISIN existe deja, version stale). |
| **422** Unprocessable Entity | Validation echouee (class-validator errors). |
| **429** Too Many Requests | Rate limit depasse. `Retry-After` en header. |
| **500** Internal Server Error | Bug cote API. |
| **503** Service Unavailable | Dependance externe down (Anthropic, Supabase). |

### 4.1 Regle

- **400** : le probleme est dans la *structure* de la requete.
- **422** : la structure est correcte mais le contenu echoue la
  validation metier (format d'email invalide, password trop court).
- **409** : la requete est valide mais l'etat du systeme la refuse
  (conflict).

## 5. Payload conventions

### 5.1 camelCase partout

```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "orgId": "clk1abc2xyz"
}
```

### 5.2 Dates en ISO 8601 UTC

```json
{
  "createdAt": "2026-04-24T10:15:00.000Z",
  "maturityDate": "2031-05-15"
}
```

`YYYY-MM-DDTHH:MM:SS.SSSZ` pour les timestamps, `YYYY-MM-DD` pour les
dates metier sans heure.

### 5.3 Monetaires

Tous les montants sont en **centimes**, en entier, avec un champ
`currency` explicite :

```json
{
  "amount": 1000000,
  "currency": "EUR"
}
```

Cela evite les flottants et les pertes d'arrondi.

### 5.4 Enums en string

```json
{
  "status": "ACTIVE",
  "payoffType": "AUTOCALL_PHOENIX"
}
```

**UPPERCASE** pour matcher les enums Prisma / `@strickin/shared`.

## 6. DTOs et validation

### 6.1 class-validator

Tous les DTOs utilisent `class-validator` + `class-transformer` :

```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}
```

Le `ValidationPipe` global (`main.ts`) execute la validation avant que le
controller soit appele. Echec → 422 avec `constraints`.

### 6.2 ValidationPipe global

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // strip unknown fields
  forbidNonWhitelisted: true, // reject unknown fields
  transform: true,
  transformOptions: { enableImplicitConversion: true },
}));
```

### 6.3 Mapping DTO ↔ entity

Dans les modules Clean Arch, les mappers convertissent DTOs ↔ entities
(voir [`03-backend-architecture.md`](./03-backend-architecture.md)). Les
controllers **ne** passent **jamais** le DTO directement a Prisma.

## 7. Pagination

### 7.1 Cursor-based (defaut)

Pour les collections potentiellement grandes (AuditLog, AIInteraction,
Products en admin) :

```
GET /api/v1/audit-logs?limit=50&cursor=clk1abc2xyz
```

Response :

```json
{
  "items": [...],
  "pageInfo": {
    "hasNextPage": true,
    "endCursor": "clk1xyz789"
  }
}
```

### 7.2 Offset-based (petites collections)

Pour les collections bornees (liste des emetteurs, liste des shelves
ouverts) :

```
GET /api/v1/shelves?page=1&pageSize=20
```

Response :

```json
{
  "items": [...],
  "total": 145,
  "page": 1,
  "pageSize": 20
}
```

### 7.3 Regle

- Defaut : cursor-based.
- Exception : UI qui affiche "page X sur Y" → offset-based.
- `pageSize` max hard-cape a 100 cote API.

## 8. Filtering

Query params simples. Exemples :

```
GET /api/v1/products?status=ACTIVE&issuer=BNP&sri=1,2,3
GET /api/v1/rfqs?status=OPEN&createdAfter=2026-04-01
```

- `status=X` : exact match.
- `createdAfter=YYYY-MM-DD` : plage.
- `sri=1,2,3` : CSV si multi-valeurs.
- Pour les filtres complex (recherche full-text, match hierarchique), on
  cree un endpoint dedie (`/products/search`) avec un body POST.

## 9. Erreurs — RFC 7807

Chaque reponse d'erreur suit le format Problem Details (RFC 7807) :

```json
{
  "type": "https://strickin.dev/errors/invalid-credentials",
  "title": "Invalid credentials",
  "status": 401,
  "detail": "Email or password is incorrect.",
  "instance": "/api/v1/auth/login",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2026-04-24T10:15:00.000Z",
  "requestId": "req_01H..."
}
```

- `type` : URL stable (meme sans doc derriere — sert d'identifiant unique).
- `code` : enum stable machine-readable. Le frontend switch dessus.
- `requestId` : correlation avec les logs (voir [`08-observability.md`](./08-observability.md)).

### 9.1 Erreurs de validation

```json
{
  "type": "https://strickin.dev/errors/validation-failed",
  "title": "Validation failed",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "errors": [
    { "field": "email", "constraint": "isEmail", "message": "email must be valid" },
    { "field": "password", "constraint": "minLength", "message": "password must be at least 12 characters" }
  ]
}
```

### 9.2 Catalogue d'erreurs

Chaque code est documente dans `apps/api/src/common/errors/catalogue.ts` avec :
- URL `type`.
- Status HTTP.
- Message default.

## 10. Versioning

### 10.1 Strategy

- Prefix URL : `/api/v1/`. Actuel.
- `v2` cree si un breaking change touche **les contrats lus / ecrits** par
  au moins deux consumers (frontend + CLI, ou frontend + webhook externe).
- `v1` continue de vivre **au minimum 3 mois** apres `v2`, avec fixes de
  securite seulement.

### 10.2 Qu'est-ce qu'un breaking change

- Renomme un champ.
- Change le type d'un champ (string → object).
- Retire un endpoint.
- Durcit une validation (ex : minLength passe de 8 a 12).

Ce qui n'est PAS breaking :
- Ajout d'un champ optionnel en response.
- Ajout d'un endpoint.
- Ajout d'une valeur d'enum (**avec** documentation cote consumer).

## 11. OpenAPI / Swagger

Genere automatiquement par `@nestjs/swagger`. Accessible :

- En dev : http://localhost:4000/api/docs
- En staging : https://strickin-api.railway.app/api/docs (protected)

Principes :
- Chaque endpoint a une description `@ApiOperation({ summary })`.
- Chaque DTO a des `@ApiProperty` sur ses champs publics.
- Chaque error explicite a `@ApiResponse({ status, type })`.
- L'URL de docs est **accessible en dev**, **protected en staging**, **off
  en prod** (non-expose externe).

## 12. Headers standards

### 12.1 Request

| Header | Utilite |
| --- | --- |
| `Authorization: Bearer <token>` | Auth JWT. |
| `Content-Type: application/json` | Obligatoire pour POST/PATCH/PUT. |
| `Idempotency-Key: <uuid>` | Pour POST critiques (orders). |
| `X-Request-Id: <uuid>` | Correlation client. |
| `Accept-Language: fr-FR,en` | i18n (futur). |

### 12.2 Response

| Header | Utilite |
| --- | --- |
| `X-Request-Id: <uuid>` | Echo du client ou genere. |
| `X-RateLimit-Limit: 10` | Quota. |
| `X-RateLimit-Remaining: 9` | Restant. |
| `X-RateLimit-Reset: 1713945600` | Unix timestamp reset. |
| `Retry-After: 30` | Sur 429 / 503. |
| `Location: /api/v1/orders/clk1...` | Sur 201. |

## 13. Webhooks

Direction **inbound** : DocuSign (signature callbacks), Resend (bounce),
providers de marche.

### 13.1 Securite

Chaque webhook a :
- Une URL publique (`/api/v1/webhooks/docusign`, ...).
- Une validation HMAC sur le header d'origine.
- Un endpoint de rejeu manuel pour les ratees.

### 13.2 Idempotence

Chaque handler deduplique via `Event-Id` + table `WebhookEvent` (Sprint 2).

## 14. Frontend consumer

### 14.1 Client API

```ts
// apps/web/lib/api.ts
const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL });
```

Le client gere :
- Injection du Bearer token.
- Auto-refresh sur 401 (voir [`07-authentication.md`](./07-authentication.md)).
- Parse du format RFC 7807.
- Throw d'erreurs typees (`InvalidCredentialsError`, `RateLimitError`, ...).

### 14.2 TanStack Query

Chaque endpoint a un hook dedie dans la feature :

```ts
// features/rfq/api/rfq.api.ts
export async function listOpenRfqs(): Promise<RfqSummary[]> {
  return api.get('/rfqs?status=OPEN').then((r) => r.data);
}

// features/rfq/hooks/use-rfqs.ts
export function useOpenRfqs() {
  return useQuery({
    queryKey: rfqKeys.list({ status: 'OPEN' }),
    queryFn: listOpenRfqs,
  });
}
```

## 15. Checklist avant de merger un endpoint

- [ ] URL en kebab-case, resource plural.
- [ ] HTTP method coherent.
- [ ] DTO valide avec `class-validator`.
- [ ] Retour typed DTO (pas de leak Prisma type).
- [ ] Swagger annotations a jour.
- [ ] Status codes corrects (cas d'erreur inclus).
- [ ] Tests integration (Supertest).
- [ ] Documentation `type` URL + `code` si nouvelle erreur.
- [ ] Rate limit si endpoint public.

## 16. Fichiers de reference

- Controllers : `apps/api/src/**/*.controller.ts`
- DTOs : `apps/api/src/**/dto/`
- Validation pipe : `apps/api/src/main.ts`
- Catalog d'erreurs : `apps/api/src/common/errors/` (Sprint 2 formalise)
- Frontend client : `apps/web/lib/api/`
