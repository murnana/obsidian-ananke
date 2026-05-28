# Node.jsのDockerイメージを取得する：
FROM node:26-alpine

# npmの更新
RUN npm install -g npm@11.11.0

# 依存ツールのインストール（キャッシュなし）
RUN apk add --no-cache \
    bash \
    git \
    github-cli \
    openssh-client


# SHELL環境の設定
ENV SHELL=/bin/sh

# Claude Code: 自動メモリー作成の抑制
ENV CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
