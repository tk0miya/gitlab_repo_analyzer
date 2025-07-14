import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("users", (table) => {
		table.integer("id").primary().notNullable().comment("GitLab user ID");
		table.string("username", 255).notNullable().unique().comment("ユーザー名");
		table.string("name", 255).notNullable().comment("表示名");
		table.string("email", 255).nullable().comment("メールアドレス");
		table.string("avatar_url", 512).nullable().comment("アバターURL");
		table.string("web_url", 512).nullable().comment("プロフィールURL");
		table.string("state", 20).nullable().comment("active/blocked等");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.comment("GitLabでの作成日時");
		table
			.timestamp("updated_at", { useTz: true })
			.notNullable()
			.comment("GitLabでの更新日時");
		table.date("last_activity_on").nullable().comment("最終活動日");
		table.boolean("is_admin").defaultTo(false).comment("管理者フラグ");
		table
			.boolean("can_create_group")
			.defaultTo(false)
			.comment("グループ作成権限");
		table
			.boolean("can_create_project")
			.defaultTo(true)
			.comment("プロジェクト作成権限");

		// インデックス
		table.index(["username"], "idx_users_username");
		table.index(["email"], "idx_users_email");
		table.index(["state"], "idx_users_state");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("users");
}
