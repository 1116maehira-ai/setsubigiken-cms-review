/* Public connection settings. This file must never contain a password or secret key. */
self.CMS_REVIEW_CONFIG = Object.freeze({
  version: '20261109a',
  supabaseUrl: 'https://pvwktijtqtmvnqofuwro.supabase.co',
  publishableKey: 'sb_publishable_gBV1tZnuBlhjDwoWBrcugA_qd9Fc4cT',
  evaluationEmail: 'cms-evaluation-20261102@review.invalid',
  apps: Object.freeze({
    matayoshi: Object.freeze({ name: '又吉さん', editor: 'cms/index.html', site: 'index.html', release: 'r20261109a' }),
    gibo: Object.freeze({ name: '宜保さん', editor: 'cms/index.html', site: 'index.html', release: 'r20261109a' }),
    taira: Object.freeze({ name: '平良さん', editor: 'index.html', site: 'index.html?preview=1', release: 'r20261109a' })
  })
});
