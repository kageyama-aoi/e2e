module.exports = {
  groups: [
    {
      name: 'コース',
      items: [
        {
          name: 'コース登録',
          href: '/test/index.php?r=course%2Few%2F_default',
        },
        {
          name: 'コース一覧',
          href: '/test/index.php?r=course%2Fsw%2F_default&topMenu=1',
        },
        {
          name: '本日の出席表一覧',
          href: '/test/index.php?r=attendance%2Fsw%2F_default',
        },
        {
          name: '出席表一括出力',
          href: '/test/index.php?r=attendance%2Fsw%2FattendanceBulkOutput',
        },
      ],
    },
  ],
};
