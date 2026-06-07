/* =========================================================
 * Card Rewards Tracker
 * 純前端 + localStorage。記錄信用卡與回饋規則,
 * 自動計算本期(週期內)還剩多少回饋額度。
 * ========================================================= */

const STORAGE_KEY = "card-rewards-tracker:v1";

const PALETTE = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6",
  "#64748b", "#e11d48",
];

const PERIOD_LABEL = {
  monthly: "每月",
  bimonthly: "每雙月",
  quarterly: "每季",
  yearly: "每年",
};

/* ---------- State ---------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cards: [], transactions: [] };
    const parsed = JSON.parse(raw);
    return {
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    };
  } catch (e) {
    console.error("讀取資料失敗,將以空白開始", e);
    return { cards: [], transactions: [] };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
    toast("⚠️ 儲存失敗,可能是瀏覽器空間不足");
  }
}

/* ---------- Helpers ---------- */
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function fmtTWD(n) {
  return "NT$" + Math.round(n).toLocaleString("zh-TW");
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function periodKey(period, isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-11
  switch (period) {
    case "bimonthly": return `${y}-B${Math.floor(m / 2) + 1}`;
    case "quarterly": return `${y}-Q${Math.floor(m / 3) + 1}`;
    case "yearly": return `${y}`;
    case "monthly":
    default: return `${y}-${String(m + 1).padStart(2, "0")}`;
  }
}

function findCard(id) { return state.cards.find((c) => c.id === id); }
function findRule(card, id) { return card && card.rules.find((r) => r.id === id); }

/* ---------- Core computation ---------- */
function computeRuleStats(card, rule) {
  const key = periodKey(rule.period, todayISO());
  const txns = state.transactions.filter(
    (t) => t.cardId === card.id && t.ruleId === rule.id && periodKey(rule.period, t.date) === key
  );
  const spend = txns.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const rawReward = spend * (Number(rule.rate) || 0) / 100;
  const hasCap = rule.cap != null && rule.cap !== "" && Number(rule.cap) > 0;
  const cap = hasCap ? Number(rule.cap) : null;
  const earned = hasCap ? Math.min(rawReward, cap) : rawReward;
  const remaining = hasCap ? Math.max(0, cap - rawReward) : null;
  const pct = hasCap ? Math.min(100, (rawReward / cap) * 100) : null;
  const isFull = hasCap && rawReward >= cap;
  const rate = Number(rule.rate) || 0;
  const remainingSpend = hasCap && rate > 0 ? remaining / (rate / 100) : null;
  return { spend, rawReward, earned, remaining, pct, isFull, hasCap, cap, remainingSpend, count: txns.length };
}

/* ---------- Render ---------- */
const $ = (sel) => document.querySelector(sel);
const cardsContainer = $("#cardsContainer");

function render() {
  const hasCards = state.cards.length > 0;
  $("#emptyState").style.display = hasCards ? "none" : "block";
  $("#summary").hidden = !hasCards;
  $("#recentSection").hidden = state.transactions.length === 0;

  // Summary
  let totalEarned = 0;
  let totalRemaining = 0;
  state.cards.forEach((card) => {
    card.rules.forEach((rule) => {
      const s = computeRuleStats(card, rule);
      totalEarned += s.earned;
      if (s.hasCap) totalRemaining += s.remaining;
    });
  });
  $("#statCards").textContent = state.cards.length;
  $("#statEarned").textContent = fmtTWD(totalEarned);
  $("#statRemaining").textContent = fmtTWD(totalRemaining);

  // Cards
  cardsContainer.innerHTML = state.cards.map(renderCard).join("");

  // Recent transactions
  renderRecent();
}

function renderCard(card) {
  const color = card.color || "#4f46e5";
  const rulesHtml = card.rules.length
    ? card.rules.map((rule) => renderRule(card, rule)).join("")
    : `<p class="rule-empty">尚未設定回饋規則。</p>`;

  return `
    <article class="card" style="--card-color:${color}">
      <div class="card__head">
        <div class="card__head-actions">
          <button class="icon-btn" title="編輯卡片" data-action="edit-card" data-card="${card.id}">✎</button>
          <button class="icon-btn" title="刪除卡片" data-action="delete-card" data-card="${card.id}">🗑</button>
        </div>
        <h3 class="card__name">${esc(card.name)}</h3>
        ${card.issuer ? `<p class="card__issuer">${esc(card.issuer)}</p>` : ""}
      </div>
      <div class="card__body">
        ${rulesHtml}
      </div>
      <div class="card__foot">
        <button class="btn btn--ghost btn--sm" data-action="add-rule" data-card="${card.id}">+ 回饋規則</button>
      </div>
    </article>`;
}

function renderRule(card, rule) {
  const s = computeRuleStats(card, rule);
  let remainingBlock;

  if (s.hasCap) {
    const cls = s.isFull ? "rule__remaining--full" : "rule__remaining--accent";
    const barCls = s.pct >= 100 ? "bar__fill--full" : s.pct >= 80 ? "bar__fill--warn" : "";
    const hint = s.isFull
      ? `已達回饋上限,本期再刷不會再有回饋`
      : `再刷 <b>${fmtTWD(s.remainingSpend)}</b> 可拿滿本期回饋`;
    remainingBlock = `
      <div class="rule__numbers ${cls}">
        <span>本期回饋 <b>${fmtTWD(s.earned)}</b> / ${fmtTWD(s.cap)}</span>
        <span>剩餘 <b>${fmtTWD(s.remaining)}</b></span>
      </div>
      <div class="bar"><div class="bar__fill ${barCls}" style="width:${s.pct}%"></div></div>
      <p class="rule__hint">${hint}</p>`;
  } else {
    remainingBlock = `
      <div class="rule__numbers rule__remaining--accent">
        <span>本期回饋 <b>${fmtTWD(s.earned)}</b></span>
        <span>無上限</span>
      </div>`;
  }

  return `
    <div class="rule">
      <div class="rule__top">
        <span class="rule__cat">${esc(rule.category)}</span>
        <span class="rule__rate">${rule.rate}% · ${PERIOD_LABEL[rule.period] || "每月"}</span>
      </div>
      <p class="rule__hint">本期消費 ${fmtTWD(s.spend)} · ${s.count} 筆</p>
      ${remainingBlock}
      <div class="rule__actions">
        <button class="btn btn--primary btn--sm" data-action="add-txn" data-card="${card.id}" data-rule="${rule.id}">記一筆</button>
        <button class="btn btn--ghost btn--sm" data-action="edit-rule" data-card="${card.id}" data-rule="${rule.id}">編輯</button>
        <button class="btn btn--danger btn--sm" data-action="delete-rule" data-card="${card.id}" data-rule="${rule.id}">刪除</button>
      </div>
    </div>`;
}

function renderRecent() {
  const list = $("#recentList");
  const recent = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 20);

  list.innerHTML = recent.map((t) => {
    const card = findCard(t.cardId);
    const rule = card && findRule(card, t.ruleId);
    const color = card ? card.color : "#64748b";
    const cardName = card ? card.name : "(已刪除的卡片)";
    const cat = rule ? rule.category : "(已刪除的規則)";
    const reward = rule ? (Number(t.amount) * Number(rule.rate)) / 100 : 0;
    return `
      <li class="recent__item">
        <span class="recent__dot" style="background:${color}"></span>
        <div class="recent__main">
          <div class="recent__title">${esc(cardName)} · ${esc(cat)}${t.note ? " · " + esc(t.note) : ""}</div>
          <div class="recent__meta">${t.date}</div>
        </div>
        <div class="recent__amount">
          ${fmtTWD(t.amount)}
          <small>+${fmtTWD(reward)} 回饋</small>
        </div>
        <button class="btn btn--danger btn--sm" data-action="delete-txn" data-txn="${t.id}" title="刪除這筆">×</button>
      </li>`;
  }).join("");
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* ---------- Modals ---------- */
function openModal(id) { $("#" + id).hidden = false; }
function closeModal(id) { $("#" + id).hidden = true; }
function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((m) => (m.hidden = true));
}

let selectedColor = PALETTE[0];

function buildColorPicker() {
  const wrap = $("#colorPicker");
  wrap.innerHTML = PALETTE.map(
    (c) => `<span class="color-swatch" data-color="${c}" style="background:${c}"></span>`
  ).join("");
  wrap.querySelectorAll(".color-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      selectedColor = sw.dataset.color;
      wrap.querySelectorAll(".color-swatch").forEach((x) => x.classList.remove("selected"));
      sw.classList.add("selected");
    });
  });
}

function markColor(color) {
  selectedColor = color;
  document.querySelectorAll("#colorPicker .color-swatch").forEach((sw) => {
    sw.classList.toggle("selected", sw.dataset.color === color);
  });
}

/* ----- Card modal ----- */
function openCardModal(card) {
  $("#formCard").reset();
  $("#cardId").value = card ? card.id : "";
  $("#cardName").value = card ? card.name : "";
  $("#cardIssuer").value = card ? card.issuer || "" : "";
  $("#modalCardTitle").textContent = card ? "編輯卡片" : "新增卡片";
  markColor(card ? card.color || PALETTE[0] : PALETTE[0]);
  openModal("modalCard");
  $("#cardName").focus();
}

$("#formCard").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#cardId").value;
  const name = $("#cardName").value.trim();
  if (!name) return;
  const issuer = $("#cardIssuer").value.trim();
  if (id) {
    const card = findCard(id);
    card.name = name;
    card.issuer = issuer;
    card.color = selectedColor;
  } else {
    state.cards.push({ id: uid("c"), name, issuer, color: selectedColor, rules: [] });
  }
  saveState();
  render();
  closeModal("modalCard");
  toast(id ? "已更新卡片" : "已新增卡片");
});

/* ----- Rule modal ----- */
function openRuleModal(cardId, rule) {
  $("#formRule").reset();
  $("#ruleCardId").value = cardId;
  $("#ruleId").value = rule ? rule.id : "";
  $("#ruleCategory").value = rule ? rule.category : "";
  $("#ruleRate").value = rule ? rule.rate : "";
  $("#ruleCap").value = rule && rule.cap != null ? rule.cap : "";
  $("#rulePeriod").value = rule ? rule.period : "monthly";
  $("#modalRuleTitle").textContent = rule ? "編輯回饋規則" : "新增回饋規則";
  openModal("modalRule");
  $("#ruleCategory").focus();
}

$("#formRule").addEventListener("submit", (e) => {
  e.preventDefault();
  const cardId = $("#ruleCardId").value;
  const ruleId = $("#ruleId").value;
  const card = findCard(cardId);
  if (!card) return;
  const category = $("#ruleCategory").value.trim();
  const rate = parseFloat($("#ruleRate").value);
  const capVal = $("#ruleCap").value.trim();
  const cap = capVal === "" ? null : Math.max(0, parseFloat(capVal));
  const period = $("#rulePeriod").value;
  if (!category || isNaN(rate)) return;

  if (ruleId) {
    const rule = findRule(card, ruleId);
    Object.assign(rule, { category, rate, cap, period });
  } else {
    card.rules.push({ id: uid("r"), category, rate, cap, period });
  }
  saveState();
  render();
  closeModal("modalRule");
  toast(ruleId ? "已更新規則" : "已新增規則");
});

/* ----- Transaction modal ----- */
function openTxnModal(cardId, ruleId) {
  const card = findCard(cardId);
  const rule = findRule(card, ruleId);
  if (!card || !rule) return;
  $("#formTxn").reset();
  $("#txnCardId").value = cardId;
  $("#txnRuleId").value = ruleId;
  $("#txnDate").value = todayISO();
  const s = computeRuleStats(card, rule);
  $("#txnContext").innerHTML =
    `<b>${esc(card.name)}</b> · ${esc(rule.category)}(${rule.rate}%,${PERIOD_LABEL[rule.period]})<br>` +
    (s.hasCap
      ? `本期剩餘額度 <b>${fmtTWD(s.remaining)}</b>`
      : `此規則無回饋上限`);
  $("#txnPreview").innerHTML = "";
  openModal("modalTxn");
  $("#txnAmount").focus();
}

$("#txnAmount").addEventListener("input", updateTxnPreview);
function updateTxnPreview() {
  const card = findCard($("#txnCardId").value);
  const rule = findRule(card, $("#txnRuleId").value);
  const amount = parseFloat($("#txnAmount").value);
  const preview = $("#txnPreview");
  if (!card || !rule || isNaN(amount) || amount <= 0) {
    preview.innerHTML = "";
    return;
  }
  const reward = (amount * Number(rule.rate)) / 100;
  const s = computeRuleStats(card, rule);
  if (s.hasCap) {
    const after = s.rawReward + reward;
    if (after > s.cap) {
      const effective = Math.max(0, s.cap - s.rawReward);
      preview.innerHTML =
        `這筆預估回饋 <b>${fmtTWD(reward)}</b>,但本期上限只剩 ${fmtTWD(s.remaining)},` +
        `<span class="over">實拿約 ${fmtTWD(effective)}(會超過上限)</span>`;
    } else {
      preview.innerHTML = `這筆預估回饋 <b>${fmtTWD(reward)}</b>,記錄後本期剩餘 ${fmtTWD(s.remaining - reward)}`;
    }
  } else {
    preview.innerHTML = `這筆預估回饋 <b>${fmtTWD(reward)}</b>`;
  }
}

$("#formTxn").addEventListener("submit", (e) => {
  e.preventDefault();
  const cardId = $("#txnCardId").value;
  const ruleId = $("#txnRuleId").value;
  const amount = parseFloat($("#txnAmount").value);
  const date = $("#txnDate").value || todayISO();
  const note = $("#txnNote").value.trim();
  if (isNaN(amount) || amount <= 0) return;
  state.transactions.push({ id: uid("t"), cardId, ruleId, amount, date, note });
  saveState();
  render();
  closeModal("modalTxn");
  toast("已記錄消費");
});

/* ---------- Event delegation (dynamic buttons) ---------- */
cardsContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const cardId = btn.dataset.card;
  const ruleId = btn.dataset.rule;
  const card = findCard(cardId);

  switch (action) {
    case "edit-card": openCardModal(card); break;
    case "delete-card":
      if (confirm(`確定刪除「${card.name}」?\n這張卡的回饋規則與消費紀錄都會一起刪除。`)) {
        state.cards = state.cards.filter((c) => c.id !== cardId);
        state.transactions = state.transactions.filter((t) => t.cardId !== cardId);
        saveState(); render(); toast("已刪除卡片");
      }
      break;
    case "add-rule": openRuleModal(cardId); break;
    case "edit-rule": openRuleModal(cardId, findRule(card, ruleId)); break;
    case "delete-rule":
      if (confirm("確定刪除這條回饋規則?相關消費紀錄會一併刪除。")) {
        card.rules = card.rules.filter((r) => r.id !== ruleId);
        state.transactions = state.transactions.filter(
          (t) => !(t.cardId === cardId && t.ruleId === ruleId)
        );
        saveState(); render(); toast("已刪除規則");
      }
      break;
    case "add-txn": openTxnModal(cardId, ruleId); break;
  }
});

$("#recentList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='delete-txn']");
  if (!btn) return;
  const txnId = btn.dataset.txn;
  state.transactions = state.transactions.filter((t) => t.id !== txnId);
  saveState(); render(); toast("已刪除紀錄");
});

/* ---------- Top bar actions ---------- */
$("#btnAddCard").addEventListener("click", () => openCardModal(null));
$("#btnAddCardEmpty").addEventListener("click", () => openCardModal(null));

$("#btnClearTxns").addEventListener("click", () => {
  if (state.transactions.length === 0) return;
  if (confirm("確定清空所有消費紀錄?卡片與回饋規則會保留。")) {
    state.transactions = [];
    saveState(); render(); toast("已清空消費紀錄");
  }
});

/* ----- Export / Import ----- */
$("#btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `card-rewards-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("已匯出備份檔");
});

$("#btnImport").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.cards) || !Array.isArray(data.transactions)) {
        throw new Error("格式不符");
      }
      if (!confirm("匯入會覆蓋目前所有資料,確定?")) return;
      state = { cards: data.cards, transactions: data.transactions };
      saveState(); render(); toast("已匯入資料");
    } catch (err) {
      toast("⚠️ 匯入失敗:檔案格式不正確");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

/* ---------- Modal close handlers ---------- */
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay || e.target.closest("[data-close]")) {
      overlay.hidden = true;
    }
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllModals();
});

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2200);
}

/* ---------- Init ---------- */
buildColorPicker();
render();
