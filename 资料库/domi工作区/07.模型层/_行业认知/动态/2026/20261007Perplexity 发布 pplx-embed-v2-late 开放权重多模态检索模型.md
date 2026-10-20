<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
event_id: "evt_v1_fb91dd5a8ddc6efc8aca"
title: "Perplexity 发布 pplx-embed-v2-late 开放权重多模态检索模型"
domains: ["模型层"]
subdomains: ["多模态与生成模型","开源与开放权重模型"]
types: ["模型发布"]
companies: "Perplexity"
published_at: "2026-10-07T00:00:00.000Z"
importance: 7
confidence: 8
evidence_status: "公司／机构口径"
worth_following: true
source_url: "https://huggingface.co/perplexity-ai/pplx-embed-v2-late-0.6b"
source: "Perplexity 官方 Hugging Face 模型卡"
---

# Perplexity 发布 pplx-embed-v2-late 开放权重多模态检索模型

## 核心事实

Perplexity 发布 pplx-embed-v2-late 的 0.6B 与 9B 两个开放权重检索模型。模型卡口径称二者采用共享的 128 维 token 级晚交互表示与 MaxSim 打分，可让较大模型建索引、较小模型查询；覆盖文本、图像和视觉文档输入，并标注 MIT 许可证。模型卡列出的 ViDoRe v3 等评测成绩属于发布方口径，尚无独立复现。

## 投资含义

该发布为多模态检索和 RAG 增加了可自托管的 token 级晚交互方案，潜在代价是相较单向量检索更高的索引存储和服务复杂度。应在目标语料上比较召回、延迟、向量存储及总拥有成本，且不能由可下载权重推断托管 API 的可用性或定价。

## 建议动作

跟踪模型仓库修订、许可证、可复现实测及企业检索工作负载的存储与延迟表现。
<!-- domi:managed:end -->
