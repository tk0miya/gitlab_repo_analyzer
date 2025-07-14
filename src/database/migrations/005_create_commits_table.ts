import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("commits", (table) => {
		table
			.string("sha", 40)
			.primary()
			.notNullable()
			.comment("コミットSHA（Git標準40文字）");
		table.integer("project_id").notNullable().comment("プロジェクトID");
		table.string("short_sha", 8).notNullable().comment("短縮SHA");
		table
			.string("title", 255)
			.notNullable()
			.comment("コミットタイトル（1行目）");
		table.text("message").nullable().comment("フルコミットメッセージ");
		table.string("author_name", 255).notNullable().comment("作成者名");
		table
			.string("author_email", 255)
			.notNullable()
			.comment("作成者メールアドレス");
		table
			.timestamp("authored_date", { useTz: true })
			.notNullable()
			.comment("作成日時");
		table.string("committer_name", 255).notNullable().comment("コミッター名");
		table
			.string("committer_email", 255)
			.notNullable()
			.comment("コミッターメールアドレス");
		table
			.timestamp("committed_date", { useTz: true })
			.notNullable()
			.comment("コミット日時");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.defaultTo(knex.fn.now())
			.comment("DB作成日時");
		table.string("web_url", 512).nullable().comment("コミットURL");
		table
			.specificType("parent_ids", "text[]")
			.nullable()
			.comment("親コミットSHA配列");
		table.integer("stats_additions").nullable().comment("追加行数");
		table.integer("stats_deletions").nullable().comment("削除行数");
		table.integer("stats_total").nullable().comment("総変更行数");

		// 外部キー制約
		table
			.foreign("project_id")
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");

		// インデックス
		table.index(["project_id", "committed_date"], "idx_commits_project_date");
		table.index(["author_email"], "idx_commits_author_email");
		table.index(["committer_email"], "idx_commits_committer_email");
		table.index(["committed_date"], "idx_commits_committed_date");
		table.index(["project_id", "author_email"], "idx_commits_project_author");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("commits");
}
