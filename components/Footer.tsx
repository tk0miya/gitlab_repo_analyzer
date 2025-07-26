import Link from "next/link";
import type React from "react";

const Footer: React.FC = () => {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="footer">
			<div className="container">
				<div className="footer-content">
					<div className="footer-section">
						<h3 className="footer-title">GitLab Repository Analyzer</h3>
						<p className="footer-description">
							GitLabリポジトリの包括的な分析とメトリクス可視化ツール
						</p>
					</div>

					<div className="footer-section">
						<h4 className="footer-subtitle">機能</h4>
						<ul className="footer-links">
							<li>
								<Link href="/dashboard">ダッシュボード</Link>
							</li>
							<li>
								<Link href="/projects">プロジェクト管理</Link>
							</li>
							<li>
								<Link href="/reports">分析レポート</Link>
							</li>
							<li>
								<Link href="/api/health">システム状態</Link>
							</li>
						</ul>
					</div>

					<div className="footer-section">
						<h4 className="footer-subtitle">リソース</h4>
						<ul className="footer-links">
							<li>
								<Link href="/docs">ドキュメント</Link>
							</li>
							<li>
								<Link href="/api">API リファレンス</Link>
							</li>
							<li>
								<Link href="/settings">設定</Link>
							</li>
							<li>
								<Link href="/support">サポート</Link>
							</li>
						</ul>
					</div>

					<div className="footer-section">
						<h4 className="footer-subtitle">開発者</h4>
						<ul className="footer-links">
							<li>
								<a
									href="https://github.com/tk0miya/gitlab_repo_analyzer"
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
							</li>
							<li>
								<Link href="/api/health">Health Check</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="footer-bottom">
					<div className="footer-bottom-content">
						<p className="copyright">
							© {currentYear} GitLab Repository Analyzer. All rights reserved.
						</p>
						<div className="footer-bottom-links">
							<Link href="/privacy">プライバシーポリシー</Link>
							<Link href="/terms">利用規約</Link>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
