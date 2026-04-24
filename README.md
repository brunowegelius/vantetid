# Väntetid

En öppen, verifierbar översikt över väntetider i svensk vård. Automatiskt uppdaterad. Varje siffra spårbar till sin källa.

Live: https://brunowegelius.github.io/vantetid/ (efter första deploy)

## Arkitektur

    Väntetid/
    ├── app/                       Next.js 15 static export (deploy: GitHub Pages)
    │   ├── src/app/               Sidor (/, /region/[slug], /matt/[slug], /jamfor, /om-data, /api-docs, /ladda-ner)
    │   ├── src/components/        Swiss/minimalist UI — inga skuggor, inga borders, inga emojis
    │   └── src/lib/               Data-lager (Supabase PostgREST + Kolada-fallback)
    ├── supabase/
    │   ├── migrations/            Schema, seed, pg_cron, finalize-funktion
    │   └── functions/etl-kolada/  Edge Function: hämta, hasha, bulk-insertera, validera
    ├── docs/ARCHITECTURE.md       Detaljerad arkitektur och pålitlighetsmekanismer
    └── .github/workflows/         Daily build + deploy till GitHub Pages

## Säkerhet (vad som INTE är i repot)

- `.env`, `.env.local` — inga hemligheter. Anon key sätts via GitHub Secrets.
- Service role key finns ENDAST som Supabase-secret (auto-provisioned till Edge Functions), aldrig i Next.js-bundlen.
- RLS på allt. Anon-rollen får bara SELECT på publika tabeller. `raw_snapshots` är inte publikt läsbar.
- `node_modules`, `.next`, `out`, `.vercel`, `tsconfig.tsbuildinfo`, `.DS_Store` exkluderade i `.gitignore`.

## Deploy — första gången

1. Lägg till GitHub Secrets på `Settings → Secrets and variables → Actions`:

        NEXT_PUBLIC_SUPABASE_URL        = https://veugxzdxvfksnsztefnx.supabase.co
        NEXT_PUBLIC_SUPABASE_ANON_KEY   = sb_publishable_4k2NfY8ZXVJ9dgjQl_dziw_m-XnFZpw

2. Slå på GitHub Pages: `Settings → Pages → Source: GitHub Actions`.
3. Kör workflow manuellt: `Actions → Bygg och deploya till GitHub Pages → Run workflow`.
4. Efter ca 2 minuter finns sajten på `https://brunowegelius.github.io/vantetid/`.

Workflown körs automatiskt varje natt kl 04:00 UTC (35 min efter Supabase-ETL kl 02:25). Varje push till `main` triggar också en ny deploy.

## Köra lokalt

    cd app
    npm install
    npm run dev

Öppna http://localhost:3000. Kör utan env-vars pratar den direkt med Kolada v3. Lägg till `.env.local` med Supabase-varna ovan för att köra mot den persisterade datan.

## Datakällor

| Källa | Licens | Status |
|---|---|---|
| Kolada v3 (RKA) | CC BY 4.0 | Primär, fungerar idag |
| Socialstyrelsen PxWeb | Öppna data | Aktiveras när väntetidstabellerna publiceras (vår 2026) |
| SKR Väntetider i vården | Fri användning | Parallell rapportering under 2026 |
| Sveriges dataportal | CC0 (metadata) | Upptäckt av nya dataset |
| RCC SVF | Fri användning | Manuell kvartalsuppladdning |

## Designprinciper

- Ingen siffra utan källa. Varje datapunkt har `source_url`, `fetched_at`, `run_id` och SHA-256-hash.
- Append-only. `measurements` skrivs aldrig över.
- Validering före publicering. Avvikelser >30 % blockeras tills granskning.
- Radikal transparens. Allt som visas är tillgängligt som JSON/CSV via PostgREST.
- Inget vibe-UI. Swiss-typografi. Inga skuggor, inga borders, inga emojis.

Se `docs/ARCHITECTURE.md` för fullständig arkitektur och pålitlighetsmekanismer.
