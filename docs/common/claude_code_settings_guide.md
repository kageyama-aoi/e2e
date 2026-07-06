# Claude Code 設定ガイド — settings.json / settings.local.json

## 1. ファイルの種類と優先順位

Claude Code の設定は複数のファイルに分散しており、**高い方が低い方を上書き**する。

```
Managed（企業 MDM ポリシー）         … 最優先・変更不可
  ↓
.claude/settings.local.json          … プロジェクト個人設定（Git 管理外）
  ↓
.claude/settings.json                … プロジェクト共有設定（Git 管理）
  ↓
~/.claude/settings.json              … ユーザー全体設定
```

| ファイル | 場所 | Git 管理 | 用途 |
|---|---|---|---|
| `~/.claude/settings.json` | ホームディレクトリ | ❌ | 全プロジェクト共通の個人設定 |
| `.claude/settings.json` | プロジェクト内 | ✅ | チーム共有設定 |
| `.claude/settings.local.json` | プロジェクト内 | ❌ | チームに非公開な個人上書き |

> **このプロジェクトでは** `settings.local.json` に hooks・パーミッションを集約している。

---

## 2. 設定できる項目（カテゴリ別）

### モデル関連

```json
{
  "model": "claude-sonnet-4-6",
  "fallbackModel": ["claude-haiku-4-5"],
  "effortLevel": "high"
}
```

| キー | 型 | 説明 |
|---|---|---|
| `model` | string | デフォルトモデル（例: `"claude-sonnet-4-6"`） |
| `fallbackModel` | string[] | モデル障害時のフォールバック |
| `effortLevel` | string | 処理難度: `"low"` / `"medium"` / `"high"` / `"xhigh"` |
| `availableModels` | string[] | 選択可能なモデルの allowlist |

### UI・表示

```json
{
  "editorMode": "vim",
  "language": "ja"
}
```

| キー | 型 | 説明 |
|---|---|---|
| `editorMode` | string | `"normal"` または `"vim"` |
| `language` | string | 応答言語（`"ja"`, `"en"` など） |
| `axScreenReader` | boolean | スクリーンリーダー対応出力 |
| `prefersReducedMotion` | boolean | アニメーション削減 |

### 環境変数

```json
{
  "env": {
    "DEBUG": "1",
    "NODE_ENV": "test"
  }
}
```

セッション開始時に自動でセットされる。プロジェクト固有の環境変数を渡すのに使う。

### その他の機能制御

| キー | 型 | 説明 |
|---|---|---|
| `autoCompactEnabled` | boolean | コンテキスト自動圧縮の有効化 |
| `fileCheckpointingEnabled` | boolean | `/rewind` スナップショット機能 |
| `cleanupPeriodDays` | number | セッションファイルの保持期間（既定: 30） |
| `apiKeyHelper` | string | API キー取得スクリプトのパス |
| `autoMemoryEnabled` | boolean | 自動メモリ機能の有効化 |
| `autoMemoryDirectory` | string | メモリ保存先ディレクトリ |

---

## 3. permissions（権限管理）

ツール呼び出しのたびにユーザーへ承認確認が出る。よく使うものは `allow` に追加しておくと省略できる。

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Read(src/**)"],
    "deny":  ["Bash(rm *)"]
  }
}
```

### ルール

- **`deny` が `allow` より優先**。両方に書いたら `deny` が勝つ
- パターンは Glob 記法

### Glob パターンの書き方

| パターン | 意味 |
|---|---|
| `*` | 同一階層の任意の文字列（`/` を含まない） |
| `**` | 階層を超える任意パス |
| `?` | 任意の1文字 |

### 書き方の例

```json
"allow": [
  "Bash(npm run *)",            // npm run test, npm run build など
  "Bash(git *)",                // git add, git commit など
  "Bash(python *)",             // python スクリプト全般
  "Read(src/**/*.js)",          // src/ 以下のすべての .js
  "Write(docs/**/*.md)",        // docs/ 以下の .md のみ
  "Skill(github-issue-dev)"     // スキル名指定
]
```

### ツール名の指定方法

| ツール | パターン例 |
|---|---|
| Bash コマンド | `"Bash(git commit:*)"` |
| ファイル読み込み | `"Read(path/**)"` |
| ファイル書き込み | `"Write(output/*.md)"` |
| スキル | `"Skill(スキル名)"` |
| MCP ツール | `"mcp__server__tool"` |

---

## 4. hooks（自動実行フック）

Claude Code のイベントに合わせて、外部スクリプトを自動実行する仕組み。

### イベント一覧

| イベント | 発火タイミング | ブロック可否 |
|---|---|---|
| `SessionStart` | セッション開始時 | — |
| `SessionEnd` | セッション終了時 | — |
| `PreToolUse` | ツール実行**前** | ✅ 実行を止められる |
| `PostToolUse` | ツール実行**成功後** | — |
| `PostToolUseFailure` | ツール実行**失敗後** | — |
| `UserPromptSubmit` | ユーザーが入力したとき | ✅ 入力を止められる |
| `Stop` | Claude が回答を終えたとき | ✅ 警告メッセージを出せる |

### 設定の基本構造

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "python scripts/hooks/check_placement.py 2>/dev/null || true",
            "statusMessage": "配置ルール確認中..."
          }
        ]
      }
    ]
  }
}
```

| フィールド | 説明 |
|---|---|
| `matcher` | 対象ツール名（`"Bash"`, `"Write"`, `"*"` など） |
| `type` | `"command"`（外部コマンド）が基本 |
| `command` | 実行するシェルコマンド |
| `statusMessage` | 実行中にステータスバーに表示される文字列 |
| `timeout` | タイムアウト秒数（省略可） |

### matcher の書き方

```json
"matcher": "Bash"            // 単一ツール名
"matcher": "Bash|Edit|Write" // OR（複数）
"matcher": "*"               // すべてのツール
```

### エラーを無視するおまじない

```bash
python scripts/hooks/check_placement.py 2>/dev/null || true
```

- `2>/dev/null` — stderr を捨てる
- `|| true` — スクリプトが失敗しても Claude の動作を止めない

---

## 5. hooks のスクリプト仕様（stdin / stdout）

Claude Code はスクリプトの **stdin に JSON を流す**。スクリプトは **stdout に JSON を返す**（任意）。

### stdin（Claude Code → スクリプト）

```json
{
  "hookEventName": "PostToolUse",
  "tool": "Bash",
  "tool_input": {
    "command": "npm test"
  },
  "tool_response": {
    "output": "テスト実行結果..."
  }
}
```

`tool_input` の中身はツールによって異なる：

| ツール | `tool_input` の主なキー |
|---|---|
| `Bash` | `command` |
| `Write` | `file_path`, `content` |
| `Edit` | `file_path`, `old_string`, `new_string` |
| `Read` | `file_path` |

### stdout（スクリプト → Claude Code）

#### 通知メッセージを出す

```json
{ "systemMessage": "警告: 想定外の場所にファイルが作成されました" }
```

#### ツール実行を止める（PreToolUse のみ）

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "危険なコマンドです"
  }
}
```

#### 追加コンテキストを渡す

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "ビルド完了。logs/ を確認してください。"
  }
}
```

### 終了コード

| 終了コード | 意味 |
|---|---|
| `0` | 正常（stdout の JSON をパース） |
| `2` | ブロックエラー（ツール呼び出しを拒否） |
| それ以外 | 非ブロックエラー（Claude は続行） |

---

## 6. このプロジェクトの hooks 構成

`.claude/settings.local.json` の hooks セクション：

```
イベント              matcher    スクリプト                    役割
─────────────────────────────────────────────────────────────────
PostToolUse           Write      check_placement.py          ファイル配置バリデーション
PostToolUse           Bash       archive_allure.py           テスト後に Allure 自動アーカイブ
PostToolUse           Bash       log_bash.py                 Bash コマンドを MD に記録
Stop                  —          (インライン command)         ハンドオフ未作成の警告
```

### check_placement.py の動き

```
Write ツール実行
  ↓
stdin から file_path を取得
  ↓
AGENTS.md のルールと照合
  - tests/ → _test.js 以外なら警告
  - run/   → .js ファイルなら警告
  - 想定外のトップディレクトリ → 警告
  ↓
問題あり → systemMessage で警告を出力
問題なし → 何も返さない（exit 0）
```

### archive_allure.py の動き

```
Bash ツール実行
  ↓
command に "codeceptjs run" / "npm test" 系が含まれるか判定
  ↓
含まれる → npm run allure:archive を自動実行
含まれない → 何もしない
```

### log_bash.py の動き

```
Bash ツール実行
  ↓
command と tool_response.output を取得（出力は最大 50 行）
  ↓
docs/common/learning/bash_YYYYMMDD.md に追記
```

### Stop hook（インライン）の動き

```
Claude が回答を終える
  ↓
今日の日付のハンドオフファイルが .agent/handoff/ にあるか確認
  ↓
ない → "[HANDOFF未作成] /handoff を実行してください" と警告
ある → 何もしない
```

---

## 7. スクリプトの単体テスト方法

hooks スクリプトは `echo` で stdin を与えれば単独で動作確認できる。

```bash
# check_placement.py のテスト
echo '{"tool_input": {"file_path": "/path/to/e2e/tests/bad_file.txt"}}' \
  | python scripts/hooks/check_placement.py

# archive_allure.py のテスト（テストコマンドを渡す）
echo '{"tool_input": {"command": "npx codeceptjs run tests/smoke/smoke_test.js"}}' \
  | python scripts/hooks/archive_allure.py

# log_bash.py のテスト
echo '{"tool_input": {"command": "ls -la"}, "tool_response": {"output": "total 0"}}' \
  | python scripts/hooks/log_bash.py
```
