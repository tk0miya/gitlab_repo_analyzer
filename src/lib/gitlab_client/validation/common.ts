import { z } from "zod";

/**
 * IDバリデーションスキーマ
 */
export const IdSchema = z
	.number()
	.int()
	.positive("IDは正の整数である必要があります");

/**
 * 文字列形式のIDバリデーションスキーマ（URL パラメータ用）
 */
export const IdStringSchema = z
	.string()
	.regex(/^\d+$/, "IDは数値である必要があります")
	.transform((val) => parseInt(val, 10))
	.refine((val) => val > 0, "IDは正の整数である必要があります");

/**
 * ID型定義
 */
export type Id = z.infer<typeof IdSchema>;
