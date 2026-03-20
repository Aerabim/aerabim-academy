# CLAUDE.md — AerACADEMY

> Leggi questo file all'inizio di ogni sessione prima di scrivere qualsiasi codice.
> Versione: 1.0 | Aggiornato: Marzo 2026 | Root repo: `github.com/Aerabim/aerabim-academy`

---

## Progetto

**Nome:** AerACADEMY
**Descrizione:** Piattaforma e-learning per la formazione professionale BIM/AEC — settore Pubblica Amministrazione e professionisti tecnici italiani.
**Entità legale:** AERABIM S.R.L.
**Dominio produzione:** `academy.aerabim.it`
**Architettura completa e schema DB:** → leggi `ARCHITECTURE.md`

---

## Convenzioni

- **Lingua del codice:** inglese (variabili, funzioni, commenti)
- **Lingua interfaccia utente:** italiano
- **Componenti React:** PascalCase → `CourseCard.tsx`, `VideoPlayer.tsx`
- **Funzioni e variabili:** camelCase → `getUserEnrollment`, `courseSlug`
- **Route Next.js:** kebab-case → `/i-miei-corsi`, `/learn/[courseId]/[lessonId]`
- **Server Components di default** — aggiungi `'use client'` solo se strettamente necessario (interazioni browser, hooks React)

---

## Regole — Gerarchia (dalla più vincolante)

### 1. Regole assolute — NON derogabili mai

- MAI `any` in TypeScript. Usa tipi espliciti o `unknown` con type guard.
- MAI credenziali, URL di servizi o chiavi hardcoded. Sempre `process.env.*`.
- MAI logica di pagamento lato client. Stripe: solo in API routes server-side.
- MAI verificare l'accesso ai contenuti solo client-side. Ogni pagina con `enrollment` richiesto va verificata server-side nel Server Component o nella API route.
- MAI scrivere su `enrollments` o `subscriptions` al di fuori del webhook Stripe (`/api/stripe/webhook`).

### 2. Regole principali — derogabili solo su indicazione esplicita

- Gestisci **sempre** gli errori con `try/catch`. Mostra messaggi leggibili all'utente, non stack trace.
- Prima di creare un nuovo componente, verifica se esiste già in `components/`.
- **Supabase:** usa `createServerClient()` nei Server Components e nelle API routes, `createBrowserClient()` nei Client Components.
- **Mux:** usa `mux_playback_id` per lo streaming video. `mux_asset_id` è solo per gestione interna (non esporre al client).
- **SUPABASE_SERVICE_ROLE_KEY:** usarla solo server-side. Non esporre mai al client.

### 3. Preferenze stilistiche

- Componenti piccoli e con responsabilità singola.
- Tipi globali in `types/index.ts`.
- Utility condivise in `lib/utils.ts`.

---

## Note specifiche di progetto

### Ecosistema AERABIM
AerACADEMY ha un **progetto Supabase proprio e indipendente** da `observe.aerabim.it`. Non fare riferimento a tabelle o credenziali di Observe.

### Accesso ai contenuti
Il controllo dell'enrollment attivo va eseguito server-side prima di servire qualsiasi contenuto video o materiale didattico. Se l'enrollment non è attivo o è scaduto → redirect alla pagina corso con CTA acquisto.

### Stripe
Il webhook `checkout.session.completed` è l'unico punto in cui si crea un record in `enrollments`. Il webhook `customer.subscription.deleted` è l'unico punto in cui si aggiorna `status` e `expires_at` in `subscriptions`.

### RLS Supabase
Tutte le tabelle hanno Row Level Security abilitata. Scrittura su `enrollments` e `subscriptions` → solo `service_role`. Non bypassare RLS nelle query client.

### AI Tutor
Il modello da usare per l'AI Tutor è `claude-sonnet-4-20250514`. La chiave API è in `process.env.ANTHROPIC_API_KEY`. La route è `/api/ai-tutor/route.ts`.

### Palette colori AERABIM
Non usare colori arbitrari. Usa sempre i token Tailwind definiti in `tailwind.config.ts`:
- `brand-dark` → `#040B11`
- `brand-blue` → `#304057`
- `brand-gray` → `#58758C`
- `brand-light` → `#9DB1BF`
- Accent cyan → `#4ECDC4`
- Accent amber → `#F0A500`

---

## Variabili d'ambiente (riferimento nomi)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PRO_ANNUAL
MUX_TOKEN_ID
MUX_TOKEN_SECRET
MUX_WEBHOOK_SECRET
ANTHROPIC_API_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

---

*AERABIM S.R.L. — Documento ad uso interno — v1.0 — Marzo 2026*
