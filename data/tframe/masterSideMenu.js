module.exports = {
  groups: [
    {
      name: 'スタッフ',
      items: [
        { name: 'スタッフ登録', href: '/test/index.php?r=staff%2Few%2F_default' },
        { name: 'スタッフ一覧', href: '/test/index.php?r=staff%2Fsw%2F_default&topMenu=1' },
      ],
    },
    {
      name: '校舎',
      items: [
        { name: '校舎登録', href: '/test/index.php?r=branch%2Few%2F_default' },
        { name: '校舎一覧', href: '/test/index.php?r=branch%2Fsw%2F_default' },
      ],
    },
    {
      name: '教室',
      items: [
        { name: '教室登録', href: '/test/index.php?r=classroom%2Few%2F_default' },
        { name: '教室一覧', href: '/test/index.php?r=classroom%2Fsw%2F_default&topMenu=1' },
      ],
    },
    {
      name: '法人・団体',
      items: [
        { name: '法人・団体登録', href: '/test/index.php?r=account%2Few%2F_default' },
        { name: '法人・団体一覧', href: '/test/index.php?r=account%2Fsw%2F_default&topMenu=1' },
      ],
    },
  ],
};
