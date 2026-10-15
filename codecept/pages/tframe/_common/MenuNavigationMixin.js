/**
 * @fileoverview tframe メニューナビゲーション共通 Mixin
 *
 * 全tframeページが共有するメニュー操作・スクリーンショット・検索・タブ巡回の
 * 共通ロジックを提供するファクトリ関数。
 * 各ページで `...createMenuNavigationMixin('prefix')` として展開して使用する。
 */

const { I } = inject();
const assert = require('assert');

/**
 * ファイル名に使用できない文字を _ に置換する
 * @param {string} value - 変換する文字列
 * @returns {string} サニタイズ済み文字列
 */
function sanitizeName(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
}

// モジュールレベルのコールバック（lang_check_test から設定する）
let _onPageLoaded = null;

/**
 * メニューナビゲーション Mixin を生成する
 *
 * 各ページ固有のスクリーンショット prefix を受け取り、
 * メニュー操作・証跡収集・検索・タブ巡回メソッドを持つオブジェクトを返す。
 *
 * @param {string} prefix - スクリーンショットファイル名の接頭辞（例: 'tframe_home'）
 * @returns {Object} メニューナビゲーション Mixin オブジェクト
 */
function createMenuNavigationMixin(prefix) {
  return {
    /**
     * メニュー定義に従い全メニュー項目を順番に押下・検証する
     * @param {{groups: Array.<{items: Array.<{name: string, href: string}>}>}} menuDefinition - メニュー定義
     */
    async verifyMenuNavigation(menuDefinition) {
      for (const group of menuDefinition.groups) {
        for (const item of group.items) {
          await this.clickMenuItemAndVerify(item);
        }
      }
    },

    /**
     * 1つのメニュー項目を押下し、URL遷移・スクリーンショットを検証する
     * @param {{name: string, href: string}} item - メニュー項目
     */
    async clickMenuItemAndVerify(item) {
      if (!item.href) {
        I.say(`【スキップ】${item.name} (href 未設定)`);
        return;
      }
      I.say(`【子メニュー押下】${item.name}`);
      this.scrollToHref(item.href);
      try {
        await I.waitForElement(locate(`a[href="${item.href}"]`), 10);
      } catch {
        const currentUrl = await I.grabCurrentUrl();
        throw new Error(
          `要素が見つかりません\n  期待 href : ${item.href}\n  現在 URL  : ${currentUrl}`
        );
      }
      this.clickLinkByHref(item.href);
      const currentUrl = await this.waitForCurrentUrlMatch(item.href, 10);
      this.assertCurrentUrlMatches(currentUrl, item.href);
      I.saveScreenshotWithTimestamp(this.buildScreenshotName(item.name), true);
      if (typeof _onPageLoaded === 'function') await _onPageLoaded(item.name);
      await this.clickSearchIfPresentAndCapture(item.name);
    },

    /**
     * 指定 href のリンクが画面内に表示されるようスクロールする
     * @param {string} href - スクロール先リンクの href
     */
    scrollToHref(href) {
      I.executeScript(
        ({ targetHref }) => {
          const target = document.querySelector(`a[href="${targetHref}"]`);
          if (!target) return false;
          target.scrollIntoView({ block: 'center', inline: 'nearest' });
          return true;
        },
        { targetHref: href }
      );
    },

    /**
     * 指定 href のリンクをクリックする
     * @param {string} href - クリックするリンクの href
     */
    clickLinkByHref(href) {
      I.executeScript(
        ({ targetHref }) => {
          const target = document.querySelector(`a[href="${targetHref}"]`);
          if (!target) {
            throw new Error(`link not found: ${targetHref}`);
          }
          target.click();
        },
        { targetHref: href }
      );
    },

    /**
     * メニュー項目のスクリーンショットファイル名を生成する
     * @param {string} itemName - メニュー項目名
     * @returns {string} ファイル名（例: 'tframe_home_メニュー名.png'）
     */
    buildScreenshotName(itemName) {
      return `${prefix}_${sanitizeName(itemName)}.png`;
    },

    /**
     * 検索後のスクリーンショットファイル名を生成する
     * @param {string} itemName - メニュー項目名
     * @returns {string} ファイル名（例: 'tframe_home_メニュー名_search.png'）
     */
    buildSearchScreenshotName(itemName) {
      return `${prefix}_${sanitizeName(itemName)}_search.png`;
    },

    /**
     * 検索結果1行目のスクリーンショットファイル名を生成する
     * @param {string} itemName - メニュー項目名
     * @returns {string} ファイル名
     */
    buildSearchResultScreenshotName(itemName) {
      return this.buildSearchScreenshotName(itemName).replace('_search.png', '_search_first_row.png');
    },

    /**
     * 現在URLが期待URLを含むか検証する（含まない場合は assert で失敗）
     * @param {string} currentUrl - 現在のURL
     * @param {string} expectedHref - 期待するhref
     */
    assertCurrentUrlMatches(currentUrl, expectedHref) {
      const normalizedCurrentUrl = decodeURIComponent(currentUrl);
      const normalizedExpectedHref = decodeURIComponent(expectedHref);

      assert(
        normalizedCurrentUrl.includes(normalizedExpectedHref),
        `expected current url to include ${normalizedExpectedHref}, but found ${normalizedCurrentUrl}`
      );
    },

    /**
     * 検索ボタンが存在する場合に押下し、結果のスクリーンショットを撮影する
     * @param {string} itemName - メニュー項目名（ログ・ファイル名に使用）
     */
    async clickSearchIfPresentAndCapture(itemName) {
      const searchButton = this.searchButton();
      const visibleCount = await I.grabNumberOfVisibleElements(searchButton);
      if (visibleCount === 0) {
        I.say(`【検索スキップ】${itemName} に検索ボタンなし`);
        return;
      }

      I.say(`【検索押下】${itemName}`);
      const beforeSource = await I.grabSource();
      I.click(searchButton);
      const changed = await this.waitForPageChange(beforeSource, 5);

      if (!changed) {
        I.say(`【検索後変化なし】${itemName}`);
        return;
      }

      I.saveScreenshotWithTimestamp(this.buildSearchScreenshotName(itemName), true);
      if (typeof _onPageLoaded === 'function') await _onPageLoaded(`${itemName}_検索結果`);
      await this.clickFirstSearchResultLinkIfPresentAndVerify(itemName);
    },

    /**
     * 検索結果の1行目リンクを押下し、遷移・詳細タブ撮影・一覧復帰を行う
     * @param {string} itemName - メニュー項目名
     */
    async clickFirstSearchResultLinkIfPresentAndVerify(itemName) {
      const firstLink = await this.grabFirstSearchResultLinkInfo();

      if (!firstLink || !firstLink.href) {
        I.say(`【検索結果リンクスキップ】${itemName} の結果行に押下可能リンクなし`);
        return;
      }

      I.say(`【検索結果リンク押下】${itemName} -> ${firstLink.label || firstLink.href}`);
      const beforeUrl = await I.grabCurrentUrl();
      const beforeSource = await I.grabSource();

      const clicked = await this.clickFirstSearchResultLink();

      assert(clicked, `expected clickable link in search results for ${itemName}`);

      const changed = await this.waitForPageChange(beforeSource, 5);
      const currentUrl = await I.grabCurrentUrl();

      assert(
        changed || currentUrl !== beforeUrl,
        `expected navigation after clicking search result row for ${itemName}, but url stayed ${currentUrl}`
      );

      I.saveScreenshotWithTimestamp(this.buildSearchResultScreenshotName(itemName), true);
      if (typeof _onPageLoaded === 'function') await _onPageLoaded(`${itemName}_詳細`);
      await this.captureDetailTabsIfPresent(itemName);

      const afterDetailUrl = await I.grabCurrentUrl();
      if (afterDetailUrl !== beforeUrl) {
        I.say(`【一覧復帰】${itemName}`);
        I.amOnPage(beforeUrl);
        I.wait(1);
      }
    },

    /**
     * 検索結果テーブルの1行目に存在するリンクのhrefとラベルを取得する
     * @returns {Promise.<{href: string, label: string}|null>} リンク情報（存在しない場合はnull）
     */
    async grabFirstSearchResultLinkInfo() {
      return I.executeScript(() => {
        const tbodies = Array.from(document.querySelectorAll('tbody'));
        for (const tbody of tbodies) {
          const rows = Array.from(tbody.querySelectorAll('tr')).filter((row) => {
            if (row.querySelectorAll('td').length === 0) return false;
            return row.offsetParent !== null;
          });

          for (const row of rows) {
            const links = Array.from(row.querySelectorAll('a[href]')).filter((link) => {
              const href = (link.getAttribute('href') || '').trim();
              if (!href) return false;
              if (href === '#') return false;
              if (href.toLowerCase().startsWith('javascript:')) return false;
              return link.offsetParent !== null;
            });

            if (links.length > 0) {
              const link = links[0];
              return {
                href: (link.getAttribute('href') || '').trim(),
                label: (link.textContent || '').trim().replace(/\s+/g, ' ')
              };
            }
          }
        }
        return null;
      });
    },

    /**
     * 検索結果テーブルの1行目リンクをクリックする
     * @returns {Promise.<boolean>} クリックできた場合 true
     */
    async clickFirstSearchResultLink() {
      return I.executeScript(() => {
        const tbodies = Array.from(document.querySelectorAll('tbody'));
        for (const tbody of tbodies) {
          const rows = Array.from(tbody.querySelectorAll('tr')).filter((row) => {
            if (row.querySelectorAll('td').length === 0) return false;
            return row.offsetParent !== null;
          });

          for (const row of rows) {
            const links = Array.from(row.querySelectorAll('a[href]')).filter((link) => {
              const href = (link.getAttribute('href') || '').trim();
              if (!href) return false;
              if (href === '#') return false;
              if (href.toLowerCase().startsWith('javascript:')) return false;
              return link.offsetParent !== null;
            });

            if (links.length > 0) {
              links[0].click();
              return true;
            }
          }
        }
        return false;
      });
    },

    /**
     * 詳細タブのスクリーンショットファイル名を生成する
     * @param {string} itemName - メニュー項目名
     * @param {string} tabLabel - タブのラベル
     * @param {number} index - タブのインデックス（1始まり）
     * @returns {string} ファイル名
     */
    buildDetailTabScreenshotName(itemName, tabLabel, index) {
      const safeTab = sanitizeName(tabLabel || `tab${index}`);
      return this
        .buildSearchScreenshotName(itemName)
        .replace('_search.png', `_detail_tab_${String(index).padStart(2, '0')}_${safeTab}.png`);
    },

    /**
     * 詳細画面にタブが存在する場合、全タブを順番にクリックしてスクリーンショットを撮影する
     * @param {string} itemName - メニュー項目名
     */
    async captureDetailTabsIfPresent(itemName) {
      const tabs = await I.executeScript(() => {
        const anchors = Array.from(
          document.querySelectorAll('li.tf-tab-title a[role="tab"][data-toggle="tab"], a[role="tab"][data-toggle="tab"]')
        );

        const unique = [];
        const seen = new Set();

        anchors.forEach((anchor, index) => {
          const key = anchor.id || anchor.getAttribute('href') || `tab_${index}`;
          if (seen.has(key)) return;
          seen.add(key);

          const rawLabel = (anchor.textContent || '').trim().replace(/\s+/g, ' ');
          const hostLi = anchor.closest('li.tf-tab-title');
          const isActive =
            (hostLi && hostLi.classList.contains('active')) ||
            anchor.classList.contains('active') ||
            anchor.getAttribute('aria-expanded') === 'true';

          unique.push({
            key,
            label: rawLabel || key,
            active: Boolean(isActive),
          });
        });

        return unique;
      });

      if (!tabs || tabs.length === 0) {
        I.say(`【詳細タブスキップ】${itemName} にタブなし`);
        return;
      }

      I.say(`【詳細タブ巡回】${itemName} タブ数: ${tabs.length}`);

      for (let index = 0; index < tabs.length; index += 1) {
        const tab = tabs[index];

        if (!tab.active) {
          const clicked = await I.executeScript(({ tabKey }) => {
            const anchors = Array.from(
              document.querySelectorAll('li.tf-tab-title a[role="tab"][data-toggle="tab"], a[role="tab"][data-toggle="tab"]')
            );
            const target = anchors.find((anchor, i) => {
              const key = anchor.id || anchor.getAttribute('href') || `tab_${i}`;
              return key === tabKey;
            });
            if (!target) return false;
            target.click();
            return true;
          }, { tabKey: tab.key });

          if (!clicked) {
            I.say(`【詳細タブスキップ】${itemName} -> ${tab.label} (クリック対象なし)`);
            continue;
          }
        }

        I.wait(1);
        const activeTabLabel = await I.executeScript(() => {
          const active =
            document.querySelector('li.tf-tab-title.active a[role="tab"]') ||
            document.querySelector('a[role="tab"][data-toggle="tab"][aria-expanded="true"]') ||
            document.querySelector('a[role="tab"].active');
          return active ? (active.textContent || '').trim().replace(/\s+/g, ' ') : '';
        });
        I.saveScreenshotWithTimestamp(this.buildDetailTabScreenshotName(itemName, activeTabLabel || tab.label, index + 1), true);
        if (typeof _onPageLoaded === 'function') await _onPageLoaded(`${itemName}_タブ_${activeTabLabel || tab.label}`);
      }
    },

    /**
     * ページのHTMLソースが変化するまで最大N秒待機する
     * @param {string} beforeSource - 変化前のHTMLソース
     * @param {number} maxSeconds - 最大待機秒数
     * @returns {Promise.<boolean>} 変化があった場合 true
     */
    async waitForPageChange(beforeSource, maxSeconds) {
      for (let index = 0; index < maxSeconds; index += 1) {
        I.wait(1);
        const afterSource = await I.grabSource();
        if (afterSource !== beforeSource) {
          return true;
        }
      }
      return false;
    },

    /**
     * 現在URLが期待hrefを含むまで最大N秒ポーリングする
     * @param {string} expectedHref - 期待するhref
     * @param {number} maxSeconds - 最大待機秒数
     * @returns {Promise.<string>} マッチした（またはタイムアウト時の）URL
     */
    async waitForCurrentUrlMatch(expectedHref, maxSeconds) {
      for (let index = 0; index < maxSeconds; index += 1) {
        const currentUrl = await I.grabCurrentUrl();
        if (decodeURIComponent(currentUrl).includes(decodeURIComponent(expectedHref))) {
          return currentUrl;
        }
        I.wait(1);
      }
      return I.grabCurrentUrl();
    },

    /**
     * 検索ボタンのロケーターを返す（日英両対応）
     * @returns {Object} CodeceptJS ロケーター
     */
    searchButton() {
      return this.buttonByTexts(['検索', 'Search', 'Find']);
    },

    /**
     * 複数テキストのいずれかに一致するボタン・リンクのロケーターを返す
     * @param {string[]} texts - 一致候補テキストの配列
     * @returns {Object} CodeceptJS ロケーター（XPath）
     */
    buttonByTexts(texts) {
      const textExpr = texts.map((text) => `contains(normalize-space(.), '${text}')`).join(' or ');
      const valueExpr = texts.map((text) => `contains(@value, '${text}')`).join(' or ');
      return locate({
        xpath: `(.//button[${textExpr}] | .//input[(@type='submit' or @type='button') and (${valueExpr})] | .//a[${textExpr}])`
      });
    },
  };
}

/**
 * ページ遷移時に呼び出すコールバックを登録する（lang_check_test から使用）
 * @param {function(string): Promise.<void>} fn - ページ名を受け取る非同期コールバック
 */
createMenuNavigationMixin.setPageLoadedCallback = (fn) => { _onPageLoaded = fn; };

/**
 * ページ遷移コールバックをクリアする
 */
createMenuNavigationMixin.clearPageLoadedCallback = () => { _onPageLoaded = null; };

module.exports = createMenuNavigationMixin;
