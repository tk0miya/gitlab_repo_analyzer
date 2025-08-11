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

interface CommitGraphProps {
	data: { month: string; count: number }[];
}

export function CommitGraph({ data }: CommitGraphProps) {
	const chartData = useMemo(() => {
		// データが空の場合は空配列を返す
		if (!data || data.length === 0) {
			return [];
		}

		// 月のラベルを日本語形式に変換
		return data.map((item) => ({
			...item,
			monthLabel: `${item.month.replace("-", "年")}月`,
		}));
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
						bottom: 20,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="monthLabel"
						tick={{ fontSize: 12 }}
						angle={-45}
						textAnchor="end"
						height={80}
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
