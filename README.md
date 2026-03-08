# AI Chat

模块化、可解耦的 AI 聊天框架。

## 快速开始

```bash
npm install
cp .env.example .env
# 编辑 .env 填入 API Key
npm run dev
```

## 文档

所有架构和模块文档均在 [`docs/`](./docs) 目录下：

| 文档 | 说明 |
|------|------|
| [architecture.md](./docs/architecture.md) | 全局架构总览、数据流向、AI 自升级指南 |
| [platforms.md](./docs/platforms.md) | 用户交互层 |
| [llm.md](./docs/llm.md) | LLM API 调用层 |
| [storage.md](./docs/storage.md) | 聊天记录存储层 |
| [tools.md](./docs/tools.md) | 工具注册层 |
| [prompt.md](./docs/prompt.md) | 提示词组装层 |
| [core.md](./docs/core.md) | 核心协调器 |
