FROM node:22-slim

# diff-highlightをインストール（準備）
RUN echo "path-include /usr/share/doc/git/*" > /etc/dpkg/dpkg.cfg.d/git

# Debian標準パッケージをインストール
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
        jq \
        less \
        locales \
        make

# diff-highlightをインストール
RUN cd /usr/share/doc/git/contrib/diff-highlight && make && install -m 755 diff-highlight /usr/bin

# GitHub CLIをインストール
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y --no-install-recommends gh

# UTF-8対応
RUN sed -i -E 's/# (ja_JP.UTF-8)/\1/' /etc/locale.gen
RUN locale-gen
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=ja_JP.UTF-8

# 作業ディレクトリを設定
WORKDIR /app

# Git credential helper設定（環境変数からGitHubトークンを使用）
RUN git config --global credential.helper '!f() { echo "username=token"; echo "password=$GITHUB_TOKEN"; }; f'

# アプリケーションポートを公開
EXPOSE 8080

# デフォルトコマンド（開発用）
CMD ["bash"]
