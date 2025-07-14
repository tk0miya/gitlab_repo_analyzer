/**
 * データベーステーブルのTypeScript型定義
 */

// ユーザーテーブル
export interface User {
	id: number; // GitLab user ID
	username: string; // ユーザー名
	name: string; // 表示名
	email?: string; // メールアドレス
	avatar_url?: string; // アバターURL
	web_url?: string; // プロフィールURL
	state?: string; // active/blocked等
	created_at: Date; // GitLabでの作成日時
	updated_at: Date; // GitLabでの更新日時
	last_activity_on?: Date; // 最終活動日
	is_admin: boolean; // 管理者フラグ
	can_create_group: boolean; // グループ作成権限
	can_create_project: boolean; // プロジェクト作成権限
}

// プロジェクトテーブル
export interface Project {
	id: number; // GitLab project ID
	name: string; // プロジェクト名
	path: string; // プロジェクトパス（例: "my-project"）
	namespace_path: string; // 名前空間パス（例: "group/subgroup"）
	description?: string; // プロジェクト説明
	web_url: string; // プロジェクトWebURL
	ssh_url_to_repo?: string; // SSH clone URL
	http_url_to_repo?: string; // HTTP clone URL
	default_branch?: string; // デフォルトブランチ（通常"main"/"master"）
	visibility_level?: string; // private/internal/public
	archived: boolean; // アーカイブ済みフラグ
	issues_enabled: boolean; // Issue機能有効フラグ
	merge_requests_enabled: boolean; // MR機能有効フラグ
	wiki_enabled: boolean; // Wiki機能有効フラグ
	snippets_enabled: boolean; // Snippet機能有効フラグ
	created_at: Date; // GitLabでの作成日時
	updated_at: Date; // GitLabでの更新日時
	last_activity_at?: Date; // 最終活動日時
	star_count: number; // スター数
	forks_count: number; // フォーク数
	analyzed_at?: Date; // 最後に分析された日時
}

// プロジェクトメンバーテーブル
export interface ProjectMember {
	id: number; // 連番ID
	project_id: number; // プロジェクトID
	user_id: number; // ユーザーID
	access_level: number; // 10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner
	expires_at?: Date; // アクセス期限
	created_at: Date; // 作成日時
	updated_at: Date; // 更新日時
}

// マージリクエストテーブル
export interface MergeRequest {
	id: number; // GitLab MR ID
	iid: number; // プロジェクト内でのMR番号
	project_id: number; // プロジェクトID
	title: string; // MRタイトル
	description?: string; // MR説明
	state: string; // opened/closed/merged
	created_at: Date; // 作成日時
	updated_at: Date; // 更新日時
	merged_at?: Date; // マージ日時
	closed_at?: Date; // クローズ日時
	author_id?: number; // 作成者ID
	assignee_id?: number; // アサイン者ID
	merge_user_id?: number; // マージ実行者ID
	source_branch: string; // ソースブランチ
	target_branch: string; // ターゲットブランチ
	source_project_id?: number; // ソースプロジェクト（フォークMR用）
	target_project_id: number; // ターゲットプロジェクト
	merge_commit_sha?: string; // マージコミットSHA
	squash_commit_sha?: string; // スカッシュコミットSHA
	web_url: string; // MR URL
	changes_count: number; // 変更ファイル数
	user_notes_count: number; // コメント数
	upvotes: number; // 賛成票数
	downvotes: number; // 反対票数
	work_in_progress: boolean; // WIP/Draft フラグ
	merge_when_pipeline_succeeds: boolean; // パイプライン成功時自動マージ
	should_remove_source_branch: boolean; // ソースブランチ削除フラグ
	force_remove_source_branch: boolean; // 強制ソースブランチ削除
	allow_collaboration: boolean; // コラボレーション許可
	allow_maintainer_to_push: boolean; // メンテナーのプッシュ許可
}

// コミットテーブル
export interface Commit {
	sha: string; // コミットSHA（Git標準40文字）
	project_id: number; // プロジェクトID
	short_sha: string; // 短縮SHA
	title: string; // コミットタイトル（1行目）
	message?: string; // フルコミットメッセージ
	author_name: string; // 作成者名
	author_email: string; // 作成者メールアドレス
	authored_date: Date; // 作成日時
	committer_name: string; // コミッター名
	committer_email: string; // コミッターメールアドレス
	committed_date: Date; // コミット日時
	created_at: Date; // DB作成日時
	web_url?: string; // コミットURL
	parent_ids?: string[]; // 親コミットSHA配列
	stats_additions?: number; // 追加行数
	stats_deletions?: number; // 削除行数
	stats_total?: number; // 総変更行数
}

// コミット・マージリクエスト関連テーブル
export interface CommitMergeRequest {
	commit_sha: string; // コミットSHA
	merge_request_id: number; // マージリクエストID
}

// コメントテーブル
export interface Comment {
	id: number; // GitLab note ID
	project_id: number; // プロジェクトID
	author_id?: number; // コメント作成者ID
	body: string; // コメント本文
	created_at: Date; // 作成日時
	updated_at: Date; // 更新日時
	system: boolean; // システムコメント（自動生成）フラグ
	resolvable: boolean; // 解決可能コメントフラグ
	resolved: boolean; // 解決済みフラグ
	resolved_by_id?: number; // 解決者ID
	resolved_at?: Date; // 解決日時
	// 関連オブジェクト（MR、Commit、Issue等）への多態的参照
	noteable_type: string; // MergeRequest/Commit/Issue等
	noteable_id: number; // 関連オブジェクトID
	// 行コメント用（コードレビュー）
	line_type?: string; // new/old/context（行コメント時）
	line_number?: number; // 行番号（行コメント時）
	file_path?: string; // ファイルパス（行コメント時）
}

// アクセスレベル定数
export const AccessLevel = {
	GUEST: 10,
	REPORTER: 20,
	DEVELOPER: 30,
	MAINTAINER: 40,
	OWNER: 50,
} as const;

export type AccessLevelType = (typeof AccessLevel)[keyof typeof AccessLevel];

// MR状態定数
export const MergeRequestState = {
	OPENED: "opened",
	CLOSED: "closed",
	MERGED: "merged",
} as const;

export type MergeRequestStateType =
	(typeof MergeRequestState)[keyof typeof MergeRequestState];

// 可視性レベル定数
export const VisibilityLevel = {
	PRIVATE: "private",
	INTERNAL: "internal",
	PUBLIC: "public",
} as const;

export type VisibilityLevelType =
	(typeof VisibilityLevel)[keyof typeof VisibilityLevel];

// ユーザー状態定数
export const UserState = {
	ACTIVE: "active",
	BLOCKED: "blocked",
	DEACTIVATED: "deactivated",
} as const;

export type UserStateType = (typeof UserState)[keyof typeof UserState];

// コメント関連オブジェクトタイプ定数
export const NoteableType = {
	MERGE_REQUEST: "MergeRequest",
	COMMIT: "Commit",
	ISSUE: "Issue",
	SNIPPET: "Snippet",
} as const;

export type NoteableTypeType = (typeof NoteableType)[keyof typeof NoteableType];
