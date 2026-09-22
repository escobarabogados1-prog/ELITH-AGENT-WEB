-- Esquema de referencia para producción (Postgres / Neon).
-- En desarrollo local, si DATABASE_URL no está definida, la app usa un
-- almacén en memoria con la misma forma de datos (ver persistence/store.ts).

create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  whatsapp text unique,
  email text unique,
  city text,
  country text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('web', 'whatsapp')),
  external_id text not null,
  contact_id uuid references contacts(id),
  state jsonb not null default '{}'::jsonb,
  utm jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel, external_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id),
  legal_area text,
  service_id text,
  summary text not null,
  urgency text check (urgency in ('baja', 'media', 'alta')),
  source_channel text not null,
  utm jsonb,
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'cerrado')),
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  conversation_id uuid references conversations(id),
  channel text,
  metadata jsonb,
  utm jsonb,
  created_at timestamptz not null default now()
);

-- qualification_sessions queda reservada a propósito: en el MVP el progreso
-- de precalificación vive dentro de conversations.state (jsonb). Si más
-- adelante se necesita historial detallado de sesiones de calificación
-- (por ejemplo, para retomar después de días), se separa a esta tabla sin
-- tocar core/qualification.ts, que solo conoce ConversationState.
