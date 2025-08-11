import { Globe, Lock, Users } from "lucide-react";
import { Badge } from "./badge";

interface ProjectVisibilityBadgeProps {
	visibility: string;
}

const visibilityConfig = {
	public: { label: "パブリック", variant: "default" as const, icon: Globe },
	internal: { label: "内部", variant: "secondary" as const, icon: Users },
	private: {
		label: "プライベート",
		variant: "destructive" as const,
		icon: Lock,
	},
};

export function ProjectVisibilityBadge({
	visibility,
}: ProjectVisibilityBadgeProps) {
	const visibilityInfo = visibilityConfig[
		visibility as keyof typeof visibilityConfig
	] || {
		label: visibility,
		variant: "outline" as const,
		icon: Lock,
	};

	const IconComponent = visibilityInfo.icon;

	return (
		<Badge
			variant={visibilityInfo.variant}
			className="inline-flex items-center gap-1 shrink-0"
		>
			<IconComponent className="h-3 w-3" />
			{visibilityInfo.label}
		</Badge>
	);
}
