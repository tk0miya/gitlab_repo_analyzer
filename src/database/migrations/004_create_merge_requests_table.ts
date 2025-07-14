import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("merge_requests", (table) => {
		table.integer("id").primary().notNullable().comment("GitLab MR ID");
		table.integer("iid").notNullable().comment("プロジェクト内でのMR番号");
		table.integer("project_id").notNullable().comment("プロジェクトID");
		table.string("title", 255).notNullable().comment("MRタイトル");
		table.text("description").nullable().comment("MR説明");
		table.string("state", 20).notNullable().comment("opened/closed/merged");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.comment("作成日時");
		table
			.timestamp("updated_at", { useTz: true })
			.notNullable()
			.comment("更新日時");
		table
			.timestamp("merged_at", { useTz: true })
			.nullable()
			.comment("マージ日時");
		table
			.timestamp("closed_at", { useTz: true })
			.nullable()
			.comment("クローズ日時");
		table.integer("author_id").nullable().comment("作成者ID");
		table.integer("assignee_id").nullable().comment("アサイン者ID");
		table.integer("merge_user_id").nullable().comment("マージ実行者ID");
		table.string("source_branch", 255).notNullable().comment("ソースブランチ");
		table
			.string("target_branch", 255)
			.notNullable()
			.comment("ターゲットブランチ");
		table
			.integer("source_project_id")
			.nullable()
			.comment("ソースプロジェクト（フォークMR用）");
		table
			.integer("target_project_id")
			.notNullable()
			.comment("ターゲットプロジェクト");
		table
			.string("merge_commit_sha", 40)
			.nullable()
			.comment("マージコミットSHA");
		table
			.string("squash_commit_sha", 40)
			.nullable()
			.comment("スカッシュコミットSHA");
		table.string("web_url", 512).notNullable().comment("MR URL");
		table.integer("changes_count").defaultTo(0).comment("変更ファイル数");
		table.integer("user_notes_count").defaultTo(0).comment("コメント数");
		table.integer("upvotes").defaultTo(0).comment("賛成票数");
		table.integer("downvotes").defaultTo(0).comment("反対票数");
		table
			.boolean("work_in_progress")
			.defaultTo(false)
			.comment("WIP/Draft フラグ");
		table
			.boolean("merge_when_pipeline_succeeds")
			.defaultTo(false)
			.comment("パイプライン成功時自動マージ");
		table
			.boolean("should_remove_source_branch")
			.defaultTo(false)
			.comment("ソースブランチ削除フラグ");
		table
			.boolean("force_remove_source_branch")
			.defaultTo(false)
			.comment("強制ソースブランチ削除");
		table
			.boolean("allow_collaboration")
			.defaultTo(false)
			.comment("コラボレーション許可");
		table
			.boolean("allow_maintainer_to_push")
			.defaultTo(false)
			.comment("メンテナーのプッシュ許可");

		// 外部キー制約
		table
			.foreign("project_id")
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");
		table
			.foreign("author_id")
			.references("id")
			.inTable("users")
			.onDelete("SET NULL");
		table
			.foreign("assignee_id")
			.references("id")
			.inTable("users")
			.onDelete("SET NULL");
		table
			.foreign("merge_user_id")
			.references("id")
			.inTable("users")
			.onDelete("SET NULL");
		table
			.foreign("source_project_id")
			.references("id")
			.inTable("projects")
			.onDelete("SET NULL");
		table
			.foreign("target_project_id")
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");

		// 制約
		table.unique(["project_id", "iid"], "unique_mr_per_project");

		// インデックス
		table.index(["project_id", "state"], "idx_merge_requests_project_state");
		table.index(
			["author_id", "created_at"],
			"idx_merge_requests_author_created",
		);
		table.index(["state", "created_at"], "idx_merge_requests_state_created");
		table.index(["target_project_id"], "idx_merge_requests_target_project");
		table.index(["merged_at"], "idx_merge_requests_merged_at");
		table.index(["created_at"], "idx_merge_requests_created_at");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("merge_requests");
}
