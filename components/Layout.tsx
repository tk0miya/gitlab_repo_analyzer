import Head from "next/head";
import type React from "react";
import type { ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
	children: ReactNode;
	title?: string;
}

const Layout: React.FC<LayoutProps> = ({
	children,
	title = "GitLab Repository Analyzer",
}) => {
	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta charSet="utf-8" />
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<div className="app-layout">
				<Header />
				<main className="main-content">{children}</main>
				<Footer />
			</div>
		</>
	);
};

export default Layout;
