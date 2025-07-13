import { z } from "zod";

/**
 * GitLab設定スキーマ - TOKENのみ設定可能
 */
export const GitLabConfigSchema = z.object({
	token: z.string().min(1, "GitLab TOKEN は必須です"),
	// 固定値（設定不可）
	url: z.literal("https://gitlab.com"),
	apiVersion: z.literal("v4"),
	timeout: z.literal(30000),
});

/**
 * データベース設定スキーマ
 */
export const DatabaseConfigSchema = z.object({
	host: z.string().default("localhost"),
	port: z.number().int().positive().default(5432),
	database: z.string().min(1, "データベース名は必須です"),
	username: z.string().min(1, "ユーザー名は必須です"),
	password: z.string().optional(),
	ssl: z.boolean().default(false),
});

/**
 * 分析設定スキーマ - すべて固定値
 */
export const AnalysisConfigSchema = z.object({
	modules: z.tuple([
		z.literal("structure"),
		z.literal("quality"),
		z.literal("dependencies"),
		z.literal("security"),
		z.literal("commits"),
	]),
	outputFormat: z.literal("json"),
	cacheEnabled: z.literal(true),
	cacheTTL: z.literal(3600),
});

/**
 * 全体設定スキーマ
 */
export const ConfigSchema = z.object({
	gitlab: GitLabConfigSchema,
	database: DatabaseConfigSchema,
	analysis: AnalysisConfigSchema,
});

export type Config = z.infer<typeof ConfigSchema>;
export type GitLabConfig = z.infer<typeof GitLabConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;
