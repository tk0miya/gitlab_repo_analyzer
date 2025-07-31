import Link from "next/link";

interface NavItem {
	href: string;
	label: string;
}

const navigationItems: NavItem[] = [
	{ href: "/", label: "ホーム" },
	{ href: "/projects", label: "プロジェクト" },
	{ href: "/analytics", label: "分析" },
];

export function GlobalNav() {
	return (
		<nav className="bg-white shadow-sm border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">
					<div className="flex">
						<div className="flex-shrink-0 flex items-center">
							<Link
								href="/"
								className="text-xl font-bold text-gray-900 hover:text-gray-700"
							>
								GitLab Analyzer
							</Link>
						</div>
						<div className="hidden sm:ml-6 sm:flex sm:space-x-8">
							{navigationItems.map((item) => (
								<Link
									key={item.href}
									href={item.href}
									className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
								>
									{item.label}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</nav>
	);
}
