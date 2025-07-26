// Temporary type declarations for Next.js v15 modules
// These should be replaced with official types when they become available

declare module "next/server" {
  export class NextRequest {
    constructor(url: string);
    nextUrl: {
      pathname: string;
    };
    url: string;
  }

  export class NextResponse {
    static next(): NextResponse;
    headers: {
      set(key: string, value: string): void;
      get(key: string): string | null;
    };
    status: number;
  }
}

declare module "next/head" {
  import { ReactNode } from "react";
  
  interface HeadProps {
    children?: ReactNode;
  }
  
  const Head: React.ComponentType<HeadProps>;
  export default Head;
}