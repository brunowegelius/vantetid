# Väntetid

En öppen, verifierbar översikt över väntetider i svensk vård. Automatiskt uppdaterad. Varje siffra spårbar till sin källa.

## Innehåll

    Väntetid/
    ├── app/                          Next.js 15 frontend
    │   └── src/
    │       ├── app/                  App Router pages
    │       ├── components/           UI (Swiss/minimalist, inga borders/skuggor/emojis)
    │       └── lib/                  Data-lager (Supabase + Kolada-fallback)
    ├── supabase/
    │   ├── migrations/
    │   │   ├── 0001_schema_init.sql  schema `vantetid` + RLS
    │   │   ├── 0002_seed.sql         22 regioner, 5 källor, 11 mätetal
    │   │   └── 0003_cron.sql         pg_cron-schemaläggning
    │   └── functions/
    │       └── etl-kolada/index.ts   Edge Function: hämta + validera + spara
    └── docs/
        └── ARCHITECTURE.md           detaljerad arkitektur och pålitlighetsmekanismer

## Snabbstart (lokalt)

    cd app
    npm install
    npm run dev          # sajten kör mot Kolada direkt om .env saknas

Öppna http://localhost:3000. Sajten hämtar live-data från Kolada v3 direkt i server-komponenterna med 30 min ISR.

## Koppla till Supabase (live-deploy)

1. Skapa nytt Supabase-projekt. Skicka connection URL + anon key.
2. Kör migrations:

        supabase link --project-ref <REF>
        supabase db push

3. Sätt miljövariabler i Vercel:

        NEXT_PUBLIC_SUPABASE_URL=https://<REF>.supabase.co
        NEXT_PUBLIC_SUPABASE_ANON_KEY=...

4. Deploya Edge Function:

        supabase functions deploy etl-kolada --no-verify-jwt

5. Sätt service role key som secret:

        supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

6. Kör första ETL-passet manuellt:

        curl -X POST https://<REF>.supabase.co/functions/v1/etl-kolada \
          -H "authorization: Bearer <service_role_key>"

7. Aktivera pg_cron + pg_net i Supabase dashboard, redigera `0003_cron.sql`, kör den.

8. Deploya Next.js-appen till Vercel.

## Designprinciper

- Ingen siffra utan källa. Varje datapunkt har `source_url`, `fetched_at`, `run_id` och SHA-256-hash.
- Append-only. `measurements` skrivs aldrig över.
- Validering före publicering. Avvikelser >30 % hålls tillbaka för granskning.
- Radikal transparens. Allt som visas är tillgängligt som JSON/CSV.
- Inget vibe-UI. Swiss-typografi. Inga skuggor, inga borders, inga emojis.

## Datakällor

| Källa | Licens | Status |
|---|---|---|
| Kolada v3 (RKA) | CC BY 4.0 | Primär, fungerar idag |
| Socialstyrelsen PxWeb | Öppna data | Aktiveras när väntetidstabellerna publiceras (vår 2026) |
| Sveriges dataportal | CC0 (metadata) | Används för upptäckt av nya dataset |
| RCC SVF | Fri användning med attribution | Manuell kvartalsuppladdning |

Se `docs/ARCHITECTURE.md` för fullständig arkitektur och dataflöde.
