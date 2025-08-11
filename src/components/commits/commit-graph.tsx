"use client";

import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { CommitStats } from "@/database/repositories/commits";

interface CommitGraphProps {
	data: CommitStats[];
	period: CommitStats["type"];
}

/**
 * 期間データを表示用ラベルに変換
 * @param item コミット統計データ
 * @returns 表示用ラベル付きデータ
 */
function createPeriodLabel(
	item: CommitStats,
): CommitStats & { periodLabel: string } {
	if (item.type === "monthly") {
		return {
			...item,
			periodLabel: `${item.period.replace("-", "年")}月`,
		};
	} else if (item.type === "weekly") {
		// 週番号をより読みやすい形式に変換（例: 2024-01 → 2024年第1週）
		const [year, week] = item.period.split("-");
		return {
			...item,
			periodLabel: `${year}年第${week}週`,
		};
	}
	return { ...item, periodLabel: item.period };
}

export function CommitGraph({ data }: CommitGraphProps) {
	const chartData = useMemo(() => {
		// データが空の場合は空配列を返す
		if (!data || data.length === 0) {
			return [];
		}

		// 期間タイプに応じてラベルを変換
		return data.map(createPeriodLabel);
	}, [data]);

	// データが空の場合の表示
	if (chartData.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground">コミットデータがありません</p>
			</div>
		);
	}

	return (
		<div>
			<ResponsiveContainer width="100%" height={400}>
				<BarChart
					data={chartData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 100,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="periodLabel"
						tick={{ fontSize: 12 }}
						angle={-45}
						textAnchor="end"
						height={100}
					/>
					<YAxis
						tick={{ fontSize: 12 }}
						label={{ value: "コミット数", angle: -90, position: "insideLeft" }}
					/>
					<Tooltip
						formatter={(value: number) => [value, "コミット数"]}
						labelFormatter={(label: string) => `期間: ${label}`}
					/>
					<Bar
						dataKey="count"
						fill="#3b82f6"
						radius={[4, 4, 0, 0]}
						name="コミット数"
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
