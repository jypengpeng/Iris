# Iris

一个面向多平台的智能代理程序。它支持 Console、Web、Discord、Telegram 等平台，支持工具调用、会话存储、图片输入、OCR 回退、MCP 和记忆能力。

## 特性

- 多平台：Console / Web / Discord / Telegram
- 多模型提供商：Gemini / OpenAI 兼容 / OpenAI Responses / Claude
- 模型池：通过 `llm.models.<modelName>` 管理多个模型，运行时可切换
- 工具系统：内置文件、命令、计划、搜索、记忆、子代理等工具
- 会话存储：JSON 文件或 SQLite
- 图片输入：支持 vision 模型直连，也支持 OCR 回退
- MCP：可连接外部 MCP 服务器扩展工具能力
- 模式系统：支持自定义模式和系统提示词覆盖

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 准备配置

#### Windows PowerShell

```powershell
Copy-Item -Recurse data/configs.example data/configs
```

#### macOS / Linux

```bash
cp -r data/configs.example data/configs
```

然后至少检查这些文件：

#### `data/configs/llm.yaml`

填入你的模型池配置，例如：

```yaml
defaultModel: gemini_flash

models:
  gemini_flash:
    provider: gemini
    apiKey: your-api-key-here
    model: gemini-2.0-flash
    baseUrl: https://generativelanguage.googleapis.com/v1beta
    supportsVision: true
```

说明：

- `defaultModel` 填写模型名称，也就是 `models` 下的键
- `model` 字段填写提供商真实模型 id
- `/model gemini_flash` 可以在运行时切换当前活动模型

`supportsVision` 说明：

- 可选，推荐显式填写
- `true`：当前模型支持图片输入，Web 上传的图片会直接发给模型
- `false`：当前模型不支持图片输入，此时如配置了 `ocr.yaml`，Iris 会先做 OCR，再把提取结果发给当前模型
- 不填写时，Iris 会按模型名做启发式判断，但对于自定义模型名或代理网关，仍建议手动声明

`baseUrl` 规则：

- Gemini：以 `/v1beta` 结尾
- OpenAI 兼容、OpenAI Responses、Claude：以 `/v1` 结尾
- 程序会在这个地址后继续补全具体接口路径

例如 OpenAI Responses：

```yaml
defaultModel: gpt4o

models:
  gpt4o:
    provider: openai-responses
    apiKey: your-api-key-here
    model: gpt-4o
    baseUrl: https://api.openai.com/v1
    supportsVision: true
```

#### `data/configs/ocr.yaml`（可选）

当你的当前模型不支持图片输入，但你又希望 Web 端可以上传图片时，配置一个 OCR 模型：

```yaml
provider: openai-compatible
apiKey: your-api-key-here
baseUrl: https://api.openai.com/v1
model: gpt-4o-mini
```

行为说明：

- 当前模型支持 vision：直接发图片，不走 OCR
- 当前模型不支持 vision + 已配置 OCR：先 OCR，再把图片内容文本发给当前模型
- 当前模型不支持 vision + 未配置 OCR：图片仍会保存在会话历史中，但当前模型只能收到“当前无法查看图片”的占位提示

#### `data/configs/platform.yaml`

如果你要启用 Web 端，请改成：

```yaml
type: web
web:
  port: 8192
  host: 127.0.0.1
```

如果你只在本机终端使用，可以保持：

```yaml
type: console
```

### 3. 启动

```bash
npm run dev
```

## 常用命令

### Console

- `/new`：新建会话
- `/load`：加载历史会话
- `/model`：查看可用模型
- `/model <modelName>`：切换当前活动模型
- `/settings`：打开设置中心
- `/mcp`：直接打开 MCP 设置页
- `/exit`：退出程序

## 配置说明

详细配置见：

- [docs/config.md](docs/config.md)
- [docs/llm.md](docs/llm.md)
- [docs/core.md](docs/core.md)
- [docs/tools.md](docs/tools.md)

## 开发

### 运行

```bash
npm run dev
```

### 构建

```bash
npm run build
```
