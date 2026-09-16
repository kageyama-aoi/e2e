# Qiita「Claude Code」タグ 新着記事ダイジェスト

実行日時（UTC）: 2026-09-16T02:45:23Z

## 結果

フィードの取得に失敗しました。このセッションのネットワークegressポリシーにより `qiita.com` へのアクセスがブロックされており（`EGRESS_BLOCKED: qiita.com`）、タグページ（`https://qiita.com/tags/claude-code`）およびAtomフィードのいずれにも到達できませんでした。

- 試行1: `curl` 経由でのアクセス → `CONNECT tunnel failed, response 403`（エージェントプロキシによる拒否）
- 試行2: `WebFetch` ツール経由でのアクセス → `EGRESS_BLOCKED`（組織のネットワークポリシーによりブロック）

対処が必要な場合は、このリポジトリのセッション環境のネットワークポリシーで `qiita.com` への出力を許可するよう設定を見直してください。
