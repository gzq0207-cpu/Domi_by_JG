<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
event_id: "evt_v1_49dc91d61253fc48fd4e"
title: "JetBrains 发布开源 Mellum2.1 Thinking 代码智能体模型（公司口径）"
domains: ["模型层"]
subdomains: ["开源与开放权重模型","模型研究与训练方法"]
types: ["模型发布","开源"]
companies: "JetBrains"
published_at: "2026-10-08T00:00:00.000Z"
importance: 7
confidence: 8
evidence_status: "公司／机构口径"
worth_following: true
source_url: "https://blog.jetbrains.com/ai/2026/10/mellum2-1-gets-to-work-a-fast-open-model-for-coding-agents/"
source: "JetBrains Blog；JetBrains Hugging Face 模型卡（2026-10-08，原文核验）"
---

# JetBrains 发布开源 Mellum2.1 Thinking 代码智能体模型（公司口径）

## 核心事实

JetBrains 于10月8日发布 Mellum2.1 Thinking，定位为可本地或自有基础设施部署的开源代码智能体/子智能体模型。公司称该模型为12B总参数、2.5B激活参数的MoE，Apache-2.0许可、131,072 token上下文；主要增量是通过真实代码仓环境中的强化学习进行后训练，并已在 Hugging Face 发布权重。JetBrains 公布的性能、吞吐与“数百万次沙箱运行”均为公司口径，尚无本次独立复现实测。

## 投资含义

该发布增加了可私有化部署的开放代码智能体供给，可能提升企业对数据控制、推理成本和多模型编排的选择空间。应比较同一硬件和任务定义下的端到端成功率、工具调用可靠性、长上下文成本、许可合规与真实开发者采用；官方基准和吞吐主张不能直接外推至生产效率或商业化。

## 建议动作

跟踪权重下载、第三方基准、推理框架适配和企业自托管采用。
<!-- domi:managed:end -->
