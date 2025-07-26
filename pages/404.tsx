import Head from "next/head";
import Link from "next/link";
import type React from "react";
import Layout from "../components/Layout";

const NotFoundPage: React.FC = () => {
	return (
		<Layout>
			<Head>
				<title>404 - ページが見つかりません</title>
				<meta name="description" content="お探しのページは存在しません" />
			</Head>

			<div className="error-page">
				<div className="container">
					<div className="error-content">
						<div className="error-code">404</div>
						<h1 className="error-title">ページが見つかりません</h1>
						<p className="error-description">
							お探しのページは削除されたか、URLが変更された可能性があります。
						</p>
						<div className="error-actions">
							<Link href="/" className="btn btn-primary">
								ホームに戻る
							</Link>
							<Link href="/projects" className="btn btn-secondary">
								プロジェクト一覧
							</Link>
						</div>
					</div>
				</div>
			</div>

			<style jsx>{`
        .error-page {
          padding: 4rem 0;
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .error-content {
          text-align: center;
          max-width: 500px;
        }
        
        .error-code {
          font-size: 8rem;
          font-weight: bold;
          color: #e5e7eb;
          line-height: 1;
          margin-bottom: 1rem;
        }
        
        .error-title {
          font-size: 2rem;
          color: #1f2937;
          margin-bottom: 1rem;
        }
        
        .error-description {
          color: #6b7280;
          font-size: 1.125rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .error-code {
            font-size: 6rem;
          }
          
          .error-title {
            font-size: 1.5rem;
          }
          
          .error-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
		</Layout>
	);
};

export default NotFoundPage;
