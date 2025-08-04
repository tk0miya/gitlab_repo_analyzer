# squashコマンド

このコマンドは複数のコミットと未コミットの変更を1つにまとめ、変更内容を要約したコミットメッセージを生成します。

## 実行される処理

1. **現在の状況確認**
   - 現在のブランチとコミット履歴を確認
   - 未コミットの変更も含めて統合対象として扱う

2. **未コミット変更の取り込み**
   - 作業中の変更があればステージングに追加
   - 全ての変更を統合対象に含める

3. **コミット統合**
   - git reset --soft を使用してコミットを統合
   - 未コミット変更も含めてステージング状態で統合

4. **変更内容の分析**
   - 統合後の差分を確認・分析
   - ファイル単位での変更内容を把握

5. **コミットメッセージ生成**
   - 実際の変更内容のみを要約
   - レビュー指摘や作業過程は除外
   - CLAUDE.mdのコミット原則に従った内容

6. **新しいコミットの作成**
   - 要約されたメッセージでコミット実行

## 使用例

```bash
/squash
```

複数のコミット履歴や未コミットの変更がある場合に実行し、それらを1つのコミットにまとめます。

## 前提条件

- Git リポジトリが初期化されていること
- 統合対象となるコミットまたは変更が存在すること

## 特徴

- 未コミットの変更も自動的に含めて統合
- バックアップ不要のシンプルな操作
- 変更内容に基づく自動的なコミットメッセージ生成

---

# 実行処理

## ステップ1: 現在状況の確認

まず現在のGitの状態を確認します。

```bash
# 現在のブランチとコミット履歴を確認
echo "=== 現在の状況 ==="
git status
echo ""
echo "=== 最近のコミット履歴 ==="
git log --oneline -10
```

## ステップ2: 統合するコミット数の決定

統合対象のコミット数をユーザーに確認します。

```bash
# 統合するコミット数をインタラクティブに決定
# デフォルトは最新から2つのコミット
echo ""
echo "統合するコミット数を入力してください（デフォルト: 2）:"
read -r COMMIT_COUNT
COMMIT_COUNT=${COMMIT_COUNT:-2}

# コミット数の妥当性チェック
TOTAL_COMMITS=$(git rev-list --count HEAD)
if [ $COMMIT_COUNT -gt $TOTAL_COMMITS ]; then
    echo "エラー: 指定されたコミット数が総コミット数を超えています。"
    exit 1
fi

echo "統合対象: 最新の${COMMIT_COUNT}個のコミット + 未コミット変更"
```

## ステップ3: 未コミット変更の取り込み

作業中の変更があればステージングに追加します。

```bash
# 未コミットの変更がある場合はステージングに追加
if [ -n "$(git status --porcelain)" ]; then
    echo "=== 未コミット変更をステージングに追加 ==="
    git add .
    echo "未コミット変更をステージングに追加しました。"
else
    echo "未コミット変更はありません。"
fi
```

## ステップ4: soft reset の実行

指定されたコミット数分をsoft resetで統合します。

```bash
# soft resetを実行（HEADから指定数分戻る）
if [ $COMMIT_COUNT -gt 0 ]; then
    git reset --soft HEAD~$COMMIT_COUNT
    echo "soft resetを実行しました。${COMMIT_COUNT}個のコミットが統合されました。"
else
    echo "コミット統合はスキップしました。"
fi
```

## ステップ5: 変更内容の分析

統合された変更内容を分析します。

```bash
# ステージングされた変更内容を確認
echo ""
echo "=== 統合された変更内容 ==="
git status

echo ""
echo "=== 変更ファイルの概要 ==="
git diff --cached --stat

echo ""
echo "=== 詳細な差分（最初の50行） ==="
git diff --cached | head -50
if [ $(git diff --cached | wc -l) -gt 50 ]; then
    echo "... (差分が長いため省略)"
fi
```

## ステップ6: コミットメッセージの生成

変更内容を要約してコミットメッセージを生成します。

```bash
# 変更されたファイルの分析
CHANGED_FILES=$(git diff --cached --name-only)
if [ -z "$CHANGED_FILES" ]; then
    echo "変更がありません。処理を終了します。"
    exit 0
fi

FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l)

# 変更内容の分類
CHANGE_TYPE="機能"
if echo "$CHANGED_FILES" | grep -q "test\|spec\|__tests__"; then
    CHANGE_TYPE="テスト"
elif echo "$CHANGED_FILES" | grep -q "\.md$\|README\|doc"; then
    CHANGE_TYPE="ドキュメント"
elif echo "$CHANGED_FILES" | grep -q "package\.json\|\.config\|\.yml\|\.yaml\|tsconfig\|\.env"; then
    CHANGE_TYPE="設定"
elif echo "$CHANGED_FILES" | grep -q "\.css\|\.scss\|\.less\|style"; then
    CHANGE_TYPE="スタイル"
fi

# 主要な変更ファイルを抽出（最大5つ）
MAIN_CHANGES=""
for file in $(echo "$CHANGED_FILES" | head -5); do
    MAIN_CHANGES="${MAIN_CHANGES}- ${file}\n"
done

# 追加・削除行数を取得
DIFF_STATS=$(git diff --cached --numstat | awk '{add+=$1; del+=$2} END {printf "+%d -%d", add, del}')

# コミットメッセージを生成
COMMIT_MESSAGE="${CHANGE_TYPE}の更新

変更ファイル数: ${FILE_COUNT}個
変更量: ${DIFF_STATS}

主な変更:
$(echo -e "$MAIN_CHANGES" | sed 's/$//')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## ステップ7: 新しいコミットの作成

生成されたメッセージでコミットを作成します。

```bash
# コミットメッセージをプレビュー表示
echo ""
echo "=== 生成されたコミットメッセージ ==="
echo "$COMMIT_MESSAGE"
echo "=================================="

# 確認を求める
echo ""
echo "このコミットメッセージでコミットしますか？ (Y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "n" ] && [ "$CONFIRM" != "N" ]; then
    # コミットを作成
    git commit -m "$COMMIT_MESSAGE"
    echo ""
    echo "✅ コミットが作成されました。"
    
    # 新しいコミット履歴を表示
    echo ""
    echo "=== 更新後のコミット履歴 ==="
    git log --oneline -5
else
    echo "❌ コミットがキャンセルされました。"
    echo "変更はステージング状態で保持されています。"
fi
```

## ステップ8: 完了メッセージ

処理完了を報告します。

```bash
echo ""
echo "=== squash処理完了 ==="
echo "統合されたコミット数: ${COMMIT_COUNT}個"
echo "変更ファイル数: ${FILE_COUNT}個"
echo "統合タイプ: ${CHANGE_TYPE}"
```