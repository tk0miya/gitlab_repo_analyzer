import Head from "next/head";
import Link from "next/link";
import type React from "react";
import Layout from "../components/Layout";

const ServerErrorPage: React.FC = () => {
	return (
		<Layout>
			<Head>
				<title>500 - サーバーエラー</title>
				<meta name="description" content="サーバーで問題が発生しました" />
			</Head>

			<div className="error-page">
				<div className="container">
					<div className="error-content">
						<div className="error-code">500</div>
						<h1 className="error-title">サーバーエラー</h1>
						<p className="error-description">
							申し訳ございません。サーバーで問題が発生しました。
							しばらくしてから再度お試しください。
						</p>
						<div className="error-actions">
							<Link href="/" className="btn btn-primary">
								ホームに戻る
							</Link>
							<Link href="/api/health" className="btn btn-secondary">
								システム状態を確認
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
          color: #fca5a5;
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

export default ServerErrorPage;
