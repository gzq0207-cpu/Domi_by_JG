<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_211a491009972877"
title: "高带宽闪存即将到来"
domains: ["算力芯片"]
subdomains: ["存储芯片与HBM"]
types: ["行业认知","视频"]
companies: "Sandisk,SK hynix,Micron,Samsung,Google,Tenstorrent,Intel"
published_at: "2026-09-23T16:00:00.000Z"
importance: 7
confidence: 6
evidence_status: "二手报道"
worth_following: true
source_url: "https://www.youtube.com/watch?v=3nTpW52nioI"
source: "YouTube·Asianometry"
---

# 高带宽闪存即将到来

## 行业认知文章

- 行业：算力芯片
- 公司：Sandisk,SK hynix,Micron,Samsung,Google,Tenstorrent,Intel
- 来源：YouTube·Asianometry · [原文链接](https://www.youtube.com/watch?v=3nTpW52nioI)
- 发布时间：2026-09-23
- 原文存档：本文下方「原文存档」章节

## 摘要

【核心观点】HBM 之外的新存储层级"高带宽闪存（HBF，High Bandwidth Flash）"正在成型：用先进封装把 NAND 闪存按 HBM 的方式堆叠互连，单堆栈容量达 HBM4 的 8-16 倍，有望成为 AI 推理"温数据"（读多写少）的载体；它不是 HBM 的替代者而是伴随者。
【关键事实】背景：推理分 Prefill（算力受限）与 Decode（访存受限）两个阶段，模型权重与 KV Cache 双双膨胀——Kimi K3 总参数 2.8T（8bit 下约 2.8TB）、DeepSeek V3 为 671GB；百万 token 上下文的长时 Agent 让 KV Cache 更加巨大。Hot Chips 2026 上 SemiAnalysis 分析师当面质疑 HBM 堆叠稀释带宽：单芯片内部约 20TB/cm² 的带宽，20 层堆叠后每层只剩约 1/20；Intel 前 CEO Gelsinger 称 HBM 是"lousy memory"，SK hynix 副总裁 Kim Ho-sik 部分认同并称 HBM 不是 Memory Wall 的最终答案。HBF 规格：单堆栈 512GB（对比 HBM4 约 36GB），有效带宽最高 3TB/s（高于 Micron HBM3E 的 1.2TB/s、接近 HBM4）；代价是写入/编程比 DRAM 慢约两个数量级、耐久仅数千次擦写、功耗发热更大。产业进展：Sandisk 2025年2月投资者日发布 HBF（首个专利于2024年5月申请）；2025年8月与 SK hynix 签 MOU 共同定标（DRAM/NAND 对手结盟换生态与第二货源），Google 与 Tenstorrent 加入联盟，David Patterson、Raja Koduri 任技术顾问；2026年8月 OCP 发布 0.7.0 版公开规格；三星有类似方案 zNAND-O。落地定位：与 HBM 并排放置在 interposer 上放"温数据"，主流观点认为适合放模型权重（也有人提议 KV Cache）；北大学者论文指出 HBF 不是 SSD 的 drop-in、需精细软件分层，MoE 模型（只读部分 expert）被认为更适配。时间表：SEMICON Taiwan 披露 POC/工程样品约 2027 年底、2029 年量产。作者以 Intel Optane 教训作结：技术先进≠商业成功，控制器/软件生态/GTM 都可能翻车——而 Sandisk 负责 HBF 的 CTO Alper Ilkbahar 恰是前 Intel Optane 集团 VP/GM。

## 值得关注的信号

【值得关注的信号】存储墙正在催生 HBM 之外的增量市场：Sandisk-SK hynix 联盟 + Google/Tenstorrent 入局值得持续跟踪；HBF 若 2027-2029 年落地将改变超大模型推理的成本结构（权重下沉到闪存层），对 MoE 与读密集负载尤其利好。Optane 失败史提示判断需盯软件生态与执行兑现而非容量/带宽纸面指标；国内先进封装与存算/近存方向的厂商存在结构性对标机会。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"c04a7d4a271d734e7dbe2d4b349019842dfe552a574c622ab71f487c0e1fb5d9","translationSha256":"cfe83f044708550f9d8771e3d2c07cbdd08872c7742a15c9e8299eecc08007a1","sourceCharacters":21352,"timestampValues":0,"timestampOrderVerified":true,"englishProseChecked":true} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

- 链接：https://www.youtube.com/watch?v=3nTpW52nioI
- 频道：Asianometry
- 发布日期：2026-09-24
- 时长：20分53秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

链接：
- Patreon（直接支持本频道！）：https://www.patreon.com/Asianometry
- X：https://twitter.com/asianometry
- 新闻通讯与播客（可通过 Stratechery Plus 收听）：https://asianometry.passport.online/
- LinkedIn（欢迎联系）：www.linkedin.com/in/jon-y-asianometry

## 全文

我得跟你说实话。上个月去湾区之前，我从没听说过“decode”“prefill”或“KV Cache”这些词。后来我去参加 Hot Chips，这些术语就劈头盖脸地砸了过来。现在，就像 11:11（许个愿），我到处都能看到它们。这简直是极致版的巴德尔-迈因霍夫现象。不过，Prefill、Decode 和 KV Cache 都关系到为这些不断增长的模型提供服务时面临的重大技术挑战。内存厂商——刚从 HBM 盛宴中满载而归——为应对这些挑战，推出了一种名字很酷的新东西：高带宽闪存，简称 HBF。

HBF 很酷，但是……它会用来做什么？在今天的视频里，我们来聊聊一个潜在的 HBM 挑战者和/或搭档：高带宽闪存。

## 起源

要理解人们为什么关心高带宽闪存，我们得先看看两个趋势。第一个主要趋势与 AI 推理有关。我先来解释一下视频开头简短提到的那三个术语。你当然可以找到很多有趣又深入的讲解——或者直接问 ChatGPT——不过，下面是我的解释。Prefill 和 Decode 描述了某一种推理中的两种重要计算模式。

在 Prefill 阶段，模型会处理输入内容——其中可能包括用户提示词、系统提示词、先前的回复、蒙大拿州、工具调用、图像、音频以及内部思维链。GPU、NPU、推理 ASIC、TPU、Neural Engine、LPU，或者其他任何设备，都必须并行关注所有这些内容，因为它们都会影响提示词的含义。“注意力”当然就是那篇具有变革意义的 Transformer 论文中提出的概念；它引发了一百万个蹩脚的“X 才是一切所需”双关语。

注意力机制会为每个 token 生成一个 Query、Key 和 Value 向量——后两者会写入缓存。因此在 Prefill 阶段结束时，你会得到一个包含输入内容的 KV Cache，而这正是计算回复第一个 token 所需的。接下来是 Decode 阶段，我们会查阅 KV Cache 来生成回复的其余部分——一次输出一个 token。每个新生成 token 的 Key 和 Value 都会插入 KV Cache。KV Cache 能让 LLM 不必每次都浪费时间和算力，重新计算所有先前输入的注意力，

不必每次都重新计算所有先前输入的注意力。你可以把它看作模型在当前对话中的工作笔记。这里需要注意，Prefill 和 Decode 是截然不同的任务。前者受限于你拥有多少算力，因为整个过程可以并行完成。后者则一次处理一个，因此更受内存限制。GPU 的逻辑电路会浪费时间，等待从内存加载数据。

## 培育 MASS

眼下，内存行业正面临两类以指数级速度增长的技术需求。

第一类是模型权重不断增长。最新的大型模型 Kimi K3 总参数量为 2.8 万亿。在 8 位精度下，它的权重约为 2.8 TB。这比参数量仅有一万亿的 K2.7，以及大小为 671 GB 的 DeepSeek V3，都大了许多。第二类爆炸式增长的是 KV Cache。由于长时间运行的智能体，它们的规模变得非常庞大——这类智能体可以被派去执行任务好几个小时。这种智能体是当下 AI 世界最热门的事物——它们会入侵你的网站、互相写便条，还会建立文明。

但是，智能体运行时间这么长——思维链也特别长——意味着它们的 KV Cache 会变得极其庞大。上下文窗口填得越满，智能体就越容易糊涂。我读 defill 和 precode 时也是这样。现在，上下文窗口大约是 1 百万个 token，或者约相当于 1,500 到 3,000 页文字。这或许适合读书、阅读一堆文档或大型代码库——但换成音频（11-12 小时）或视频（一小时高清画面）之类的格式，这点容量就不算多了。

当然，我们也有办法应对。我们可以压缩上下文窗口，腾出更多空间。但就像压缩 JPG 文件一样，这会让细节变得有些模糊。我们可以尝试把 KV Cache 拆分成块，把不常读取的一些块发送到 SSD，利用 SSD 廉价的大容量。需要频繁读取的块则必须留在 HBM 中。

## 高带宽内存

眼下，HBM 是聚光灯下的宠儿。它让整个韩国都变成了沉迷于半导体股票的交易者。

它是一种 3D 堆叠结构，包含一颗逻辑基底芯片，以及堆叠在其上方的 4、8、12 或 16 层核心存储芯片。TSV 穿过芯片的中央区域，将数据向下传输。HBM 仍然是赚钱机器。不过，坊间也能听到一些轻声议论：HBM 可能并不是 AI 未来所需的合适内存架构。节目好友 Irrational Analysis 曾写道，HBM“是个错误”。这让我想起了那张宫崎骏梗图。在 Hot Chips 2026 的内存专题环节——周日上午，9 点，几乎座无虚席——Micron、Samsung 和 SK hynix 介绍了他们的内存产品。

当然，HBM 是大家都在讨论的话题。但在 SK hynix 的演讲之后，SemiAnalysis 的一位分析师在问答环节提出了一个尖锐的问题。我通过 Irrational 引述这位先生的话，不过我当时也在场，确认确有此事：
> 当你观察单颗芯片的内部带宽时，
> 你会看到单元层级约有 20 TB/平方厘米……
> 你们谈到在 HBM4 下堆叠到 20 层厚，
> 所以在一个由 20 构成的堆叠中，可能达到每平方厘米 4 TB，
> 也就是说，你们谈到每个 20 层拥有单颗芯片 20% 的带宽。

> 你们大幅稀释了吞吐量。为什么这是正确的做法？为什么你们如此专注于增加堆叠高度，而不是提升速度？
他指出了其中的权衡。按照 HBM 目前的工作方式，在不降低每 GB 带宽的情况下，无法增加额外的 GB 容量，因为中央区域可用于传输数据的 TSV 数量有限。HBM 这样层层堆叠，使增加容量和带宽的成本随时间不断上升。而且如前所述，如果堆叠足够高，可能会出现一种有趣的情况

——每个核心裸片的运行速度实际上都比普通的传统商品内存慢。近来，对 HBM 的质疑声稍微大了起来。今年夏天，英特尔前 CEO Pat Gelsinger 当着 SK hynix 一位副总裁的面——而且还是当面——称 HBM 是“糟糕的内存”。SK hynix 副总裁 Kim Ho-sik 表示，他部分认同这种看法，称 HBM 并非解决 Memory Wall 问题的最终答案。但他补充说，HBM 是目前市场上最好的方案，而 SK hynix 正在研究其他解决方案。哦，我是不是听见一辆 Segway 正朝着我们视频的主题驶来？

## 高带宽闪存 顾名思义，高带宽闪存以与 HBM 堆叠并连接 DRAM 裸片相同的方式堆叠并连接闪存裸片。请注意，我们使用先进封装的巧妙技术，在单个封装内堆叠闪存裸片。它不同于 3D NAND，后者以单片方式堆叠存储单元层。NAND 是硬盘驱动器的替代品，针对纯粹的大容量进行了优化。因此，HBF 将每堆栈的存储容量大幅提升 8-16 倍（512 GB，而每个 36 堆栈约为 HBM4 GB）。与此同时，HBF 保留了 HBM 的高带宽速率。事实上，由于 HBF 开启了

把更多 NAND 存储单元堆叠到 GPU 附近，带宽速率理论上就能更高。目前，HBF 的规格最高可达到 3 TB/s，实际速度高于美光 HBM3E 的 1.2 TB/s，也与美光和三星 HBM4 的数据相当。不过要注意，按容量调整后，HBF 的带宽数据要低得多。（请记住这一点。）这就是好消息。那么，代价是什么？代价是 NAND 不是 DRAM。首先，读写速度（正式说法是“编程”速度）远低于 HBM，大约相差两个数量级

数量级的差异。而且，编程比读取更慢。你会遇到延迟。虽然 SanDisk 可以优化晶粒以降低延迟——这可能会在此过程中牺牲数据保留能力或每比特成本——但这种差距是根本性的。与 DRAM 相比，你需要等待更久才能获得数据，仅此而已。此外还存在耐久性问题——NAND 存储单元在数千次循环后就会磨损。这与 DRAM 单元形成对比，后者实际上没有耐久性上限。我们需要留意对 HBF 写入的次数。

他们提出使用无凸点 TSV 堆叠闪存裸片，打造一种他们称为“高带宽 NAND”的产品。这种实现方式利用 TSV，大幅增加单次操作中可读取或编程的存储单元数量，换言之，实现高带宽。Sandisk 在 2019 年 2 月的 Future FWD 投资者日正式推出 HBF 产品。他们提到，这套架构是在前一年开发完成的，并吸收了主要 AI 厂商的意见。后来发展为 HBF 的首项专利申请于 3 年 5 月提交，所以我认为时间上是吻合的。

几个月后，也就是 2025 年 7 月，该公司成立了技术顾问委员会，为这项技术的开发提供建议。他们宣布 David Patterson 和 Raja Koduri 加入委员会。David Patterson 以健壮的手臂闻名，也因其在计算机架构和 Berkeley RISC Project 上的工作而知名。Raja Koduri 曾在 ATI、AMD 和 Intel 做过大量工作。他几乎从 HBM 问世之初就一直参与其中，而且他的 Twitter 上有一只可爱的狗。几周后的 2024 年 8 月，Sandisk 宣布已与 SK hynix 签署谅解备忘录，以统一规格。

2025 年 7 月，也就是几个月后，该公司成立了技术顾问委员会，就这项技术的开发提供建议。他们宣布 David Patterson 和 Raja Koduri 加入委员会。David Patterson 以强健的手臂以及他在计算机架构和 Berkeley RISC Project 上的工作而闻名。Raja Koduri 曾在 ATI、AMD 和 Intel 做过大量工作。他几乎从 HBM 问世之初就一直参与其中，他的 Twitter 上还有一只可爱的狗。几周后的 2025 年 8 月，Sandisk 宣布已与 SK hynix 签署谅解备忘录，以统一规格。

你可能会想知道，为什么 Sandisk 和 SK hynix——通常是 NAND 领域的竞争对手——会想要合作。HBF 这类规范涵盖了内存如何与芯片其余部分进行接口连接，却没有说明这个堆叠实际上会如何工作。这让竞争对手能够携手扩大产品生态，同时也允许各自围绕自家产品的内部规格和性能展开竞争。另一个原因是，这能为产品提供可信的第二供应来源。随后还宣布，科技巨头 Google

和硬件公司 Tenstorrent 也加入了 HBF 联盟。Patterson 在 Google 工作了多年，目前仍是该公司的一名研究员。8 月 2026，Open Compute Project 发布了首个公开版 0.7.0 规范。这是向前迈出的重要一步。顺便说一句，如果你想知道，Samsung 也有自己的 HBF 版本，只不过他们称之为 zNAND-O，这听起来像一部 1970 年代的科幻片，或者一个卖烛台的电商网站。乍一看，它和 HBF 很像，不过我们拭目以待。## 它将走向何处？

这一切都很好。不过有一个大问题：我们要用它来做什么？你可以先想象一下它在内存层级中的位置——内存层级按照速度和容量对各种内存进行排列。在最顶端（Tier 0），是 GPU/TPU SRAM——它速度最快、最容易取用，因为就在芯片上，但容量有限。紧接着下面的 Tier 1，是 GPU HBM。它是片外内存，但在物理位置上离芯片最近。再往下的 Tier 2，是系统 DRAM——这是通用型

DRAM，是片外内存。它的容量更大，但距离 GPU 比 HBM 更远。Sandisk 似乎主张，GPU 制造商可以在 Tier 1 层级上把 HBF 和 HBM 并排放置。这样，HBM 可以存放并提供“热”数据——也就是你需要马上取用的数据——而 HBF 更大的容量则能让它存储“温”一些的数据。GPU 中介层周边的布线边缘空间有限，只能围绕它放置一定数量的内存芯片。目前这些位置全部都是 HBM。如今，系统架构师必须决定，想用多少 HBF 替换逻辑裸片周围的 HBM。

每用 HBF 替换一部分 HBM，都会大幅增加芯片的总内存容量。此前配有八个 24 GB HBM 堆栈的 GPU，总内存约为 192 GB。将其改为六个 HBF 和两个 HBM，就能得到一个内存容量为 3.12 TB 的系统。由于闪存存在耐久性问题，这些数据可能需要是读多写少的数据，也就是“以读为主”的数据。大多数人认为这会是模型权重；我也能理解这一点，因为正如我们之前所说，这些模型权重正在变得越来越大——不过也有人认为 KV Cache 也可以放进去。

我觉得这听起来不错。不过，这个设想并不像一开始听起来那么简单。在 Hot Chips 2026 上，两位架构师 A. Agrawal 和 R. Giduthuri 做了一场演讲，讨论将 HBF 集成到 AI 算力系统中的挑战。一个核心观点是，评判系统要看它们提供 token 的能力如何……HBF 拥有廉价的内存容量，并不意味着 token 成本就会相应降低。因为如果我们不能足够快地从 HBF 中取出所有数据，导致加速器等待，那么 token 输出就会受到影响。

所以，HBF 并非不假思索就能采用的方案。它需要大量的软件支持。北京大学五位研究人员和复旦大学一位研究人员最近撰写了一篇论文，标题是《HBF 糟透了？》——他们大概是误入了这个课题——论文指出，HBF 不能直接替代 SSD。系统软件必须谨慎选择哪些数据应该放进 HBF。比如一些广泛使用的数据，例如共享提示词。说实话，这听起来很有挑战性。还应关注正在提供服务的模型。正如 Agrawal 和 Giduthuri 提到的，混合专家模型可能更适合 HBF；这类模型不会激活整个模型

而是激活该混合模型中的一个或多个专家。这类模型需要足够的容量来容纳所有专家，但每生成一个 token 只会读取其中少数几个专家，因此较低的每 GB 带宽数值也可以接受。## Optane 带来的教训如果要思考这类产品，就不能不想到不到十年前的另一款重要半导体存储产品：Intel Optane，也就是 3D XPoint。前者是 Intel 为后者取的品牌名，后者则是底层技术的名称。

我之前做过一期关于 Optane 的视频，你可以去看。简而言之，3D XPoint 是一种相变存储器（PCM）技术。PCM 依赖材料在不同相态之间转换的能力。当材料处于非晶态时，电阻率很高。我喜欢把这想成它进入了 emo 状态。然后，当它处于晶态时，电阻率就很低。以特定方式对存储单元加热，就能在两种相态之间切换。在 2015，Intel 和 Micron 宣布合作生产并商业化 3D XPoint。它是一种像 NAND 一样的非易失性存储器，

但它的读写速度与 DRAM 相近，价格则处于两者之间。Intel 将其定位为可与自家的 CPU 和闪存协同工作的一种产品（当时闪存业务仍由 Intel 持有）。他们讨论了“温数据”的概念——例如数据库这类数据，你希望它具备类似 DRAM 的延迟，但数据量又大到无法全部放进 DRAM。这个用例很有意思，但要充分发挥其优势，需要应用开发者提供软件支持。不幸的是，3D NAND 的兴起压低了闪存的单位比特成本，削弱了 Optane 在经济层面的许多合理性。

这款产品始终没能在 DRAM 和 NAND 之间找到合适的位置。随后 Micron 退出了，Intel 成了唯一的供应商。毕竟，没有人愿意在 CPU 和内存这两方面都依赖 Intel 这一家供应商，所以这件事就此结束。鉴于目前 HBF 背后的核心高管——Sandisk 执行副总裁兼首席技术官 Alper Ilkbahar——曾在 Intel 担任 Optane 事业部副总裁兼总经理五年，Optane 的教训对 HBF 尤其有借鉴意义。考虑到如今 DRAM 的短缺，有几个人不禁感叹，Intel 当年或许

应该再多保留 Optane 几年。它更大的存储容量和更低的延迟，可用于存放供推理使用的 LLM 权重。也许他们说得对。但一位曾从软件侧参与 Optane 工作的人告诉我，在幕后，Optane 就是做不到 Intel 声称它能做到的那些事。有人说，HBF 的优势在于它以闪存为基础，而人们对闪存很熟悉，因此它在市场上的表现应该会更好。不过，反方的观点是，Optane 实际采用的 PCM 单元表现非常出色。其核心技术很优秀。

真正未能兑现承诺的，是几乎所有其他方面——比如控制器和市场进入策略。High Bandwidth Flash 必须避免重蹈这些覆辙，妥善执行，才能避免落得同样的下场。

## 结论

结束之前，我想感谢一位特别的 Sandisk 员工，是他提出了这个想法。他特意陪我穿过 Stanford 的草坪，一起去参加 Hot Chips，对此我非常感激。HBF 正在以相当快的速度推进。在 SEMICON Taiwan 上，Sandisk 的一场演讲展示了时间表。潜在客户

将在大约 2027 下旬拿到首批概念验证样品或工程样品。之后，如果一切顺利，2029 将开始大规模量产。所以这项技术不会很快到来，但它会比你想象的更早到来。还有很多事情尚未明朗，情况也在不断变化。Sandisk、SK hynix 和其他公司能否按时交付？会不会延期？系统架构师能否找到它的用武之地？软件供应商会配合吗？客户可能会拿它来做什么？未来一段时间，我们会继续关注。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=3nTpW52nioI
- 来源：YouTube·Asianometry
- 发布时间：2026-09-23
- 行业：算力芯片
- 公司：Sandisk,SK hynix,Micron,Samsung,Google,Tenstorrent,Intel
- 归档时间：2026-10-09T09:02:19.560Z

---

- 链接：https://www.youtube.com/watch?v=3nTpW52nioI
- 频道：Asianometry
- 发布日期：2026-09-24
- 时长：20分53秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

Links:
- Patreon (Support the channel directly!): https://www.patreon.com/Asianometry
- X: https://twitter.com/asianometry
- Newsletter & Podcast (available through Stratechery Plus): https://asianometry.passport.online/
- LinkedIn (feel free to connect): www.linkedin.com/in/jon-y-asianometry

## 全文

I have to be real with you. Before&nbsp; traveling to the Bay last month,&nbsp;&nbsp; I never heard of the words&nbsp; "decode", "prefill", or "KV Cache". Then I go to Hot Chips, and I took a&nbsp; full blast in the face with these terms. And now, just like 11:11 (make a wish), I see&nbsp; it everywhere. It's Baader-Meinhof to the max. But Prefill, Decode and KV Cache relate to major&nbsp;&nbsp; technical challenges associated with&nbsp; serving these ever-growing models. The memory makers - flush off the&nbsp; HBM bonanza - have brought forth a&nbsp;&nbsp; new thing with a slick name to meet these&nbsp; challenges: High Bandwidth Flash or HBF.

HBF is cool but ... what is it going&nbsp; to be used for? In today’s video,&nbsp;&nbsp; a potential challenger and/or&nbsp; companion to HBM: High Bandwidth Flash. ## Beginnings To understand why people care about High&nbsp; Bandwidth Flash, we need to gather two trends. The first major trend concerns AI inference. I&nbsp; shall start by explaining those three terms I&nbsp;&nbsp; briefly mentioned at the top of this video.&nbsp; There are undoubtedly many interesting and&nbsp;&nbsp; intense explainers that you can go find - or&nbsp; you can just ask ChatGPT - but here is mine. Prefill and decode describe two important&nbsp; computational regimes in one type of inference.

During prefill, the model processes the input&nbsp; content - which can include the user prompt,&nbsp;&nbsp; system prompt, prior replies,&nbsp; the state of Montana, tool calls,&nbsp;&nbsp; images, audio, and internal chain of thought. The GPU or NPU or inference ASIC or TPU or&nbsp; Neural Engine or LPU or whatever must pay&nbsp;&nbsp; attention to all of this in parallel,&nbsp; as it affects the prompt’s meaning. "Attention" of course is the concept featured&nbsp; in that game-changing Transformer paper that&nbsp;&nbsp; launched a million lame "X&nbsp; thing is all you need" puns.

Attention produces for each token a Query, Key&nbsp; and Value vector - the latter two get written&nbsp;&nbsp; into a cache. So at the end, Prefill&nbsp; gives you a KV Cache of the inputs,&nbsp;&nbsp; which is what you need to calculate&nbsp; the first token in the response. Then comes Decode, which is where we&nbsp; consult the KV cache to generate the&nbsp;&nbsp; rest of the response - emitting&nbsp; tokens one at a time. The key and&nbsp;&nbsp; value of each newly generated token&nbsp; gets inserted into the KV Cache. KV Cache saves the LLM from wasting&nbsp; time and compute resources recalculating&nbsp;&nbsp;

Attention for all the prior inputs&nbsp; every time. You can think about it&nbsp;&nbsp; as the model's working notes&nbsp; for the current conversation. It is important to note here that Prefill&nbsp; and Decode are distinctly different jobs.&nbsp;&nbsp; The former is bound by how much compute you have&nbsp; - since the whole thing can be done in parallel. The latter on the other hand happens one&nbsp; by one - and so is more memory bound.&nbsp;&nbsp; The GPU's logic circuits waste their time&nbsp; waiting for data to be loaded from memory. ## Cultivating MASS Right now, the memory industry is reckoning with two forms of exponentially&nbsp; rising technical demands.

The first is that model weights keep growing.&nbsp; The latest big model Kimi K3 has 2.8 trillion&nbsp;&nbsp; total parameters. At 8-bit accuracy it&nbsp; weighs about 2.8 terabytes. This is a big&nbsp;&nbsp; step up from K2.7 which was just a terabyte&nbsp; and DeepSeek V3 which was 671 gigabytes. The second category of exploding things are the&nbsp; KV Caches. They are getting massive thanks to&nbsp;&nbsp; long-running agents - the sort that you&nbsp; unleash upon your task for hours. Such&nbsp;&nbsp; agents are the hottest thing right now&nbsp; in the AI world - hacking your websites,&nbsp;&nbsp; writing notes for each other,&nbsp; and starting civilizations.

But agents running for so long - with&nbsp; super long chains of thought - mean&nbsp;&nbsp; that their KV Caches get absolutely massive.&nbsp; The more the context window gets filled up,&nbsp;&nbsp; the more confused the agent gets. Like&nbsp; me when I read up on defill and precode. Right now, the context window is about 1 million&nbsp; tokens, or about 1,500 to 3,000 pages of text.&nbsp;&nbsp; That might be suitable for reading through books,&nbsp; a pile of documents, or a large code base - but&nbsp;&nbsp; in other formats like audio (11-12 hours)&nbsp; or video (an hour at HD) that's not a lot.

Of course, there are things that can be done. We&nbsp; can compact the context window to free up more&nbsp;&nbsp; space. But just like compressing a JPG file,&nbsp; it causes the details to get a bit blurry. We can try splitting the KV Cache into blocks and&nbsp;&nbsp; sending certain less-frequently read&nbsp; blocks to SSDs, taking advantage of&nbsp;&nbsp; their cheap capacity. Blocks that need to&nbsp; be frequently read must stay in the HBM. ## High Bandwidth Memory Right now, HBM is the belle of the&nbsp; ball. The thing that turned all of&nbsp;&nbsp; Korea into degenerate semiconductor stock traders.

It is a 3D stacked structure with a logic&nbsp; base die and 4, 8, 12, or 16 core memory&nbsp;&nbsp; dies stacked on top of it. TSV cut through the&nbsp; dies' central areas, bringing data downwards. HBM remains a money-maker. But in the air,&nbsp;&nbsp; we can hear quiet murmurs that HBM might not be&nbsp; the proper memory architecture for AI's future. Irrational Analysis - good friend&nbsp; of the show - has before written&nbsp;&nbsp; that HBM "is a mistake". I am&nbsp; reminded of that Miyazaki meme. During the Memory session at Hot Chips&nbsp; 2026 - Sunday morning, 9 am but nearly&nbsp;&nbsp; full attendance - Micron, Samsung, and SK&nbsp; hynix presented about their memory products.

Of course, HBM is what everyone talked&nbsp; about. But after the SK hynix presentation,&nbsp;&nbsp; an analyst from SemiAnalysis asked a&nbsp; pointed question at the Q&A session. I quote the man via Irrational, but&nbsp; I was there to confirm it happened: > When you look at the internal&nbsp; bandwidth of a single chip,&nbsp;&nbsp; you see about 20 terabytes per square&nbsp; centimeter at the cell level ... > You talk about going to 20 levels thick at HBM4&nbsp;&nbsp; so maybe you are at 4 terabytes per&nbsp; square centimeter in a stack of 20,&nbsp;&nbsp; so you are talking about having 20% of the&nbsp; bandwidth of one chip [for each] layer of 20.

> You've diluted the throughput enormously.&nbsp; Why is that the correct way to go?&nbsp;&nbsp; Why are you so focused on going&nbsp; taller rather than going faster? He points at the trade-off.&nbsp; The way HBM works right now,&nbsp;&nbsp; you cannot get the additional gigabytes&nbsp; of capacity without reducing bandwidth per&nbsp;&nbsp; gigabyte because there are only so many TSVs&nbsp; available in the central area to move data. This stacking up of HBM has caused the price&nbsp; of incremental capacity and bandwidth to rise&nbsp;&nbsp; over time. And as said, if the stacks get high&nbsp; enough, you may get the interesting scenario&nbsp;&nbsp;

where each core die actually operates&nbsp; slower than plain old commodity memory. In recent days, the teasing of HBM has gotten&nbsp; somewhat louder. Over the summer Intel ex-CEO&nbsp;&nbsp; Pat Gelsinger said - in front of a SK hynix vice&nbsp; president, no less - that HBM is "lousy memory". The SK hynix VP, Kim Ho-sik said that he&nbsp; partly agreed with this sentiment - saying&nbsp;&nbsp; that HBM is not the final answer to the&nbsp; Memory Wall problem. But he adds that it&nbsp;&nbsp; is the best thing on the market right now and&nbsp; that SK hynix is working on other solutions. Oh, do I hear a Segway rolling&nbsp; towards the topic of our video?

## High Bandwidth Flash As the name implies, High Bandwidth Flash stacks and connects flash dies in the same way&nbsp; as HBM stacks and connects DRAM dies. Note that we are stacking flash dies inside a&nbsp; single package using advanced packaging voodoo.&nbsp;&nbsp; It is different from 3D NAND, which stacks&nbsp; layers of memory cells in a monolithic way. NAND is a hard disk drive replacement&nbsp; - optimized for sheer capacity. So HBF&nbsp;&nbsp; vastly increases the per-stack memory&nbsp; capacity by 8-16 times (512 gigabytes&nbsp;&nbsp; compared to 36 or so gigabytes per HBM4 stack). At the same time, HBF keeps HBM's high&nbsp; bandwidth rates. In fact, since HBF opens&nbsp;&nbsp;

up more of the NAND cells to the GPU, the&nbsp; bandwidth rates can theoretically go higher. Currently, HBF's spec can do up to 3 terabytes&nbsp; per second effectively - higher than Micron's&nbsp;&nbsp; HBM3E's 1.2 terabytes per second and comparable&nbsp; to Micron and Samsung's HBM4's numbers. Though&nbsp;&nbsp; I note adjusted for capacity, HBF's bandwidth&nbsp; numbers are far smaller. (Keep that in mind) So that is the good news. What's the&nbsp; catch? The catch is that NAND is not DRAM.&nbsp;&nbsp; First and foremost, the read and&nbsp; write (formal word is "program")&nbsp;&nbsp; speeds are far slower than HBM, roughly two orders&nbsp;&nbsp;

of magnitude difference. And programming&nbsp; is slower than reading. You get latency. While Sandisk can optimize the dies for&nbsp; lower latency - likely sacrificing either&nbsp;&nbsp; data retention or cost-per-bit in the&nbsp; process - this gap is fundamental. You&nbsp;&nbsp; will need to wait longer for your&nbsp; data than with DRAM, end of story. There is also an endurance issue -&nbsp; NAND memory cells get worn out after&nbsp;&nbsp; some several thousands of cycles.&nbsp; This is in contrast to DRAM cells,&nbsp;&nbsp; which essentially have no endurance limit. We need&nbsp; to be mindful of how many times we write to HBF.

Finally the third major downside is power and&nbsp; thermals. You need more power to drive these large&nbsp;&nbsp; HBF cubes, not a trivial consideration nowadays.&nbsp; And wherever there is more power, there is also&nbsp;&nbsp; more heat - which can cause the system to throttle&nbsp; its performance or worsen endurance issues. ## A Brief History The idea of NAND stacked and&nbsp; connected with TSVs has been around. One that I want to shout out was a paper and&nbsp; talk at the IEEE 2019 International 3D Systems&nbsp;&nbsp; Integrated Conference by Koji Sakui and Takayuki&nbsp; Ohba at the Honda Research Institute Japan.

They proposed stacking flash dies using&nbsp; bump-less TSV to create something they called&nbsp;&nbsp; "High Bandwidth NAND". Such an implementation uses&nbsp; TSV to vastly expand the number of memory cells&nbsp;&nbsp; that can be read or programmed with a single&nbsp; operation - in other words, high bandwidth. Sandisk formally introduced the HBF product during&nbsp; its Future FWD investor day in February 2025. They&nbsp;&nbsp; mention having developed the architecture over&nbsp; the prior year with inputs from major AI players. The first patent application for what would become&nbsp;&nbsp; HBF was filed in May 2024 - so&nbsp; I think the timing fits here.

A few months later in July 2025, the company&nbsp;&nbsp; formed a Technical Advisory Board to&nbsp; advise the technology's development. They announced that David Patterson and Raja&nbsp; Koduri joined this board. David Patterson is&nbsp;&nbsp; known for his buff arms as well as his&nbsp; work on computer architecture and the&nbsp;&nbsp; Berkeley RISC Project. Raja Koduri&nbsp; has done extensive work at ATI, AMD,&nbsp;&nbsp; and Intel. He has been around HBM since almost&nbsp; its beginning and his Twitter has a cute dog. A few weeks later in August 2025,&nbsp; Sandisk announced that it had signed&nbsp;&nbsp; a Memorandum of Understanding with&nbsp; SK hynix to standardize the spec.

You might wonder why Sandisk and SK hynix -&nbsp; normally competitors in the NAND space - might&nbsp;&nbsp; want to cooperate. Specifications like those&nbsp; for HBF cover how the memory interfaces with&nbsp;&nbsp; the rest of the chip, but makes no comment&nbsp; on how that stack will actually work. This lets competitors work together to&nbsp; scale up the product ecosystem while&nbsp;&nbsp; also allowing competitors to compete on their&nbsp; own products' internal specs and performance.&nbsp;&nbsp; One other thing is that it gives vendors&nbsp; a credible second source for the product. It was also announced then&nbsp; that the tech giant Google&nbsp;&nbsp;

and hardware company Tenstorrent&nbsp; had both joined the HBF consortium&nbsp;&nbsp; as well. Patterson worked at Google for&nbsp; many years, and remains a fellow there. In August 2026, the Open Compute&nbsp; Project released the first public&nbsp;&nbsp; version 0.7.0 spec. It is a major step forward. And by the way, in case you are wondering,&nbsp; Samsung has their own version of HBF except&nbsp;&nbsp; they call it zNAND-O, which sounds like a&nbsp; 1970s sci-fi flick or an e-commerce website&nbsp;&nbsp; selling candlesticks. Just at a glance it&nbsp; looks similar to HBF, but we shall see. ## Where Does It Go?

This is all well and good. One big question&nbsp; however: What are we going to use this for? You might want to first imagine it&nbsp; within the Memory Hierarchy - which&nbsp;&nbsp; arranges the various memories&nbsp; by their speed and capacity. At the very top (Tier 0) you have&nbsp; GPU/TPU SRAM - which is fastest&nbsp;&nbsp; and most available as it is right&nbsp; on the chip, but lacks capacity. Right below that at Tier 1, we have&nbsp; GPU HBM. It is off-chip memory,&nbsp;&nbsp; but it is physically located closest to the chip. And then below that at Tier 2, we&nbsp; have system DRAM - this is commodity&nbsp;&nbsp;

DRAM off-chip. Higher capacity but even&nbsp; further away from the GPU than the HBM. Sandisk seems to be pitching the notion&nbsp; that GPU makers can put the HBF side by&nbsp;&nbsp; side with HBM at the Tier 1 level. So HBM&nbsp; can hold and serve the "hot" data - stuff&nbsp;&nbsp; that you need to have right away - but HBF’s&nbsp; higher capacity lets it store “warmer” data. The GPU interposer only has the&nbsp; shoreline for a certain number of&nbsp;&nbsp; memory chips surrounding it. Right now,&nbsp; that is all HBM. System architects must&nbsp;&nbsp; now decide how much of the HBM surrounding&nbsp; the logic die they want to replace with HBF.

Any HBM we swap out with HBF grants&nbsp; the chip a big boost in total memory.&nbsp;&nbsp; A GPU that previously had eight 24GB&nbsp; HBM stacks has about 192 gigabytes&nbsp;&nbsp; total memory. Change that to six HBFs and two&nbsp; HBMs, and you get a system with 3.12 terabytes. Due to flash's endurance issues, this probably&nbsp; needs to be data that is more read than write&nbsp;&nbsp; - "read-mostly". Most people believe this will be&nbsp; the model's weights - and I kind of see it since&nbsp;&nbsp; as we said before these model weights are getting&nbsp; large - but some have suggested KV Cache too.

Looks good to me. But the notion is not as&nbsp; straightforward as it initially sounds. During&nbsp;&nbsp; Hot Chips 2026, there was a presentation&nbsp; by two architects - A. Agrawal and R.&nbsp;&nbsp; Giduthuri - discussing the challenges&nbsp; of integrating HBF into AI compute. A core point was that systems are&nbsp; judged on how well they can serve&nbsp;&nbsp; tokens ... and just because HBF has cheap&nbsp; memory capacity does not one-to-one mean&nbsp;&nbsp; cheaper tokens. Because if we can't get&nbsp; all that data out of the HBF fast enough,&nbsp;&nbsp; and that makes the accelerator&nbsp; wait, then token output suffers.

So HBF isn’t a no-brainer. It will&nbsp; require extensive software support.&nbsp;&nbsp; A recent paper written by five researchers&nbsp; from Peking University and one from Fudan&nbsp;&nbsp; who must have gotten lost titled "HBF Sucks?"&nbsp; points out that HBF is no drop-in for SSDs. The system's software must carefully choose which&nbsp; data should go into the HBF. Certain widely used&nbsp;&nbsp; data like shared prompts, for instance.&nbsp; Not going to lie, that sounds challenging. Attention should also be paid to the&nbsp; models being served. Like Agrawal and&nbsp;&nbsp; Giduthuri mention a mixture-of-experts model&nbsp; - which does not activate the entire model&nbsp;&nbsp;

but rather one or multiple experts within&nbsp; that mixture - might work better for HBF.&nbsp;&nbsp; Such a model needs the capacity to hold all&nbsp; the experts, but only reads a few of those&nbsp;&nbsp; experts for a token, so lower bandwidth&nbsp; per gigabyte numbers are acceptable. ## The Lessons of Optane You cannot think about a product&nbsp; like this without also thinking&nbsp;&nbsp; about another major semiconductor memory&nbsp; product from less than ten years ago: Intel Optane, or 3D XPoint. The former&nbsp; is Intel's brand name for the latter,&nbsp;&nbsp; which is the name for the underlying technology.

I have done a video before about&nbsp; Optane, so you can watch that. The&nbsp;&nbsp; short version is that 3D XPoint is a&nbsp; Phase Change Memory or PCM technology. PCM depends on a material's ability to&nbsp; shift between different phases. When it&nbsp;&nbsp; is in an amorphous phase, resistivity&nbsp; is high. I like to think that it is&nbsp;&nbsp; being emo. Then when in a crystalline&nbsp; phase, the resistivity value is low.&nbsp;&nbsp; Applying heat to the cell in a certain&nbsp; way can switch between the two phases. In 2015, Intel and Micron announced a&nbsp; team-up to produce and commercialize&nbsp;&nbsp; 3D XPoint. It was a non-volatile memory like NAND,&nbsp;&nbsp;

but with read/write speeds similar to DRAM.&nbsp; The price was somewhere in the middle. Intel positioned it as something that can work&nbsp; in tandem with their CPUs and flash memory (a&nbsp;&nbsp; business they still owned back then). They&nbsp; discussed the concept of "warm data" - things&nbsp;&nbsp; like databases with which you want DRAM-like&nbsp; latency, but are too large to hold in there. The use case was interesting, but required&nbsp; software support from application-makers&nbsp;&nbsp; to take full advantage. Unfortunately,&nbsp; the rise of 3D NAND drove down flash's&nbsp;&nbsp; cost-per-bit numbers and invalidated&nbsp; much of Optane's economic justification.

The product never managed to find its&nbsp; proper position in between DRAM and&nbsp;&nbsp; NAND. Micron then dropped out, leaving&nbsp; Intel as the sole vendor. Since no one&nbsp;&nbsp; wants to rely on Intel as the single source&nbsp; for both their CPUs and memory, it was over. The lessons of Optane are particularly&nbsp; pertinent for HBF considering that the&nbsp;&nbsp; core executive at Sandisk behind&nbsp; it right now - Alper Ilkbahar,&nbsp;&nbsp; EVP and CTO - spent five years at Intel as VP&nbsp; and General Manager of the Intel Optane Group. Considering the DRAM shortage today,&nbsp; several people have mused that Intel&nbsp;&nbsp;

should have held onto Optane a couple more&nbsp; years. The superior storage capacity and&nbsp;&nbsp; fast latency can be used to store&nbsp; an LLM's weights for inference. Perhaps they are right. But someone who once&nbsp; worked with Optane from the software side&nbsp;&nbsp; told me that - behind the scenes - Optane&nbsp; just couldn't do what Intel claimed it can. Some say that HBF’s advantage is that it&nbsp; starts with flash, and people are familiar&nbsp;&nbsp; with it. So it should perform better in&nbsp; the market. But the counterpoint to that&nbsp;&nbsp; is that Optane’s actual PCM cells worked&nbsp; brilliantly. The core technology was great.

It was most everything else -&nbsp; like the controller and go-to&nbsp;&nbsp; market strategy - that failed to live&nbsp; up to its promise. High Bandwidth Flash&nbsp;&nbsp; needs to avoid those same pitfalls&nbsp; and execute to avoid the same fate. ## Conclusion Before we end, I want to thank a special Sandisk&nbsp; employee who suggested this idea. He took the&nbsp;&nbsp; time to walk with me to Hot Chips across the&nbsp; Stanford lawn and I really appreciate that. HBF is coming along at a pretty&nbsp; high speed. At SEMICON Taiwan,&nbsp;&nbsp; a Sandisk presentation displayed&nbsp; the schedule. Potential customers&nbsp;&nbsp;

get the first proof-of-concept or&nbsp; engineering samples in like late 2027. And then if all goes well, high volume&nbsp; manufacture starts in 2029. So this is&nbsp;&nbsp; not something coming anytime soon, but&nbsp; it will come sooner than you think. So much remains in the air, and&nbsp; things are in flux. Can Sandisk,&nbsp;&nbsp; SK hynix and others deliver it&nbsp; on time? Will there be delays?&nbsp;&nbsp; Can system architects discover what it&nbsp; is good for? Will the software vendors&nbsp;&nbsp; cooperate? What might customers use it for?&nbsp; We shall keep an eye on it in the days ahead.
