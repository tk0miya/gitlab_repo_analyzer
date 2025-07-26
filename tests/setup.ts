import { vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Note: Jest-DOM matchers are now available globally for vitest

// Mock Next.js specific functions
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock fetch for API calls
global.fetch = vi.fn();
