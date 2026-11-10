/* Authenticated, exact release adaptation. No source files or private content live here. */
(() => {
  function replaceText(text, pairs) {
    for (const [before, after] of pairs) text = text.replaceAll(before, after);
    return text;
  }
  function adapt(input, route, rootURL) {
    let text = input.replaceAll('/setsubigiken-cms-review/app/', rootURL.pathname + 'app/');
    if (route.path === 'online-guard.js') {
      text = text.replaceAll('cms-review-', 'cms-production-')
        .replaceAll('評価用の画面です。応募内容は送信されません。', '応募フォームの実送信は停止しています。')
        .replaceAll('評価入口', '管理入口')
        .replace("value.startsWith('./training-data/media/') || value.startsWith('training-data/media/')", "value.startsWith('./training-data/media/') || value.startsWith('training-data/media/') || value.startsWith('./training-data/production-media/') || value.startsWith('training-data/production-media/')")
        .replace('document.body.appendChild(a);', `document.body.appendChild(a);\n  const shared = document.createElement('a');\n  shared.textContent = '共通サイトを確認';\n  shared.href = new URL('preview/index.html', portalRoot).href;\n  shared.target = '_blank'; shared.rel = 'noopener';\n  shared.style.cssText = a.style.cssText.replace('right:12px;', 'right:200px;');\n  document.body.appendChild(shared);`);
    }
    if (route.app === 'taira' && route.path === 'training-storage.js') {
      text = text.replace("data.url.startsWith('./training-data/media/')", "(data.url.startsWith('./training-data/media/')||data.url.startsWith('./training-data/production-media/'))")
        .replaceAll('評価専用クラウドに保存された続きから開きました。', '共通サイトの最新内容と、自分の下書きから開きました。')
        .replaceAll('評価専用クラウドへ保存しています…', '新採用サイトの管理データを保存しています…')
        .replaceAll('評価専用クラウドに保存しました。元のCMS・実サイトは変更していません。', '管理データを保存しました。「公開」した内容が共通サイトに反映されます。');
    }
    if (route.app === 'taira' && route.path === 'trial.js') {
      text = replaceText(text, [
        ['評価専用クラウドへ自動保存', '編集中の内容は非公開で自動保存／公開で共通サイトへ反映'],
        ['の下書きを評価専用クラウドに保存しました', 'の下書きを保存しました（非公開）'],
        ['表示版の履歴はまだありません（試作内の疑似公開後に表示されます）。', '公開履歴はまだありません（「公開」すると表示されます）。'],
        ['復元前の下書きはバックアップされ、実際のHPは変わりません。', '復元前の編集中の内容はバックアップされます。共通サイトへ反映するには「下書き保存」のあと「公開」してください。'],
        ['下書きに復元しました。実サイトの状態は変更されません。', '下書きに復元しました。共通サイトへ反映するには「下書き保存」のあと「公開」してください。'],
        ['｜表示版の履歴', '｜公開履歴'],
        ['を試作内で疑似公開します。実サイトには反映されません。', 'を共通サイトへ公開します。'],
        ['編集中の未保存内容は記録対象に含まれません。', '編集中の未保存内容は公開対象に含まれません。先に「下書き保存」で確定してください。'],
        ['研修用の表示版を記録', '共通サイトへ公開'],
        ['表示版を記録する', '公開する'],
        // Native publish queues a save; the storage note confirms its completion.
        ['研修用の表示版を履歴に記録しました。実サイトには反映しません。', '共通サイトへの公開を保存中です。保存完了を確認してください。'],
      ]);
    }
    if (['matayoshi', 'gibo'].includes(route.app) && route.path === 'cms/index.html') {
      text = replaceText(text, [
        ['全12セクション・研修CMS', '全12セクション・サイト管理CMS'],
        ['専用・研修コピー', '版・共通サイト管理'],
        ['全12セクションを編集できます。保存は評価専用クラウド。実際の公開・応募送信は停止しています。', '全12セクションを編集できます。「保存」で共通サイトへ反映します。応募フォームの実送信は停止しています。'],
        ['公開停止中', '保存で反映'],
        ['<button id="previewBtn" class="secondary">プレビュー</button>', '<button id="previewBtn" class="secondary">保存してプレビュー</button>'],
        ['作業ZIPを書き出す', '保存してZIPを書き出す'],
        ['<button id="publishBtn" class="primary">公開</button>', '<button id="publishBtn" class="primary">保存で反映</button>'],
        ['変更は保存前でも反映されます。公開内容は変わりません。', 'このプレビューには保存前の変更も表示します。共通サイトへ反映するには「保存」を押してください。'],
        ['文字・写真をクリックして編集 → 「保存」で確定 → 「公開」で本番に反映（研修版では公開は停止中です）', '文字・写真をクリックして編集 → 「保存」で共通サイトへ反映します'],
        ['「公開」で本番に反映', '共通サイトへ反映'],
        ['流れは「編集 → 保存 → 公開」です。「保存」を押すと変更が確定し、保存履歴にも残ります。', '「編集 → 保存」で共通サイトへ反映します。保存前の状態は保存履歴に残ります。'],
        ['評価用のWEB表示に反映します。外部SNSや本番サイトには公開しません。', '共通サイトのシェア情報へ反映します。'],
      ]);
      if (route.app === 'matayoshi') text = text.replaceAll('下書き保存', '保存');
    }
    if (['matayoshi', 'gibo'].includes(route.app) && route.path === 'cms/app.js') {
      text = replaceText(text, [
        ['専用・全12セクション / 保存先は評価専用クラウド', '版・全12セクション / 「保存」で共通サイトへ反映'],
        ['専用・研修コピー（全12セクション）／保存は評価専用クラウド・実際の公開や応募送信は停止中', '版・全12セクション／「保存」で共通サイトへ反映・応募送信は停止中'],
        ['研修用・編集可能', '共通サイト・編集可能'],
        ['公開停止中', '保存で反映'],
        ['研修版から本番公開はできません。', '「保存」で共通サイトへ反映します。'],
        ['研修版から本番への公開はできません。', '「保存」で共通サイトへ反映します。'],
        ['この研修コピーの保存履歴です。復元しても公開サイトは変わりません。クラウドの過去の公開履歴とは別です。', 'このCMSの保存履歴です。履歴を復元すると、対象SECTIONの共通サイトも選んだ状態に戻ります。'],
        ['この研修コピーを選んだ保存状態に戻しますか？ 今の保存済み状態は履歴に残ります。未保存の変更は置き換わります。', 'このSECTIONの共通サイトを選んだ保存状態に戻しますか？ 今の保存済み状態は履歴に残ります。未保存の変更は置き換わります。'],
        ['この研修コピーを復元しました。', 'このSECTIONを復元し、共通サイトへ反映しました。'],
        ['評価専用クラウドへ画像・動画を保存中...', '管理領域へ画像・動画を取り込み中...'],
        ['評価専用クラウドに保存しました。', '保存し、共通サイトへ反映しました。'],
      ]);
      if (route.app === 'matayoshi') text = text.replaceAll('下書き保存', '保存');
    }
    if (route.app === 'taira' && route.path === 'index.html') {
      text = replaceText(text, [
        ['CMS Ver.2・全12セクション研修', 'CMS Ver.2・全12セクション管理'],
        ['表示版の履歴', '公開履歴'],
        ['表示版を記録', '公開'],
        ['平良さんの研修コピー', '平良さん版・共通サイト管理'],
        ['元のVer.2を残して全12セクションへ。実際の公開・応募送信は停止中です。', '全12セクションを編集できます。下書きは非公開です。「公開」で共通サイトへ反映します。応募フォームの実送信は停止しています。'],
        ['平良さん専用の研修コピー｜保存先：評価専用クラウド｜実際の公開・応募送信は行いません', '平良さん版のサイト管理｜下書きは非公開・公開で共通サイトへ反映｜応募フォームの実送信は停止中'],
      ]);
    }
    if (route.path === 'online-export.js') {
      text = text.replace("p.startsWith('training-data/media/')", "(p.startsWith('training-data/media/')||p.startsWith('training-data/production-media/'))")
        .replaceAll('オンライン評価CMS', '共通サイト管理CMS')
        .replaceAll('README_評価記録.txt', 'README_共通サイト記録.txt');
    }
    return text;
  }
  self.CMS_RUNTIME_TRANSFORM = Object.freeze({adapt});
})();
