<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_ea1325bdac33c4c6"
title: "AI 电力功耗能降到多低？ // AI 硬件秀 S2E11"
domains: ["算力芯片"]
subdomains: ["AI加速器与GPU"]
types: ["行业认知","视频"]
companies: "Aspinity,Arm,Blumind,Efficient Computer,Syntiant,Femtosense,ABOV Semiconductor,NXP"
published_at: "2026-09-24T16:00:00.000Z"
importance: 6
confidence: 6
evidence_status: "二手报道"
worth_following: true
source_url: "https://www.youtube.com/watch?v=Wiv08sstkJc"
source: "YouTube·TechTechPotato"
---

# AI 电力功耗能降到多低？ // AI 硬件秀 S2E11

## 行业认知文章

- 行业：算力芯片
- 公司：Aspinity,Arm,Blumind,Efficient Computer,Syntiant,Femtosense,ABOV Semiconductor,NXP
- 来源：YouTube·TechTechPotato · [原文链接](https://www.youtube.com/watch?v=Wiv08sstkJc)
- 发布时间：2026-09-24
- 原文存档：本文下方「原文存档」章节

## 摘要

【核心观点】AI 硬件秀 S2E11（Ian Cutress + Sally Ward-Foxton）盘点“微瓦级”超低功耗边缘 AI 芯片——目标是用纽扣电池让 AI 常开10-20年；共识是在暗硅与漏电流时代，“别唤醒主处理器”就是最大的省电方式，模拟计算与稀疏计算是两条最激进的技术路线。
【关键事实】Aspinity AML100：纯模拟域信号分析系统（RAMP 架构），无需 ADC 前端，功耗仅约30微瓦；通过浮栅存储网络权重，定位为“AI 缓存”，用于传感器预过滤；2015年由西弗吉尼亚大学衍生，累计融资约2200万美元；AML200 原计划于25Q1 送样，但2024年4月后便无消息。Arm Ethos-U 家族：U55（64 GOPS、0.1mm² 硅面积，用于关键词唤醒）→U65（性能提升16倍，达到1000 GOPS，支持 Cortex-A）→U85（4000 GOPS，首个内置 Transformer 支持，宣称代际能效提升20%，比纯 Cortex-M 推理节省90%+，原生2:4稀疏）；Alif 围绕 U85 打造亚瓦级/纽扣电池 SoC；值得注意的是，NXP 因 U 系列更新不及时，在最新 i.MX 中跳过了 Ethos（呼应上期 Kinara 收购话题）。Blumind（多伦多）：全模拟神经芯片，采用单晶体管 MAC、电压连续模式计算，结果存储于电容中，无外存、无时钟；BM110 关键词识别功耗仅约100微瓦；BM210 视觉1-2毫瓦，可运行10MB 权重的 CNN；未来宣称可达1000 TOPS/W；固定功能、不可编程是其主动选择；融资约2500万美元，BM110 已第三次流片，并将随可穿戴设备头部客户上量。高效计算机 Electron E1：采用空间数据流架构的通用 CPU（指令固定在静态计算瓦片上，数据流动，无程序计数器），宣称能效比 ARM 核高10-100倍，支持 C++/Rust+FP32；2022年创立，完成1600万美元种子轮融资（由 Eclipse 领投，团队成员来自 Apple/Tesla/Intel/MIT）；与 GlobalFoundries 合作代工；路线图包括 E2 与高端 Photon P1，并考虑对外授权 fabric IP。Syntiant NDP250：支持50毫瓦以下的多模态推理（22nm、6mm 封装），可运行600万参数 DNN，性能为30 GOPS@120MHz，集成 Hi-Fi 3 DSP+Cortex-M0；定位为 LLM/SLM 的本地前端（端侧 ASR/TTS，将云端延迟砍半）；累计出货2000万+颗，融资超1.2亿美元；已收购 Pilot.ai 与 Knowles 麦克风业务；未来目标是将推理能力扩展千倍，实现端侧 LLM。Femtosense AI-ADAM-100（与 ABOV 半导体合作）：首款全栈集成稀疏 AI 的商用 MCU，采用 SPU1 稀疏引擎（台积电22nm）+1MB 内存，等效于10MB；宣称存储与计算各有10倍增益，关键词检测功耗<100微瓦，语音增强功耗<1毫瓦；2018年创立，完成800万美元 A 轮融资，面向家电/可穿戴/助听器市场，试点已在进行中。

## 值得关注的信号

【值得关注的信号】边缘 AI 的功耗下限正被压到微瓦级，开启"常开感知"新品类（助听器/家电语音/预测性维护）：①模拟计算（Aspinity/Blumind）与稀疏计算（Femtosense）路线的能效数字领先数字 NPU 一个数量级，但以牺牲可编程性为代价——固定功能器件走量绑定家电客户是务实路径；②Arm Ethos-U 的更新迟缓曾让 NXP 转向自研/收购（Kinara），说明微 NPU 的生态位竞争正在加剧；③Syntiant"2000万颗出货+收购 Knowles 麦克风"展示了端侧音频链垂直整合的可行打法；④Efficient Computer 用数据流 CPU 挑战 Cortex-M 存量市场并考虑 IP 授权模式，值得跟踪其能否撬动物联网主控替换周期。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"3ae610f1c163c5ee47dca1c6b1f12025a04aae90da3747138239c2e6835356e5","translationSha256":"8fb0330d872b299b340e23bd165a061b661a06eec455565c498b4c4013486bce","sourceCharacters":21711,"timestampValues":0,"timestampOrderVerified":true,"englishProseChecked":true} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

- 链接：https://www.youtube.com/watch?v=Wiv08sstkJc
- 频道：TechTechPotato
- 发布日期：2026-09-25
- 时长：15分31秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

先别看数据中心——真正的 AI 热潮或许正在你身边的一颗纽扣电池里上演。Ian Cutress 和 Sally Ward-Foxton 深入探讨了六种超低功耗芯片架构，它们几乎不耗电，却能让 AI 常年保持始终在线：从完全跳过 ADC 的模拟处理器，到只有在关键时刻才会唤醒的稀疏计算引擎。内容还包括：ARM 最新的 microNPU 系列、一家打造全模拟神经芯片的多伦多初创公司，以及一款为微瓦时代从头重新设计的 CPU。

[00:00] 介绍
[00:52] Aspinity AML100
[03:03] Arm Ethos-U55/U65/U85
[05:15] Blumind BM110/BM210
[07:14] 赞助商：Arteris 专题
[08:02] Efficient Computer Electron E1
[10:19] Syntiant NDP250
[12:31] Femtosense AI-ADAM-100

-----------------------
需要 POTATO 周边商品吗？这就有一款芯片！
http://merch.techtechpotato.com

http://more-moore.com：订阅 More Than Moore 新闻通讯
https://www.patreon.com/TechTechPotato：Patreon 会员可访问 TTP Discord 服务器！

在 Twitter 上关注 Ian：http://twitter.com/IanCutress
在 Twitter 上关注 TechTechPotato：http://twitter.com/TechTechPotato

如果你想在 Amazon 购买商品，请使用以下链接。如果你通过这些链接购买商品，TTP 可能会获得佣金。
Amazon 美国：https://geni.us/AmazonUS-TTP
Amazon 英国：https://geni.us/AmazonUK-TTP
Amazon 加拿大：https://geni.us/AmazonCAN-TTP
Amazon 德国：https://geni.us/AmazonDE-TTP
Amazon 其他地区：https://geni.us/TTPAmazonOther

片尾音乐：https://www.youtube.com/watch?v=2N0tmgau5E4
-----------------------
欢迎收听 TechTechPotato (c) Dr. Ian Cutress
More Than Moore 分析师 Ian Cutress 畅谈科技相关话题

#techtechpotato #AIHardwareShow #EdgeAI #LowPowerAI #AnalogAI #Semiconductors #AIchips #ChipDesign #IoT #Microwatts #SparseAI
------------
与其他研究和分析机构一样，More Than Moore 曾经或目前向业内许多高科技公司提供收费研究、分析、咨询顾问或顾问服务；这些服务可能包括在 More Than Moore 新闻简报或 TechTechPotato YouTube 频道及相关社交媒体上投放广告。属于这一范围的公司包括 AMD、Applied Materials、Arm、Armari、ASM、Ayar Labs、Baidu、Bolt Graphics、Dialectica、Facebook、GLG、Guidepoint、IBM、Impala、Infineon、Intel、Kuehne+Nagel、Lattice Semi、Linode、MediaTek、NeuReality、NextSilicon、NordPass、NVIDIA、ProteanTecs、Qualcomm、Recogni、SiFive、SIG、SiTime、Supermicro、Synopsys、Tenstorrent、Third Bridge、TSMC、Untether AI、Ventana Micro。

## 全文

大家好，欢迎收看新一期 AI 硬件秀。我叫 Ian Cutras，来自 More The More，和往常一样，今天与我一同主持的是来自 EU Times 的 Sally Wood Foxton。本期节目聚焦超低功耗边缘计算。我们要聊的是微瓦级功耗的设备，它们应该能运行 10 到 20 年。一定会很有意思，也会很精彩。[音乐] 本期 AI 硬件秀由 Arterus 赞助。Arterus 是构建下一代 AI 芯片公司的可信赖合作伙伴。从 AMD 和 Renus 到 Tenstar Rebellions，

Arterus 的片上网络 IP 正在帮助全球顶尖工程团队更快地传输数据、降低功耗并加快产品上市。如果你听说过 AI 硅片领域的重大突破，Arterus 很可能为此提供了助力。请继续收看本期节目，稍后将介绍更多内容。在功耗曲线的最底端，纽扣电池占据主导地位，而始终在线的传感器连一毫瓦都承受不起。Aspinity 的 AML 100 展示了模拟 AI 的能力。这不是普通的加速器，而是一套完全在模拟域中构建的完整信号分析系统，

功耗仅为 30 微瓦。AML 100 的核心是 Aspinity 的 RAMP 架构，即可重构模拟模块化处理器。这意味着芯片无需在前端配置模数转换器。相反，它可以直接在模拟域中采集并处理音频、振动或任何时间序列信号。这样能大幅降低功耗，让芯片依靠小型电池连续运行数月甚至数年。AML 100 中的每个计算模块都将模拟信号处理与非易失性浮栅存储器结合起来。该存储器用于存储神经网络权重或滤波器参数，并包含偏移量存储，以补偿模拟失配。

其精度足以检测诸如唤醒词或振动模式之类的事件。随后，芯片会将控制权交给功能更强大的数字芯片，进行完整推理。这就是 Espinity 将其称作一种 AI 缓存的原因。可用它对传感器数据进行预过滤，仅在真正需要时才唤醒主处理器。这种分层计算模式解决了边缘 AI 的一个重大难题：如何保持始终在线，同时避免电池电量耗尽。AML 100 目前正在出货，并被设计用于需要极高能效的产品中，

例如智能家居语音触发、工业噪声分析、可穿戴设备生物特征监测，以及其他对低延迟唤醒检测的要求高于完整 AI 技术栈的应用场景。它并不试图取代主处理器，而是让你根本不必启动主处理器。在暗硅和空闲漏电问题日益突出的时代，这正成为边缘 AI 创新的重要方向。至于这家公司，Espinity 于 2015 年从 West Virginia University 分拆创立。公司累计融资约 22 百万美元，投资方包括

ANIE Partners 和 National Science Foundation，并获得美国国防部的额外支持。最近一轮融资是 2023 轮 B 轮融资，金额为 5 百万美元。下一代 AML 200 原计划于 25 年第一季度开始送样。不过，自 2024 年 4 月以来，公司一直没有向我们提供任何信息。在 AI 市场最边缘的领域，电力受限、计算预算紧张，ARM 的 Ethos UER 是一种常见方案。这些微型 NPU 专为嵌入式系统、物联网设备和可穿戴设备打造。本质上，它们适用于每一微瓦都至关重要的环境，

每一微瓦都至关重要。问题在于，Ethos U 一直是 ARM AI 产品线中相对低调的产品。U55 和 U65 于 2020 首次推出后，后续更新并不频繁。这种沉寂造成了产品空档。例如，NXP 在最新的 IMX 产品系列中完全跳过了 Ethos，并表示原因是缺少及时更新。直到 Ethos U85 问世，ARM 才再次明确其边缘 AI 的发展方向。如今，该系列的入门型号是 Ethos U55，其计算能力从 64 GPS 的 8 位计算起步，硅片面积最低可达 0.1 平方毫米。它针对关键词识别进行了优化

目标检测、异常检测和常开音频感知。再上一个档次是 U65，它的规模扩展了 16 倍，达到 a,000 gigs，并将支持扩展到基于 Cortex A 的平台。这里的重点是为机器人、监控和智慧零售解锁更先进的视觉工作负载。U85 是该系列中首款内置 Transformer 支持的型号，性能最高可达 4,000 GPS。这使其能够胜任小型语言模型、实时分割和基础 ADAS 工作负载。ARM 声称其功耗效率最高可提升 20%，实现代际

提升，相较于仅使用 Cortex M 推理，性能提升超过 90%。现在，每个 micromppu 都针对 8 位整数和 16 位整数进行了优化，而且该架构原生支持二到四倍稀疏度。设计中包含乘加阵列、直接内存访问引擎以及逐元素算子链，以尽量减少内存使用。整个技术栈的软件保持统一，因此开发者只需编译一次模型，就能通过 Ethos UU 集成部署到 CortexM、Cortex A 或 Neverse 平台。像 ALF 这样的公司现在正围绕

U85 构建 SOC，适用于功耗低于一瓦、由纽扣电池供电的设计。Ethos 仍是全球部署最广泛的边缘 AI 引擎之一。Blue Mind 成立于 2020，总部位于多伦多，是一家开发全模拟神经处理器的公司。其理念是芯片不对输入信号进行数字化，也不启动高速总线或内存。其架构多少受到大脑启发，采用单晶体管乘加单元，以连续电压模式处理信息，并将结果作为电荷存储在电容器上。没有外部

内存，没有时钟，理论上也没有能量浪费。一切都以模拟方式流动。这意味着它们芯片的功耗极低。Blue Mind 的首款产品 BM 110，以 100 mill 的功耗运行关键词检测。即使是第二代视觉芯片 BM210，针对 CNN 的功耗也只有 1 到 2 mill，权重规模最高可达 10 MB。该公司声称，未来芯片的能效可能达到每瓦 1,000 TOPS，远高于当今任何数字推理引擎，达到数个数量级。这种模拟优先的方法高度依赖具体应用。芯片并非完全

可编程，而是以固定功能设备的形式出货，针对时间序列分析、音频或视觉推理进行调优。这是一种有意的取舍：灵活性有限，但力求实现无与伦比的功耗和延迟。作为一家初创公司，Blue Mind 迄今已融资约 25 百万美元，其中包括 25 年 4 月的一轮 A 轮融资。这笔资金用于持续开发 BM210 并扩充团队。目前，BM 110 正处于第三次流片阶段，计划与一位智能穿戴设备领域的主要客户同步推进量产。BM210 面向摄像头和传感器应用，预计

将于 2026 投产。长期来看，Blue Man 的路线图包括一种面向小型 LLM 的多芯片架构，利用模拟分块，在超低功耗范围内切换最高达 1 GB 的权重。Blue Mind 的早期市场包括可穿戴设备、预测性维护、轮胎健康监测、国防系统和工业自动化。本质上，这些场景都需要持续监测，而且毫瓦级功耗预算至关重要。该公司也在积极拓展智慧城市、农业和边缘医疗领域的合作伙伴关系

。当领先的芯片制造商需要连接数百个计算引擎、内存通道和加速器时，他们会求助于 Arterus。他们的片上网络技术为全球超过 880 个 SOC 设计提供支持，使复杂 SOC 和 chiplet 之间能够无缝传输数据。借助 FlexGen Knock、Encore IP 和 Magulum 软件，Artus 可自动完成集成、缩短布线长度、降低功耗和面积，并帮助团队更快地将新硅片推向市场。从数据中心 AI 和汽车系统，到工业和消费设备，Arterus 提供了维持现代计算高效运行的底层基础设施

。他们的技术深受创新者信赖，公司也在持续拓展全球业务。如果你想助力塑造互联硅片的未来，今天就访问 arterius.com，了解更多信息并探索职业机会。高效计算机 electron E1 并非典型的嵌入式芯片。实际上，它是一款围绕空间数据流模型构建的通用 CPU。它从头重新思考了计算应有的形态，尤其是在能耗而非频率成为限制因素时。传统 CPU 在控制流系统中运行，通过流水线传递指令和数据，而它与之不同

：E1 将指令固定到静态计算单元上，让数据在这些单元之间流动。这个理念很简单：输入到达时，计算单元便启动。没有程序计数器，没有全局机制，也没有动态发射逻辑，只有通过静态连接的无缓冲互连和流水线重配置实现的分布式计算。因此，他们声称其能效比 ARM 的竞品内核高出 10 至 100 倍。问题在于，这其实并不是真正的 AI 加速器。它只是一款能够运行通用程序的通用 CPU

面向 CPU 的代码。E1 支持 C++ 和 Rust&nbsp;，通过基于 clang 的编译器运行，并包含完整的&nbsp;&nbsp; 32 位浮点支持。开发者编写&nbsp;常规代码。因此，Electron E1&nbsp;&nbsp;并不追求峰值性能，尽管它会以每瓦 TOPS 衡量效率。这里的重点是，在真实的嵌入式工作负载中追求每焦耳完成更多有用工作时，例如 CPU 所面向的可穿戴设备、工业传感、智慧农业、太空系统或国防等场景——这些领域的功耗预算固定，且续航时间很重要。基本上，就是如今由 Cortex-M 或 Cortex-A 系列 Arm 核心运行的那些用例&nbsp;&nbsp;

而 Efficient 的目标是彻底取代它们。&nbsp;这是个大胆的主张，但 Fish 现在已经有了可运行的硅片，开发套件也正在发出。他们还公布了路线图，其中包括下一代 E2 和更高端的 Photon P1，并与 Global Foundaries 合作制造。现在，&nbsp;&nbsp;Efficient Computer 仍是一家早期初创公司，成立于 2022，并获得了由 Eclipse Ventures 领投的 16 百万美元种子轮融资。团队成员来自 Apple、Tesla、Intel 和 MIT，具备编译器设计、嵌入式系统和低功耗硅片方面的背景。他们首款流片芯片原型&nbsp;&nbsp;

名为 E0，曾在 CES 上进行非公开展示。我拿到了几张照片。面向量产的 Electron 随后不久推出，开发套件现已进入早期体验计划。&nbsp;&nbsp;除了硬件之外，Efficient 还表示有意授权其 fabric IP，将这一架构定位为不仅是一款芯片，更是一个其他厂商可以据此构建产品的平台。Cintiient 已悄然成为仍在运营的历史最悠久的 AI 芯片初创公司之一。该公司已出货超过 20 百万颗芯片，并融资超过 120 百万美元；其最新产品 NDP250 建立在多年&nbsp;&nbsp;

硅片和系统级迭代的基础之上，目标明确地瞄准常开式 AI。该芯片厚度不到 50 毫米，旨在将多模态推理带到边缘设备，同时不牺牲电池续航或受热限制。它采用第三代 Cient 核心架构，可运行深度神经网络，支持最高 6 百万个参数，并在 120 兆赫下提供 30 吉次运算。NDP250&nbsp;&nbsp;力求不止是一颗神经网络引擎，还集成了 Hi-Fi 3 DSP，用于本地信号处理；一个 ARM Cortex M0，用于独立运行逻辑；以及种类丰富的 IO 接口。其中包括支持&nbsp;&nbsp;

直接输入麦克风、图像和传感器信号，以及用于单电源轨设计的电源管理单元。所有这些都封装在一个 6 毫米见方的封装中，采用 22 纳米制程。该架构支持卷积、循环网络，甚至小型 Transformer 模型。用户应该能够以超低功耗运行小型语言模型的注意力层。这使制造商能够打造更智能的耳机、安防摄像头和医疗监护设备，只有在确有需要时才唤醒手机&nbsp;&nbsp;或服务器。特别有意思的是，Cint 将这款芯片视为&nbsp;&nbsp;

LLM 和 SLM 应用的前端。它无法独立运行完整的 GPT 模型，&nbsp;&nbsp;但可以在本地进行自动语音识别和语音合成，将云端延迟减半，并显著延长运行时间；它还支持为预录视频进行输入缓冲，以及同时运行多个模型。NDP250 的设计目标是实现交互，而不仅仅是检测。该公司目前正在向主要客户提供 NDP250 样品，目标是在明年实现量产。它收购了 Pilot.ai AI，以增强视觉模型能力，并收购了 Null's Mem's 麦克风业务&nbsp;&nbsp;

并继续专注于端到端系统集成。路线图中还包括一款尺寸大得多的硅片；未来设备的推理工作负载能力可能扩大一千倍，目标是实现设备端大语言模型处理。难点在于如何做到这一点而不突破功耗预算，但这一直是他们押注的方向。Cintient 的策略不是追逐性能，而是把算力放进边缘设备能够承受的最小功耗范围内。Fentosense 正在采取一种极其高效的边缘 AI 方案：不仅缩小模型，&nbsp;&nbsp;

还会去掉模型中无关紧要的部分。他们最新的芯片 AI Atom 100，是首款在整个技术栈中全面集成稀疏 AI 的商用微控制器。这款设备由 Phentosense 与 ABOV Semiconductor 合作打造，将 Phentosense NPU 与通用 MCU 集成在同一封装中，从而能够以微瓦级功耗实现实时语音和音频智能。&nbsp;&nbsp;该架构的核心是 SPU1，这是一种基于 TSMC 22nm 制程构建的稀疏处理引擎，并配有一兆字节的片上内存。但由于该设计具有稀疏特性，公司&nbsp;&nbsp;

声称，这些内存的效果相当于 10 兆字节的传统内存，因为它会跳过零值，并且只在真实数据流入时激活计算路径。关键就在这里。芯片并非只是存储稀疏权重，也会以稀疏方式进行计算。通过避免对空数据执行运算，公司声称稀疏内存可带来 10 倍的效率提升，稀疏计算还可再提升 10 倍。&nbsp;&nbsp;关键词检测功耗低于 100 微瓦。语音增强功耗低于 1 毫瓦。诸如此类。这里的市场重点很明确：智能家电、可穿戴设备、助听器，&nbsp;&nbsp;

耳机，以及任何需要在本地进行语音或声音检测、无需连接云端且不会耗尽电池电量的设备。AI Atom 100 负责唤醒词检测、噪声抑制、实时语音增强，甚至事件检测，所有处理都在设备端实时完成。数据无需往返服务器，从而保障隐私、降低延迟并提升响应能力。作为一家初创公司，Fentosense 成立于 2018，并在 2022 完成了 8 百万美元的 A 轮融资，由精细结构创投（`Fine Structure Ventures`）领投。该公司还获得了约 3 百万美元的资助，不过这些资助是在 2017 获得的。

AI Atom 100 评估套件已经上市，公司正积极与家电制造商、消费电子企业和工业耳机供应商接洽。与 ABOV semiconductor 的合作使其能够接触到成熟的家电客户群体。在这一细分领域，超低功耗语音接口需求旺盛，但过去一直受制于成本或功耗过高。已有多个试点项目在推进，Fentosense 正将其芯片定位为一款可面向大规模量产的平台，将定制 AI 加速能力与

主流 MCU 工作流程结合起来。我觉得这里最让我印象深刻的，始终是我们能在微瓦级功耗下完成这么多工作。是的。低于一微瓦的功耗确实非常低，但如果低于一毫瓦，基本上就可以一直运行。所以，即使是一微瓦，也只有一毫瓦的千分之一。我总会想，功耗只有一微瓦的东西可以一直开着。我总会想到，旅行者号上现在所有那些设备，已经运行了 40 年。是啊。一直开着。是啊。是啊。所以像这样的设备仍然在工作，用的好像是纽扣电池。也许下一次旅行时能见到。好吧。[笑声]
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=Wiv08sstkJc
- 来源：YouTube·TechTechPotato
- 发布时间：2026-09-24
- 行业：算力芯片
- 公司：Aspinity,Arm,Blumind,Efficient Computer,Syntiant,Femtosense,ABOV Semiconductor,NXP
- 归档时间：2026-10-09T09:02:16.957Z

---

- 链接：https://www.youtube.com/watch?v=Wiv08sstkJc
- 频道：TechTechPotato
- 发布日期：2026-09-25
- 时长：15分31秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

Forget the data center - the real AI action might be happening in a coin-cell battery near you. Ian Cutress and Sally Ward-Foxton dig into six ultra-low-power chip architectures built to run always-on AI for years on almost nothing, from analog processors that skip the ADC entirely to sparse compute engines that only wake up when it matters. Along the way: ARM's latest microNPU family, a Toronto startup building fully analog neural chips, and a CPU redesigned from scratch for the microwatt era.

[00:00] Intro
[00:52] Aspinity AML100
[03:03] Arm Ethos-U55/U65/U85
[05:15] Blumind BM110/BM210
[07:14] Sponsor: Arteris Feature
[08:02] Efficient Computer Electron E1
[10:19] Syntiant NDP250
[12:31] Femtosense AI-ADAM-100

-----------------------
Need POTATO merch? There's a chip for that!
http://merch.techtechpotato.com

http://more-moore.com : Sign up to the More Than Moore Newsletter
https://www.patreon.com/TechTechPotato : Patreon gets you access to the TTP Discord server!

Follow Ian on Twitter at http://twitter.com/IanCutress
Follow TechTechPotato on Twitter at http://twitter.com/TechTechPotato

If you're in the market for something from Amazon, please use the following links. TTP may receive a commission if you purchase anything through these links.
Amazon USA : https://geni.us/AmazonUS-TTP
Amazon UK  : https://geni.us/AmazonUK-TTP
Amazon CAN : https://geni.us/AmazonCAN-TTP
Amazon GER : https://geni.us/AmazonDE-TTP
Amazon Other : https://geni.us/TTPAmazonOther

Ending music: https://www.youtube.com/watch?v=2N0tmgau5E4
-----------------------
Welcome to the TechTechPotato (c) Dr. Ian Cutress
Ramblings about things related to Technology from an analyst for More Than Moore

#techtechpotato #AIHardwareShow #EdgeAI #LowPowerAI #AnalogAI #Semiconductors #AIchips #ChipDesign #IoT #Microwatts #SparseAI
------------
More Than Moore, as with other research and analyst firms, provides or has provided paid research, analysis, advising, or consulting to many high-tech companies in the industry, which may include advertising on the More Than Moore newsletter or TechTechPotato YouTube channel and related social media. The companies that fall under this banner include AMD, Applied Materials, Arm, Armari, ASM, Ayar Labs, Baidu, Bolt Graphics, Dialectica, Facebook, GLG, Guidepoint, IBM, Impala, Infineon, Intel, Kuehne+Nagel, Lattice Semi, Linode, MediaTek, NeuReality, NextSilicon, NordPass, NVIDIA, ProteanTecs, Qualcomm, Recogni, SiFive, SIG, SiTime, Supermicro, Synopsys, Tenstorrent, Third Bridge, TSMC, Untether AI, Ventana Micro.

## 全文

Hi everyone and welcome to another episode of&nbsp; the AI hardware show. My name is Ian Cutras&nbsp;&nbsp; from More The More and joining me as always&nbsp; is Sally Wood Foxton from EU Times. Today's&nbsp;&nbsp; episode is all about the ultra low power edge.&nbsp; We're talking microwatts of power stuff that&nbsp;&nbsp; should run for 10 to 20 years. It's going&nbsp; to be fun. It's going to be great. [music] This episode of the AI hardware show is brought to&nbsp; you by Arterus, a trusted partner of the companies&nbsp;&nbsp; building the next generation of AI chips.&nbsp; From AMD and Renus to Tenstar Rebellions,&nbsp;&nbsp;

Arterus' network on chip IP is helping the&nbsp; world's top engineering teams move data faster,&nbsp;&nbsp; use less power, and get to market sooner. If you&nbsp; have heard about a breakthrough in AI silicon,&nbsp;&nbsp; there's a good chance Arterus helped make it&nbsp; possible. Find out more later in the episode.&nbsp;&nbsp; At the absolute bottom of the power curve, a coin&nbsp; cells rule and always on sensors can't afford even&nbsp;&nbsp; a single millatt. A spinitity's AML 100 shows&nbsp; what analog AI can do. This is not your typical&nbsp;&nbsp; accelerator. It's a complete signal analysis&nbsp; system built entirely in the analog domain,&nbsp;&nbsp;

drawing just 30 microwatts of power. At the core&nbsp; of the AML 100 is Aspinity's ramp architecture,&nbsp;&nbsp; short for reconfigurable analog modular processor.&nbsp; That means the chip doesn't need an analog to&nbsp;&nbsp; digital converter up front. Instead, it captures&nbsp; and processes signals such as audio vibration or&nbsp;&nbsp; anything time series directly in analog. That&nbsp; saves huge amounts of power and lets the chip&nbsp;&nbsp; run continuously for months or years on tiny&nbsp; batteries. Each compute block in the AML 100&nbsp;&nbsp; combines analog signal processing with nonvolatile&nbsp; floating gate memory. That memory stores neural&nbsp;&nbsp;

network weights or filter parameters and includes&nbsp; offset storage to compensate for analog mismatch.&nbsp;&nbsp; Accuracy is good enough to detect events like&nbsp; weight word or vibration patterns. The chip then&nbsp;&nbsp; hands off control to a more powerful digital chip&nbsp; for full inference. This is why Espinity markets&nbsp;&nbsp; it as a sort of AI cache. Use it to prefilter&nbsp; sensor data and only wake up the main processor&nbsp;&nbsp; when it actually matters. That tiered compute&nbsp; model solves a huge problem in Edge AI. How to&nbsp;&nbsp; stay always on without burning through batteries.&nbsp; The AML 100 is shipping now being designed into&nbsp;&nbsp;

products that need extreme efficiency. Think smart&nbsp; home voice triggers, industrial noise analysis,&nbsp;&nbsp; wearable biometrics, and anything else where low&nbsp; latency wakeup detection matters more than full&nbsp;&nbsp; stack AI. It doesn't try to replace your main&nbsp; processor. It saves you from turning it on at&nbsp;&nbsp; all. And in a world of dark silicon and idle&nbsp; leakage, that's increasingly where innovation&nbsp;&nbsp; in edge AI is happening. As for the company,&nbsp; Espinity was founded in 2015 as a spin out from&nbsp;&nbsp; West Virginia University. The companies raised&nbsp; around $22 million in total with investors such as&nbsp;&nbsp;

ANIE Partners and the National Science Foundation&nbsp; with additional support from the US Department of&nbsp;&nbsp; Defense. The latest funding round was a 2023&nbsp; series B for $5 million. The next generation&nbsp;&nbsp; AML 200 was scheduled to be sampling in the first&nbsp; quarter of 25. However, the company hasn't given&nbsp;&nbsp; us any information since April 2024. At the far&nbsp; edge of the AI market, where power is constrained&nbsp;&nbsp; and compute budgets are tight, ARM's Ethos UER is&nbsp; a common approach. These are micro NPUs built for&nbsp;&nbsp; embedded systems, IoT devices, and wearables.&nbsp; Essentially, environments where every microwatt&nbsp;&nbsp;

counts. The thing is, Ethos U has been one of&nbsp; ARM's quieter products in its AI lineup. After&nbsp;&nbsp; the initial launch of the U55 and U65 in 2020,&nbsp; updates were infrequent. That silence created&nbsp;&nbsp; gaps and NXP, for example, skipped Ethos entirely&nbsp; in its most recent IMX lineup, citing the lack of&nbsp;&nbsp; a timely refresh. It wasn't until the Ethos U85&nbsp; arrived that ARM reasserted its direction for AI&nbsp;&nbsp; at the edge. Now, the entry point into this family&nbsp; is that U ethos U55, which begins the series at 64&nbsp;&nbsp; GPS of 8bit compute and a silicon footprint as&nbsp; low as 0.1 millimeters. It's tuned for keyword&nbsp;&nbsp;

spotting, anomaly detection, and always on audio&nbsp; sensing. The next step up is the U65, which scales&nbsp;&nbsp; 16fold to a,000 gigs and extend support to Cortex&nbsp; A based platforms. The point here is to unlock&nbsp;&nbsp; more advanced vision workloads for robotics,&nbsp; surveillance, and smart retail. The U85 is&nbsp;&nbsp; the first model in the series with transformer&nbsp; support baked in, offering up to 4,000 GPS of&nbsp;&nbsp; performance. that pushes it into territory where&nbsp; small language models, real-time segmentation, and&nbsp;&nbsp; basic ADAS workloads can become viable. ARM claims&nbsp; up to 20% better power efficiency, generational&nbsp;&nbsp;

generation with over 90% improvement versus Cortex&nbsp; M only inference. Now, each micromppu is optimized&nbsp;&nbsp; for 8bit integers and 16- bit integers,&nbsp; and the architecture natively supports two&nbsp;&nbsp; to four sparsity. The design includes multiply&nbsp; accumulate arrays, direct memory access engines,&nbsp;&nbsp; and elementwise operator chaining to minimize&nbsp; memory usage. Software remains unified across&nbsp;&nbsp; the stack and so developers can compile models&nbsp; once and deploy across either CortexM, Cortex&nbsp;&nbsp; A or Neverse platforms with Ethos UU integration.&nbsp; Companies like ALF are now building SOC's around&nbsp;&nbsp;

the U85 for designs that live under a watt and&nbsp; run on coin cells. Ethos is still one of the most&nbsp;&nbsp; deployed edge AI engines in the world. Blue Mind,&nbsp; founded in 2020 and headquartered in Toronto,&nbsp;&nbsp; is a company building all analog neural processes.&nbsp; The idea is that chips never digitize the input&nbsp;&nbsp; signal and never spin up high-speed buses or&nbsp; memory. Their architecture is vaguely brain&nbsp;&nbsp; inspired in as much as it uses single transistor&nbsp; multiply accumulate units that process information&nbsp;&nbsp; as continuous voltage patterns storing the results&nbsp; as charge on capacitors. There's no external&nbsp;&nbsp;

memory, no clock, and theoretically no wasted&nbsp; energy. Everything happens as an analog flow.&nbsp;&nbsp; That means that the power draw of their chips&nbsp; is astonishingly low. The BM 110, Blue Mine's&nbsp;&nbsp; first product, runs keyword spotting at 100&nbsp; mill. Even the second generation vision chip,&nbsp;&nbsp; the BM210 targets just 1 to 2 mill for CNN's with&nbsp; up to 10 megabytes of weights. A future chip they&nbsp;&nbsp; claim could reach 1,000 tops per watt, which is&nbsp; orders of magnitude above any digital inference&nbsp;&nbsp; engine today. This analog first approach is highly&nbsp; application specific. The chips are not fully&nbsp;&nbsp;

programmable, but instead ship as a fixed function&nbsp; device tuned for time series analysis, audio,&nbsp;&nbsp; or vision inference. It's a conscious trade-off.&nbsp; Flexibility is limited, but power and latency aim&nbsp;&nbsp; to be unmatched. Blue Mind as a startup has raised&nbsp; about $25 million to date, including a series A in&nbsp;&nbsp; April 25. That funding supports both ongoing&nbsp; development of the BM210 and expansion of the&nbsp;&nbsp; team. The BM 110 is currently in its third tape&nbsp; with volume production planned alongside a lead&nbsp;&nbsp; customer for smart wearables. The BM210 is aimed&nbsp; at camera and sensor applications and is expected&nbsp;&nbsp;

to reach production by 2026. Long-term, Blue&nbsp; Man's road map includes a multi-chip architecture&nbsp;&nbsp; designed for smallcale LLMs, leveraging analog&nbsp; tiling to swap up to a gigabyte of weights&nbsp;&nbsp; while staying within ultra low power envelopes.&nbsp; Early markets for Blue Mind include wearables,&nbsp;&nbsp; predictive maintenance, tire health, defense&nbsp; systems, and industrial automation. Essentially,&nbsp;&nbsp; scenarios were always on monitoring and&nbsp; submill budgets are critical. The company's&nbsp;&nbsp; also actively pursuing partnerships across&nbsp; smart city, agriculture, and edge healthcare&nbsp;&nbsp;

sectors. When leading chip makers need to connect&nbsp; hundreds of compute engines, memory channels, and&nbsp;&nbsp; accelerators, they turn to Arterus. Their network&nbsp; on chip technology powers more than 880 SOC&nbsp;&nbsp; designs worldwide, enabling seamless data movement&nbsp; across complex SOC's and chiplets. With FlexGen&nbsp;&nbsp; Knock, Encore IP and the Magulum software, Artus&nbsp; automates integration, reduces wire length, power&nbsp;&nbsp; and area, and helps teams bring new silicon to&nbsp; market faster. From data center AI and automative&nbsp;&nbsp; systems to industrial and consumer devices,&nbsp; Arterus provides the hidden infrastructure&nbsp;&nbsp;

that keeps modern computing running efficiently.&nbsp; Their technology is trusted by innovators and the&nbsp;&nbsp; company continues to grow globally. If you want&nbsp; to help shape the future of connected silicon,&nbsp;&nbsp; learn more and explore career opportunities&nbsp; over at arterius.com today. Efficient computers&nbsp;&nbsp; electron E1 is not your typical embedded chip.&nbsp; It's actually a full general purpose CPU built&nbsp;&nbsp; around a spatial data flow model. A clean&nbsp; sheet rethink of what compute should look&nbsp;&nbsp; like when energy, not frequency, is a limiting&nbsp; factor. Unlike traditional CPUs that burn power&nbsp;&nbsp;

in a control flow system, moving instructions and&nbsp; data through pipelines, the E1 pins instructions&nbsp;&nbsp; to static compute tiles and lets the data flow&nbsp; between them. The idea is simple. When inputs&nbsp;&nbsp; arrive, the tile fires. No program counter, no&nbsp; global, no dynamic issue logic, just distributed&nbsp;&nbsp; compute with statically rooted bufferless&nbsp; interconnects and pipeline reconfiguration.&nbsp;&nbsp; That's why they claim 10 to 100 times energy&nbsp; efficiency over competing cores from ARM. The&nbsp;&nbsp; thing is this isn't really an AI accelerator. It's&nbsp; simply that generalpurpose CPU that runs general&nbsp;&nbsp;

purpose CPU code. The E1 supports C++ and Rust&nbsp; through a clang based compiler and includes full&nbsp;&nbsp; 32-bit floating point support. Developers write&nbsp; normal code. And so that minds the electron E1&nbsp;&nbsp; isn't chasing peak tops although efficient quotes&nbsp; its efficiency figures in tops per watt. The point&nbsp;&nbsp; here is that when chasing useful work per jewel in&nbsp; real embedded workloads as a CPU think wearables&nbsp;&nbsp; industrial sensing smart farming space systems or&nbsp; defense anywhere that power budgets are fixed and&nbsp;&nbsp; longevity matters. Essentially use cases where&nbsp; cortex m or cortex a series arm cores run today&nbsp;&nbsp;

and efficient aims to replace them outright.&nbsp; That's a big claim, but Fish now has working&nbsp;&nbsp; silicon and dev kits are going out. They've&nbsp; also announced a road map including a nextgen&nbsp;&nbsp; E2 and a higherend Photon P1 and have partnered&nbsp; with Global Foundaries for manufacturing. Now,&nbsp;&nbsp; Efficient Computer is still an early stage startup&nbsp; founded in 2022 with a $16 million seed round led&nbsp;&nbsp; by Eclipse Ventures. The team includes alumni from&nbsp; Apple, Tesla, Intel, and MIT with backgrounds in&nbsp;&nbsp; compiler design, embedded systems, and lowowered&nbsp; silicon. Their first ticked out chip, a prototype&nbsp;&nbsp;

called E0, was demonstrated privately at CES.&nbsp; I've got a few pictures. The production ready&nbsp;&nbsp; electron followed soon after, and developer&nbsp; kits are now entering early access programs.&nbsp;&nbsp; Beyond the hardware, efficient has also signal&nbsp; interest in licensing fabric IP, positioning the&nbsp;&nbsp; architecture not just as a chip, but as a platform&nbsp; others can build on. Cintiient has quietly become&nbsp;&nbsp; one of the longest running AI chip startups still&nbsp; standing. With more than 20 million units shipped&nbsp;&nbsp; and over $120 million raised, the company's&nbsp; latest product, the NDP250, builds on years&nbsp;&nbsp;

of silicon and system level iteration aimed&nbsp; squarely at always on AI. At under 50 mill,&nbsp;&nbsp; this chip brings multimodal inference to edge&nbsp; devices with the idea to not compromise battery&nbsp;&nbsp; life or thermal limits. It's built on the third&nbsp; generation Cient core architecture running deep&nbsp;&nbsp; neural networks with up to 6 million parameters&nbsp; delivering 30 gigops at 120 megahertz. The NDP250&nbsp;&nbsp; aims to be more than just a neural engine and&nbsp; includes a Hi-Fi 3DSP for local signal processing,&nbsp;&nbsp; an ARM Cortex M0 for standalone logic and a wide&nbsp; range of IO interfaces. This includes support for&nbsp;&nbsp;

direct microphones, images, and sensor inputs, as&nbsp; well as a power management unit for single rail&nbsp;&nbsp; designs. All of this is packed onto a 6 millm&nbsp; package and 22 nanometer node. The architecture&nbsp;&nbsp; supports convolutional, recurrent, and even small&nbsp; transformer models. Users should be able to run&nbsp;&nbsp; attention layers for smaller language models at&nbsp; ultra low power. This lets manufacturers build&nbsp;&nbsp; smarter earbuds, security cameras, and medical&nbsp; monitors that never have to wake up a phone&nbsp;&nbsp; or a server unless they really need to. What's&nbsp; especially interesting is that Cint sees this chip&nbsp;&nbsp;

as the front end for LLM and SLM applications.&nbsp; It won't run a full GPT model on its own,&nbsp;&nbsp; but it can do the automatic speech recognition&nbsp; and texttospech locally, cutting cloud latency&nbsp;&nbsp; in half and extending runtime dramatically with&nbsp; input buffering for pre-roll video and support for&nbsp;&nbsp; multiple models at once. The NDP250 is designed&nbsp; for interaction, not just detection. The company&nbsp;&nbsp; is currently sampling NDP250 with lead customers&nbsp; with volume production targeted for next year. It&nbsp;&nbsp; acquired pilot.ai AI to strengthen its vision&nbsp; model capabilities and null's mem's microphone&nbsp;&nbsp;

business and continues to focus on end-to-end&nbsp; system integration. The road map includes a much&nbsp;&nbsp; bigger silicon, a future device that might scale&nbsp; inference workloads by a thousand times, targeting&nbsp;&nbsp; ondevice large language model processing. The&nbsp; challenge will be doing that without breaking&nbsp;&nbsp; power budgets, but that's always been the bet.&nbsp; Cintient strategy isn't to chase performance,&nbsp;&nbsp; but to put compute into the smallest power&nbsp; envelopes the edge can handle. Fentosense&nbsp;&nbsp; is taking a radically efficient approach to AI at&nbsp; the edge. One that doesn't just shrink the model,&nbsp;&nbsp;

but cuts out the parts of the model that simply&nbsp; don't matter. Their latest chip, the AI Atom 100,&nbsp;&nbsp; is the first commercial microcontroller to fully&nbsp; integrate sparse AI throughout the stack. Built in&nbsp;&nbsp; partnership with ABOV Semiconductor, this device&nbsp; fuses a Phentosense NPU with a general purpose&nbsp;&nbsp; MCU in the same package, enabling real-time voice&nbsp; and audio intelligence at microwatt power levels.&nbsp;&nbsp; The architecture centers around the SPU1, a sparse&nbsp; processing engine built on TSMC 22nm and paired&nbsp;&nbsp; with a megabyte of onboard memory. But because&nbsp; of the sparse nature of the design, the company&nbsp;&nbsp;

claims the memory acts like 10 megabytes of&nbsp; traditional memory as it skips over the zeros and&nbsp;&nbsp; only activates compute paths when real data flows.&nbsp; Now, that's the key. The chip doesn't store sparse&nbsp;&nbsp; weights. It computes sparsely, too. By avoiding&nbsp; operations on empty data, it claims a 10 times&nbsp;&nbsp; boost in efficiency from sparseware memory and&nbsp; another 10 times boost from sparseware compute.&nbsp;&nbsp; Keyword detection runs at under 100 microwatts.&nbsp; Speech enhancement stays under 1 millatt. That&nbsp;&nbsp; sort of thing. The market focus here is clear.&nbsp; Smart appliances, wearables, hearing aids,&nbsp;&nbsp;

headsets, any device that needs local voice or&nbsp; sound detection without the cloud and without&nbsp;&nbsp; draining the battery. The AI Atom 100 handles wake&nbsp; word detection, noise suppression, real-time voice&nbsp;&nbsp; enhancement, and even event detection, all&nbsp; on device and in real time. There's no round&nbsp;&nbsp; trip to a server, enabling privacy, latency,&nbsp; and responsiveness. As a startup, Fentosense&nbsp;&nbsp; was founded in 2018 and raised $8 million as a&nbsp; series A in 2022, led by fine structure ventures.&nbsp;&nbsp; It has also been awarded grants of around 3&nbsp; million, although these were back in 2017.&nbsp;&nbsp;

Evaluation kits of the AI Atom 100 are already&nbsp; available and the company is actively engaging&nbsp;&nbsp; with appliance makers, consumer electronics firms,&nbsp; and industrial headset providers. The partnership&nbsp;&nbsp; with ABOV semiconductor gives them access to an&nbsp; established customer base in home appliances,&nbsp;&nbsp; a segment where ultra- low power voice interfaces&nbsp; are in high demand, but have traditionally been&nbsp;&nbsp; cost or power prohibitive. With several pilot&nbsp; deployments already underway, Fentosense is&nbsp;&nbsp; positioning its chip as a volume ready platform&nbsp; that combines custom AI acceleration with&nbsp;&nbsp;

mainstream MCU workflows. I think what always&nbsp; impresses me here is just how much work we can do&nbsp;&nbsp; in a microwatt. Yes. And under well a microwatt is&nbsp; a really tiny amount but if it's under a millatt&nbsp;&nbsp; then it's always on basically. So even a microwatt&nbsp; is like a thousands of thousandth of that. It's I&nbsp;&nbsp; always think a thousand watt microwatt things all&nbsp; always on. I always think you know all the stuff&nbsp;&nbsp; in Voyager right now that's been going for what 40&nbsp; years. Yeah. Always on. Yeah. Yeah. So stuff like&nbsp;&nbsp; that still working sort of coin batteries.&nbsp; Maybe in the next voyage. Okay. [laughter]
