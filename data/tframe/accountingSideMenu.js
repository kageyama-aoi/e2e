module.exports = {
  groups: [
    {
      name: '経理',
      items: [
        { name: '料金一覧', href: '/test/index.php?r=smsFee%2Fsw%2F_default' },
        { name: '契約一覧', href: '/test/index.php?r=smsContract%2Fsw%2F_default' },
        { name: '入金一覧', href: '/test/index.php?r=smsPayment%2Fsw%2F_default' },
        { name: '未収金', href: '/test/index.php?r=smsTransaction%2Fsw%2FunpaidAmountList' },
        { name: '翌月月謝一括作成', href: '/test/index.php?r=smsFee%2Few%2FtuitionFeeBulkCreate' },
        { name: '一括入金処理', href: '/test/index.php?r=smsPayment%2Fsw%2FbatchPayment&isSearch=1' },
      ],
    },
    {
      name: '料金マスタ作成',
      items: [
        { name: '料金マスタ作成', href: '/test/index.php?r=smsFeeMaster%2Few%2F_default' },
        { name: '料金マスタ一覧', href: '/test/index.php?r=smsFeeMaster%2Fsw%2F_default' },
        { name: '料金パッケージ作成', href: '/test/index.php?r=smsFeeMasterPackage%2Few%2F_default' },
        { name: '料金パッケージ一覧', href: '/test/index.php?r=smsFeeMasterPackage%2Fsw%2F_default' },
      ],
    },
    {
      name: '入出金',
      items: [
        { name: '入出金一覧', href: '/test/index.php?r=smsTransaction%2Fsw%2F_default' },
        { name: '口座振替請求データ作成', href: '/test/index.php?r=bankTransfer%2Few%2FbankTransferExport' },
        { name: '口座振替請求データ読込', href: '/test/index.php?r=bankTransfer%2Few%2FbankTransferImport' },
        { name: '口座振替データ履歴', href: '/test/index.php?r=bankActionsHistory%2Fsw%2F_default&isSearch=1' },
      ],
    },
  ],
};
