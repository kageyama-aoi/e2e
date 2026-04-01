module.exports = {
  groups: [
    {
      name: '受講生レポート',
      items: [
        { name: '問合せ・入学・退学レポート', href: '/test/index.php?r=report%2Fsw%2FinquiryEnrollCancelReport' },
        { name: '受講生データ組合せレポート', href: '/test/index.php?r=report%2Fsw%2FstDataCombinedReport' },
        { name: '受講生スケジュールレポート', href: '/test/index.php?r=report%2Fsw%2FstScheduleReport' },
      ],
    },
    {
      name: '講師レポート',
      items: [
        { name: '講師スケジュールレポート', href: '/test/index.php?r=report%2Fsw%2FteScheduleReport' },
      ],
    },
  ],
};
