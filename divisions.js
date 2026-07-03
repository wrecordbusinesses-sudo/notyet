// Not Yet — Division definitions
// tier: 1 = immediate, 2 = after the hold (executor only), 3 = addressed / never broadcast

const CORE_DIVISIONS = [
  { key: "personalData", icon: "🪪", name: "Personal Data", tier: 1,
    desc: "Core identifying and biographical information.",
    hint: "Full legal name & aliases, date/place of birth, marriage or divorce records, military discharge (DD-214), family tree." },
  { key: "advanceDirectives", icon: "🩺", name: "Advance Directives", tier: 1,
    desc: "Medical wishes while still living but unable to speak for yourself.",
    hint: "Living will, healthcare power of attorney, DNR, organ donation choice, preferred hospital or physician." },
  { key: "willsTrusts", icon: "⚖️", name: "Wills & Trusts", tier: 2,
    desc: "Legal instruments governing the estate.",
    hint: "Location of the original will, executor name & contact, trust documents, attorney of record, safe-deposit box location." },
  { key: "assetsLiabilities", icon: "📊", name: "Assets & Liabilities", tier: 2,
    desc: "A full net-worth snapshot.",
    hint: "Real property, mortgages, personal loans, business interests, outstanding debts." },
  { key: "finalExpenseInsurance", icon: "🕊️", name: "Final Expense / Life Insurance", tier: 2,
    desc: "Policies that pay out at death.",
    hint: "Carrier & policy number, beneficiaries, agent contact, prepaid or burial plan details." },
  { key: "banks", icon: "🏦", name: "Banks & Financial Institutions", tier: 2,
    desc: "Where the money lives.",
    hint: "Bank & account type, last 4 digits only, branch contact, safe-deposit boxes. Never store full account numbers or passwords here." },
  { key: "creditDebitCards", icon: "💳", name: "Credit & Debit Cards", tier: 2,
    desc: "Cards and the autopay tied to them.",
    hint: "Issuer, last 4 digits, linked autopay subscriptions, who to call to close the account." },
  { key: "personalItemsDistribution", icon: "🎁", name: "Personal Items & Distribution", tier: 3,
    desc: "The “who gets what” for sentimental and physical items.",
    hint: "Item-by-item or room-by-room, with the intended recipient named in “Who is this for?” below." },
  { key: "stocksBonds", icon: "📈", name: "Stocks & Bonds", tier: 2,
    desc: "Investment holdings.",
    hint: "Brokerage accounts, holdings summary, advisor contact, dividend/DRIP notes." },
  { key: "voiceWrittenNotes", icon: "💌", name: "Voice & Written Notes", tier: 3,
    desc: "Private messages to specific people.",
    hint: "Recorded audio/video messages, sealed letters — use “Who is this for?” so it's delivered only to them." },
  { key: "photoLocker", icon: "🖼️", name: "Photo Locker", tier: 3,
    desc: "Keepsake photos and videos.",
    hint: "Organized by person or era, with the story behind each one (attach or link the actual photo/video elsewhere)." },
];

const RECOMMENDED_DIVISIONS = [
  { key: "propertyVehicles", icon: "🚗", name: "Property, Vehicles & Titles", tier: 2,
    desc: "Real estate and titled property — including the manufactured-home dual-title issue.",
    hint: "Home deed vs. DMV-issued mobile home title, cars, boats, RVs, lot lease agreements." },
  { key: "digitalAccounts", icon: "🔑", name: "Digital Accounts & Passwords", tier: 2,
    desc: "The modern estate most plans forget.",
    hint: "Email, social media, subscriptions, cloud storage, crypto. Point to a password manager — never store plaintext passwords here." },
  { key: "funeralArrangements", icon: "⚰️", name: "Funeral & Final Arrangements", tier: 1,
    desc: "The service itself, separate from medical directives.",
    hint: "Burial vs. cremation, plot location/deed, service preferences, music/readings, draft obituary." },
  { key: "keyContacts", icon: "📇", name: "Key Contacts / Support Team", tier: 1,
    desc: "The people who need to be reachable fast.",
    hint: "Executor, attorney, CPA, financial advisor, clergy, doctor, community manager." },
  { key: "petsDependents", icon: "🐾", name: "Pets & Dependents", tier: 1,
    desc: "Care continuity for those who depend on you.",
    hint: "Vet contact, feeding/medical routine, guardianship wishes." },
];

const ALL_DIVISIONS = [...CORE_DIVISIONS, ...RECOMMENDED_DIVISIONS];

const TIER_INFO = {
  1: { label: "Tier 1 — Immediate", color: "#1F7A4D",
       explain: "Released the moment the Verification Quorum is met — no waiting window, because it's time-sensitive." },
  2: { label: "Tier 2 — After the Hold", color: "#B08D57",
       explain: "Released to the named executor only, after the 48–72 hour reversible hold clears." },
  3: { label: "Tier 3 — Addressed", color: "#8A3B5E",
       explain: "Each entry unlocks only to the one person it's addressed to — never broadcast to everyone." },
};
