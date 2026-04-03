const { I } = inject();
const assert = require('assert');

module.exports = {
  locators: {
    emailIconJa: 'a:has-text("Eメール")',
    emailIconEn: 'a:has-text("Email")',
  },

  clickEmailIcon() {
    I.say('【メインメニュー】Eメールアイコンをクリック');
    I.waitForElement(this.emailIconLocator(), 10);
    I.click(this.emailIconLocator());
  },

  async verifyMenuStructure(menuDefinition) {
    for (const group of menuDefinition.groups) {
      if (group.optional && !(await this.isGroupVisible(group.name))) {
        I.say(`【任意グループスキップ】${group.name}`);
        continue;
      }
      this.seeGroup(group.name);
      for (const item of group.items) {
        this.seeMenuItem(item.name);
      }
    }
  },

  async verifyMenuNavigation(menuDefinition) {
    for (const group of menuDefinition.groups) {
      for (const item of group.items) {
        await this.clickMenuItemAndVerify(item);
      }
    }
  },

  seeGroup(groupName) {
    I.say(`【グループ確認】${groupName}`);
    this.scrollMenuToText(groupName);
    I.waitForElement(this.linkByText(groupName), 10);
    I.see(groupName);
  },

  async isGroupVisible(groupName) {
    this.scrollMenuToText(groupName);
    const visibleCount = await I.grabNumberOfVisibleElements(this.linkByText(groupName));
    return visibleCount > 0;
  },

  seeMenuItem(itemName) {
    I.say(`【子メニュー確認】${itemName}`);
    this.scrollMenuToText(itemName);
    I.waitForElement(this.linkByText(itemName), 10);
    I.see(itemName);
  },

  async clickMenuItemAndVerify(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    I.say(`【子メニュー押下】${itemName}`);
    const resolvedHref = expectedHref || await this.grabHrefByTexts([item.name, item.altName].filter(Boolean));

    if (expectedHref) {
      const itemLink = this.itemLinkLocator(item);
      this.scrollToItem(item);
      I.waitForElement(itemLink, 10);
      I.click(itemLink);
    } else {
      this.clickLinkByTexts([item.name, item.altName].filter(Boolean));
    }

    I.wait(1);
    const currentUrl = await I.grabCurrentUrl();
    this.assertCurrentUrlMatches(currentUrl, resolvedHref);
    I.saveScreenshotWithTimestamp(this.buildScreenshotName(itemName), true);
    await this.clickSearchIfPresentAndCapture(itemName);
  },

  buildScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_email_${safeName}.png`;
  },

  buildSearchScreenshotName(itemName) {
    const safeName = itemName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
    return `tframe_email_${safeName}_search.png`;
  },

  assertCurrentUrlMatches(currentUrl, expectedHref) {
    const normalizedCurrentUrl = decodeURIComponent(currentUrl);
    const normalizedExpectedHref = decodeURIComponent(expectedHref);

    assert(
      normalizedCurrentUrl.includes(normalizedExpectedHref),
      `expected current url to include ${normalizedExpectedHref}, but found ${normalizedCurrentUrl}`
    );
  },

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
    await this.clickFirstSearchResultLinkIfPresentAndVerify(itemName);
  },
  buildSearchResultScreenshotName(itemName) {
    return this.buildSearchScreenshotName(itemName).replace('_search.png', '_search_first_row.png');
  },

  async clickFirstSearchResultLinkIfPresentAndVerify(itemName) {
    const firstLink = await I.executeScript(() => {
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

    if (!firstLink || !firstLink.href) {
      I.say(`【検索結果リンクスキップ】${itemName} の結果行に押下可能リンクなし`);
      return;
    }

    I.say(`【検索結果リンク押下】${itemName} -> ${firstLink.label || firstLink.href}`);
    const beforeUrl = await I.grabCurrentUrl();
    const beforeSource = await I.grabSource();

    const clicked = await I.executeScript(() => {
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

    assert(clicked, `expected clickable link in search results for ${itemName}`);

    const changed = await this.waitForPageChange(beforeSource, 5);
    const currentUrl = await I.grabCurrentUrl();

    assert(
      changed || currentUrl !== beforeUrl,
      `expected navigation after clicking search result row for ${itemName}, but url stayed ${currentUrl}`
    );

    I.saveScreenshotWithTimestamp(this.buildSearchResultScreenshotName(itemName), true);
    await this.captureDetailTabsIfPresent(itemName);
  },
  buildDetailTabScreenshotName(itemName, tabLabel, index) {
    const safeTab = String(tabLabel || `tab${index}`)
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');
    return this
      .buildSearchScreenshotName(itemName)
      .replace('_search.png', `_detail_tab_${String(index).padStart(2, '0')}_${safeTab}.png`);
  },

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
    }
  },
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

  linkByText(text) {
    return locate('a').withText(text);
  },

  searchButton() {
    return this.buttonByTexts(['検索', 'Search', 'Find']);
  },

  scrollMenuToText(text) {
    I.executeScript(
      ({ targetText }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) => link.textContent && link.textContent.includes(targetText));
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetText: text }
    );
  },

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

  scrollToItem(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      this.scrollToHref(expectedHref);
      return;
    }
    this.scrollMenuToTexts([itemName, item.altName].filter(Boolean));
  },

  itemLinkLocator(item) {
    const itemName = item.name;
    const expectedHref = item.href;
    if (expectedHref) {
      return locate(`a[href="${expectedHref}"]`);
    }
    return this.linkByTexts([itemName, item.altName].filter(Boolean));
  },

  emailIconLocator() {
    return this.isEnglish() ? this.locators.emailIconEn : this.locators.emailIconJa;
  },

  isEnglish() {
    return String(process.env.TFRAME_LANGUAGE || '').trim().toLowerCase() === 'en';
  },

  linkByTexts(texts) {
    const xpath = texts.map((text) => `contains(., '${text}')`).join(' or ');
    return locate({ xpath: `.//a[${xpath}]` });
  },

  buttonByTexts(texts) {
    const textExpr = texts.map((text) => `contains(normalize-space(.), '${text}')`).join(' or ');
    const valueExpr = texts.map((text) => `contains(@value, '${text}')`).join(' or ');
    return locate({
      xpath: `(.//button[${textExpr}] | .//input[(@type='submit' or @type='button') and (${valueExpr})] | .//a[${textExpr}])`
    });
  },

  async grabHrefByTexts(texts) {
    return I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        return target ? target.getAttribute('href') : null;
      },
      { targetTexts: texts }
    );
  },

  scrollMenuToTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) return false;

        target.scrollIntoView({ block: 'center', inline: 'nearest' });
        return true;
      },
      { targetTexts: texts }
    );
  },

  clickLinkByTexts(texts) {
    I.executeScript(
      ({ targetTexts }) => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find((link) =>
          targetTexts.some((text) => link.textContent && link.textContent.includes(text))
        );
        if (!target) {
          throw new Error(`link not found: ${targetTexts.join(', ')}`);
        }
        target.click();
      },
      { targetTexts: texts }
    );
  },
};








