/**
 * shimamura の URL（index.php?module=...&action=...）を「画面を識別する route 文字列」に正規化する共通関数。
 *
 * 採取（scripts/html/fetch_shimamura_menus.js）と突き合わせ（scripts/docs/gen_shimamura_menu_coverage.js）で
 * 同じ規則を使うために切り出している。規則を変えたら menuSnapshot を採取し直すこと。
 *
 * route = `module/action` ＋ 画面を区別するパラメータ（ROUTE_NOISE_PARAMS 以外）をキー順に `?` 以降へ。
 * 例: index.php?module=Student&action=index&contact_status=5&top_menu=1 → "Student/index?contact_status=5"
 *
 * #251 Phase 0
 */
'use strict';

/** route 化するときに捨てるパラメータ（遷移の都合・状態リセット・日付など画面の同一性に関係しないもの） */
const ROUTE_NOISE_PARAMS = new Set([
  'module', 'action', 'top_menu', 'return_module', 'return_action', 'return_id', 'query', 'initial_state',
  'empty_form', 'from_mainmenu', 'query_date', 'record', 'detailview', 'is_ajax_AN', 'content_only_AN',
  // ログインユーザーの校舎・当日日付に依存し、採取のたびに変わるもの
  'school_id', 'own_school_only', 'show_past',
  'start_date_day', 'start_date_month', 'start_date_year', 'end_date_day', 'end_date_month', 'end_date_year',
]);

/** 値が UUID のパラメータ（スタッフ ID 等）は採取者依存なので値を伏せる */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * href を route 文字列に変換する。index.php 以外（PDF・外部URL）や module/action が無いものは null。
 * @param {string} href - 絶対 URL または BASE_URL からの相対 URL（`&amp;` はデコード済みであること）
 * @param {string} [baseUrl] - 相対 URL の解決に使う基準 URL
 * @returns {(string|null)}
 */
function toRoute(href, baseUrl = 'https://example.invalid/app/') {
  if (!href || /^javascript:/i.test(href)) return null;
  let url;
  try { url = new URL(href, baseUrl); } catch (_) { return null; }
  if (!url.pathname.endsWith('index.php')) return null;
  const module = url.searchParams.get('module');
  const action = url.searchParams.get('action');
  if (!module || !action) return null;
  const extra = [...url.searchParams.entries()]
    .filter(([k]) => !ROUTE_NOISE_PARAMS.has(k))
    .map(([k, v]) => (v === '' ? k : `${k}=${UUID_RE.test(v) ? '*' : v}`))
    .sort();
  return `${module}/${action}${extra.length ? `?${extra.join('&')}` : ''}`;
}

module.exports = { toRoute, ROUTE_NOISE_PARAMS };
