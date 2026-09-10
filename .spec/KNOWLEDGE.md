# KNOWLEDGE - ドメイン知識・調査結果

## 業務・ドメイン知識
## 調査・リサーチ結果

### ドリフトの発生ループ（2026-09-10 診断）
コードを整理 → スキル/ガイドは別ファイルで更新を促されない → 次の人が古い雛形をコピー → 重複と旧命名が復活。
半年で 6 ファイルの重複と 5 本のドキュメント食い違いになった。

### 既存のドリフト検知機構
- `.githooks/pre-commit`: tests/ 変更時に README ツリーと test_catalog を再生成するのみ
- `/doc-sync`: 連動表 A〜E（構成変更 / data/tframe / 配置ルール / 新スキル / 新テスト）。共通パターン変更の行がない
- `gen_test_catalog.py --check`: ドリフト検出の前例（同じ思想で check_doc_refs.py を作る）

### tframe 側の前例（読むだけ・触らない）
- `pages/tframe/_common/IchiranMixin.js`: `createIchiranMixin(screenLabel)` で一覧 PO の同型メソッドを生成
- AGENTS.md tframe 節: 「共通ユーティリティ（support/utils.js）」節と「雛形は KoshiPage.js」の実ファイル参照形式

## 技術的な知見
## 決定事項と理由
- M4 は警告モードから開始（誤検知で作業が止まるのを避ける。安定後に fail へ昇格）
- ひな形テストは @wip 隔離（削除も実装もしない。後で実装する余地を残す）
- Phase 順は 仕組み → 掃除 → 集約 → 整理（逆順だと集約した瞬間にスキルが再びズレる）
- tframe 系は別セッションが作業中のため触らない。共通の support/utils.js も原則触らない
