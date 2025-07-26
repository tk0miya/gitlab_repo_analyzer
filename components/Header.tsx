import Link from "next/link";
import { useRouter } from "next/router";
import type React from "react";
import { useState } from "react";

const Header: React.FC = () => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const router = useRouter();

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const isActiveRoute = (path: string) => {
		return router.pathname === path;
	};

	return (
		<header className="header">
			<div className="container">
				<div className="header-content">
					<div className="logo">
						<Link href="/" className="logo-link">
							<span className="logo-icon">🔍</span>
							<span className="logo-text">GitLab Analyzer</span>
						</Link>
					</div>

					<nav className={`nav ${isMobileMenuOpen ? "nav-mobile-open" : ""}`}>
						<Link
							href="/"
							className={`nav-link ${isActiveRoute("/") ? "nav-link-active" : ""}`}
						>
							ホーム
						</Link>
						<Link
							href="/dashboard"
							className={`nav-link ${isActiveRoute("/dashboard") ? "nav-link-active" : ""}`}
						>
							ダッシュボード
						</Link>
						<Link
							href="/projects"
							className={`nav-link ${isActiveRoute("/projects") ? "nav-link-active" : ""}`}
						>
							プロジェクト
						</Link>
						<Link
							href="/reports"
							className={`nav-link ${isActiveRoute("/reports") ? "nav-link-active" : ""}`}
						>
							レポート
						</Link>
						<Link
							href="/settings"
							className={`nav-link ${isActiveRoute("/settings") ? "nav-link-active" : ""}`}
						>
							設定
						</Link>
					</nav>

					<button
						className="mobile-menu-button"
						onClick={toggleMobileMenu}
						aria-label="メニューを開く"
					>
						<span className="hamburger-line"></span>
						<span className="hamburger-line"></span>
						<span className="hamburger-line"></span>
					</button>
				</div>
			</div>
		</header>
	);
};

export default Header;
