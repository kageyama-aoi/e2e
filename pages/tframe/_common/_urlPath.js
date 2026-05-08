/**
 * BASE_URL からURLパスプレフィックスを実行時に取得する。
 * BASE_URL=https://newsms.e-school.jp/beta/ → '/beta'
 * BASE_URL=https://newsms.e-school.jp/test/ → '/test'
 * 未設定・不正値の場合は '/test' をフォールバックとして返す。
 */
const base = process.env.BASE_URL || '';
try {
  const { pathname } = new URL(base);
  module.exports = pathname.replace(/\/$/, '') || '/test';
} catch {
  module.exports = '/test';
}
