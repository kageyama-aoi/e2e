const p = require('./_urlPath');

module.exports = {
  student: {
    groups: [
      {
        name: '受講生',
        items: [
          { name: '受講生登録', href: `${p}/index.php?r=student%2Few%2F_default` },
          { name: '受講生一覧', href: `${p}/index.php?r=student%2Fsw%2F_default` },
          { name: 'コース別受講生一覧', href: `${p}/index.php?r=student%2Fsw%2FstByCourse` },
          { name: '受講生別コース一覧', href: `${p}/index.php?r=student%2Fsw%2FcourseBySt` },
        ],
      },
      {
        name: '取込',
        items: [
          { name: '口座情報データ取込', href: `${p}/index.php?r=student%2Few%2FaccountInfoDataImport` },
          { name: '問合せデータ取込', href: `${p}/index.php?r=student%2Few%2FstInquiryDataImport` },
        ],
      },
      {
        name: '対応履歴',
        items: [
          { name: '対応履歴一覧', href: `${p}/index.php?r=infoHistory%2Fsw%2F_default&menuModule=student` },
          { name: '対応履歴テンプレート登録', href: `${p}/index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=student` },
          { name: '対応履歴テンプレート一覧', href: `${p}/index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=student` },
        ],
      },
    ],
  },

  teacher: {
    groups: [
      {
        name: '講師',
        items: [
          { name: '講師登録', href: `${p}/index.php?r=teacher%2Few%2F_default` },
          { name: '講師一覧', href: `${p}/index.php?r=teacher%2Fsw%2F_default` },
          { name: '講師別受講生一覧', href: `${p}/index.php?r=teacher%2Fsw%2FteByStudent` },
        ],
      },
      {
        name: '対応履歴',
        items: [
          { name: '対応履歴一覧', href: `${p}/index.php?r=infoHistory%2Fsw%2F_default&menuModule=teacher` },
          { name: '対応履歴テンプレート登録', href: `${p}/index.php?r=infoHistoryTemplate%2Few%2F_default&menuModule=teacher` },
          { name: '対応履歴テンプレート一覧', href: `${p}/index.php?r=infoHistoryTemplate%2Fsw%2F_default&menuModule=teacher` },
        ],
      },
    ],
  },

  course: {
    groups: [
      {
        name: 'コース',
        items: [
          { name: 'コース登録', href: `${p}/index.php?r=course%2Few%2F_default` },
          { name: 'コース一覧', href: `${p}/index.php?r=course%2Fsw%2F_default&topMenu=1` },
          { name: '本日の出席表一覧', href: `${p}/index.php?r=attendance%2Fsw%2F_default` },
          { name: '出席表一括出力', href: `${p}/index.php?r=attendance%2Fsw%2FattendanceBulkOutput` },
        ],
      },
    ],
  },

  calendar: {
    groups: [
      {
        name: 'カレンダー',
        items: [
          { name: '今日のコーススケジュール', href: `${p}/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=course&sideMenuItemForce=calendar_calendar_main_course` },
          { name: '今日の講師スケジュール', href: `${p}/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=teacher&sideMenuItemForce=calendar_calendar_main_teacher` },
          { name: '今日の教室スケジュール', href: `${p}/index.php?r=calendar%2Fsw%2F_default&calView=daily&calRowType=classroom&sideMenuItemForce=calendar_calendar_main_classroom` },
        ],
      },
      {
        name: '入退室',
        items: [
          { name: '入退記録登録', href: `${p}/index.php?r=entranceLog%2Few%2F_default` },
          { name: '入退記録一覧', href: `${p}/index.php?r=entranceLog%2Fsw%2F_default` },
        ],
      },
    ],
  },

  email: {
    groups: [
      {
        name: 'Eメール',
        items: [
          { name: 'Eメール一覧', href: `${p}/index.php?r=email%2Fsw%2F_default` },
          { name: 'Eメールテンプレート登録', href: `${p}/index.php?r=emailTemplate%2Few%2F_default` },
          { name: 'Eメールテンプレート一覧', href: `${p}/index.php?r=emailTemplate%2Fsw%2F_default` },
          { name: 'Eメールテンプレートカテゴリ登録', href: `${p}/index.php?r=emailTemplateCategory%2Few%2F_default` },
          { name: 'Eメールテンプレートカテゴリ一覧', href: `${p}/index.php?r=emailTemplateCategory%2Fsw%2F_default` },
        ],
      },
      {
        name: '名簿リスト',
        items: [
          { name: '名簿リスト登録', href: `${p}/index.php?r=prospectList%2Few%2F_default` },
          { name: '名簿リスト一覧', href: `${p}/index.php?r=prospectList%2Fsw%2F_default` },
        ],
      },
      {
        name: 'お知らせ',
        items: [
          { name: 'お知らせ登録', href: `${p}/index.php?r=announcement%2Few%2F_default` },
          { name: 'お知らせ一覧', href: `${p}/index.php?r=announcement%2Fsw%2F_default` },
        ],
      },
      {
        name: '連絡',
        items: [
          { name: '連絡一覧', altName: 'Contact List' },
        ],
      },
      {
        name: 'アンケート',
        items: [
          { name: 'アンケート登録', href: `${p}/index.php?r=poll%2Few%2F_default` },
          { name: 'アンケート一覧', href: `${p}/index.php?r=poll%2Fsw%2F_default` },
        ],
      },
    ],
  },

  report: {
    groups: [
      {
        name: '受講生レポート',
        items: [
          { name: '問合せ・入学・退学レポート', href: `${p}/index.php?r=report%2Fsw%2FinquiryEnrollCancelReport` },
          { name: '受講生データ組合せレポート', href: `${p}/index.php?r=report%2Fsw%2FstDataCombinedReport` },
          { name: '受講生スケジュールレポート', href: `${p}/index.php?r=report%2Fsw%2FstScheduleReport` },
        ],
      },
      {
        name: '講師レポート',
        items: [
          { name: '講師スケジュールレポート', href: `${p}/index.php?r=report%2Fsw%2FteScheduleReport` },
        ],
      },
    ],
  },

  help: {
    groups: [
      {
        name: 'ヘルプ',
        items: [
          { name: '全体説明', href: `${p}/index.php?r=cmn%2Fgw%2Fhelp&helpFileKey=General` },
          { name: 'マニュアル一覧', href: `${p}/index.php?r=help%2Fsw%2FmanualList` },
        ],
      },
    ],
  },

  master: {
    groups: [
      {
        name: 'スタッフ',
        items: [
          { name: 'スタッフ登録', href: `${p}/index.php?r=staff%2Few%2F_default` },
          { name: 'スタッフ一覧', href: `${p}/index.php?r=staff%2Fsw%2F_default&topMenu=1` },
        ],
      },
      {
        name: '校舎',
        items: [
          { name: '校舎登録', href: `${p}/index.php?r=branch%2Few%2F_default` },
          { name: '校舎一覧', href: `${p}/index.php?r=branch%2Fsw%2F_default` },
        ],
      },
      {
        name: '教室',
        items: [
          { name: '教室登録', href: `${p}/index.php?r=classroom%2Few%2F_default` },
          { name: '教室一覧', href: `${p}/index.php?r=classroom%2Fsw%2F_default&topMenu=1` },
        ],
      },
      {
        name: '法人・団体',
        items: [
          { name: '法人・団体登録', href: `${p}/index.php?r=account%2Few%2F_default` },
          { name: '法人・団体一覧', href: `${p}/index.php?r=account%2Fsw%2F_default&topMenu=1` },
        ],
      },
    ],
  },

  accounting: {
    groups: [
      {
        name: '経理',
        items: [
          { name: '料金一覧', href: `${p}/index.php?r=smsFee%2Fsw%2F_default` },
          { name: '契約一覧', href: `${p}/index.php?r=smsContract%2Fsw%2F_default` },
          { name: '入金一覧', href: `${p}/index.php?r=smsPayment%2Fsw%2F_default` },
          { name: '未収金', href: `${p}/index.php?r=smsTransaction%2Fsw%2FunpaidAmountList` },
          { name: '翌月月謝一括作成', href: `${p}/index.php?r=smsFee%2Few%2FtuitionFeeBulkCreate` },
          { name: '一括入金処理', href: `${p}/index.php?r=smsPayment%2Fsw%2FbatchPayment&isSearch=1` },
        ],
      },
      {
        name: '料金マスタ作成',
        items: [
          { name: '料金マスタ作成', href: `${p}/index.php?r=smsFeeMaster%2Few%2F_default` },
          { name: '料金マスタ一覧', href: `${p}/index.php?r=smsFeeMaster%2Fsw%2F_default` },
          { name: '料金パッケージ作成', href: `${p}/index.php?r=smsFeeMasterPackage%2Few%2F_default` },
          { name: '料金パッケージ一覧', href: `${p}/index.php?r=smsFeeMasterPackage%2Fsw%2F_default` },
        ],
      },
      {
        name: '商品',
        items: [
          { name: '商品登録', href: `${p}/index.php?r=product%2Few%2F_default` },
          { name: '商品一覧', href: `${p}/index.php?r=product%2Fsw%2F_default` },
        ],
      },
      {
        name: '講師謝礼',
        items: [
          { name: '調整金登録', href: `${p}/index.php?r=shareiDetail%2Few%2F_default` },
        ],
      },
      {
        name: '入出金',
        items: [
          { name: '入出金一覧', href: `${p}/index.php?r=smsTransaction%2Fsw%2F_default` },
          { name: '口座振替請求データ作成', href: `${p}/index.php?r=bankTransfer%2Few%2FbankTransferExport` },
          { name: '口座振替請求データ読込', href: `${p}/index.php?r=bankTransfer%2Few%2FbankTransferImport` },
          { name: '口座振替データ履歴', href: `${p}/index.php?r=bankActionsHistory%2Fsw%2F_default&isSearch=1` },
        ],
      },
    ],
  },
};
