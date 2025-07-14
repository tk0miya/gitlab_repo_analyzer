/**
 * 設定管理モジュール
 * ミニマル設定システム - GitLab TOKEN、データベース設定のみ設定可能
 */

export { ConfigLoader, loadConfig } from "./loader.js";
export {
	type Config,
	ConfigSchema,
	type DatabaseConfig,
	DatabaseConfigSchema,
	type GitLabConfig,
	GitLabConfigSchema,
} from "./schema.js";
