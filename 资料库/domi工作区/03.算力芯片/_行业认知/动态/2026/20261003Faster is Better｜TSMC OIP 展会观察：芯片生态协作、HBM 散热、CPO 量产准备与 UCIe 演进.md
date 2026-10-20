<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_2ab192918b434cc8"
title: "速度更快就是更好｜TSMC OIP 展会观察：芯片生态协作、HBM 散热、CPO 量产准备与 UCIe 演进"
domains: ["算力芯片","互联与网络","服务器与整机制造","数据中心基础设施"]
subdomains: ["芯片设计与IP","存储芯片与HBM","先进封装与制造","AI加速器与GPU","CPO与光电合封","网络架构与组网","铜连接与线缆","超节点与整机柜","液冷与散热"]
types: ["行业认知","视频"]
companies: "TSMC、Cadence、Samsung、SK hynix（字幕作 SKH Highix）、Micron、Synopsys（字幕作 Synopsis）、Nvidia、OpenAI；CPO 受访企业字幕先后出现 GU、GC、ju、juicy 等写法，名称未确认；其光互联合作伙伴字幕作 IR Labs、I lab、ILAB 等，名称未确认；另提及 Analog Bits（字幕作 analog bits）和 PZ（名称或型号转写未确认）。"
published_at: "2026-10-03T14:59:01.305Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=kxWhzTmJfQQ"
source: "YouTube·TechTechPotato"
---

# 速度更快就是更好｜TSMC OIP 展会观察：芯片生态协作、HBM 散热、CPO 量产准备与 UCIe 演进

## 行业认知文章

- 行业：算力芯片、互联与网络、服务器与整机制造、数据中心基础设施
- 公司：TSMC、Cadence、Samsung、SK hynix（字幕作 SKH Highix）、Micron、Synopsys（字幕作 Synopsis）、Nvidia、OpenAI；CPO 受访企业字幕先后出现 GU、GC、ju、juicy 等写法，名称未确认；其光互联合作伙伴字幕作 IR Labs、I lab、ILAB 等，名称未确认；另提及 Analog Bits（字幕作 analog bits）和 PZ（名称或型号转写未确认）。
- 来源：YouTube·TechTechPotato · [原文链接](https://www.youtube.com/watch?v=kxWhzTmJfQQ)
- 发布时间：2026-10-03
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
本期 The Silicon Notebook 由 TechTechPotato 在 TSMC 开放创新平台大会现场录制，围绕 Cadence、Samsung、SK hynix、Synopsys 以及光电合封合作伙伴的展示与访谈，讨论芯片产品如何通过设计工具、接口 IP、存储、先进封装、光互联和整机设计协同落地。全文的重要观点包括：芯片产品依赖多家公司合作，单一技术具备功能并不代表周边生态已经能够支持商业化；下一代 HBM 的散热路径与硅通孔布局成为研究重点；设计模型与实际硅片的一致性关系到首次流片成功；光电合封希望通过带宽、能效和尺寸优势支持大规模 GPU 互联，但展出的方案仍处于概念验证及量产准备阶段；UCIe 芯粒互联正在从特殊需求走向更普遍的设计需求，速度、功耗和工艺兼容性共同决定其价值。来源链接：https://www.youtube.com/watch?v=kxWhzTmJfQQ 。材料标注视频时长为 1063 秒，所提供字幕覆盖 0:00—17:29；字幕为浏览器原生导出，未人工校对识别准确性，部分公司名称、技术名称和型号存在转写歧义。原文未提供拍摄日期，因此文中的“明年”“一两年后”“未来几年”均保留相对时间口径。

### 论点1：芯片产业的产品实现高度依赖生态协作，即使相互竞争的企业也可能彼此采购。
**相应论据：**[0:24—0:39] 主持人称现场有数百家合作伙伴，TSMC 将活动重点放在伙伴生态上。[1:10—1:43] Cadence 的 Ray 将大会称为生态建设活动，表示一个产品可能需要“约 100 家公司”合作，并指出竞争公司也会相互购买产品。[16:41—17:09] 主持人以一位客户为例：该客户需要六家不同供应商的 IP，正在展会现场确认选型，因为产品将使用 TSMC 制造。
**相应论证：**原文通过产品需要众多参与者、竞争者之间仍有采购关系，以及客户同时整合六家 IP 的实例，说明芯片产业的竞争与协作并存。展会的作用在于促成跨公司的技术和产品对接。“约 100 家公司”是受访者的概括性表达，六家 IP 供应商则是主持人提供的单个客户案例，均不是行业统计口径。

### 论点2：技术产品能否销售，取决于配套生态是否存在且达到可用于生产的成熟度。
**相应论据：**[2:18—2:38] Ray 表示，即使企业能够提供一个产品，如果围绕它的生态不存在，产品也无法销售。[2:39—2:58] 他举例称，有些方案在时间上过早，合作方无法围绕其建立系统，因为链条中的某个部分尚不存在、尚未充分发展，或者尚未达到可用于生产的状态。
**相应论证：**受访者给出的因果链条是：单个部件需要被整合进实际系统；系统又依赖其他环节；只要关键配套缺失或尚未成熟，就无法形成可交付的系统，从而限制单个产品的商业化。原文没有列举具体受阻项目或量化这种延迟。

### 论点3：面对面交流能够补充正式沟通中的背景信息，并帮助工程师理解合作伙伴的实际困难。
**相应论据：**[2:59—3:30] Ray 表示，他曾在其他会议上与同一邮件链中的其他公司人员见面，面对面交流带来了更多背景，使沟通更容易；一些人会主动分享遇到的困难，经过持续交流，这些信息会形成有用的情报。[3:30—3:32] 双方以“没有书面留痕”作简短回应。
**相应论证：**原文以受访者个人经历说明，现场交流可以增加邮件往来未充分表达的上下文，使双方更容易理解问题，并从持续分享的困难中获得信息。原文未量化沟通效率提升，也未展开这些信息如何影响具体设计或商业决策。

### 论点4：Cadence 的展示同时覆盖设计工具和多类接口 IP，体现了芯片设计与互联生态需要共同推进。
**相应论据：**[1:44—2:09] Ray 表示 Cadence 展示了新的电子设计自动化方案，以及多协议 IP、HBM 和芯粒互联演示。多协议 IP 支持字幕中所写的“U Link”（U Link）和以太网，面向纵向扩展与横向扩展工作负载；“U Link”的具体标准名称未能从字幕中可靠确认，芯粒互联名称在此处转写为“UCI”。
**相应论证：**受访者将设计工具和多类接口 IP 放在同一展示体系中，并在后续解释这些产品需要周边生态支持。原文未进一步给出各项工具和 IP 的性能、客户采用情况或相互集成效果，因此不能由展示范围推导产品竞争力。

### 论点5：下一代 HBM 的散热需要考虑独立热传导路径，计算芯片功率上升会增强这类结构的重要性。
**相应论据：**[3:58—4:26] 主持人介绍 Samsung 的热路径块，将其类比为类似均热板的装置；其目的在于让计算芯片的热量经由热路径块导出，减少对穿过存储堆叠散热的依赖。[4:28—4:45] 主持人认为该结构对未来三维堆叠 HBM 很重要，并称即使采用二维半封装，随着原文所称“底部芯片”功率达到 2、3、4 千瓦，额外冷却也会有帮助。[4:45—4:57] 他同时提出疑问：芯片高度约为 775 微米，可用于该结构的体量是否足够，并指出散热器和热流通常受益于更大的体量。
**相应论证：**主持人的论证是：堆叠存储可能使计算芯片的热量需要通过存储层传出，独立热路径可以增加另一条导热通道；功率继续上升时，增加散热能力更有意义。但他同时保留对结构体量的疑问。2—4 千瓦是其对后续功率水平的描述，原文未说明具体芯片、测量对象或实现时间，不能视为已展示产品的实测功耗。

### 论点6：Samsung 展示了带热路径结构的 HBM5，并提出温度和热阻改善口径，但字幕不足以判断其验证条件。
**相应论据：**[4:59—5:13] 主持人称 Samsung 展示带有热路径块结构的 HBM5，展示口径为温度差降低 30—50 度，并改善热阻和每颗 GPU 的性能；主持人紧接着询问该结构究竟如何制造。原文没有给出对照方案、负载、环境温度、冷却条件，也没有明确标注温度单位。
**相应论证：**原文传达的是展台宣称，并非完整实验结果。原文未展开论证，无法依据字幕判断 30—50 度改善的适用范围、制造可行性，或其对 GPU 性能的具体贡献。

### 论点7：HBM 路线正与更先进的逻辑工艺和架构演进并行，HBM4E 的规模供货时间仍以主持人估计为主。
**相应论据：**[5:15—5:28] 主持人介绍展台上的高性能架构内容、2 纳米逻辑工艺和全环绕栅极技术，随后展示 HBM4E，并估计其规模供货可能在 2026—2027 年，也可能延伸到 2028 年。[5:35—5:47] 主持人尝试询问 HBM4，但现场人员未直接提供技术说明。[5:50—5:59] 主持人另提及高带宽闪存，表示存储创新不限于标准存储技术。
**相应论证：**原文通过同一展台的逻辑工艺、HBM4E 和其他存储技术展示，说明存储产品与逻辑、架构创新并行发展。原文未论证 HBM4E 的具体量产时间，也未明确说明展示的 2 纳米逻辑与 HBM4E 之间的产品对应关系；2026—2028 年应保留为主持人的预测区间。

### 论点8：HBM 硅通孔布局正在被研究为热、性能、功耗和良率的共同设计变量，底部逻辑芯片中的计算功能也可能改变其要求。
**相应论据：**[6:23—6:42] 主持人在 SK hynix 展台介绍 HBM、逻辑芯片、中介层及堆叠内部的硅通孔。[6:44—7:01] 他提出研究问题：硅通孔是否必须规则排列，能否采用不规则排列或聚簇，以及这些变化是否有助于散热、性能、功耗或良率。[7:01—7:14] 他又提出，若底部逻辑芯片包含计算功能，硅通孔需要怎样设计才能支持，并明确称这些都属于正在进行的研究。
**相应论证：**原文把硅通孔布局视为可研究的设计空间，并指出底部芯片功能变化可能带来新的互联要求。原文未展开论证，也未给出任何布局优于另一布局的测试结果；这些内容是研究问题，不能表述为已实现的性能、功耗或良率收益。

### 论点9：首次流片成功依赖设计模型与实际硅片行为的一致性，先进节点上的模型准确性是关键难点。
**相应论据：**[0:40—0:51] 主持人称 TSMC 当天发布了新的人工智能相关设计工具包，字幕在此处写作“SDK PDK thing”，目的在于让客户更容易完成流片。[8:12—8:22] 他再次谈到人工智能融入设计流程及 TSMC 的“ADK”。[8:26—9:08] 主持人表示，即使公司拥有很大的人工智能预算，首次硅片能够正常工作仍很重要；实现这一点需要设计模型与硅片非常一致，但先进节点上很难事先知道模型是否准确。他提出利用 TSMC 多年积累、较旧节点上已知可用硅片的模型经验，补充设计基础设施，改善后续设计，并称据其了解相关方案受到较好关注。
**相应论证：**原文的逻辑是：流片前通过模型预测实际芯片行为，预测准确性影响首次硅片能否工作；先进节点缺乏充分的准确性把握，因此已验证硅片和历史经验可能帮助改进模型。原文未给出首次流片成功率、工具效果或采用规模；工具名称在字幕中不一致，“受到较好关注”也是主持人的非量化判断。

### 论点10：光电合封的目标价值包括更好的能效、带宽和更小的形态，以支持超过千颗 GPU 的互联。
**相应论据：**[9:16—9:41] 主持人在字幕名称不一致的 GU 展台介绍支持光电合封的机柜，并询问其与 IR Labs 的合作及投入原因。[9:43—10:14] 受访者表示，铜互联存在较多限制，光互联能够提供更好的功率效率、带宽，以及更小的形态，使超过一千颗 GPU 可以连接成一个计算单元；当前演示和参考设计用于向客户展示方案可行性。
**相应论证：**受访者将铜互联限制与光互联在能效、带宽和尺寸上的优势相联系，并据此解释为什么光电合封适合支持更大规模的 GPU 互联。原文未提供铜光对比数据，也未证明展示系统已经完成超过千颗 GPU 的连接；该规模在此处属于目标能力的表述。

### 论点11：展出的 CPO 方案仍处于概念验证阶段，量产时间受到 TSMC COUPE 技术准备进度的约束。
**相应论据：**[10:15—10:30] 主持人询问客户当前只需要演示，还是已推进合作方概念验证设计；受访者回答，目前仍是概念验证设计。[10:30—10:51] 受访者表示，该 CPO 设计使用 TSMC COUPE 技术，字幕写作“coupe”；该技术预计在“明年某个时候”就绪，已有客户讨论采用该技术的初步设计，但规模量产可能仍在“一两年后”。
**相应论证：**原文明确把技术就绪、客户初步设计与规模量产分成不同阶段。既然参考方案依赖的技术尚待就绪，当前客户讨论和概念验证不能等同于量产交付。原文没有给出拍摄日期、具体客户或产量，因此这些时间只能保留为相对预期。

### 论点12：CPO 的商业化还需要建立能够支撑大规模制造的供应链，做出参考设计并不等于具备足够产能。
**相应论据：**[10:54—11:10] 主持人表示 IR Labs 正大力投入供应链，并用假设性产量说明规模要求：每月一万件可能不够，取决于客户，可能需要每月十万件或一百万件。[11:12—11:38] 受访者称，己方承担 ASIC 设计，与 IR Labs 合作；据其理解，IR Labs 正推进供应链，使其能够支持更大规模制造，但具体情况需要向 IR Labs 确认。[11:39—11:50] 受访者表示双方正在帮助客户把参考设计在未来几年推进到量产。
**相应论证：**主持人通过不同数量级的假设强调，大客户的需求可能远超演示阶段所需规模；受访者则将供应链准备与参考设计量产联系起来。每月一万、十万和一百万件都不是已披露订单或实际产能，原文也没有明确这些“件”的产品口径。供应链进度属于受访者转述，且其明确保留了需向合作方确认的条件。

### 论点13：CPO 参考系统需要 ASIC、封装、光引擎、液冷和机械设计协同完成。
**相应论据：**[11:53—12:41] 受访者解释合作优势：字幕所称 GC/GU 一方设计 ASIC，并负责相关封装设计；封装采用 IR Labs 最新的 CPO 引擎；另一方名称在字幕中转写为“wheel”，提供整个托盘、液冷和机械结构设计。受访者称，这套参考设计当天获得不少客户兴趣。
**相应论证：**原文逐项描述参考系统的分工，说明光电合封从芯片到托盘系统涉及多个互相配合的环节。客户兴趣是受访者的定性描述，原文没有给出客户数量、合同或交付数据；“wheel”所对应的企业名称未在字幕中可靠确认。

### 论点14：定制 ASIC 的实现依赖外部合作伙伴，展会中存在多层次的相关供应商。
**相应论据：**[13:02—13:21] 主持人称，这些企业的业务围绕定制 ASIC 设计展开，需要合作伙伴处理额外的相关工作和计算部分；随后展示字幕所称“PZ chip, the SC3”，称其为日本制造的超级计算芯片，并概括称类似企业约有十余家，包含几家一级和若干二级企业。
**相应论证：**原文将定制 ASIC 业务与合作伙伴需求联系起来，并以现场芯片展示和供应商层次作说明。原文未展开具体分工、供应商评级依据或市场规模论证；“十余家”是主持人的现场概括，PZ 与 SC3 的名称或型号也未获得进一步解释。

### 论点15：Synopsys 展示的 UCIe 2 测试芯片以更高传输速率和较低单位比特能耗回应客户需求。
**相应论据：**[13:49—14:12] Synopsys 的 Mark Sauerwald 介绍，新 UCIe 2 测试芯片采用 TSMC N3P 工艺，支持 64 条通道，每条通道每秒 40 吉比特，面向先进封装中的多芯片裸片间通信。[14:14—14:28] 主持人将其描述为超过规范，受访者解释“更快更好”，并称客户一直要求更高速度、更低功耗，同时兼顾性能、功耗和面积。[14:30—14:45] 受访者给出的传输能耗为每比特低于 0.4 皮焦耳，并表示可支持有机基板及硅到硅等不同基板或连接形式。
**相应论证：**原文以通道数量、单通道速率和单位比特能耗说明测试芯片能力，并把这些指标与客户对速度、功耗和面积的要求相联系。原文未给出测试温度、传输距离、工作电压、误码率或完整规范对照，因此“超过规范”应保留为主持人的表述，不能据此判断所有运行条件下的表现。

### 论点16：裸片间通信正在从特殊技术走向更多芯片设计的必备能力，但采用速度的表述仍属厂商定性判断。
**相应论据：**[14:46—15:16] 主持人询问客户交流如何变化；Mark Sauerwald 表示，裸片间通信对当前构建的产品越来越重要，正在从“特殊的技术”变成“必须具备的技术”，采用增长很快。
**相应论证：**受访者将采用增长归因于当前产品对裸片间通信的重要性上升。原文未进一步解释具体产品类型、客户数量、采用率或增长幅度，也未展开多芯片架构带来这种需求的技术原因；结论应限定为厂商对客户需求的观察。

### 论点17：每通道每秒 64 吉比特是后续测试目标或潜在能力，尚不能视为已经确认的结果。
**相应论据：**[15:51—16:05] 主持人提到当前每秒 40 吉比特，并询问是否正在推进每秒 64 吉比特。Mark Sauerwald 回答是，并表示现有这颗较新的硅片“可能”就能达到 64，目前仍在测试、观察其能力范围。
**相应论证：**受访者明确使用可能性措辞，并说明测试仍在进行。原文未展开达到每秒 64 吉比特的技术论证，也未提供该速率下的功耗或其他测试结果，因此应与此前介绍的每秒 40 吉比特能力分开记录。

### 论点18：将 UCIe IP 推进到 N2 的主要价值包括与同节点处理器或存储设计兼容，而非仅由接口自身性能决定。
**相应论据：**[16:06—16:30] 主持人询问 N2 相比 N3P 能带来什么。Mark Sauerwald 表示，UCIe 不会单独占据一颗芯片；如果处理器或存储采用 N2，UCIe IP 也需要能够在该节点中集成使用，因此兼容其他模块是重要价值。
**相应论证：**受访者给出的论证是：接口 IP 是更大芯片设计的一部分，其工艺选择需要与其他功能模块匹配；当处理器或存储转向 N2，具备 N2 实现的接口 IP 才能直接参与整合。原文没有确认 N2 测试进度，也未给出相对 N3P 的速度、功耗或面积增益。

## 值得关注的信号

材料提供的产业观察重点是生态成熟度与协同交付能力：接口 IP、先进封装、光引擎和液冷整机方案需要共同就绪，才能把技术展示推进到客户产品与规模制造。HBM 散热、首次流片成功率、光电合封供应链准备，以及芯粒互联的带宽和单位比特能耗，是原文明确讨论的技术与商业化关注点。对进度应区分现有测试芯片指标、厂商展示口径、客户兴趣、概念验证和未来量产预期；例如 Synopsys 展示了具体 UCIe 测试指标，而 CPO 受访方明确表示仍处于概念验证阶段。材料未提供订单、收入、利润、成本、市场份额或估值数据，无法据此量化具体公司的投资回报，也不能把展会兴趣或参考设计直接视为已实现的商业收入。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"f65ce6ce8aaef9d796a3cf37f1249f639bd1d4f8e8699a4afdd4fbb5a2e777aa","translationSha256":"3b436262c9dc1f1f5faf979ac168236d625a9a8359a8f1254a2056fde0c6e59f","sourceCharacters":21062,"timestampValues":480,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":480,"captionTimestampsManagedByProgram":true,"captionRepairedRows":0} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# 越快越好 // 硅片笔记本 E4

- 来源：YouTube·TechTechPotato

- 原始链接：https://www.youtube.com/watch?v=kxWhzTmJfQQ

- 时长：1063 秒


## 完整文字稿

[0:00] 大家好，欢迎再次来到
[0:01] 《硅晶片笔记》。我们现在在台积电的
[0:04] 开放创新平台大会。
[0:07] 只在湾区待一天，台积电就把全部焦点放在合作伙伴身上。我们
[0:10] 拍过几期关于这场活动的视频，
[0:12] 是在过去几年里拍的。你们可以去
[0:14] 频道里看看。嗯，不过
[0:15] 说实话，就像每期《笔记》一样，我们
[0:17] 只是想让你们看看
[0:20] 在展会现场是什么样子。正如你们所见，
[0:21] 有数百家合作伙伴。嗯，我们刚刚
[0:24] 上周才来这里参加 AI 基础设施
[0:26] 峰会。这场活动规模稍微
[0:27] 小一点，嗯，但对
[0:28] 台积电的生态系统非常关键。一如既往，
[0:31] 这类活动的理念
[0:34] 是台积电把焦点放在
[0:36] 合作伙伴身上，而不是 [吸鼻子]
[0:39] 自己身上。我们会听一场
[0:40] 主题演讲，他们今天早些时候发布了新的 AI，呃，
[0:44] SDK PDK 东西，嗯，他们的想法是
[0:49] 让
[0:51] 客户更容易流片。那么，我们走
[0:54] 到这边来，呃，因为有几家
[0:56] 公司已经引起了我的注意，
[0:57] 我们过去
[0:59] 和这边 Cadence 的 Ray 聊聊。嗯。
[1:02] Ray，最近怎么样？
[1:03] >> 很好。
[1:04] >> 到目前为止，展会体验怎么样？
[1:06] >> 嗯，我的意思是，我已经站在这里
[1:07] 一阵子了，和很多
[1:09] 不同类型的人交谈。
[1:10] >> 那么，Cadence 希望从
[1:12] 这样的活动中获得什么？嗯，我的意思是，这是
[1:14] 一场构建生态系统的活动，呃，在这里有一个
[1:17] 很多公司能够相互交流，并着手构建
[1:18] 围绕各种事物的生态系统
[1:20] 各种事物周围的生态系统
[1:22] 因为你需要大约 100 家公司
[1:24] 共同推出一款产品。
[1:26] >> 这是协作吗？还是……
[1:29] >> 我认为协作更常见一些
[1:30] 竞赛？
[1:32] 而不是竞争。我的意思是，竞争方面
[1:34] 会有很多不同的解决方案，但在这个
[1:36] 行业里，你知道，很多相互竞争的公司
[1:38] 也会彼此购买东西。
[1:39] 还有，Cadence 今年在展会上展示什么？
[1:41] 我知道你一直在这个展位上忙着接待，
[1:43] 这里在展示些什么？
[1:44] >> 嗯，总体来说，Cadence 正在展示
[1:45] 他们的新 EDA 解决方案，各种方案都在这里。
[1:46] 至于 IP 解决方案，我们这里有几个演示，
[1:48] 其中一个是我们的多协议 IP，
[1:49] 它支持 U-Link 和以太网，尤其适用于
[1:51] 扩展和横向扩展工作负载集群。我们旁边
[1:53] 就是 HBM 演示，然后我们还有 UCI……
[1:56] >> 所以，重点是确保支持下一个标准吗？
[1:59] 你知道，你们在展会上和合作伙伴
[2:01] 进行了哪些交流？
[2:03] >> 呃，更多是关于如何启用生态系统。也就是说，
[2:05] 呃，如果有人正在构建一种解决方案，
[2:07] 那种解决方案会在某个地方落地实施。生态系统建设涉及很多……
[2:09] 演示。
[2:10] >> 那么，关键就是确保
[2:12] 支持下一个标准，你知道吗
[2:15] 你正在与谁交谈
[2:16] 展会上合作伙伴？
[2:18] >> 呃，更像是，当你尝试的时候，呃
[2:21] 为了支持生态系统，呃，这意味着
[2:24] 呃，如果如果有人正在构建一个解决方案
[2:26] 该解决方案将得到实施
[2:27] 某个地方。大量的生态系统建设
[2:30] 事情会这样发生，呃，我们可以
[2:33] 我们可以提供一款产品，但如果
[2:35] 围绕它的生态系统不存在，那它
[2:36] 就不会——不会推进，也不会得到
[2:38] 卖掉了。
[2:39] >> 所以你们在展会上会进行这类交流。
[2:40] 是的，当然。而且
[2:42] 有时他们会说，比如说，这个
[2:44] 东西推出得有点早，赶在日程的前面
[2:48] 了，而我们就是没法围绕它构建一套
[2:51] 系统，因为这条产业链中的某个
[2:53] 环节还不存在，或者
[2:56] 还不够突出，或者还没有量产。
[2:58] 准备好了。
[2:59] >> 好。对于像你这样的工程师来说，
[3:00] 能和这些人面对面交流会有帮助。
[3:03] 人们。
[3:04] >> 是的，当然。所以，呃，我还参加过
[3:07] 另外几场会议，也有机会和其他
[3:09] 公司的人员交谈，他们和我在同一个
[3:11] 邮件往来链中，而且我们的交谈有了
[3:13] 更多背景信息，沟通起来也
[3:15] 容易得多，容易得多。呃，而且
[3:18] 像在这里这样的场合，我们能认识
[3:21] 一些人，他们愿意敞开心扉，分享
[3:23] 自己的困难，而这在持续数月之后会
[3:25] 转化为情报。
[3:28] 是在持续数月之后。
[3:30] 它。
[3:30] >> 你是说没有书面记录？
[3:32] >> 没有书面记录。是的。
[3:34] 太棒了。好，非常感谢你，Ray。
[3:36] 祝你在展会上顺利。我知道
[3:38] 还有几个小时。我想带大家
[3:40] 到这边来聊聊 Samsung。那么，
[3:43] 对于上周关注我报道的各位，
[3:44] 呃，我们算是
[3:46] 报道了 SKH Highix。呃，不过 Samsung 也
[3:49] 在这里展示他们的 HBM。我们能不能
[3:51] 挤进去一下。呃，就像
[3:53] 一直以来，我们都有一个非常，嗯
[3:56] 令人印象深刻的演示。不同之处
[3:58] 在于这个。这是
[3:59] 热通路块。我们在 Hot Chips 上见过这个。
[4:02] 当我们转向下一代
[4:04] HBM 时，有热方面的问题需要
[4:07] 考虑。所以这些公司
[4:09] 将开始采取的做法，不只是
[4:10] 三星，另外两家
[4:11] 也一样，就是在你的内存旁边，
[4:14] 基本上还会有一个
[4:16] 几乎像蒸汽腔一样的装置
[4:19] 来帮助加快散热。
[4:20] 所以，这里是你的算力裸片，
[4:22] 热量不再穿过
[4:24] 内存，而是穿过
[4:26] 热通路块。所以，当你在做
[4:28] 诸如3D堆叠 HBM 这样的事情时，
[4:31] 嗯，我想三星把它叫作 ZHBM
[4:33] ，嗯，最终这会成为一个
[4:35] 非常重要的问题。但即便
[4:37] 你不只是做3D，而是
[4:38] 做2又半D，仅仅因为这些
[4:40] 基底裸片显然会开始
[4:42] 达到2 kW、3 kW、4 kW，这种
[4:45] 额外的冷却会有所帮助。我的
[4:47] 问题总是：质量够不够？
[4:48] 考虑到这些裸片的高度
[4:51] 大约只有775微米
[4:54] 这里留给质量的空间不多，而
[4:56] 通常质量有助于散热器和
[4:57] 热流。不过我们看到三星展示了一些
[5:00] HBM5，采用这种热通路盒
[5:03] 结构。他们在这里说，温差降低30到50°，
[5:06] 热阻更低，
[5:07] 每个 GPU 的性能也更好。
[5:10] 那是个……我想知道那具体是怎么
[5:13] 制造出来的。我们还有一些，呃，高
[5:15] 性能架构方面的东西。嗯，
[5:17] 你知道，2纳米工艺在这里，呃，展示
[5:20] 逻辑芯片上的全环绕栅极技术。
[5:23] 现在我们有了HBM4E。这显然
[5:25] 会是26 27，嗯，可能进入28
[5:28] 这类量产阶段。嗯，如果我们看这里
[5:30] 的晶圆，如果你愿意，可以走近点
[5:32] 看看，上面有很多很多颗芯片裸片。
[5:35] 你想跟我们介绍一下HBM4吗？
[5:37] >> 呃
[5:37] >> 谁想聊聊HBM4？
[5:39] >> 我想，呃，我们会联系相关人员，让他们
[5:41] 下来。
[5:42] >> 好。好。好。好，所以没人
[5:43] 在聊对冲4，但他们确实有
[5:45] 裸片在这里，而且他们[哼了一声]正在展示
[5:47] 它。嗯，你知道，
[5:50] 之后还会有很多很多内存方面的内容，而且
[5:52] 我们看到的不只是标准的内存
[5:54] 技术。我们
[5:56] 还看到一些东西，比如高
[5:57] 带宽闪存，嗯，你上周可能已经看到了。
[5:59] 我身后这里是台积电的展台
[6:02] 那里有很多有意思的演示
[6:04] 不过我都不能给你们看，呃，
[6:07] 因为，因为这些都不允许拍照，
[6:10] 也不能碰。嗯，不过一如既往，
[6:12] 看起来确实相当令人印象深刻。
[6:15] 大封装尺寸。台积电正在展示
[6:17] 他们最新一代的一些
[6:19] 硬件。我们来看看 SK 海力士，如果我们
[6:23] 可以的话。嗯，因为他们也有
[6:26] 这里展示的演示：高带宽
[6:29] 内存、逻辑裸片和
[6:30] 中介层，还有许多你知道的炫酷
[6:33] LED。这里很有意思，如果你往下看
[6:36] 一个 HBM 堆栈内部，这就是你看到的
[6:38] 那些硅通孔。不过，如果我
[6:42] 如果你能拿到镜子，比如说，嗯，
[6:44] 现在讨论的是
[6:46] 这些硅通孔是否
[6:48] 实际上可以通过排列来帮助改善
[6:50] 热性能。它们必须规则排列吗？
[6:52] 可以不规则排列吗？可以
[6:54] 聚集排列吗？或者，你知道，是否有
[6:56] 性能方面的收益、功耗方面的收益，
[6:59] 或者这样做带来的良率收益？
[7:01] 或者在某些情况下，也许这里的逻辑
[7:03] 裸片，也就是基底裸片，里面实际上有一些
[7:06] 算力。那你必须对硅通孔
[7:09] 做些什么，才能
[7:10] 实现这一点。这些都是
[7:13] 目前正在进行的研究内容。人们
[7:14] 会在会议上讨论这些。嗯，而且
[7:17] 你知道，如果你愿意翻阅
[7:19] 一页又一页的资料，嗯，你会看到
[7:22] 很多相关内容。他们正在展示
[7:24] 这一侧的存储产品，以及一些
[7:26] 最新一代的存储产品。嗯，这是一个
[7:29] 非常、非常热闹的展台。呃，我们看到
[7:31] 我们熟悉的朋友 Yan Vardan 就在这里
[7:34] 站在英伟达前面，站在一些
[7:35] 他们最新一代 HBM 前面，
[7:38] 当然。嗯，你知道，就像三星一样
[7:40] 展示具体发生了什么。
[7:42] 我们过去看看。嗯，呃，
[7:46] 遗憾的是，展会上没有 Micron，
[7:48] 这倒挺有意思。我们，嗯，我
[7:51] 上次碰到 Micron，我想
[7:52] 其实是在 GTC。嗯，不过我们有
[7:56] Synopsis 在城里。他们通常
[7:59] 很乐于展示他们
[8:01] 在做什么。嗯，我想过来，呃，
[8:04] 其实我想和他交谈的那个人
[8:06] 现在正在接受采访。嗯，这
[8:09] 总是常有的事。不过就像，嗯，ju
[8:12] 就像其他展会一样，重点都在于
[8:14] AI 集成正在何处发生。
[8:16] 关键在于通过整个
[8:18] 流程来实现它。实现 TSMC 的 ADK 这类功能。
[8:22] 嗯，我一开始有点跳过了
[8:24] 第一块硅片的
[8:26] 整个概念，我最近在 Twitter 上
[8:28] 稍微谈过这件事。
[8:30] 呃，这些大公司，即便
[8:32] 拥有庞大的 AI 预算。你们会
[8:34] 在我对 OpenAI 的 Richard Hoe 的采访中看到，
[8:36] 让第一块硅片正常工作
[8:38] 很重要。只有当你的
[8:41] 模型——你的模型到硅片的映射
[8:44] 实际上非常准确时，这才行得通，但在
[8:45] 先进制程上很难做到，因为你
[8:47] 不知道模型是否准确，而
[8:50] 我们的想法是，利用 TSMC 这些年来
[8:52] 积累的一些经验，能否用这些模型
[8:54] 来补充你的设计
[8:57] 基础设施，嗯，这些模型拥有
[9:00] 已知的、可靠的硅片，来自
[9:02] 较旧的制程节点，从而帮助改进未来
[9:04] 将要推出的产品，嗯，就我而言
[9:07] 他们显然在这方面获得了不错的市场反响
[9:08] 而且我们这里还有 GU 展台
[9:11] 。我们在
[9:13] 上一场会议上稍微了解了一下他们，不过在这里
[9:16] 这是他们支持 CPO 的机架。嗯，
[9:19] 没事。没事，别担心。
[9:21] 别担心。嗯，你知道，我们之前
[9:23] 在 IR Labs 那里也见过这个，呃，这次又是在 AI
[9:26] 基础设施峰会上展示了
[9:27] CPU 和所有那些 CPO 相关厂商所在的位置。有没有
[9:30] 人能跟我们聊聊
[9:32] 这个？嗯
[9:33] >> 嗯，我是说，我是说，我在和
[9:35] IR Labs 的人合作，所以我大概知道
[9:37] 你们在做什么，但你能解释一下
[9:39] 这里的关系吗？还有，为什么
[9:41] 你们如此大力投资 CPO？
[9:43] >> 好的，非常感谢。我认为 CPO
[9:44] 已经进入发展进程，因为
[9:47] Cobbo 能做的事情受到很大限制
[9:49] 而光学技术能够带来更好的
[9:52] 能效和
[9:54] 带宽，而且重要的是，能实现更小的
[9:57] 外形尺寸，从而支持多达
[10:02] 一千多块 GPU，并且它们可以
[10:04] 连接成一个计算机单元。这
[10:06] 就是我们制作这个演示样机的原因。好。
[10:09] 对，对。我们有参考设计，供
[10:11] 客户使用，向他们展示 CPO 是
[10:14] 一个可行的方案。
[10:15] >> 那么目前客户具体在产业链的哪个环节
[10:16] 提出了需求？他们只是想看演示，还是
[10:19] 你们真的在推进，比如说
[10:20] 与合作伙伴共同开展概念验证设计？
[10:23] 我想目前我们
[10:25] 你的合作伙伴？我想目前我们
[10:27] 仍然是概念验证设计，因为
[10:30] 目前，呃，这里的设计，CPO，
[10:33] 使用的是 TSMC 的 CoWoS 技术，而这项
[10:37] CoWoS 技术要到明年某个时候才会就绪。
[10:40] 所以我们已经有了
[10:44] 一些客户讨论，初步
[10:46] 设计将使用 CoWoS，但量产
[10:49] 可能还要一两年
[10:51] 出去。
[10:51] >> 好的。那么，那么，那么，那么，接下来的
[10:54] 五年会是什么样？因为每当我
[10:55] 跟比如说 IR Labs 的人交流时，呃，他们都在
[10:58] 大力投资供应链。
[10:59] >> 是的。
[11:00] >> 对。因为，呃，即使你把它造出来，
[11:02] 你也没法只靠 10,000 一个月的产量应付过去。
[11:05] >> 你可能需要做到每月 100,000，或者
[11:07] 每月一百万，具体要看
[11:08] 客户。对吧？所以跟我解释一下，解释一下
[11:10] 接下来会发生些什么
[11:11] 接下来的 5 年。
[11:12] >> 我认为从 CPO 这一侧来说，对于 Juicy，
[11:15] 我们负责设计。所以我们在这里设计 ASIC，
[11:19] 对吧？所以我们和 IL 合作。据我
[11:23] 了解，IL 实际上正在努力
[11:26] 完善并确保 CPL 供应
[11:30] 链可行，并为
[11:32] 大规模制造做好准备。不过我
[11:35] 认为关于这部分，你得去问问
[11:38] ILAB。所以，是的。
[11:39] >> 不，但你们也怎么参与其中
[11:41] 呢？我们和
[11:44] ILAB 合作，使我们的客户能够，呃，能够
[11:49] 在未来几年内将这项参考设计投入
[11:50] 量产。
[11:53] >> 我一直看到你们一起展示
[11:55] 结束。
[11:56] >> 那么，真正特别之处是什么？
[11:58] >> 我认为，实验室和 ju 之间确实有很好的协同
[12:01] ，呃，尤其是这里的 wheel 也是如此。
[12:04] 所以，正如你们从
[12:07] 这个参考设计中看到的，GC 实际上
[12:10] 设计了 ASIC，也负责封装
[12:13] ，呃，部件的设计；在这个
[12:15] 封装设计中，我们采用了 I lab 的，呃，
[12:19] 最新 CPO 引擎，对吧？有了这款 CPO
[12:22] 引擎，wheel 也展示了他们
[12:25] 可以设计整套托盘，并配备
[12:28] 液冷，以及整套
[12:31] 机械，呃，装置来实现这一点。这
[12:35] 是我们向客户展示的
[12:37] 参考设计，我们也从客户那里获得了很多
[12:39] 有意思的，呃，兴趣。
[12:41] 今天的客户。
[12:42] >> 好的。好的。酷。太棒了。我其实
[12:44] 这周花了一些时间和 IR Labs 在一起。
[12:47] 我看到了，呃，即将在
[12:49] O，呃，在 OPC 上展示的演示。
[12:51] >> OCP.
[12:52] >> OCP。我老是说错。OCP。那
[12:54] 还挺酷的。还挺酷的。
[12:56] >> 我们也会去那里。
[12:57] >> 是啊。是啊。是啊。不，真的太棒了。
[12:58] 非常感谢。非常感谢。
[12:59] >> 谢谢。嗯，是啊。你知道，这些
[13:02] 人做的全是定制 ASIC 设计，
[13:04] 对吧？而且你们得有合作伙伴
[13:06] 来做这些额外的 sis。你还得做
[13:08] 额外的算力。嗯，我们之前
[13:10] 稍微展示过这个，不过
[13:11] 这是 PZ 芯片，SC3，你
[13:14] 知道，那是[吸鼻子]一款超级计算
[13:15] 芯片，呃，由日本制造
[13:18] 大概有十几家公司
[13:20] 像这样，几家一级厂商，还有几家
[13:21] 二级2厂商。嗯，不过我们现在在新思科技
[13:25] 这里，这里有他们最新的，呃，
[13:27] 以太网芯片。我觉得他们已经展示
[13:28] 这个有一段时间了，不过
[13:30] 这是他们的第二代
[13:33] UCIe，台积电N3P。整个
[13:36] 意思是，如果你有意采购，欢迎
[13:39] 进来。我们以前聊过，对吧？
[13:41] >> 说说你的名字。
[13:43] >> 我是新思科技的 Mark Sauerwald。
[13:46] >> 那么，给我们讲讲这个演示。这里
[13:47] 在做什么？
[13:49] >> 所以，这是用于 UCIe 的一款新测试芯片
[13:52] 2。我们有一块测试芯片，它是
[13:54] 支持64条通道，每条通道速率为40 Gbit
[13:58] 每秒，采用先进
[14:00] 封装节点。这一款
[14:03] 采用台积电的 3N3P 制程。所以
[14:08] 我们能传输海量数据，
[14:10] 实现芯片裸片到芯片裸片之间的数据传输，
[14:12] 用于多芯片方案。
[14:14] >> 所以你们的速度超过了规格要求。为什么？
[14:17] >> 因为更快。越快越好。
[14:20] >> 这是客户的需求吗？
[14:22] 就是一味地追求速度。
[14:23] >> 总是要更快的速度、更低的功耗。
[14:26] >> 嗯，除此之外，当然还要看 PPA，
[14:28] >> 当然。是的。所以我们把各个环节都
[14:31] 准备齐了。就这个例子来说，我们低于
[14:33] 0.4 焦耳/比特，我们
[14:36] 传输的数据
[14:37] >> 是通过有机基板
[14:39] >> 进行传输的。我们还能使用许多不同的
[14:41] 基板。所以，是的，这是 A。那么我们
[14:44] 可以采用有机方式，我们可以做到芯片到
[14:45] 芯片。
[14:46] >> 呃，那么，最近有哪些客户或来访者
[14:48] 到展位来问起这件事？
[14:49] 呢？
[14:51] >> 当
[14:53] 今天我我我觉得，我觉得几个月前我们
[14:56] 可能聊过这个。所以，
[14:58] 嗯，这些交流
[15:00] 有什么变化？我想
[15:02] >> 还在持续。我觉得
[15:04] 裸片到裸片的通信正变得
[15:06] 越来越重要，这关系到各种
[15:07] 正在构建的东西。我们
[15:09] 看到这正在从一种非主流
[15:11] 技术，变成一种必不可少的
[15:14] 技术，因此它的采用速度
[15:16] 确实非常快。
[15:18] >> 你有机会四处走走吗
[15:20] >> 一会儿？还有，还有，还有，还有，什么什么
[15:23] 让你感到兴奋？因为，嗯，你知道，
[15:26] 有时会让人觉得这
[15:27] 不过是些常规的东西。那么，像这样的展会上，
[15:29] 究竟有什么真正令人兴奋的？
[15:31] >> 哦，
[15:32] 只是我们看到人们在涉足
[15:34] 的各种不同事物，以及
[15:36] 各种不同维度的数量。所以
[15:38] 这非常令人兴奋。看到
[15:40] 竞争对手紧追着我们，
[15:42] 让我们更有动力加倍努力，也令人兴奋。
[15:45] 所以，是的，有很多好事。
[15:47] >> 所以你的意思是你们领先？
[15:49] >> 当然。当然。[笑声]当
[15:51] 然。嗯，有了 UCI 2，那就是
[15:53] 《电音比利》之类的。是啊。还有
[15:55] 40 千兆。嗯，你们正在研发 64，
[15:57] 我想是吧。
[15:58] >> 是的，是的。我们可能可以用这个做到 64
[16:01] 这个芯片相当新。
[16:03] 我们正在测试它，看看它的表现
[16:05] 如何
[16:06] >> 好。呃，你可能已经
[16:08] 在 N2 上测试。这会
[16:11] 可能会带来你在 N3P 上无法获得的东西？
[16:14] 嗯，它将要做的主要事情是
[16:16] 在 N3P 中，从性能角度来看所做的事
[16:19] 一颗芯片裸片上。所以它将能够
[16:21] 与其他
[16:24] 组件兼容。如果你正在开发一款处理器
[16:25] 这些事情。如果你正在开发一款处理器
[16:27] 或者将用于 N2 的内存
[16:30] 太棒了。非常感谢。
[16:32] >> 太好了。
[16:32] >> 很高兴又在 OIP 见到 Synopsys 的各位，一如既往。
[16:34] >> [嗤鼻声]
[16:36] >> 嗯，是的，这就是我在 OIP 这样的展会上
[16:37] 一贯的感受。你知道，这几乎就在展会的名字里。
[16:37] 它讲的是合作，对吧？你不可能
[16:41] 在这个行业里一路走下去，却不与人合作。嗯，你知道，我这周
[16:44] 和一位客户交谈时，他们需要来自六家
[16:47] 不同供应商的 IP，他们正在
[16:49] 逛展会，确保自己
[16:51] 选对了供应商，因为他们
[16:53] 将基于 TSMC 构建产品。嗯，所以
[16:54] 在这样的活动中，会发生各种各样的合作和
[16:57] 交流。嗯，我还要再和
[16:59] 几个人聊聊。我能看到，
[17:00] 买对了合适的，因为它们……
[17:02] 将在 TSMC 上构建。嗯，所以
[17:04] 这都是那些不同的参与方式，以及
[17:06] 以及以及在……中发生的对话
[17:09] 像这样的活动。嗯，我知道我已经有一个
[17:11] 还要再找几个人聊聊。我能看到，
[17:12] 你知道，Andy 在那边，还有模拟
[17:15] 比特。嗯，不过你知道，希望你们
[17:17] 喜欢这期新的《Silicon Notebook》。
[17:19] 我觉得我们下一次做这个节目的会议会
[17:21] 是在 OCP，或者说，嗯，也可能是 Semicon West。嗯，所以
[17:24] 一定要继续关注后续。别
[17:26] 忘了关注 potato，我会
[17:27] 下次再和你们见面。
[17:29] 下次再见。

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=kxWhzTmJfQQ
- 来源：YouTube·TechTechPotato
- 发布时间：2026-10-03
- 行业：算力芯片、互联与网络、服务器与整机制造、数据中心基础设施
- 公司：TSMC、Cadence、Samsung、SK hynix（字幕作 SKH Highix）、Micron、Synopsys（字幕作 Synopsis）、Nvidia、OpenAI；CPO 受访企业字幕先后出现 GU、GC、ju、juicy 等写法，名称未确认；其光互联合作伙伴字幕作 IR Labs、I lab、ILAB 等，名称未确认；另提及 Analog Bits（字幕作 analog bits）和 PZ（名称或型号转写未确认）。
- 归档时间：2026-10-10T09:10:27.703Z

---

# Faster is Better // The Silicon Notebook E4

- 来源：YouTube·TechTechPotato

- 原始链接：https://www.youtube.com/watch?v=kxWhzTmJfQQ

- 时长：1063 秒


## 完整文字稿
[0:00] Hi everyone, welcome again to the
[0:01] Silicon Notebook. We are at TSMC's
[0:04] Open Innovation Platform Conference.
[0:07] Just one day in the Bay Area and TSMC
[0:10] makes it all about their partners. We
[0:12] got a couple of videos about the event
[0:14] over the last few years. You can go
[0:15] catch them on the channel. Um but
[0:17] realistically, like every notebook, we
[0:20] want to just show you what it's like
[0:21] being on the show floor. As you can see,
[0:24] hundreds of partners. Um we were just
[0:26] here last week for AI Infrastructure
[0:27] Summit. This event's a little bit
[0:28] smaller um but it's very critical for
[0:31] TSMC's ecosystem. The idea as always
[0:34] with these events is that TSMC makes it
[0:36] about the partners and [snorts] not
[0:39] really much about TSMC. We get a
[0:40] keynote, they announced their new AI uh
[0:44] SDK PDK thing um earlier today and the
[0:49] idea being that it makes it easier for
[0:51] um customers to tape out. So, if we come
[0:54] over here, uh, cuz there's a few
[0:56] companies that have caught my eye
[0:57] already, and we're going to come over
[0:59] and talk to Ray here, um, at Cadence.
[1:02] How's it going, Ray?
[1:03] >> Great.
[1:04] >> How's the show been for you so far?
[1:06] >> Well, I mean, I've been standing here
[1:07] for a while, speaking to a lot of
[1:09] different kind of people.
[1:10] >> So, what does Cadence aim to get out of
[1:12] an event like this? Well, I mean, it's
[1:14] an ecosystem building event uh where a
[1:17] lot of companies are able to talk to
[1:18] each other and get to build the
[1:20] ecosystem around all kinds of stuff
[1:22] because you need like 100 companies to
[1:24] cooperate with each other uh to be able
[1:26] to to just come up with one product.
[1:29] >> Is is is it collaboration or
[1:30] competition?
[1:32] >> I think collaboration is more of a thing
[1:34] rather than competition. I mean for
[1:36] competition there there will be a lot of
[1:38] different solutions but within the
[1:39] industry you know that you know a lot of
[1:41] competing companies buy stuff from each
[1:43] other also
[1:44] >> and and what's cadence showing off this
[1:45] year at the show I know you've been
[1:46] manning this booth what's what's going
[1:48] on here
[1:49] >> um for overall cadence is showcasing
[1:51] their new EDA solutions they're all
[1:53] around uh and for IP solutions we have a
[1:56] couple demos here uh one is our
[1:59] multi-protocol IP which is kind of
[2:01] supports u link and Ethernet especially
[2:03] for scale up and scale out workload
[2:05] clothes. We have our HBM demo right next
[2:07] to it this and then we have our UCI
[2:09] demo.
[2:10] >> So is it all about making sure that the
[2:12] next standard is supported you know what
[2:15] conversations are you having with
[2:16] partners at the show?
[2:18] >> Uh it's more about like uh when you try
[2:21] to enable the ecosystem uh it means that
[2:24] uh if if someone's building a solution
[2:26] that solution will be implemented
[2:27] somewhere. A lot of ecosystem building
[2:30] events happen like this uh where we can
[2:33] we can provide a product but if the
[2:35] ecosystem around it doesn't exist it's
[2:36] not not going it's not going to get
[2:38] sold.
[2:39] >> So you have some of those conversations
[2:40] here at the show. Yeah, of course. And
[2:42] sometimes they say, for example, this
[2:44] thing is a bit a bit early into into the
[2:48] schedule and we just cannot build a
[2:51] system around it just because like one
[2:53] part of that chain doesn't exist yet or
[2:56] is not too prominent or production
[2:58] ready.
[2:59] >> Okay. And for engineers like you, it
[3:00] helps to be face to face with all these
[3:03] people.
[3:04] >> Yeah, definitely. So um I've had even a
[3:07] couple of other conferences I've had a
[3:09] chance to speak to the people from other
[3:11] companies who are in the same email
[3:13] chain as I was and there was so much
[3:15] more context in our conversation was way
[3:18] much way easier to communicate. Um and
[3:21] something like this here we get to know
[3:23] some people are just open to share about
[3:25] their struggles and that turns into
[3:28] intelligence after after month of doing
[3:30] it.
[3:30] >> You mean there's no paper trail?
[3:32] >> There's no paper trail. Yes.
[3:34] That's awesome. Well, many thanks, Ray.
[3:36] Good luck at the show. I know there's
[3:38] still a few hours to go. I want to take
[3:40] us over here to speak about Samsung. So,
[3:43] for those of you who followed my
[3:44] coverage last week, um we kind of
[3:46] covered SKH Highix. Uh but Samsung are
[3:49] also, you know, showing off their HBM
[3:51] here. If we can just sneak in. Um as
[3:53] always, we've got, you know, a very, um
[3:56] impressive demo. The thing that's
[3:58] different though is this. This is the
[3:59] heat path block. We saw this at hot
[4:02] chips. When we going to next generation
[4:04] HBM, there's thermals that you have to
[4:07] consider. So, what these companies are
[4:09] going to start to do, and it's not just
[4:10] Samsung, it's it's the other two as
[4:11] well, is that alongside your memory,
[4:14] you're going to have essentially a
[4:16] almost a vapor chamber like device
[4:19] that's going to help accelerate heat.
[4:20] So, you've got your compute die here,
[4:22] and rather than your heat coming through
[4:24] the memory, your heat comes through the
[4:26] heat path block. So, when you're doing
[4:28] things like 3D stacked HBM,
[4:31] um, which ZHBM, I think Samsung calls
[4:33] it, um, eventually that's going to be a
[4:35] really important issue. But even if
[4:37] you're not just doing 3D, if you're
[4:38] doing 2 and a halfD, just because these
[4:40] base dies are obviously going to start
[4:42] hitting 2 kW, 3 kW, 4 kW, having that
[4:45] extra cooling is going to help. My
[4:47] question is always, is there enough
[4:48] mass? Given that these these dyes are
[4:51] going to be here about 775 microns tall
[4:54] doesn't leave a lot of mass here and
[4:56] usually mass helps for heat sink and
[4:57] heat flow. But we got Samsung showing
[5:00] off some HBM5 with this heat path box
[5:03] structure. They're saying here 30 to 50°
[5:06] lower difference and better thermal
[5:07] resistance and performance per GPU.
[5:10] That's a I wonder how um that exactly is
[5:13] made. And we've got some uh high
[5:15] performance architecture type stuff. Um
[5:17] you know 2 nanometer here uh showing off
[5:20] um gate allaround stuff on the logic.
[5:23] And now we have HBM4E. This is obviously
[5:25] going to be the 26 27 um maybe into 28
[5:28] kind of volume stuff. Um if we look here
[5:30] at the wafer if you like if you come in
[5:32] and have a look lots and lots of dyes.
[5:35] Do you want to tell us about HBM4?
[5:37] >> Uh
[5:37] >> who wants to talk about HBM4?
[5:39] >> I think uh we'll have contact to come
[5:41] down.
[5:42] >> Okay. Okay. Okay. Okay, so nobody's
[5:43] talking about hedge 4, but they do have
[5:45] die here and they [snorts] are showing
[5:47] it off at other events. So um you know
[5:50] lots lots more memory stuff to come and
[5:52] it's not just the standard memory
[5:54] technologies that we're seeing. We're
[5:56] seeing you know things like a high
[5:57] bandwidth flash um you may have seen
[5:59] last week. Over here is the TSMC booth
[6:02] behind me. Lots of interesting demos
[6:04] there. None of which I can show you uh
[6:07] because it because it's all uh no photos
[6:10] and hands off. Um but it all looks
[6:12] actually rather impressive as always.
[6:15] Large packet sizes. TSMC showing off
[6:17] some of their latest generation
[6:19] hardware. Let's go into SKH Highix if we
[6:23] can. Um because again they've also got
[6:26] the demo showing here the high bandwidth
[6:29] memory and the logic die and the
[6:30] interoser and lots of you know funky
[6:33] LEDs. interesting here if you look down
[6:36] into a HPM stack this is what you see
[6:38] with the three silicon vs. though I if
[6:42] if you can get the mirror for for
[6:44] example um what the discussion is now is
[6:46] whether these through silicon vs can
[6:48] actually be arranged to help with the
[6:50] thermals. Do they have to be regular?
[6:52] Can they be irregular? Can they be
[6:54] clustered? Or is there, you know, a
[6:56] performance uh benefit, power benefit,
[6:59] yield benefit of doing things like this?
[7:01] Or in some situations, maybe the logic
[7:03] die here, the base die actually has some
[7:06] compute inside it. And what you have to
[7:09] do with the through silicon v in order
[7:10] to enable that. Uh these are all things
[7:13] going on in research right now. They
[7:14] talk about it at the conferences. Um and
[7:17] you know, if you'd like sifting through
[7:19] pages and pages, um you you'll see
[7:22] plenty of it. They're showing off their
[7:24] storage on this side, some of their
[7:26] latest generation storage. Um, it's a
[7:29] very it's a very busy booth. Uh, we see
[7:31] we see our good friend Yan Vardan here
[7:34] in front of the Nvidia, in front of some
[7:35] of their latest generation HBM, of
[7:38] course. Um, you know, just like Samsung
[7:40] showing off exactly what's going on.
[7:42] Let's make our way over. Um, uh,
[7:46] unfortunately there's uh, no Micron at
[7:48] the show, which is interesting. We um my
[7:51] last time I bumped into Micron I think
[7:52] was actually GTC. Um but we do have uh
[7:56] Synopsis here in town. They're usually
[7:59] uh good for showing off what they're
[8:01] doing. Um and I want to come over uh
[8:04] actually the person I want to speak to
[8:06] is having an interview right now. Um as
[8:09] is always typical. But just like um ju
[8:12] just like other shows, it's all about
[8:14] where the AI integration is happening.
[8:16] It's all about enabling it through the
[8:18] flow. enabling things like TSMC's ADK.
[8:22] Um, and and I kind of skipped over at
[8:24] the beginning, but the whole idea of
[8:26] first silicon, I've been talking about
[8:28] this a little bit on Twitter recently.
[8:30] Uh, these big companies with the even
[8:32] with their big AI budgets. And you'll
[8:34] see in my interview with Richard Hoe
[8:36] from OpenAI, getting first silicon to
[8:38] work matters. that works when your
[8:41] models your your model to silicon is
[8:44] actually very accurate but it's very
[8:45] hard to do on leading edge because you
[8:47] don't know if the model is accurate and
[8:50] the idea is that by using some of these
[8:52] learnings that TSMC have had over the
[8:54] years can you supplement your design
[8:57] infrastructure um with models that have
[9:00] known you know known good silicon on
[9:02] older nodes to help improve what's
[9:04] coming in the future um so as far as I
[9:07] understand they're getting good pickup
[9:08] on that and we have uh the GU booth
[9:11] here. We kind of saw a little bit about
[9:13] them um in the last conference, but here
[9:16] here's their CPO enabled rack. Um it's
[9:19] all right. No, no, don't don't worry.
[9:21] Don't worry. Um you know, we we kind of
[9:23] saw this with IR Labs uh again AI
[9:26] infrastructure summit showing where the
[9:27] CPU and all the uh the CPO guys are. Is
[9:30] there anybody who can talk to us about
[9:32] this? Um
[9:33] >> well I mean I mean so I I I work with
[9:35] the IR labs guys so I kind of know what
[9:37] you guys are doing but can you explain
[9:39] the relationship here and why uh why
[9:41] you're investing so heavily in CPO.
[9:43] >> Okay thank you so much. I think the CPO
[9:44] is in the train because there was so
[9:47] much limitation for what Cobbo can do
[9:49] and the optical will provide a much
[9:52] better power efficiency and the
[9:54] bandwidth and also importantly the small
[9:57] form factors to enable the multiple like
[10:02] over thousand GPUs and they can be
[10:04] connected as a one computer unit. That's
[10:06] why we're making this uh u demo. All
[10:09] right. Right. have reference design for
[10:11] our customer to to show them the CPO is
[10:14] a workbook.
[10:15] >> So where exactly in the chain are
[10:16] customers asking for it right now? Are
[10:19] they just asking for the demos or are
[10:20] you actually going forward with say
[10:23] proof of concept designs with your with
[10:25] your partners? I think right now we
[10:27] still proof of concept design because
[10:30] right now uh the design here the CPO is
[10:33] using TSMC coupe uh technology and the
[10:37] coupe technology will be ready somewhere
[10:40] in next year. So for the we already have
[10:44] some customer discussion the initial
[10:46] design to using coupe but for the mass
[10:49] production it might be one or two years
[10:51] out.
[10:51] >> Okay. So so so so what does the next
[10:54] five years look like? Because whenever I
[10:55] speak to say IR labs um they're
[10:58] investing heavily in supply chain.
[10:59] >> Yes.
[11:00] >> Right. Because uh even if you build it
[11:02] you can't get away with 10,000 a month.
[11:05] >> You might need to do 100,000 a month or
[11:07] a million a month depending on the
[11:08] customer. Right. So explain explain to
[11:10] me a little bit about what happens over
[11:11] the next 5 years.
[11:12] >> I think from the CPO side so for juicy
[11:15] we are as design. So we design the ASIC
[11:19] here right. So we work with IL. So how
[11:23] uh I understand is actually working on
[11:26] enrich and make sure the uh CPL supply
[11:30] chain is workable and ready for the
[11:32] larger scale manufacturing. So but I
[11:35] think for that part you have to check
[11:38] with ILAB. So yeah
[11:39] >> no but how are you involved in that as
[11:41] well? So we are we work together with
[11:44] ILAB to enable our customers to uh to
[11:49] take this reference design to mass
[11:50] production in the next few years.
[11:53] >> I keep seeing you guys together showing
[11:55] off.
[11:56] >> So what's really special?
[11:58] >> I think it's really have a good synergy
[12:01] between uh lab and ju especially also on
[12:04] the wheel here. So as you can see from
[12:07] this reference design. So GC actually
[12:10] design the ASIC also doing the packaging
[12:13] uh design for the part and in that
[12:15] packaging design we utilize I lab uh
[12:19] latest CPO engine right so with this CPO
[12:22] engine also the wheel also showing they
[12:25] can design the whole tray with the
[12:28] liquid to cooling on all the set of
[12:31] mechanical uh setup to enable and this
[12:35] is kind of reference design we show the
[12:37] customer we also get a lot of
[12:39] interesting uh interest from our
[12:41] customer today.
[12:42] >> Okay. Okay. Cool. Awesome. I actually
[12:44] spent some time with IR Labs this week.
[12:47] I've seen the uh the demo that's coming
[12:49] at O uh at um OPC.
[12:51] >> OCP.
[12:52] >> OCP. O keep saying it wrong. OCP. That's
[12:54] kind of cool. That's kind of cool.
[12:56] >> We'll be there too.
[12:57] >> Yeah. Yeah. Yeah. No, that is awesome.
[12:58] Thank you so much. Thank you so much.
[12:59] >> Thank you. It's um Yeah. You know, these
[13:02] guys, it's all about custom ASIC design,
[13:04] right? And you have to have partners who
[13:06] do this additional sis. you have to do
[13:08] the additional compute. Um, we kind of
[13:10] showed this off a little bit before, but
[13:11] here's here's the PZ chip, the SC3, you
[13:14] know, that's [snorts] a supercomputing
[13:15] chip, uh, made in Japan
[13:18] that there's what, a dozen companies
[13:20] like this, a couple of tier ones, a few
[13:21] tier 2s. Um, but we're here in Synopsis
[13:25] and here we have their latest uh,
[13:27] Ethernet fire. I think they've been
[13:28] showing this off for a little while, but
[13:30] here's um, here's their second
[13:33] generation UCI here, TSMC N3P. The whole
[13:36] point is if you're in the market, come
[13:39] in. We've spoken before, haven't we?
[13:41] >> Rib your name.
[13:43] >> Mark Sauerwald with Synopsis.
[13:46] >> So talk talk us through the demo. What's
[13:47] going on here?
[13:49] >> So this is a new test chip for the UCIe
[13:52] 2. We have a test chip which is
[13:54] supporting 64 lanes at 40 Gbits per
[13:58] second per lane in the advanced
[14:00] packaging nodes. This particular one is
[14:03] done in TSMC's three N3P process. So
[14:08] we're getting tremendous amount of data
[14:10] that we're able to transfer from die to
[14:12] die in a multi-chip solution.
[14:14] >> So you're going above spec. Why?
[14:17] >> It's faster. Faster is better.
[14:20] >> Is this what customers are asking for?
[14:22] Just relentless speed.
[14:23] >> Always more speed, less power.
[14:26] >> Um and on top of that PPA, obviously,
[14:28] >> of course. Yes. So we've got all the
[14:31] pieces. In this case, we're less than
[14:33] 0.4 pigles per bit that we're
[14:36] transferring
[14:37] >> across an organic substrate
[14:39] >> across. We can do many different
[14:41] substrates. So yes, this is the A. So we
[14:44] can do organic, we can do silicon to
[14:45] silicon.
[14:46] >> Uh so what have be what have your
[14:48] customers or people have been coming by
[14:49] the booth asking about it?
[14:51] >> When
[14:53] today I I I think I think we had a chat
[14:56] um a few months ago maybe on this. So,
[14:58] um, how are those conversations
[15:00] changing? I guess
[15:02] >> it's continuing on. I think that the
[15:04] die-to-d communications are becoming
[15:06] more and more important for the types of
[15:07] things that are being built. We're
[15:09] seeing this becoming not an exotic
[15:11] technology, but a must-have type of
[15:14] technology and so it's really growing
[15:16] very fast adoption.
[15:18] >> Have you had a chance to walk around
[15:20] >> a little bit? and and and and what what
[15:23] what is exciting you because um you know
[15:26] to sometimes get the opinion this is
[15:27] just run-of-the-mill stuff. So what
[15:29] really is exciting at a show like this?
[15:31] >> Oh,
[15:32] just the number of different things and
[15:34] number of different dimensions that
[15:36] we're seeing people moving in. So it's
[15:38] it's very exciting. It's exciting seeing
[15:40] the competition nipping at our heels,
[15:42] giving us more incentive to work harder.
[15:45] So yes, lots of good things.
[15:47] >> So you're saying you're in the lead?
[15:49] >> Of course. Of course. [laughter] Of
[15:51] course. Well, with UCI 2, that's what
[15:53] electric bugaloo or something. Yeah. And
[15:55] the 40 gigs. Um, you're working on 64,
[15:57] I'd imagine.
[15:58] >> Yes. Yes. And we can probably get to 64
[16:01] with this one. It's fairly new silicon.
[16:03] We're just testing it out, seeing where
[16:05] it
[16:06] >> Okay. And uh you you're probably already
[16:08] testing on N2. What is that going to
[16:11] likely bring that you can't get on N3P?
[16:14] Um it the major thing that it's going to
[16:16] do from a performance standpoint in N3P
[16:19] we can do things but UCI never lives on
[16:21] itself on a die. So it's going to be
[16:24] able to be compatible with the other
[16:25] things. If you're working on a processor
[16:27] or memory that's going to go into N2
[16:30] then we can drop in there as well.
[16:32] >> Sweet.
[16:32] >> Awesome. Thank you so much.
[16:34] >> Good to see the synopsis guys as always
[16:36] at at OIP.
[16:37] >> [snorts]
[16:37] >> Um, and yeah, it's kind of the feeling
[16:41] I'm getting as always at a show like OIP
[16:44] is, uh, you know, it's almost in a name.
[16:47] It's collaboration, right? You can't
[16:49] just go through this industry and not
[16:51] work with people. Um, you know, I was
[16:53] speaking with one of my clients this
[16:54] week and they're needing IP from six
[16:57] different vendors and they're walking
[16:59] the show floor making sure that they
[17:00] bought the right ones because they're
[17:02] going to be building on TSMC. Um, so
[17:04] it's all those different engagements and
[17:06] and and conversations that happen at an
[17:09] event like this. Um, I know I've got a
[17:11] few more people to talk to. I can see,
[17:12] you know, Andy's over there and analog
[17:15] bits. Um, but you know, hope you guys
[17:17] enjoyed another edition of the notebook.
[17:19] I believe the next conference we'll be
[17:21] doing this at is is going to be um, OCP
[17:24] or maybe even Semicon West. Um, so
[17:26] definitely stay tuned for those. Don't
[17:27] forget to follow the potato and I'll
[17:29] catch you on the next one.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
