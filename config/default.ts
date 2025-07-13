/**
 * デフォルト設定
 */

export interface Config {
  gitlab: {
    baseUrl: string;
    token?: string;
  };
  analysis: {
    maxFileSize: number;
    excludePatterns: string[];
  };
}

export const defaultConfig: Config = {
  gitlab: {
    baseUrl: 'https://gitlab.com',
    token: process.env.GITLAB_TOKEN,
  },
  analysis: {
    maxFileSize: 1024 * 1024, // 1MB
    excludePatterns: ['node_modules/**', '.git/**', '*.log', '*.tmp'],
  },
};
