/* =========================================================
 * Card Rewards Tracker
 * 純前端 + localStorage。記錄信用卡與回饋規則,搜店家推薦刷哪張卡,
 * 依「目前方案/等級」只計生效規則,並計算本期剩餘回饋額度。
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

/* ---------- 通路分類(供「搜店家」比對) ---------- */
const CHANNELS = [
  "餐飲", "超商", "超市量販", "網購", "外送", "影音", "遊戲數位",
  "行動支付", "加油", "交通", "藥妝", "旅遊海外", "百貨", "三井", "運動健身", "一般消費",
];

/* 通路同義詞(讓使用者打口語也能對到) */
const CHANNEL_SYNONYMS = {
  "咖啡": "餐飲", "飲料": "餐飲", "美食": "餐飲", "吃飯": "餐飲", "餐廳": "餐飲", "手搖": "餐飲",
  "便利商店": "超商", "超市": "超市量販", "量販": "超市量販",
  "購物": "網購", "網路購物": "網購", "電商": "網購",
  "串流": "影音", "音樂": "影音",
  "遊戲": "遊戲數位", "課金": "遊戲數位", "電玩": "遊戲數位",
  "支付": "行動支付", "行動支付綁定": "行動支付",
  "油": "加油", "汽油": "加油",
  "捷運": "交通", "高鐵": "交通", "停車": "交通",
  "旅遊": "旅遊海外", "海外": "旅遊海外", "國外": "旅遊海外", "機票": "旅遊海外", "訂房": "旅遊海外",
  "運動": "運動健身", "健身": "運動健身",
};

/* 內建商家字典:店名(小寫) → 通路 */
const MERCHANTS = {
  // 餐飲 / 咖啡 / 手搖
  "星巴克": ["餐飲"], "starbucks": ["餐飲"], "路易莎": ["餐飲"], "louisa": ["餐飲"], "cama": ["餐飲"],
  "麥當勞": ["餐飲"], "mcdonald": ["餐飲"], "肯德基": ["餐飲"], "kfc": ["餐飲"], "摩斯": ["餐飲"], "mos": ["餐飲"],
  "subway": ["餐飲"], "85度c": ["餐飲"], "丹堤": ["餐飲"], "怡客": ["餐飲"], "茶湯會": ["餐飲"], "五十嵐": ["餐飲"],
  "清心": ["餐飲"], "可不可": ["餐飲"], "海底撈": ["餐飲"], "王品": ["餐飲"], "瓦城": ["餐飲"], "鼎泰豐": ["餐飲"],
  // 超商
  "7-11": ["超商"], "711": ["超商"], "7-eleven": ["超商"], "統一超商": ["超商"], "小七": ["超商"],
  "全家": ["超商"], "familymart": ["超商"], "萊爾富": ["超商"], "hi-life": ["超商"], "ok超商": ["超商"], "okmart": ["超商"],
  // 超市 / 量販
  "全聯": ["超市量販"], "pxmart": ["超市量販"], "家樂福": ["超市量販"], "carrefour": ["超市量販"],
  "大潤發": ["超市量販"], "愛買": ["超市量販"], "costco": ["超市量販"], "好市多": ["超市量販"],
  "美廉社": ["超市量販"], "頂好": ["超市量販"], "大買家": ["超市量販"], "楓康": ["超市量販"],
  // 網購
  "蝦皮": ["網購"], "shopee": ["網購"], "momo": ["網購"], "pchome": ["網購"], "博客來": ["網購"], "books": ["網購"],
  "露天": ["網購"], "yahoo購物": ["網購"], "東森購物": ["網購"], "酷澎": ["網購"], "coupang": ["網購"],
  "淘寶": ["網購"], "taobao": ["網購"], "amazon": ["網購"], "生活市集": ["網購"],
  // 外送
  "ubereats": ["外送"], "uber eats": ["外送"], "foodpanda": ["外送"], "熊貓": ["外送"], "戶戶送": ["外送"], "deliveroo": ["外送"],
  // 影音 / 串流
  "netflix": ["影音"], "disney": ["影音"], "disney+": ["影音"], "spotify": ["影音"], "youtube": ["影音"],
  "kkbox": ["影音"], "apple music": ["影音"], "hbo": ["影音"], "friday影音": ["影音"], "catchplay": ["影音"], "kktv": ["影音"],
  // 遊戲 / 數位
  "garena": ["遊戲數位"], "傳說對決": ["遊戲數位"], "steam": ["遊戲數位"], "google play": ["遊戲數位"],
  "app store": ["遊戲數位"], "mycard": ["遊戲數位"], "ps store": ["遊戲數位"], "playstation": ["遊戲數位"],
  "nintendo": ["遊戲數位"], "巴哈": ["遊戲數位"], "switch": ["遊戲數位"],
  // 行動支付
  "line pay": ["行動支付"], "linepay": ["行動支付"], "apple pay": ["行動支付"], "google pay": ["行動支付"],
  "samsung pay": ["行動支付"], "街口": ["行動支付"], "jkopay": ["行動支付"], "悠遊付": ["行動支付"],
  "全支付": ["行動支付"], "全盈": ["行動支付", "超商"], "icash": ["行動支付"], "台灣pay": ["行動支付"],
  // 加油
  "中油": ["加油"], "台塑": ["加油"], "加油站": ["加油"], "全國加油": ["加油"],
  // 交通
  "高鐵": ["交通"], "台鐵": ["交通"], "捷運": ["交通"], "mrt": ["交通"], "uber": ["交通"], "計程車": ["交通"],
  "ubike": ["交通"], "停車": ["交通"], "etag": ["交通"], "etc": ["交通"], "國道": ["交通"],
  // 藥妝
  "屈臣氏": ["藥妝"], "watsons": ["藥妝"], "康是美": ["藥妝"], "cosmed": ["藥妝"], "寶雅": ["藥妝"], "poya": ["藥妝"],
  "杏一": ["藥妝"], "丁丁": ["藥妝"], "大樹藥局": ["藥妝"],
  // 旅遊 / 海外
  "agoda": ["旅遊海外"], "booking": ["旅遊海外"], "expedia": ["旅遊海外"], "klook": ["旅遊海外"], "kkday": ["旅遊海外"],
  "trip.com": ["旅遊海外"], "華航": ["旅遊海外"], "長榮航": ["旅遊海外"], "星宇": ["旅遊海外"], "機票": ["旅遊海外"],
  "訂房": ["旅遊海外"], "飯店": ["旅遊海外"], "hotels": ["旅遊海外"],
  // 百貨
  "新光三越": ["百貨"], "sogo": ["百貨"], "遠百": ["百貨"], "微風": ["百貨"], "高島屋": ["百貨"],
  "誠品": ["百貨"], "ikea": ["百貨"], "宜家": ["百貨"],
  // 三井
  "三井": ["三井", "百貨"], "mitsui": ["三井", "百貨"], "lalaport": ["三井", "百貨"], "outlet": ["三井", "百貨"],
  // 運動健身
  "迪卡儂": ["運動健身"], "decathlon": ["運動健身"], "world gym": ["運動健身"], "健身工廠": ["運動健身"],
  "nike": ["運動健身"], "adidas": ["運動健身"],
};

/* ---------- 範本卡片(2026 上半年公開資訊整理,可能已變動,加入後請依官網調整) ----------
 * tier:該規則所屬「方案/等級」,空 = 一律生效;defaultTier:加入時預設選的等級 */
const PRESETS = [
  {
    name: "國泰 CUBE 卡", issuer: "國泰世華", color: "#7c5cff", defaultTier: "Level 2 · 3%",
    // CUBE 卡權益適用期間 2026/1/1~2026/12/31。等級分級:持卡 2% / 臺幣帳戶 + App 3% / 財富 VIP 3.3%
    rules: [
      // 玩數位(指定線上消費:網購/影音/遊戲;等級影響 %)
      { category: "玩數位", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 1 · 2%", channels: ["網購", "影音", "遊戲數位"], note: "Level 1(持卡):2%。蝦皮、momo、PChome、小樹購、Netflix、Steam 等。需於 CUBE App 切換為玩數位,無上限" },
      { category: "玩數位", rate: 3.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 2 · 3%", channels: ["網購", "影音", "遊戲數位"], note: "Level 2(臺幣帳戶 + CUBE App/自動扣繳):3%。需切換為玩數位,無上限" },
      { category: "玩數位", rate: 3.3, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 3 · 3.3%", channels: ["網購", "影音", "遊戲數位"], note: "Level 3(財富管理 VIP,平均資產 300 萬+):3.3%。需切換為玩數位,無上限" },
      // 樂饗購(餐飲/百貨/康是美/外送)
      { category: "樂饗購", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 1 · 2%", channels: ["餐飲", "百貨", "藥妝", "外送"], note: "Level 1(持卡):2%。全臺小額支付餐飲、遠東SOGO/國內百貨、康是美、Uber Eats 等。需切換為樂饗購" },
      { category: "樂饗購", rate: 3.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 2 · 3%", channels: ["餐飲", "百貨", "藥妝", "外送"], note: "Level 2:3%。需切換為樂饗購" },
      { category: "樂饗購", rate: 3.3, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 3 · 3.3%", channels: ["餐飲", "百貨", "藥妝", "外送"], note: "Level 3:3.3%。需切換為樂饗購" },
      // 趣旅行(海外/旅遊/交通)
      { category: "趣旅行", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 1 · 2%", channels: ["旅遊海外", "交通"], note: "Level 1(持卡):2%。海外消費、Agoda/Booking/Trip 訂房、航空、旅行社。需切換為趣旅行" },
      { category: "趣旅行", rate: 3.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 2 · 3%", channels: ["旅遊海外", "交通"], note: "Level 2:3%。需切換為趣旅行" },
      { category: "趣旅行", rate: 3.3, cap: null, period: "monthly", expiry: "2026-12-31", tier: "Level 3 · 3.3%", channels: ["旅遊海外", "交通"], note: "Level 3:3.3%。需切換為趣旅行" },
      // 集精選(指定生活通路;不分等級統一 2%)
      { category: "集精選", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "", channels: ["超商", "超市量販", "交通"], note: "集精選不分等級統一 2%,無上限。7-11/全家/萊爾富、全聯、家樂福,及車麻吉/uTagGo 充電停車。需切換為集精選" },
      // 台塑家(2026/6/1~2026/12/31 新增;台塑加油站/通路 2%,不分等級)
      { category: "台塑家", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "", channels: ["加油", "超商"], note: "新增方案(2026/6/1~12/31):台塑石油/台亞/福懋/統一速邁樂等指定加油站 2%,另含台塑生醫、長庚生技及超商。需綁實體卡/Apple Pay 等,排除網路/儲值/第三方支付。需切換為台塑家" },
      // 全支付(2026/4/22~2026/12/31 新增;全支付綁定國內指定通路 2%,不分等級)
      { category: "全支付", rate: 2.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "", channels: ["行動支付"], note: "新增方案(2026/4/22~12/31):以全支付綁定 CUBE 卡於國內指定合作通路消費 2%,不分等級。排除繳稅費、儲值、跨境、捐款。需切換為全支付" },
      // 一般消費(不分等級/方案)
      { category: "一般消費(非指定)", rate: 0.3, cap: null, period: "monthly", expiry: "2026-12-31", tier: "", channels: ["一般消費"], note: "非指定通路基本回饋(小樹點),不分等級/方案皆有。保費僅 0.3%" },
    ],
  },
  {
    // 原太陽卡/玫瑰卡/@GoGo/FlyGo/玫瑰Giving/大買家聯名卡已整併為「台新 Richart 卡」
    // 活動期間 2026/7/1–2027/3/31,7 大刷切換方案最高 3.8%
    name: "台新 Richart 卡", issuer: "台新銀行", color: "#f97316", defaultTier: "LEVEL 2 · 設定扣繳",
    rules: [
      // ---- Pay著刷:回饋率依「卡友身分升級」LEVEL 1/2 而不同 ----
      { category: "Pay著刷(台新Pay / 台新Pay+)", rate: 3.8, cap: null, period: "monthly", expiry: "2027-03-31", tier: "LEVEL 2 · 設定扣繳", channels: ["行動支付"], note: "台新Pay/台新Pay+綁定 3.8%(台新Pay+ 日韓再免 1.5% 國外手續費)。需設定台新帳戶自動扣繳卡費(LEVEL 2)。每日 23:59 前於 Richart Life App 切換方案,每日限 1 次、依正卡人歸戶擇一" },
      { category: "Pay著刷(LINE Pay)", rate: 2.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "LEVEL 2 · 設定扣繳", channels: ["行動支付"], note: "LINE Pay 綁定 2.3%(LEVEL 2)。四大超商、繳稅費等不回饋" },
      { category: "Pay著刷(未設定扣繳)", rate: 1.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "LEVEL 1 · 核卡即享", channels: ["行動支付"], note: "未設定台新帳戶自動扣繳時(LEVEL 1),Pay著刷僅 1.3%。新申辦核卡 60 天內免設定即享 LEVEL 2 最高 3.8%" },
      // ---- 以下方案不分身分等級皆享(tier 空一律生效),仍需於 App 切換為該方案 ----
      { category: "天天刷(超商量販/交通/加油充電/藥妝)", rate: 3.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["超商", "超市量販", "交通", "加油", "藥妝"], note: "全家/7-11 限台新Pay;家樂福、大買家、臺鐵、高鐵、台灣大車隊、Uber、中油直營、寶雅、康是美、屈臣氏、大樹藥局等。需切換為此方案" },
      { category: "大筆刷(百貨/Outlet/居家/時尚)", rate: 3.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["百貨", "三井"], note: "新光三越、遠百、SOGO、微風、台北101、誠品、京站、MITSUI OUTLET、華泰名品城、IKEA、特力屋、宜得利、UNIQLO、GU、ZARA、NET 等。需切換為此方案" },
      { category: "好饗刷(餐飲/外送/娛樂/飯店)", rate: 3.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["餐飲", "外送"], note: "全臺餐飲(不含餐券)、王品瘋Pay、Uber Eats、Foodpanda、拓元/年代/寬宏售票、FunNow、晶華/雲朗/萬豪等指定飯店、錢櫃/好樂迪等KTV。需切換為此方案" },
      { category: "數趣刷(網購/影音/遊戲/AI)", rate: 3.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["網購", "影音", "遊戲數位"], note: "蝦皮、momo、酷澎、PChome、淘寶、Netflix、Disney+、Steam、PlayStation、Nintendo、線上課程(Hahow 等)、AI 服務(ChatGPT、Claude、Notion、Canva、Perplexity)。需切換為此方案" },
      { category: "玩旅刷(海外/航空/訂房/旅行社)", rate: 3.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["旅遊海外"], note: "海外消費(含線上、歐洲)、海外交通(Uber/Grab/SUICA 等)、中華/長榮/星宇等航空、Klook/KKday/Agoda/Booking 訂房、雄獅/易遊網等旅行社。需切換為此方案" },
      { category: "假日刷(節假日不限通路)", rate: 2.0, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["一般消費"], note: "國定例假日(不含天災假)不限通路 2%(含保費、含 LINE Pay 綁定)。四大超商、繳稅費等不回饋。需切換為此方案" },
      // ---- 不需切換、不分身分等級 ----
      { category: "保費(一次付清)", rate: 1.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: [], note: "刷卡繳保費一次付清最高 1.3%,免切換免登錄、不分身分等級。不含國外保險、躉繳、投資型、彈性繳保費、分期 0 利率" },
      { category: "一般消費", rate: 0.3, cap: null, period: "monthly", expiry: "2027-03-31", tier: "", channels: ["一般消費"], note: "非指定通路一般消費 0.3% 台新Point,無上限,不分身分等級。回饋為台新Point(信用卡),效期 2 年" },
    ],
  },
  {
    name: "玉山 Unicard", issuer: "玉山銀行", color: "#10b981", defaultTier: "任意選",
    rules: [
      { category: "一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-12-31", tier: "", channels: ["一般消費"], note: "需帳單 e 化 + 臺幣帳戶自動扣繳,否則 0.3%。回饋為 e point(1點=1元),無上限。各方案皆有" },
      { category: "簡單選(百大加碼)", rate: 3.0, cap: 1000, period: "monthly", expiry: "2026-12-31", tier: "簡單選", channels: ["百貨", "網購", "行動支付"], note: "免申請;百大指定消費合計最高 3%(含一般 1%);月上限 1,000 點。百大含百貨/網購/行動支付/餐飲等" },
      { category: "任意選(自選 8 通路)", rate: 3.5, cap: 1000, period: "monthly", expiry: "2026-12-31", tier: "任意選", channels: ["餐飲", "網購", "影音", "外送", "行動支付"], note: "玉山 Wallet 自選 8 家百大通路;合計最高 3.5%;月上限 1,000 點。通路請依你實際自選調整" },
      { category: "UP 選(加碼最高)", rate: 4.5, cap: 5000, period: "monthly", expiry: "2026-12-31", tier: "UP 選", channels: ["餐飲", "網購", "影音", "外送", "百貨", "行動支付"], note: "需任務(上月平均資產≥30萬等)或 149 點 e point 訂閱;合計最高 4.5%;月上限 5,000 點。升級當月不可再切回簡單/任意選" },
    ],
  },
  {
    name: "星展 傳說對決聯名卡", issuer: "星展銀行", color: "#e11d48",
    rules: [
      // 2026/7/1~12/31 新制(需以指定星展帳戶設定自動轉帳付款);舊戶 10%/上限 1,000 方案已於 2026/6/30 到期
      { category: "生活玩家精選通路(遊戲/影音/外送/餐飲/蝦皮)", rate: 10.0, cap: 500, period: "monthly", expiry: "2026-12-31", channels: ["遊戲數位", "影音", "外送", "餐飲", "網購"], note: "需綁帳戶自動扣繳。最高 10%(含基本 1% + 加碼 9%);加碼每月上限 500 點。Steam/PS/Switch、Netflix/Disney+/Spotify、Uber Eats/foodpanda、麥當勞/肯德基、蝦皮等" },
      { category: "國外指定地區實體(美/韓/日/歐/泰/星)", rate: 5.0, cap: 500, period: "monthly", expiry: "2026-12-31", channels: ["旅遊海外"], note: "需綁帳戶自動扣繳。指定地區實體消費最高 5%(含基本 1% + 加碼 4%);加碼每月上限 500 點" },
      { category: "國內外一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-12-31", channels: ["一般消費"], note: "需綁帳戶自動扣繳;國內外一般消費最高 1%,無上限(非指定地區國外亦 1%)" },
    ],
  },
  {
    name: "永豐 SPORT 卡", issuer: "永豐銀行", color: "#0ea5e9",
    rules: [
      // 主活動 2026/7/1~12/31:基本 1% + 運動獎勵 1% + 指定支付/通路 3% = 最高 5% 豐點(1豐點=1元)
      { category: "國內外一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-12-31", channels: ["一般消費"], note: "基本 0.3% + 設定電子/行動帳單 +0.7% = 最高 1%。否則僅 0.3%。無上限" },
      { category: "行動支付/指定通路加碼", rate: 3.0, cap: null, period: "monthly", expiry: "2026-12-31", channels: ["行動支付", "運動健身", "遊戲數位"], note: "需達運動目標(大咖 App 當月 10,000 大卡或 Apple Watch 畫圈 10 次)+ 永豐/京城自動扣繳;加碼 3%(Apple/Google/Samsung/Garmin Pay、運動中心、App Store/Google Play 等)。上限以官網為準" },
      { category: "運動達標加碼", rate: 1.0, cap: null, period: "monthly", expiry: "2026-12-31", channels: ["一般消費"], note: "達運動目標 + 自動扣繳,一般消費(不含保費)再 +1%。上限以官網為準" },
    ],
  },
  {
    name: "永豐 三井購物卡", issuer: "永豐銀行", color: "#14b8a6",
    rules: [
      { category: "三井館內消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", channels: ["三井", "百貨"], note: "MITSUI OUTLET / LaLaport 館內最高 1% 豐點,無上限(需設定豐點折抵帳單,否則改累紅利)" },
      { category: "館外餐飲(實體) 7% 刷卡金", rate: 7.0, cap: null, period: "monthly", expiry: "2026-06-30", channels: ["餐飲"], note: "需登錄 + 電子/行動帳單 + (永豐/京城自動扣繳成功 或 當期一般消費滿 3,000)。限境內外實體餐飲(MCC 5811-5814,如王品/雲雀),排除館內餐飲、百貨/飯店內餐飲、小額支付。上限以官網為準" },
      { category: "海外日韓泰實體(JCB)", rate: 6.67, cap: 2000, period: "quarterly", expiry: "2026-06-30", channels: ["旅遊海外"], note: "限 JCB 卡 + 每季登錄 + 自動扣繳;日/韓/泰實體店滿額送刷卡金,每戶每季上限 2,000 元、限 1 次" },
      { category: "館外一般消費", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", channels: ["一般消費"], note: "館內外一般消費最高 1% 豐點、無上限(需設定豐點折抵帳單);未設定僅累紅利。已分期交易不享" },
    ],
  },
  {
    name: "永豐 大戶卡 DAWHO", issuer: "永豐銀行", color: "#4338ca", defaultTier: "大戶",
    rules: [
      { category: "國內消費(大大)", rate: 1.0, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大大", channels: ["一般消費"], note: "2026 全通路無腦卡;大大等級國內 1%,無上限" },
      { category: "國內消費(大戶)", rate: 3.5, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大戶", channels: ["一般消費"], note: "大戶國內 3.5%(基本 1% 無上限 + 任務加碼 2.5%);加碼部分每月上限 NT$400(國內外共用)。需完成指定任務(自動扣繳 + 電子帳單)" },
      { category: "國內消費(大戶 Plus)", rate: 5.0, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大戶 Plus", channels: ["一般消費"], note: "大戶 Plus 國內 5%(基本 1% 無上限 + 任務加碼 4%);加碼部分每月上限 NT$1,000(國內外共用)。需平均財富達 100 萬等條件 + 指定任務" },
      { category: "國外消費(大大)", rate: 2.0, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大大", channels: ["旅遊海外"], note: "大大等級國外 2%,無上限" },
      { category: "國外消費(大戶)", rate: 4.5, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大戶", channels: ["旅遊海外"], note: "大戶國外 4.5%(基本 2% 無上限 + 任務加碼 2.5%);加碼部分每月上限 NT$400(與國內共用)" },
      { category: "國外消費(大戶 Plus)", rate: 6.0, cap: null, period: "monthly", expiry: "2026-06-30", tier: "大戶 Plus", channels: ["旅遊海外"], note: "大戶 Plus 國外 6%(基本 2% 無上限 + 任務加碼 4%);加碼部分每月上限 NT$1,000(與國內共用)" },
      { category: "悠遊卡自動加值", rate: 5.0, cap: 500, period: "monthly", expiry: "2026-06-30", tier: "大戶 Plus", channels: ["交通"], note: "大戶 Plus 5% 上限 500 元/月(大戶等級為 3%、上限 100 元)" },
    ],
  },
];

/* ---------- State ---------- */
let state = loadState();
backfillFromPresets();

/* 舊資料相容:在「適用通路 / 方案等級」功能之前加入的卡片,規則缺 channels / tier;
 * 依範本(同卡名 + 同或相近類別)自動補上(不更動 activeTier,避免突然隱藏規則)。 */
function backfillFromPresets() {
  let changed = false;
  state.cards.forEach((card) => {
    const preset = PRESETS.find((p) => p.name === card.name);
    if (!preset) return;
    card.rules.forEach((rule) => {
      const exact = preset.rules.find((r) => r.category === rule.category);
      const loose = exact ||
        preset.rules.find((r) => rule.category.includes(r.category) || r.category.includes(rule.category));
      // 通路:精確優先,找不到才用相近(誤判只是少推薦,影響小)
      if ((!Array.isArray(rule.channels) || !rule.channels.length) && loose && Array.isArray(loose.channels) && loose.channels.length) {
        rule.channels = loose.channels.slice();
        changed = true;
      }
      // 方案/等級:只在「類別完全相同」時補。相近比對會誤標等級、進而錯誤隱藏規則
      if (rule.tier == null && exact && exact.tier) {
        rule.tier = exact.tier;
        changed = true;
      }
    });
    // 既有卡片若從未設定過 activeTier(舊資料)且有等級規則,自動套用範本預設等級
    if (card.activeTier === undefined && preset.defaultTier && card.rules.some((r) => r.tier)) {
      card.activeTier = preset.defaultTier;
      changed = true;
    }
  });
  if (changed) saveState();
}

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
function ruleChannels(rule) { return Array.isArray(rule.channels) ? rule.channels : []; }
function cardTierList(card) { return [...new Set((card && card.rules ? card.rules : []).map((r) => r.tier).filter(Boolean))]; }

/* 規則是否「目前生效」:未標 tier 一律生效;卡片未選等級則全顯示(向後相容);否則需符合選中的等級 */
function ruleActive(card, rule) {
  if (!rule.tier) return true;
  if (!card.activeTier) return true;
  return rule.tier === card.activeTier;
}

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

/* ---------- 搜店家 → 推薦刷哪張卡 ---------- */
function resolveChannels(qRaw) {
  const q = (qRaw || "").trim().toLowerCase();
  if (!q) return [];
  const set = new Set();
  CHANNELS.forEach((c) => {
    const cl = c.toLowerCase();
    if (cl.includes(q) || q.includes(cl)) set.add(c);
  });
  Object.keys(CHANNEL_SYNONYMS).forEach((k) => {
    if (q.includes(k.toLowerCase())) set.add(CHANNEL_SYNONYMS[k]);
  });
  Object.keys(MERCHANTS).forEach((name) => {
    if (name.includes(q) || q.includes(name)) MERCHANTS[name].forEach((c) => set.add(c));
  });
  return [...set];
}

function ruleAppliesToChannels(rule, channels) {
  const rc = ruleChannels(rule);
  if (rc.includes("一般消費")) return true; // 一般消費永遠適用(保底)
  return rc.some((c) => channels.includes(c));
}

function recommendForCard(card, channels) {
  const candidates = card.rules
    .filter((r) => ruleActive(card, r) && ruleAppliesToChannels(r, channels))
    .map((r) => {
      const stats = computeRuleStats(card, r);
      const expired = !!(r.expiry && daysUntil(r.expiry) < 0);
      const maxed = stats.hasCap && stats.remaining <= 0;
      return { rule: r, stats, expired, maxed, rate: Number(r.rate) || 0 };
    })
    .filter((x) => !x.expired);
  if (!candidates.length) return null;
  const usable = candidates.filter((x) => !x.maxed);
  const pool = usable.length ? usable : candidates;
  pool.sort((a, b) => b.rate - a.rate);
  return pool[0];
}

/* ---------- Render ---------- */
const $ = (sel) => document.querySelector(sel);
const cardsContainer = $("#cardsContainer");
const searchInput = $("#merchantSearch");

function render() {
  const hasCards = state.cards.length > 0;
  $("#emptyState").style.display = hasCards ? "none" : "block";
  $("#summary").hidden = !hasCards;
  $("#searchSection").hidden = !hasCards;
  $("#recentSection").hidden = state.transactions.length === 0;

  // Summary(只計目前生效、未過期規則的剩餘額度)
  let totalEarned = 0;
  let totalRemaining = 0;
  state.cards.forEach((card) => {
    card.rules.forEach((rule) => {
      if (!ruleActive(card, rule)) return;
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
  renderSearch();
}

function renderCard(card) {
  const color = card.color || "#4f46e5";
  const tiers = cardTierList(card);
  const tierBadge = tiers.length
    ? `<div class="card__tier">方案/等級:<b>${esc(card.activeTier || "全部顯示")}</b>` +
      `<button class="card__tier-btn" data-action="edit-card" data-card="${card.id}">變更</button></div>`
    : "";
  const activeRules = card.rules.filter((r) => ruleActive(card, r));
  const rulesHtml = activeRules.length
    ? activeRules.map((rule) => renderRule(card, rule)).join("")
    : `<p class="rule-empty">此方案/等級沒有可顯示的規則。</p>`;

  return `
    <article class="card" style="--card-color:${color}">
      <div class="card__head">
        <div class="card__head-actions">
          <button class="icon-btn" title="編輯卡片" aria-label="編輯卡片" data-action="edit-card" data-card="${card.id}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
          <button class="icon-btn" title="刪除卡片" aria-label="刪除卡片" data-action="delete-card" data-card="${card.id}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        </div>
        <h3 class="card__name">${esc(card.name)}</h3>
        ${card.issuer ? `<p class="card__issuer">${esc(card.issuer)}</p>` : ""}
      </div>
      <div class="card__body">
        ${tierBadge}
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

const MEDALS = ["🥇", "🥈", "🥉"];

function renderSearch() {
  const box = $("#searchResults");
  const q = searchInput ? searchInput.value : "";
  if (!q.trim()) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;

  if (!state.cards.length) {
    box.innerHTML = `<p class="search__empty">先新增或從範本加入卡片,才能推薦刷哪張。</p>`;
    return;
  }

  let channels = resolveChannels(q);
  const unmatched = channels.length === 0;
  if (unmatched) channels = ["一般消費"];

  const recs = state.cards
    .map((card) => ({ card, best: recommendForCard(card, channels) }))
    .filter((x) => x.best)
    .sort((a, b) => b.best.rate - a.best.rate);

  const chipsHtml = channels.map((c) => `<span class="search__chip">${esc(c)}</span>`).join(" ");
  const head = `<div class="search__channels">對應通路:${chipsHtml}` +
    (unmatched ? ` <span class="search__hint">(未對到特定通路,以一般消費計)</span>` : "") +
    `</div>`;

  if (!recs.length) {
    box.innerHTML = head + `<p class="search__empty">你的卡片(目前方案)裡沒有符合此通路的回饋規則。</p>`;
    return;
  }

  box.innerHTML = head + recs.map((r, i) => renderRec(r, i)).join("");
}

function renderRec(r, i) {
  const { card, best } = r;
  const medal = i < 3 ? MEDALS[i] : "•";
  const s = best.stats;
  let extra = "";
  if (best.maxed) extra = ` · <span style="color:var(--warn)">本期額度已滿</span>`;
  else if (s.hasCap) extra = ` · 剩 ${fmtTWD(s.remaining)}`;
  return `
    <div class="rec ${best.maxed ? "is-maxed" : ""}">
      <span class="rec__medal">${medal}</span>
      <span class="rec__dot" style="background:${card.color || "#6d72f6"}"></span>
      <div class="rec__main">
        <div class="rec__title">${esc(card.name)}</div>
        <div class="rec__sub">${esc(best.rule.category)}${extra}</div>
      </div>
      <span class="rec__rate">${best.rate}%</span>
      <button class="btn btn--primary btn--sm" data-action="rec-txn" data-card="${card.id}" data-rule="${best.rule.id}">記一筆</button>
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

/* ----- Channel chips (rule form) ----- */
function buildChannelChips() {
  const wrap = $("#ruleChannels");
  wrap.innerHTML = CHANNELS.map(
    (c) => `<button type="button" class="chip" data-channel="${c}">${c}</button>`
  ).join("");
  wrap.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) b.classList.toggle("selected");
  });
}
function setChannelChips(channels) {
  const sel = new Set(channels || []);
  document.querySelectorAll("#ruleChannels .chip").forEach((b) => {
    b.classList.toggle("selected", sel.has(b.dataset.channel));
  });
}
function getChannelChips() {
  return [...document.querySelectorAll("#ruleChannels .chip.selected")].map((b) => b.dataset.channel);
}

/* ----- Card tier chips (single-select) ----- */
let cardTierOptions = [];
function buildCardTiers(card) {
  cardTierOptions = card ? cardTierList(card) : [];
  const field = $("#cardTierField");
  const wrap = $("#cardTiers");
  if (!cardTierOptions.length) { field.hidden = true; wrap.innerHTML = ""; return; }
  field.hidden = false;
  const active = card.activeTier || "";
  wrap.innerHTML =
    `<button type="button" class="chip${active === "" ? " selected" : ""}" data-i="-1">全部顯示</button>` +
    cardTierOptions.map((t, i) =>
      `<button type="button" class="chip${t === active ? " selected" : ""}" data-i="${i}">${esc(t)}</button>`
    ).join("");
}
function getCardTier() {
  const el = document.querySelector("#cardTiers .chip.selected");
  if (!el) return "";
  const i = Number(el.dataset.i);
  return i < 0 ? "" : (cardTierOptions[i] || "");
}
$("#cardTiers").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b) return;
  document.querySelectorAll("#cardTiers .chip").forEach((x) => x.classList.remove("selected"));
  b.classList.add("selected");
});

/* ----- Card modal ----- */
function openCardModal(card) {
  $("#formCard").reset();
  $("#cardId").value = card ? card.id : "";
  $("#cardName").value = card ? card.name : "";
  $("#cardIssuer").value = card ? card.issuer || "" : "";
  $("#modalCardTitle").textContent = card ? "編輯卡片" : "新增卡片";
  markColor(card ? card.color || PALETTE[0] : PALETTE[0]);
  buildCardTiers(card);
  openModal("modalCard");
  $("#cardName").focus();
}

$("#formCard").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = $("#cardId").value;
  const name = $("#cardName").value.trim();
  if (!name) return;
  const issuer = $("#cardIssuer").value.trim();
  const activeTier = getCardTier();
  if (id) {
    const card = findCard(id);
    card.name = name;
    card.issuer = issuer;
    card.color = selectedColor;
    card.activeTier = activeTier;
  } else {
    state.cards.push({ id: uid("c"), name, issuer, color: selectedColor, activeTier, rules: [] });
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
  setRuleExpiry(rule && rule.expiry ? rule.expiry : "");
  $("#ruleTier").value = rule && rule.tier ? rule.tier : "";
  $("#ruleNote").value = rule && rule.note ? rule.note : "";
  setChannelChips(rule ? ruleChannels(rule) : []);
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
  const tier = $("#ruleTier").value.trim();
  const note = $("#ruleNote").value.trim();
  const channels = getChannelChips();
  if (!category || isNaN(rate)) return;

  if (ruleId) {
    const rule = findRule(card, ruleId);
    Object.assign(rule, { category, rate, cap, period, expiry, tier, note, channels });
  } else {
    card.rules.push({ id: uid("r"), category, rate, cap, period, expiry, tier, note, channels });
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
  setTxnDate(todayISO());
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
    activeTier: p.defaultTier || "",
    rules: p.rules.map((r) => ({
      id: uid("r"),
      category: r.category,
      rate: r.rate,
      cap: r.cap ?? null,
      period: r.period,
      expiry: r.expiry ?? null,
      tier: r.tier || "",
      note: r.note || "",
      channels: Array.isArray(r.channels) ? r.channels.slice() : [],
    })),
  });
  saveState();
  render();
  renderPresets();
  toast(`已加入「${p.name}」` + (p.defaultTier ? `(等級:${p.defaultTier},可在卡片設定變更)` : ""));
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

$("#searchResults").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='rec-txn']");
  if (!btn) return;
  openTxnModal(btn.dataset.card, btn.dataset.rule);
});

$("#recentList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action='delete-txn']");
  if (!btn) return;
  const txnId = btn.dataset.txn;
  state.transactions = state.transactions.filter((t) => t.id !== txnId);
  saveState(); render(); toast("已刪除紀錄");
});

/* ---------- Search input ---------- */
searchInput.addEventListener("input", renderSearch);

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
      backfillFromPresets();
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

/* ---------- 日期選擇器(Flatpickr,跨裝置一致,取代原生 date) ---------- */
let fpTxnDate = null, fpRuleExpiry = null;
function initDatePickers() {
  if (!window.flatpickr) return; // CDN 載入失敗時退回純文字輸入
  const opts = { dateFormat: "Y-m-d", disableMobile: true, allowInput: false };
  fpTxnDate = flatpickr("#txnDate", opts);
  fpRuleExpiry = flatpickr("#ruleExpiry", opts);
}
function setTxnDate(iso) {
  if (fpTxnDate) fpTxnDate.setDate(iso || "", false);
  else $("#txnDate").value = iso || "";
}
function setRuleExpiry(iso) {
  if (fpRuleExpiry) { if (iso) fpRuleExpiry.setDate(iso, false); else fpRuleExpiry.clear(); }
  else $("#ruleExpiry").value = iso || "";
}

/* ---------- Init ---------- */
buildColorPicker();
buildChannelChips();
initDatePickers();
render();
