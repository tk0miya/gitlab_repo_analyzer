import { describe, expect, it, vi } from 'vitest';
import { main } from './index';

describe('main', () => {
  it('ログメッセージを出力する', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    main();

    expect(consoleSpy).toHaveBeenCalledWith('GitLabリポジトリ分析ツールを開始します');
    consoleSpy.mockRestore();
  });
});
