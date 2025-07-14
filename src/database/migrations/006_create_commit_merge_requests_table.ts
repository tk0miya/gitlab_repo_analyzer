import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("commit_merge_requests", (table) => {
		table.string("commit_sha", 40).notNullable().comment("コミットSHA");
		table
			.integer("merge_request_id")
			.notNullable()
			.comment("マージリクエストID");

		// 外部キー制約
		table
			.foreign("commit_sha")
			.references("sha")
			.inTable("commits")
			.onDelete("CASCADE");
		table
			.foreign("merge_request_id")
			.references("id")
			.inTable("merge_requests")
			.onDelete("CASCADE");

		// 複合主キー
		table.primary(["commit_sha", "merge_request_id"]);

		// インデックス
		table.index(["merge_request_id"], "idx_commit_mr_merge_request");
		table.index(["commit_sha"], "idx_commit_mr_commit");
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("commit_merge_requests");
}
