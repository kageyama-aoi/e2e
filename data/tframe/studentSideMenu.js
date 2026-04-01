module.exports = {
  groups: [
    {
      name: '受講生',
      items: [
        { name: '受講生登録', href: '/test/index.php?r=student%2Few%2F_default' },
        { name: '受講生一覧', href: '/test/index.php?r=student%2Fsw%2F_default' },
        { name: 'コース別受講生一覧', href: '/test/index.php?r=student%2Fsw%2FstByCourse' },
        { name: '受講生別コース一覧', href: '/test/index.php?r=student%2Fsw%2FcourseBySt' },
      ],
    },
    {
      name: '取込',
      items: [
        { name: '口座情報データ取込', href: '/test/index.php?r=student%2Few%2FaccountInfoDataImport' },
        { name: '問合せデータ取込', href: '/test/index.php?r=student%2Few%2FstInquiryDataImport' },
      ],
    },
    {
      name: '対応履歴',
      items: [
        { name: '対応履歴一覧', href: '/test/index.php?r=infoHistory%2Fsw%2F_default&menuModule=student' },
        { name: '対応履歴テンプレート登録', href: '/test/index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=student' },
        { name: '対応履歴テンプレート一覧', href: '/test/index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=student' },
      ],
    },
  ],
};
