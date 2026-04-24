# Diagramme — Flow de donnees RFQ

Un CGP emet un Request-For-Quote, plusieurs emetteurs proposent des
quotes, le CGP accepte la meilleure. C'est le flow central metier de
Strick'in.

---

## Vue Mermaid — sequence

```mermaid
sequenceDiagram
    actor CGP as CGP
    actor Issuer1 as Emetteur 1<br/>(BNP Paribas)
    actor Issuer2 as Emetteur 2<br/>(Natixis)
    participant Web as Next.js
    participant API as NestJS
    participant DB as Postgres
    participant AI as Claude API
    participant Mail as Resend

    CGP->>Web: Cree un RFQ<br/>(sous-jacent, montant, echeance)
    Web->>API: POST /api/v1/rfqs
    API->>AI: analyze underlying (cache check)
    AI-->>API: risk profile + opportunities
    API->>DB: INSERT Rfq(status=OPEN)
    API->>DB: INSERT RfqTargetIssuer(issuer1, issuer2)
    API->>Mail: send new-rfq notification (2x)
    API-->>Web: 201 { rfqId }
    Web-->>CGP: Redirect /rfq/:id

    par Emetteur 1 repond
        Mail->>Issuer1: email with RFQ details
        Issuer1->>Web: login + /rfq/:id
        Web->>API: GET /api/v1/rfqs/:id
        API-->>Web: RFQ data
        Issuer1->>Web: submit quote
        Web->>API: POST /api/v1/rfqs/:id/quotes
        API->>DB: INSERT IssuerRfqQuote(issuer1, pricing...)
        API->>Mail: notify CGP (debounced 5min)
        API-->>Web: 201
    and Emetteur 2 repond
        Mail->>Issuer2: email
        Issuer2->>Web: submit quote
        Web->>API: POST /api/v1/rfqs/:id/quotes
        API->>DB: INSERT IssuerRfqQuote(issuer2)
        API->>Mail: notify CGP
        API-->>Web: 201
    end

    CGP->>Web: consulte liste quotes
    Web->>API: GET /api/v1/rfqs/:id/quotes
    API->>DB: SELECT IssuerRfqQuote WHERE rfqId=? ORDER BY coupon DESC
    DB-->>API: 2 quotes
    API-->>Web: { quotes: [...] }

    CGP->>Web: accept quote #1
    Web->>API: POST /api/v1/rfqs/:id/accept-quote { quoteId }
    API->>DB: BEGIN TX
    API->>DB: UPDATE Rfq SET status=ACCEPTED, acceptedQuoteId=?
    API->>DB: UPDATE other quotes SET status=REJECTED
    API->>DB: INSERT Order(productTemplate...)
    API->>DB: INSERT AuditLog(RFQ_ACCEPTED)
    API->>DB: COMMIT
    API->>Mail: send confirmation CGP + issuer1
    API->>Mail: send rejection issuer2
    API-->>Web: 200 { orderId }
    Web-->>CGP: Redirect /orders/:orderId
```

## Vue ASCII — timeline

```
 T=0         T=10min      T=1h          T=1h10      T=1h15       T=2h
  │           │            │             │           │             │
  │  CGP      │ Emetteur 1 │ Emetteur 2  │ CGP       │ Accept      │ Order
  │  POST     │ POST quote │ POST quote  │ consulte  │ quote #1    │ cree
  │  /rfqs    │            │             │ liste     │             │
  │  (new)    │            │             │           │             │
  ▼           ▼            ▼             ▼           ▼             ▼
 ┌──────┐   ┌──────┐    ┌──────┐      ┌──────┐   ┌──────┐       ┌──────┐
 │ RFQ  │   │Quote1│    │Quote2│      │ LIST │   │ACCEPT│       │ORDER │
 │      │   │      │    │      │      │      │   │      │       │      │
 │status│   │status│    │status│      │      │   │status│       │      │
 │=OPEN │   │=PEND │    │=PEND │      │      │   │=ACC  │       │=OPEN │
 │      │   │rfq=ID│    │rfq=ID│      │      │   │      │       │      │
 │      │   │issuer│    │issuer│      │      │   │other │       │      │
 │      │   │=BNP  │    │=NAT  │      │      │   │quote │       │      │
 │      │   │coupon│    │coupon│      │      │   │s set │       │      │
 │      │   │= 8.0%│    │= 7.5%│      │      │   │=REJ  │       │      │
 └──────┘   └──────┘    └──────┘      └──────┘   └──────┘       └──────┘
```

## Tables Prisma impliquees

```
Rfq                          IssuerRfqQuote            Order
├─ id                        ├─ id                     ├─ id
├─ cgpUserId                 ├─ rfqId                  ├─ rfqId
├─ underlyingIsin            ├─ issuerId               ├─ productTemplateId
├─ requestedAmount           ├─ productTemplate JSON    ├─ amount
├─ maturityYears             ├─ couponPct              ├─ status (OPEN/..)
├─ status (OPEN/ACCEPTED/    ├─ barrierPct             ├─ createdAt
│          CANCELLED)        ├─ autocallBarrierPct     │
├─ acceptedQuoteId           ├─ sri                    │
├─ createdAt                 ├─ status (PENDING/       │
├─ expiresAt                 │         ACCEPTED/
│                            │         REJECTED)
│                            ├─ createdAt
│                            ├─ respondedAt
```

## Indexes utilises

- `Rfq(status, createdAt)` — requetes "liste RFQs ouvertes recentes"
  par emetteur.
- `IssuerRfqQuote(rfqId, status)` — "toutes les quotes pending pour une
  RFQ".
- `IssuerRfqQuote(issuerId, respondedAt)` — stats emetteur.

Voir [`05-data-layer.md`](../05-data-layer.md#26-index-strategy).

## Transactions critiques

### 1. Accept quote
```
BEGIN
  UPDATE Rfq SET status='ACCEPTED', acceptedQuoteId=?
  UPDATE IssuerRfqQuote SET status='REJECTED' WHERE rfqId=? AND id != ?
  UPDATE IssuerRfqQuote SET status='ACCEPTED' WHERE id = ?
  INSERT Order (derived from quote + rfq)
  INSERT AuditLog(action='RFQ_ACCEPTED')
COMMIT
```

Transaction obligatoire — on ne peut pas avoir deux quotes ACCEPTED pour
la meme RFQ.

### 2. Cancel RFQ
```
BEGIN
  UPDATE Rfq SET status='CANCELLED'
  UPDATE IssuerRfqQuote SET status='REJECTED' WHERE rfqId=? AND status='PENDING'
  INSERT AuditLog(action='RFQ_CANCELLED', reason=...)
COMMIT
```

## Events publies

- `rfq.created` → declenche notifications emetteurs.
- `quote.submitted` → declenche notification CGP (debounced).
- `rfq.accepted` → declenche creation Order, notifications, update
  inventory produits.
- `rfq.cancelled` → notifications, cleanup.

En Sprint 2 : ces events passent par un outbox pattern (table
`OutboxEvent` + BullMQ worker) pour garantir at-least-once delivery meme
si un email bounce.

## Points d'attention

### Races
Deux CGPs qui acceptent la meme quote en meme temps. Protection :
`UPDATE Rfq SET status='ACCEPTED' WHERE id=? AND status='OPEN'` — si
0 rows affected, la RFQ n'est plus OPEN, on throw `RfqNotOpenError`.

### Expiration
Une RFQ a un `expiresAt` (typique 24h). Un cron (Sprint 2) marque les
RFQ expirees comme `CANCELLED` et reject les quotes pending.

### Compliance
Chaque accept / reject genere un `AuditLog` pour les 5 ans de retention
AMF.

### IA context
Avant de creer une RFQ, le CGP peut demander une analyse du sous-jacent
via `/api/v1/ai/analyze/:ticker`. La reponse (cached Redis) enrichit
l'UX mais n'est **pas** stockee dans la RFQ — c'est un outil d'aide a
la decision, pas un element du contrat.

## Lectures complementaires

- [`03-backend-architecture.md`](../03-backend-architecture.md) —
  pattern CQRS light.
- [`05-data-layer.md`](../05-data-layer.md) — indexes RFQ.
- [`08-observability.md`](../08-observability.md) — event tracking.
- Domain types : [`packages/shared/src/domain/rfq.ts`](../../../packages/shared/src/domain/rfq.ts)
