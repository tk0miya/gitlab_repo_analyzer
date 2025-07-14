/**
 * データベースモジュールのエントリーポイント
 */

// 接続管理
export {
	closeDb,
	DatabaseConnection,
	getDb,
	initializeDb,
} from "./connection.js";
// 設定
export { default as knexConfig } from "./knexfile.js";
// 型定義
export * from "./types.js";

// 簡易なリポジトリパターンを提供するヘルパー関数
import { getDb } from "./connection.js";
import type {
	Comment,
	Commit,
	CommitMergeRequest,
	MergeRequest,
	Project,
	ProjectMember,
	User,
} from "./types.js";

/**
 * 基本的なデータベース操作を提供するリポジトリ関数群
 */

// Users
export const usersRepo = {
	findById: (id: number) => getDb()("users").where({ id }).first<User>(),
	findByUsername: (username: string) =>
		getDb()("users").where({ username }).first<User>(),
	findByEmail: (email: string) =>
		getDb()("users").where({ email }).first<User>(),
	create: (user: Omit<User, "id">) =>
		getDb()("users").insert(user).returning("*"),
	update: (id: number, updates: Partial<User>) =>
		getDb()("users").where({ id }).update(updates).returning("*"),
	delete: (id: number) => getDb()("users").where({ id }).del(),
	list: (limit = 100, offset = 0) =>
		getDb()("users").select("*").limit(limit).offset(offset),
};

// Projects
export const projectsRepo = {
	findById: (id: number) => getDb()("projects").where({ id }).first<Project>(),
	findByPath: (namespace_path: string, path: string) =>
		getDb()("projects").where({ namespace_path, path }).first<Project>(),
	create: (project: Omit<Project, "id">) =>
		getDb()("projects").insert(project).returning("*"),
	update: (id: number, updates: Partial<Project>) =>
		getDb()("projects").where({ id }).update(updates).returning("*"),
	delete: (id: number) => getDb()("projects").where({ id }).del(),
	list: (limit = 100, offset = 0) =>
		getDb()("projects").select("*").limit(limit).offset(offset),
	findByNamespace: (namespace_path: string) =>
		getDb()("projects").where({ namespace_path }),
};

// Project Members
export const projectMembersRepo = {
	findByProjectId: (project_id: number) =>
		getDb()("project_members")
			.where({ project_id })
			.join("users", "project_members.user_id", "users.id")
			.select(
				"project_members.*",
				"users.username",
				"users.name",
				"users.email",
			),
	findByUserId: (user_id: number) =>
		getDb()("project_members")
			.where({ user_id })
			.join("projects", "project_members.project_id", "projects.id")
			.select(
				"project_members.*",
				"projects.name",
				"projects.namespace_path",
				"projects.path",
			),
	findMember: (project_id: number, user_id: number) =>
		getDb()("project_members")
			.where({ project_id, user_id })
			.first<ProjectMember>(),
	create: (member: Omit<ProjectMember, "id">) =>
		getDb()("project_members").insert(member).returning("*"),
	update: (id: number, updates: Partial<ProjectMember>) =>
		getDb()("project_members").where({ id }).update(updates).returning("*"),
	delete: (id: number) => getDb()("project_members").where({ id }).del(),
};

// Merge Requests
export const mergeRequestsRepo = {
	findById: (id: number) =>
		getDb()("merge_requests").where({ id }).first<MergeRequest>(),
	findByProjectAndIid: (project_id: number, iid: number) =>
		getDb()("merge_requests").where({ project_id, iid }).first<MergeRequest>(),
	findByProject: (project_id: number, limit = 100, offset = 0) =>
		getDb()("merge_requests")
			.where({ project_id })
			.orderBy("created_at", "desc")
			.limit(limit)
			.offset(offset),
	findByAuthor: (author_id: number, limit = 100, offset = 0) =>
		getDb()("merge_requests")
			.where({ author_id })
			.orderBy("created_at", "desc")
			.limit(limit)
			.offset(offset),
	create: (mr: Omit<MergeRequest, "id">) =>
		getDb()("merge_requests").insert(mr).returning("*"),
	update: (id: number, updates: Partial<MergeRequest>) =>
		getDb()("merge_requests").where({ id }).update(updates).returning("*"),
	delete: (id: number) => getDb()("merge_requests").where({ id }).del(),
};

// Commits
export const commitsRepo = {
	findBySha: (sha: string) => getDb()("commits").where({ sha }).first<Commit>(),
	findByProject: (project_id: number, limit = 100, offset = 0) =>
		getDb()("commits")
			.where({ project_id })
			.orderBy("committed_date", "desc")
			.limit(limit)
			.offset(offset),
	findByAuthor: (author_email: string, limit = 100, offset = 0) =>
		getDb()("commits")
			.where({ author_email })
			.orderBy("committed_date", "desc")
			.limit(limit)
			.offset(offset),
	create: (commit: Commit) => getDb()("commits").insert(commit).returning("*"),
	update: (sha: string, updates: Partial<Commit>) =>
		getDb()("commits").where({ sha }).update(updates).returning("*"),
	delete: (sha: string) => getDb()("commits").where({ sha }).del(),
};

// Comments
export const commentsRepo = {
	findById: (id: number) => getDb()("comments").where({ id }).first<Comment>(),
	findByNoteable: (noteable_type: string, noteable_id: number) =>
		getDb()("comments")
			.where({ noteable_type, noteable_id })
			.orderBy("created_at", "asc"),
	findByProject: (project_id: number, limit = 100, offset = 0) =>
		getDb()("comments")
			.where({ project_id })
			.orderBy("created_at", "desc")
			.limit(limit)
			.offset(offset),
	create: (comment: Omit<Comment, "id">) =>
		getDb()("comments").insert(comment).returning("*"),
	update: (id: number, updates: Partial<Comment>) =>
		getDb()("comments").where({ id }).update(updates).returning("*"),
	delete: (id: number) => getDb()("comments").where({ id }).del(),
};

// Commit-MergeRequest Relations
export const commitMergeRequestsRepo = {
	findByCommit: (commit_sha: string) =>
		getDb()("commit_merge_requests").where({ commit_sha }),
	findByMergeRequest: (merge_request_id: number) =>
		getDb()("commit_merge_requests").where({ merge_request_id }),
	create: (relation: CommitMergeRequest) =>
		getDb()("commit_merge_requests").insert(relation).returning("*"),
	delete: (commit_sha: string, merge_request_id: number) =>
		getDb()("commit_merge_requests")
			.where({ commit_sha, merge_request_id })
			.del(),
};
