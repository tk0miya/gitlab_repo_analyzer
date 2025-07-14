# データベース設計・実装

GitLabリポジトリ分析ツールのデータベーススキーマとマイグレーション機能の実装です。

## 技術スタック

- **データベース**: PostgreSQL 
- **クエリビルダー/マイグレーション**: Knex.js
- **型定義**: TypeScript

## データベーススキーマ

### テーブル構成

1. **users** - GitLabユーザー情報
2. **projects** - GitLabプロジェクト情報
3. **project_members** - プロジェクトメンバーシップ
4. **merge_requests** - マージリクエスト
5. **commits** - コミット履歴
6. **commit_merge_requests** - コミットとMRの関連（多対多）
7. **comments** - コメント（MR、コミット等へのコメント）

### リレーションシップ

- Project → Members (1:N)
- Project → MergeRequests (1:N)
- Project → Commits (1:N)
- User → MergeRequests (1:N, 複数の役割)
- MergeRequest ↔ Commits (N:N, `commit_merge_requests`経由)
- オブジェクト → Comments (1:N, 多態的関連)

## 環境設定

### 環境変数

```bash
# データベース接続設定
DB_HOST=localhost          # データベースホスト
DB_PORT=5432              # データベースポート
DB_NAME=gitlab_analyzer   # データベース名
DB_USER=postgres          # データベースユーザー
DB_PASSWORD=postgres      # データベースパスワード
DB_SSL=false              # SSL接続（本番環境では true）

# 実行環境
NODE_ENV=development      # development/test/production
```

### PostgreSQL セットアップ

```bash
# PostgreSQL起動（Docker使用例）
docker run --name postgres-gitlab-analyzer \
  -e POSTGRES_DB=gitlab_analyzer_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# テスト用データベース作成
docker exec -it postgres-gitlab-analyzer \
  psql -U postgres -c "CREATE DATABASE gitlab_analyzer_test;"
```

## 使用方法

### 基本操作

```bash
# 依存関係インストール
npm install

# マイグレーション実行
npm run db:migrate

# マイグレーションロールバック
npm run db:rollback

# シードデータ実行
npm run db:seed
```

### CLI管理ツール

```bash
# データベース状態確認
npx tsx src/database/cli.ts status

# ヘルスチェック
npx tsx src/database/cli.ts health

# データベースリセット
npx tsx src/database/cli.ts reset

# マイグレーション実行
npx tsx src/database/cli.ts migrate

# シードデータ実行
npx tsx src/database/cli.ts seed
```

### プログラムでの使用

```typescript
import { 
  initializeDb, 
  closeDb, 
  getDb,
  usersRepo,
  projectsRepo,
  DatabaseConnection 
} from './database/index.js';

// 初期化
await initializeDb();

// 直接クエリ実行
const knex = getDb();
const users = await knex('users').select('*').limit(10);

// リポジトリパターン使用
const user = await usersRepo.findById(123);
const projects = await projectsRepo.list(50, 0);

// 接続終了
await closeDb();
```

## API参考

### DatabaseConnection クラス

```typescript
const db = DatabaseConnection.getInstance();

// 初期化
await db.initialize();

// ヘルスチェック
const health = await db.healthCheck();

// マイグレーション実行
await db.runMigrations();

// 接続終了
await db.close();
```

### リポジトリ関数

```typescript
// ユーザー操作
const user = await usersRepo.findById(123);
const userByEmail = await usersRepo.findByEmail('user@example.com');
const users = await usersRepo.list(100, 0);

// プロジェクト操作
const project = await projectsRepo.findById(456);
const projectByPath = await projectsRepo.findByPath('namespace', 'project-name');
const projects = await projectsRepo.list(50, 0);

// マージリクエスト操作
const mr = await mergeRequestsRepo.findById(789);
const projectMRs = await mergeRequestsRepo.findByProject(456, 20, 0);
const authorMRs = await mergeRequestsRepo.findByAuthor(123, 10, 0);
```

## マイグレーション

### 新しいマイグレーション作成

```bash
# Knex CLIでマイグレーション作成
npx knex migrate:make migration_name --knexfile src/database/knexfile.ts
```

### マイグレーションファイル例

```typescript
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('new_table', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('new_table');
}
```

## テスト

```bash
# データベーステスト実行
npm test -- src/database/__tests__/

# 特定のテストファイル
npm test -- src/database/__tests__/database.test.ts
```

## 運用

### 本番環境での注意点

1. **SSL接続**: 本番では `DB_SSL=true` を設定
2. **接続プール**: 環境に応じて接続数を調整
3. **マイグレーション**: デプロイ前に必ずマイグレーション実行
4. **バックアップ**: 定期的なデータベースバックアップ
5. **モニタリング**: 接続プール状態とクエリパフォーマンスの監視

### パフォーマンス最適化

1. **インデックス**: 頻繁なクエリに対するインデックス作成済み
2. **全文検索**: PostgreSQLのGINインデックスを使用
3. **外部キー**: 適切な外部キー制約とカスケード削除
4. **複合インデックス**: 複数カラムでの検索に対応

## トラブルシューティング

### よくある問題

1. **接続エラー**: PostgreSQLが起動しているか確認
2. **権限エラー**: データベースユーザーの権限確認
3. **マイグレーションエラー**: データベースの整合性確認
4. **メモリ不足**: 接続プール設定の調整

### ログ確認

```bash
# データベース状態詳細表示
npx tsx src/database/cli.ts status

# ヘルスチェック詳細
npx tsx src/database/cli.ts health
```