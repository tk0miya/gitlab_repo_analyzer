/**
 * アプリケーションのデフォルト設定
 */

export interface AppConfig {
    /** GitLab API の設定 */
    gitlab: {
        /** GitLab インスタンスのベースURL */
        baseUrl: string;
        /** APIバージョン */
        apiVersion: string;
        /** リクエストタイムアウト（ミリ秒） */
        timeout: number;
    };

    /** 分析設定 */
    analysis: {
        /** 最大分析対象ファイル数 */
        maxFiles: number;
        /** 除外するファイル拡張子 */
        excludedExtensions: string[];
        /** 除外するディレクトリ */
        excludedDirectories: string[];
    };

    /** ロギング設定 */
    logging: {
        /** ログレベル */
        level: 'debug' | 'info' | 'warn' | 'error';
        /** ログ出力先 */
        output: 'console' | 'file';
    };
}

/**
 * デフォルト設定
 */
export const defaultConfig: AppConfig = {
    gitlab: {
        baseUrl: process.env.GITLAB_BASE_URL || 'https://gitlab.com',
        apiVersion: 'v4',
        timeout: 30000,
    },

    analysis: {
        maxFiles: 1000,
        excludedExtensions: [
            '.log',
            '.tmp',
            '.cache',
            '.lock',
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.svg',
            '.pdf',
            '.zip',
            '.tar',
            '.gz',
        ],
        excludedDirectories: [
            'node_modules',
            '.git',
            '.github',
            'dist',
            'build',
            'coverage',
            '.vscode',
            '.idea',
        ],
    },

    logging: {
        level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
        output: 'console',
    },
};
