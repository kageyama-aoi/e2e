module.exports = {
  groups: [
    {
      name: '講師',
      items: [
        { name: '講師登録', href: '/test/index.php?r=teacher%2Few%2F_default' },
        { name: '講師一覧', href: '/test/index.php?r=teacher%2Fsw%2F_default' },
        { name: '講師別受講生一覧', href: '/test/index.php?r=teacher%2Fsw%2FteByStudent' },
      ],
    },
    {
      name: '対応履歴',
      items: [
        { name: '対応履歴一覧', href: '/test/index.php?r=infoHistory%2Fsw%2F_default&menuModule=teacher' },
        { name: '対応履歴テンプレート登録', href: '/test/index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=teacher' },
        { name: '対応履歴テンプレート一覧', href: '/test/index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=teacher' },
      ],
    },
  ],
};
