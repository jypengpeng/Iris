下面我基于 OpenAI 官方 Responses API 文档，系统地说明：

1️⃣ 请求体结构（Request Body）
2️⃣ 非流式响应结构（Response JSON）
3️⃣ 流式响应（Streaming SSE）
4️⃣ 无状态调用模式（stateless）
5️⃣ Reasoning / 思考摘要 / 思考签名与回传机制
6️⃣ Items（message / reasoning / tool call）统一输出结构

我会尽量用 官方字段名 + JSON示例 + 解释 的方式讲清楚。


---

一、Responses API 的总体设计

OpenAI 在 2025 推出 /v1/responses 作为 统一生成接口，替代 chat.completions。

核心特点：

输入输出统一为 Items（项）

支持 多模态

支持 reasoning模型

支持 工具调用

支持 结构化输出

支持 stream / non-stream

支持 无状态与有状态对话


与 ChatCompletions 最大区别：

API	输入结构

ChatCompletions	messages[]
Responses	items / input


Responses API 的输出是 Item列表。 


---

二、Responses API 请求体（Request Body）

1 最简单请求

POST /v1/responses

{
  "model": "gpt-5",
  "input": "Write a haiku about AI"
}

等价于：

{
  "model": "gpt-5",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Write a haiku about AI"
        }
      ]
    }
  ]
}


---

三、完整请求体结构

一个完整请求一般包含：

{
  "model": "gpt-5",
  "input": [...],
  "instructions": "...",
  "tools": [...],
  "tool_choice": "auto",
  "text": {...},
  "reasoning": {...},
  "max_output_tokens": 1024,
  "temperature": 0.7,
  "top_p": 1,
  "store": false,
  "stream": false,
  "metadata": {...}
}

下面逐个解释关键字段。


---

四、核心字段解释

1 model

使用的模型：

"model": "gpt-5"

或 reasoning 模型：

o3
o4-mini


---

2 input

输入上下文。

可以是：

字符串

"input": "Hello"

Item数组

"input": [
  {
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello"
      }
    ]
  }
]

支持的 content 类型：

type	说明

input_text	文本
input_image	图片
input_audio	音频


示例：

{
 "type": "input_image",
 "image_url": "https://..."
}


---

3 instructions

系统提示：

"instructions": "You are a helpful assistant"

相当于旧 API 的 system message。


---

4 tools

工具定义：

"tools": [
  {
    "type": "function",
    "name": "get_weather",
    "description": "Get weather",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string" }
      },
      "required": ["city"]
    }
  }
]


---

5 tool_choice

工具策略：

auto
none
required


---

6 text.format（结构化输出）

替代旧的 response_format

示例：

"text": {
  "format": {
    "type": "json_schema",
    "name": "Answer",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "answer": {"type":"string"}
      },
      "required": ["answer"]
    }
  }
}


---

7 reasoning

控制推理模型行为：

"reasoning": {
  "effort": "medium"
}

effort 可选：

low
medium
high

推理 token 会单独统计。 


---

8 store（无状态关键）

默认：

store: true

如果你想 无状态调用：

"store": false

这样：

OpenAI 不保存响应

不可通过 response_id 继续对话

适合 ZDR（Zero Data Retention）


官方推荐 stateless 方式。 


---

五、非流式响应体（Non-stream Response）

标准响应结构：

{
 "id": "resp_xxx",
 "object": "response",
 "created_at": 1756315696,
 "model": "gpt-5",
 "status": "completed",
 "output": [...],
 "usage": {...}
}


---

1 output（最核心）

输出是 Item数组：

"output": [
  {
    "id": "rs_xxx",
    "type": "reasoning",
    "summary": []
  },
  {
    "id": "msg_xxx",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "output_text",
        "text": "Hello"
      }
    ]
  }
]

这里有两个 item：

type	含义

reasoning	思考
message	最终回答





---

2 usage

token统计

"usage": {
 "input_tokens": 36,
 "output_tokens": 87,
 "total_tokens": 123,
 "output_tokens_details": {
   "reasoning_tokens": 40
 }
}


---

六、Item 类型（非常关键）

Responses API 的核心概念：

所有输出都是 item

常见类型：

type	说明

message	assistant/user消息
reasoning	思考
function_call	函数调用
function_call_output	函数返回
web_search_call	搜索
file_search_call	RAG



---

七、message item 结构

{
 "type": "message",
 "role": "assistant",
 "status": "completed",
 "content": [
   {
     "type": "output_text",
     "text": "Hello"
   }
 ]
}

content 支持：

type	说明

output_text	文本
output_image	图片
output_audio	音频



---

八、reasoning item（思考项）

示例：

{
 "type": "reasoning",
 "summary": [
   {
     "type": "summary_text",
     "text": "The model reasons about..."
   }
 ]
}

注意：

不会返回完整 Chain-of-Thought

只返回：

reasoning summary


---

九、Reasoning signature / encrypted reasoning

对于 无状态推理：

OpenAI 支持返回 加密推理token。

流程：

1️⃣ 请求

store: false

并声明：

contains: ["reasoning.encrypted_content"]

2️⃣ 返回

{
 "type": "reasoning",
 "encrypted_content": "base64..."
}

3️⃣ 下次请求

把 encrypted_content 回传：

input:
   reasoning.encrypted_content

这样模型可以继续推理链。

特点：

OpenAI服务器不保存状态

推理token只存在客户端

ZDR安全模式





---

十、流式响应（Streaming）

设置：

"stream": true

返回：

Content-Type: text/event-stream


---

SSE 事件示例

event: response.created
data: {...}

event: response.output_text.delta
data: {"delta":"Hello"}

event: response.output_text.delta
data: {"delta":" world"}

event: response.completed
data: {...}

最终拼接：

Hello world


---

常见流事件

event	说明

response.created	创建
response.output_text.delta	文本增量
response.output_item.added	新item
response.completed	完成
response.error	错误



---

十一、无状态对话（Stateless Pattern）

如果你完全 stateless：

客户端维护上下文：

{
 "input": [
   { "role": "system", ... },
   { "role": "user", ... },
   { "role": "assistant", ... },
   { "role": "user", ... }
 ],
 "store": false
}

每次请求：

客户端发送完整 history

服务器不保存。 


---

十二、两种对话模式

1 Stateless

客户端管理：

history -> request

优点：

可控

ZDR

可扩展



---

2 Stateful

利用：

previous_response_id

示例：

{
 "model": "gpt-5",
 "input": "And its population?",
 "previous_response_id": "resp_xxx"
}

OpenAI会自动带上上下文。


---

十三、Responses API 的完整响应结构

完整结构：

{
 "id": "resp_xxx",
 "object": "response",
 "created_at": 123456,
 "status": "completed",
 "model": "gpt-5",

 "output": [...],

 "parallel_tool_calls": true,

 "usage": {...},

 "temperature": 1.0,
 "top_p": 1.0,

 "reasoning": {
   "effort": null,
   "summary": null
 },

 "metadata": {}
}


---

十四、Responses API 架构总结

核心思想：

request
   ↓
model
   ↓
items (reasoning / tool / message)

输出结构：

Response
 ├─ metadata
 ├─ usage
 └─ output[]
      ├─ reasoning
      ├─ tool_call
      └─ message


---

十五、和 ChatCompletions 的根本区别

ChatCompletions	Responses

messages	items
choices	output
message.content	content[]
response_format	text.format
functions	tools
tool_calls	item(type=function_call)
chain-of-thought hidden	reasoning summary



---

十六、一个完整的 stateless 请求示例

POST /v1/responses

{
 "model": "gpt-5",
 "store": false,
 "input": [
   {
     "role": "system",
     "content": [
       {
         "type": "input_text",
         "text": "You are helpful"
       }
     ]
   },
   {
     "role": "user",
     "content": [
       {
         "type": "input_text",
         "text": "Explain transformers"
       }
     ]
   }
 ]
}


---

如果你愿意，我可以继续讲一个 90%开发者不知道但非常重要的部分：

Responses API 完整 streaming event schema

reasoning token回传机制

tool call item 的精确 JSON

OpenAI Agent loop 内部执行流程


这些是做 Agent / SDK / Proxy / OpenAI兼容服务 必须理解的底层结构。