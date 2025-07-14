import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	// PostgreSQL全文検索インデックスを追加
	await knex.raw(`
    CREATE INDEX idx_merge_requests_title_fts 
    ON merge_requests 
    USING gin(to_tsvector('english', title))
  `);

	await knex.raw(`
    CREATE INDEX idx_commits_message_fts 
    ON commits 
    USING gin(to_tsvector('english', message))
  `);

	await knex.raw(`
    CREATE INDEX idx_comments_body_fts 
    ON comments 
    USING gin(to_tsvector('english', body))
  `);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw("DROP INDEX IF EXISTS idx_merge_requests_title_fts");
	await knex.raw("DROP INDEX IF EXISTS idx_commits_message_fts");
	await knex.raw("DROP INDEX IF EXISTS idx_comments_body_fts");
}
