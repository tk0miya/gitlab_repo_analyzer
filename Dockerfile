FROM node:22-slim

# Debian標準パッケージをインストール
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        jq

# GitHub CLIをインストール
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh

# 作業ディレクトリを設定
WORKDIR /app

# Git credential helper設定（環境変数からGitHubトークンを使用）
RUN git config --global credential.helper '!f() { echo "username=token"; echo "password=$GITHUB_TOKEN"; }; f'

# アプリケーションポートを公開
EXPOSE 8080

# デフォルトコマンド（開発用）
CMD ["bash"]
