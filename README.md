# 💳 Card Rewards Tracker · 信用卡回饋追蹤

列出你擁有的信用卡與各自的消費回饋規則,並用 **localStorage** 自動計算每個週期內「還剩多少回饋額度可以拿」。

純前端、零依賴、不需後端、不需登入 — 所有資料只存在你自己的瀏覽器。

## ✨ 功能

- **管理卡片**:新增 / 編輯 / 刪除信用卡,可設定發卡銀行與代表色。
- **回饋規則**:每張卡可設定多條規則(類別、回饋率 %、回饋上限、計算週期)。
- **記一筆消費**:選卡 + 類別 + 金額,自動換算回饋,即時預覽記錄後的剩餘額度。
- **剩餘額度計算**:每條規則顯示本期已賺回饋、剩餘額度與進度條,並提示「再刷多少可拿滿」。
- **週期自動歸零**:支援每月 / 每雙月 / 每季 / 每年,跨週期後自動重新計算。
- **匯出 / 匯入**:一鍵備份成 JSON,可在不同裝置間搬移資料。

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
          "rate": 3.3,        // 回饋率 %
          "cap": 500,         // 該週期回饋上限(NT$);null = 無上限
          "period": "monthly" // monthly | bimonthly | quarterly | yearly
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

## 📝 授權

MIT
