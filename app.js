// Not Yet — prototype app logic
// All data lives in localStorage on this device only. Nothing is sent anywhere.

const STORAGE_KEY = "notyet_data_v1";

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* fall through to default */ }
  }
  return {
    entries: {},        // { divisionKey: [ {id, title, details, forWhom, created, updated, audioData, audioMime} ] }
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

// ============================================================
// Feature detection
// ============================================================
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
function supportsSpeechRecognition() { return !!SpeechRecognitionAPI; }
function supportsMediaRecorder() {
  return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
function supportsSpeechSynthesis() { return !!window.speechSynthesis; }
function currentSpeechLang() {
  const l = LANGUAGES.find((x) => x.code === getLang());
  return l ? l.speech : "en-US";
}

// ============================================================
// Language
// ============================================================
function initLanguageSelect() {
  const sel = document.getElementById("langSelect");
  sel.innerHTML = "";
  LANGUAGES.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.label;
    sel.appendChild(opt);
  });
  sel.value = getLang();
  sel.addEventListener("change", (e) => {
    setLangStorage(e.target.value);
    document.documentElement.lang = e.target.value;
    buildDivisions();
    applyStaticTranslations();
    render();
  });
}

function applyStaticTranslations() {
  document.getElementById("brandTagText").textContent = t("ui.brandTag");
  document.getElementById("exportBtn").textContent = t("ui.exportBtn");
  document.getElementById("importLabelText").textContent = t("ui.importBtn");
  document.getElementById("trustBtn").innerHTML = "🔐 " + t("ui.trustBtn");
  document.getElementById("homeNavText").textContent = t("ui.homeNav");
  document.getElementById("coreLabelText").textContent = t("ui.coreDivisionsLabel");
  document.getElementById("recLabelText").textContent = t("ui.recommendedLabel");
  document.getElementById("systemLabelText").textContent = t("ui.systemLabel");
  document.getElementById("trustNavText").textContent = t("ui.trustBtn");
  document.getElementById("footerNoteText").textContent = t("ui.footerNote");
  document.getElementById("titleLabelText").firstChild.textContent = t("ui.titleLabel") + " ";
  document.getElementById("entryTitle").placeholder = t("ui.titlePlaceholder");
  document.getElementById("detailsLabelText").firstChild.textContent = t("ui.detailsLabel") + " ";
  document.getElementById("entryDetails").placeholder = t("ui.detailsPlaceholder");
  document.getElementById("forLabelText").firstChild.textContent = t("ui.forInputLabel") + " ";
  document.getElementById("forOptionalText").textContent = t("ui.forInputOptional");
  document.getElementById("entryFor").placeholder = t("ui.forPlaceholder");
  document.getElementById("recordLabelText").textContent = t("ui.recordLabel");
  document.getElementById("recordStartBtn").textContent = t("ui.recordStart");
  document.getElementById("recordStopBtn").textContent = t("ui.recordStop");
  document.getElementById("recordRedoBtn").textContent = t("ui.recordRedo");
  document.getElementById("recordDeleteBtn").textContent = t("ui.recordDelete");
  document.getElementById("micUnsupportedNote").textContent = t("ui.micNotSupported");
  document.getElementById("cancelEntryBtn").textContent = t("ui.cancelBtn");
  document.getElementById("saveEntryBtn").textContent = t("ui.saveBtn");
  const rIndicator = document.getElementById("recordingIndicator");
  rIndicator.innerHTML = `<span class="rec-dot"></span> ${t("ui.recordingInProgress")}`;
}

// ============================================================
// Sidebar
// ============================================================
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

// ============================================================
// Views
// ============================================================
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
    <h1>${t("ui.heroTitle")}</h1>
    <p>${t("ui.heroP1")}</p>
    <p class="privacy-note">${t("ui.heroPrivacy")}</p>
  `;
  wrap.appendChild(hero);

  const h2 = document.createElement("h2");
  h2.textContent = t("ui.coreDivisionsLabel");
  wrap.appendChild(h2);
  wrap.appendChild(tileGrid(CORE_DIVISIONS));

  const h3 = document.createElement("h2");
  h3.textContent = t("ui.recommendedLabel");
  h3.style.marginTop = "28px";
  wrap.appendChild(h3);
  wrap.appendChild(tileGrid(RECOMMENDED_DIVISIONS));

  const trustCard = document.createElement("div");
  trustCard.className = "card";
  trustCard.style.marginTop = "28px";
  trustCard.innerHTML = `
    <h2>${t("ui.trustCardTitle")}</h2>
    <p>${t("ui.trustCardBody")}</p>
    <button class="btn primary" id="goTrustBtn">${t("ui.trustCardBtn")}</button>
  `;
  wrap.appendChild(trustCard);
  trustCard.querySelector("#goTrustBtn").addEventListener("click", () => { currentView = "trust"; render(); });

  return wrap;
}

function tileGrid(list) {
  const grid = document.createElement("div");
  grid.className = "tile-grid";
  list.forEach((d) => {
    const count = entriesFor(d.key).length;
    const word = count === 1 ? t("ui.entryWord") : t("ui.entriesWord");
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.innerHTML = `
      <button class="tile-btn">
        <div class="tile-icon">${d.icon}</div>
        <h3>${d.name}</h3>
        <p>${d.desc}</p>
        <div class="tile-count">${count} ${word}</div>
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
      <h1><span class="division-icon">${d.icon}</span>${d.name}
        ${supportsSpeechSynthesis() ? `<button class="btn ghost small read-aloud-btn" id="readAloudBtn">${t("ui.readAloudBtn")}</button>` : ""}
      </h1>
      <p class="division-desc">${d.desc}</p>
    </div>
    <button class="btn primary" id="addEntryBtn">${t("ui.addEntryBtn")}</button>
  `;
  wrap.appendChild(header);

  const hint = document.createElement("div");
  hint.className = "division-hint";
  hint.innerHTML = `<strong>${t("ui.ideasForDivision")}</strong> ${d.hint}<br><em>${tier.explain}</em>`;
  wrap.appendChild(hint);

  const list = entriesFor(key);
  const listWrap = document.createElement("div");
  listWrap.className = "entry-list";

  if (list.length === 0) {
    listWrap.innerHTML = `<div class="empty-state">${t("ui.emptyDivision")}</div>`;
  } else {
    list.slice().reverse().forEach((entry) => listWrap.appendChild(entryCard(key, entry)));
  }
  wrap.appendChild(listWrap);

  header.querySelector("#addEntryBtn").addEventListener("click", () => openEntryModal(key));
  const readBtn = header.querySelector("#readAloudBtn");
  if (readBtn) readBtn.addEventListener("click", () => speak(`${d.name}. ${d.desc} ${d.hint}`));
  return wrap;
}

function entryCard(divisionKey, entry) {
  const card = document.createElement("div");
  card.className = "entry-card";
  card.innerHTML = `
    ${entry.forWhom ? `<div class="entry-for">${t("ui.forLabel")} ${escapeHtml(entry.forWhom)}</div>` : ""}
    <h4>${escapeHtml(entry.title)}</h4>
    <div class="entry-meta">${t("ui.renewedLabel")} ${entry.updated}</div>
    ${entry.details ? `<div class="entry-details">${escapeHtml(entry.details)}</div>` : ""}
    ${entry.audioData ? `<audio controls src="${entry.audioData}" style="width:100%;margin-bottom:10px;"></audio>` : ""}
    <div class="entry-actions">
      <button class="btn ghost small edit-btn">${t("ui.editRenewBtn")}</button>
      <button class="btn danger small del-btn">${t("ui.deleteBtn")}</button>
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

// ============================================================
// Modal / entry CRUD
// ============================================================
let pendingAudioData = null;
let pendingAudioMime = null;

function openEntryModal(divisionKey, entryId) {
  editingDivision = divisionKey;
  editingEntryId = entryId || null;
  const d = divisionByKey(divisionKey);

  document.getElementById("modalTitle").textContent = entryId
    ? t("ui.modalEditPrefix") + d.name
    : t("ui.modalAddPrefix") + d.name;

  const titleInput = document.getElementById("entryTitle");
  const detailsInput = document.getElementById("entryDetails");
  const forInput = document.getElementById("entryFor");

  resetRecordingUI();

  if (entryId) {
    const entry = entriesFor(divisionKey).find((e) => e.id === entryId);
    titleInput.value = entry.title;
    detailsInput.value = entry.details || "";
    forInput.value = entry.forWhom || "";
    if (entry.audioData) {
      pendingAudioData = entry.audioData;
      pendingAudioMime = entry.audioMime;
      showRecordingPlayback(entry.audioData);
    }
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
  stopDictation();
  stopActiveRecording();
}

function saveEntryFromForm(evt) {
  if (evt) evt.preventDefault();
  const title = document.getElementById("entryTitle").value.trim();
  const details = document.getElementById("entryDetails").value.trim();
  const forWhom = document.getElementById("entryFor").value.trim();
  if (!title) return;

  if (!state.entries[editingDivision]) state.entries[editingDivision] = [];
  const now = new Date().toLocaleDateString();

  if (editingEntryId) {
    const entry = state.entries[editingDivision].find((e) => e.id === editingEntryId);
    entry.title = title; entry.details = details; entry.forWhom = forWhom; entry.updated = now;
    entry.audioData = pendingAudioData || null;
    entry.audioMime = pendingAudioMime || null;
    log("Renewed", divisionByKey(editingDivision).name, title);
  } else {
    state.entries[editingDivision].push({
      id: "e" + Date.now() + Math.random().toString(36).slice(2, 7),
      title, details, forWhom, created: now, updated: now,
      audioData: pendingAudioData || null, audioMime: pendingAudioMime || null,
    });
    log("Added", divisionByKey(editingDivision).name, title);
  }
  saveState();
  closeEntryModal();
  render();
}

function deleteEntry(divisionKey, entryId) {
  const entry = entriesFor(divisionKey).find((e) => e.id === entryId);
  if (!confirm(`${t("ui.deleteConfirmPrefix")}${entry.title}${t("ui.deleteConfirmSuffix")}`)) return;
  state.entries[divisionKey] = entriesFor(divisionKey).filter((e) => e.id !== entryId);
  log("Deleted", divisionByKey(divisionKey).name, entry.title);
  saveState();
  render();
}

// ============================================================
// Audio recording (voice notes on entries)
// ============================================================
let mediaRecorder = null;
let audioChunks = [];
let activeStream = null;

function pickAudioMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function resetRecordingUI() {
  pendingAudioData = null;
  pendingAudioMime = null;
  document.getElementById("recordStartBtn").hidden = false;
  document.getElementById("recordStopBtn").hidden = true;
  document.getElementById("recordRedoBtn").hidden = true;
  document.getElementById("recordDeleteBtn").hidden = true;
  document.getElementById("recordingIndicator").hidden = true;
  const playback = document.getElementById("recordPlayback");
  playback.hidden = true;
  playback.removeAttribute("src");
}

function showRecordingPlayback(dataUrl) {
  document.getElementById("recordStartBtn").hidden = true;
  document.getElementById("recordStopBtn").hidden = true;
  document.getElementById("recordRedoBtn").hidden = false;
  document.getElementById("recordDeleteBtn").hidden = false;
  document.getElementById("recordingIndicator").hidden = true;
  const playback = document.getElementById("recordPlayback");
  playback.src = dataUrl;
  playback.hidden = false;
}

function startRecording() {
  if (!supportsMediaRecorder()) return;
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    activeStream = stream;
    audioChunks = [];
    const mimeType = pickAudioMime();
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 }) : new MediaRecorder(stream);
    mediaRecorder.addEventListener("dataavailable", (e) => { if (e.data.size > 0) audioChunks.push(e.data); });
    mediaRecorder.addEventListener("stop", () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => {
        pendingAudioData = reader.result;
        pendingAudioMime = blob.type;
        showRecordingPlayback(pendingAudioData);
      };
      reader.readAsDataURL(blob);
      if (activeStream) { activeStream.getTracks().forEach((tr) => tr.stop()); activeStream = null; }
    });
    mediaRecorder.start();
    document.getElementById("recordStartBtn").hidden = true;
    document.getElementById("recordStopBtn").hidden = false;
    document.getElementById("recordingIndicator").hidden = false;
  }).catch(() => {
    alert(t("ui.micNotSupported"));
  });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
}

function stopActiveRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
  if (activeStream) { activeStream.getTracks().forEach((tr) => tr.stop()); activeStream = null; }
}

// ============================================================
// Dictation (voice-to-text for Title / Details fields)
// ============================================================
let dictationRecognition = null;
let dictationTargetInput = null;
let dictationTargetBtn = null;

function toggleDictation(inputEl, btnEl) {
  if (!supportsSpeechRecognition()) { alert(t("ui.voiceNotSupported")); return; }
  if (dictationRecognition && dictationTargetInput === inputEl) {
    stopDictation();
    return;
  }
  stopDictation();
  dictationTargetInput = inputEl;
  dictationTargetBtn = btnEl;
  dictationRecognition = new SpeechRecognitionAPI();
  dictationRecognition.continuous = true;
  dictationRecognition.interimResults = false;
  dictationRecognition.lang = currentSpeechLang();
  dictationRecognition.addEventListener("result", (e) => {
    let finalText = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
    }
    if (finalText) {
      inputEl.value = (inputEl.value ? inputEl.value.trim() + " " : "") + finalText.trim();
    }
  });
  dictationRecognition.addEventListener("end", () => {
    btnEl.classList.remove("listening");
    if (dictationTargetInput === inputEl) { dictationRecognition = null; dictationTargetInput = null; dictationTargetBtn = null; }
  });
  dictationRecognition.addEventListener("error", () => {
    btnEl.classList.remove("listening");
  });
  btnEl.classList.add("listening");
  dictationRecognition.start();
}

function stopDictation() {
  if (dictationRecognition) {
    try { dictationRecognition.stop(); } catch (e) { /* no-op */ }
  }
  if (dictationTargetBtn) dictationTargetBtn.classList.remove("listening");
  dictationRecognition = null;
  dictationTargetInput = null;
  dictationTargetBtn = null;
}

// ============================================================
// Read aloud (text-to-speech)
// ============================================================
function speak(text) {
  if (!supportsSpeechSynthesis()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentSpeechLang();
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(getLang()));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

// ============================================================
// Voice control (navigation by spoken command)
// ============================================================
let commandRecognition = null;
let voiceActive = false;

function setVoiceStatus(msg) {
  const el = document.getElementById("voiceStatus");
  if (!msg) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = msg;
}

function toggleVoiceControl() {
  if (voiceActive) { stopVoiceControl(); return; }
  if (!supportsSpeechRecognition()) { setVoiceStatus(t("ui.voiceNotSupported")); return; }
  voiceActive = true;
  document.getElementById("voiceFab").classList.add("listening");
  setVoiceStatus(t("ui.voiceListening"));
  startCommandRecognition();
}

function startCommandRecognition() {
  commandRecognition = new SpeechRecognitionAPI();
  commandRecognition.continuous = true;
  commandRecognition.interimResults = false;
  commandRecognition.lang = currentSpeechLang();
  commandRecognition.addEventListener("result", (e) => {
    const last = e.results[e.results.length - 1];
    if (last.isFinal) {
      const text = normalizeVoiceText(last[0].transcript);
      handleVoiceCommand(text);
    }
  });
  commandRecognition.addEventListener("end", () => {
    if (voiceActive) {
      try { commandRecognition.start(); } catch (e) { /* already started / no-op */ }
    }
  });
  commandRecognition.addEventListener("error", (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      stopVoiceControl();
      setVoiceStatus(t("ui.voiceNotSupported"));
    }
  });
  commandRecognition.start();
}

function stopVoiceControl() {
  voiceActive = false;
  document.getElementById("voiceFab").classList.remove("listening");
  setVoiceStatus(null);
  if (commandRecognition) {
    try { commandRecognition.stop(); } catch (e) { /* no-op */ }
  }
  commandRecognition = null;
}

function handleVoiceCommand(text) {
  const lang = getLang();
  const cmds = VOICE_COMMANDS[lang] || VOICE_COMMANDS.en;
  const matches = (phrases) => phrases.some((p) => text.includes(p) || p.includes(text));

  if (matches(cmds.stop)) { stopVoiceControl(); return; }
  if (matches(cmds.home)) { currentView = "home"; render(); setVoiceStatus(t("ui.voiceListening")); return; }
  if (matches(cmds.cancel)) {
    if (!document.getElementById("modalBackdrop").hidden) closeEntryModal();
    setVoiceStatus(t("ui.voiceListening"));
    return;
  }
  if (matches(cmds.save)) {
    if (!document.getElementById("modalBackdrop").hidden) saveEntryFromForm(null);
    setVoiceStatus(t("ui.voiceListening"));
    return;
  }
  if (matches(cmds.addEntry)) {
    if (currentView !== "home" && currentView !== "trust") openEntryModal(currentView);
    setVoiceStatus(t("ui.voiceListening"));
    return;
  }
  if (matches(cmds.read)) {
    const d = divisionByKey(currentView);
    if (d) speak(`${d.name}. ${d.desc} ${d.hint}`);
    setVoiceStatus(t("ui.voiceListening"));
    return;
  }
  // Try matching a division name
  const found = ALL_DIVISIONS.find((d) => {
    const norm = normalizeVoiceText(d.name);
    return text.includes(norm) || norm.includes(text);
  });
  if (found) { currentView = found.key; render(); }
  setVoiceStatus(t("ui.voiceListening"));
}

// ============================================================
// Trust & Release Settings
// ============================================================
function renderTrust() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h1>${t("ui.trustPageTitle")}</h1>`;

  const callout = document.createElement("div");
  callout.className = "callout";
  callout.textContent = t("ui.trustCallout");
  wrap.appendChild(callout);

  // Trust Anchors card
  const anchorCard = document.createElement("div");
  anchorCard.className = "card";
  anchorCard.innerHTML = `
    <h2>${t("ui.anchorsTitle")}</h2>
    <p>${t("ui.anchorsDesc")}</p>
    <div id="anchorList"></div>
    <div class="inline-form">
      <input type="text" id="anchorName" placeholder="${t("ui.namePlaceholder")}">
      <input type="text" id="anchorRel" placeholder="${t("ui.relPlaceholder")}">
      <button class="btn primary" id="addAnchorBtn">${t("ui.addAnchorBtn")}</button>
    </div>
  `;
  wrap.appendChild(anchorCard);

  const anchorList = anchorCard.querySelector("#anchorList");
  if (state.trustAnchors.length === 0) {
    anchorList.innerHTML = `<div class="empty-state">${t("ui.noAnchors")}</div>`;
  } else {
    state.trustAnchors.forEach((a) => {
      const row = document.createElement("div");
      row.className = "anchor-row";
      row.innerHTML = `<span class="name">${escapeHtml(a.name)}</span><span class="rel">${escapeHtml(a.relation)}</span>`;
      const rm = document.createElement("button");
      rm.className = "btn ghost small";
      rm.textContent = t("ui.removeBtn");
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
    state.trustAnchors.push({ id: "a" + Date.now(), name, relation: relation || t("ui.anchorsTitle") });
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
    options += `<option value="${i}" ${state.quorum === i ? "selected" : ""}>${i}${t("ui.quorumOf")}${maxAnchors}</option>`;
  }
  quorumCard.innerHTML = `
    <h2>${t("ui.quorumTitle")}</h2>
    <p>${t("ui.quorumDesc")}</p>
    <div class="inline-form">
      <label for="quorumSelect" style="align-self:center;font-weight:700;">${t("ui.requireLabel")}</label>
      <select id="quorumSelect">${options}</select>
      <span style="align-self:center;color:var(--grey)">${t("ui.quorumTail")}</span>
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
    <h2>${t("ui.tierSectionTitle")}</h2>
    <table class="tier-table">
      <tr><th>${t("ui.tierColTier")}</th><th>${t("ui.tierColWhat")}</th><th>${t("ui.tierColWho")}</th></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[1].color}">${TIER_INFO[1].label}</span></td>
          <td>${t("ui.tier1What")}</td>
          <td>${t("ui.tier1Who")}</td></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[2].color}">${TIER_INFO[2].label}</span></td>
          <td>${t("ui.tier2What")}</td>
          <td>${t("ui.tier2Who")}</td></tr>
      <tr><td><span class="tier-badge" style="background:${TIER_INFO[3].color}">${TIER_INFO[3].label}</span></td>
          <td>${t("ui.tier3What")}</td>
          <td>${t("ui.tier3Who")}</td></tr>
    </table>
  `;
  wrap.appendChild(tierCard);

  // Ledger
  const ledgerCard = document.createElement("div");
  ledgerCard.className = "card";
  ledgerCard.innerHTML = `<h2>${t("ui.ledgerTitle")}</h2><p>${t("ui.ledgerDesc")}</p>`;
  const ledgerWrap = document.createElement("div");
  ledgerWrap.className = "ledger";
  if (state.ledger.length === 0) {
    ledgerWrap.innerHTML = `<div class="empty-state">${t("ui.noActivity")}</div>`;
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

// ============================================================
// Export / Import
// ============================================================
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

// ============================================================
// Wire up
// ============================================================
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

// Dictation buttons
document.getElementById("dictateTitleBtn").addEventListener("click", () =>
  toggleDictation(document.getElementById("entryTitle"), document.getElementById("dictateTitleBtn")));
document.getElementById("dictateDetailsBtn").addEventListener("click", () =>
  toggleDictation(document.getElementById("entryDetails"), document.getElementById("dictateDetailsBtn")));

// Recording buttons
document.getElementById("recordStartBtn").addEventListener("click", startRecording);
document.getElementById("recordStopBtn").addEventListener("click", stopRecording);
document.getElementById("recordRedoBtn").addEventListener("click", () => { resetRecordingUI(); });
document.getElementById("recordDeleteBtn").addEventListener("click", () => { resetRecordingUI(); });

// Voice control fab
document.getElementById("voiceFab").addEventListener("click", toggleVoiceControl);
if (!supportsSpeechRecognition()) {
  document.getElementById("voiceFab").title = t("ui.voiceNotSupported");
}
if (!supportsMediaRecorder()) {
  document.getElementById("micUnsupportedNote").hidden = false;
  document.getElementById("recordStartBtn").hidden = true;
}
if (!supportsSpeechRecognition()) {
  document.getElementById("dictateTitleBtn").style.opacity = "0.4";
  document.getElementById("dictateDetailsBtn").style.opacity = "0.4";
}

// ---------- Boot ----------
document.documentElement.lang = getLang();
initLanguageSelect();
buildDivisions();
applyStaticTranslations();
render();
