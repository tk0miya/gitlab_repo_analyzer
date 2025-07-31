# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## 言語設定

**重要**: このプロジェクトでは日本語を主言語として使用します。
- コミットメッセージ：日本語で記述
- コード内のコメント：日本語で記述
- ドキュメント：日本語で記述
- Claude Codeとのやりとり：日本語で実施

## プロジェクト概要

**gitlab_repo_analyzer** - GitLabリポジトリを分析するNode.js/TypeScriptベースのツール

## 開発環境

- **ランタイム**: Node.js 22
- **言語**: TypeScript
- **フレームワーク**: Next.js 15（App Router）
- **開発環境**: VS Code Dev Containers / Docker Compose
- **パッケージマネージャー**: npm
- **テストフレームワーク**: Vitest
- **リンター/フォーマッター**: Biome
- **データベース**: PostgreSQL + Drizzle ORM
- **UIライブラリ**: shadcn/ui + Tailwind CSS

## 設定管理

このプロジェクトは**環境変数のみ**で設定管理を行います。
環境変数の設定方法は `env.example` ファイルを参照してください。
## コマンド

### 開発
```bash
# 依存関係のインストール
npm install

# CLIアプリケーションの実行
npm start

# CLIアプリケーションの開発用実行（ホットリロード）
npm run dev

# Webアプリケーションの開発用実行
npm run dev:web

# テストの実行
npm test

# 型チェック
npm run typecheck

# リンター/フォーマッター
npm run lint
npm run format

# ビルド
npm run build        # CLIアプリケーション
npm run build:web    # Webアプリケーション
```

## アーキテクチャ

### プロジェクト構造
```
src/
├── app/          # Next.js App Router（Webアプリケーション）
│   ├── api/      # Route Handlers（REST API）
│   ├── layout.tsx # ルートレイアウト
│   └── page.tsx  # ホームページ
├── api/          # GitLab APIクライアントと型定義
├── components/   # UIコンポーネント（shadcn/ui）
├── config/       # 設定管理（環境変数、スキーマ検証）
├── database/     # データベース関連（スキーマ、マイグレーション、リポジトリ）
│   ├── connection.ts  # DB接続管理
│   ├── repositories/  # リポジトリパターン実装
│   ├── schema/        # Drizzle ORMスキーマ定義
│   └── testing/       # テスト用ファクトリ
├── lib/          # 共通ユーティリティ
├── styles/       # グローバルスタイル
├── types/        # 共通型定義
└── index.ts      # CLIエントリーポイント
```

### ディレクトリ構成の原則

1. **レイヤードアーキテクチャ**
   - `app/`: プレゼンテーション層（UI、API Routes）
   - `database/`: データアクセス層
   - `api/`: 外部サービス統合層（GitLab API）
   - `config/`: 設定管理層

2. **責務の分離**
   - 各ディレクトリは明確な責務を持つ
   - 依存関係は上位層から下位層への単一方向

3. **テストファイルの配置**
   - 各モジュールの`__tests__`サブディレクトリに配置
   - テスト対象ファイルと近い場所で管理

4. **将来のServer Actions対応**
   - 必要に応じて`src/server-actions/`ディレクトリを追加予定
   - App RouterとServer Actionsの併用が可能

### 主要機能
- **GitLab API統合**: プロジェクト、コミット、ユーザー情報の取得
- **データベース管理**: PostgreSQL + Drizzle ORMでのデータ永続化
- **テストカバレッジ**: ファクトリパターンでのテストデータ管理

## 開発ガイドライン

1. **プロジェクト構造**: コードを論理的なモジュールに整理：
   - `/src` - メインソースコード
   - `/lib` - 再利用可能なユーティリティ
   - `/test` - テストファイル
   - `/config` - 設定ファイル

2. **エラーハンドリング**: API障害やエッジケースに対する堅牢なエラーハンドリングを実装

3. **設定**: GitLab APIトークンと設定には環境変数を使用

4. **テスト**: Vitestを使用した包括的なテスト

5. **テスト方針**: ユーザー体験と機能的価値に焦点を当てたテスト設計
   - **✅ テストすべき内容**:
     - コンテンツの表示確認（テキスト、要素の存在）
     - 機能的な動作（リンク、フォーム送信、データ取得）
     - ユーザーインタラクション（クリック、入力）
     - エラーハンドリング（異常系の動作）
     - アクセシビリティ（aria属性、role属性）
     - セキュリティ属性（rel="noopener noreferrer"等）
   - **❌ テストしない内容**:
     - 具体的なCSSクラス名（`toHaveClass("bg-primary")`等）
     - スタイリングの詳細（色、サイズ、マージン等）
     - 実装詳細（内部状態、プライベートメソッド）
     - フレームワーク固有の実装（Tailwind CSS、styled-components等）
   - **原則**: 「実装がどうなっているか」ではなく「ユーザーが何を体験するか」をテスト

6. **テストデータ共有**: プロジェクト全体でテストデータを一貫して管理するためのファクトリパターンを使用
   - **ファクトリ関数の使用**: ハードコーディングされたテストデータの代わりにファクトリ関数を使用
   - **共有ファクトリ配置**: `src/**/__tests__/factories/` ディレクトリにファクトリ関数を配置
   - **統一エクスポート**: `factories/index.ts` で統一的なアクセスポイントを提供
   - **カスタマイズ可能**: デフォルト値を提供し、必要に応じてフィールドのオーバーライドを許可
   - **一意性保証**: テスト間でのデータ衝突を避けるため、自動的に一意のIDを生成

7. **コード品質**: Biomeでのリント・フォーマット、TypeScriptでの型安全性

8. **コミット前チェック**: Huskyとlint-stagedによる自動品質チェック
   - 変更されたファイルのlint・format
   - TypeScriptの型チェック
   - 関連テストの実行（vitest related）

9. **開発原則**: 以下の原則に従ったコード設計・実装を行う
   - **DRY原則 (Don't Repeat Yourself)**: 同じ情報を複数の場所で重複させない
   - **YAGNI原則 (You Ain't Gonna Need It)**: 現在必要でない機能は実装しない
   - **SOLID原則**: オブジェクト指向設計の5つの原則に従う
     - Single Responsibility Principle (単一責任の原則)
     - Open/Closed Principle (開放/閉鎖の原則)
     - Liskov Substitution Principle (リスコフの置換原則)
     - Interface Segregation Principle (インターフェース分離の原則)
     - Dependency Inversion Principle (依存性逆転の原則)

## 開発ワークフロー

### 基本ワークフロー

1. **実装・テスト**
   - コード実装、型チェック、リント、テストの実行

2. **コミット・プッシュ**
   ```bash
   git add .
   git commit -m "作業内容の説明"
   git push origin <branch-name>
   ```


### コミット管理

#### squash前の必須チェック
複数コミットをsquashする際は、以下を必ず実行してコミットメッセージと実際の変更内容の一致を確保する：

```bash
# 最終的にステージングされるファイルを確認
git status

# 実際の変更内容を確認
git diff --cached
```

#### コミットメッセージの原則
- **最終状態ベース**: squash後の実際の変更内容のみを記述
- **作業過程除外**: 試行錯誤、レビュー対応、取り消された変更は記述しない
- **主要変更優先**: メインの機能変更を中心に記述し、副次的変更（lint修正等）は省略可

#### 禁止事項
- ❌ 存在しない変更（削除されたファイル等）の記述
- ❌ レビューコメントや指示内容の記述
- ❌ 作業中の試行錯誤プロセスの記述
- ❌ 取り消された一時的な変更の記述

#### 例
**❌ 悪い例（存在しない変更を記述）:**
```
機能Aを実装

- 新機能を追加
- .biomeignoreファイルを追加  ← 実際は削除済み
- lint修正を実施  ← squashで消えた
```

**✅ 良い例（実際の変更のみ記述）:**
```
機能Aを実装

- 新機能を追加
- 必要な設定ファイルを更新
```

