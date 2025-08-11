"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type {
	AnalysisPeriod,
	CommitStats,
} from "@/database/repositories/commits";
import { CommitGraph } from "./commit-graph";

interface CommitAnalysisCardProps {
	period: AnalysisPeriod;
	commitStats: CommitStats[];
	onPeriodChange: (period: AnalysisPeriod) => void;
}

/**
 * コミット分析カード
 * 月別/週別のコミット数グラフを表示し、期間選択機能を提供
 */
export function CommitAnalysisCard({
	period,
	commitStats,
	onPeriodChange,
}: CommitAnalysisCardProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>コミット数</CardTitle>
					<PeriodSelector value={period} onValueChange={onPeriodChange} />
				</div>
			</CardHeader>
			<CardContent>
				<CommitGraph data={commitStats} period={period} />
			</CardContent>
		</Card>
	);
}

/**
 * 期間選択コンポーネント
 * 月別/週別の表示期間を選択するラジオボタン
 */
interface PeriodSelectorProps {
	value: AnalysisPeriod;
	onValueChange: (value: AnalysisPeriod) => void;
}

function PeriodSelector({ value, onValueChange }: PeriodSelectorProps) {
	return (
		<div className="flex items-center space-x-2">
			<Label htmlFor="period-selector" className="text-sm font-medium">
				表示期間:
			</Label>
			<RadioGroup
				value={value}
				onValueChange={(value: AnalysisPeriod) => onValueChange(value)}
				id="period-selector"
			>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="monthly" id="monthly" />
					<Label htmlFor="monthly" className="text-sm">
						月別
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="weekly" id="weekly" />
					<Label htmlFor="weekly" className="text-sm">
						週別 (2年間分)
					</Label>
				</div>
			</RadioGroup>
		</div>
	);
}
