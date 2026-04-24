# Väntetid — arkitektur

Öppen, verifierbar översikt över väntetider i svensk vård.

## Designprinciper

1. **Ingen siffra utan källa.** Varje datapunkt lagras med `source_url`, `fetched_at`, `run_id` och en hash av originalsvaret. Användaren kan alltid klicka sig tillbaka till ursprunget.
2. **Append-only.** `measurements` är immuterbar. Inget uppdateras eller skrivs över — vi vet alltid exakt vad sajten visade vilken dag.
3. **Validering före publicering.** Varje ETL-körning jämförs automatiskt mot föregående. Större avvikelser än 30 % flaggas och hålls tillbaka tills manuellt granskade.
4. **Radikal transparens.** Allt som visas på sajten är också tillgängligt som JSON och CSV. Ingen indirekt metodologi.
5. **Inget vibe-UI.** Swiss/typografisk stil. Inga skuggor, inga borders, inga emojis. Hierarki genom storlek, vikt och vitrum.

## Datakällor (verifierade)

| Källa | Endpoint | Format | Licens | Status |
|---|---|---|---|---|
| **Kolada v3 (RKA)** | `https://api.kolada.se/v3/` | JSON | CC BY 4.0 | Primär — fungerar idag |
| **Socialstyrelsen PxWeb** | `https://px.socialstyrelsen.se/api/v1/sv/` | JSON-stat, CSV, XLSX | Öppna data | Aktiveras när väntetidstabeller publiceras (vår 2026) |
| **Sveriges dataportal** | `https://admin.dataportal.se/store/search` | JSON/RDF | CC0 | Används för upptäckt av nya regionala dataset |
| **Vården i siffror (via Kolada)** | indirekt | JSON | CC BY 4.0 | Flera kvalitetsregister-KPI:er (cancer, stroke, hjärtinfarkt) kommer via Kolada |
| **RCC SVF-ledtider** | `cancercentrum.se` | PDF/XLSX | Fri användning med attribution | Manuell uppladdning, kvartal |

### Primära KPI:er (Kolada)

| KPI | Namn | Kategori |
|---|---|---|
| `N79240` | Väntetid för väntande till första kontakt i specialiserad vård (median) | Specialistvård |
| `N79241` | Väntetid för första kontakt i specialiserad vård, genomförda besök (median) | Specialistvård |
| `N79242` | Väntetid för väntande på operation/åtgärd (median) | Operation |
| `N79243` | Väntetid för operation/åtgärd, genomförda besök (median) | Operation |
| `U70448` | Rimlig väntetid till sjukhusvård (%) | Upplevelse |
| `U70450` | Rimlig väntetid till vård-/hälsocentral (%) | Upplevelse |
| `U72552` | Första BUP-besök inom 90 dagar (%) | BUP |
| `U79119` | Startade utredningar/behandlingar i BUP inom 30 dagar (%) | BUP |
| `N70619` | Väntetid till prostatacancerbesked (%) | Cancer |
| `N70620` | Väntetid till första besök vid misstänkt prostatacancer (%) | Cancer |
| `N74816` | Disponibla vårdplatser BUP per 1 000 inv | BUP (kapacitet) |

## Datamodell

    regions               ← 22 regioner (Riket + 21)
    sources               ← varje uppströmssystem
    metrics               ← KPI-definitioner (slug, enhet, kategori, riktning)
    etl_runs              ← en rad per ETL-körning
    raw_snapshots         ← orörd JSON/CSV från källan, SHA-256
    measurements          ← normaliserade datapunkter (append-only)
    validations           ← anomaliloggar
    measurements_latest   ← vy: senaste OK per (metric, region, period)

## ETL

Supabase Edge Functions, schemalagda via `pg_cron`:

- `etl-kolada` — varje natt kl 03:15 Stockholm
- `etl-socialstyrelsen-pxweb` — andra torsdagen varje månad kl 17:00
- `etl-dataportal-discover` — en gång per vecka; loggar nya dataset-kandidater

Varje körning:
1. `etl_runs` skapas med `status = 'running'`
2. HTTP-hämta källa. Hash:a svaret. Spara i `raw_snapshots`.
3. Normalisera rader till `measurements` med `status = 'staged'`.
4. Kör valideringsregler mot `measurements_latest`:
   - delta > 30 % → `anomaly_flag = 'spike'` + `validations.severity = 'block'`
   - saknade regioner → `validations.severity = 'warn'`
   - oförändrad i >90 dagar → `validations.severity = 'info'`
5. Om inga blockerande anomalier: uppdatera `measurements.is_latest = true`.
6. `etl_runs.status = 'success'`.

## Frontend

Next.js 15 (App Router, TypeScript, Tailwind). ISR med 30 min revalidate. Deployas på Vercel.

Sidor:

- `/` — nationell översikt
- `/region/[slug]` — per region
- `/matt/[slug]` — per mätetal, jämförelse mellan regioner
- `/jamfor` — bygg-din-egen
- `/om-data` — metodologi + källor
- `/api` — publik API-dokumentation
- `/ladda-ner` — CSV/JSON-nedladdning

## Publikt API

PostgREST via Supabase:

- `GET /rest/v1/regions`
- `GET /rest/v1/metrics`
- `GET /rest/v1/measurements_latest?metric_id=eq.<uuid>`
- `GET /rest/v1/measurements?region_id=eq.0001&order=fetched_at.desc`

Alla tabeller har RLS: anon får bara SELECT. Ingen skrivning utifrån.

## Pålitlighetsmekanismer

| Mekanism | Implementation |
|---|---|
| Källspårning per datapunkt | `measurements.source_url` + `source_id` + `snapshot_id` |
| Tidsstämpel per datapunkt | `measurements.fetched_at` |
| Versionerad historik | append-only + `is_latest` + `snapshot_id` |
| Reproducerbarhet | `raw_snapshots.payload_sha256` |
| Automatisk validering | `validations` + delta-regler före publicering |
| Publik nedladdning | `/ladda-ner` + `/api` |
| Öppen metodologi | `/om-data` med källbeskrivning per KPI |
