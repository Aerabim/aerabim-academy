# ARCHITECTURE.md — AerACADEMY

> Leggi questo file all'inizio di ogni sessione insieme a CLAUDE.md.
> Versione: 1.1 | Aggiornato: Marzo 2026 | AERABIM S.R.L.

---

## 1. Contesto

AerACADEMY è la piattaforma e-learning di AERABIM per la formazione professionale BIM/AEC.
Si rivolge a professionisti tecnici e Pubblica Amministrazione italiani.
È un'applicazione Next.js **indipendente** da Observe (`observe.aerabim.it`) con il proprio progetto Supabase dedicato.

- **URL produzione:** `academy.aerabim.it`
- **Repo:** `github.com/Aerabim/aerabim-academy`
- **Deploy:** Vercel — team AERABIM
- **Supabase:** progetto dedicato AerACADEMY (separato da Observe)
- **DNS/CDN:** Cloudflare — account `stefanorusso392@gmail.com`
- **Account operativo:** `info@aerabim.it`

---

## 2. Stack Tecnologico

| Layer | Tecnologia | Note |
|---|---|---|
| Frontend | Next.js 14 (App Router) | TypeScript, Server Components |
| Styling | Tailwind CSS 3.x | Palette colori AERABIM (vedi sezione 4) |
| Database + Auth | Supabase | Progetto dedicato AerACADEMY |
| Deploy | Vercel | CI/CD da GitHub |
| DNS/CDN | Cloudflare | Account stefanorusso392@gmail.com |
| Pagamenti | Stripe | Abbonamenti + acquisti singoli — intestato a AERABIM S.R.L. |
| Email | Resend | Transazionali e marketing — mittente @aerabim.it |
| Video | Mux | Streaming adattivo HLS |
| AI Tutor | Claude API | `claude-sonnet-4-20250514` |

---

## 3. Regole Specifiche del Progetto

> Regole non derogabili per AerACADEMY, in aggiunta alle regole generali di `CLAUDE.md`.

1. Usa **sempre TypeScript** con tipi espliciti. Mai `any`.
2. Usa **sempre Server Components** dove possibile. `"use client"` solo se strettamente necessario.
3. Gestisci **sempre gli errori** con `try/catch` e mostra messaggi leggibili all'utente.
4. **Non hardcodare mai** credenziali o URL. Usa sempre `process.env.*`.
5. **Supabase:** usa `createServerClient()` nei Server Components e API routes, `createBrowserClient()` nei Client Components.
6. **Stripe:** tutta la logica di pagamento solo in API routes server-side. Mai client-side.
7. **Mux:** usa `mux_playback_id` per lo streaming. `mux_asset_id` solo per gestione interna — non esporre al client.
8. **SUPABASE_SERVICE_ROLE_KEY:** solo server-side. Non esporre mai al client.
9. Prima di creare un nuovo componente, verifica se esiste già in `components/`.
10. Ogni pagina che richiede enrollment deve verificare l'accesso **server-side**, non solo client-side.
11. Il webhook Stripe (`/api/stripe/webhook`) è l'**unico punto** in cui si scrive su `enrollments` e `subscriptions`.

---

## 4. Palette Colori AERABIM

```ts
// tailwind.config.ts
colors: {
  brand: {
    dark:  '#040B11',   // header, footer, sfondi principali
    blue:  '#304057',   // elementi primari
    gray:  '#58758C',   // testi secondari, bordi
    light: '#9DB1BF',   // testi disabilitati, placeholder
  }
}
```

Accenti:
- Cyan `#4ECDC4` — CTA principali, progress, elementi interattivi
- Amber `#F0A500` — badge, warning, highlight

Non usare colori arbitrari. Usa sempre i token definiti sopra.

---

## 5. Struttura Cartelle

```
aerabim-academy/
├── app/
│   ├── (auth)/                   # Pagine pubbliche autenticazione
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (public)/                 # Pagine pubbliche marketing
│   │   ├── page.tsx              # Homepage / Landing
│   │   ├── corsi/page.tsx        # Catalogo corsi
│   │   └── corsi/[slug]/page.tsx # Pagina corso (preview pubblica + CTA acquisto)
│   ├── (dashboard)/              # Area utente autenticata
│   │   ├── layout.tsx            # Layout con sidebar
│   │   ├── dashboard/page.tsx    # Home dashboard
│   │   ├── i-miei-corsi/page.tsx
│   │   ├── learn/[courseId]/page.tsx
│   │   ├── learn/[courseId]/[lessonId]/page.tsx
│   │   ├── profilo/page.tsx
│   │   └── certificati/page.tsx
│   ├── (admin)/                  # Backoffice — solo ruolo admin
│   │   ├── layout.tsx
│   │   ├── admin/corsi/page.tsx
│   │   ├── admin/utenti/page.tsx
│   │   └── admin/analytics/page.tsx
│   └── api/
│       ├── stripe/webhook/route.ts
│       ├── mux/webhook/route.ts
│       ├── certificati/[id]/route.ts
│       └── ai-tutor/route.ts
├── components/
│   ├── ui/                       # Componenti atomici (Button, Card, Badge, Input)
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── corso/                    # CourseCard, LessonList, VideoPlayer, ProgressBar
│   ├── quiz/                     # QuizBlock, QuizResult
│   └── ai-tutor/                 # ChatWidget
├── lib/
│   ├── supabase/                 # client.ts, server.ts, middleware.ts
│   ├── stripe/                   # helpers.ts
│   ├── mux/                      # helpers.ts
│   └── utils.ts
├── types/
│   └── index.ts                  # Tutti i tipi TypeScript globali
├── middleware.ts                 # Protezione route autenticate
└── .env.local                    # NON committare mai
```

---

## 6. Schema Database Supabase

> Schema principale: `public` — RLS abilitata su tutte le tabelle.

### courses
```sql
CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  area          TEXT NOT NULL,        -- 'OB' | 'SW' | 'NL' | 'PG' | 'AI'
  level         TEXT NOT NULL,        -- 'L1' | 'L2' | 'L3'
  price_single  INTEGER DEFAULT 0,    -- centesimi EUR (4900 = 49€)
  is_free       BOOLEAN DEFAULT FALSE,
  is_published  BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  duration_min  INTEGER,
  stripe_price_id TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### modules
```sql
CREATE TABLE modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID REFERENCES courses(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  order_num  INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### lessons
```sql
CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID REFERENCES modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  order_num        INTEGER NOT NULL,
  type             TEXT NOT NULL,       -- 'video' | 'quiz' | 'material'
  mux_playback_id  TEXT,
  mux_asset_id     TEXT,
  duration_sec     INTEGER,
  is_preview       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

### enrollments
```sql
CREATE TABLE enrollments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id                UUID REFERENCES courses(id) ON DELETE CASCADE,
  access_type              TEXT NOT NULL,  -- 'single' | 'pro_subscription' | 'team' | 'free'
  stripe_payment_intent_id TEXT,
  expires_at               TIMESTAMPTZ,   -- NULL = permanente
  created_at               TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

### progress
```sql
CREATE TABLE progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed       BOOLEAN DEFAULT FALSE,
  watch_time_sec  INTEGER DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id     TEXT NOT NULL,
  status                 TEXT NOT NULL,  -- 'active' | 'canceled' | 'past_due'
  plan                   TEXT NOT NULL,  -- 'pro' | 'team' | 'pa'
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now()
);
```

### quiz_questions
```sql
CREATE TABLE quiz_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL,  -- [{text: '...', is_correct: bool}]
  order_num  INTEGER
);
```

### quiz_attempts
```sql
CREATE TABLE quiz_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  UUID REFERENCES lessons(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  score      INTEGER,
  passed     BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### certificates
```sql
CREATE TABLE certificates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID REFERENCES courses(id) ON DELETE CASCADE,
  verify_code  TEXT UNIQUE NOT NULL,
  issued_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);
```

### Row Level Security

| Tabella | Lettura | Scrittura |
|---|---|---|
| `courses`, `lessons` (`is_published=true`) | Pubblica (anche non autenticati) | Solo `service_role` |
| `lessons` (`is_preview=false`) | Solo utenti con enrollment attivo o subscription Pro | Solo `service_role` |
| `enrollments` | Solo utente proprietario | Solo `service_role` (webhook Stripe) |
| `subscriptions` | Solo utente proprietario | Solo `service_role` (webhook Stripe) |
| `progress`, `certificates`, `quiz_attempts` | Solo utente proprietario | Utente proprietario (progress) / `service_role` (certificates) |

---

## 7. Variabili d'Ambiente

File `.env.local` — non committare mai nel repo.

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # solo server-side, mai esporre al client

# STRIPE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_ANNUAL=price_...

# MUX
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
MUX_WEBHOOK_SECRET=...

# CLAUDE AI (AI Tutor)
ANTHROPIC_API_KEY=sk-ant-...

# RESEND
RESEND_API_KEY=re_...

# APP
NEXT_PUBLIC_APP_URL=https://academy.aerabim.it
```

---

## 8. Flussi Applicativi Principali

### Acquisto corso singolo
1. Utente clicca "Acquista" → API route crea Stripe Checkout Session (`mode: 'payment'`)
2. Stripe redirect → utente paga → Stripe invia webhook `checkout.session.completed`
3. Webhook verifica signature → inserisce record in `enrollments` con `expires_at = NOW() + 24 mesi`
4. Redirect utente a `/learn/{courseId}`

### Abbonamento Pro
1. Utente clicca "Abbonati" → API route crea Stripe Checkout Session (`mode: 'subscription'`)
2. Webhook `checkout.session.completed` → crea `subscription` + `enrollment` per tutti i corsi pubblicati
3. Webhook `customer.subscription.deleted` → aggiorna `status`, imposta `expires_at = current_period_end`

### Riproduzione video
1. Server Component verifica enrollment attivo (query Supabase server-side)
2. Se non autorizzato → redirect a pagina corso con CTA acquisto
3. Se autorizzato → fetch `mux_playback_id` → render `<MuxPlayer />`
4. Evento `onEnded` → POST `/api/progress` → aggiorna `progress.completed = true`
5. Se ultimo video del corso → trigger generazione certificato

### Generazione certificato
1. Tutti i `progress` del corso = `completed` + tutti i quiz = `passed`
2. Crea record in `certificates` con `verify_code = nanoid(12)`
3. `GET /api/certificati/[id]` genera PDF con nome, corso, data, QR code verifica

---

## 9. Componenti Chiave

### VideoPlayer
```tsx
// components/corso/VideoPlayer.tsx
// npm install @mux/mux-player-react

import MuxPlayer from '@mux/mux-player-react';

export function VideoPlayer({
  playbackId,
  lessonId,
  onComplete,
}: {
  playbackId: string;
  lessonId: string;
  onComplete: () => void;
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      metadata={{ video_id: lessonId }}
      streamType="on-demand"
      onEnded={onComplete}
      style={{ width: '100%', aspectRatio: '16/9' }}
    />
  );
}
```

### AI Tutor API Route
```ts
// app/api/ai-tutor/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, courseContext } = await req.json();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `Sei il tutor AI di AerACADEMY, specializzato in BIM e normativa AEC italiana.
Stai assistendo un utente che sta seguendo: ${courseContext}.
Rispondi in italiano, in modo tecnico ma chiaro.
Cita sempre la norma di riferimento (ISO 19650, UNI 11337, D.Lgs. 36/2023) quando rilevante.`,
    messages,
  });

  return Response.json({ content: response.content[0].text });
}
```

### Middleware protezione route
```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPaths = ['/dashboard', '/i-miei-corsi', '/learn', '/profilo', '/certificati', '/admin'];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* next/headers */ } }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 10. Fasi di Sviluppo MVP

| Fase | Settimane | Obiettivo | Verifica |
|---|---|---|---|
| 0 — Setup | 1 | Repo GitHub, Vercel, env, schema Supabase, account Stripe + Mux | Deploy vuoto su academy.aerabim.it |
| 1 — Auth & Shell | 1–2 | Login/Register, layout dashboard, middleware | ✅ Auth funzionante — **in corso: dashboard shell** |
| 2 — Catalogo | 2–3 | Pagine `/corsi` e `/corsi/[slug]`, CourseCard, primo corso nel DB | Catalogo navigabile pubblicamente |
| 3 — Pagamenti | 3–4 | Stripe checkout, webhook, enrollment automatico | Acquisto reale funzionante in modalità test |
| 4 — Player | 4–5 | MuxPlayer, tracciamento progress, navigazione lezioni | Utente acquista e guarda video |
| 5 — Quiz & Certificati | 5–6 | Quiz, score, generazione PDF certificato | Utente completa corso e scarica certificato |
| 6 — AI Tutor & Admin | 6–8 | ChatWidget Claude API, backoffice admin | Piattaforma completa e autogestibile |

---

## 11. Checklist Pre-Go Live

- [ ] Schema Supabase applicato e RLS verificata su ogni tabella
- [ ] Variabili d'ambiente configurate su Vercel (production)
- [ ] Dominio `academy.aerabim.it` configurato su Cloudflare + SSL attivo su Vercel
- [ ] Stripe in modalità live, webhook configurato con endpoint corretto
- [ ] Mux: almeno 1 video caricato e playback testato
- [ ] Email transazionali funzionanti (conferma acquisto, benvenuto)
- [ ] GDPR: cookie banner, privacy policy aggiornata
- [ ] Test acquisto singolo corso end-to-end
- [ ] Test abbonamento Pro end-to-end
- [ ] Test generazione e download certificato
- [ ] Lighthouse score > 85

---

*AERABIM S.R.L. — Documento ad uso interno — v1.1 — Marzo 2026*
