module.exports = {
  groups: [
    {
      name: 'Eメール',
      items: [
        {
          name: 'Eメール一覧',
          href: '/test/index.php?r=email%2Fsw%2F_default',
        },
        {
          name: 'Eメールテンプレート登録',
          href: '/test/index.php?r=emailTemplate%2Few%2F_default',
        },
        {
          name: 'Eメールテンプレート一覧',
          href: '/test/index.php?r=emailTemplate%2Fsw%2F_default',
        },
        {
          name: 'Eメールテンプレートカテゴリ登録',
          href: '/test/index.php?r=emailTemplateCategory%2Few%2F_default',
        },
        {
          name: 'Eメールテンプレートカテゴリ一覧',
          href: '/test/index.php?r=emailTemplateCategory%2Fsw%2F_default',
        },
      ],
    },
    {
      name: '名簿リスト',
      items: [
        {
          name: '名簿リスト登録',
          href: '/test/index.php?r=prospectList%2Few%2F_default',
        },
        {
          name: '名簿リスト一覧',
          href: '/test/index.php?r=prospectList%2Fsw%2F_default',
        },
      ],
    },
    {
      name: 'お知らせ',
      items: [
        {
          name: 'お知らせ登録',
          href: '/test/index.php?r=announcement%2Few%2F_default',
        },
        {
          name: 'お知らせ一覧',
          href: '/test/index.php?r=announcement%2Fsw%2F_default',
        },
      ],
    },
    {
      name: '連絡',
      items: [
        {
          name: '連絡一覧',
          altName: 'Contact List',
        },
      ],
    },
    {
      name: 'アンケート',
      items: [
        {
          name: 'アンケート登録',
          href: '/test/index.php?r=poll%2Few%2F_default',
        },
        {
          name: 'アンケート一覧',
          href: '/test/index.php?r=poll%2Fsw%2F_default',
        },
      ],
    },
  ],
};
