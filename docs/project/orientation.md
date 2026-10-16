# 久々に戻ってきたとき最初に見るページ

しばらく時間を空けてこのリポジトリに戻ったら、上から順に確認すれば現状を把握できる。

---

## 1. まず全体像（5〜10分）

| 見るもの | わかること |
|---|---|
| [プロジェクト設計・アーキテクチャガイド](./project_architecture_guide.md) | ディレクトリの責務、`codecept/tests/` `codecept/pages/` `codecept/support/` の役割分担 |
| [AGENTS.md](../../AGENTS.md) | 開発ルール、コーディング規約、フォルダ配置ルール、利用可能なスキル一覧 |
| [README.md](../../README.md) | セットアップ、実行方法、プロファイル一覧、ディレクトリツリー |

## 2. どんなテストがあるか

| 見るもの | 用途 |
|---|---|
| [テストカタログ](./test_catalog.md) | 全テストの1行説明を一覧（プロダクト → フォルダ → ファイル）。**自動生成** |
| `npm run gui` | GUIランチャー。Product → Test → Profile を選ぶと日本語説明が出る。実行もここから |

テストカタログが古いと感じたら `npm run docs:catalog`（通常は commit 時に自動更新）。

## 3. 前回の作業の続き

| 見るもの | わかること |
|---|---|
| `gh issue list --state open` | 残作業の全体（**作業状況の正は Issue**。AGENTS.md「作業状況の置き場所」） |
| `gh issue list -l blocked` / `gh issue list -l waiting-user` | 止まっているもの。理由・再開条件は各 Issue のコメント |
| `gh issue list -l shimamura`（`tframe` / `launcher` / `tooling`） | 対象ごとの残作業 |
| `git status` / `git branch` | 作業中のブランチ・コミットしていない変更 |
| `git log --oneline -20` | 最近のコミット |

## 4. 手を動かす前に

- 開発作業は必ず `/github-issue-dev` スキル（Issue駆動）で進める。
- テスト追加・修正の手順はプロダクト別スキル：
  - shimamura: `/shimamura-ichiran-dev`（一覧）, `/shimamura-registration-dev`（登録・処理）, `/shimamura-download-verify`（DL検証）
  - tframe: `/tframe-ichiran-dev`（一覧）, `/tframe-registration-dev`（登録・編集）, `/tframe-flow-dev`（業務フロー）
- shimamura / tframe / taskreport 以外の新しいサイトを足すときは [新サイト追加手順書](./onboarding_new_site.md)。
- 途中で止めるときは、決まったこと・止まった理由・次の一手をその Issue のコメントに書いておくと、次に戻ったとき楽になる。

---

## ドキュメントの鮮度について

- **テストカタログ** (`docs/project/test_catalog.md`) と **README のディレクトリツリー** は
  `.githooks/pre-commit` で `codecept/tests/` 変更時に自動再生成される（`npm install` の postinstall で有効化）。
- 手動で更新するなら `npm run docs:all`。
- カタログ末尾の「メンテナンス状況」に、説明未登録のテストや実体のない説明エントリが警告表示される。
