// Temporary type declarations for Next.js modules
declare module "next/server" {
	export declare class NextRequest {
		constructor(input: string | URL, init?: RequestInit);
		url: string;
		method: string;
		headers: Headers;
		nextUrl: URL;
		geo?: {
			country?: string;
			region?: string;
			city?: string;
			latitude?: string;
			longitude?: string;
		};
	}

	export declare class NextResponse {
		constructor(body?: BodyInit | null, init?: ResponseInit);
		headers: Headers;
		status?: number;
		statusText?: string;
		static next(): NextResponse;
		static redirect(url: string | URL, status?: number): NextResponse;
		static rewrite(destination: string | URL): NextResponse;
		static json(body?: any, init?: ResponseInit): NextResponse;
	}
}

declare module "next/head" {
	import { ReactElement } from "react";

	interface HeadProps {
		children?: React.ReactNode;
	}

	export default function Head(props: HeadProps): ReactElement;
}

declare module "next" {
	export interface NextApiRequest {
		query: { [key: string]: string | string[] };
		method?: string;
		cookies: { [key: string]: string };
		body: any;
		headers: { [key: string]: string | string[] | undefined };
	}

	export interface NextApiResponse<T = any> {
		status(statusCode: number): NextApiResponse<T>;
		json(body: T): void;
		send(body: T): void;
		end(): void;
		setHeader(name: string, value: string | string[]): NextApiResponse<T>;
		getHeader(name: string): string | string[] | undefined;
		removeHeader(name: string): NextApiResponse<T>;
		_getData(): any;
		_getHeaders(): any;
	}

	export type NextApiHandler<T = any> = (
		req: NextApiRequest,
		res: NextApiResponse<T>
	) => void | Promise<void>;
}