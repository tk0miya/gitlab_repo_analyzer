import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("project_members", (table) => {
		table.increments("id").primary().comment("連番ID");
		table.integer("project_id").notNullable().comment("プロジェクトID");
		table.integer("user_id").notNullable().comment("ユーザーID");
		table
			.integer("access_level")
			.notNullable()
			.comment("10=Guest, 20=Reporter, 30=Developer, 40=Maintainer, 50=Owner");
		table.date("expires_at").nullable().comment("アクセス期限");
		table
			.timestamp("created_at", { useTz: true })
			.notNullable()
			.defaultTo(knex.fn.now())
			.comment("作成日時");
		table
			.timestamp("updated_at", { useTz: true })
			.notNullable()
			.defaultTo(knex.fn.now())
			.comment("更新日時");

		// 外部キー制約
		table
			.foreign("project_id")
			.references("id")
			.inTable("projects")
			.onDelete("CASCADE");
		table
			.foreign("user_id")
			.references("id")
			.inTable("users")
			.onDelete("CASCADE");

		// 制約
		table.unique(["project_id", "user_id"], "unique_project_member");

		// インデックス
		table.index(["project_id"], "idx_project_members_project");
		table.index(["user_id"], "idx_project_members_user");
		table.index(["access_level"], "idx_project_members_access_level");
		table.index(["created_at"], "idx_project_members_created_at");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("project_members");
}
