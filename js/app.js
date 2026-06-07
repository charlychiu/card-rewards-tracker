/* =========================================================
 * Card Rewards Tracker
 * 純前端 + localStorage。記錄信用卡與回饋規則,
 * 自動計算本期(週期內)還剩多少回饋額度,並追蹤活動到期日。
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

/* ---------- 範本卡片(2026 上半年公開資訊整理,可能已變動,加入後請依官網調整) ---------- */
const PRESETS = [
  {
    name: "國泰 CUBE 卡", issuer: "國泰世華", color: "#7c5cff",
    rules: [
      { category: "玩數位", rate: 3.3, cap: null, period: "monthly", expiry: "2026-06-30", note: "需於 CUBE App 切換權益;3.3% 為財管貴賓,一般約 3%。指定通路無上限" },
      { category: "樂饗購", rate: 3.3, cap: null, period: "monthly", expiry: "2026-06-30", note: "需切換權益;餐飲/超市等指定通路,無上限" },
      { category: "趣旅行", rate: 3.3, cap: null, period: "monthly", expiry: "2026-06-30", note: "需切換權益;海外/旅遊通路,無上限" },
      { category: "集精選", rate: 2.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "需切換權益;統一 2%,含充電停車通路" },
      { category: "一般消費(非指定)", rate: 0.3, cap: null, period: "monthly", expiry: "2026-06-30", note: "非指定通路基本回饋(小樹點)" },
    ],
  },
  {
    name: "台新 太陽卡", issuer: "台新銀行", color: "#f97316",
    rules: [
      { category: "Pay 著刷(行動支付)", rate: 3.8, cap: null, period: "monthly", expiry: null, note: "綁台新 Pay 最高 3.8%、LINE Pay 2.3%。太陽卡已整併為 Richart 卡,每日可切換方案 1 次" },
      { category: "天天刷(超商/量販/交通/加油/藥妝)", rate: 3.3, cap: null, period: "monthly", expiry: null, note: "需於 Richart Life App 切換為此方案" },
      { category: "好饗刷(餐飲/外送/訂房)", rate: 3.3, cap: null, period: "monthly", expiry: null, note: "需切換為此方案" },
      { category: "玩旅刷(海外/航空/旅行社)", rate: 3.3, cap: null, period: "monthly", expiry: null, note: "海外消費;需切換為此方案" },
      { category: "數趣刷(網購/影音/遊戲)", rate: 3.3, cap: null, period: "monthly", expiry: null, note: "需切換為此方案" },
    ],
  },
  {
    name: "玉山 Unicard", issuer: "玉山銀行", color: "#10b981",
    rules: [
      { category: "一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "需帳單 e 化 + 臺幣帳戶自動扣繳,否則 0.3%。回饋為 e point(1點=1元),無上限" },
      { category: "簡單選(百大加碼)", rate: 3.0, cap: 1000, period: "monthly", expiry: "2026-06-30", note: "免申請;合計最高 3%(含一般 1%);月上限 1,000 點" },
      { category: "任意選(自選 8 通路)", rate: 3.5, cap: 1000, period: "monthly", expiry: "2026-06-30", note: "玉山 Wallet 自選 8 家;合計最高 3.5%;月上限 1,000 點" },
      { category: "UP 選(加碼最高)", rate: 4.5, cap: 5000, period: "monthly", expiry: "2026-06-30", note: "需任務(上月刷≥3萬或資產≥30萬)或 149 點訂閱;合計最高 4.5%;月上限 5,000 點" },
    ],
  },
  {
    name: "星展 傳說對決聯名卡", issuer: "星展銀行", color: "#e11d48",
    rules: [
      { category: "LINE Pay(新戶)", rate: 10.0, cap: 150, period: "monthly", expiry: "2026-06-30", note: "限 2026 新戶,需綁帳戶自動轉帳;月上限 150 點。舊戶 2026 起無加碼" },
      { category: "生活玩家精選通路(遊戲/蝦皮/外送/影音)", rate: 10.0, cap: 300, period: "monthly", expiry: "2026-06-30", note: "新戶最高 10%;需綁自動轉帳;月上限 300 點,與 LINE Pay 分開計" },
      { category: "國內一般消費(新戶)", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "新戶 1%、舊戶 0.2%;需綁自動轉帳" },
      { category: "國外消費", rate: 2.5, cap: null, period: "monthly", expiry: "2026-06-30", note: "新戶 2.5%、舊戶 1.5%" },
    ],
  },
  {
    name: "永豐 SPORT 卡", issuer: "永豐銀行", color: "#0ea5e9",
    rules: [
      { category: "國內外一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "基本豐點回饋(1豐點=1元),無上限" },
      { category: "行動支付/指定通路加碼", rate: 3.0, cap: 300, period: "monthly", expiry: "2026-06-30", note: "需達運動目標 + 自動扣繳;加碼 3%,上限 300 豐點/月" },
      { category: "運動達標加碼", rate: 1.0, cap: 50, period: "monthly", expiry: "2026-06-30", note: "大咖 App 當月燃燒 10,000 大卡或畫圈 10 次;上限 50 豐點/月" },
    ],
  },
  {
    name: "永豐 三井購物卡", issuer: "永豐銀行", color: "#14b8a6",
    rules: [
      { category: "三井館內消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "MITSUI OUTLET / LaLaport 館內最高 1%,無上限" },
      { category: "館外餐飲 / 全盈+PAY 加碼", rate: 7.0, cap: 100, period: "bimonthly", expiry: "2026-06-30", note: "需登錄 + 電子帳單 + 自動扣繳;每期(雙月)上限 100 元" },
      { category: "海外日韓泰實體(JCB)", rate: 6.67, cap: 2000, period: "quarterly", expiry: "2026-06-30", note: "每季滿 30,000 送 2,000(約 6.67%),每季限 1 次" },
      { category: "館外一般消費", rate: 0.3, cap: null, period: "monthly", expiry: "2026-06-30", note: "館外基本回饋約 0.3%" },
    ],
  },
  {
    name: "永豐 大戶卡 DAWHO", issuer: "永豐銀行", color: "#4338ca",
    rules: [
      { category: "國內一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "所有等級基本 1%,無上限;回饋入 DAWHO 帳戶" },
      { category: "國外消費", rate: 2.0, cap: null, period: "monthly", expiry: "2026-06-30", note: "所有等級基本 2%,無上限" },
      { category: "大戶 Plus 加碼(國內)", rate: 4.0, cap: 1000, period: "monthly", expiry: "2026-06-30", note: "需任務 + 平均財富達 100 萬等;加碼 4%(合計國內 5%),上限 1,000 元/期" },
      { category: "悠遊卡自動加值(大戶 Plus)", rate: 5.0, cap: 500, period: "monthly", expiry: "2026-06-30", note: "大戶 Plus 5% 上限 500 元/月;大戶 3% 上限 100 元/月" },
    ],
  },
];

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

function daysUntil(iso) {
  if (!iso) return null;
  const today = new Date(todayISO() + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target - today) / 86400000);
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

  // Summary(已過期的規則不計入剩餘可賺額度)
  let totalEarned = 0;
  let totalRemaining = 0;
  state.cards.forEach((card) => {
    card.rules.forEach((rule) => {
      const s = computeRuleStats(card, rule);
      const expired = rule.expiry && daysUntil(rule.expiry) < 0;
      totalEarned += s.earned;
      if (s.hasCap && !expired) totalRemaining += s.remaining;
    });
  });
  $("#statCards").textContent = state.cards.length;
  $("#statEarned").textContent = fmtTWD(totalEarned);
  $("#statRemaining").textContent = fmtTWD(totalRemaining);

  cardsContainer.innerHTML = state.cards.map(renderCard).join("");
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

function renderExpiry(rule) {
  if (!rule.expiry) return "";
  const d = daysUntil(rule.expiry);
  let cls = "", txt = "";
  if (d < 0) { cls = "rule__expiry--expired"; txt = `活動已於 ${rule.expiry} 到期`; }
  else if (d === 0) { cls = "rule__expiry--warn"; txt = `活動今天(${rule.expiry})到期`; }
  else if (d <= 14) { cls = "rule__expiry--warn"; txt = `活動 ${rule.expiry} 到期 · 剩 ${d} 天`; }
  else { txt = `活動到 ${rule.expiry} · 剩 ${d} 天`; }
  return `<p class="rule__expiry ${cls}">⏳ ${txt}</p>`;
}

function renderRule(card, rule) {
  const s = computeRuleStats(card, rule);
  const expired = rule.expiry && daysUntil(rule.expiry) < 0;
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
    <div class="rule${expired ? " is-expired" : ""}">
      <div class="rule__top">
        <span class="rule__cat">${esc(rule.category)}</span>
        <span class="rule__rate">${rule.rate}% · ${PERIOD_LABEL[rule.period] || "每月"}</span>
      </div>
      ${renderExpiry(rule)}
      <p class="rule__hint">本期消費 ${fmtTWD(s.spend)} · ${s.count} 筆</p>
      ${remainingBlock}
      ${rule.note ? `<p class="rule__note">${esc(rule.note)}</p>` : ""}
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
  $("#ruleExpiry").value = rule && rule.expiry ? rule.expiry : "";
  $("#ruleNote").value = rule && rule.note ? rule.note : "";
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
  const expiry = $("#ruleExpiry").value || null;
  const note = $("#ruleNote").value.trim();
  if (!category || isNaN(rate)) return;

  if (ruleId) {
    const rule = findRule(card, ruleId);
    Object.assign(rule, { category, rate, cap, period, expiry, note });
  } else {
    card.rules.push({ id: uid("r"), category, rate, cap, period, expiry, note });
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

/* ----- Presets modal ----- */
function renderPresets() {
  $("#presetList").innerHTML = PRESETS.map((p, i) => {
    const summary = p.rules.map((r) => `${r.category} ${r.rate}%`).join("、");
    const exists = state.cards.some((c) => c.name === p.name);
    return `
      <div class="preset-item" style="--card-color:${p.color}">
        <span class="preset-item__bar"></span>
        <div class="preset-item__main">
          <div class="preset-item__name">${esc(p.name)}<small>${esc(p.issuer)}</small></div>
          <div class="preset-item__rules">${esc(summary)}</div>
        </div>
        <button class="btn btn--primary btn--sm" data-preset="${i}" ${exists ? "disabled" : ""}>${exists ? "已加入" : "加入"}</button>
      </div>`;
  }).join("");
}

function addPreset(p) {
  state.cards.push({
    id: uid("c"),
    name: p.name,
    issuer: p.issuer,
    color: p.color,
    rules: p.rules.map((r) => ({
      id: uid("r"),
      category: r.category,
      rate: r.rate,
      cap: r.cap ?? null,
      period: r.period,
      expiry: r.expiry ?? null,
      note: r.note || "",
    })),
  });
  saveState();
  render();
  renderPresets();
  toast(`已加入「${p.name}」`);
}

function openPresets() {
  renderPresets();
  openModal("modalPresets");
}

$("#presetList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-preset]");
  if (!btn || btn.disabled) return;
  addPreset(PRESETS[Number(btn.dataset.preset)]);
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
$("#btnPresets").addEventListener("click", openPresets);
$("#btnPresetsEmpty").addEventListener("click", openPresets);

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
