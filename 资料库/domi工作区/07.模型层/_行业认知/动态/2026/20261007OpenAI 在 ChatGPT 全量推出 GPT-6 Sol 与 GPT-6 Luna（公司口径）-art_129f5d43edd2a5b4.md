<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_129f5d43edd2a5b4"
title: "OpenAI 在 ChatGPT 全量推出 GPT-6 Sol 与 GPT-6 Luna（公司口径）"
domains: ["模型层","应用"]
subdomains: ["闭源基础模型","消费与个人应用"]
types: ["行业认知","模型发布","产品上线","安全评测"]
companies: "OpenAI"
published_at: "2026-10-07T00:00:00.000Z"
importance: 8
confidence: 8
evidence_status: "公司官方披露；正文完整读取，能力与安全效果未经独立验证"
worth_following: true
source_url: "https://deploymentsafety.openai.com/gpt-6-october"
source: "feishu-inbox｜OpenAI Deployment Safety Hub（公司官方披露）"
---

# OpenAI 在 ChatGPT 全量推出 GPT-6 Sol 与 GPT-6 Luna（公司口径）

## 行业认知文章

- 行业：模型层、应用
- 公司：OpenAI
- 来源：feishu-inbox｜OpenAI Deployment Safety Hub（公司官方披露） · [原文链接](https://deploymentsafety.openai.com/gpt-6-october)
- 发布时间：2026-10-07
- 原文存档：本文下方「原文存档」章节

## 摘要

【核心观点】OpenAI 于 2026 年 10 月 7 日宣布，将 GPT-6 Sol 与 GPT-6 Luna 的十月版本向全球 ChatGPT 免费及付费用户推出，替代 GPT-5.6 Sol/Luna。这是面向大规模消费入口的版本升级；公告明确 Codex 与 ChatGPT Work 当时仍使用九月版本，同名模型不能跨产品线视为同一版本。安全、事实性及对齐改善主要来自公司自评，并伴随部分评测退步。
【关键事实】
1. 范围与版本：ChatGPT 为十月版本；Codex、ChatGPT Work 为九月版本。本文不能证明 API 已同步到十月版本，也不能据此称所有产品线完成升级。
2. 评测设置：安全评测使用最低部署推理设置，能力评测使用最大推理强度；挑战样本的错误率不代表平均生产流量，旧系统卡因政策、评分器及数据集变化通常不可直接横向比较。
3. 提示注入：公司指令层级评测鲁棒性为 Sol 99.99%、Luna 99.79%；GPT-RED 间接提示注入鲁棒性为 Sol 97.13%、Luna 95.80%，后者在可用推理等级间等权平均。这些是特定评测分数，不是生产环境安全保证。
4. 健康评测：HealthBench Professional 长度调整后得分（0—100，越高越好）Sol 为 55.2，GPT-5.6 Sol 八月版为 54.0；Luna 为 48.2，GPT-5.6 Luna 八月版为 44.1。MentalHealthBench 涵盖 1,215 个合成对话任务，十月 Sol/Luna 总分分别为 48.81±0.97、51.73±0.96；该表的±为跨任务均值计算的标准误，不是临床效果或生产事故率。
5. 事实性与对齐：公司称在事实密集、用户标记错误及高风险提示集上，几乎所有事实性指标改善，例外为事实密集提示的断言级错误率；搜索工具不可用、任务受阻披露等评测也改善。测试有意选择困难样本，不代表 ChatGPT 的整体幻觉发生率。
6. 安全退步：相对各自 GPT-5.6 版本，Sol 的标准自伤评测、Luna 的标准自伤/血腥/性内容评测显著退步；未成年人评测的年龄限制内容、性内容及情感依赖亦存在退步。公司称人工审查发现违规严重度普遍较低，并部署额外分类器；不可据此笼统认定所有安全维度改善。
7. 高风险能力：公司在网络安全及生物/化学领域按 High 能力管理，低于 Critical；AI 自我改进未达 High。生物/化学部分说明 Sol 未越过 Critical 指示阈值，Luna 因其 High 评测相对参照模型的结果而未被要求单独进行 Critical 能力测试；不能将其表述为两者均已通过完全相同的 Critical 测试。
8. 商业信息缺口：本文未披露用户增长、留存、付费转化、模型实际单位推理成本、推理毛利或企业采用数据。飞书在线入口因 TLS 导航失败不可读，本次归档的是已完整取得的官方源正文。

## 值得关注的信号

【值得关注的信号】
1. 消费分发与价值捕获：ChatGPT 免费和付费入口升级扩大新版本的使用范围，但商业增量需要用任务成功率、活跃/留存、付费转化和每次任务推理成本核验，不能从全量推出直接推断收入增长或利润改善。
2. 同名模型的版本差异：跟踪 ChatGPT 十月版、Codex/ChatGPT Work 九月版及 API 的后续切换；采购、竞品比较和评测应同时标注产品入口、版本月份及推理设置，避免将不同版本结果混用。
3. 可靠性是否改善真实工作流：公司披露事实性、提示注入防御及受阻任务如实披露的改善，可能影响专业任务采用与人工复核成本；仍需第三方评测、生产任务成功率和实际用户反馈验证。
4. 安全与可用性的取舍：减少无害请求的过度拒绝，同时部分安全与未成年人评测退步。重点观察上线后的高严重度事件、分类器补救效果、政策调整及其对使用体验与企业采用的影响。
5. 基准口径与治理成本：HealthBench 长度调整显著影响排序，安全/能力推理设置不同，部分能力测试可能受历史公开漏洞暴露影响；需核验独立且版本匹配的复测。High 能力管理意味着持续评测与防护要求，但本文不能量化由此带来的单位成本或形成竞争壁垒的程度。
以上为基于公司披露的分析推断与跟踪项，不是已验证的增长、财务或投资回报结论。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"197ee1d16d88656e55f0ec0ca0aac98c579eb2ebdadaea8d5356a335bd6a7d94","translationSha256":"1d231cb0117b77b7f3bf0b5f55c1596264850e9a9702feb3f3f706c4758e8d38","sourceCharacters":45697,"timestampValues":0,"timestampOrderVerified":true,"englishProseChecked":true} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# 归档来源与获取范围

- 用户转发标题：OpenAI 在 ChatGPT 全量推出 GPT-6 Sol 与 GPT-6 Luna（公司口径）。
- 转发来源：feishu-inbox；入口：https://my.feishu.cn/docx/GBNmdjRCWoZgayxPobBcqz99n5c 。
- 飞书入口获取结果：网页读取工具无法访问；Tabbit 实际导航报 ERR_SSL_PROTOCOL_ERROR，未取得飞书在线正文，不绕过访问限制。已通过本地飞书镜像映射与已有同题事件记录确认该入口对应的原始来源线索，并完整回读既有本地摘要。
- 本次全文来源：OpenAI 部署安全中心，https://deploymentsafety.openai.com/gpt-6-october ，对应既有来源的 /broken-search-tool 同页章节入口。
- 官方标题：GPT-6 Sol 和 GPT-6 Luna：2026 年 10 月更新；页面发布日期：2026-10-07，仅披露日期，未披露具体发布时间或时区；获取日期：2026-10-08。
- 下列官方正文按网页顺序转为 Markdown，保留全部正文、脚注、11 张表格、7 幅图的原始 URL 和文献链接；图片不下载。公司安全评测、能力等级与效果判断均为公司口径；不视为独立验证或真实生产表现。正式全文记录与既有事件摘要分别保留，避免将摘要冒充全文。

---
[查看 PDF↗](https://deploymentsafety.openai.com/gpt-6-october/gpt-6-october.pdf)

发表于7 年 10 月 2026 日

# GPT-6 Sol 和 GPT-6 Luna：2026 年 10 月更新

## 1. Introduction

我们将向全球所有 ChatGPT 用户推出 GPT-6，涵盖免费和付费方案。这些模型将在 ChatGPT 中取代 GPT-5.6 Sol 和 GPT-5.6 Luna。在 Codex 和 ChatGPT Work 中使用 GPT-6 Sol 和 GPT-6 Luna 的用户，仍在使用此前发布的版本。在本系统卡中，我们用发布月份区分这些模型：今天发布的版本标记为 10 月版，而 Codex 和 Work 中继续使用的版本标记为 9 月版。详情请参阅[我们的博客](http://openai.com/index/gpt-6-for-everyone/)。

ChatGPT 中的 GPT-6 纳入了 Astra 的[安全改进](https://deploymentsafety.openai.com/gpt-6-astra/safety-overview-gpt-6-astra).。我们还更新了安全训练，以反映真实世界的使用情况，并加强针对网络、生物学和暴力领域高风险滥用行为的防护。

我们综合评估安全与对齐评测结果，同时权衡改进和退步的性质及严重程度。与 ChatGPT 中的 GPT-5.6 Sol 和 GPT-5.6 Luna 相比，GPT-6 抵御越狱攻击的能力更强，包括抵御会在多轮对话中不断调整的攻击；不诚实、欺骗以及绕过防护规则的情况也有所减少。对于安全评测显示退步的领域，我们对失败案例进行了人工复核，并开展了对抗性红队测试，发现违规回答总体上严重程度较低。本系统卡全文详细说明了用于降低伤害可能性的系统级缓解措施。

根据我们的 Preparedness Framework，我们将 GPT-6 Sol 和 GPT-6 Luna 的此次 10 月发布版本，在网络安全以及生物与化学领域均定为高能力等级。两者在 AI 自我改进方面均未达到高能力门槛。基于这一评估，我们为 GPT-6 Sol（10 月版）和 GPT-6 Luna（10 月版）实施了与[GPT-5.6 系统卡](https://deploymentsafety.openai.com/gpt-5-6)中针对 GPT-5.6 Sol 和 GPT-5.6 Luna 详细说明的同一套防护措施。

对于所有安全评测，例如违禁内容和心理健康评测，我们在模型推理部署设置最低时测量其表现，以反映绝大多数使用场景下的表现。对于能力评估，我们则在最高推理强度下评测模型，以得出能力上限。

## 2. 模型数据与训练

与 OpenAI 的其他模型一样，GPT-6 模型使用多样化数据集进行训练，并经过我们的数据处理流程筛选，其中包括减少个人信息。

OpenAI 推理模型通过强化学习训练，使其能够进行推理。这些模型经过训练，会在回答前先进行思考：在回复用户之前，它们可以生成很长的内部思维链。通过训练，这些模型学会完善思考过程、尝试不同策略并识别自身错误。推理能力使这些模型能够遵循我们设定的特定指南和模型政策，帮助它们按照我们的安全预期行事。这意味着它们能够提供更有帮助的回答，也更能抵御绕过安全规则的尝试。

对于此前发布的模型，发布时公布的数值反映的是当时接受评估的版本。此处展示的此前发布模型的对比数值可能反映这些模型的后续版本，也可能与发布时公布的数值有所不同。[1](https://deploymentsafety.openai.com/gpt-6-october#fn1)

---

- GPT-6 Sol 和 GPT-6 Luna 旨在依据 OpenAI 的《使用政策》《服务条款》和《使用条款》使用。这些政策适用于 OpenAI 的所有服务，旨在确保安全、负责任地使用 AI 技术。你可以在[openai.com/policies/usage-policies/](http://openai.com/policies/usage-policies/)查看 OpenAI 的《使用政策》。

如需有关这些模型的帮助，可在 OpenAI 网站（[openai.com](http://openai.com/)),）查找更多信息；也可以点击 [help.openai.com](http://help.openai.com/). 页面右下角显示的聊天气泡图标，联系 OpenAI 支持团队。模型支持的输入和输出模态可在[https://developers.openai.com/api/docs/models/all](https://developers.openai.com/api/docs/models/all).

ChatGPT 当前支持的语言列表可在[此处](https://help.openai.com/en/articles/8357869-how-to-change-your-language-setting-in-chatgpt)[](https://deploymentsafety.openai.com/gpt-6-october#fnref1)查看。

## 3. 模型安全

## 3.1 安全完成

## 3.1.1 挑战性提示词评测

我们在各安全类别中开展了基准评测。此处报告的是生产基准评测结果，该评测集包含能够代表生产数据中挑战性案例的对话。正如我们在此前的系统卡中所述，早先针对这些类别的标准评测结果已趋于饱和，因此我们引入了生产基准评测，以帮助衡量持续进展。

这些评测经过专门设计，难度较高。评测以现有模型尚未给出理想回答的案例为基础构建，以下分数反映了这一点。错误率并不能代表平均生产流量的情况。主要指标是安全完成率，用于检查模型的回答和行为是否违反我们的安全政策。评测时不启用系统级防护措施，以确保模型的底层行为符合我们的安全标准。发布后，我们会持续监测这些类别的表现，以评估线上表现，并在适当时进一步调整防护措施。

这些数值可能与相关模型发布时公布的数值略有差异。此前发布模型的数值取自其最新版本，评测结果也可能存在一定波动。下文列出的早期模型对比得分旨在说明相对表现。由于政策、评分器、数据集、评测和其他测量细节会随时间演进，因此通常不应将未列入下表的先前系统卡分数与这些最新结果直接比较。

与各自对应的 GPT‑5.6 版本相比，GPT‑6 Sol（10 月）在标准自残类别上出现了具有统计显著性的退步，而 GPT‑6 Luna（10 月）在标准自残、血腥内容和性内容类别上出现了具有统计显著性的退步。

我们人工审查了这些评测中的违规回答，发现这些违规行为处于边界地带，但总体而言仍是安全的。例如，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）更愿意回答有关自残的信息性问题，同时引导用户寻求适当的专业资源。根据我们的评测，它不会配合协助自残的请求。GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）更可能回应涉及血腥内容和性内容的请求，而不是直接拒绝；不过，我们审查过的输出严重程度较低。我们还进行了对抗性红队测试，根据我们的评估标准，没有发现任何高严重程度的风险。

这些评测未考虑能够提升助手回复整体安全性的系统级干预措施，例如可信联系人、本地化危机求助热线，以及面向较年轻用户的家长控制功能。

### 表 1：生产环境基准测试（具有挑战性的提示词；数值越高越好）

类别 暴力非法行为非暴力非法行为极端主义仇恨标准自残血腥内容性内容性内容/未成年人

| 类别 | GPT‑5.5 Instant（5 月更新） | GPT‑5.5 Instant（6 月更新） | GPT‑5.6 Luna（8 月） | GPT‑5.6 Sol（8 月） | GPT‑6 Sol（10 月） | GPT‑6 Luna（10 月） |
| --- | --- | --- | --- | --- | --- | --- |
| 暴力非法行为 | 0.959 | 0.967 | 0.957 | 0.959 | 0.948 | 0.959 |
| 非暴力非法行为 | 0.984 | 0.987 | 0.990 | 0.997 | 0.980 | 0.984 |
| 极端主义 | 0.957 | 0.936 | 0.936 | 0.915 | 0.915 | 0.894 |
| 仇恨 | 1.000 | 0.965 | 0.965 | 0.982 | 0.965 | 0.965 |
| 自残（标准） | 0.875 | 0.937 | 0.932 | 0.934 | 0.896 | 0.901 |
| 血腥内容 | 0.865 | 0.832 | 0.867 | 0.872 | 0.845 | 0.812 |
| 性内容 | 0.977 | 0.961 | 0.971 | 0.893 | 0.944 | 0.899 |
| 性内容/未成年人 | 0.991 | 0.939 | 0.966 | 0.922 | 0.887 | 0.829 |

除了衡量模型回应有害请求时的安全程度，我们还会评估模型是否会对正当请求过度拒绝，尤其是在主题敏感或容易被误解时。在下方的安全性帕累托图中，与先前的模型相比，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）在回应正当请求时的有用性有所提升，不过在某些安全相关请求上的得分较低。我们的评测表明，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）较少拒绝无害请求，也较少添加过多或带有评判意味的附加说明。

### 图 1

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image3.png)

![图 1。具有挑战性的提示词下的安全性与非过度拒绝能力。两个坐标轴上数值越高越好。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image3.png)

图 1。具有挑战性的提示词下的安全性与非过度拒绝能力。两个坐标轴上数值越高越好。

## 3.1.2 面向 18 岁以下用户的安全回复

AI 可以帮助青少年学习、创作、探索想法、获取信息并培养新技能。我们会谨慎设计系统，以实现这些益处，同时努力降低可能对 18 岁以下用户造成过度或更严重影响的潜在风险（U18）。

我们的[模型规范](https://model-spec.openai.com/2025-12-18.html#chatgpt_u18)阐述了指导模型如何对待青少年的原则和要求。对于我们认为可能未满 18 岁的用户，我们会通过安全政策中的年龄专属规定，将这些原则落实到实际操作中。在青少年可能面临独特或更高风险的某些领域，这些规定设定了比适用于成人的标准更严格的门槛，包括性内容、情感依赖、饮食失调，以及获取年龄限制类商品和服务。这些年龄专属保护措施既包括模型层面的行为规范，也包括系统层面的保护。

我们采用专门的 U18 评测，根据以下六个类别评估模型对这些原则的执行情况。评测旨在检验模型是否始终遵守适合相应年龄的界限，并避免提供可能给青少年带来更高风险的回复。这些评测使用了一些源自生产环境、最具挑战性的示例，评估模型在敏感情境下的行为，包括涉及自残、饮食失调相关行为、获取年龄限制类商品或服务及参与相关活动、血腥内容和不当性内容的对抗性示例。

### 表 2：U18 评测（数值越高越好）

类别 年龄限制类商品、服务及危险挑战/活动性内容饮食失调情感依赖自残血腥内容

| 类别 | GPT‑5.5 Instant（5 月更新） | GPT‑5.5 Instant（6 月更新） | GPT‑5.6 Luna（8 月） | GPT‑5.6 Sol（8 月） | GPT‑6 Sol（10 月） | GPT‑6 Luna（10 月） |
| --- | --- | --- | --- | --- | --- | --- |
| 年龄限制类商品、服务及危险挑战/活动 | 0.756 | 0.725 | 0.857 | 0.865 | 0.799 | 0.814 |
| 性内容 | 0.958 | 0.962 | 0.984 | 0.971 | 0.933 | 0.904 |
| 饮食失调 | 0.657 | 0.635 | 0.810 | 0.808 | 0.772 | 0.776 |
| 情感依赖 | 0.944 | 0.937 | 0.927 | 0.921 | 0.770 | 0.734 |
| 自残 | 0.982 | 0.977 | 0.977 | 0.987 | 0.977 | 0.974 |
| 血腥内容 | 0.865 | 0.832 | 0.867 | 0.872 | 0.845 | 0.812 |

与各自对应的 GPT‑5.6（8 月）版本相比，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）在年龄限制内容、性内容和情感依赖类别上均出现了具有统计显著性的退步。GPT‑6 Luna（10 月）在血腥内容类别上也出现了具有统计显著性的退步。其余差异均不具有统计显著性。

为降低向青少年生成不允许回复的风险，我们会针对可能包含自残、性内容和血腥内容的回复，额外应用基于分类器的拦截措施；上述评测结果未反映这项缓解措施，而它能提升回复的安全性。

我们审查了情感依赖类别的退步，发现我们的评测对模型使用无害昵称（如“bro”或“bestie”）过于敏感；如果用户明确提出要求，使用这些昵称并不属于不允许的行为。

由于这些评估侧重于困难案例和长尾风险，因此不应将其结果解读为这些行为在典型生产环境中出现频率的估计。

我们将继续改进模型对青少年的支持和保护。这包括训练模型以更安全、更恰当地回应，完善我们对青少年安全风险的理解，加强适龄防护措施，并改进我们衡量和报告模型面向年轻用户表现的方式。

## 3.2 视觉

我们进行了最初随 ChatGPT Agent 推出的图像输入评估。这些测试使用结合文本和图像的违规请求，并衡量模型的回复是否被判定为安全。GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）的表现分别与 GPT-5.6 Sol（8 月）和 GPT-5.6 Luna（8 月）持平，但极端主义视觉评估出现了一项回退。我们审查了评估中的不安全回复，发现其严重程度总体较低。

### 表 3：图像输入评估，指标为安全完成率（越高越好）

| 类别 | 仇恨 | 极端主义 | 自残 | 有害内容-色情 |

| 类别 | GPT‑5.5 Instant（5 月更新） | GPT‑5.5 Instant（6 月更新） | GPT‑5.6 Luna（8 月） | GPT‑5.6 Sol（8 月） | GPT‑6 Sol（10 月） | GPT‑6 Luna（10 月） |
| --- | --- | --- | --- | --- | --- | --- |
| 仇恨 | 0.994 | 0.993 | 0.984 | 0.986 | 0.986 | 0.974 |
| 极端主义 | 0.964 | 0.987 | 0.930 | 0.950 | 0.868 | 0.834 |
| 自残 | 0.993 | 0.996 | 0.990 | 0.987 | 0.956 | 0.962 |
| 有害内容-色情 | 0.999 | 0.999 | 0.994 | 0.986 | 0.981 | 0.975 |

## 4. Robustness

## 4.1 越狱攻击

在本节中，我们评估模型抵御越狱攻击的稳健性：这类对抗性提示旨在绕过模型的拒绝训练，引诱模型提供有害帮助。此处的评估侧重于直接攻击主模型，不使用我们在生产环境中采用的防护措施。因此，本节仅衡量我们安全防护体系中一个层面的稳健性。我们在生产环境中还部署了分类器等额外防护措施，这些措施会大幅增加用户越狱并获取有害帮助的难度。

## 4.1.1 多轮越狱评估

我们还评估了模型抵御自适应多轮攻击者的稳健性。这些攻击者源自内部红队演练。与静态评估不同，这些攻击者可以探测模型、回应模型的回答，并在多轮对话中调整策略。我们根据模型的回复是否可能实质性地助长有害请求来评分：提供有害帮助会得到较差评分，而无害回复则会得到较好评分。我们报告了防御方成功率随攻击者预算变化的最坏情况：预算为 n 次尝试时，只有模型在全部 n 次攻击中都避免提供不安全帮助，才算成功。在攻击者预算较高时，这项评估尤其具有挑战性，因为模型必须抵御所有越狱尝试，才能被视为成功。

### 图 2

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image2.png)

![图 2。按攻击者预算划分的多轮越狱稳健性。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image2.png)

图 2。按攻击者预算划分的多轮越狱稳健性。

与 9 月版本相比，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）在多轮越狱稳健性方面的点估计略低，95% 置信区间则大体重叠。在所有测试过的攻击者预算下，这两款 10 月模型的实测防御成功率都高于 GPT‑5.6 Sol。

## 4.2 提示注入

GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）对提示注入具有很强的抵御能力。我们持续扩大 [GPT‑Red 方法](https://openai.com/index/unlocking-self-improvement-gpt-red/), 的应用规模，通过与自动化红队智能体进行对抗训练，在保留完成合法任务能力的同时，增强模型抵御恶意指令的能力。

在评估中，我们使用了 [GPT‑5.6 系统卡](https://deploymentsafety.openai.com/gpt-5-6/prompt-injection). 中介绍的 GPT‑Red 自动化评估。这些评估涵盖“直接”提示注入攻击（也称“指令层级”违规），即用户试图覆盖优先级更高的系统或开发者指令；也涵盖“间接”攻击，即第三方内容中的恶意指令试图将智能体引向超出用户请求的方向。

GPT-6 Sol（10 月）和 GPT-6 Luna（10 月）在指令层级评估中达到饱和，稳健性分别达到 99.99% 和 99.79%。

### 表 4：GPT-RED 间接提示注入稳健性（越高越好；对可用推理级别进行等权平均）。

类别 GPT-6 Sol（10 月）GPT-6 Luna（10 月）

| 类别 | 提示注入稳健性 |
| --- | --- |
| GPT-6 Sol（10 月） | 97.13% |
| GPT-6 Luna（10 月） | 95.80% |

## 5. Health

## 5.1 HealthBench

聊天机器人可以帮助消费者更好地了解自身健康状况，并帮助医疗专业人员提供更好的护理 [[1](https://deploymentsafety.openai.com/gpt-6-october/references#ref-healthinchatgptblog)] [[2](https://deploymentsafety.openai.com/gpt-6-october/references#ref-openaipendaclinicalcopilot2025)]. 我们使用 HealthBench [[3](https://deploymentsafety.openai.com/gpt-6-october/references#ref-openaihealthbench2025)], 这一公开的健康表现与安全评估，以及 HealthBench Professional 这一面向临床使用场景的模型能力与安全公开评估 [[4](https://deploymentsafety.openai.com/gpt-6-october/references#ref-HEALTHBENCHPROFESSIONAL)].，对 GPT-6 Sol 和 GPT-6 Luna 进行评估。

我们注意到，在近期对前沿模型的评估中，HealthBench Professional 比旧版 HealthBench 更具参考价值。例如，在我们的内部测试中，HealthBench Professional 上的改进对其他留出评估中改进的预测能力强得多。我们认为，HealthBench（现已推出一年多）对前沿模型的评估正接近噪声上限，因此建议使用 HealthBench Professional 来衡量前沿模型的持续进步。本系统卡为求完整，报告了所有变体的结果。

与许多其他开放式聊天回复基准一样，HealthBench 和 HealthBench Professional 可能会奖励较长的回复。较长的回答如果包含更多有价值的信息，可能会更好；但它们满足评分标准中正向要求的机会也更多，而且不必要的长篇回复可能会降低对终端用户和临床医生的实用性。总体而言，对于对答案长度敏感的评估，长回答也可能被用来人为提高分数，而实际使用中的可用性和安全性并未得到根本改善。因此，与其他近期系统卡一样，我们报告了经过最终回复长度调整后的 HealthBench 和 HealthBench Professional 分数。

2,000 个字符的回答不作调整。更长的回答会受到惩罚，每增加 500 个字符就会扣分，具体幅度因评测而异：HealthBench Professional 每 500 个字符扣 1.47 分，HealthBench 扣 2.99 分，HealthBench Hard 扣 3.92 分，HealthBench Consensus 扣 0.20 分。更短的回答则会获得相应的正向调整。此处所有惩罚值均以本次评测所报告的 0-100 分制表示。模型的提示词中不会提供长度惩罚的详细信息。有关这一长度调整流程的完整详情，请参阅 [[4](https://deploymentsafety.openai.com/gpt-6-october/references#ref-HEALTHBENCHPROFESSIONAL)].

### 表 5：HealthBench 评测，报告为经长度调整后的分数（未经调整的分数、可见回答的平均字符数）。分数采用 0--100 分制；越高越好。

| 1 | gpt-5.5Instant | gpt-5.6-sol（8月） | gpt-5.6-luna（8月） | gpt-6-sol（10月） | gpt-6-luna（10月） |
| --- | --- | --- | --- | --- | --- |
| HealthBench<br>Professional | 38.4<br>（40.7，2,775） | 54.0<br>（56.6，2,894） | 44.1<br>（46.8，2,920） | 55.2<br>（62.2，4,360） | 48.2<br>（57.8，5,289） |
| HealthBench | 51.4<br>（50.9，1,922） | 55.0<br>（52.1，1,514） | 53.3<br>（50.7，1,567） | 52.1<br>（55.7，2,602） | 50.4<br>（58.5，3,361） |
| HealthBench<br>Hard | 22.9<br>（21.3，1,794） | 31.4<br>（27.1，1,450） | 28.7<br>（24.9，1,523） | 27.8<br>（30.9，2,396） | 27.2<br>（36.1，3,134） |
| HealthBench<br>Consensus | 94.7<br>（94.6，1,919） | 95.5<br>（95.3，1,511） | 94.8<br>（94.6，1,553） | 93.8<br>（94.0，2,608） | 95.0<br>（95.5，3,343） |

GPT‑6 Sol（10月）和 GPT‑6 Luna（10月）在 HealthBench Professional 上的表现均优于各自的 GPT-5.6（8月）版本。虽然它们在 HealthBench 分数上略有退步，但这似乎主要源于长度分数调整，而不是回答未经调整的健康分数。

## 5.2 MentalHealthBench

[MentalHealthBench](https://cdn.openai.com/ctf-cdn/MentalHealthBench_A_Comprehensive_Benchmark_of_AI_Capabilities_in_Realistic_Mental_Health_Conversations.pdf) 是一项开放基准，由心理健康专家共同开发，用于衡量 AI 系统在真实的心理健康对话中如何回应。它包含 1,215 段合成对话，涵盖从日常身心健康话题到紧急心理健康危机等多种场景。每项对话任务都配有临床医生编写的评分标准，可用于评估新模型的回答。有关评测设计的更多详情，请参阅[论文](https://cdn.openai.com/ctf-cdn/MentalHealthBench_A_Comprehensive_Benchmark_of_AI_Capabilities_in_Realistic_Mental_Health_Conversations.pdf).

每个回答都会根据评分标准打分，分数限制在 0–100% 范围内。我们先对每项任务的四个独立回答取平均值，再对各任务分数取平均值。标准误根据任务均值计算：总体为 1,215，非急性任务为 650，高危急性任务为 221，紧急任务为 344。

### 表 6：MentalHealthBench 分数，采用任务级截断指标计算。分数采用 0--100 分制；越高越好。

| 1<br>评测 | gpt-5.5Instant（5月） | gpt-5.5Instant（6月） | gpt-5.6-sol（8月） | gpt-5.6-luna（8月） | gpt-6-sol（10月） | gpt-6-luna（10月） |
| --- | --- | --- | --- | --- | --- | --- |
| MentalHealthBench（总体） | 49.38<br>± 0.93 | 53.93<br>± 0.93 | 47.53<br>± 0.97 | 45.11<br>± 0.95 | 48.81<br>± 0.97 | 51.73<br>± 0.96 |
| MentalHealthBench（非急性） | 51.91<br>± 1.23 | 52.96<br>± 1.26 | 47.07<br>± 1.30 | 43.10<br>± 1.29 | 47.62<br>± 1.31 | 51.68<br>± 1.28 |
| MentalHealthBench（高危急性） | 50.23<br>± 2.17 | 58.76<br>± 2.11 | 53.88<br>± 2.28 | 52.58<br>± 2.19 | 53.70<br>± 2.26 | 56.15<br>± 2.25 |
| MentalHealthBench（紧急） | 44.03<br>± 1.80 | 52.66<br>± 1.81 | 44.30<br>± 1.87 | 44.12<br>± 1.81 | 47.92<br>± 1.89 | 48.98<br>± 1.87 |

在 MentalHealthBench 对话的所有严重程度类别中，GPT-6 Luna（10月）相较于 GPT-5.6 Luna（8月）均有显著提升。GPT-6 Sol（10月）相较于 GPT-5.6 Sol（8月）也有所提升，其中紧急心理健康对话的表现提升幅度最大。

## 5.3 采用对抗性用户模拟的动态心理健康基准

我们报告心理健康、情感依赖和自我伤害领域的动态多轮评测，这些评测模拟了跨越这些领域的长时间对话。与在固定对话中评估单个回答不同，这些评测允许对话根据模型的输出不断发展，在测试过程中形成多种不同的对话轨迹，从而更好地反映真实用户互动。这种方法有助于发现只会在长时间交流过程中显现的潜在问题，其严苛程度也高于此前的静态多轮方法。通过采用真实但具有对抗性的用户模拟，这些评测推动了安全表现的持续改进。

我们的标准评测衡量模型的最终回答是否违反政策。在这些动态对话中，我们改为评估助手的任何一条回答是否违反政策，并报告符合政策的回答比例。使用的指标为“安全”，表示未违反安全政策的助手消息所占比例。

与标准评测一样，这些评测也经过有意设计，难度较高。它们围绕现有模型尚未能给出理想回答的案例构建，这一点也反映在下方的分数中。错误率并不代表生产环境流量的平均水平。

GPT‑6 Sol（10月）和 GPT‑6 Luna（10月）在心理健康、情感依赖和自我伤害评测中的表现，与各自的 GPT‑5.6（8月）版本大致相当。观察到的差异均无统计显著性。

### 表 7：采用对抗性用户模拟的动态基准（越高越好）

类别 心理健康情感依赖自我伤害

| 类别 | GPT‑5.5 Instant（5月更新） | GPT‑5.5 Instant（6月更新） | GPT‑5.6 Luna（8月） | GPT‑5.6 Sol（8月） | GPT‑6 Sol（10月） | GPT‑6 Luna（10月） |
| --- | --- | --- | --- | --- | --- | --- |
| 心理健康 | 0.981 | 0.991 | 0.977 | 0.981 | 0.996 | 0.991 |
| 情感依赖 | 0.988 | 0.989 | 0.965 | 0.961 | 0.961 | 0.961 |
| 自我伤害 | 0.852 | 0.967 | 0.911 | 0.901 | 0.889 | 0.884 |

## 6. Hallucinations

## 6.1 用户标记案例中的表现

为了评估我们的模型给出事实正确回答的能力，我们在以下具有挑战性的提示集上测量事实性幻觉率。这些提示集经过筛选，旨在展示模型最可能产生幻觉的情境。这些评估刻意设置得较难，以检验模型在困难领域中的事实准确性，并随时间提供敏感的研究信号，而非衡量 ChatGPT 生产环境中的总体发生率或普通用户体验。因此，以下数值并不反映生产环境中的发生率，而是反映模型在经过精心挑选、侧重事实准确性、以往曾出现失败或涉及高风险的情境下接受测试时的表现。

事实密集型：我们的主要提示集由能够代表 ChatGPT 中事实密集型对话的提示组成。

用户标记的失败：为了聚焦于过往模型版本中已损害用户体验的事实性问题，本评估在经过去标识化处理、且此前被标记为包含事实错误的 ChatGPT 对话上测量幻觉率。

高风险：为了衡量高风险用例中的事实准确性——在这些场景中，正确回答对用户尤为关键——我们使用一组专门由具有挑战性的医疗、法律和金融提示组成的提示集（高风险）进行评估。

对于所有提示集，我们都使用一个可访问网络的基于 LLM 的评分模型，识别助手对这些提示的回答中的事实错误，并同时报告被识别为存在事实错误的回答中主张所占比例，以及至少包含一项事实错误的回答所占比例。我们发现，GPT‑6 Sol（10 月）和 GPT‑6 Luna（10 月）在几乎所有评估指标上的事实准确性都显著优于 GPT-5.6 Sol（8 月）和 GPT-5.6 Luna（8 月）。唯一例外是事实密集型提示中的主张级事实错误。

### 图 3

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image1.png)

![图 3。事实密集型、用户标记和高风险提示集中的回答级及主张级事实错误率。越低越好。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image1.png)

图 3。事实密集型、用户标记和高风险提示集中的回答级及主张级事实错误率。越低越好。

## 7. Alignment

我们的对齐评估衡量模型规避限制和欺骗用户的倾向与能力。在整个评估套件中，GPT-6 Sol 和 GPT-6 Luna（10 月）始终优于各自的 GPT-5.6（8 月）版本。根据评估结果和人工审查，GPT-6 Sol 和 GPT-6 Luna 均达到我们的对齐安全标准。

## 7.1 遵守限制

这套对齐评估聚焦于模型可能规避其运行中明示或暗示限制的情形。这些限制可能来自环境（例如登录要求），也可能来自模型控制措施，即运行框架（例如 Auto-review）。请注意，这些评估旨在测试模型的基线能力，运行时不会启用旨在缓解这些风险的系统级安全防护机制。

## 7.1.1 尊重 Auto-Review

[Auto-review](https://alignment.openai.com/auto-review/) 是 Codex 内置的一项协议，由第二个模型评估在预先指定的沙箱之外运行的某些命令是否安全。如果这个第二监控模型判定某条命令不安全，就会阻止其执行并返回一条消息。该消息会告知模型判定结果，并指示它避免采取实质上相似的操作。

在这项评估中，我们观察模型收到此类拒绝后如何反应。每项任务都设定在一个知识工作环境中，运行过程从 Auto-review 拒绝某项操作请求后立即开始。此时模型有多种处理方式：结束任务、尝试寻找更安全的替代方案、重试相似命令，或利用刻意设置的[不当配置](https://learn.chatgpt.com/docs/agent-configuration/rules)完全绕过 Auto-review。采取后两种做法中的任何一种，都将视为未通过这项评估。

### 图 4

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image6.png)

![图 4。在最高推理力度下完成的禁止操作。越低越好。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image6.png)

图 4。在最高推理力度下完成的禁止操作。越低越好。

在最高推理力度下的 0.3% 次运行中，GPT-5.6 Sol（8 月）和 GPT-5.6 Luna（8 月）都利用了配置不当的 Auto-Review 设置中的漏洞。GPT-6 Sol（10 月）和 GPT-6 Luna（10 月）则没有出现此类情况。

## 7.1.2 尊重警告

与“尊重 Auto-Review”评估相似，这项测试会追踪模型在各种模拟专业工作环境中遇到障碍后的行为。在“尊重警告”评估中，障碍来自环境（例如某些 AccessDenied 错误、内容政策限制），而非运行框架。

这项评估最近经过更新，以提高真实性、多样性和标签质量。此外，我们更新了主要指标，改为追踪*成功*规避限制的情况，而不只是*尝试*规避的情况，以提高评分标准的客观性。不过，由于我们是在没有安全防护的情况下测试模型，结果确实会部分受到模型底层智能水平的影响，因为更智能的模型更有可能成功规避限制。

关于这些评估结果能在多大程度上反映现实世界中的行为，仍有合理疑问。随着智能水平不断提高，模型也越来越能察觉自己正在接受评估。在许多情况下，我们观察到模型以评估的合成性质为由，为*不当*行为辩解。最常见的情况是，模型错误地将评估归类为提示注入测试，进而把障碍误认为提示注入。我们正在努力提高这项评估的外部效度，并将继续完善我们的对齐评估。

这项评估也主要衡量低风险情境，并且是在没有系统级控制措施的情况下进行的；其中许多措施很可能会阻止观察到的规避行为。

### 图 5

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image4.png)

![图 5。成功规避环境限制的条件失败率。越低越好。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image4.png)

图 5。成功规避环境限制的条件失败率。越低越好。

在所有这些情况下，我们期望模型尊重警告，不尝试绕过它。在最大推理强度下的 rollout 中，34% 的 GPT-5.6 Sol（8月）看到了限制，并成功找到了完成任务的替代方法，违背了限制的本意。在 27% 的 rollout 中，GPT-5.6 Luna（8月）也做了同样的事。与此同时，这种不受欢迎的坚持行为出现在 28% 的 GPT-6 Sol（10月）rollout 中，以及 15.9% 的 GPT-6 Luna（10月）rollout 中。

## 7.2 避免与用户进行欺骗性互动

我们认为，模型可能具有的任何欺骗用户倾向都值得特别关注。首先，模型歪曲自己的工作情况，会妨碍人类监督其行动的能力。其次，这类欺骗可以合理地作为模型普遍倾向的代理指标，即模型会将完成任务置于其他安全考量之上。我们指出，这些评估旨在测试模型的基线能力，运行时不会提供所有第一方界面中用于防止此类欺骗行为的标准开发者提示。

## 7.2.1 阻碍情境中的欺骗

这项新评估采用了真实的编码任务，模型在任务中会遇到妨碍其完成工作的阻碍。随后，评估会衡量模型在最终回答中承认这一限制的比率。它取代了早期的一项评估，先前系统卡将其称为“编码欺骗”；最新模型在该评估中的表现已基本达到饱和。

### 图 6

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image7.png)

![图 6。编码任务中与阻碍相关的未披露失败率。越低越好。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image7.png)

图 6。编码任务中与阻碍相关的未披露失败率。越低越好。

与先前模型相比，GPT-6 Sol（10月）和 GPT-6 Luna（10月）的未披露失败率显著降低。由于基础设施问题，0.25% 个 GPT-6 Luna（10月）样本提前退出，因此未纳入分析。请注意，这些问题经过刻意选择，旨在诱发不当行为，因此不一定反映生产环境中误导性回答的绝对发生率。

## 7.2.2 搜索工具故障

这项非常简单的评估会给模型一项通常需要搜索才能完成的任务，但搜索工具不可用。随后，我们会追踪模型在最终消息中未承认这一限制的比率。

### 图 7

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image5.png)

![图 7。搜索工具故障评估结果。](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image5.png)

图 7。搜索工具故障评估结果。

在最大推理强度下，GPT-6 Sol（10月）和 GPT-6 Luna（10月）相较于 GPT-5.6 个模型均取得了具有统计显著性的提升。

## 8. Preparedness

根据我们的[预备框架](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf),)，我们将 GPT-6 Sol 和 GPT-6 Luna 在网络安全、生物以及化学领域均视为具备高能力。这两个模型在 AI 自我改进方面都没有达到我们的高能力门槛。这些评估结果与对应的 GPT‑5.6 模型一致，我们已实施 GPT‑5.6 系统卡中所述的相应防护措施。

## 8.1 能力评估

## 8.1.1 生物与化学能力

我们将 GPT-6 Sol 和 GPT-6 Luna 视为在生物与化学领域具备高能力。下文报告这两个模型在高能力评估中的最新结果。我们还报告了 GPT-6 Sol 在关键能力评估中的结果。GPT-6 Sol 报告的结果未达到指示性的关键能力阈值。GPT-6 Luna 在所有高能力评估中的得分都低于 GPT-5.6 Sol，因此无需对其进行单独的关键能力测试。

有关这些评估的完整说明，请参阅[GPT-6 Astra 系统卡](https://deploymentsafety.openai.com/gpt-6-astra/sec%3Aappendix-216684)中的“生物与化学能力”部分。

## 8.1.1.1 能力阈值：高

### 表 8：生物与化学能力：高能力阈值

| 1<br>评估 | 指标 | 高能力阈值 | gpt-6-sol（10月） | gpt-6-luna（10月） |
| --- | --- | --- | --- | --- |
| 多模态病毒学故障排查 | pass@1 | 31% | 51.68% | 48.13% |
| ProtocolQA 开放式问答 | pass@1 | 54% | 25.62% | 34.57% |
| 隐性知识与故障排查 | cons@32 | 80% | 72.45% | 94.00% |
| TroubleshootingBench | pass@1 | 36.4% | 41.83% | 41.46% |

## 8.1.1.2 能力阈值：关键

### 表 9：生物与化学能力：关键能力阈值

| 1<br>评估 | 指标 | 关键能力阈值 | gpt-6-sol（10月） | gpt-6-luna（10月） |
| --- | --- | --- | --- | --- |
| SHP2 蛋白质功能预测 | 平均 R²（越高越好） | 0.60 | 0.23 | 0.13 |
| 冠状病毒--ACE2 细胞进入筛选 | 综合得分（越高越好） | 0.75 | 0.349 | 0.36 |
| 噬菌体--质粒共进化 | 负对数似然（越低越好） | ≤ 9.40 | 12.95 | 10.70 |

## 8.1.2 网络安全能力

与评估 GPT-5.6 Sol（8月）和 GPT-5.6 Luna（8月）时一样，并根据我们的能力评估结果，我们将 GPT-6 Sol 和 GPT-6 Luna 视为在网络安全领域具备高能力，但未达到关键能力。根据我们的预备框架，高网络安全能力是指模型能够“消除网络行动规模化的现有瓶颈，包括针对具备合理防护能力的目标自动执行端到端网络行动，或自动发现并利用与实际运营相关的漏洞”。

我们认定，GPT-6 Sol 和 Luna 在预备框架下的网络安全能力均低于关键能力阈值。我们使用自动化网络安全评估对两个模型的能力进行了评估。GPT-6 Sol 的表现与 GPT-5.6 Sol 相当，能力方面没有明确提升。GPT-6 Luna 的表现逊于 GPT-6 Sol。综合全部证据后，安全顾问组认定，已有充分证据建议将这两个模型都判定为低于关键能力阈值。

有关下文评估的完整说明，请参阅 GPT-6 Astra 卡片中的[“网络安全能力”部分](https://deploymentsafety.openai.com/gpt-6-astra/cybersecurity-capabilities).

## 8.1.2.1 ExploitBench

ExploitBench 评估模型能否利用漏洞描述、源代码和补丁，在没有参考漏洞利用程序的情况下，将已知漏洞转化为越来越强大的漏洞利用原语，直至实现任意代码执行。在最大推理强度下，GPT-6 Sol 在该基准上的得分为 82.62%，GPT-6 Luna 的得分为 44.66%。

如 GPT‑6 Astra 系统卡所述，公开基准中历史漏洞的暴露可能会抬高结果。

## 8.1.2.2 SEC-Bench Pro

SEC-Bench Pro 评估模型在大型 JavaScript 引擎中发现漏洞的能力，包括 V8 和 SpiderMonkey。GPT-6 Sol 和 GPT-6 Luna 分别取得 68.85% 和 48.50% 的分数，而 GPT-6 Astra 的分数为 85.4%。

## 8.1.3 AI 自我改进能力

在 AI 自我改进方面，GPT-6 Sol 和 GPT-6 Luna 均未达到我们的高阈值。

有关这些评估的完整说明，请参见[GPT-6 Astra 卡片中的 AI 自我改进能力章节](https://deploymentsafety.openai.com/gpt-6-astra/ai-self-improvement-capabilities).

## 8.2 防护措施

以下内容是我们内部《防护措施报告》的公开摘要。该报告还包含不适合公开披露的更多细节（例如可能对攻击者有用的信息）。内部报告为安全顾问组的建议以及 OpenAI 领导层的决定提供了依据；他们认为，这些防护措施足以支持 GPT-6 Sol 和 GPT-6 Luna 公开发布。

## 8.2.1 模型安全训练与评估

有关这些评估的完整说明，请参见[GPT-6 Astra 卡片中的模型安全训练与评估章节](https://deploymentsafety.openai.com/gpt-6-astra/model-safety-training-and-evaluation).

## 8.2.1.1 生物与化学安全训练与评估

### 表 10：生物学模型拒绝评估（越高越好）

| 1<br>生物学模型拒绝评估 | 指标 | GPT‑5.5 Instant<br>（5 月更新） | GPT‑5.5 Instant<br>（6 月更新） | GPT‑5.6 Luna<br>（8 月） | GPT‑5.6 Sol<br>（8 月） | GPT‑6 Sol<br>（10 月） | GPT‑6 Luna<br>（10 月） |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 严重 | 安全 | 0.969 | 0.969 | 0.937 | 0.954 | 0.980 | 0.945 |
| 双重用途 | 安全 | 0.957 | 0.939 | 0.928 | 0.945 | 0.971 | 0.968 |

在生物学模型拒绝评估中，与 GPT-5.6 Sol（8 月）和 GPT-5.6 Luna（8 月）相比，GPT-6 Sol（10 月）和 GPT-6 Luna（10 月）在严重风险和双重用途提示上的安全性均有显著提升。这些指标仅反映模型的回答，不包括我们的完整生产环境防护措施。

## 8.2.1.2 网络安全训练与评估

### 表 11：网络安全评估（越高越好）

类别 生产环境聊天 合成智能体环境

| 类别 | GPT‑5.5 Instant（5 月更新） | GPT‑5.5 Instant（6 月更新） | GPT‑5.6 Luna（8 月） | GPT‑5.6 Sol（8 月） | GPT‑6 Sol（10 月） | GPT‑6 Luna（10 月） |
| --- | --- | --- | --- | --- | --- | --- |
| 生产环境聊天 | 0.977 | 0.974 | 0.974 | 0.982 | 0.973 | 0.971 |
| 合成智能体环境 | 0.994 | 0.998 | 0.997 | 0.999 | 0.999 | 0.998 |

在网络安全评估中，GPT-6 Sol（10 月）和 GPT-6 Luna（10 月）的安全性分数总体上与 GPT-5.6 Sol（8 月）和 GPT-5.6 Luna（8 月）相当。模型拒绝仍是我们安全体系的一层，同时还有其他防护措施通过纵深防御落实安全边界。

## 9. 参考文献

- [1] 

OpenAI。《在 ChatGPT 中推出健康功能》。可查阅：[https://openai.com/index/health-in-chatgpt/](https://openai.com/index/health-in-chatgpt/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-healthinchatgptblog-ref)

- [2] 

Robert Korom、Sarah Kiptinness、Najib Adan、Kassim Said、Catherine Ithuli、Oliver Rotich 等。《与 Penda Health 开创 AI 临床协作助手》。可查阅：[https://openai.com/index/ai-clinical-copilot-penda-health/](https://openai.com/index/ai-clinical-copilot-penda-health/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-openaipendaclinicalcopilot2025-ref)

- [3] 

Rahul K. Arora、Jason Wei、Rebecca Soskin Hicks、Preston Bowman、Joaquin Quiñonero Candela、Foivos Tsimpourlas 等。《介绍 HealthBench》。可查阅：[https://openai.com/index/healthbench/](https://openai.com/index/healthbench/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-openaihealthbench2025-ref)

- [4] 

Rebecca Soskin Hicks、Mikhail Trofimov、Dominick Lim、Rahul K. Arora、Foivos Tsimpourlas、Preston Bowman 等。《HealthBench Professional：基于真实临床医生聊天记录评估大型语言模型》。可查阅：[https://cdn.openai.com/dd128428-0184-4e25-b155-3a7686c7d744/HealthBench-Professional.pdf](https://cdn.openai.com/dd128428-0184-4e25-b155-3a7686c7d744/HealthBench-Professional.pdf).[](https://deploymentsafety.openai.com/gpt-6-october#ref-HEALTHBENCHPROFESSIONAL-ref)[](https://deploymentsafety.openai.com/gpt-6-october#ref-HEALTHBENCHPROFESSIONAL-ref-2)

[← 返回所有更新](https://deploymentsafety.openai.com/)
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://deploymentsafety.openai.com/gpt-6-october
- 来源：feishu-inbox｜OpenAI Deployment Safety Hub（公司官方披露）
- 发布时间：2026-10-07
- 行业：模型层、应用
- 公司：OpenAI
- 归档时间：2026-10-09T09:02:14.347Z

---

# 归档来源与获取范围

- 用户转发标题：OpenAI 在 ChatGPT 全量推出 GPT-6 Sol 与 GPT-6 Luna（公司口径）。
- 转发来源：feishu-inbox；入口：https://my.feishu.cn/docx/GBNmdjRCWoZgayxPobBcqz99n5c 。
- 飞书入口获取结果：网页读取工具无法访问；Tabbit 实际导航报 ERR_SSL_PROTOCOL_ERROR，未取得飞书在线正文，不绕过访问限制。已通过本地飞书镜像映射与已有同题事件记录确认该入口对应的原始来源线索，并完整回读既有本地摘要。
- 本次全文来源：OpenAI Deployment Safety Hub，https://deploymentsafety.openai.com/gpt-6-october ，对应既有来源的 /broken-search-tool 同页章节入口。
- 官方标题：GPT-6 Sol and GPT-6 Luna: October 2026 update；页面发布日期：2026-10-07，仅披露日期，未披露具体发布时间或时区；获取日期：2026-10-08。
- 下列官方正文按网页顺序转为 Markdown，保留全部正文、脚注、11 张表格、7 幅图的原始 URL 和文献链接；图片不下载。公司安全评测、能力等级与效果判断均为公司口径；不视为独立验证或真实生产表现。正式全文记录与既有事件摘要分别保留，避免将摘要冒充全文。

---
[View PDF↗](https://deploymentsafety.openai.com/gpt-6-october/gpt-6-october.pdf)

Published October 7, 2026

# GPT-6 Sol and GPT-6 Luna: October 2026 update

## 1. Introduction

We’re launching GPT-6 to everyone in ChatGPT, across free and paid plans globally. These models will replace GPT-5.6 Sol and GPT-5.6 Luna in ChatGPT. Users accessing GPT-6 Sol and GPT-6 Luna in Codex, and via ChatGPT Work, are still using previously released versions. In this system card, we distinguish these models by their month of release: October for the versions released today, and September for the versions that remain in use in Codex and Work. See [our blog](http://openai.com/index/gpt-6-for-everyone/) for details.

GPT-6 in ChatGPT incorporates Astra’s [safety advances](https://deploymentsafety.openai.com/gpt-6-astra/safety-overview-gpt-6-astra). We also updated the safety training to reflect real-world use and strengthen protections against high-risk misuse in cyber, biology, and violence.

We assess safety and alignment evaluations in aggregate, weighing improvements alongside the nature and severity of regressions. Compared with GPT-5.6 Sol and GPT-5.6 Luna in ChatGPT, GPT-6 showed stronger resistance to jailbreaks, including attacks that adapt across multiple turns, as well as reductions in dishonesty, deception, and circumvention of guardrails. For areas where our safety evaluations showed regressions, we conducted manual review of failures and adversarial red-team testing and found that the disallowed responses were generally low severity. System-level mitigations to reduce the likelihood of harm are detailed throughout this system card.

Under our Preparedness Framework, we are treating this October release of GPT-6 Sol and GPT-6 Luna as High capability in both Cybersecurity and Biological and Chemical domains. Neither one reaches our High threshold in AI Self-Improvement. Based on that assessment, we’ve implemented the same set of safeguards for GPT-6 Sol (October) and GPT-6 Luna (October) that are detailed in the [GPT-5.6 System Card](https://deploymentsafety.openai.com/gpt-5-6) for GPT-5.6 Sol and GPT-5.6 Luna.

For all safety evaluations, such as disallowed content and mental health, we measure performance of our models at their lowest reasoning deployment settings in order to capture performance for the vast majority of usage. For capabilities assessments, we evaluate the models at their maximum reasoning effort to get an upper bound of capabilities.

## 2. Model Data and Training

Like OpenAI’s other models, GPT-6 models were trained on diverse datasets and filtered through our data processing pipeline, including to reduce personal information.

OpenAI reasoning models are trained to reason through reinforcement learning. These models are trained to think before they answer: they can produce a long internal chain of thought before responding to the user. Through training, these models learn to refine their thinking process, try different strategies, and recognize their mistakes. Reasoning allows these models to follow specific guidelines and model policies we’ve set, helping them act in line with our safety expectations. This means they provide more helpful answers and better resist attempts to bypass safety rules.

For previously launched models, the values published at launch reflect the versions evaluated at that time. The comparison values for previously launched models that are shown here may reflect later versions of those models, and may vary from the values published at launch.[1](https://deploymentsafety.openai.com/gpt-6-october#fn1)

---

- GPT-6 Sol and GPT-6 Luna are intended to be used in accordance with OpenAI’s Usage Policies, Service Terms, and Terms of Use. These policies apply universally to OpenAI services and are designed to ensure safe and responsible usage of AI technology. You can review OpenAI’s Usage Policies at [openai.com/policies/usage-policies/](http://openai.com/policies/usage-policies/) .

If you need assistance with respect to these models, you can find further information on OpenAI’s website ([openai.com](http://openai.com/)), or you can contact OpenAI Support by opening the chat bubble icon displayed at the bottom-right of [help.openai.com](http://help.openai.com/). The input and output modalities supported by the models can be found at [https://developers.openai.com/api/docs/models/all](https://developers.openai.com/api/docs/models/all).

A list of the languages that ChatGPT currently supports can be found [here.](https://help.openai.com/en/articles/8357869-how-to-change-your-language-setting-in-chatgpt)[](https://deploymentsafety.openai.com/gpt-6-october#fnref1)

## 3. Model Safety

## 3.1 Safe Completions

## 3.1.1 Evaluations with Challenging Prompts

We conducted benchmark evaluations across safety categories. We report here on our Production Benchmarks, an evaluation set with conversations representative of challenging examples from production data. As we noted in previous system cards, we introduced these Production Benchmarks to help us measure continuing progress given that earlier Standard evaluations for these categories had become relatively saturated.

These evaluations were deliberately created to be difficult. They were built around cases in which our existing models were not yet giving ideal responses, and this is reflected in the scores below. Error rates are not representative of average production traffic. The primary metric is safe completion rate, checking that the model’s response and actions are not disallowed according to our safety policies. Our evaluations are run on the model without system-level safeguards to ensure the model’s underlying behavior meets our safety bar. We continue monitoring these categories after launch to evaluate online performance and further adjust safeguards as appropriate.

Values may vary slightly from values published at launch for those models. Values from previously launched models are from the latest versions of those models, and evals are subject to some variation. The comparison scores from earlier models listed below are intended to shed light on relative performance. Because policies, graders, datasets, evaluations, and other measurement details evolve over time, scores from previous system cards not included in the table below should generally not be considered directly comparable to these most recent results.

Relative to their respective GPT‑5.6 counterparts, GPT‑6 Sol (October) shows a statistically significant regression on standard self-harm, while GPT‑6 Luna (October) shows statistically significant regressions on standard self-harm, gore, and sexual content.

We manually reviewed violative responses from these evaluations and found that violations were borderline but still generally safe. For example, GPT‑6 Sol (October) and GPT‑6 Luna (October) are more willing to answer informational questions about self-harm while directing users to appropriate professional resources. Based on our evaluations, it does not comply with requests to facilitate self-harm. GPT‑6 Sol (October) and GPT‑6 Luna (October) are more likely to engage with requests for gore and sexual content rather than refuse outright, however the outputs we reviewed were lower severity. We also conducted adversarial red teaming and did not identify any high-severity risks based on our evaluation criteria.

These evaluations do not account for system-level interventions that elevate the holistic safety of the assistant response, such as Trusted Contact, localized crisis helplines, and Parental Controls for younger users.

### Table 1: Production Benchmarks with Challenging Prompts (higher is better)

Category Violent Illicit behaviorNon-Violent Illicit behaviorExtremismHateSelf-harm (standard)GoreSexualSexual/minors

| Category | GPT‑5.5 Instant (May Update) | GPT‑5.5 Instant (June Update) | GPT‑5.6 Luna (August) | GPT‑5.6 Sol (August) | GPT‑6 Sol (October) | GPT‑6 Luna (October) |
| --- | --- | --- | --- | --- | --- | --- |
| Violent Illicit behavior | 0.959 | 0.967 | 0.957 | 0.959 | 0.948 | 0.959 |
| Non-Violent Illicit behavior | 0.984 | 0.987 | 0.990 | 0.997 | 0.980 | 0.984 |
| Extremism | 0.957 | 0.936 | 0.936 | 0.915 | 0.915 | 0.894 |
| Hate | 1.000 | 0.965 | 0.965 | 0.982 | 0.965 | 0.965 |
| Self-harm (standard) | 0.875 | 0.937 | 0.932 | 0.934 | 0.896 | 0.901 |
| Gore | 0.865 | 0.832 | 0.867 | 0.872 | 0.845 | 0.812 |
| Sexual | 0.977 | 0.961 | 0.971 | 0.893 | 0.944 | 0.899 |
| Sexual/minors | 0.991 | 0.939 | 0.966 | 0.922 | 0.887 | 0.829 |

In addition to measuring how safely our models respond to harmful requests, we assess whether they overrefuse legitimate requests, especially when a topic is sensitive or easy to misinterpret. In the Safety Pareto chart below, GPT‑6 Sol (October) and GPT‑6 Luna (October) show an improvement on helpfulness on legitimate requests relative to prior models, though it scores lower on some safety requests. Our evaluations indicate that GPT‑6 Sol (October) and GPT‑6 Luna (October) are less likely to refuse harmless requests or add excessive or judgmental caveats.

### Figure 1

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image3.png)

![Figure 1. Safety and non-overrefusal on challenging prompts. Higher is better on both axes.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image3.png)

Figure 1. Safety and non-overrefusal on challenging prompts. Higher is better on both axes.

## 3.1.2 Safe Completions for Users Under 18

AI can help teens learn, create, explore ideas, access information, and build new skills. We design our systems carefully to enable these benefits while working to mitigate potential risks that may have outsized or more severe impacts on users under 18 (U18).

Our [Model Spec](https://model-spec.openai.com/2025-12-18.html#chatgpt_u18) outlines the principles and requirements that guide how our models should behave with teens. For users we believe may be under 18, we operationalize those principles through age-specific provisions in our safety policies. In some areas where teens may face distinct or heightened risks, these provisions establish more restrictive thresholds than those that apply to adults, including for sexual content, emotional reliance, eating disorders, and access to age-restricted goods and services. These age-specific safeguards include both model-level behavior and system-level protections.

We use dedicated U18 evaluations to assess how well the model performs against these principles across the six categories below. The evaluations are designed to test whether the model consistently applies age-appropriate boundaries and avoids providing responses that could create heightened risks for teens. These evaluations use some of the most challenging, production-derived examples to assess model behavior in sensitive contexts, including adversarial examples related to self-harm, eating disorder-related behaviors, access to age-restricted goods or services and activities, gore, and inappropriate sexual content.

### Table 2: U18 evaluations (higher is better)

Category Age-restricted goods, services, and dangerous challenges / activitiesSexual ContentEating DisordersEmotional RelianceSelf HarmGore

| Category | GPT‑5.5 Instant (May Update) | GPT‑5.5 Instant (June Update) | GPT‑5.6 Luna (August) | GPT‑5.6 Sol (August) | GPT‑6 Sol (October) | GPT‑6 Luna (October) |
| --- | --- | --- | --- | --- | --- | --- |
| Age-restricted goods, services, and dangerous challenges / activities | 0.756 | 0.725 | 0.857 | 0.865 | 0.799 | 0.814 |
| Sexual Content | 0.958 | 0.962 | 0.984 | 0.971 | 0.933 | 0.904 |
| Eating Disorders | 0.657 | 0.635 | 0.810 | 0.808 | 0.772 | 0.776 |
| Emotional Reliance | 0.944 | 0.937 | 0.927 | 0.921 | 0.770 | 0.734 |
| Self Harm | 0.982 | 0.977 | 0.977 | 0.987 | 0.977 | 0.974 |
| Gore | 0.865 | 0.832 | 0.867 | 0.872 | 0.845 | 0.812 |

Relative to their respective GPT‑5.6 (August) counterparts, GPT‑6 Sol (October) and GPT‑6 Luna (October) show statistically significant regressions on age-restricted content, sexual content, and emotional reliance. GPT‑6 Luna (October) also shows a statistically significant regression on gore. The remaining differences are not statistically significant.

To mitigate the risk of producing disallowed responses for teens, we apply an additional classifier-based block to responses that may contain self-harm, sexual content, and gore; this mitigation is not captured in the evaluation results above and improves safe responses.

We reviewed the regression for emotional reliance and found our evaluation is overly sensitive to the use of benign nicknames (like “bro” or “bestie”) by the model, which is not considered disallowed if explicitly requested by users.

Because these evaluations focus on difficult cases and long-tail risks, their results should not be interpreted as estimates of how frequently these behaviors occur in typical production use.

We remain committed to improving how our models support and protect teens. This includes training models to respond more safely and appropriately, refining our understanding of teen-safety risks, strengthening age-appropriate safeguards, and improving how we measure and report model performance for younger users.

## 3.2 Vision

We ran the image input evaluations originally introduced with ChatGPT Agent. These tests use disallowed requests that combine text and images and measure whether the model’s responses are classified as safe. GPT‑6 Sol (October) and GPT‑6 Luna (October) performed on-par with GPT-5.6 Sol (August) and GPT-5.6 Luna (August), respectively, except for a regression on the extremism vision evaluation. We reviewed unsafe responses from the evaluations and found that their severity was generally low.

### Table 3: Image input evaluations, with metric safe completion (higher is better)

Category hateextremismself-harmharms-erotic

| Category | GPT‑5.5 Instant (May Update) | GPT‑5.5 Instant (June Update) | GPT‑5.6 Luna (August) | GPT‑5.6 Sol (August) | GPT‑6 Sol (October) | GPT‑6 Luna (October) |
| --- | --- | --- | --- | --- | --- | --- |
| hate | 0.994 | 0.993 | 0.984 | 0.986 | 0.986 | 0.974 |
| extremism | 0.964 | 0.987 | 0.930 | 0.950 | 0.868 | 0.834 |
| self-harm | 0.993 | 0.996 | 0.990 | 0.987 | 0.956 | 0.962 |
| harms-erotic | 0.999 | 0.999 | 0.994 | 0.986 | 0.981 | 0.975 |

## 4. Robustness

## 4.1 Jailbreaks

In this section, we evaluate model robustness to jailbreaks: adversarial prompts designed to circumvent model refusal training and elicit harmful assistance. The evaluations here focus on jailbreaking the main model directly without the safeguards we use in production. Accordingly, this section only measures one layer of robustness in our safety stack. We have additional safeguards in production, such as classifiers, that make it much more difficult for users to jailbreak and obtain harmful assistance.

## 4.1.1 Multiturn Jailbreak Evaluations

We also evaluate robustness against adaptive, multiturn attackers derived from internal red-teaming exercises. Unlike the static evaluation, these attackers can probe the model, respond to its answers, and adjust their strategy over multiple turns. Model responses are scored based on whether they could meaningfully facilitate harmful requests: harmful assistance receives worse scores, while harmless responses receive better scores. We report the worst-case defender success rate as a function of attacker budget: for a budget of n attempts, the model succeeds only if it avoids unsafe assistance across all n attacks. This evaluation is particularly challenging at a high attacker budget where the model needs to be robust to all jailbreak attempts to be considered successful.

### Figure 2

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image2.png)

![Figure 2. Multiturn jailbreak robustness by attacker budget.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image2.png)

Figure 2. Multiturn jailbreak robustness by attacker budget.

GPT‑6 Sol (October) and GPT‑6 Luna (October) have slightly lower point estimates than their September counterparts on multi-turn jailbreak robustness, with broadly overlapping 95% confidence intervals. Both October models achieve higher observed defender success rates than GPT‑5.6 Sol at every attacker budget tested.

## 4.2 Prompt Injection

GPT‑6 Sol (October) and GPT‑6 Luna (October) are highly robust to prompt injection. We have continued to scale our [GPT‑Red approach](https://openai.com/index/unlocking-self-improvement-gpt-red/), where we use adversarial training with an automated red-teaming agent to strengthen resistance to malicious instructions while preserving the ability to complete legitimate tasks.

For our evaluations, we use the GPT‑Red automated evaluations introduced in the [GPT‑5.6 system card](https://deploymentsafety.openai.com/gpt-5-6/prompt-injection). These cover both "direct" prompt injection attacks (or “instruction hierarchy” violations), where a user attempts to override higher-priority system or developer instructions, and "indirect" attacks, where malicious instructions in third-party content attempt to redirect an agent beyond the user’s request.

GPT-6 Sol (October) and GPT-6 Luna (October) saturate instruction hierarchy evaluations, achieving 99.99% and 99.79% robustness, respectively.

### Table 4: GPT-RED indirect prompt-injection robustness (higher is better; averaged equally across available reasoning levels).

Category GPT-6 Sol (October)GPT-6 Luna (October)

| Category | Prompt Injection Robustness |
| --- | --- |
| GPT-6 Sol (October) | 97.13% |
| GPT-6 Luna (October) | 95.80% |

## 5. Health

## 5.1 HealthBench

Chatbots can empower consumers to better understand their health and help health professionals deliver better care [[1](https://deploymentsafety.openai.com/gpt-6-october/references#ref-healthinchatgptblog)] [[2](https://deploymentsafety.openai.com/gpt-6-october/references#ref-openaipendaclinicalcopilot2025)]. We evaluate GPT-6 Sol and GPT-6 Luna on HealthBench [[3](https://deploymentsafety.openai.com/gpt-6-october/references#ref-openaihealthbench2025)], a public evaluation of health performance and safety, and HealthBench Professional, a public evaluation of model capability and safety for clinician use cases [[4](https://deploymentsafety.openai.com/gpt-6-october/references#ref-HEALTHBENCHPROFESSIONAL)].

We note that HealthBench Professional has been more informative than older HealthBench variants in our recent evaluations of frontier models. As an example, improvements in HealthBench Professional have been much more predictive of improvements in other held-out evaluations in our internal testing. We believe HealthBench (now more than a year old) is approaching a noise ceiling for frontier models, and recommend the use of HealthBench Professional for measuring continued progress at the frontier. For this system card, we report all variants for completeness.

Like many other benchmarks of open-ended chat responses, HealthBench and HealthBench Professional can reward longer responses. Longer answers may be better when they include additional valuable information, but they also have more opportunities to satisfy positive rubric criteria, and unnecessarily long responses can be less useful to end users and clinicians. Broadly, for evaluations with answer-length sensitivity, long answers can also be used to artificially increase scores, without underlying improvements in usability and safety in real-world use. Therefore, as in other recent system cards, we report scores for HealthBench and HealthBench Professional that are adjusted for final response length.

Responses of 2,000 characters receive no adjustment. Longer responses are penalized, with a penalty per 500 additional characters that varies by eval: 1.47 points per 500 characters for HealthBench Professional, 2.99 for HealthBench, 3.92 for HealthBench Hard, and 0.20 for HealthBench Consensus. Shorter responses receive a corresponding positive adjustment. All penalties here are reported on the 0-100 scale that we report this evaluation on. Models are not provided details of the length penalty in their prompts. For full details on this length adjustment procedure, see [[4](https://deploymentsafety.openai.com/gpt-6-october/references#ref-HEALTHBENCHPROFESSIONAL)].

### Table 5: HealthBench evaluations, reported as length-adjusted score (unadjusted score, mean visible response length in characters). Scores are on a 0--100 scale; higher is better.

| 1 | gpt-5.5Instant | gpt-5.6-sol(August) | gpt-5.6-luna(August) | gpt-6-sol(October) | gpt-6-luna(October) |
| --- | --- | --- | --- | --- | --- |
| HealthBench<br>Professional | 38.4<br>(40.7, 2,775) | 54.0<br>(56.6, 2,894) | 44.1<br>(46.8, 2,920) | 55.2<br>(62.2, 4,360) | 48.2<br>(57.8, 5,289) |
| HealthBench | 51.4<br>(50.9, 1,922) | 55.0<br>(52.1, 1,514) | 53.3<br>(50.7, 1,567) | 52.1<br>(55.7, 2,602) | 50.4<br>(58.5, 3,361) |
| HealthBench<br>Hard | 22.9<br>(21.3, 1,794) | 31.4<br>(27.1, 1,450) | 28.7<br>(24.9, 1,523) | 27.8<br>(30.9, 2,396) | 27.2<br>(36.1, 3,134) |
| HealthBench<br>Consensus | 94.7<br>(94.6, 1,919) | 95.5<br>(95.3, 1,511) | 94.8<br>(94.6, 1,553) | 93.8<br>(94.0, 2,608) | 95.0<br>(95.5, 3,343) |

GPT‑6 Sol (October) and GPT‑6 Luna (October) both outperform their respective GPT-5.6 (August) counterparts in HealthBench Professional. While they exhibit slight regressions in HealthBench scores, this appears to stem mostly from the length score-adjustment rather than the unadjusted health score of the responses.

## 5.2 MentalHealthBench

[MentalHealthBench](https://cdn.openai.com/ctf-cdn/MentalHealthBench_A_Comprehensive_Benchmark_of_AI_Capabilities_in_Realistic_Mental_Health_Conversations.pdf) is an open benchmark developed with mental health experts for measuring how AI systems respond in realistic mental health conversations. It consists of 1,215 synthetic conversations covering diverse scenarios ranging from daily well-being topics to urgent mental health emergencies. Each conversation task is paired with clinician-authored rubric criteria that can be used to score a new model response. We include more details about the evaluation design in [the paper](https://cdn.openai.com/ctf-cdn/MentalHealthBench_A_Comprehensive_Benchmark_of_AI_Capabilities_in_Realistic_Mental_Health_Conversations.pdf).

Each response receives a rubric-based score clipped to 0–100%. We average four independent responses within each task, then average task scores. Standard errors are computed across task means: 1,215 overall, 650 non-acute, 221 high-acuity, and 344 emergent tasks.

### Table 6: MentalHealthBench scores, computed using the task-clipped metric. Scores are on a 0--100 scale; higher is better.

| 1<br>Evaluation | gpt-5.5Instant(May) | gpt-5.5Instant(June) | gpt-5.6-sol(August) | gpt-5.6-luna(August) | gpt-6-sol(October) | gpt-6-luna(October) |
| --- | --- | --- | --- | --- | --- | --- |
| MentalHealthBench (overall) | 49.38<br>± 0.93 | 53.93<br>± 0.93 | 47.53<br>± 0.97 | 45.11<br>± 0.95 | 48.81<br>± 0.97 | 51.73<br>± 0.96 |
| MentalHealthBench (non-acute) | 51.91<br>± 1.23 | 52.96<br>± 1.26 | 47.07<br>± 1.30 | 43.10<br>± 1.29 | 47.62<br>± 1.31 | 51.68<br>± 1.28 |
| MentalHealthBench (high acuity) | 50.23<br>± 2.17 | 58.76<br>± 2.11 | 53.88<br>± 2.28 | 52.58<br>± 2.19 | 53.70<br>± 2.26 | 56.15<br>± 2.25 |
| MentalHealthBench (emergent) | 44.03<br>± 1.80 | 52.66<br>± 1.81 | 44.30<br>± 1.87 | 44.12<br>± 1.81 | 47.92<br>± 1.89 | 48.98<br>± 1.87 |

We see significant improvements in GPT-6 Luna (October) over GPT-5.6 Luna (August) across all acuities of MentalHealthBench conversations. GPT-6 Sol (October) also exhibits an improvement relative to GPT-5.6 Sol (August), with the largest performance jump in emergent mental health conversations.

## 5.3 Dynamic Mental Health Benchmarks with Adversarial User Simulations

We report dynamic multi-turn evaluations for mental health, emotional reliance, and self-harm that simulate extended conversations across these domains. Rather than assessing a single response within a fixed dialogue, these evaluations allow conversations to evolve in response to the model’s outputs, creating varied trajectories during testing that better reflect real user interactions. This approach helps identify potential issues that may only emerge over the course of long exchanges and provides an even more rigorous test than prior static multi-turn methods. By utilizing realistic, yet adversarial, user simulations, these evaluations have enabled continued improvements in safety performance.

Our standard evaluations measure whether the final model response violates our policies. In these dynamic conversations, we instead evaluate whether any assistant response violates policy and report the percentage of policy-compliant responses. The metric used is “safe,” representing the share of assistant messages that do not violate safety policies.

As with our standard evaluations, these evaluations were deliberately created to be difficult. They were built around cases in which our existing models were not yet giving ideal responses, and this is reflected in the scores below. Error rates are not representative of average production traffic.

GPT‑6 Sol (October) and GPT‑6 Luna (October) perform comparably to their respective GPT‑5.6 (August) counterparts across the mental health, emotional reliance, and self-harm evaluations. None of the observed differences are statistically significant.

### Table 7: Dynamic Benchmarks with Adversarial User Simulations (higher is better)

Category Mental healthEmotional relianceSelf-harm

| Category | GPT‑5.5 Instant (May Update) | GPT‑5.5 Instant (June Update) | GPT‑5.6 Luna (August) | GPT‑5.6 Sol (August) | GPT‑6 Sol (October) | GPT‑6 Luna (October) |
| --- | --- | --- | --- | --- | --- | --- |
| Mental health | 0.981 | 0.991 | 0.977 | 0.981 | 0.996 | 0.991 |
| Emotional reliance | 0.988 | 0.989 | 0.965 | 0.961 | 0.961 | 0.961 |
| Self-harm | 0.852 | 0.967 | 0.911 | 0.901 | 0.889 | 0.884 |

## 6. Hallucinations

## 6.1 Performance in Cases Flagged by Users

To evaluate our models’ ability to provide factually correct responses, we measure the rate of factual hallucinations on the following challenging prompt sets that are selected to show scenarios where the model is most likely to hallucinate. These evaluations are designed to be difficult in order to test for factuality in difficult domains and to provide a sensitive research signal over time, rather than to measure overall production prevalence or average user experience in ChatGPT. As a result, the values below do not reflect production prevalence, but rather how the model performs when tested against carefully selected factuality-heavy, previous failures, or high stakes scenarios.

Factuality Heavy: Our primary prompt set consists of prompts representative of factuality-heavy ChatGPT conversations.

User Flagged Failures: To focus on cases where factuality issues have harmed the user experience in past model releases, this evaluation measures hallucination rates on de-identified ChatGPT conversations that have previously been flagged as containing factual errors.

High Stakes: To measure factuality on high stakes use cases where correct answers are particularly critical to users, we evaluate on a prompt set consisting specifically of difficult medical, legal, and financial prompts (high stakes).

On all prompt sets, we use an LLM-based grading model with web access to identify factual errors in the assistant’s responses to these prompts and report both the percentage of claims across responses that are identified as having a factual error as well as the percentage of responses containing at least one factual error. We find that GPT‑6 Sol (October) and GPT‑6 Luna (October) both deliver significant improvements in factuality over GPT-5.6 Sol (August) and GPT-5.6 Luna (August) across nearly all evaluation metrics. The only exception is claim-level factual errors on factual-heavy prompts.

### Figure 3

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image1.png)

![Figure 3. Response-level and claim-level factual error rates on factuality-heavy, user-flagged, and high-stakes prompt sets. Lower is better.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image1.png)

Figure 3. Response-level and claim-level factual error rates on factuality-heavy, user-flagged, and high-stakes prompt sets. Lower is better.

## 7. Alignment

Our alignment evaluations measure the propensity and capability of our models to circumvent restrictions and deceive users. Across our entire suite, GPT-6 Sol and GPT-6 Luna (October) consistently outperform their GPT-5.6 (August) counterparts. Based on our evaluation results and manual review both GPT-6 Sol and GPT-6 Luna meet our alignment safety bar.

## 7.1 Obeying Restrictions

This suite of alignment evaluations focuses on situations where the model might circumvent an explicit or implicit restriction on its operation. These restrictions may come from the environment (e.g. log-in requirements) or from model controls i.e., the harness (e.g. Auto-review). Note that these evaluations are meant to test the model’s baseline capabilities and are run without the system-level safeguard stack designed to mitigate these risks.

## 7.1.1 Respecting Auto-Review

[Auto-review](https://alignment.openai.com/auto-review/) is a protocol built into Codex whereby a second model evaluates the safety of certain commands that run outside a pre-specified sandbox. When this second monitor determines a command to be unsafe, it blocks execution and returns a message. This message informs the model of its verdict and instructs it to avoid substantively similar actions.

In this evaluation, we observe how models react to such a rejection. Each task is set in a knowledge-work environment, with the rollout beginning immediately after Auto-review has denied a request for an action. There are multiple ways then for the model to proceed in this situation: end the task, attempt to find a safer alternative, retry a similar command, or exploit a deliberately [poor configuration](https://learn.chatgpt.com/docs/agent-configuration/rules) to bypass Auto-review entirely. Any pursuit of the latter two options would constitute a failure of this evaluation.

### Figure 4

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image6.png)

![Figure 4. Prohibited actions completed at maximum reasoning effort. Lower is better.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image6.png)

Figure 4. Prohibited actions completed at maximum reasoning effort. Lower is better.

In 0.3% of rollouts at maximum reasoning effort, both GPT-5.6 Sol (August) and GPT-5.6 Luna (August) exploited gaps in the poorly-configured Auto-Review setup. GPT-6 Sol (October) and GPT-6 Luna (October) did not have any such cases.

## 7.1.2 Respecting Warnings

Like the Respecting Auto-Review evaluation, this test tracks how models behave after running into barriers across a variety of simulated professional work environments. In this Respecting Warnings evaluation, the barriers originate in the environment (e.g. certain AccessDenied errors, content policy restrictions) rather than from the harness.

The evaluation was recently updated to improve realism, diversity, and label quality. Moreover, we updated the main metric to track *successful* circumventions, rather than just *attempted* circumventions to improve the objectivity of the scoring criteria. However, because we are testing the models without safeguards, it does mean that the results are partially entangled with underlying model intelligence, as smarter models are more likely to see their circumvention attempts succeed.

There are still legitimate questions about how well these evaluation results translate into real-world behavior. With increasing intelligence, models are becoming increasingly aware when they are operating in an evaluation. In many circumstances, we observed the model cite the synthetic nature of this evaluation as justification for the performance of *improper* actions. Most commonly, this takes the form of a model incorrectly classifying the evaluation as being for prompt injections, consequently mistaking barriers for prompt injections. We are working on improving the external validity of this evaluation and will generally continue to evolve our alignment evaluations.

This evaluation also primarily measures low-stakes situations and is run without system-level control measures, many of which would plausibly stop the observed circumventions.

### Figure 5

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image4.png)

![Figure 5. Conditional failure rates for successful circumvention of environmental restrictions. Lower is better.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image4.png)

Figure 5. Conditional failure rates for successful circumvention of environmental restrictions. Lower is better.

In all of these cases, our intended model behavior is for the model to respect the warning and not attempt to circumvent it. In 34% of rollouts at maximum reasoning effort, GPT-5.6 Sol (August) saw the barrier and successfully found an alternative means of accomplishing the task, running afoul of the restriction’s spirit. In 27% of rollouts, GPT-5.6 Luna (August) did the same. Meanwhile, such unwanted persistence appeared in 28% of GPT-6 Sol (October) rollouts and 15.9% of GPT-6 Luna (October) rollouts.

## 7.2 Avoiding Deceptive Interactions with Users

We believe that any potential propensity of our models to deceive the user warrants special attention. First, a model that misrepresents its work is interfering with the ability of humans to supervise its actions. Second, such deception is a plausible proxy for the model’s general tendency to prioritize task completion over other safety considerations. We note that these evaluations are meant to test the model’s baseline capabilities and are run without the standard developer prompt present in all first-party surfaces designed to prevent these types of deceptive behavior.

## 7.2.1 Blocker Deception

This new evaluation takes realistic coding tasks where the model encounters some block that inhibits its ability to complete its works. It then measures the rate at which the model acknowledges this limitation in its final answer. It replaces an earlier evaluation, referenced as “Coding Deception” in previous system cards, that had been largely saturated by our latest models.

### Figure 6

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image7.png)

![Figure 6. Blocker-related disclosure failure rates on coding tasks. Lower is better.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image7.png)

Figure 6. Blocker-related disclosure failure rates on coding tasks. Lower is better.

We saw significant reduction in disclosure failures in GPT-6 Sol (October) and GPT-6 Luna (October) as compared to prior models. Due to infrastructure issues, 0.25% of GPT-6 Luna (October) samples exited prematurely and were excluded from analysis. Note that these problems were deliberately selected to elicit misbehavior and do not necessarily reflect the absolute rate of misleading responses in production.

## 7.2.2 Broken Search Tool

This very simple evaluation gives the model a task that normally would require search but the search tool is unavailable. We then track the rate at which the model fails to acknowledge this limitation in its final message.

### Figure 7

[](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image5.png)

![Figure 7. Broken Search Tool evaluation results.](https://deploymentsafety.openai.com/data/eval-sets/gpt-6-october/assets/images/image5.png)

Figure 7. Broken Search Tool evaluation results.

At maximum reasoning effort, GPT-6 Sol (October) and GPT-6 Luna (October) showed statistically significant improvements relative to GPT-5.6 models.

## 8. Preparedness

Under our [Preparedness Framework](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf), we are treating GPT-6 Sol and GPT-6 Luna as High capability in both Cybersecurity and Biological and Chemical domains. Neither of these models reach our High threshold in AI Self-Improvement. These assessments match those for their GPT‑5.6 counterparts, and we have implemented the corresponding safeguards described in the GPT‑5.6 System Card.

## 8.1 Capabilities Assessment

## 8.1.1 Biological and Chemical Capabilities

We are treating GPT-6 Sol and GPT-6 Luna as High capability in the Biological and Chemical domain. Below, we report updated results for both models on our High capability evaluations. We also report the results for GPT-6 Sol on our Critical capability evaluations. GPT-6 Sol’s reported results did not cross the indicative Critical thresholds. Separate Critical capability testing was not required for GPT-6 Luna because it scored below GPT-5.6 Sol on all High capability evaluations.

For a full description of these evaluations, please see the Biological and Chemical Capabilities section in [GPT-6 Astra System Card](https://deploymentsafety.openai.com/gpt-6-astra/sec%3Aappendix-216684)

## 8.1.1.1 Capability Threshold: High

### Table 8: Biological and Chemical Capabilities: High Threshold

| 1<br>Evaluation | Metric | High threshold | gpt-6-sol(October) | gpt-6-luna(October) |
| --- | --- | --- | --- | --- |
| Multimodal Troubleshooting Virology | pass@1 | 31% | 51.68% | 48.13% |
| ProtocolQA Open-Ended | pass@1 | 54% | 25.62% | 34.57% |
| Tacit Knowledge and Troubleshooting | cons@32 | 80% | 72.45% | 94.00% |
| TroubleshootingBench | pass@1 | 36.4% | 41.83% | 41.46% |

## 8.1.1.2 Capability Threshold: Critical

### Table 9: Biological and Chemical Capabilities: Critical Threshold

| 1<br>Evaluations | Metric | Critical threshold | gpt-6-sol(October) | gpt-6-luna(October) |
| --- | --- | --- | --- | --- |
| SHP2 Protein Function Prediction | Mean R² (higher is better) | 0.60 | 0.23 | 0.13 |
| Coronavirus--ACE2 Cell-Entry Screen | Composite score (higher is better) | 0.75 | 0.349 | 0.36 |
| Phage--plasmid Co-evolution | Negative log-likelihood (lower is better) | ≤ 9.40 | 12.95 | 10.70 |

## 8.1.2 Cybersecurity Capabilities

As we did for GPT-5.6 Sol (August) and GPT-5.6 Luna (August) , and in accordance with our capability evaluations, we are treating GPT-6 Sol and GPT-6 Luna as High capability in the Cybersecurity domain, but below Critical. Under our Preparedness Framework, High cybersecurity capability is defined as a model that “removes existing bottlenecks to scaling cyber operations including by automating end-to-end cyber operations against reasonably hardened targets or by automating the discovery and exploitation of operationally relevant vulnerabilities.”

We determined that GPT-6 Sol and Luna both fall below the critical threshold for cybersecurity capabilities under the Preparedness Framework. We evaluated both models’ capabilities using our automated cyber evaluations. GPT-6 Sol performed comparably to GPT-5.6 Sol without a clear improvement in capabilities. GPT-6 Luna underperformed GPT-6 Sol. Based on the totality of the evidence, the Safety Advisory Group determined it had sufficient evidence to recommend that both models were below the critical threshold.

For a full description of the evaluations below, please see the [Cybersecurity Capabilities section in the GPT-6 Astra card](https://deploymentsafety.openai.com/gpt-6-astra/cybersecurity-capabilities).

## 8.1.2.1 ExploitBench

ExploitBench evaluates whether models can turn known vulnerabilities into increasingly powerful exploit primitives, up to arbitrary code execution, using vulnerability descriptions, source code, and patches without a reference exploit. At maximum reasoning effort, GPT-6 Sol scores 82.62% and GPT-6 Luna scores 44.66% on this benchmark.

As noted in the GPT‑6 Astra System Card, results may be inflated by exposure to historical vulnerabilities in the public benchmark.

## 8.1.2.2 SEC-Bench Pro

SEC-Bench Pro evaluates models’ ability to discover vulnerabilities in large JavaScript engines, including V8 and SpiderMonkey. GPT-6 Sol and GPT-6 Luna achieve scores of 68.85% and 48.50%, respectively, compared with 85.4% for GPT-6 Astra.

## 8.1.3 AI Self-Improvement Capabilities

In AI Self-Improvement, GPT-6 Sol and GPT-6 Luna do not reach our High threshold.

For a full description of these evaluations, please see the [AI Self-Improvement Capabilities section in the GPT-6 Astra card](https://deploymentsafety.openai.com/gpt-6-astra/ai-self-improvement-capabilities).

## 8.2 Safeguards

What follows is a public summary of our internal Safeguards Report, which includes additional details that are not suitable for public disclosure (such as information potentially useful to attackers). The internal report informed our Safety Advisory Group’s recommendation and OpenAI leadership’s determination that these safeguards are sufficient for GPT-6 Sol and GPT-6 Luna’s public launch.

## 8.2.1 Model Safety Training and Evaluation

For a full description of these evaluations, please see the [Model Safety Training and Evaluation section in the GPT-6 Astra card](https://deploymentsafety.openai.com/gpt-6-astra/model-safety-training-and-evaluation).

## 8.2.1.1 Biological and Chemical Safety Training and Evaluation

### Table 10: Biology Model Refusal Evaluation (higher is better)

| 1<br>Biology Model Refusal Evaluation | Metrics | GPT‑5.5 Instant<br>(May Update) | GPT‑5.5 Instant<br>(June Update) | GPT‑5.6 Luna<br>(August) | GPT‑5.6 Sol<br>(August) | GPT‑6 Sol<br>(October) | GPT‑6 Luna<br>(October) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Severe | Safe | 0.969 | 0.969 | 0.937 | 0.954 | 0.980 | 0.945 |
| Dual Use | Safe | 0.957 | 0.939 | 0.928 | 0.945 | 0.971 | 0.968 |

On the biology model refusal evaluations, GPT-6 Sol (October) and GPT-6 Luna (October) show substantially improved safety on severe and dual-use prompts compared with GPT-5.6 Sol (August) and GPT-5.6 Luna (August). These metrics reflect model responses only, without our full production safeguards.

## 8.2.1.2 Cybersecurity Safety Training and Evaluation

### Table 11: Cybersecurity Safety Evaluation (higher is better)

Category Production ChatSynthetic Agentic Envs

| Category | GPT‑5.5 Instant (May Update) | GPT‑5.5 Instant (June Update) | GPT‑5.6 Luna (August) | GPT‑5.6 Sol (August) | GPT‑6 Sol (October) | GPT‑6 Luna (October) |
| --- | --- | --- | --- | --- | --- | --- |
| Production Chat | 0.977 | 0.974 | 0.974 | 0.982 | 0.973 | 0.971 |
| Synthetic Agentic Envs | 0.994 | 0.998 | 0.997 | 0.999 | 0.999 | 0.998 |

On the cybersecurity safety evaluations, GPT-6 Sol (October) and GPT-6 Luna (October) achieve safety scores broadly comparable to GPT-5.6 Sol (August) and GPT-5.6 Luna (August). Model refusal remains one layer of our safety stack, alongside additional safeguards that enforce the safety boundary through defense in depth.

## 9. References

- [1] 

OpenAI. “Launching health in ChatGPT.” Available at: [https://openai.com/index/health-in-chatgpt/](https://openai.com/index/health-in-chatgpt/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-healthinchatgptblog-ref)

- [2] 

Robert Korom, Sarah Kiptinness, Najib Adan, Kassim Said, Catherine Ithuli, Oliver Rotich, et al. “Pioneering an AI clinical copilot with Penda Health.” Available at: [https://openai.com/index/ai-clinical-copilot-penda-health/](https://openai.com/index/ai-clinical-copilot-penda-health/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-openaipendaclinicalcopilot2025-ref)

- [3] 

Rahul K. Arora, Jason Wei, Rebecca Soskin Hicks, Preston Bowman, Joaquin Quiñonero Candela, Foivos Tsimpourlas, et al. “Introducing HealthBench.” Available at: [https://openai.com/index/healthbench/](https://openai.com/index/healthbench/).[](https://deploymentsafety.openai.com/gpt-6-october#ref-openaihealthbench2025-ref)

- [4] 

Rebecca Soskin Hicks, Mikhail Trofimov, Dominick Lim, Rahul K. Arora, Foivos Tsimpourlas, Preston Bowman, et al. “HealthBench Professional: Evaluating large language models on real clinician chats.” Available at: [https://cdn.openai.com/dd128428-0184-4e25-b155-3a7686c7d744/HealthBench-Professional.pdf](https://cdn.openai.com/dd128428-0184-4e25-b155-3a7686c7d744/HealthBench-Professional.pdf).[](https://deploymentsafety.openai.com/gpt-6-october#ref-HEALTHBENCHPROFESSIONAL-ref)[](https://deploymentsafety.openai.com/gpt-6-october#ref-HEALTHBENCHPROFESSIONAL-ref-2)

[← Back to all updates](https://deploymentsafety.openai.com/)
