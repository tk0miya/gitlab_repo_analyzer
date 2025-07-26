import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

// API Client configuration
export interface ApiClientConfig {
	baseURL?: string;
	timeout?: number;
	headers?: Record<string, string>;
}

// Common API response wrapper
export interface ApiResponse<T = any> {
	data: T;
	status: number;
	message?: string;
	timestamp: string;
}

// Error response structure
export interface ApiError {
	error: string;
	status: number;
	message: string;
	timestamp: string;
	details?: any;
}

// Health check response
export interface HealthCheckResponse {
	status: "healthy" | "unhealthy";
	timestamp: string;
	version: string;
	uptime: number;
	services: {
		database: "connected" | "disconnected";
		gitlab_api: "available" | "unavailable";
	};
	memory: {
		used: number;
		total: number;
		percentage: number;
	};
	environment: string;
}

class ApiClient {
	private client: AxiosInstance;

	constructor(config: ApiClientConfig = {}) {
		this.client = axios.create({
			baseURL: config.baseURL || "/api",
			timeout: config.timeout || 10000,
			headers: {
				"Content-Type": "application/json",
				...config.headers,
			},
		});

		// Request interceptor
		this.client.interceptors.request.use(
			(config) => {
				// Add timestamp to requests
				if (config.params) {
					config.params._t = Date.now();
				} else {
					config.params = { _t: Date.now() };
				}

				// Log requests in development
				if (process.env.NODE_ENV === "development") {
					console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
						params: config.params,
						data: config.data,
					});
				}

				return config;
			},
			(error) => {
				return Promise.reject(error);
			},
		);

		// Response interceptor
		this.client.interceptors.response.use(
			(response: AxiosResponse) => {
				// Log responses in development
				if (process.env.NODE_ENV === "development") {
					console.log(`[API] Response ${response.status}:`, response.data);
				}

				return response;
			},
			(error) => {
				// Handle common errors
				const apiError: ApiError = {
					error: error.code || "UNKNOWN_ERROR",
					status: error.response?.status || 500,
					message:
						error.response?.data?.error ||
						error.message ||
						"An unknown error occurred",
					timestamp: new Date().toISOString(),
					details: error.response?.data,
				};

				if (process.env.NODE_ENV === "development") {
					console.error("[API] Error:", apiError);
				}

				return Promise.reject(apiError);
			},
		);
	}

	// Generic GET request
	async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.get<T>(url, config);
		return response.data;
	}

	// Generic POST request
	async post<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await this.client.post<T>(url, data, config);
		return response.data;
	}

	// Generic PUT request
	async put<T = any>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig,
	): Promise<T> {
		const response = await this.client.put<T>(url, data, config);
		return response.data;
	}

	// Generic DELETE request
	async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.delete<T>(url, config);
		return response.data;
	}

	// Health check endpoint
	async healthCheck(): Promise<HealthCheckResponse> {
		return this.get<HealthCheckResponse>("/health");
	}

	// Project-related endpoints
	async getProjects(): Promise<any[]> {
		return this.get("/projects");
	}

	async getProject(id: string | number): Promise<any> {
		return this.get(`/projects/${id}`);
	}

	async analyzeProject(id: string | number): Promise<any> {
		return this.post(`/projects/${id}/analyze`);
	}

	// Analysis-related endpoints
	async getAnalysis(projectId: string | number): Promise<any> {
		return this.get(`/analysis/${projectId}`);
	}

	async getAnalysisHistory(projectId: string | number): Promise<any[]> {
		return this.get(`/analysis/${projectId}/history`);
	}

	// Reports endpoints
	async getReports(): Promise<any[]> {
		return this.get("/reports");
	}

	async generateReport(projectId: string | number, type: string): Promise<any> {
		return this.post("/reports/generate", { projectId, type });
	}

	// Dashboard data endpoints
	async getDashboardData(): Promise<any> {
		return this.get("/dashboard");
	}

	async getMetrics(): Promise<any> {
		return this.get("/metrics");
	}
}

// Create default client instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Utility function to handle API errors in React components
export function handleApiError(error: ApiError): string {
	switch (error.status) {
		case 400:
			return "リクエストが無効です。入力内容を確認してください。";
		case 401:
			return "認証が必要です。ログインしてください。";
		case 403:
			return "このリソースにアクセスする権限がありません。";
		case 404:
			return "リソースが見つかりません。";
		case 429:
			return "リクエストが多すぎます。しばらく待ってから再試行してください。";
		case 500:
			return "サーバーエラーが発生しました。しばらく待ってから再試行してください。";
		case 503:
			return "サービスが一時的に利用できません。";
		default:
			return error.message || "予期しないエラーが発生しました。";
	}
}

// React hook for API calls with loading and error states
export function useApiCall<T = any>() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<T | null>(null);

	const execute = async (apiCall: () => Promise<T>) => {
		setLoading(true);
		setError(null);

		try {
			const result = await apiCall();
			setData(result);
			return result;
		} catch (error) {
			const errorMessage = handleApiError(error as ApiError);
			setError(errorMessage);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return { loading, error, data, execute };
}

// Import React hooks for the custom hook
import { useState } from "react";
