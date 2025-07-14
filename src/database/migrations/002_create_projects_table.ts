import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("projects", (table) => {
		table.integer("id").primary().notNullable().comment("GitLab project ID");
		table.string("name", 255).notNullable().comment("プロジェクト名");
		table
			.string("path", 255)
			.notNullable()
			.comment('プロジェクトパス（例: "my-project"）');
		table
			.string("namespace_path", 255)
			.notNullable()
			.comment('名前空間パス（例: "group/subgroup"）');
		table.text("description").nullable().comment("プロジェクト説明");
		table.string("web_url", 512).notNullable().comment("プロジェクトWebURL");
		table.string("ssh_url_to_repo", 512).nullable().comment("SSH clone URL");
		table.string("http_url_to_repo", 512).nullable().comment("HTTP clone URL");
		table
			.string("default_branch", 100)
			.nullable()
			.comment('デフォルトブランチ（通常"main"/"master"）');
		table
			.string("visibility_level", 20)
			.nullable()
			.comment("private/internal/public");
		table.boolean("archived").defaultTo(false).comment("アーカイブ済みフラグ");
		table
			.boolean("issues_enabled")
			.defaultTo(true)
			.comment("Issue機能有効フラグ");
		table
			.boolean("merge_requests_enabled")
			.defaultTo(true)
			.comment("MR機能有効フラグ");
		table
			.boolean("wiki_enabled")
			.defaultTo(false)
			.comment("Wiki機能有効フラグ");
		table
			.boolean("snippets_enabled")
			.defaultTo(false)
			.comment("Snippet機能有効フラグ");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.comment("GitLabでの作成日時");
		table
			.timestamp("updated_at", { useTz: true })
			.notNullable()
			.comment("GitLabでの更新日時");
		table
			.timestamp("last_activity_at", { useTz: true })
			.nullable()
			.comment("最終活動日時");
		table.integer("star_count").defaultTo(0).comment("スター数");
		table.integer("forks_count").defaultTo(0).comment("フォーク数");
		table
			.timestamp("analyzed_at", { useTz: true })
			.nullable()
			.comment("最後に分析された日時");

		// 制約
		table.unique(["namespace_path", "path"], "unique_project_path");

		// インデックス
		table.index(["namespace_path"], "idx_projects_namespace");
		table.index(["visibility_level"], "idx_projects_visibility");
		table.index(["archived"], "idx_projects_archived");
		table.index(["created_at"], "idx_projects_created_at");
		table.index(["analyzed_at"], "idx_projects_analyzed_at");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("projects");
}
