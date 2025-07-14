import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("comments", (table) => {
		table.integer("id").primary().notNullable().comment("GitLab note ID");
		table.integer("project_id").notNullable().comment("プロジェクトID");
		table.integer("author_id").nullable().comment("コメント作成者ID");
		table.text("body").notNullable().comment("コメント本文");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.comment("作成日時");
		table
			.timestamp("updated_at", { useTz: true })
			.notNullable()
			.comment("更新日時");
		table
			.boolean("system")
			.defaultTo(false)
			.comment("システムコメント（自動生成）フラグ");
		table
			.boolean("resolvable")
			.defaultTo(false)
			.comment("解決可能コメントフラグ");
		table.boolean("resolved").defaultTo(false).comment("解決済みフラグ");
		table.integer("resolved_by_id").nullable().comment("解決者ID");
		table
			.timestamp("resolved_at", { useTz: true })
			.nullable()
			.comment("解決日時");

		// 関連オブジェクト（MR、Commit、Issue等）への多態的参照
		table
			.string("noteable_type", 50)
			.notNullable()
			.comment("MergeRequest/Commit/Issue等");
		table.integer("noteable_id").notNullable().comment("関連オブジェクトID");

		// 行コメント用（コードレビュー）
		table
			.string("line_type", 20)
			.nullable()
			.comment("new/old/context（行コメント時）");
		table.integer("line_number").nullable().comment("行番号（行コメント時）");
		table
			.string("file_path", 500)
			.nullable()
			.comment("ファイルパス（行コメント時）");

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
			.foreign("resolved_by_id")
			.references("id")
			.inTable("users")
			.onDelete("SET NULL");

		// インデックス
		table.index(["noteable_type", "noteable_id"], "idx_comments_noteable");
		table.index(["project_id", "created_at"], "idx_comments_project_created");
		table.index(["author_id"], "idx_comments_author");
		table.index(["resolved"], "idx_comments_resolved");
		table.index(["created_at"], "idx_comments_created_at");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("comments");
}
