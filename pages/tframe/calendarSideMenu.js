module.exports = {
  groups: [
    {
      name: 'カレンダー',
      items: [
        { name: '今日のコーススケジュール', href: '/test/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=course&sideMenuItemForce=calendar_calendar_main_course' },
        { name: '今日の講師スケジュール', href: '/test/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=teacher&sideMenuItemForce=calendar_calendar_main_teacher' },
        { name: '今日の教室スケジュール', href: '/test/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=classroom&sideMenuItemForce=calendar_calendar_main_classroom' },
      ],
    },
    {
      name: '入退室',
      items: [
        { name: '入退記録登録', href: '/test/index.php?r=entranceLog%2Few%2F_default' },
        { name: '入退記録一覧', href: '/test/index.php?r=entranceLog%2Fsw%2F_default' },
      ],
    },
  ],
};
