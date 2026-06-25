'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const documentation = `# NorthBridge Digital - Receptionist Platform

## Database Schema

### Tenants (your clients)
\`\`\`sql
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,          -- subdomain: slug.yourplatform.com
  plan        TEXT NOT NULL DEFAULT 'starter',
  status      TEXT NOT NULL DEFAULT 'active',
  settings    JSONB DEFAULT '{}',            -- branding, custom domain, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Users (client staff + admins)
\`\`\`sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  clerk_id    TEXT UNIQUE NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member', -- super_admin | admin | member
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Receptionists (one or more per tenant)
\`\`\`sql
CREATE TABLE receptionists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  name            TEXT NOT NULL,
  persona         TEXT,                       -- system prompt / personality
  language        TEXT DEFAULT 'en',
  widget_config   JSONB DEFAULT '{}',         -- colors, greeting, avatar
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Knowledge Base Documents
\`\`\`sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  receptionist_id UUID REFERENCES receptionists(id),
  type            TEXT NOT NULL,              -- pdf | url | faq | text
  title           TEXT,
  source_url      TEXT,
  storage_key     TEXT,                       -- S3 key
  status          TEXT DEFAULT 'processing',  -- processing | ready | failed
  chunk_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Subscriptions
\`\`\`sql
CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id),
  stripe_customer_id  TEXT UNIQUE,
  stripe_sub_id       TEXT UNIQUE,
  plan                TEXT NOT NULL,
  status              TEXT NOT NULL,
  current_period_end  TIMESTAMPTZ,
  message_quota       INT DEFAULT 1000,        -- monthly message limit
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Usage Tracking
\`\`\`sql
CREATE TABLE usage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id),
  receptionist_id UUID REFERENCES receptionists(id),
  period_month    TEXT NOT NULL,              -- '2025-01'
  message_count   INT DEFAULT 0,
  token_count     BIGINT DEFAULT 0,
  cost_usd        NUMERIC(10,4) DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Row-Level Security
\`\`\`sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
\`\`\`

---

## Project Structure

\`\`\`
/
├── apps/
│   ├── web/                    # Next.js 14 — admin + client dashboards
│   │   ├── app/
│   │   │   ├── (admin)/        # Super admin routes
│   │   │   ├── (dashboard)/    # Client dashboard routes
│   │   │   └── (auth)/         # Login/signup
│   │   └── components/
│   │
│   ├── api/                    # Node.js REST API
│   │   ├── src/
│   │   │   ├── routes/         # tenants, users, receptionists, docs
│   │   │   ├── middleware/     # auth, tenant-context, rate-limit
│   │   │   ├── services/       # business logic
│   │   │   └── db/             # Prisma ORM + migrations
│   │   └── Dockerfile
│   │
│   └── ai-engine/              # Python FastAPI — AI pipeline
│       ├── app/
│       │   ├── chains/         # LangChain chains per use case
│       │   ├── tools/          # booking, collect_info, handoff
│       │   ├── rag/            # document ingestion + retrieval
│       │   └── routers/        # /chat, /ingest, /embed
│       └── Dockerfile
│
├── packages/
│   ├── widget/                 # Embeddable chat widget (Vanilla JS)
│   ├── shared-types/           # TypeScript interfaces shared across apps
│   └── db-schema/              # Prisma schema + generated client
│
├── infrastructure/
│   ├── terraform/              # AWS resources
│   ├── k8s/                    # Kubernetes manifests (optional)
│   └── docker-compose.yml      # Local dev
│
└── .github/
    └── workflows/
        ├── ci.yml              # Test + lint on PR
        └── deploy.yml          # Deploy on merge to main
\`\`\`

---

## API Endpoints

### Auth
\`POST   /webhooks/clerk\` — Sync user to DB on sign-up

### Tenant Management
- \`GET    /api/tenants\` — [super_admin] list all tenants
- \`POST   /api/tenants\` — Create new tenant (onboarding)
- \`GET    /api/tenants/:id\` — Tenant details
- \`PATCH  /api/tenants/:id\` — Update settings / branding

### Receptionist
- \`GET    /api/receptionists\` — List for current tenant
- \`POST   /api/receptionists\` — Create new receptionist
- \`PATCH  /api/receptionists/:id\` — Update persona, widget config
- \`DELETE /api/receptionists/:id\` — Delete receptionist

### Knowledge Base
- \`POST   /api/documents/upload\` — Upload PDF/doc → S3 → queue ingestion
- \`POST   /api/documents/url\` — Submit URL → scrape → ingest
- \`GET    /api/documents\` — List documents + status
- \`DELETE /api/documents/:id\` — Remove doc + delete vectors

### Conversation
- \`POST   /api/chat\` — Main chat endpoint (all channels)
- \`GET    /api/conversations\` — List conversations for tenant
- \`GET    /api/conversations/:id\` — Full conversation history
- \`POST   /api/conversations/:id/handoff\` — Transfer to human

### Billing
- \`POST   /api/billing/checkout\` — Create Stripe checkout session
- \`GET    /api/billing/portal\` — Stripe customer portal URL
- \`POST   /webhooks/stripe\` — Handle subscription events

### Analytics
- \`GET    /api/analytics/usage\` — Token/message usage per tenant
- \`GET    /api/analytics/revenue\` — MRR, churn, new subs
- \`GET    /api/analytics/conversations\` — Volume, resolution rate
`

export default function Home() {
  return (
    <main>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}: any) => <h1 {...props} />,
          h2: ({node, ...props}: any) => <h2 {...props} />,
          h3: ({node, ...props}: any) => <h3 {...props} />,
          code: ({node, inline, ...props}: any) => inline ? <code {...props} /> : <code {...props} />,
          pre: ({node, ...props}: any) => <pre {...props} />,
        }}
      >
        {documentation}
      </ReactMarkdown>
    </main>
  )
}
