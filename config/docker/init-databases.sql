-- 開発・テスト・本番環境用データベースの初期化スクリプト
-- PostgreSQL接続時に実行される

-- 開発環境用データベース
CREATE DATABASE gitlab_analyzer_development;

-- テスト環境用データベース  
CREATE DATABASE gitlab_analyzer_test;

-- 本番環境用データベース
CREATE DATABASE gitlab_analyzer_production;

-- ユーザーに全データベースへのアクセス権限を付与
GRANT ALL PRIVILEGES ON DATABASE gitlab_analyzer_development TO analyzer_user;
GRANT ALL PRIVILEGES ON DATABASE gitlab_analyzer_test TO analyzer_user;
GRANT ALL PRIVILEGES ON DATABASE gitlab_analyzer_production TO analyzer_user;