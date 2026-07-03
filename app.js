// Not Yet — prototype app logic
// All data lives in localStorage on this device only. Nothing is sent anywhere.

const STORAGE_KEY = "notyet_data_v1";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through to default */ }
  }
  return {
    entries: {},        // { divisionKey: [ {id, title, details, forWhom, created, updated} ] }
    trustAnchors: [],   // [ {id, name, relation} ]
    quorum: 2,
    ledger: [],          // [ {time, action, division, title} ]
  };
}

let state = loadState();
let currentView = "home";
let editingDivision = null;
let editingEntryId = null;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function log(action, division, title) {
  state.ledger.unshift({
    time: new Date().toLocaleString(),
    action, division: division || "—", title: title || "",
  });
  if (state.ledger.length > 300) state.ledger.length = 300;
}

function entriesFor(key) {
  return state.entries[key] || [];
}

function divisionByKey(key) {
  return ALL_DIVISIONS.find((d) => d.key === key);
}

// ---------- Sidebar ----------
function renderSidebar() {
  const coreWrap = document.getElementById("coreDivisionList");
  const recWrap = document.getElementById("recDivisionList");
  coreWrap.innerHTML = "";
  recWrap.innerHTML = "";

  CORE_DIVISIONS.forEach((d) => coreWrap.appendChild(sideItem(d)));
  RECOMMENDED_DIVISIONS.forEach((d) => recWrap.appendChild(sideItem(d)));

  document.getElementById("homeNavBtn").classList.toggle("active", currentView === "home");
  document.getElementById("trustNavBtn").classList.toggle("active", currentView === "trust");
}

function sideItem(d) {
  const btn = document.createElement("button");
  btn.className = "side-item" + (currentView === d.key ? " active" : "");
  btn.innerHTML = `<span>${d.icon}</span><span>${d.name}</span><span class="count">${entriesFor(d.key).length}</span>`;
  btn.addEventListener("click", () => { currentView = d.key; render(); });
  return btn;
}

// ---------- Views ----------
function render() {
  renderSidebar();
  const content = document.getElementById("content");
  content.innerHTML = "";
  if (currentView === "home") content.appendChild(renderHome());
  else if (currentView === "trust") content.appendChild(renderTrust());
  else content.appendChild(renderDivision(currentView));
}

function renderHome() {
  const wrap = document.createElement("div");

  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML = `
    <h1>Not Yet</h1>
    <p>An outline to order. One safe, secure place for everything tied to your estate —
    organized into Divisions you can add to, renew, update, or delete at any time.
    Nothing is ever locked in.</p>
    <p class="privacy-note">🔒 This is a working prototype. Everything you type stays in this browser
    (local storage) — nothing is uploaded anywhere. Use “Export My Data” up top to keep a backup,
    or move to another device.</p>
  `;
  wrap.appendChild(hero);

  const h2 = document.createElement("h2");
  h2.textContent = "Core Divisions";
  wrap.appendChild(h2);
  wrap.appendChild(tileGrid(CORE_DIVISIONS));

  const h3 = document.createElement("h2");
  h3.textContent = "Recommended Additions";
  h3.style.marginTop = "28px";
  wrap.appendChild(h3);
  wrap.appendChild(tileGrid(RECOMMENDED_DIVISIONS));

  const trustCard = document.createElement("div");
  trustCard.className = "card";
  trustCard.style.marginTop = "28px";
  trustCard.innerHTML = `
    <h2>🔐 Trust Anchors &amp; Release Settings</h2>
    <p>Not a Division for your information — this is where you decide who can ever unlock this
    record, and how. See the Not Yet Protocol in action.</p>
    <button class="btn primary" id="goTrustBtn">Open Trust &amp; Release Settings</button>
  `;
  wrap.appendChild(trustCard);
  trustCard.querySelector("#goTrustBtn").addEventListener("click", () => { currentView = "trust"; render(); });

  return wrap;
}

function tileGrid(list) {
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  list.forEach((d) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.innerHTML = `
      <button class="tile-btn">
        <div class="tile-icon">${d.icon}</div>
        <h3>${d.name}</h3>
        <p>${d.desc}</p>
        <div class="tile-count">${entriesFor(d.key).length} ${entriesFor(d.key).length === 1 ? "entry" : "entries"}</div>
      </button>`;
    tile.querySelector("button").addEventListener("click", () => { currentView = d.key; render(); });
    grid.appendChild(tile);
  });
  return grid;
}

function renderDivision(key) {
  const d = divisionByKey(key);
  const wrap = document.createElement("div");
  const tier = TIER_INFO[d.tier];

  const header = document.createElement("div");
  header.className = "division-header";
  header.innerHTML = `
    <div>
      <span class="tier-badge" style="background:${tier.color}">${tier.label}</span>
      <h1><span class="division-icon">${d.icon}</span>${d.name}</h1>
      <p class="division-desc">${d.desc}</p>
    </div>
    <button class="btn primary" id="addEntryBtn">+ Add Entry</button>
  `;
  wrap.appendChild(header);

  const hint = document.createElement("div");
  hint.className = "division-hint";
  hint.innerHTML = `<strong>Ideas for this Division:</strong> ${d.hint}<br><em>${tier.explain}</em>`;
  wrap.appendChild(hint);

  const list = entriesFor(key);
  const listWrap = document.createElement("div");
  listWrap.className = "entry-list";

  if (list.length === 0) {
    listWrap.innerHTML = `<div class="empty-state">Nothing added to this Division yet. Click “+ Add Entry” to start.</div>`;
  } else {
    list.slice().reverse().forEach((entry) => listWrap.appendChild(entryCard(key, entry)));
  }
  wrap.appendChild(listWrap);

  header.querySelector("#addEntryBtn").addEventListener("click", () => openEntryModal(key));
  return wrap;
}

function entryCard(divisionKey, entry) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.innerHTML = `
    ${entry.forWhom ? `<div class="entry-for">For: ${escapeHtml(entry.forWhom)}</div>` : ""}
    <h4>${escapeHtml(entry.title)}</h4>
    <div class="entry-meta">Renewed ${entry.updated}</div>
    ${entry.details ? `<div class="entry-details">${escapeHtml(entry.details)}</div>` : ""}
    <div class="entry-actions">
      <button class="btn ghost small edit-btn">Edit / Renew</button>
      <button class="btn danger small del-btn">Delete</button>
    </div>
  `;
  card.style.borderLeftColor = TIER_INFO[divisionByKey(divisionKey).tier].color;
  card.querySelector(".edit-btn").addEventListener("click", () => openEntryModal(divisionKey, entry.id));
  card.querySelector(".del-btn").addEventListener("click", () => deleteEntry(divisionKey, entry.id));
  return card;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal / entry CRUD ----------
function openEntryModal(divisionKey, entryId) {
  editingDivision = divisionKey;
  editingEntryId = entryId || null;
  const d = divisionByKey(divisionKey);

  document.getElementById("modalTitle").textContent = entryId
    ? `Edit / Renew — ${d.name}`
    : `Add Entry — ${d.name}`;

  const titleInput = document.getElementById("entryTitle");
  const detailsInput = document.getElementById("entryDetails");
  const forInput = document.getElementById("entryFor");

  if (entryId) {
    const entry = entriesFor(divisionKey).find((e) => e.id === entryId);
    titleInput.value = entry.title;
    detailsInput.value = entry.details || "";
    forInput.value = entry.forWhom || "";
  } else {
    titleInput.value = "";
    detailsInput.value = "";
    forInput.value = "";
  }

  document.getElementById("modalBackdrop").hidden = false;
  titleInput.focus();
}

function closeEntryModal() {
  document.getElementById("modalBackdrop").hidden = true;
  editingDivision = null;
  editingEntryId = null;
}

function saveEntryFromForm(evt) {
  evt.preventDefault();
  const title = document.getElementById("entryTitle").value.trim();
  const details = document.getElementById("entryDetails").value.trim();
  const forWhom = document.getElementById("entryFor").value.trim();
  if (!title) return;

  if (!state.entries[editingDivision]) state.entries[editingDivision] = [];
  const now = new Date().toLocaleDateString();

  if (editingEntryId) {
    const entry = state.entries[editingDivision].find((e) => e.id === editingEntryId);
    entry.title = title; entry.details = details; entry.forWhom = forWhom; entry.updated = now;
    log("Renewed", divisionByKey(editingDivision).name, title);
  } else {
    state.entries[editingDivision].push({
      id: "e" + Date.now() + Math.random().toString(36).slice(2, 7),
      title, details, forWhom, created: now, updated: now,
    });
    log("Added", divisionByKey(editingDivision).name, title);
  }
  saveState();
  closeEntryModal();
  render();
}

function deleteEntry(divisionKey, entryId) {
  const entry = entriesFor(divisionKey).find((e) => e.id === entryId);
  if (!confirm(`Delete "${entry.title}"? This can't be undone.`)) return;
  state.entries[divisionKey] = entriesFor(divisionKey).filter((e) => e.id !== entryId);
  log("Deleted", divisionByKey(divisionKey).name, entry.title);
  saveState();
  render();
}

// ---------- Trust & Release Settings ----------
function renderTrust() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h1>🔐 Trust Anchors &amp; Release Settings</h1>`;

  const callout = document.createElement("div");
  callout.className = "callout";
  callout.innerHTML = `This screen demonstrates the <strong>Not Yet Protocol</strong> concept: while you're alive,
    nobody — not even a Trust Anchor — can see your Divisions. Only when enough Anchors independently confirm
    your passing, plus one objective signal, does a 48–72 hour reversible hold begin. Only then do Divisions
    release, in tiers. <em>Nothing here actually verifies death or encrypts data — it's a demonstration of the
    idea for review, not a working security system.</em>`;
  wrap.appendChild(callout);

  // Trust Anchors card
  const anchorCard = document.createElement("div");
  anchorCard.className = "card";
  anchorCard.innerHTML = `
    <h2>Trust Anchors</h2>
    <p>People who, together, can confirm your passing. No single Anchor can act alone.</p>
    <div id="anchorList"></div>
    <div class="inline-form">
      <input type="text" id="anchorName" placeholder="Name">
      <input type="text" id="anchorRel" placeholder="Relationship (e.g. Daughter, Attorney, Community Manager)">
      <button class="btn primary" id="addAnchorBtn">+ Add Anchor</button>
    </div>
  `;
  wrap.appendChild(anchorCard);

  const anchorList = anchorCard.querySelector("#anchorList");
  if (state.trustAnchors.length === 0) {
    anchorList.innerHTML = `<div class="empty-state">No Trust Anchors added yet.</div>`;
  } else {
    state.trustAnchors.forEach((a) => {
      const row = document.createElement("div");
      row.className = "anchor-row";
      row.innerHTML = `<span class="name">${escapeHtml(a.name)}</span><span class="rel">${escapeHtml(a.relation)}</span>`;
      const rm = document.createElement("button");
      rm.className = "btn ghost small";
      rm.textContent = "Remove";
      rm.addEventListener("click", () => {
        state.trustAnchors = state.trustAnchors.filter((x) => x.id !== a.id);
        if (state.quorum > state.trustAnchors.length) state.quorum = Math.max(1, state.trustAnchors.length);
        saveState(); render();
      });
      row.appendChild(rm);
      anchorList.appendChild(row);
    });
  }

  anchorCard.querySelector("#addAnchorBtn").addEventListener("click", () => {
    const name = document.getElementById("anchorName").value.trim();
    const relation = document.getElementById("anchorRel").value.trim();
    if (!name) return;
    state.trustAnchors.push({ id: "a" + Date.now(), name, relation: relation || "Trust Anchor" });
    log("Added Trust Anchor", "System", name);
    saveState();
    render();
  });

  // Quorum card
  const quorumCard = document.createElement("div");
  quorumCard.className = "card";
  const maxAnchors = Math.max(state.trustAnchors.length, 1);
  let options = "";
  for (let i = 1; i <= maxAnchors; i++) {
    options += `<option value="${i}" ${state.quorum === i ? "selected" : ""}>${i} of ${maxAnchors}</option>`;
  }
  quorumCard.innerHTML = `
    <h2>Verification Quorum</h2>
    <p>How many Trust Anchors must independently confirm your passing — plus one objective signal
    (death certificate, funeral home, or obituary match) — before the reversible hold begins.</p>
    <div class="inline-form">
      <label for="quorumSelect" style="align-self:center;font-weight:700;">Require</label>
      <select id="quorumSelect">${options}</select>
      <span style="align-self:center;color:var(--grey)">Anchors to agree, then a 48–72 hr hold before anything unlocks.</span>
    </div>
  `;
  wrap.appendChild(quorumCard);
  quorumCard.querySelector("#quorumSelect").addEventListener("change", (e) => {
    state.quorum = parseInt(e.target.value, 10);
    saveState();
  });

  // Tier explainer
  const tierCard = document.createElement("div");
  tierCard.className = "card";
  tierCard.innerHTML = `
    <h2>Graduated Release by Tier</h2>
    <table class="tier-table">
      <tr><th>Tier</th><th>What Releases</th><th>Who Sees It</th></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[1].color}">${TIER_INFO[1].label}</span></td>
          <td>Advance Directives, Funeral Arrangements, Personal Data, Key Contacts, Pets &amp; Dependents</td>
          <td>Everyone the owner designates — immediately once the Quorum is met.</td></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[2].color}">${TIER_INFO[2].label}</span></td>
          <td>Wills &amp; Trusts, Assets &amp; Liabilities, Insurance, Banks, Cards, Stocks &amp; Bonds, Property/Vehicle Titles, Digital Accounts</td>
          <td>Named executor / legal representative only, after the hold clears.</td></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[3].color}">${TIER_INFO[3].label}</span></td>
          <td>Personal Items &amp; Distribution, Voice &amp; Written Notes, Photo Locker</td>
          <td>Only the individual person each entry is addressed to.</td></tr>
    </table>
  `;
  wrap.appendChild(tierCard);

  // Ledger
  const ledgerCard = document.createElement("div");
  ledgerCard.className = "card";
  ledgerCard.innerHTML = `<h2>Immutable Access Ledger</h2>
    <p>Every add, renew, and delete in this prototype is logged here — a stand-in for the tamper-evident
    log that would prove nothing was altered or viewed early.</p>`;
  const ledgerWrap = document.createElement("div");
  ledgerWrap.className = "ledger";
  if (state.ledger.length === 0) {
    ledgerWrap.innerHTML = `<div class="empty-state">No activity yet.</div>`;
  } else {
    state.ledger.forEach((l) => {
      const row = document.createElement("div");
      row.className = "ledger-row";
      row.innerHTML = `<span class="t">${l.time}</span><span class="a">${l.action}</span><span>${escapeHtml(l.division)} — ${escapeHtml(l.title)}</span>`;
      ledgerWrap.appendChild(row);
    });
  }
  ledgerCard.appendChild(ledgerWrap);
  wrap.appendChild(ledgerCard);

  return wrap;
}

// ---------- Export / Import ----------
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `not-yet-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.entries) throw new Error("not a Not Yet backup file");
      state = Object.assign(loadState(), parsed);
      saveState();
      render();
      alert("Import complete.");
    } catch (e) {
      alert("That file doesn't look like a Not Yet backup.");
    }
  };
  reader.readAsText(file);
}

// ---------- Wire up ----------
document.getElementById("logoHome").addEventListener("click", () => { currentView = "home"; render(); });
document.getElementById("homeNavBtn").addEventListener("click", () => { currentView = "home"; render(); });
document.getElementById("trustNavBtn").addEventListener("click", () => { currentView = "trust"; render(); });
document.getElementById("trustBtn").addEventListener("click", () => { currentView = "trust"; render(); });
document.getElementById("entryForm").addEventListener("submit", saveEntryFromForm);
document.getElementById("cancelEntryBtn").addEventListener("click", closeEntryModal);
document.getElementById("modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeEntryModal(); });
document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("importFile").addEventListener("change", (e) => {
  if (e.target.files[0]) importData(e.target.files[0]);
  e.target.value = "";
});

render();
