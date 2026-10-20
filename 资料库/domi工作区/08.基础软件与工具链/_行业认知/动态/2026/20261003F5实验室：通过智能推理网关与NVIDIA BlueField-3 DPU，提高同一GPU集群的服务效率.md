<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_b5572af9340e0fc9"
title: "F5实验室：通过智能推理网关与NVIDIA BlueField-3 DPU，提高同一GPU集群的服务效率"
domains: ["基础软件与工具链","互联与网络","云与算力服务","服务器与整机制造","算力芯片","Agent与平台"]
subdomains: ["推理优化与serving软件","网络芯片与DPU","网络架构与组网","交换机与网络设备","智算云与算力租赁","推理服务与API平台","服务器整机","AI加速器与GPU","CPU与通用处理器","Agent框架与编排"]
types: ["行业认知","视频"]
companies: "F5；NVIDIA；Dell；Supermicro（字幕作“super micro”）；AMD。对比方案为Envoy AI Gateway；视频来源为ServeTheHome。"
published_at: "2026-10-03T14:59:01.305Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=BDNMMsWVE9M"
source: "YouTube·ServeTheHome"
---

# F5实验室：通过智能推理网关与NVIDIA BlueField-3 DPU，提高同一GPU集群的服务效率

## 行业认知文章

- 行业：基础软件与工具链、互联与网络、云与算力服务、服务器与整机制造、算力芯片、Agent与平台
- 公司：F5；NVIDIA；Dell；Supermicro（字幕作“super micro”）；AMD。对比方案为Envoy AI Gateway；视频来源为ServeTheHome。
- 来源：YouTube·ServeTheHome · [原文链接](https://www.youtube.com/watch?v=BDNMMsWVE9M)
- 发布时间：2026-10-03
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
ServeTheHome在F5实验室展示了F5 BIG-IP Next for Kubernetes如何结合NVIDIA BlueField-3 DPU，为AI集群提供负载均衡、模型路由、令牌治理、安全和多租户隔离。核心观点是：GPU服务能力不仅取决于GPU数量，还受到请求分配、键值缓存位置与容量、并发压力以及应用交付架构的影响。F5的端点选择器会参考GPU负载、请求大小和键值缓存位置来分配请求；其软件运行在DPU上，还可减少对主机CPU核心的占用。
视频对比了F5方案与Envoy AI Gateway。原文称使用同一套8 GPU集群、8个推理服务实例和相同负载生成器，模型在字幕中记为“Quinn 3 32B FP8”；“VLM”及模型名称存在字幕识别疑点，未人工校对。结果明显依赖场景：高复用流量约为基线的1.38—1.48倍，多轮聊天随争用压力提高约为1.13倍、1.56倍和2倍；无共享前缀的独立请求在150并发、每请求10,000个输入令牌时约为1倍，在150并发、每请求20,000个输入令牌时约提高4%，而在200并发、每请求20,000个输入令牌且键值缓存发生明显争用时达到3.24倍。原文没有明确这些“性能”倍数对应的具体指标，也没有给出混合流量的结果，因此不能把标题中的“三倍”理解为所有推理场景的固定收益。
后半段强调了存量集群优化的经济意义：当新增GPU、电力或部署时间受到限制时，更换网关及采用DPU卸载可能提高现有硬件的有效服务能力。视频还介绍了BlueField-3的处理器、内存、可编程数据路径和网络能力，并将其定位为可运行基础设施软件的计算与加速平台。视频在[0:38—0:44]明确披露由F5赞助；材料来源为YouTube浏览器导出的完整字幕，未人工校对识别准确性。原始链接：https://www.youtube.com/watch?v=BDNMMsWVE9M 。

### 论点1：AI集群需要协调多种计算、存储和网络资源，应用交付层是处理这种复杂性的必要组成部分。
**相应论据：**[1:31—2:06] 主持人指出，AI集群包含普通云和企业集群常见的组件，也有新的组成部分；参观机柜没有相邻机柜中的F5 BIG-IP硬件设备，因为相关功能改由软件实现，但仍需要访问控制与应用交付层。[2:07—2:40] 集群既有服务器和DPU管理网络，也有用于南北向、东西向流量的高速网络。[3:40—4:29] 实验室包含搭载NVIDIA H100的Supermicro GPU服务器和存储服务器；训练集群可能需要大量存储，推理集群的存储需求也在增加，机柜内还可能存在多条并行网络通路。
**相应论证：**原文通过逐项展示CPU计算、GPU计算、存储和不同网络，说明AI服务交付需要协调的对象很多。F5方案被定位为连接和管理这些资源的软件层。关于推理存储需求增长，原文未给出规模、增速或进一步论证。

### 论点2：AI集群应保留对多服务器厂商的适配能力，同时配置CPU节点承担GPU计算之外的任务。
**相应论据：**[2:41—3:03] 实验室同时使用Dell和Supermicro服务器，主持人认为应支持不同厂商，以避免部署时被单一厂商锁定，并适应后续厂商变化；其中展示了搭载AMD EPYC的2U Supermicro服务器，字幕将EPYC记为“epic”。[3:03—3:22] 展示的服务器装有4个NVIDIA BlueField-3 DPU，并有独立管理与较低速网络连接。[3:24—3:38] 原文强调CPU专用或以CPU为主的节点仍然重要，可承载智能体相关任务、传统工作负载和Kubernetes控制功能；智能体相关词在此处字幕识别不清。
**相应论证：**多厂商兼容的理由是降低厂商锁定并保留后续部署选择。CPU节点的理由是集群中仍存在控制与通用计算任务，不能仅配置GPU计算资源。原文没有给出多厂商方案的性能比较，也没有量化这些任务需要多少CPU资源。

### 论点3：F5将BIG-IP Next for Kubernetes定位为连接用户、应用与GPU基础设施的AI服务平面。
**相应论据：**[4:31—4:41] 原文称F5 BIG-IP Next for Kubernetes直接集成到NVIDIA云合作伙伴通用网络参考架构。[4:55—5:23] 架构图左侧是客户端、应用和服务，右侧是GPU基础设施，中间是F5方案运行的AI服务平面，负责连接、编排和安全。[5:25—5:52] 功能包括智能AI负载均衡以及大语言模型路由与编排。
**相应论证：**原文认为，当大量用户请求访问多个GPU服务器和模型时，需要选择合适的服务端，并确保请求与模型、模型与运行系统正确对应。因此，AI服务平面承担的不只是网络连通，还包括调度和安全交付。原文未展示模型编排的具体策略或独立测试结果。

### 论点4：令牌治理与计量用于约束AI资源消耗，避免高用量与实际工作价值脱节。
**相应论据：**[5:52—6:07] 原文将令牌治理和计量列为方案能力，并举例说明：某位实习工程师可能为了表现自己擅长AI而消耗大量令牌，却没有完成有用工作。
**相应论证：**原文以假设案例说明，令牌消耗量不一定等同于有效产出，因此需要治理和计量。该案例不是实际客户数据；原文未展开具体配额、限流、计费机制或节约效果。

### 论点5：当企业使用数据中心或租赁算力时，零信任安全用于保护请求与数据在外部基础设施上的交付。
**相应论据：**[6:07—6:57] 主持人指出，AI基础设施可能部署在数据中心，也可能通过新兴GPU云服务商租赁GPU或服务器。使用他人基础设施时，需要避免中间方看到输入内容，否则会削弱企业AI或主权AI的目的。
**相应论证：**原文将零信任需求与算力部署环境联系起来：企业数据和请求离开本地桌面或工作组服务器后，不能仅凭基础设施归属或网络位置假定安全。原文未展示具体安全机制、攻击测试或认证结果。

### 论点6：多租户隔离不仅适用于不同客户共享算力，也适用于同一企业内部的敏感数据隔离。
**相应论据：**[6:58—7:48] 原文指出，共享供应商基础设施或同一企业内部不同团队都可能需要隔离。示例是财务人员将尚未发布的业绩数据输入大语言模型，不希望其他租户或公司内部无关人员看到这些数据。
**相应论证：**原文认为，共享计算资源不代表共享数据访问权限，尤其在涉及敏感信息时，需要将不同租户或团队隔离。财务示例为假设场景；原文没有说明隔离的实现层级、验证方式或合规覆盖范围。

### 论点7：MCP与智能体AI代理层可为应用访问不同模型和工具提供标准化接口。
**相应论据：**[7:50—8:15] 原文将MCP与智能体AI代理列为方案能力，认为其用途是以标准化方式连接不同模型和工具，并衔接用户、应用与GPU基础设施；主持人同时称MCP已很流行、被广泛使用，但未提供采用率数据。
**相应论证：**原文的论证是：应用与用户需要访问多种模型和工具，标准化接口有助于在这一链路上提供一致的连接方式。关于MCP普及程度及代理层的实际效果，原文未展开论证。

### 论点8：缓存感知、负载感知的端点选择是F5提高GPU利用效率的核心机制之一。
**相应论据：**[8:16—8:39] 原文称F5的端点选择器不会把每个请求都视为相同，而会参考GPU与服务器负载、请求大小，以及键值缓存所在位置，判断请求应由集群中的哪个服务端处理。
**相应论证：**原文将性能提升与更细致的请求分配联系起来：请求存在不同规模，服务器负载和缓存分布也不同，端点选择器据此决定请求落点。原文没有披露选择算法、各指标权重或独立消融测试。

### 论点9：本次比较主要观察更换网关后的相对性能，测试结果需要保留实验室条件和披露边界。
**相应论据：**[8:41—9:06] 测试使用搭载NVIDIA H100的Supermicro服务器，通过NVIDIA性能测试工具产生并发用户与请求，对比F5 BIG-IP Next for Kubernetes和Envoy AI Gateway。[9:20—10:20] 原文称使用同一套8 GPU集群、8个推理服务实例、同一负载生成器，整体设置几乎相同，主要改变所用网关；字幕将推理服务记为“VLM”，模型记为“Quinn 3 32B FP8”，名称未人工校对。[9:38—10:01] 展示图表由原始日志导入可视化工具生成。[10:22—10:40] 测试矩阵包括完全独立请求、多轮聊天、混合流量和高复用流量。[0:38—0:44] 视频明确披露由F5赞助。
**相应论证：**原文以基本相同的集群和负载生成条件，解释为何可以比较两套网关的相对表现。但材料没有明确“性能”指标的具体定义，也未交代完整软件版本、参数、重复测试次数或混合流量结果；同时没有分别量化DPU卸载、缓存路由与其他网关差异的贡献。原文未展开更完整的测试控制与可复现性论证。

### 论点10：在高复用流量场景下，F5方案相对Envoy方案取得约1.38—1.48倍的性能。
**相应论据：**[10:42—10:53] 主持人介绍高复用场景，表示只更换网关即可获得约1.38—1.48倍的性能。字幕对被复用内容的描述存在识别疑点，原文没有给出清晰的复用比例。
**相应论证：**该论点直接来自实验室对比结果。结合前文，方案会参考键值缓存位置选择端点，但原文没有单独证明高复用场景中各项机制的贡献，也未披露复用率、请求长度、并发条件和性能指标定义。

### 论点11：多轮聊天场景中的收益随争用压力提高，由约1.13倍提升至约2倍。
**相应论据：**[10:53—11:25] 原文报告，多轮聊天在低争用条件下约为1.13倍，中等条件下约为1.56倍，高争用条件下约为2倍。主持人将场景类比为大量用户同时与ChatGPT对话，并将收益描述为8 GPU集群等效增加约1—8个GPU的服务能力。
**相应论证：**原文通过三个压力档位的结果，说明网关收益依赖工作负载和争用程度。等效增加GPU数量是对相对性能的形象折算，并非实际增加硬件，也不是对其他集群规模的验证。原文没有披露各压力档位对应的具体并发和请求长度。

### 论点12：在无共享前缀且缓存压力较低的场景下，更换网关几乎没有收益，或仅有小幅改善。
**相应论据：**[11:25—11:50] 当请求完全独立、没有共享前缀，且并发为150、每请求输入10,000个令牌时，原文称键值缓存没有受到明显压力，性能比率接近1。[11:50—12:02] 在150并发、每请求输入20,000个令牌时，提升约为4%，主持人称这一改善并不具有颠覆性。
**相应论证：**原文明确解释，低压力场景下集群没有被充分压迫，网关优化发挥的作用有限。这组结果限定了整体结论：智能网关的性能改善存在条件，不能将最高倍数视为所有请求类型的共同收益。

### 论点13：当独立请求造成明显键值缓存争用时，更换网关在该测试中带来3.24倍性能。
**相应论据：**[12:05—12:33] 原文称GPU高带宽内存价格较高；在200并发、每请求输入20,000个令牌的测试中，键值缓存容量不足，涉及缓存淘汰与淘汰对象选择，F5方案获得3.24倍性能。[12:33—12:50] 主持人将8 GPU乘以该性能倍数，形容为接近26 GPU的等效服务能力，并将改善归因于网关及更智能的管理。
**相应论证：**原文将高倍数收益与缓存争用、缓存淘汰和请求管理联系起来，认为更智能的网关在这一条件下作用显著。接近26 GPU是8×3.24的取整类比，不是26 GPU集群的实测结果；原文没有展开缓存淘汰机制，也没有证明该倍数能够迁移到其他模型、GPU或压力条件。

### 论点14：对新增GPU、电力或部署时间受限的存量集群，提高现有硬件效率可能具有较大经济价值。
**相应论据：**[12:52—13:48] 主持人指出，AI基础设施价格较高，因此集群级性能改善可能产生显著金额影响；假设企业已有500或1,000个GPU，却无法获得更多GPU、没有新增电力，或无法按所需时间部署额外基础设施，更换网关可能使相同硬件提供更多性能。原文同时承认，收益取决于使用场景和集群工作负载，并称部分情况下表现约与原有方案相同。
**相应论证：**原文的经济论证是：当扩容受到设备、电力或时间限制时，提高既有设备的有效服务能力，可以在不新增同等GPU数量的条件下满足更多需求。500和1,000个GPU是说明性假设，不是客户案例；材料没有采购价格、总成本或回收期计算，“约与原有方案相同”也不是对所有部署的最低收益保证。

### 论点15：将应用交付等功能从主机CPU卸载到DPU，可以释放CPU资源用于智能体和其他工作负载。
**相应论据：**[13:49—14:12] 原文称将相关处理从CPU卸载到DPU后，CPU可用于运行智能体或其他任务，尤其是与GPU相连的主机CPU核心较有价值。[16:01—16:12] 原文再次说明，F5软件运行在BlueField-3 DPU上，可获得加速且不必占用主机CPU核心。[14:08—14:10] 字幕一处将卸载目标写成“GPU”，与前后明确的DPU描述不一致。
**相应论证：**原文通过处理位置变化解释资源收益：DPU拥有自己的计算与加速能力，因此可承接原本需要主机CPU执行的基础设施功能。材料没有量化释放的CPU核心数、CPU负载下降比例或智能体任务的新增吞吐量。

### 论点16：将普通ConnectX网络连接升级为BlueField-3 DPU，可能成为提高存量GPU服务器性能的一种途径。
**相应论据：**[14:12—14:32] 主持人称DPU比新增GPU便宜得多；即便原有服务器采用普通ConnectX网络连接，替换为NVIDIA BlueField-3 DPU并部署该方案，也可能提高现有服务器集群的性能，尤其是在GPU数量较多时。
**相应论证：**原文将较低的DPU购置成本、基础设施功能卸载和更好的网关调度结合，提出存量改造的可能性。但“可能”是原文保留的条件，材料没有给出DPU与GPU的具体价格、软件成本、改造兼容性、功耗或实际回收期，未展开完整投资回报论证。

### 论点17：BlueField-3具备独立处理器与内存资源，能够承载软件，因此不能仅按普通网卡理解。
**相应论据：**[14:32—15:12] 原文描述BlueField-3同时具有基于ConnectX的网络部分、加速路径和完整Linux系统路径，包含16个Arm v8.2核心，主持人将其描述为A78类核心；另有8 MB二级缓存、16 MB系统级缓存和32 GB板载DDR5。主持人对内存速率使用不确定表述，称“我认为约为5600”，并称其为双通道、比BlueField-2更快。[15:51—16:12] 原文强调其具备承载F5软件所需的计算能力。
**相应论证：**原文以独立CPU、缓存、内存和Linux运行环境解释其软件承载能力，并据此说明F5可以在DPU上运行服务而减少对主机CPU的依赖。内存速率保留主持人的不确定性；材料未提供规格表或独立核验。

### 论点18：BlueField-3的可编程数据路径和高速网络能力，使其具备运行并加速基础设施应用的条件。
**相应论据：**[15:12—15:26] 原文介绍16核可编程数据路径加速器，最多支持256个线程，并提及NVIDIA用于BlueField编程的框架；框架名称在字幕中记为“DOA”，未人工校对。[15:28—15:49] 原文称网络配置可采用1个或2个端口、支持最高400G级网络，并将F5应用作为可编程加速能力的例子；材料没有进一步区分400G的单端口或总带宽口径。[16:14—16:19] 主持人提醒，本次展示使用的是Hopper一代GPU，已有更新一代GPU。
**相应论证：**原文认为，网络功能、可编程加速器和独立计算资源共同构成DPU的应用承载平台，F5方案是这一能力的实例。关于各硬件单元对测试收益的贡献，原文未展开论证；对更新一代GPU，也没有给出测试结果。

## 值得关注的信号

材料呈现的投资含义是：AI基础设施的价值捕获除了GPU硬件本身，还可能来自推理请求调度、缓存感知路由、安全交付软件以及DPU卸载。对已有大量GPU、但新增设备或电力受限的运营方，改善网关与调度可能具有较高经济价值；对F5而言，既有应用交付与安全能力可延伸至AI服务层，对NVIDIA而言，BlueField-3的价值体现为网络之外的基础设施计算与加速能力。不过，收益取决于工作负载、并发和缓存争用程度：材料中的低压力独立请求几乎没有改善，最高3.24倍只出现在特定测试条件下。原文没有披露网关软件价格、DPU采购与部署成本、功耗、性能指标的完整定义或投资回收期，也没有分别量化DPU卸载与网关调度各自的贡献，因而无法据此计算成本节约、判断普遍替代多少GPU，或外推至更新一代GPU和其他规模集群。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"24a5652e293273ac3e82083464517c8ae8c37b63b94d7e0d3374afd19c0f44f0","translationSha256":"cd65fe856a3d7c25df4a175a288c4588dd08cc92a5139d4590c2ca5c90f4f568","sourceCharacters":24840,"timestampValues":540,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":540,"captionTimestampsManagedByProgram":true,"captionRepairedRows":0} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# 3x 用相同的 GPU 创造更多 AI 探访 F5 实验室

- 来源：YouTube·ServeTheHome

- 原始链接：https://www.youtube.com/watch?v=BDNMMsWVE9M

- 时长：1014 秒


## 完整文字稿

[0:00] 如果你现在正在运行 AI 集群，
[0:01] 当然，你会关注应用安全和交付，
[0:03] 但你也会关心这些 GPU 的运行
[0:05] 效率如何。毕竟，GPU 是如今人们部署的
[0:07] 基础设施中成本最高的部分之一。最近，我们
[0:09] 有机会参观了一间展示解决方案的
[0:11] 实验室，该方案不仅能提供
[0:13] 安全方面的保障，还能利用
[0:14] DPU 为这些 GPU 提供更高的
[0:17] 性能，例如 Nvidia Bluefield
[0:19] 使用这些 GPU 可获得更高性能
[0:22] 像 Nvidia Bluefield 这样的 DPU [音乐]
[0:24] 3. 而且我们说的不只是 10
[0:26] 或者性能提升 20%。有时候你
[0:28] 会对你的 AI
[0:30] 交付产生巨大影响，而实现这一点所用的，是很多人
[0:31] 通常不会想到的东西。所以，我们
[0:33] 有很多内容要讲。我们这就开始。
[0:36] 当然，我们还得一路赶到
[0:37] 阳光明媚的加利福尼亚。所以，我们得说
[0:38] 当然，我们还得一路北上前往
[0:40] 我们还是进去看看吧。
[0:42] F5 正在赞助本视频，不过
[0:44] 我们进去看看这个吧。
[0:45] 现在，如果你不了解……的历史
[0:47] F5，他们实际上起步于西雅图
[0:49] 大约 30 年前，作为一家游戏公司，
[0:52] 扩大游戏的规模。于是他们开发了负载
[0:53] 均衡器，随后很快意识到，
[0:55] 他们其实更擅长做
[0:57] 负载均衡，而不是
[0:58] 做游戏。这也
[1:00] 正值所有人开始
[1:02] 做 SSL 和加密之类的事情
[1:04] 的时候。
[1:05] 执行 SSL 和加密等操作，以及
[1:07] 然后，他们最初确实是一家安全公司
[1:09] 所以他们长期以来一直在做
[1:10] 应用和安全方面的业务
[1:13] 但今天我们要来看看
[1:15] 有些不太一样的东西
[1:16] 这确实是一种新的 AI 驱动解决方案
[1:18] 那我们就来看看吧。
[1:20] 我还得跟大家说，我们去过
[1:22] 很多实验室，而这里的 F5 实验室
[1:25] 绝对漂亮。显然，它是
[1:27] 我们去过的最漂亮、最整洁的实验室之一
[1:29] 能看到它真是太棒了。不过我们还是进去看看。现在，AI 集群有许多
[1:31] 很常见、但也有一些新出现的组件
[1:33] 这些组件并不会出现在普通的
[1:36] 云和企业集群里
[1:38] 我来举些例子，带大家
[1:40] 大致看看这里能看到什么
[1:42] 那么，首先
[1:44] 你会注意到
[1:45] 这台机柜和紧挨着它的那台不同
[1:47] 这台没有那些 F5 大型 IP
[1:51] 设备，因为我们实际上是在
[1:53] 软件中实现这些功能。稍后我们会
[1:54] 再多介绍一点，不过这就是
[1:56] 这些机柜之间的一点区别
[1:57] 我们总是需要某种
[1:59] 访问控制和应用交付层
[2:01] 这在我们参观过的各种
[2:03] 集群中都很常见
[2:06] 现在，我来给你们看看
[2:07] 其他一些你们会看到的东西。比如
[2:08] 我们有管理交换机
[2:11] 因为你们并不只有一张
[2:12] 高速网络。你们还有
[2:14] 管理网络。服务器也有自己的管理网络。你们还有
[2:16] 管理网络
[2:18] 用于 DPU 的管理网络。
[2:20] 这里有各种不同的网络
[2:23] 。另一件
[2:24] 你会注意到的事，当然是
[2:26] 我们有不同类型的交换机。我们
[2:28] 有那些手动交换机，但我们也
[2:29] 有一些高速交换机。
[2:31] 它们可用于南北向流量
[2:33] ，也可用于东西向流量，具体取决于
[2:36] 我们所在的数据中心类型
[2:38] 以及我们拥有的集群类型
[2:40] 。你还会注意到
[2:41] 我们有不同品牌的
[2:42] 服务器。你会看到我们有 Dell
[2:44] 服务器，也有 Supermicro 服务器。
[2:47] 当然，你会希望能够使用各种
[2:49] 不同的供应商，这样在
[2:51] 部署解决方案时就不会
[2:53] 被单一供应商锁定。当然，
[2:54] 随着时间推移，你也可能会开始使用
[2:56] 不同的供应商。在这里你会
[2:57] 看到搭载 AMD EPYC 2U 的 Supermicro
[3:01] 服务器。这间实验室里很酷的一件事是
[3:03] F5 正在做的事：他们配备了
[3:05] 多块 DPU。所以你有 GPU。
[3:09] 你可以看到这里有一块、两块、三块，还有
[3:12] 第四块 Nvidia Bluefield 3 DPU。并且
[3:16] 你也有管理网络。
[3:18] 那里还有一个低速网络。
[3:20] 因此这里有多种不同的网络
[3:22] 选项。现在
[3:24] CPU 节点非常重要。并不是
[3:26] 只是因为这些设备有很多 DPU，
[3:27] 更一般地说，你会有 CPU
[3:30] 专用节点或以 CPU 为主的节点来运行
[3:32] 诸如 aentic 之类的东西，就像
[3:34] 传统工作负载，并且还提供
[3:36] 诸如 Kubernetes 控制之类的功能，以及
[3:38] 诸如此类的功能。现在往下看，你会
[3:40] 看到我们这里有一组
[3:42] 这样的 Supermicro GPU 服务器。这些
[3:45] 服务器各自配有 Nvidia H100
[3:48] GPU。当然，这是一个实验室，对吧？
[3:52] 不过他们有一大批 GPU 服务器。
[3:54] 我们的想法是要弄清楚，
[3:55] 如何在所有这些服务器之间
[3:58] 分配负载。最底下是我们的
[4:00] 存储服务器，当然，有些
[4:02] 组织的存储规模非常大，尤其是像
[4:05] 训练集群这样的环境，你可能会看到
[4:07] 大量存储。现在，推理集群
[4:09] 也需要越来越多的存储，所以
[4:11] 你会看到，CPU
[4:14] 算力、GPU 算力、存储，以及多个
[4:17] 网络、管理网络、低速
[4:19] 网络、南北向网络、东西向
[4:23] 网络，有时还有多条网络通道。
[4:25] 这些机架中有一大堆复杂因素，
[4:27] 而这正是这个
[4:29] 解决方案要解决的问题。那么接下来
[4:31] 我们就来看看这一点。
[4:31] >> 这套方案的部分工作方式是，[音乐]
[4:33] F5 Big-IP Next for Kubernetes 会
[4:37] 直接集成到 NVIDIA
[4:38] 云合作伙伴通用[音乐]网络
[4:41] 参考架构中。我刚开始
[4:42] 了解这件事时，心想，
[4:43] 要是能有一张图或一页幻灯片，
[4:44] [音乐]能把 BNK
[4:46] 至少从高层次上能做的所有事情
[4:49] 至少可以在较高层次上做到吗？而且
[4:51] 当然，那些 F5 人有一台，所以我们正在
[4:54] 就作弊一下，用那个吧。所以在
[4:55] 左侧你会看到
[4:57] 客户端和应用程序，也就是所有
[4:58] 想要使用 AI 基础设施的人，以及应用和服务
[5:01] 想要使用 AI 基础设施。
[5:03] 另一侧则是 GPU
[5:05] 基础设施，而在中间你
[5:06] 有你的 F5BNK，它运行着 AI
[5:09] 服务平面。所以这里的想法
[5:11] 是把用户和
[5:13] 应用与 GPU 基础设施连接起来，
[5:16] 而不是只说，嘿，我们有一台
[5:18] 设备，谁想用？你还要去
[5:20] 编排各种事情，还要做好
[5:21] 安全防护，这正是
[5:23] 这里正在做的事。所以你会
[5:25] 看到其中一项功能：通过 EP 实现智能 AI
[5:27] 负载均衡。[音乐] 如果你
[5:29] 有一堆 AI 服务器，还有一群人
[5:30] 在请求各种内容，那么负载
[5:32] 均衡当然是
[5:33] 你会采用的做法。还记得那是
[5:35] F5早期擅长的关键事项之一
[5:37] 。他们只是
[5:38] 把它用到了一个新领域。现在，
[5:40] 另一个功能是 LM 路由编排，
[5:42] 我认为这很有道理，
[5:43] 因为如果你有大量 GPU
[5:44] 基础设施，并在上面运行大量模型，
[5:45] 就需要确保
[5:46] 把所有东西都正确地连接起来，呃，还要确保模型
[5:49] 运行在它们
[5:50] 应该运行的系统上。现在，令牌治理
[5:52] 和计量也非常有用，
[5:53] 对吧？比如说，如果你有某个人，
[5:55] 对吧？比如说，如果你有一个人，
[5:56] 比如有一位工程师，是一名
[5:58] 实习生，他们只想显得自己
[5:59] 很懂 AI，所以他们在疯狂刷
[6:01] token，而且你知道，就是
[6:03] 消耗了海量海量的 token，
[6:05] 但实际上并没有做任何有用的
[6:06] 工作。所以，这是一个很好的理由，
[6:07] 来使用这个方案。现在，零信任安全
[6:09] 已经存在一段时间了，但我们
[6:10] 看到它的部署范围扩大了很多。而且我
[6:12] 认为在这种
[6:13] 情境下非常重要，对吧？因为很多人
[6:15] 会部署 AI 基础设施，
[6:17] 不一定只部署在自己的
[6:20] 桌面电脑上，或者你知道，他们的工
[6:22] 作组服务器上——那台服务器就放在
[6:24] 办公室或隔间中间，
[6:25] 或者其他什么地方。[音乐] 对吧？相反，你
[6:27] 可能会把它部署在
[6:28] 数据中心里，而且很多时候
[6:30] 你甚至可能不会去买
[6:31] 那台设备，而是直接去
[6:32] Neocloud 服务商那里租 GPU 或服务器，
[6:35] 或者类似的资源，而你
[6:37] 要确保安全措施到位，
[6:40] 因为你租用的是别人的
[6:41] 基础设施，而这
[6:43] 是部署零信任安全非常重要的一部分。
[6:45] 你不
[6:46] 希望有人——如果你，
[6:48] 你知道，如果你使用 NeoCloud
[6:49] 或其他服务商，你不希望
[6:51] 有人坐在中间，
[6:53] 看到你输入进去的所有内容，
[6:54] 因为那样就有点违背了
[6:55] 你拥有自己的企业级或
[6:57] 主权 AI，对吧？[音乐] 这确实关系到
[6:58] 我们的下一个方面，也就是多租户
[7:00] 隔离，对吧？因为你可能会有
[7:02] 同一家公司内部的不同团队，或者如果你
[7:03] 正在租用某家供应商基础设施上的
[7:06] 算力资源，那么你肯定不希望
[7:08] 所有人都混在一起，
[7:10] 尤其是他们拥有敏感数据时。
[7:12] 我认为多租户隔离很
[7:13] 有道理，因为比如说你
[7:15] 是财务人员，正在整理
[7:16] 所有的业绩数据，然后你
[7:18] 把这些数据输入一个 LLM，因为我也
[7:20] 不知道为什么，但也许你只是想
[7:22] 再核对一下什么，或者谁知道呢，但
[7:23] 也许你就是那个——你有
[7:24] 尚未发布的业绩数据，这些数据极其敏感，
[7:26] 而你把它们输入进去，你不
[7:28] 希望基础设施上的其他所有人
[7:29] 甚至你们公司内部的其他人
[7:31] 能够看到这些数据，
[7:33] 所以你确实需要强有力的
[7:35] 多租户隔离。当然，
[7:36] 其他行业也有各自的
[7:38] 要求，类似的情况还有很多，
[7:39] 但这只是最基本的思路，
[7:41] 尤其是当你处于共享
[7:43] 环境中时；不过，如果你是在
[7:45] 公司内部，这些也确实是
[7:47] 你需要
[7:48] 多租户隔离的充分理由。这里最后
[7:50] 一点是要有 MCP 和一个
[7:53] Aentic AI 代理。这是，嗯，
[7:55] 非常有用的东西，对吧？
[7:56] 只要能够拥有一种标准化的
[7:57] 模型交互方式，让你能够
[7:58] 与不同的模型进行接口交互 [音乐]
[8:00] 以及各种工具之类的。
[8:01] 所以，对我来说，这也是一件
[8:04] 特别是如果你考虑到
[8:05] 由各种不同应用构成的
[8:07] 连续场景，以及用户接入、退出，
[8:09] 一路延伸到你的 GPU
[8:10] 基础设施。这当然是你
[8:12] 希望拥有的，因为
[8:13] MCP 现在非常流行，也是
[8:15] 如今大多数人 [音乐] 都在用的东西。其中一种
[8:16] F5 提高利用率的方式，是
[8:18] 他们有一个端点
[8:20] [音乐] 选择器。它并不是那种
[8:22] 随机处理请求的选择器，你知道，它
[8:23] 不会把每个请求都当作
[8:25] [音乐] 完全相同的请求。相反，它会考虑
[8:26] 诸如 GPU 指标之类的信息，
[8:27] 比如查看
[8:29] 服务器 GPU 的负载、请求的大小，
[8:31] KV 缓存的位置，
[8:33] 并利用所有这些数据
[8:36] 来判断在哪里处理请求最合适，
[8:37] 并将该请求放置到集群中的相应位置。好，那我们
[8:39] 来聊聊我们打算如何
[8:41] 测试这一点。我们刚刚
[8:42] 向你们展示了实验室的配置。我们有那些
[8:44] 超微服务器，里面装着那些
[8:45] 搭载那些 Nvidia 的 Supermicro 服务器
[8:47] H100 GPU。我们要做的是
[8:49] 使用 Nvidia
[8:51] 性能工具，然后向这些设备发送
[8:53] 流量，具体来说是模拟并发用户和请求。接下来
[8:55] 我们要做的是，
[8:58] 放入
[8:59] F5 big [音乐] IP next，
[9:02] Kubernetes，这会是我们要用到的其中一个
[9:03] 然后我们还会有
[9:04] 一个 Envoy AI 网关。
[9:06] 好。我想做的一件事是
[9:08] 让你们大致了解一下，为什么要
[9:09] 使用完整的 F5 解决方案。为什么我们
[9:12] 会在 Kubernetes 上使用 Big-IP Next
[9:14] 而不是使用像 Envoy
[9:16] 网关这样的东西，比如说其他热门的 [音乐]
[9:18] 网关。于是
[9:20] 我们想到，假如我们去
[9:22] 在几个不同的用例中，对这两种方案进行基准测试，
[9:23] 在同一个，你知道，8GPU
[9:27] VLM 集群上，然后我们就说，好，我们
[9:30] 就针对这两种方案运行几项基准测试，
[9:32] [音乐]看看它们的表现
[9:34] 你知道，是否真的存在性能
[9:36] 差异。当然，我相信你们
[9:38] 也不想看这些原始日志
[9:39] 里的所有内容。所以我们做的是
[9:40] 把这些数据导入，然后构建了一个工具
[9:42] 来进行数据可视化，这样看起来
[9:44] 好多了。你们会
[9:46] 注意到，在这些工具和这些
[9:48] 截图中，会有一组
[9:49] 曲线，清楚地
[9:51] 绘出我们从原始
[9:53] 日志中提取的 F5 解决方案的数据，与
[9:55] 另一种方案的数据；另一种方案
[9:57] 就是 Envoy 方案。你们会
[9:58] 看到 F5 版本与
[10:01] 开源版本的对比。好，接下来是
[10:03] 重点，各位。我们搭建了八台 VLM
[10:05] 服务器，运行着 Quinn 3 32B FP8。
[10:09] 使用同一个负载生成器。整个
[10:11] 配置几乎完全相同。
[10:13] 我们真正
[10:14] 要改变的唯一一点
[10:16] 是我们使用的网关，对吧？我们是
[10:18] 使用 Envoy，还是使用 F5 big
[10:20] IP 接下来用于 Kubernetes？好。现在，我
[10:22] 想做的是把这些
[10:24] 不同的场景都过一遍。这里有
[10:25] 几种不同的情况，我们都跑了
[10:26] 因为，你知道，想想我们构建的
[10:28] 矩阵，对吧？这个
[10:30] 想法是，我们有四种流量
[10:31] 模式。有一种情况是没有，呃，
[10:33] 每个请求都完全独一无二。我们
[10:35] 还有多轮对话，也就是你在
[10:36] [音乐] 和一个
[10:37] 类似聊天机器人的东西聊天。还有一些混合
[10:39] 流量。当然，你还有
[10:40] 高复用率[音乐]的情况。好。
[10:42] 好，先从高
[10:43] 复用率的情况开始，我们会复用很多
[10:45] 我们的，我们的接触率。[音乐]这是一个
[10:46] 通过切换网关，我们可以将性能
[10:48] 提升大约 1.38 到 1.48 倍的情况。
[10:51] 在多轮对话中，性能从
[10:53] 网关。在多轮聊天中，我们会
[10:55] 从 1.13 倍，
[10:57] 还不错。[音乐]当我们到了
[10:59] 中等情况时，大约是
[11:00] 1.56 倍。
[11:03] 然后，当我们到了高负载情况时，
[11:06] 现在大约是 2 倍。所以在这里，
[11:08] 在多轮对话这种场景中，比如说
[11:10] 想想你就坐在那里和 ChatGPT 聊天，
[11:11] 还有一群
[11:12] 用户也在这么做。这是一个不错的用
[11:14] 例，你知道，你，你会得到一些
[11:16] 收益。你可能会觉得，这就像多出了一
[11:18] 到八个 GPU，
[11:20] 只要在里面部署这个方案，或者
[11:22] 实际上相当于多出一个到八个 GPU，
[11:23] 只需部署一个更好的网关，
[11:25] 这很棒。说到这一点，没有
[11:27] 共享前缀，所以一切都是唯一的
[11:28] 情况，对吧？[音乐] 当我们从
[11:31] 非常非常低的，呃，你知道，150
[11:34] 并发开始，但每个请求只有 10,000 个输入 token
[11:35] 时，这就是我们没有
[11:37] 真正给 KV 缓存施加压力的情况。所以我们
[11:39] 也许应该 [音乐] 就把这称作
[11:40] 我不知道该怎么称呼
[11:40] 这个，但我们就称它为 150 x 10k，因为
[11:42] 这里就是这么标注的。你看
[11:43] 它们很接近，对吧？我们得到一个
[11:45] 1 左右的比例。所以在这种情况下，网关
[11:47] 确实没起多大作用，因为
[11:48] 它并没有给整个集群带来太大负担
[11:50] 。即使我们转到
[11:52] 150 并发、每个请求 20k 个输入 token 时，你
[11:55] 知道，你会看到大约 [音乐] 4% 的
[11:58] 提升，我想这还可以。呃，这
[12:00] 不算差，但也不会
[12:02] 带来颠覆性变化。不过看看一旦我们开始遇到
[12:05] KV 缓存
[12:06] 容量不够的情况，会发生什么
[12:09] ，因为要记住，GPU 中的 HBM 相当
[12:11] 昂贵。那么当我们开始
[12:13] 超出这个容量时会发生什么？你会看到
[12:14] 在我们的 200 并发、每个请求 20,000 个
[12:17] 输入 token 这个场景下，情况就会变得
[12:19] 非常非常疯狂，各位。这意味着
[12:20] 当你处在某种竞争非常
[12:22] 激烈的情况中，对吧，那里有 Katie
[12:24] 那些需要被驱逐的缓存
[12:26] 而且你需要弄清楚，比如说，
[12:27] 嗯，应该驱逐哪一个，以及
[12:28] 诸如此类的事情，切换你的
[12:29] 网关突然就能带来
[12:31] 3.24 倍3.24
[12:33] 性能提升。想想看
[12:35] 这相当于多出多少块 GPU。原本
[12:36] 有八块 GPU，现在就相当于
[12:38] 增加到 26 块 GPU。你只要
[12:41] 想想这能省下多少钱。比如说
[12:43] 这真是件很棒的事，只要
[12:44] 切换网关，或者只是换掉
[12:46] 你的网关，让它在
[12:48] 管理这些任务时稍微更聪明一些，
[12:50] 尤其是在 KV 缓存争用严重的
[12:52] 时期。我们来聊聊
[12:53] 如果你有一支集群会怎样，对吧？如果
[12:55] 你有一支集群，这会带来巨大的
[12:57] 经济影响，毕竟如今 AI 基础设施
[12:59] 价格很高。但另一
[13:01] 件非常重要的事是，如果
[13:03] 你已经有了基础设施，
[13:05] 比如说你有一千块 GPU，
[13:08] 或者公司里有 500 块 GPU 之类的
[13:10] 而你想提高它的
[13:12] 效率，因为你会说，嘿，
[13:14] 我们没法再买更多 GPU 了，[音乐] 或者我们
[13:16] 没有更多电力，对吧？我们根本
[13:18] 没法再增加额外的基础设施，
[13:20] 无论何时需要，都无法及时部署
[13:22] ，也无法按我们需要的时间表部署
[13:24] 那么这种情况下，你
[13:28] 就可以换掉网关，然后，呃，你
[13:30] 知道，真正换掉你的
[13:31] 基础设施，采用不同的
[13:32] 安全策略之类的
[13:34] 各种东西，完成所有这些应用服务
[13:36] 交付之类的工作，然后你就能获得
[13:38] 相对影响，最坏的情况下大约
[13:39] 和你原来一样，但你也可能
[13:41] 获得多得多的收益，具体取决于
[13:43] 使用场景[音乐]，或者，你
[13:45] 知道，整个集群在做什么。你可能
[13:46] 从现有硬件中获得多得多的性能
[13:48] 从你现有的同一套硬件中。
[13:49] 这也是同样的思路，对吧？就是
[13:51] 把整件事从 CPU 上卸载下来
[13:54] 交给 DPU。这样做的能力也
[13:56] 意味着你可以用 CPU 来
[13:58] 运行智能体，例如，或者做其他
[14:00] 你想在上面做的事情。
[14:01] CPU 核心通常
[14:04] 很有价值，因为它们[音乐]
[14:05] 连接着 GPU。你不需要
[14:07] 占用这些核心来获得这项收益
[14:08] 因为现在你可以把它卸载到
[14:10] GPU 上，从而有效地利用那些
[14:12] [音乐]硬件。顺便说一句，DPU
[14:14] 比购买一块新 GPU 便宜得多
[14:17] 。所以，即使你装的是普通的
[14:19] ConnectX 网卡，把它换成
[14:21] Nvidia Bluefield 3DPU，并且
[14:23] 能够部署这套方案，实际上
[14:25] 可能就是一种提升现有服务器集群
[14:28] 性能的办法，
[14:30] 尤其是当你有很多 GPU
[14:32] 的时候。现在我们来谈谈 DPU
[14:33] 为这种架构增加了什么。现在，Nvidia
[14:35] Bluefield 3并不是一块简单的网卡。
[14:37] 实际上，这里面有很多东西在运行。
[14:39] 举个例子，这里有一个
[14:41] 基于 ConnectX 的网络侧，不过
[14:43] 还有一整条加速器通路
[14:45] 以及基本上完整的 Linux
[14:48] 系统通路。所以你实际上会获得 16 ARM
[14:51] V8.2。所以大概有 A78 个核心。那
[14:54] 也意味着你会获得大约 8 MB 的二级
[14:56] 缓存、16 MB 的系统级
[14:59] 缓存，甚至还配有板载 DDR5。
[15:01] 你会获得 32 GB 的 DDR5。我觉得它
[15:04] 的运行频率大概是 5600。然后
[15:06] [音乐] 它是双通道的，所以实际上快得
[15:08] 多，胜过 Bluefield 2。
[15:09] 这是这一
[15:11] 代产品的一项重大升级，以支持更高速的
[15:12] 网络连接。现在，还有一个 16 核心
[15:15] 可编程数据 [音乐] 通路
[15:16] 加速器，最多还能支持 256 个线程。
[15:18] 这就是实现大量额外加速的
[15:20] 关键方式之一。而英伟达有
[15:22] 一整套 DOA 运行框架，以及完整的
[15:24] 编程侧工具，专门用于
[15:26] 配合 Bluefield 使用。说到
[15:28] 网络连接，你可以配置一个或两个端口，
[15:29] 支持最高 400 GB 网络带宽。所以，呃，你
[15:32] 知道，毫无疑问，性能非常
[15:34] 强劲的一张网卡，这就是为什么你会看到
[15:35] 它们被用于许多 AI 服务器，而且
[15:38] 配备它的好处之一
[15:39] 不只是 [音乐] 有一张普通的网卡，
[15:41] 还有这样一整套可编程
[15:43] 加速引擎之类的东西，就是
[15:44] 你可以用它来运行各种任务，
[15:47] 比如，嗯，比如这里这个应用。
[15:49] 这是来自 F5 的一个很好的例子。
[15:51] 所以 Bluefield 3 里面有很多东西，
[15:53] 我只是想确保
[15:54] 大家看着它的时候，都能
[15:56] 别把它想成，嘿，你知道的，
[15:58] 我们在这里看到的只是一张普通的
[15:59] 网卡。实际上，这是运行在它之上的某种
[16:01] 东西。而这
[16:03] 正是让 F5 能够运行其
[16:04] 软件于 Bluefield 3 DPU 上，并获得
[16:07] 加速效果，同时不用
[16:09] 让主机 CPU 核心承担负担的关键，因为，嗯，
[16:12] Bluefield 3 本身就已经具备这些能力。而且
[16:14] 顺便说一下，这只是 Hopper
[16:15] 这一代。还有更新一代的
[16:17] GPU。所以，我觉得这
[16:19] 是一个非常有说服力的实例。当然，
[16:21] 也请告诉我你们对这个可视化的看法，
[16:22] 因为我觉得它
[16:24] 很好地展示了
[16:25] 我们想要呈现的内容，尤其是
[16:27] 你知道，当我们面对一
[16:29] 堆原始日志文件时。我觉得这
[16:31] 比看我的 Excel 表格好。呃，那
[16:33] 告诉我这是不是比我的
[16:34] Excel 图表更好，或者你们是否
[16:36] 想在下面的
[16:37] 评论区看到别的内容。我们下次可以
[16:38] 看看。嘿，我还想说声
[16:40] 感谢 F5 的各位，感谢你们
[16:42] 让这一切成为可能。如果你想
[16:43] 加入他们，我想他们现在
[16:44] 正在招聘。另外，如果你喜欢这段视频，
[16:46] 那就分享给你的
[16:47] 朋友和同事，也给它点
[16:48] 赞、点击订阅，并打开
[16:49] 通知，这样你就能知道我们什么时候
[16:51] 发布精彩的新视频。
[16:52] 一如既往，感谢收看。

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=BDNMMsWVE9M
- 来源：YouTube·ServeTheHome
- 发布时间：2026-10-03
- 行业：基础软件与工具链、互联与网络、云与算力服务、服务器与整机制造、算力芯片、Agent与平台
- 公司：F5；NVIDIA；Dell；Supermicro（字幕作“super micro”）；AMD。对比方案为Envoy AI Gateway；视频来源为ServeTheHome。
- 归档时间：2026-10-10T09:10:38.726Z

---

# 3x More AI with the same GPUs Touring the F5 Lab

- 来源：YouTube·ServeTheHome

- 原始链接：https://www.youtube.com/watch?v=BDNMMsWVE9M

- 时长：1014 秒


## 完整文字稿
[0:00] If you're running AI clusters today, of
[0:01] course, you care about application
[0:03] security and delivery, but you also care
[0:05] about how efficient those GPUs are
[0:07] running. After all, GPUs are one of the
[0:09] most costly bits of infrastructure that
[0:11] folks are deploying today. Recently, we
[0:13] got to go to a [music] lab showing a
[0:14] solution that can deliver not just the
[0:17] security side, but it can also offer
[0:19] higher performance for those GPUs using
[0:22] DPUs [music] like the Nvidia Bluefield
[0:24] 3. And we're not just talking about 10
[0:26] or 20% more performance. Sometimes you
[0:28] can get up into the three times more
[0:30] performance [music] and even more. And
[0:31] that has an enormous impact on your AI
[0:33] delivery using something that a lot of
[0:36] people don't normally think of. So, we
[0:37] have a lot to get to. Let's get to it.
[0:38] And of course, we had to travel up to
[0:40] sunny California. So, we have to say
[0:42] that F5 is sponsoring this video, but
[0:44] let's get inside and go check this out.
[0:45] Now, if you don't know the history of
[0:47] F5, they actually started in Seattle
[0:49] like 30 years ago as a gaming company,
[0:52] but then the guys that were running the
[0:53] gaming company realized that they needed
[0:55] to scale their game. So they built load
[0:57] balancers and then they soon realized
[0:58] that they were actually better at doing
[1:00] the load balancing part than they were
[1:02] at doing the gaming part. That was also
[1:04] about the time when everybody started
[1:05] doing things like SSL and encryption and
[1:07] then they started really as a security
[1:09] company and so they were doing
[1:10] application and security for the longest
[1:13] time. But today we're going to go look
[1:15] at something that's a little bit
[1:16] different and that's really a new AI
[1:18] powered solution. So let's get to that.
[1:20] And I just have to say guys, we go to a
[1:22] lot of labs and the F5 lab here is
[1:25] absolutely beautiful. It's clearly one
[1:27] of the nicest, cleanest labs that we go
[1:29] to. So, super cool to see. But let's get
[1:31] in there. Now, AI clusters have a number
[1:33] of very common but also new parts that
[1:36] you don't see in just kind of normal
[1:38] cloud and enterprise clusters. And let
[1:40] me give you some examples and just kind
[1:42] of walk through what you see here. So,
[1:44] first off, you're going to notice that
[1:45] this rack, unlike the one right next to
[1:47] it, this does not have those F5 big IP
[1:51] appliances because we're actually doing
[1:53] that in software. We'll show you a bit
[1:54] more about that in a bit, but it's just
[1:56] kind of a difference between these
[1:57] racks. We always need some kind of
[1:59] access control and application delivery
[2:01] layer, and it's very common in all of
[2:03] the different clusters that we go and
[2:06] tour. Now, let me show you some of the
[2:07] other things that you'll see. Like for
[2:08] example, we have our management switches
[2:11] because you don't just have some like
[2:12] one high-speed network. You have
[2:14] management networks. You have management
[2:16] networks for the servers. You have
[2:18] management networks for the DPUs.
[2:20] There's all kinds of different networks
[2:23] that are in here. The other thing that
[2:24] you're going to notice is of course that
[2:26] we have different types of switches. We
[2:28] have those manual switches, but we also
[2:29] have a number of high-speed switches.
[2:31] Those can be for our north south traffic
[2:33] but also east west traffic depending on
[2:36] the type of data center that we're in
[2:38] and also just what kind of cluster we
[2:40] have. Another thing you'll notice is
[2:41] that we have different brands of
[2:42] servers. You'll see that we have Dell
[2:44] servers as well as super micro servers.
[2:47] Sure, you want to be able to use all
[2:49] kinds of different vendors so you're not
[2:51] locked into a single vendor when you're
[2:53] deploying your solutions. Of course,
[2:54] over time you may end up using different
[2:56] vendors as well. Here you're going to
[2:57] see that we have AMD epic 2U super micro
[3:01] servers. And one of the cool things that
[3:03] F5 is doing in this lab is they have
[3:05] multiple DPUs. So you have your GPUs.
[3:09] You see you have one, two, three, and a
[3:12] fourth Nvidia Bluefield 3 DPU here. And
[3:16] you also have your management network.
[3:18] You have your lower speed network there.
[3:20] So there's a number of different network
[3:22] options that you have in this. Now it's
[3:24] very important to have CPU nodes. Not
[3:26] just because these have a lot of DPUs,
[3:27] but just in general, you will have CPU
[3:30] only nodes or CPU focused nodes to run
[3:32] things like your aentic and just like
[3:34] traditional workloads and also provide
[3:36] things like Kubernetes control and what
[3:38] have you. Now going below that, you're
[3:40] going to see that we have a block of
[3:42] these super micro GPU servers. These
[3:45] each have Nvidia H100
[3:48] GPUs. So this is of course a lab, right?
[3:52] But they have a bunch of GPU servers.
[3:54] And the idea is we want to figure out
[3:55] how do we balance our load against all
[3:58] those. Now on the very bottom we have
[4:00] our storage servers and of course some
[4:02] organizations have huge especially like
[4:05] a training cluster you may see like a
[4:07] lot of storage now inference clusters
[4:09] are getting more and more storage and so
[4:11] you're going to see that you know CPU
[4:14] compute GPU compute storage multiple
[4:17] networks management networks lower speed
[4:19] networks north south networks east west
[4:23] networks sometimes multiple rails there
[4:25] a whole bunch of complexity in these
[4:27] racks and That's really what this
[4:29] solution is designed to solve. So let's
[4:31] get to that next.
[4:31] >> And part of how this works [music] is
[4:33] that F5 big IP next for Kubernetes that
[4:37] integrates directly into the NVIDIA
[4:38] cloud partner common [music] networking
[4:41] reference architecture. When I was first
[4:42] learning about this, I was like, man,
[4:43] wouldn't it be cool if there's like one
[4:44] diagram or slide that just [music]
[4:46] talked about all the things that BNK
[4:49] could do at at least a high level? And
[4:51] of course, the F5 guys had one, so we're
[4:54] just going to cheat and use that. So on
[4:55] the left hand side you're going to see
[4:57] the clients and applications all of the
[4:58] people and also just apps and services
[5:01] that want to use the AI infrastructure.
[5:03] And on the other side you have the GPU
[5:05] infrastructure but in the center you
[5:06] have your F5BNK which is running your AI
[5:09] service plane. So really the idea here
[5:11] is that you're connecting the users and
[5:13] apps with your GPU infrastructure and
[5:16] instead of just like saying hey we have
[5:18] a box who wants to use it you want to go
[5:20] and orchestrate things you want to have
[5:21] security around it and that's really
[5:23] what is going on here. So you're going
[5:25] to see one that we have intelligent AI
[5:27] load [music] balancing with EP. If you
[5:29] have a bunch of AI servers and a bunch
[5:30] of folks requesting stuff, load
[5:32] balancing is of course something that
[5:33] you would do and remember that was one
[5:35] of the key things that F5 was good at
[5:37] back in the early days. They're just
[5:38] using it in a new domain here. Now the
[5:40] other one is LM routing orchestration
[5:42] which I think makes a lot of sense
[5:43] because if you have a lot of GPU
[5:44] infrastructure, you have a lot of models
[5:45] running on that, you need to make sure
[5:46] that you are connecting uh everything
[5:49] correctly and make sure that the models
[5:50] are running on the systems that they
[5:52] need to be. Now, the token governance
[5:53] and metering is also super useful,
[5:55] right? If you have someone, for example,
[5:56] like you have an engineer that is an
[5:58] intern and they just want to look like
[5:59] they're so good with AI, so they're
[6:01] token maxing and they're, you know, just
[6:03] have like crazy crazy amounts of tokens,
[6:05] but they're not really doing any useful
[6:06] work. So, that's a really good reason to
[6:07] have this. Now, zero trust security has
[6:09] been around for a while, but we are
[6:10] seeing it rolled out a lot more. And I
[6:12] think it's super important in this
[6:13] context, right? because a lot of folks
[6:15] are going to deploy AI infrastructure
[6:17] not necessarily just on like their own
[6:20] desktop or like you know their workg
[6:22] groupoup like server that's sitting in
[6:24] the middle of their offices or cubes or
[6:25] whatever [music] right instead you're
[6:27] probably going to go and have it either
[6:28] in a data center and a lot of times
[6:30] maybe you're not even going to go buy
[6:31] the box maybe you're just going to go
[6:32] rent GPUs or servers from a Neocloud
[6:35] provider or something like that and you
[6:37] want to make sure that you have security
[6:40] right because you're renting someone
[6:41] else's infrastructure and that's a
[6:43] really important part of having, you
[6:45] know, zero trust security. You don't
[6:46] want folks to go and if you're, you
[6:48] know, if you're going up to a NeoCloud
[6:49] or another provider, you don't want
[6:51] somebody to sit in the middle and just
[6:53] see all the stuff that you're feeding
[6:54] that because then it kind of defeats the
[6:55] purpose of having your own enterprise or
[6:57] sovereign AI, [music] right? Really gets
[6:58] to our next one, which is multi-tenant
[7:00] isolation, right? Because you may have
[7:02] groups within the same company or if you
[7:03] are renting capacity on a vendor's
[7:06] infrastructure, well, you don't want
[7:08] everybody to co-mingle necessarily,
[7:10] especially if they have sensitive data.
[7:12] Multi-tenant isolation I think makes a
[7:13] lot of sense because like let's say you
[7:15] are the finance guy you're coming up
[7:16] with all of the earnings data and you're
[7:18] feeding that into an LLM because I don't
[7:20] know why but maybe you just just want to
[7:22] double check something or who knows but
[7:23] maybe you're the just you have
[7:24] pre-release earnings super sensitive
[7:26] data and you're feeding it you don't
[7:28] want everybody else that's on that
[7:29] infrastructure or even folks within your
[7:31] own company necessarily to be able to
[7:33] see that and so you really need strong
[7:35] multi-tenant isolation. You know, of
[7:36] course, other industries have their own
[7:38] requirements on that and there's plenty
[7:39] of cases, but that's just the basic idea
[7:41] that especially if you're on a shared
[7:43] environment, but also if you are, you
[7:45] know, within a company itself, those are
[7:47] really good reasons that you do need
[7:48] that multi-tenant isolation. And the
[7:50] last one here is having MCP and an
[7:53] Aentic AI proxy. And that's, you know,
[7:55] something that's super useful, right?
[7:56] Just being able to have a standardized
[7:57] model way that you're going to go and
[7:58] interface with [music] different models
[8:00] and different tools and what have you.
[8:01] And so that to me also is something that
[8:04] especially if you think about the
[8:05] continuum of having different
[8:07] applications and users coming in going
[8:09] all the way over to your GPU
[8:10] infrastructure. Well, that's something
[8:12] that you of course would want because
[8:13] MCP is just super popular and just what
[8:15] most [music] people use these days. One
[8:16] of the ways that F5 is achieving higher
[8:18] utilization is they have an endpoint
[8:20] [music] picker. Now this is not just one
[8:22] that just takes random, you know, it
[8:23] takes every request and thinks that
[8:25] [music] every request is exactly the
[8:26] same. Instead, it's taking things like
[8:27] the GPU metrics, like looking at the
[8:29] load of the GPU of the server, how big
[8:31] the requests are, where the KV cache is,
[8:33] and it's using all of that data to
[8:36] figure out where's the best place to
[8:37] serve a request and to place that
[8:39] request on a cluster. Okay, so let's
[8:41] talk a little bit about how we're even
[8:42] going to go and test this. So, we just
[8:44] showed you the lab setup. We have those
[8:45] super micro servers with those Nvidia
[8:47] H100 GPUs. And what we're going to do is
[8:49] we're going to use the Nvidia
[8:51] performance tool and we're going to fire
[8:53] traffic at those really in terms of
[8:55] concurrent users and requests. Now what
[8:58] we're going to do is we're going to put
[8:59] the F5 big [music] IP next for
[9:02] Kubernetes and that's going to be one
[9:03] that we're going to have and then we're
[9:04] also going to have an envoy AI gateway.
[9:06] Okay. So something I wanted to do was
[9:08] just give you some sense of why you
[9:09] would use the entire F5 solution. why we
[9:12] would use big IP next for Kubernetes
[9:14] versus using something like an envoy
[9:16] gateway like just [music] popular other
[9:18] gateway that you could use. And so the
[9:20] thought was what if we went and
[9:22] benchmarked in a couple different use
[9:23] cases the two on the same you know 8GPU
[9:27] VLM cluster and we just said okay let's
[9:30] just go run a couple of benchmarks on
[9:32] [music] the two of them just see like
[9:34] you know is there actually a performance
[9:36] difference and of course I'm sure you
[9:38] guys don't want to look at the raw logs
[9:39] for all these. So instead what we did is
[9:40] we ingested those and we built a tool to
[9:42] go and do the data visualization so it
[9:44] looks a lot better. You're going to
[9:46] notice on these tools and on these
[9:48] screenshots that there's going to be one
[9:49] set of lines that's really going to
[9:51] chart what we pulled from the raw
[9:53] [music] logs for the F5 solution versus
[9:55] the other solution is going to be the
[9:57] Envoy solution. You're just going to
[9:58] see, you know, the F5 version versus the
[10:01] open- source version. Okay, so here's
[10:03] the big thing, guys. We have eight VLM
[10:05] servers set up running Quinn 3 32B FP8.
[10:09] Same load generator. It's it's the
[10:11] entire setup is almost the exact same.
[10:13] The only thing that we're really
[10:14] changing between the runs is which
[10:16] gateway we were using, right? Are we
[10:18] using Envoy or are we using the F5 big
[10:20] IP next for Kubernetes? Okay. Now, what
[10:22] I want to do is run through all these
[10:24] different scenarios. And there's a
[10:25] couple different things that we ran
[10:26] because, you know, just thinking about
[10:28] the matrix that we built, right? The
[10:30] idea is that we have four traffic
[10:31] patterns. We have something with no uh
[10:33] every request is completely unique. We
[10:35] have a multi-turn chat, so where you're
[10:36] [music] kind of like chatting with a
[10:37] chatbot type thing. You have some mixed
[10:39] traffic. Then, of course, you have the
[10:40] heavy reuse [music] case as well. Okay.
[10:42] Okay, so starting off with the heavy
[10:43] reuse where we're just reusing a lot of
[10:45] our our contact rate. [music] That's one
[10:46] where we're getting anywhere between
[10:48] maybe about 1.38 to 1.48x the
[10:51] performance by just switching out our
[10:53] gateway. On the multi-turn chat, we go
[10:55] from 1.13x,
[10:57] which again not bad in our low
[10:59] contention. [music] When we get to that
[11:00] medium case, we're about 1.56x.
[11:03] And then when we get to the heavy case,
[11:06] well, now we're at about 2x. So here in
[11:08] a multi-turn chat type of scenario like
[11:10] think about just sitting there chatting
[11:11] with chat GPT and having a bunch of
[11:12] users doing that. This is a good use
[11:14] case where you know you you get some
[11:16] gains. You probably get it's like having
[11:18] between one GPU and eight GPUs extra
[11:20] just by having this solution in there or
[11:22] effectively getting one to eight GPUs
[11:23] extra just by having a better gateway
[11:25] there which is awesome. And on that no
[11:27] shared prefix, so everything is unique
[11:28] case, right? [music] When we start with
[11:31] the very very low uh you know the 150
[11:34] concurrency but only 10,000 input tokens
[11:35] per that's the one where we're not
[11:37] really stressing our KV cache. So we're
[11:39] maybe we should [music] just call this
[11:40] like I don't know what we should call
[11:40] this but we'll call the 150 x 10k cuz
[11:42] that's what it is labeled here. You see
[11:43] that it's pretty close right? We get a
[11:45] 1ish ratio. So in this case the gateway
[11:47] really isn't doing that much because
[11:48] it's just really not taxing the fleet
[11:50] too highly. And even when we move to the
[11:52] 150 concurrency by 20k input tokens, you
[11:55] know, you see about a [music] 4%
[11:58] increase, which I guess is okay. Uh it's
[12:00] not bad, but it's also not going to be
[12:02] gamechanging. But look what happens the
[12:05] second that we start running into KV
[12:06] cache where we just don't have enough
[12:09] because remember HBM in GPUs is pretty
[12:11] expensive. So what happens when we start
[12:13] going over that? You're going to see
[12:14] that in our 200 concurrency by 20,000
[12:17] input tokens. That's where things get
[12:19] just just crazy, guys. And that means
[12:20] that when you're in something super
[12:22] contentious, right, where you have Katie
[12:24] caches that are needing to get evicted
[12:26] and you need to figure out like, you
[12:27] know, which one should you evict and all
[12:28] that kind of stuff, switching your
[12:29] gateway is all of a sudden giving you a
[12:31] 3.24x
[12:33] increase in performance. Think about how
[12:35] many more GPUs that is. Instead of
[12:36] having eight GPUs, that would be like
[12:38] going up to 26 GPUs. And you just
[12:41] imagine how much more that costs. like
[12:43] this is an awesome thing just by
[12:44] switching how the gate or just switching
[12:46] your gateway and being a little smarter
[12:48] about how this is being administered
[12:50] when you are in that KV cash contentious
[12:52] era. Let's just kind of talk about what
[12:53] happens if you have a fleet, right? If
[12:55] you have a fleet, then this is a huge
[12:57] dollar impact just given the price of AI
[12:59] infrastructure these days. But the other
[13:01] thing that is super important is that if
[13:03] you already have infrastructure where
[13:05] like let's say you have a thousand GPUs
[13:08] or 500 GPUs in your company or something
[13:10] and you want to go and increase the
[13:12] efficiency of it because you're like hey
[13:14] we can't get more GPUs [music] or we
[13:16] don't have more power right we just have
[13:18] no ability to put in extra
[13:20] infrastructure anytime where we need it
[13:22] like or on a timeline that we need it
[13:24] well then this becomes a case where you
[13:28] can swap out the gateway and set and you
[13:30] know really swipe out your
[13:31] infrastructure, have a different
[13:32] security posture and all that kind of
[13:34] stuff, do all those application service
[13:36] delivery and all that and you get the
[13:38] relative impact of at worst you're about
[13:39] the same as what you had, but you could
[13:41] potentially get a lot more depending on
[13:43] what the use cases [music] or the, you
[13:45] know, the fleet's doing. You could
[13:46] potentially get a lot more performance
[13:48] out of the same hardware that you have.
[13:49] And that's the same idea, right, with
[13:51] offloading the entire thing from the CPU
[13:54] to the DPU. The ability to do that also
[13:56] means that you get to use the CPU for
[13:58] running agents, for example, or whatever
[14:00] the heck else you want to go do on that.
[14:01] You have CPU cores that usually are
[14:04] pretty valuable because they're [music]
[14:05] attached to the GPUs. You don't need to
[14:07] use those to go and get this benefit
[14:08] because you can offload it now to the
[14:10] GPU and actually effectively use that
[14:12] [music] hardware. And by the way, a DPU
[14:14] is much less expensive than buying a new
[14:17] GPU. So, even if you had just normal
[14:19] ConnectX networking in there, swapping
[14:21] out to an Nvidia Bluefield 3DPU and
[14:23] being able to deploy this may actually
[14:25] be a way to go and get more performance
[14:28] from your existing fleet of servers,
[14:30] especially if you have a lot of GPUs out
[14:32] there. Let's now talk about what DPUs
[14:33] add to this architecture. Now, Nvidia
[14:35] Bluefield 3 is not a simple nick.
[14:37] Instead, there's a ton going on here.
[14:39] One example is that there is a
[14:41] connectexbased networking side, but
[14:43] there's also an entire accelerator path
[14:45] as well as basically an entire Linux
[14:48] system path. So you actually get 16 ARM
[14:51] V8.2. So there are like A78 cores. That
[14:54] also means you get like 8 megs of level
[14:56] two cache, 16 megs of system level
[14:59] cache, and you even get onboard DDR5.
[15:01] You get 32 gigs of DDR5. I think it's
[15:04] like 5600 is what that runs at. and
[15:06] [music] it's dual channel, so it's much
[15:08] faster actually than the Bluefield 2.
[15:09] That was one of the big upgrades in this
[15:11] generation to support the higher speed
[15:12] networking. Now, there's also a 16 core
[15:15] programmable data [music] path
[15:16] accelerator with up to 256 threads as
[15:18] well. And that's really how you do a lot
[15:20] of extra acceleration. And Nvidia has
[15:22] this whole DOA framework and this entire
[15:24] programming side just to go and work
[15:26] with Bluefield. Now, in terms of
[15:28] networking, you can do one or two ports
[15:29] of up to 400 gig networking. So uh you
[15:32] know certainly certainly a very high
[15:34] performance nick and that's why you see
[15:35] these in a lot of AI servers and one of
[15:38] the benefits that you get with having
[15:39] not [music] just a simple network card
[15:41] but also like this entire programmable
[15:43] acceleration engine all that kind of
[15:44] stuff is that one you can go run things
[15:47] like uh well like this application right
[15:49] here. This is a great example from F5.
[15:51] So there's a lot going on in Bluefield 3
[15:53] and I just want to make sure that
[15:54] everybody when they look at this they
[15:56] don't think of this like hey you know
[15:58] what we see here is just a simple
[15:59] network card. Really, this is something
[16:01] that's running on top of it. And that's
[16:03] exactly what allows F5 to run their
[16:04] software on the Bluefield 3 DPU, get
[16:07] that acceleration, and not have to
[16:09] burden the host CPU cores because, well,
[16:12] the Bluefield 3 already has that. And by
[16:14] the way, this is just the Hopper
[16:15] generation. There's newer generations of
[16:17] GPUs as well. And so, I just think that
[16:19] this is a really cool proof point. Of
[16:21] course, let me also know what you think
[16:22] about this visualization cuz I think it
[16:24] did a pretty good job of illustrating
[16:25] what we were trying to show, especially
[16:27] when you know we're faced with we have a
[16:29] bunch of raw log files. I think this is
[16:31] better than looking at my Excel. Uh so
[16:33] let me know if this is better than my
[16:34] Excel charts or you know if you'd like
[16:36] to see something else down in the
[16:37] comments. We can go and look at that for
[16:38] next time. And hey, I just want to say
[16:40] thank you to all the folks at F5 for
[16:42] making this possible. If you do want to
[16:43] join them, I think they're hiring right
[16:44] now. Also, if you did like this video,
[16:46] well, why don't you share it with your
[16:47] friends and colleagues, but also give it
[16:48] a like, click subscribe, and turn on
[16:49] those notifications so you can see when
[16:51] we come out with great new videos. As
[16:52] always, thanks for watching.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
