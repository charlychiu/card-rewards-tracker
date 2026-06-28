# 💳 Card Rewards Tracker · 信用卡回饋追蹤

列出你擁有的信用卡與各自的消費回饋規則,並用 **localStorage** 自動計算每個週期內「還剩多少回饋額度可以拿」。

純前端、零依賴、不需後端、不需登入 — 所有資料只存在你自己的瀏覽器。

## ✨ 功能

- **🔍 搜店家 → 刷哪張卡**:輸入店名(如「星巴克」)或通路(如「網購」),依「回饋率 × 剩餘額度 × 是否過期」即時排名你的卡,告訴你刷哪張最賺,還能一鍵記帳。內建常見台灣店家字典。
- **管理卡片**:新增 / 編輯 / 刪除信用卡,可設定發卡銀行與代表色。
- **回饋規則**:每張卡可設定多條規則(類別、回饋率 %、回饋上限、計算週期、**活動到期日**、**適用通路**、**所屬方案/等級**、備註)。
- **方案 / 等級切換**:很多卡同時只有一種狀態生效(大戶卡的大大/大戶/大戶Plus、CUBE 切換的權益、玉山的簡單選/任意選/UP選)。在卡片設定選「目前方案/等級」,App 只計生效那層,其餘自動隱藏、也不進搜尋與額度計算。
- **範本一鍵加入**:內建台灣常見卡片範本(國泰 CUBE、台新 Richart 卡、玉山 Unicard、星展傳說對決、永豐 SPORT / 三井 / 大戶),可直接加入再微調。
- **記一筆消費**:選卡 + 類別 + 金額,自動換算回饋,即時預覽記錄後的剩餘額度。
- **剩餘額度計算**:每條規則顯示本期已賺回饋、剩餘額度與進度條,並提示「再刷多少可拿滿」。
- **活動到期提醒**:顯示距活動到期剩餘天數,14 天內轉為警示色,過期後標記並不計入剩餘額度。
- **週期自動歸零**:支援每月 / 每雙月 / 每季 / 每年,跨週期後自動重新計算。
- **匯出 / 匯入**:一鍵備份成 JSON,可在不同裝置間搬移資料。

> ⚠️ 範本內的回饋率 / 上限 / 到期日為 **2026 上半年**公開資訊整理,各家方案變動頻繁,實際請以官方公告為準。

## 🚀 使用方式

直接用瀏覽器開啟 `index.html` 即可,不需安裝任何東西。

若想用本機伺服器執行(避免某些瀏覽器的檔案限制):

```bash
# 任選一種
python3 -m http.server 8000
# 或
npx serve .
```

然後開啟 http://localhost:8000

## 📁 專案結構

```
card-rewards-tracker/
├── index.html      # 頁面結構
├── css/style.css   # 樣式
├── js/app.js       # 所有邏輯(資料、計算、渲染)
└── README.md
```

## 🗃 資料儲存

資料存在瀏覽器 localStorage,key 為 `card-rewards-tracker:v1`,格式:

```jsonc
{
  "cards": [
    {
      "id": "c_xxx",
      "name": "國泰 CUBE 卡",
      "issuer": "國泰世華",
      "color": "#4f46e5",
      "rules": [
        {
          "id": "r_xxx",
          "category": "一般消費",
          "rate": 3.3,           // 回饋率 %
          "cap": 500,            // 該週期回饋上限(NT$);null = 無上限
          "period": "monthly",   // monthly | bimonthly | quarterly | yearly
          "expiry": "2026-06-30", // 活動到期日 YYYY-MM-DD;null = 無到期日
          "note": "需登錄"        // 備註(條件、門檻等);可為空字串
        }
      ]
    }
  ],
  "transactions": [
    {
      "id": "t_xxx",
      "cardId": "c_xxx",
      "ruleId": "r_xxx",
      "amount": 1000,       // 消費金額 NT$
      "date": "2026-06-07", // YYYY-MM-DD
      "note": "全聯"
    }
  ]
}
```

> ⚠️ 清除瀏覽器資料會一併清掉紀錄,請定期使用「匯出」備份。

## 🔗 範本資料來源

範本卡片的回饋數字依官網公告整理至 **2026/6 月底**,各家方案變動頻繁(到期日不一:CUBE 與玉山至 2026/12/31、台新 Richart 至 2027/3/31、星展與永豐 SPORT 已更新為 2026 下半年新制、三井與大戶為 2026 上半年方案),請以官方公告為準:

| 卡片 | 官方 / 參考連結 |
|------|------|
| 國泰 CUBE 卡 | https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube-list |
| 台新 Richart 卡(整併原太陽卡/玫瑰卡/@GoGo/FlyGo 等,7 大刷最高 3.8%,活動至 2027/3/31) | https://www.taishinbank.com.tw/TSB/personal/credit/intro/overview/future/ab46dfa7-5d88-11f1-b50f-0050568c09e3 |
| 玉山 Unicard | https://www.esunbank.com/zh-tw/personal/credit-card/intro/bank-card/unicard |
| 星展 傳說對決聯名卡 | https://www.dbs.com.tw/personal-zh/cards/dbs-aov/index.html |
| 永豐 SPORT 卡 | https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/sportcard.html |
| 永豐 三井購物卡 | https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/co-brand/mitsui-outlet-park-card.html |
| 永豐 大戶卡 DAWHO | https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html · https://dawho.tw/hot/2026h1offer/ |

## 📝 授權

MIT
