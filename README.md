# ElithLex Agent

**ELITH IA · MOTOR COMERCIAL JURÍDICO** — app independiente de ELITH IA LEGAL TECH.
No reemplaza el sitio institucional: es un proyecto aparte pensado para recibir
tráfico de Google, Ads, TikTok, Instagram, Facebook y enlaces de WhatsApp,
conversar, precalificar y capturar leads hacia WhatsApp Business.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. **No necesitas ninguna API key para probar el
flujo completo**: si `AI_GATEWAY_API_KEY` no está configurada, `ai/provider.ts`
usa una respuesta de plantilla (sin costo) para que la conversación, la
precalificación y la captura de lead funcionen igual. Tampoco necesitas
`DATABASE_URL`: sin ella, la app usa un almacén en memoria con la misma forma
de datos que Postgres.

Para probar el flujo completo por consola, sin levantar el servidor:

```bash
npm run test:flow
```

## Activar el modelo de IA real

1. Crea una API key en https://vercel.com/ai-gateway.
2. Ponla en `.env.local` como `AI_GATEWAY_API_KEY`.
3. `AI_MODEL` ya viene configurado a `anthropic/claude-sonnet-5` (verificado
   como modelo disponible en AI Gateway). Puedes cambiarlo por cualquier otro
   identificador válido del Gateway sin tocar código.

## Activar Postgres (producción)

1. Crea una base de datos (por ejemplo, en Neon).
2. Ejecuta `persistence/schema.sql` contra esa base.
3. Pon la cadena de conexión en `DATABASE_URL`.

La app detecta automáticamente `DATABASE_URL` y cambia de `MemoryStore` a
`PgStore` sin que ningún otro archivo del proyecto lo note (`core/orchestrator.ts`
solo conoce la interfaz `DataStore`).

## Desplegar

Recomendado: subir este repo a GitHub y conectarlo a Vercel (framework
Next.js detectado automáticamente). Configura las mismas variables de entorno
de `.env.example` en el panel de Vercel.

## Qué NO hace todavía (a propósito)

- No envía ni recibe mensajes reales de WhatsApp (`channels/whatsapp/adapter.ts`
  está deshabilitado por diseño).
- No tiene RAG/base de conocimiento jurídica (`knowledge/retriever.ts` devuelve
  vacío a propósito).
- No tiene panel `/admin` (solo la carpeta queda reservada en la arquitectura).

Ver la arquitectura completa y el flujo de ejemplo en la conversación de
construcción de este proyecto, o correr `npm run test:flow` para verlo en
acción.
