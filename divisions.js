// Not Yet — Division structure (icon + tier only)
// Names, descriptions, and hints now live in i18n.js (TRANSLATIONS.<lang>.divisions.<key>)
// so the whole app can be shown in any supported language.
// To add a new Division: add its {key, icon, tier} here, then add matching
// divisions.<key> = {name, desc, hint} text to EVERY language block in i18n.js.

const CORE_DIVISION_META = [
  { key: "personalData", icon: "🪪", tier: 1 },
  { key: "advanceDirectives", icon: "🩺", tier: 1 },
  { key: "willsTrusts", icon: "⚖️", tier: 2 },
  { key: "assetsLiabilities", icon: "📊", tier: 2 },
  { key: "finalExpenseInsurance", icon: "🕊️", tier: 2 },
  { key: "banks", icon: "🏦", tier: 2 },
  { key: "creditDebitCards", icon: "💳", tier: 2 },
  { key: "personalItemsDistribution", icon: "🎁", tier: 3 },
  { key: "stocksBonds", icon: "📈", tier: 2 },
  { key: "voiceWrittenNotes", icon: "💌", tier: 3 },
  { key: "photoLocker", icon: "🖼️", tier: 3 },
];

const RECOMMENDED_DIVISION_META = [
  { key: "propertyVehicles", icon: "🚗", tier: 2 },
  { key: "digitalAccounts", icon: "🔑", tier: 2 },
  { key: "funeralArrangements", icon: "⚰️", tier: 1 },
  { key: "keyContacts", icon: "📇", tier: 1 },
  { key: "petsDependents", icon: "🐾", tier: 1 },
];

const TIER_COLOR = { 1: "#1F7A4D", 2: "#B08D57", 3: "#8A3B5E" };

// Live, language-aware division objects — rebuilt any time the language changes.
// Consumers (app.js) read CORE_DIVISIONS / RECOMMENDED_DIVISIONS / ALL_DIVISIONS / TIER_INFO.
let CORE_DIVISIONS = [];
let RECOMMENDED_DIVISIONS = [];
let ALL_DIVISIONS = [];
let TIER_INFO = {};

function buildDivisions() {
  const decorate = (meta) => ({
    key: meta.key,
    icon: meta.icon,
    tier: meta.tier,
    name: tDivision(meta.key, "name"),
    desc: tDivision(meta.key, "desc"),
    hint: tDivision(meta.key, "hint"),
  });
  CORE_DIVISIONS = CORE_DIVISION_META.map(decorate);
  RECOMMENDED_DIVISIONS = RECOMMENDED_DIVISION_META.map(decorate);
  ALL_DIVISIONS = CORE_DIVISIONS.concat(RECOMMENDED_DIVISIONS);
  TIER_INFO = {
    1: { label: t("ui.tier1Label"), color: TIER_COLOR[1], explain: t("ui.tier1Explain") },
    2: { label: t("ui.tier2Label"), color: TIER_COLOR[2], explain: t("ui.tier2Explain") },
    3: { label: t("ui.tier3Label"), color: TIER_COLOR[3], explain: t("ui.tier3Explain") },
  };
}
