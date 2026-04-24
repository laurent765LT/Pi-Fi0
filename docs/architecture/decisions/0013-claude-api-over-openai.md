# ADR 0013 — Anthropic Claude plutot qu'OpenAI

## Status
Accepted — 2026-03-08

## Context

L'API Strick'in integre un LLM pour plusieurs use cases :

- Chat conversationnel assistant CGP.
- Analyse de sous-jacents (ticker → resume + risk factors + opportunities).
- Sentiment de marche (indice → sentiment + citations).
- Scoring ESG (produit → breakdown).
- Recommandations produits (a terme).

Contraintes :
- **Residency EU** pour les donnees client et les prompts qui peuvent
  contenir du contexte (meme si on `aiGuard()` avant) — RGPD soft.
- **Qualite reasoning** — on fait du raisonnement structure (target market,
  ESG scoring avec justification), pas du simple summarization.
- **Cout maitrise** — on cache via Redis (voir [ADR 0011](./0011-upstash-redis-over-selfhosted.md)).
- **Pas de fine-tuning** en Sprint 1 — prompt engineering suffit.

Candidats : **Anthropic Claude**, **OpenAI GPT-4**, **Gemini**, **Mistral**,
**Perplexity** (pour search+citations).

## Decision

Utiliser **Anthropic Claude** comme LLM principal, avec **Perplexity** en
fallback pour les cas qui necessitent du grounding web.

Modele principal : `claude-3-5-sonnet-20241022`.

Config :
- `ANTHROPIC_API_KEY` en env var.
- Budget mensuel : `ANTHROPIC_MONTHLY_BUDGET_USD=500`.
- Alert a 80 % : `ANTHROPIC_ALERT_THRESHOLD_USD=400`.
- Chaque interaction loggee dans `AIInteraction` table (tokens, latence,
  cout estime).

PII guard obligatoire (`aiGuard()`) avant chaque prompt : rejete si IBAN,
CNI, numero de carte, ou demande de conseil personnalise.

Caching : Redis Upstash avec TTL specifique par service (voir
[08-observability.md](../08-observability.md)).

## Consequences

### Positives
- **Qualite reasoning** — Claude Sonnet excelle sur les taches
  structurees (benchmark MMLU, IFEval).
- **Long context** — 200k tokens. Suffit pour analyser un prospectus
  structure long (~50k tokens typique).
- **Residency EU** — Anthropic offre la residency EU sur les plans
  Enterprise. Actuellement on paie a l'usage sur plan standard, residency
  a activer Sprint 2.
- **API simple** — `/v1/messages` endpoint unique, streaming supporte.
- **Pas de fine-tuning** requis — prompt + context suffisant a notre
  echelle.
- **Compliance messaging** — Anthropic a une reputation de safety-first
  qui rassure nos assureurs clients.

### Negatives
- **Cout par token superieur** aux alternatives type Haiku ou GPT-3.5.
  Mitige par le cache Redis.
- **Pas d'embeddings** natif Anthropic — on utilise OpenAI `text-embedding-3-small`
  pour le RAG (Sprint 2+).
- **Residency pas auto** — il faut activer explicitement, et uniquement
  sur les plans qualifiants.
- **Rate limits stricts** — 4000 RPM sur Sonnet par defaut. Suffit
  actuellement mais a watcher.

### Neutres
- Le switching cost vers OpenAI serait mesure : les prompts sont
  portables, l'API format est different (Anthropic `/messages` vs OpenAI
  `/chat/completions`) mais la difference est une couche d'abstraction.
- On n'utilise pas les features proprietaires (function calling Anthropic,
  artifacts).

## Alternatives considered

- **OpenAI GPT-4**
  - Plus populaire, plus d'exemples.
  - Qualite comparable.
  - Residency EU moins nette (Azure OpenAI offre EU regions, pas OpenAI
    direct).
  - Messaging compliance moins safety-first (ressenti, arguable).
  - **Rejette** — Claude a un edge sur la qualite des analyses structurees
    et la perception client-side.
- **Google Gemini**
  - Tres bon sur multimodal.
  - Moins de use cases pour nous en Sprint 1 (pas de multimodal yet).
  - Residency EU via Google Cloud region EU.
  - **Rejette pour Sprint 1**, revisiter si besoin multimodal.
- **Mistral**
  - France, residency EU native, compliance top.
  - Qualite plus faible sur reasoning long.
  - **Rejette comme primary**, **retenu** pour un audit Sprint 3 si on
    doit durcir la compliance / backup.
- **Perplexity**
  - Search + citations integrees.
  - Utile pour le use case "recherche actualite marche".
  - **Retenu en fallback** pour les prompts qui necessitent grounding
    web. Pas le primary car le reasoning libre est moins fort.
- **Modele self-hosted (Llama 3.1 sur RunPod)**
  - Controle total, cout fixe.
  - SRE massif, qualite inferieure pour le reasoning long.
  - **Rejette** — pas d'equipe SRE pour ca.

## Related
- [ADR 0011 — Upstash Redis](./0011-upstash-redis-over-selfhosted.md) —
  cache des reponses Claude.
- [docs/architecture/08-observability.md#61-aiinteraction](../08-observability.md)
- [apps/api/src/ai/](../../../apps/api/src/ai/)
- [docs/infra.md#3-anthropic-claude-api](../../infra.md)
