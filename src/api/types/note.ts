/**
 * GitLab Notes API型定義
 */

/**
 * GitLabノート（コメント）情報
 * GET /api/v4/projects/:id/merge_requests/:merge_request_iid/notes のレスポンス型
 */
export interface GitLabNote {
	id: number;
	type: string | null;
	body: string;
	attachment: string | null;
	author: GitLabNoteAuthor;
	created_at: string;
	updated_at: string;
	system: boolean;
	noteable_id: number;
	noteable_type: string;
	project_id: number;
	resolvable: boolean;
	resolved?: boolean;
	resolved_by?: GitLabNoteAuthor | null;
	resolved_at?: string | null;
	confidential: boolean;
	internal: boolean;
	noteable_iid: number;
	commands_changes?: Record<string, unknown>;
}

/**
 * GitLabノートの作成者情報
 */
export interface GitLabNoteAuthor {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string | null;
	web_url: string;
}

/**
 * ノート取得のクエリパラメータ
 */
export interface GitLabNotesQuery {
	sort?: "asc" | "desc";
	order_by?: "created_at" | "updated_at";
	per_page?: number;
	page?: number;
}

/**
 * ノート作成のリクエストパラメータ
 */
export interface GitLabCreateNoteRequest {
	body: string;
	internal?: boolean;
	confidential?: boolean;
}
