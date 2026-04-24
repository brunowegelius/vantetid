// Canonical static catalog — matches supabase seed (0002_seed.sql) one-to-one.
// Source: verified via api.kolada.se/v3/kpi on 2026-04-24.

import type { Region, Metric, Source } from "./types";

export const SOURCES: Source[] = [
  {
    id: "kolada", slug: "kolada", name: "Kolada (RKA)",
    homepage_url: "https://www.kolada.se", license: "CC BY 4.0",
    attribution: "Källa: Rådet för främjande av kommunala analyser (RKA) via Kolada",
    notes: "Kolada v3 REST-API.",
  },
  {
    id: "socialstyrelsen-pxweb", slug: "socialstyrelsen-pxweb",
    name: "Socialstyrelsen statistikdatabas",
    homepage_url: "https://px.socialstyrelsen.se",
    license: "Socialstyrelsens öppna data",
    attribution: "Källa: Socialstyrelsen",
    notes: "Sedan 1 juli 2025 samlar Socialstyrelsen in väntetidsdata direkt från regionerna.",
  },
  {
    id: "skr-vantetider", slug: "skr-vantetider",
    name: "Väntetider i vården (SKR)",
    homepage_url: "https://www.vantetider.se",
    license: "Fri användning med attribution",
    attribution: "Källa: Väntetider i vården, SKR",
    notes: "Parallell rapportering till SKR:s väntetidsdatabas pågår under 2026.",
  },
];

export const REGIONS: Region[] = [
  { id: "0000", slug: "riket",            name: "Riket",                        short_name: "Riket",             display_order: 0   },
  { id: "0001", slug: "stockholm",        name: "Region Stockholm",             short_name: "Stockholm",         display_order: 10  },
  { id: "0003", slug: "uppsala",          name: "Region Uppsala",               short_name: "Uppsala",           display_order: 20  },
  { id: "0004", slug: "sormland",         name: "Region Sörmland",              short_name: "Sörmland",          display_order: 30  },
  { id: "0005", slug: "ostergotland",     name: "Region Östergötland",          short_name: "Östergötland",      display_order: 40  },
  { id: "0006", slug: "jonkoping",        name: "Region Jönköpings län",        short_name: "Jönköping",         display_order: 50  },
  { id: "0007", slug: "kronoberg",        name: "Region Kronoberg",             short_name: "Kronoberg",         display_order: 60  },
  { id: "0008", slug: "kalmar",           name: "Region Kalmar",                short_name: "Kalmar",            display_order: 70  },
  { id: "0009", slug: "gotland",          name: "Region Gotland",               short_name: "Gotland",           display_order: 80  },
  { id: "0010", slug: "blekinge",         name: "Region Blekinge",              short_name: "Blekinge",          display_order: 90  },
  { id: "0012", slug: "skane",            name: "Region Skåne",                 short_name: "Skåne",             display_order: 100 },
  { id: "0013", slug: "halland",          name: "Region Halland",               short_name: "Halland",           display_order: 110 },
  { id: "0014", slug: "vastra-gotaland",  name: "Västra Götalandsregionen",     short_name: "Västra Götaland",   display_order: 120 },
  { id: "0017", slug: "varmland",         name: "Region Värmland",              short_name: "Värmland",          display_order: 130 },
  { id: "0018", slug: "orebro",           name: "Region Örebro län",            short_name: "Örebro",            display_order: 140 },
  { id: "0019", slug: "vastmanland",      name: "Region Västmanland",           short_name: "Västmanland",       display_order: 150 },
  { id: "0020", slug: "dalarna",          name: "Region Dalarna",               short_name: "Dalarna",           display_order: 160 },
  { id: "0021", slug: "gavleborg",        name: "Region Gävleborg",             short_name: "Gävleborg",         display_order: 170 },
  { id: "0022", slug: "vasternorrland",   name: "Region Västernorrland",        short_name: "Västernorrland",    display_order: 180 },
  { id: "0023", slug: "jamtland",         name: "Region Jämtland Härjedalen",   short_name: "Jämtland Härjedalen", display_order: 190 },
  { id: "0024", slug: "vasterbotten",     name: "Region Västerbotten",          short_name: "Västerbotten",      display_order: 200 },
  { id: "0025", slug: "norrbotten",       name: "Region Norrbotten",            short_name: "Norrbotten",        display_order: 210 },
];

export const METRICS: Metric[] = [
  {
    id: "specialist-forsta-kontakt-vantande-median",
    slug: "specialist-forsta-kontakt-vantande-median",
    name_sv: "Väntetid till första kontakt i specialiserad vård (väntande, median)",
    short_name_sv: "Specialistvård — väntande",
    description_sv: "Medianvärde för väntetid i dagar för de som väntar på första kontakt i specialiserad vård. Vårdgarantin är 90 dagar.",
    unit: "days", category: "specialist", better_direction: "lower",
    source_slug: "kolada", source_kpi_id: "N79240",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N79240/municipality/{region}",
    target_value: 90, display_order: 10,
  },
  {
    id: "specialist-forsta-kontakt-genomforda-median",
    slug: "specialist-forsta-kontakt-genomforda-median",
    name_sv: "Väntetid till första kontakt i specialiserad vård (genomförda, median)",
    short_name_sv: "Specialistvård — genomförda",
    description_sv: "Medianvärde för antalet dagar patienter faktiskt fick vänta till sitt första besök i specialiserad vård.",
    unit: "days", category: "specialist", better_direction: "lower",
    source_slug: "kolada", source_kpi_id: "N79241",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N79241/municipality/{region}",
    target_value: 90, display_order: 20,
  },
  {
    id: "operation-vantande-median",
    slug: "operation-vantande-median",
    name_sv: "Väntetid till operation/åtgärd (väntande, median)",
    short_name_sv: "Operation — väntande",
    description_sv: "Medianvärde för väntetid i dagar för de som väntar på operation eller åtgärd i specialiserad vård.",
    unit: "days", category: "operation", better_direction: "lower",
    source_slug: "kolada", source_kpi_id: "N79242",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N79242/municipality/{region}",
    target_value: 90, display_order: 30,
  },
  {
    id: "operation-genomforda-median",
    slug: "operation-genomforda-median",
    name_sv: "Väntetid till operation/åtgärd (genomförda, median)",
    short_name_sv: "Operation — genomförda",
    description_sv: "Medianvärde för antalet dagar patienter faktiskt fick vänta till operation eller åtgärd.",
    unit: "days", category: "operation", better_direction: "lower",
    source_slug: "kolada", source_kpi_id: "N79243",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N79243/municipality/{region}",
    target_value: 90, display_order: 40,
  },
  {
    id: "bup-forsta-besok-inom-90-dagar",
    slug: "bup-forsta-besok-inom-90-dagar",
    name_sv: "Första BUP-besök inom 90 dagar, andel (%)",
    short_name_sv: "BUP — första besök i tid",
    description_sv: "Andelen första besök i planerad barn- och ungdomspsykiatri som genomfördes inom 90 dagar från beslut om vård.",
    unit: "percent", category: "bup", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "U72552",
    source_url_template: "https://api.kolada.se/v3/data/kpi/U72552/municipality/{region}",
    target_value: 100, display_order: 50,
  },
  {
    id: "bup-utredning-behandling-inom-30-dagar",
    slug: "bup-utredning-behandling-inom-30-dagar",
    name_sv: "Startade BUP-utredningar/behandlingar inom 30 dagar, andel (%)",
    short_name_sv: "BUP — start i tid",
    description_sv: "Andelen utredningar och behandlingar som startats inom 30 dagar i barn- och ungdomspsykiatri.",
    unit: "percent", category: "bup", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "U79119",
    source_url_template: "https://api.kolada.se/v3/data/kpi/U79119/municipality/{region}",
    target_value: 100, display_order: 60,
  },
  {
    id: "upplevd-vantetid-sjukhus",
    slug: "upplevd-vantetid-sjukhus",
    name_sv: "Rimlig väntetid till sjukhusvård, andel (%)",
    short_name_sv: "Upplevd väntetid sjukhus",
    description_sv: "Andelen invånare som anser att väntetider till besök och behandling på sjukhus är rimliga. Källa: Hälso- och sjukvårdsbarometern.",
    unit: "percent", category: "perception", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "U70448",
    source_url_template: "https://api.kolada.se/v3/data/kpi/U70448/municipality/{region}",
    target_value: null, display_order: 70,
  },
  {
    id: "upplevd-vantetid-vardcentral",
    slug: "upplevd-vantetid-vardcentral",
    name_sv: "Rimlig väntetid till vård-/hälsocentral, andel (%)",
    short_name_sv: "Upplevd väntetid vårdcentral",
    description_sv: "Andelen invånare som anser att väntetider till besök och behandling på vård- eller hälsocentral är rimliga.",
    unit: "percent", category: "perception", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "U70450",
    source_url_template: "https://api.kolada.se/v3/data/kpi/U70450/municipality/{region}",
    target_value: null, display_order: 80,
  },
  {
    id: "prostatacancer-pad-11d",
    slug: "prostatacancer-pad-11d",
    name_sv: "Väntetid till prostatacancerbesked, andel (%)",
    short_name_sv: "Prostata — PAD i tid",
    description_sv: "Andelen män som fått PAD-besked (diagnosbesked) inom 11 dagar efter utförd prostatabiopsi.",
    unit: "percent", category: "cancer", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "N70619",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N70619/municipality/{region}",
    target_value: 100, display_order: 90,
  },
  {
    id: "prostatacancer-forsta-besok-14d",
    slug: "prostatacancer-forsta-besok-14d",
    name_sv: "Väntetid till första besök vid misstänkt prostatacancer, andel (%)",
    short_name_sv: "Prostata — första besök i tid",
    description_sv: "Andelen män med misstänkt prostatacancer som fått nybesök på specialistklinik inom 14 dagar efter remissankomst.",
    unit: "percent", category: "cancer", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "N70620",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N70620/municipality/{region}",
    target_value: 100, display_order: 100,
  },
  {
    id: "bup-vardplatser-per-1000",
    slug: "bup-vardplatser-per-1000",
    name_sv: "Disponibla BUP-vårdplatser per 1 000 invånare",
    short_name_sv: "BUP — vårdplatser",
    description_sv: "Antal disponibla vårdplatser inom barn- och ungdomspsykiatri dividerat med antal invånare (tusental).",
    unit: "per_1000", category: "capacity", better_direction: "higher",
    source_slug: "kolada", source_kpi_id: "N74816",
    source_url_template: "https://api.kolada.se/v3/data/kpi/N74816/municipality/{region}",
    target_value: null, display_order: 110,
  },
];

export const CATEGORY_LABEL: Record<Metric["category"], string> = {
  specialist: "Specialistvård",
  operation:  "Operation och åtgärd",
  primary:    "Primärvård",
  bup:        "Barn- och ungdomspsykiatri",
  cancer:     "Cancervård",
  emergency:  "Akutsjukvård",
  perception: "Patientupplevelse",
  capacity:   "Kapacitet",
};

export function getMetricBySlug(slug: string): Metric | undefined {
  return METRICS.find(m => m.slug === slug);
}
export function getRegionBySlug(slug: string): Region | undefined {
  return REGIONS.find(r => r.slug === slug);
}
export function getSourceBySlug(slug: string): Source | undefined {
  return SOURCES.find(s => s.slug === slug);
}
