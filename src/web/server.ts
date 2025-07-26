import path from "node:path";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// 基本的なセキュリティヘッダー
app.use((_req, res, next) => {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	next();
});

// JSON middleware
app.use(express.json());

// 静的ファイル配信
app.use(express.static(path.join(process.cwd(), "public")));

// ヘルスチェックエンドポイント
app.get("/api/health", (_req, res) => {
	res.json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});

// ルートページ
app.get("/", (_req, res) => {
	res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// サーバー起動
app.listen(PORT, () => {
	console.log(`サーバーがポート ${PORT} で起動しました`);
});

export default app;
