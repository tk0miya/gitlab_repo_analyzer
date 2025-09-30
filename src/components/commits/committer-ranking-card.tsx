"use client";

import { Trophy, User } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	CommitterRanking,
	RankingPeriod,
} from "@/database/repositories/commits";

interface CommitterRankingCardProps {
	rankings: Record<RankingPeriod, CommitterRanking[]>;
	onPeriodChange?: (period: RankingPeriod) => void;
}

const periodLabels: Record<RankingPeriod, string> = {
	all: "全期間",
	year: "直近1年",
	halfYear: "直近半年",
	month: "直近1ヶ月",
};

const getRankIcon = (rank: number) => {
	switch (rank) {
		case 1:
			return "🥇";
		case 2:
			return "🥈";
		case 3:
			return "🥉";
		default:
			return null;
	}
};

export function CommitterRankingCard({
	rankings,
	onPeriodChange,
}: CommitterRankingCardProps) {
	const [selectedPeriod, setSelectedPeriod] = useState<RankingPeriod>("all");

	const handlePeriodChange = (period: RankingPeriod) => {
		setSelectedPeriod(period);
		onPeriodChange?.(period);
	};

	const currentRankings = rankings[selectedPeriod] || [];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Trophy className="h-5 w-5" />
						コミッターランキング
					</CardTitle>
				</div>
				<div className="flex gap-2 mt-4">
					{(Object.keys(periodLabels) as RankingPeriod[]).map((period) => (
						<button
							key={period}
							type="button"
							onClick={() => handlePeriodChange(period)}
							className={`px-3 py-1 text-sm rounded-md transition-colors ${
								selectedPeriod === period
									? "bg-primary text-primary-foreground"
									: "bg-muted hover:bg-muted/80"
							}`}
						>
							{periodLabels[period]}
						</button>
					))}
				</div>
			</CardHeader>
			<CardContent>
				{currentRankings.length === 0 ? (
					<p className="text-center text-muted-foreground py-8">
						この期間のコミットデータがありません
					</p>
				) : (
					<div className="space-y-3">
						{currentRankings.map((ranking) => (
							<div
								key={`${ranking.authorEmail}-${ranking.rank}`}
								className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="flex items-center justify-center w-8 h-8">
										{getRankIcon(ranking.rank) || (
											<span className="text-sm font-semibold text-muted-foreground">
												{ranking.rank}
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										<User className="h-4 w-4 text-muted-foreground" />
										<div>
											<div className="font-medium">{ranking.authorName}</div>
											<div className="text-xs text-muted-foreground">
												{ranking.authorEmail}
											</div>
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="font-semibold">{ranking.commitCount}</div>
									<div className="text-xs text-muted-foreground">コミット</div>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
