export const CARD_GROUPS = {
  "section-01": [{ key:"benefits", label:"3つの特徴カード", path:"content.benefits", selector:".s01-benefit" }],
  "section-02": [{ key:"personas", label:"5つの対象カード", path:"content.personas", selector:".s02-persona" }],
  "section-03": [{ key:"reasons", label:"選ばれる5つの理由", path:"content.reasons", selector:".s03-card" }],
  "section-04": [
    { key:"jobs", label:"仕事紹介カード", path:"content.jobs", selector:".s04-card--job" },
    { key:"center", label:"積算センター", path:"content.center", selector:".s04-card--wide", single:true }
  ],
  "section-05": [
    { key:"columns", label:"職種ごとの1日", path:"content.columns", selector:".s05-column" },
    { key:"timeline", label:"1日の流れ 各予定", flatten:"content.columns.items", selector:".s05-item" }
  ],
  "section-06": [{ key:"voices", label:"先輩の声カード", path:"content.voices", selector:".s06-card", indexAttr:"data-cms-card-index" }],
  "section-07": [
    { key:"leftCards", label:"求人情報 左カード", path:"content.leftCards", selector:".s07-stack.left .s07-card" },
    { key:"conditions", label:"応募条件カード", path:"content.conditions", selector:".s07-conditions", single:true },
    { key:"rightCards", label:"求人情報 右カード", path:"content.rightCards", selector:".s07-stack.right .s07-card" }
  ],
  "section-08": [{ key:"history", label:"沿革カード", path:"content.history.items", selector:".s08-row" }],
  "section-09": [{ key:"messages", label:"代表・専務メッセージ", path:"content.messages", selector:".s09-card" }],
  "section-10": [{ key:"cards", label:"先輩のバックグラウンド", path:"content.cards", selector:".s10-card" }],
  "section-11": [
    { key:"points", label:"4つのPOINTカード", path:"content.points", selector:".s11-point" },
    { key:"faqs", label:"よくある質問カード", path:"content.faqs", selector:".s11-faq" }
  ],
  "section-12": [
    { key:"contacts", label:"連絡先カード", path:"content.contacts", selector:".s12-contact" },
    { key:"form", label:"エントリーフォーム", path:"content.form", selector:".s12-form-card", single:true },
    { key:"footer", label:"フッター", path:"content.footer", selector:".s12-footer", single:true }
  ]
};

export const MAIN_IMAGE_SELECTORS = {
  "section-01": ".s01-photo img, .s01-photo video",
  "section-02": ".s02-team-photo img",
  "section-03": ".s03-hero img, .s03-hero video",
  "section-04": ".s04-bg-photo img",
  "section-05": ".s05-bg-photo img, .s05-bg-photo video",
  "section-06": ".s06-hero-img",
  "section-07": null,
  "section-08": ".s08-photo-card .photo",
  "section-09": ".s09-bg img",
  "section-10": ".s10-hero img, .s10-hero video",
  "section-11": ".s11-hero-img",
  "section-12": ".s12-person"
};

