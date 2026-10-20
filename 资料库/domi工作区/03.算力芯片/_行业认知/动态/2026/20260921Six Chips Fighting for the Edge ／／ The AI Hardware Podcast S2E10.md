<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_6a8cd2b65f3d17f1"
title: "六款芯片角逐边缘市场 // AI 硬件播客 S2E10"
domains: ["算力芯片"]
subdomains: ["AI加速器与GPU"]
types: ["行业认知","视频"]
companies: "Axelera AI,Kinara,NXP,EdgeCortix,MemryX,SiMa.ai,STMicroelectronics,Amazon"
published_at: "2026-09-20T16:00:00.000Z"
importance: 6
confidence: 6
evidence_status: "一手访谈"
worth_following: true
source_url: "https://www.youtube.com/watch?v=K_0xp41Q_jk"
source: "YouTube·TechTechPotato"
---

# 六款芯片角逐边缘市场 // AI 硬件播客 S2E10

## 行业认知文章

- 行业：算力芯片
- 公司：Axelera AI,Kinara,NXP,EdgeCortix,MemryX,SiMa.ai,STMicroelectronics,Amazon
- 来源：YouTube·TechTechPotato · [原文链接](https://www.youtube.com/watch?v=K_0xp41Q_jk)
- 发布时间：2026-09-20
- 原文存档：本文下方「原文存档」章节

## 摘要

【核心观点】边缘AI芯片是"约1瓦上下一个数量级"的长尾利基市场，容得下150+家公司并行发展；本期由 Ian Cutress 与 Sally Ward-Foxton（EE Times）对谈盘点七家代表性厂商的产品与打法，并讨论智能零售落地的真相。
【关键事实】Axelera AI（荷兰）：Metis 基于 RISC-V+内存计算、主打低功耗视觉处理，累计融资约1.2亿美元（三星参投、欧盟另给6600万欧元补助），正为欧洲 DARE 超算项目开发 AI chiplet，下一代 Titania 在路上；公司强烈绑定欧洲"技术主权"叙事。Kinara：Ara-2（1-2W，面向边缘 LLM）已量产，曾被超大规模客户用于智能货架监控（嘉宾推测为 Amazon Go 类场景），最终被 NXP 约3亿美元收购；双方早有 i.MX 95 卸载 AI 负载的合作，NXP 暂时保留 Kinara 独立产品线。EdgeCortix（日本）：Sakura-2 为"动态神经加速器"，宣称运行时可重构（类似可变 VLIW/数据流重构）、10-20W 功耗下利用率达80%，有防务与航天合同。MemryX：MX3 由前 Intel/高通高管 Keith Kressin 领导，以 M.2 模块形态出现在联想 mini-PC（CES 2024 演示），支持可变精度低至4bit、内置近存计算。SiMa.ai：第二代 Modalix 为 16nm SoC（A76/A65 CPU+Synopsys 视觉处理器+MIPI+浮点支持），累计融资3.3亿美元（含2.3亿 B 轮）；在 MLPerf 部分维度超过 Jetson NX，并与 Synopsys 探索车载 IP 合作。STMicro：把 NPU（Neural-ART，约600 GOPS）集成进 STM32 高端 MCU，内置 JPEG/H264 视觉管线，借全球最大 MCU 开发者生态铺量。两人还复盘 Amazon Go "千名印度员工"传闻：实为对机器视觉结果做质量抽检与再训练标注（类似芯片产线抽检），并非人工替代，但该舆情伤害了智能零售的声势。

## 值得关注的信号

【值得关注的信号】边缘AI芯片格局高度碎片化、以利基市场求生存，并购整合已经开场（NXP-Kinara 约3亿美元为标杆案例）；欧洲"技术主权"与日本防务/航天需求都在用政府资金为本国初创买单；把 NPU 塞进存量生态（STM32 MCU、M.2 插槽）是铺量最确定的路径。对国内边缘芯片投资的映射：能绑定存量生态与具体部署场景（零售/工业视觉）的公司才有兑现窗口，纯芯片指标领先不构成护城河。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"3ebd5541417a2ee2aef1ca66eb5153ee5620403b2f559962bbc08950ecadc312","translationSha256":"2b0bc18af992cfed62ec56481af76c47d61f341d7bfb293f5351edce3f8201b2","sourceCharacters":33853,"timestampValues":0,"timestampOrderVerified":true,"englishProseChecked":true} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

- 链接：https://www.youtube.com/watch?v=K_0xp41Q_jk
- 频道：TechTechPotato
- 发布日期：2026-09-21
- 时长：32分23秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

边缘 AI 不需要数据中心——它已经在你身边的零售门店、笔记本电脑和微控制器中运行。在这场边缘 AI 深度探讨的第二部分中，Ian Cutress 和 Sally Ward-Foxton 跳出既定流程，讨论七家芯片公司——Axelera AI、Kalray、Kinara、EdgeCortix、MemryX、SiMa.ai 和 STMicroelectronics——涵盖融资、产品形态和市场进入策略。他们还重新谈起（大多被误解的）Amazon Go AI 故事，并预告下周节目将讨论微瓦级边缘硅芯片。

[00:00] 开场
[00:41] 本期节目的赞助商 Arteris
[01:06] Axelera AI Metis
[05:57] Kinara AR2
[11:44] EdgeCortix Sakura 2
[16:15] MemryX MX3
[23:11] SiMa.ai Modalix
[26:49] STMicroelectronics Neural-ART
[31:44] 下一期：微瓦级 AI

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

#techtechpotato #EdgeAI #AIHardware #AIChips #Semiconductors #RISCV #NPU #TechPodcast #AIHardwareShow #EETimes #STMicroelectronics
------------
与其他研究和分析机构一样，More Than Moore 曾向业内许多高科技公司提供或正在提供付费研究、分析、咨询或顾问服务，这些服务可能包括在 More Than Moore 新闻通讯或 TechTechPotato YouTube 频道及相关社交媒体上投放广告。属于这一范围的公司包括 AMD、Applied Materials、Arm、Armari、ASM、Ayar Labs、Baidu、Bolt Graphics、Dialectica、Facebook、GLG、Guidepoint、IBM、Impala、Infineon、Intel、Kuehne+Nagel、Lattice Semi、Linode、MediaTek、NeuReality、NextSilicon、NordPass、NVIDIA、ProteanTecs、Qualcomm、Recogni、SiFive、SIG、SiTime、Supermicro、Synopsys、Tenstorrent、Third Bridge、TSMC、Untether AI、Ventana Micro。

## 全文

大家好，欢迎收看新一期《AI Hardware Show》。我是 More Than Moore 的 Ian Cutress，和往常一样，今天与来自 EE Times 的 Sally Wood Foxton 一起主持。这是两部分节目的第二部分。在第一部分中，我们采用更接近新闻节目的形式，向大家介绍将要讨论的每家公司和每款芯片的一些事实与数据。本期的第二部分则更像是自由形式的讨论或对话，聊聊这些公司提供的一些产品和服务。本期我们将聚焦边缘 AI。外围。边缘领域。确实是在边缘领域。本期《AI Hardware Show》由 Arteris 赞助，Arteris 是一家由工程师创立、服务于工程师的公司，

其 IP 网络和自动化软件的每一行代码都体现了深入的研发，致力于解决芯片设计中最具挑战性的问题。Arteris 为工程师提供工具，帮助他们打造更快、更高效的硅芯片；公司正在招聘希望投身这一前沿领域的人才。如果你感兴趣，可以在本期稍后了解更多。那么，我们名单上的第一家适配器公司，是一家我们都很熟悉、你们俩也都相当了解的公司：Xcelerator。嗯，Xcelerator AI。呃，他们在各种活动上展示 Metis 芯片已经有两年、两年半了。是的。他们有点像是视觉处理设备，呃，功耗低，面向瓦级功耗设计。

是的。这是一款基于 RISC-V 的设计。呃，内存内数字计算。我认为 Xcelerator 最有意思的一点是，这项技术很出色，我看过演示，相信它确实很棒。但 Xcelerator 的一个特点是，它是一家欧洲公司，而且非常专注于欧洲市场。在欧洲，这也与技术主权有些关系，这是一个重要议题。所以我总是在美国看到他们。是的，他们非常积极进取。我想，如果你和首席执行官 Fabrizio 聊过，他的理念之一就是欧洲公司应该像美国公司一样积极进取。嗯，而且我们

应该努力创建有雄心的公司，吸引风险投资。欧洲的创业环境和这里完全不同吗？规模小得多。欧洲的资金是不是比美国少得多？欧洲有人工智能独角兽吗？呃，在欧洲？最接近的可能是 Graphcore。哦，确实。是的。但他们显然已经退出市场了。是的，Graphcore 融资700百万，估值显然一度达到独角兽级别。没错。不过除此之外，是的。呃，不，他说得对。我们这边……我的意思是，人工智能公司的聚集地在……我在布里斯托尔附近看到几家。是的。既然提到这个，呃，我想 XMOS 也在那里，对吧？没错。

呃，不过我们在荷兰这一带也有一些公司，在德国也有。塞尔维亚是我们谈到的许多公司的重要软件中心。我们还看到西班牙出现了一些新项目。小团队承担五型项目可能会有风险。嗯，是的，这也是我认为我们应该关注的另一个领域。不过说到 Accelera，我上次和他们交流时，他们提到要参与一个名为 Dare 的大型欧洲项目，目标是建造一台欧洲超级计算机。很好，在这台即将建成的大型超级计算机中使用欧洲硅芯片。Accelera 正在为此开发 AI 小芯片。好的，是的，因为

Accelera 一直是那种不会把硅芯片限制在单一产品形态中的公司。你可以在 SBC 系统上用它，知道吧，就是小型电脑。你可以把它做成 m.2 模块，也可以做成 PCIe 卡；他们会按你的要求对它进行扩展，并以你想要、需要的方式安装。嗯，他们从来没有像公开提供的开发套件那样做过什么，对吧？我想是的。好的。嗯，我觉得他们有一个可以买到的开发套件，而且他们正尝试支持多家客户，或者说若干……是的。嗯，我记得上次见到他们是在 CES，当时他们展示了很多视觉演示。呃，它

感觉他们很难把自己的名字传播出去，让人们知道他们是谁，也很难参与到行业讨论中。是的，嗯，确保人们知道他们是这个市场上的一个选项。不过，由于 Metis 是他们的第一款芯片，他们也在谈论下一代产品，也就是所谓的 Titania。所以他们应该谈谈它。是的，现在是时候多了解一些了。是的，嗯，不过目前你知道，他们专注于 8 位最大值，但他们正努力提供相当于 32 位的精度。是的，他们为此在硬件中采用了混合精度。是的。嗯，是的，我这里也有。是的，荷兰，120 百万美元融资，

其中包括 Samsung，嗯，还有向该公司提供了 66 百万美元资助的欧盟。你知道，这笔钱用于这台超级计算机。某种主权 AI。嗯，我觉得，是的，这在未来会越来越重要。嗯，我是说，这种主权性太强了，真棒。这是我们在播客里没谈到的公司之一，比如 Kalray，一家法国公司。他们大肆宣传自己的芯片是在法国设计的。嗯，显然它也是在法国制造的，不过后来他，嗯，你知道，又把它装进一套在法国建造的系统中，而且有很多法国人参与其中，只是为了，嗯，你知道，只是为了说明它尽可能地

是一件本土制造的产品。尽可能本土化。是的，目前世界上能生产自己的先进芯片的国家很少。其他国家只需要掌握产业链的部分环节，但我觉得，你希望尽可能多的环节都在自己的公司里。我觉得，在我的国家也是如此。那么接下来是一家公司，它本来可能会出现在本季第一集里，或者我们做过的某一集中——前提是按照我以为的播出顺序来排的话。嗯，那一集全都在谈退出案例，而 Kinara 不管结果好坏，都是其中之一。所以我们谈 Kinara 的内容比他们最终呈现的更多，这就是为什么把他们放在那一集里。Kinara，嗯，成功退出了，它

被 NXP 收购了，我想价格是 300 百万美元左右。这对一家由风险投资支持的公司来说，是一次非常成功的退出。嗯，是的，恭喜他们。是的，我的笔记里没有他们融资总额的数据，但他们正在开发第二代芯片。这是 Ara 2。所以，Kinara Ara。他们有 Ara 1，更偏向视觉处理；之后又推出了 Ara 2，专为边缘端 LLM 设计。所以在我看来，Kinara 肯定一直在和 Halo 直接竞争。很好。功耗大概是 1-2 瓦。也就是说，把一个小型 1-2W LLM 放进某种设备或用户界面里。是的。嗯，这是不是最适合他们的应用场景？

是的，我这里有，是的，这款芯片已经量产了。AI 助手、智能零售、游戏、工业自动化和 IoT PC。嗯，还有，我是说，这很有意思。我这里有一个部署案例：在超大规模场景下，用于货架监控和边缘分析。是的，所以我们猜这是 Amazon Go 之类的项目。我不知道还有谁有类似的应用，但基本上就是摄像头看着你把商品从货架上拿下来、放进购物车，然后向你收费。还有，是的，是的，是的，所以我当时没想到这一点。我想得更多的是，嗯，实际上是在数据中心里，他们在那里做额外的监控。嗯，你是指

监控服务器和来回走动的人之类的。购物，嗯，零售场景，嗯，智能零售应用。也就是说，你看着自己从货架上拿水果，记录你拿了多少，然后就，嗯，拿着买的东西走出去。是不是有个很大的新闻说，这实际上并不是用人工智能做到的？是的，我不太确定这说法有多准确，因为我知道有好几家公司声称，他们的设备就用于这类应用。嗯，我是说，值得一提的是，全球有多少家 Amazon Go、Amazon Fresh 门店吗？有好几百家，对吧？我不知道。对。没错，而且很多门店仍然

在营业，对吧？这项技术现在仍在使用。当时的说法是，大约有一千名印度员工在做 AI，由此还产生了一个梗，说 AI 实际上是“印度人”的意思。问题是，不可能让一千人去操控几百家门店。他们实际上是在测试设备是否能正确响应。是的。嗯，这就像任何人检查 LLM 输出的数据是否可靠一样。这只是为了确保机器视觉处理器进行质量控制，并把数据反馈给再训练模型。这成了一场巨大的丑闻，大家都把事情闹大了，因为这并不是 100% 的真实情况。问题是，对于大多数

交易来说，情况确实如此。是的。只是你需要时不时检查一下，就像做质量控制一样。我是说，就像检查生产线上的芯片质量一样。是的。嗯，你知道，如果你是药品制造商，就需要检测药品质量，嗯，从你的，呃，灯泡里取出一些药品。是的，不管是什么。是的，情况就是这样。遗憾的是，这件事不知怎么地损害了智能零售的声誉。因为说实话，如果我们谈的是机器学习的应用，以及它与你我这样的消费者、个人的直接相关性，那么智能零售是一个很重要的概念。绝对是。而且 Amazon 已经，嗯，你知道，已经在线上根据你的

购物习惯做这些事了，所以为什么不能在实体店里做呢？是的，差不多就是这样。是的，我觉得就 Kinara 而言，当这个智能零售应用出现时，他们从来没说那是 Amazon，也从来没说客户的名字。嗯，我们现在只是在猜那是 Amazon，但也可能不是，不是什么日本人，你知道。是的，再说一次，是的，我们不知道。嗯，这充分证明了他们有一个付费客户，也证明了他们的软件栈运行良好。这对当时处于那个发展阶段的公司来说，是件大事。嗯，这也是一种获取客户的方式：告诉别人你有一个大客户。Kinara 已经

长期以来一直与 NXP 密切合作。一两年前，甚至可能更早，他们就展示了与 NXP 合作的应用案例，实际将一些任务从……卸载出来。比如，你有 i.MX 95，我们会在另一期节目中讨论它。如果这个芯片的工作负载太重，你可以直接连接 Kinara Ara 1 或 Ara 2，将多余的 AI 工作负载卸载给它。但要让它们协同工作，你必须使用整套软件；他们还必须演示它们如何协同工作，而演示成功了。所以我和 NXP 谈到这件事时，他们对这是否是收购 Kinara 的决定性因素有些怀疑。但在我看来

，这似乎是个显而易见的选择，因为它达到了一定的准入门槛，也就是确实能用。这算是一种证明。而且 NXP 的产品无处不在。没错，确实无处不在，应用领域也非常广泛。他们是全球最大的芯片制造公司之一。所以 Kinara 似乎表示，目前会让 Kinara 的硅芯片保持独立。他们不会像处理 IMX 95 那样，尝试把知识产权整合进 NXP 的产品，至少现在不会；不过，他们似乎没有排除未来这么做的可能。嗯，这件事值得关注，看看他们会不会谈到它。NXP 会谈吗？会，会，希望他们会。我们这一期有一件事没有

怎么深入谈，那就是日本的硅芯片。确实如此。不过，有一家公司我们肯定在持续关注，那就是 Edge Cortix。Cortix。我不想说成 Cortex。我想到的是《古惑狼》。不，是 Cort……是 Cortix。就像 cortical（皮层）的 Cortix，没错。嗯，还有 Sakura 2。我们好像在 23rd 里看过 Sakura 1。是的，在上一季，嗯，不过他们还有 Sakura 2，这基本上是他们动态神经加速器的下一代产品。嗯，Sally 和我在开拍前还在讨论，这个架构到底是什么。是的，很遗憾，我没有太多这方面的细节。嗯，这些年来我和这家公司聊过几次，

但一直没能弄明白这个架构具体如何运作，以及其中的复杂之处。所以，是的，也许我会继续和他们沟通，试着弄清楚。不过据我们所知，它是一种可在运行时重构的可重配置架构。这是他们说的，也是我们目前知道的。所以听起来有点像这样——像是一种高效的 E1，适用于超低功耗的边缘场景。或者像我们在……中提到的那个硅芯片问题，因为它可以在运行时重新配置。是的，思路是，如果能够适应工作负载，就可以为它分配更多资源。不过，回头看我的研究笔记

，我当时写的内容听起来几乎像是可变 VLIV。嗯，一种超长指令字。嗯，所以显然这意味着可以把多项计算打包到一条指令里。嗯，不过看起来，如果只需要 16 个元素，也许可以这样做；但如果需要 1024，从我的笔记里看不出来是否还能有，你知道，16 组 16，那样它基本上就只是一个庞大的 VLIV 引擎了。那么，这种可重配置，是指数据流可重配置，还是仅仅指可变 VLIV？嗯，我不确定。还有，你说你和他们聊了很多年。是你主动找他们，还是他们有消息时会来找你？

两种情况都有。嗯，确实两种都有一些。嗯，不过是的，我想多了解这家公司。我觉得最让我印象深刻的一点是，他们有不少，或者说有几个，嗯，国防和太空领域的合同。他们不想谈这些。也许吧，不过他们还是公布了一些信息。这是一家日本公司，但他们似乎在其他地区也拿到了太空领域的合同，所以……是的，我这里记着，有一款芯片功耗低于 10 瓦，或者两款芯片的功耗在 20 左右。嗯，而且利用率达到 80%，这很厉害。想到把它用在边缘设备上还挺奇怪的。是啊，没错。我们通常是在

数据中心的背景下讨论这个，我想是这样。以及它处理大量数据时能有多高效。此外，10...10-20W 更适合用在设备里，而不是边缘端，对吧？比如放在零售门店里，对摄像头采集的画面进行机器学习的设备。但它不是电池供电的。它是接着电源的。对，是接着电源的。是的。所以它就像……像一种边缘端的迷你服务器设备。没错，是的。是的，所以也可以放在那里。是的。边缘的定义取决于你问谁。没错。也许我们应该做一期节目，专门定义边缘、定义神经形态计算，再定义所有这些主题……噢，那会是最有争议的一期节目。你会收到很多

关于这件事的来信。来信？对，你知道我是什么意思。邮箱？评论。评论。今天的赞助商是 Arteris。工程创新永不停歇。他们的团队正在开发下一代网络软件和集成技术，将现代 SOC 中的一切连接起来。通过持续的研发，他们实现芯片设计自动化、提升性能并缩短客户的产品上市时间，服务于人工智能、汽车和数据中心领域。Arteris 的工程师致力于开发连接 CPU、GPU 和加速器的技术，应用于最复杂的硅系统，并使用最新的设计工具和先进的验证方法。公司与

AMD、Cadence、Synopsys 和 Renesas 等全球领军企业紧密合作，共同为系统设计集成树立新标准。如果你想加入这支塑造硅芯片未来的团队，可以访问 arteris.com，了解当前职位机会并获取更多信息。我们谈到了提供不同外形规格的公司。嗯，MemoryX。这家公司似乎由 Keith Kressin 领导，他以前在 Intel 工作。嗯，他……这家公司最初进入我的视野，是因为 Lenovo 跟我提到了他们。因为他们和 Lenovo 做过演示，或者把产品装进了一台笔记本电脑之类的。所以，关于这些 AI 芯片的一个论点是，如果尺寸、形状和功耗都合适，就可以把它们放在一台……

M.2 模块。你知道，M.2 模块在技术上最高可以达到 25 瓦，不过实际上大多数 SSD 的功耗是五到七瓦。通常这就是 M.2 的功耗。嗯，因为大多数情况下，它上面不能加任何实体散热装置，或者可能只能加一片薄散热片。所以对于设备来说，尤其是台式机，现在有三个、四个、五个 M.2 插槽，甚至最新的一些……有些笔记本电脑，你知道，根据尺寸或形态规格不同，会有两个或三个插槽。如果能在里面装一颗 AI 芯片，因为我记得英特尔很久以前就说过，他们应该这么做，用他们的神经处理器，而不是在处理器或主板的其他部分另开一个独立插槽来装 GPU，就像笔记本电脑那样，

把它装进 M.2 插槽里。所以当联想出来说：“嘿，我们有一台笔记本电脑，或者我记得他们那次推出的应该是一台迷你 PC，里面装了 Memory X MR3 芯片。”那应该是 CES 24。好吧。他转过身来说：“你知道，过来看看。”我们有一颗来自 AI 初创公司的 AI 芯片，不是大厂，不是英伟达，也不是 AMD。”你就会说：“等等，什么？”是啊，他说：“怎么回事，一家初创公司，喂。这里发生什么了？第二，联想，喂。是啊。我当记者时和联想合作过一阵子。倒不是最近 5 年左右。不过在我看来，他们总是……他们的设计团队总喜欢做出

几乎已经完成的产品。好吧。嗯，而且形态规格种类非常多，非常多……这不是把意大利面扔到墙上看看什么能粘住，因为其中很多设计其实都经过了周密考虑。好吧。嗯，有些人可能会有不同看法，取决于你最近遇到的 BIOS 更新之类的问题。但他们能说：“嘿，我们正在和……合作。”我的意思是，AI 领域还有另一家公司。嗯，另一家 AI 初创公司，他们也有另一款 M.2 模块。不过，是啊，不，这又是为了展示优势。“让设备获得更多权限，有更多机会来运行语言模型。”我的意思是，当时嘛，你知道，大概是 Llama 3 刚推出的时候，甚至可能是 Llama 2 的时候。所以我们在

看的是类似 7 十亿参数的模型。嗯，大概是这样。不过，我的意思是，这颗芯片支持可变精度，最高可达四位。嗯，是的，这可能是我们首批能做四位运算的消费级芯片之一。是的，我最近在 EnCharge 那里看到过。是的，相较于 Memory X，他们进入市场的时间还比较短。是的。所以它有内置存储器，带有函数映射；还有乘法和累加功能，比如用于矩阵运算的内核；以及用于更多顺序运算的标准 ALC。因此看起来它涵盖了 Transformer 基础架构的大部分需求。你需要紧邻计算单元、速度很快的存储器。你需要运算符具备良好且稳定的性能。你

需要矩阵乘法运算具备良好的并行性能。嗯，还有软件栈……所以，如果 Memory X 的人正在收看，我得先道个歉，因为你们转过头来，我想说的是，在今年一月的第二周，说：“现在已经是夏天了。”我们录制的时候正值夏天。”不过他们后来又联系我，问我愿不愿意评测他们的人工智能加速器。我知道你不做设备评测。我是不做，不过我的经验是评测硬件处理器和其他东西。评测 AI 硬件是个雷区，因为你可能会在编译器里弄错一个检查标记。当然。是的，然后生产力就会损失一半。

大家都会抱怨你没用这个或那个的最新版本。而且大多数时候，我现在也不做评测了。我很乐意拿一台来看看，是啊。我觉得你可以聊聊架构。比如 M.2 上的一台。不，你可以直接在亚马逊上买一台。这就是问题所在。你买不到。或者也许你在这里买不到。哦，也许吧。确实如此。这可能是地区性问题。嗯，不过，是啊，也许我该把那封信翻出来，联系一下，然后说：“回信吧。”因为其实我大约一个月前就在 LinkedIn 上加了 Keith。我不是忘了，只是没告诉你我看到了。所以，是啊，嗯，我觉得如果同一个 5 瓦范围内有更多公司

提供 AI 芯片，做成 M.2 模块，嗯，或者做成 PCI 卡，就像 Tenstorrent 或其他厂商提供的那样。只要你说清楚这些产品可以买到，你知道，其他开发者肯定会拿来试用。你可以建立一个社区。是啊。我想这取决于你想不想建立社区，或者之类的。这个是你的优先事项之一吗？你的初创公司规模有多大？嗯，因为建立社区是一回事，支持这个社区也是……我的主张是，不提供任何支持也照样建立社区。我觉得那……那……那……确实如此。我，嗯，离开了几家公司的 Discord 服务器，因为我觉得不太对劲，但也

觉得其中有些服务器，嗯，并没有真正体现出他们拥有一个社区。是啊，好吧。对吧？你的社区页面上的第一个按钮应该是“加入我们的论坛”“加入我们的 Discord”，而不是“给我们发邮件”之类的。是啊，我的意思是，你知道，社区很棒，你能收到关于软件里有这些漏洞之类的各种反馈，但之后你真的得采取行动，想办法解决。有些初创公司根本没准备好应对这种程度的反馈。但你希望这个漏洞在 3 年后部署给客户时还留在软件里吗？我想，这就是那种必须谨慎对待自己愿望的时候。嗯，是啊。尤其是

如果那是个错误，对吧？我宁愿他们在 10,000 台设备装进联想 PC 之前发现关键漏洞。我们说的不是内存访问问题，那……不，不，不。只是泛泛地说社区这件事。所以，我们也稍微聊了聊 SiMa……是啊，AI。我们在上一期节目里看过他们的 MLSoC，不过他们还有一个新设计，叫 Mod……是啊，这挺烦人的，因为他们有 MLSoC，现在又有 Modilex。是啊，MLSoC，也就是 MLSoC 的第二代产品……这是 MLSoC 的第二代。是啊，我想他们只是把它命名为 Modilex，以便和第一代区分开来，后者其实并不……公司们，联系我。我可以帮你们做你们的

营销。用你的名字。用你的名字。Modilex——其实这个名字还不错，因为他们做了改动后，它就是多模态的。这很正常。里面只是有 MLSoC。是的，好吧。所以我认为，SoC 这一部分对于区分它也很重要。这不是一个独立的加速器。它有一堆 ARM 内核、DSP，还有各种各样的东西，基本上可以运行一个完整的程序，而不只是一个 ML 加速器。所以这适用于机器人，以及那些需要在一个程序里运行所有东西的设备——也就是在一颗芯片上运行整个程序。是的，我是说，光看我的笔记，这是一颗 16 纳米芯片，所以是的，相当先进，先进，先进。是的，听起来差不多。但

上限是 50，这使它有资格用于 Microsoft Co-pilot，但它显然并没有。是的，A76 个 A65 内核，以及一款 Synopsys 机器视觉处理器。是的。嗯，这些是供机器视觉处理器使用的专用视频编解码器。这次他们还加入了 MIPI。是的，他们为机器视觉增加了很多东西，比如 MIPI……在机器视觉流水线里做了很多改进。如果我没记错，他们还增加了一个互联网提供商。嗯。不过他们也增加了浮点支持，这对 Transformer 更好。嗯，是的，他们对硬件做了一系列改动。同样，你可以去看这个播客的新闻版，或者阅读相关内容，网址在

eetimes.com。嗯，是的，它是 SoC。他们的软件发展历程一直很强。他们从一开始就采用了大型的一键式方案，然后直接下沉到硬件。这在当时是个非常重要的事件。现在越来越多的公司开始提供这种成熟的工具链，但感觉他们一直在这个领域领先于竞争对手。嗯。还有什么？哦，对了，他们最近，嗯，和 Synopsys 达成了某种协议，打算向使用 Synopsys 工具开发汽车芯片的人提供 SimAI 的汽车知识产权。嗯，所以我告诉他们的时候，这项合作还在以比较笼统的方式讨论，谁向谁授权，以及具体会如何运作，嗯，就工具而言。

当时还在讨论中。但，是的，这可能会成为他们非常有力的合作关系。这可能会成为一个对他们很有意思的新市场。不过，是的，这意味着又一次信心认可，对吧？这说明它行得通。我笔记里记着他们也提供了 MLPerf 结果。是的，是的，他们做了。嗯，他们对此非常自豪。而且他们取得了很棒的，呃，能效结果，所以也一定要去看看。和 Jetson NX 相比，这些结果很有意思；Jetson NX 是边缘开发中很受欢迎的平台。是的，GPU 在边缘。图形处理器

在边缘。是的，他们是少数几家能够说自己至少在某些维度上在 MLPerf 中超过了 Nvidia 的公司之一，能这么说的公司不多，所以恭喜。融资方面，330 百万美元，对于一家先进 AI 公司来说，这笔钱说实话非常多，其中包括 230 百万美元的 B 轮融资。嗯，告诉你一声，一家处于 B 轮阶段的公司已经有了第二代芯片，这挺酷的。这挺酷。一定要记住这一点。接下来是 STMicro，你知道的，是这个行业的大玩家。他们有 Neural Art。是的，他们叫它 Neural Art。是的，是 ST，是一家欧洲公司，所以有点法国和意大利的风格，有很多法国

和意大利人。是的，Neural Art 是他们给自己的神经处理器起的名字。嗯，他们谈论推出这款由神经处理器驱动的智能控制器已经很久了。嗯，我觉得他们拥有世界上规模最大的微控制器系列之一，也就是说，它的应用非常广泛。我不知道这些微控制器究竟有多少百万或数十亿颗部署在各种各样的设备中，你能想到的每一种设备里都有，从家用电器到更大型的设备。比如调制解调器。绝对什么都有，不过这个系列 STM32 在全球都以……而闻名。是的，是的，是很受欢迎的微控制器。所以他们从这个系列里选了一款高端微控制器，

然后在旁边加上这个神经处理器，让它具备强大的 AI 潜力。他们没有告诉我们太多关于加速器本身的信息。但它现在进入了 STM32 生态系统这一事实，本身就很重要；已经有数万亿开发者在这个生态中开发，而且这个生态已经广为人知。显然存在一条更新的路径。他们收购了一家时间序列软件开发公司，并且……是的，软件工具链已经很成熟。嗯，实际上他们做得非常好，而且他们在做 tinyML 时总是提交 MLPerf 结果，嗯，后来又做 MLPerf。他们确实……我想还有一件事也体现了这套工具链的成熟度：在

他们参与 MLPerf 时，很多展示推理引擎和软件解决方案的人都在 STM32 上进行演示，因为他们的工具链真的非常非常好用，对吧？我认为这对他们来说也是一个很大的信心认可。不过，是的，这种产品会被部署到所有地方，所以……不过是的，这个，嗯，我还能说什么？它不到一个 vertex，不到一个 vertex。呃，它是一个相对小型的 NPU。所以它没有……我笔记里写的是 600 十亿次运算。600 十亿次运算。比任何其他 STM32 微控制器都高 600 倍。没错。所以一切都取决于规模，就像所有事情都是相对的。嗯，那么对

对 STM 来说，这对我们而言就是 STM32 系列，嗯，它确实很强大。是的，资料还说他们内置了一些计算机视觉流水线。还有 JPEG H.264 带宽支持，以及 2 1/2 D 和 2D GPU，用于图形流水线。听起来它越来越不像微控制器，而越来越像人工智能加速器了，基本上就是如此。所以，这些是小型视觉程序，是的。是，是的，事实上，这对很多地方来说都是一条更新的路径。你知道，这归结到一个问题：我们真的需要把 AI 部署到每个地方吗？需要在每个地方都配备加速器吗？嗯，不过对于其中一些东西来说，硅片成本是

所以微不足道。是的，只是为了发挥使用某种东西的潜力……是的。嗯，这说得通，而且你知道，做到这一点最好的方式之一，就是采用最流行的芯片设计之一。大家都用这种方式。是啊，你刚才提到有 Synopsys IP 之类的东西，你知道，STMicroelectronics 做这行已经很多年了。所以我预计很快所有不错的 EDA 商店都会提供它。是的。EDA 有类似 Play Store 的东西吗？呃，或者 Apple Store？它们有自己的生态系统，对吧？不，不，不，我知道，但你只要选自己想要的就行。哦，我明白了。要是事情真有那么简单就好了，对吧？是的。不过我们在和你们交流时，总会提到很多领先的

参与者。你知道，我们目前追踪的公司超过 150 家。嗯，其中很多公司的功耗大约在 1 瓦上下一个数量级的范围内。咳。嗯，因为它们可以进入很多小众细分市场。所以，小公司也能成功。绝对可以。嗯，创业做一款小芯片所需的投资，远没有打造一款用于数据中心的大芯片那么多。如果你要在某个细分市场做产品，也不需要那么复杂的工具链，也不需要各种各样的模型。比如，小公司做这件事要容易得多。所以，是的，我确实预计会看到更多细分市场，甚至会有更多细分市场涌现出来……

进入市场，而且每个细分市场都会出现更多芯片公司。这绝对是个不断发展的行业，我也在积极关注。所以这是美国人的小众市场。也就是说，我们说的是 niche。我们说的是 niche。我们说的是 niche。所以，我的意思是，我们在看着你们。本期节目谈的是 1 W 上下一个数量级的功耗。边缘 AI 还有另一个分支，大概是微瓦级，这正是我们接下来要拍的内容。如果你正在看直播，请继续关注，因为下周的内容大概也会像这期一样，前提是一切都按我预想的顺序进行。也可能不会。谁知道呢？但还是请继续关注，因为我们肯定还会有

更多内容。谢谢你，Sally。谢谢。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=K_0xp41Q_jk
- 来源：YouTube·TechTechPotato
- 发布时间：2026-09-20
- 行业：算力芯片
- 公司：Axelera AI,Kinara,NXP,EdgeCortix,MemryX,SiMa.ai,STMicroelectronics,Amazon
- 归档时间：2026-10-09T09:02:17.224Z

---

- 链接：https://www.youtube.com/watch?v=K_0xp41Q_jk
- 频道：TechTechPotato
- 发布日期：2026-09-21
- 时长：32分23秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

Edge AI doesn't need a data center - it's already running in retail stores, laptops, and microcontrollers all around you. In part two of this edge AI deep-dive, Ian Cutress and Sally Ward-Foxton go off-script to talk through seven chip companies - Axelera AI, Kalray, Kinara, EdgeCortix, MemryX, SiMa.ai, and STMicroelectronics - covering funding, form factors, and go-to-market strategy. They also revisit the (mostly misunderstood) Amazon Go AI story and tease next week's episode on microwatt-scale edge silicon.

[00:00] Intro
[00:41] This episode's sponsor, Arteris
[01:06] Axelera AI Metis
[05:57] Kinara AR2
[11:44] EdgeCortix Sakura 2
[16:15] MemryX MX3
[23:11] SiMa.ai Modalix
[26:49] STMicroelectronics Neural-ART
[31:44] Next episode: microwatt AI

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

#techtechpotato #EdgeAI #AIHardware #AIChips #Semiconductors #RISCV #NPU #TechPodcast #AIHardwareShow #EETimes #STMicroelectronics
------------
More Than Moore, as with other research and analyst firms, provides or has provided paid research, analysis, advising, or consulting to many high-tech companies in the industry, which may include advertising on the More Than Moore newsletter or TechTechPotato YouTube channel and related social media. The companies that fall under this banner include AMD, Applied Materials, Arm, Armari, ASM, Ayar Labs, Baidu, Bolt Graphics, Dialectica, Facebook, GLG, Guidepoint, IBM, Impala, Infineon, Intel, Kuehne+Nagel, Lattice Semi, Linode, MediaTek, NeuReality, NextSilicon, NordPass, NVIDIA, ProteanTecs, Qualcomm, Recogni, SiFive, SIG, SiTime, Supermicro, Synopsys, Tenstorrent, Third Bridge, TSMC, Untether AI, Ventana Micro.

## 全文

Hello everyone and welcome to another episode of the AI Hardware Show.  I'm Ian Cutress from more than more, and I'm joined, as always, by Sally Wood Foxton from EE Times. This is the second part of our two-part episode.  In the first part, which is more like a news format, we will tell you some facts and figures about each company, each chip that we will talk about.  In this second part of the episode, it's more of a free form discussion or conversation about some of the things that companies offer. And in this episode, we'll focus on edge AI. Peripheral. On the periphery. Definitely on the periphery.  This episode of the AI ​​Hardware Show is brought to you by Arteris, a company built by

engineers for engineers.  Every line of their IP networking and automation software reflects deep research and development focused on solving the most challenging challenges in chip design. Arteris gives engineers the tools to create faster, more efficient silicon, and they're hiring people who want to work at this frontier.  If you're interested, find out more later in this episode. So, first on our list of adapter companies is one that we know, you both know quite a bit about, Xcelerator. Hmm. Xcelerator AI.  And, uh, they've been showcasing their Metis chip at events for, I mean, two, two and a half years now. Yes. They're kind of like a vision processing device, uh, low

power consumption, designed for watts. Yes.  This is a RISC-V based design.  Er, digital calculations in memory. Uh, I think one of the most interesting things about Xcelerator, I think, is that it's a great technology, and I've seen the demos, and I'm sure it's brilliant, but one of the things about Xcelerator is that it's a European company , and they're very focused on Europe.  It's also about technological sovereignty a bit in Europe, that's also a major topic.  So I always see them in the US . Yes, they are very aggressive.  And I thought, you know, if you talk to Fabrizio, the CEO, one of his ideas is that European companies should be as aggressive as American companies.  Um, and we

should try to create ambitious companies that attract venture capital investment.  Where in Europe is this scene completely different?  It is much smaller.    Is there much less money in Europe than in the US?  Is there an artificial intelligence unicorn?    Uh , in Europe? The closest thing to this might be Graphcore. Oh, true.  Yes. But they have apparently already left the market. Yes, Graphcore raised 700 million and was apparently valued as a unicorn.  This is true. But other than that, yes.  Uh , no, he's right. This is us...I mean the hub for AI companies is...I'll see a few around Bristol. Yes. Just based on that, uh, I guess, is n't XMOS based there as well? This is true.

Uh, but then we also have some, uh, like in the Netherlands, in this region, and also in Germany. Serbia is a major software hub for many of the companies we talked about.    We also see several new projects in Spain.  Small teams run the risk of developing five-type projects. Um, yes, that's another area that I think we should pay attention to.  But yeah, um, for Accelera, I think the last time I talked to them, they were talking about participating in this really big European project called Dare , which is to build a European supercomputer. Good. European silicon in this big supercomputer they're going to make.  And Accelera, um, is developing AI chiplets for this. Okay, yes, because

Accelera has always been one of those companies that hasn't limited itself to one form factor for its silicon.  You can get it on, um, SBC systems, you know, um, small form factor PCs.  You can get it on m.2 modules, you can get it on PCIe cards, and they will scale it and install it on whatever you want, whatever you need.  Hmm, they've never really done anything like, uh, a developer kit that's public in the same way, right? I think so. OK. Hmm, I think they have a developer kit that you can buy and they're trying to support a number of customers or a number of... Yeah.  And yeah, I think the last time I saw them was at CES, uh, with a lot of their, yeah, visualization demos.  Uh, it

feels like they have a hard time just getting their name out there, getting their name out there, being part of the conversation. Yes.  Uh, making sure people know they are an option in this market.  However, since Metis is their first chip, they are also talking about their next generation, this thing called Titania. So they should talk about it .  Yes, it's time to, uh, hear more about it . Yeah, uh, but right now, you know, they're focused on, uh, 8- bit maximums, but they're trying to provide the equivalent of 32-bit precision. Yes, they use mixed precision in hardware for this. Yes.  Hmm, yes, I have it here too.  Yes, the Netherlands, $120 million in funding,

including Samsung, uh, and the European Union, which gave the company $66 million in grants.  You know, it goes to this supercomputer.    A kind of sovereign AI.  Hmm, that, I think, yes, it will be increasingly important in the future. Well, I mean, it's so, so sovereign, it's wonderful.  This is, uh, one of the companies that we didn't talk about on the podcast, like Kalray, a French company.  They made a big fuss about their chip being, uh, designed in France.  Uh, it's obviously made in France, but then he, uh, you know, comes and inserts it into a system that's built in France with the participation of a lot of French people, just to, uh, you know, just to say that it's as much of a

homegrown thing as possible . As far as possible. Yes, at the moment there are few countries in the world that can produce their own advanced chips. Everyone else only needs parts of the chain, but you want to have as many parts as possible in your company, I think.  In my country, I think. So, next up is a company that could be in our first episode of the season, in one of the episodes we did it, assuming it would be in the order that I thought it would come out. Hmm, it was all about the exits, and, um, good or bad, Kinara. So we had more to say about Kinara than what they came out with, and that's why we included them there .  So Kinara, um, had a very successful exit, it

was sold to NXP, I think, for $300 million or something like that. So this is a very successful exit for a venture capital-led company.  Hmm, and yes, congratulations. Yeah, I don't have in my notes how much they raised, but they're working on their second- generation silicon.  This is Ara 2. So, Kinara Ara. So, they had the Ara 1, which was more vision-oriented, and then they had the Ara 2, which is designed for LLM on the edge.  So Kinara is always, um, certainly, in my opinion, very directly competing with Halo.  Good. And it's something like 1-2 watts. So, a small 1-2W LLM into some device or user interface for something. Yes. Hmm, is this the perfect place for them?

Yes, I have it here, yes, this chip is already in mass production .  AI assistants, smart retail, gaming, industrial automation, and IoT PCs.  Hmm, and also, I mean, it's interesting.  I have a deployment here of hyperscale devices for shelf monitoring and analytics at the edge. Yeah, so we assume it was, um, we assume it was Amazon Go or something like that.  I don't know who else has an app like this, but yeah, basically a camera watches you take things off the shelf, put them in a cart, and then charges you . Also, yes, yes, yes, that's why I didn't think about it .  I was thinking more, hmm, actually in the data center, where they do additional monitoring.  Hmm, you mean

monitoring servers and people walking back and forth, etc. Shopping, um, for retail, um, a smart retail app.  That is, you watch yourself take fruit from the shelf and how much you took, and then you just, um, walk out with the groceries.  Wasn't there a big story about how it wasn't actually done with artificial intelligence? Yeah, I'm not entirely sure how true that is because I know of several companies that have claimed that their equipment is used in such applications. Well, I mean, is it worth mentioning how many Amazon Amazon Go, Amazon Fresh stores there are in the world?  There are several hundred of them, right? I don't know. Right.  That's right, and many of them still

exist, right? This technology is still in use today, and the story was that about a thousand employees from India were working on AI, which led to the meme that AI actually means "Indians."    The thing is, you can't have a thousand people controlling a few hundred stores.  They were essentially testing whether the equipment was actually responding correctly. Yes. Hmm, and that's just like anyone checking LLM for reliable data.  This was simply to make sure the machine vision processor was quality controlling, and it was feeding that data back into the retraining model. It was a huge scandal, and everyone blew it up because it wasn't 100 percent true.  The thing is, for most

transactions, this was the case. Yes.    It 's just that you have to check from time to time, just like quality control. I mean quality control with chips from the production line. Yes. Um, you know, if you're a drug manufacturer, you need to test the quality of your drugs, uh , take some of the drugs out of your, uh, light bulbs. Yes, whatever it is. Yes, that's how it is, and it was a shame that this story somehow damaged smart retail. Because honestly, if we're talking about the use of machine learning and its direct relevance to you, me as a consumer, as an individual, smart retail is a big concept. Definitely. And Amazon already, uh, you know, they already do this online with your

shopping habits, so why not do it in- store? Yes. Something like that. Yeah, I mean, I think Kinara, for Kinara's purposes, when this smart retail app came out , uh, they never said it was Amazon, and they never said the customer's name .  Uh, we're just assuming at this point that it was Amazon, but not some, not some Japanese guy, you know. Yes, again, yes, we don't know.  Um, that was huge proof that they had a paying customer and proof that their software stack was working as well.  It was at that stage of the company's development. So it was a really big deal. Well, that's one way to acquire it. Tell people you have a big client. Kinara has been

working closely with NXP for a long time, and they were demonstrating use cases with NXP a year or two ago, maybe even more, where they're actually offloading things from ... For example, you have the i.MX 95, which we'll talk about in another episode.  If the workload is too heavy for this chip , you can simply connect a Kinara Ara 1 or Ara 2 and it will offload the excessive AI workload. But then you have to use all the software for that to work together, and they had to demonstrate how it worked together, which worked.  So when I talked to NXP about this, they were a little dubious about whether this was a deciding factor in why they acquired Kinara.  But from my

perspective, it seemed like an obvious choice, given that there was a certain level of entry, like it worked. This was some proof. And NXP is everywhere. NXP yes, absolutely everywhere, in all kinds of applications.  They are one of the largest chip manufacturing companies in the world. So Kinara seems to have said they will keep Kinara silicon separate for now.  They're not going to try to bring intellectual property into an NXP product like they did with the IMX 95 or something, but it seems they haven't ruled out whether they might do so in the future. Hmm.  This will be an issue to watch to see if they talk about it. Will NXP talk about this? Yes, yes, I hope they do. One thing we didn't

touch on much in this episode was silicon from Japan. Truth. But there is one company that we are definitely tracking, and that is Edge Cortix.  Cortix.  I don't want to say Cortex.  I'm thinking about Crash Bandicoot. No, it's Cort...it's Cortix. Cortix as in cortical, yes.  Um, and Sakura 2. And we seem to have looked at Sakura 1 in the 23rd. Yes, in our previous, um, season, but they have Sakura 2, which is essentially the next generation of their dynamic neural accelerator.  Um, Sally and I were discussing right before we started filming what exactly this architecture was. Yes, unfortunately I do n't have many details on this.  Um, so I've spoken to the company a few times over the

years.  Um, I haven't been able to understand exactly how the architecture works or its intricacies.  So, yeah, maybe I'll continue to work with them to figure this out. But as far as we know, it is a reconfigurable fabric at runtime.  That's what they said. This is what we know. So, it sounds kind of like this - it sounds like something like an efficient E1 that would be in an ultra-low power episode on the edge.  Or something like the following silicon question that we included in our, uh, because it can be reconfigured at runtime. Yes.  The idea is that if you can adapt to the workload, you can put more resources into it.  Although , looking back at my research notes

, the way I wrote about it almost sounds like a variable VLIV. Hmm.    A very long word of instructions.  Um, so this is obviously where you can pack multiple, uh, calculations into a single instruction.  Um, but it seemed like you could if you only needed 16 elements, but if you needed 1024, it wasn't obvious from my notes whether you could have, you know, 16 lots of 16, which would make it, you know, essentially just a massive VLIV engine.  So, is this reconfigurable in the sense of data flow, or is this reconfigurable simply in the sense of variable VLIV.  Um, I wasn't sure.  And, uh, you say you've been talking to them for years.  Do you turn to them, or do they turn

to you when they have something to say? both.  Hmm, it's definitely a bit of both .  Hmm, but yes, I would like to know more about this company.  I think one of the things that stands out to me the most is that they have a lot, or a few, um, defense and space contracts . They don't want to talk about it .  Maybe not, but they came out. It's a Japanese company, but it seems they had space contracts even in other regions, so ... Yeah, I have notes here about one chip under 10 watts or two chips around 20. Hmm, and with an 80% utilization rate, that's hot.  It's strange to think about using it on the periphery. Yes, that's right.  We usually talk about this in the context of

data centers, I think.  And how effective it can be for large amounts of data. Besides, 10...10-20W is more suitable for an appliance than a peripheral, right? This is the thing you put in your retail store that does machine learning on your cameras. But it's not a battery. It is connected. It's connected, yes. Yes.  So it's like... It's like a mini-server type device on the edge. That's right, yes. Yes, so it can fit there too.  Yes. The definition of periphery depends on who you ask. That's right.  Maybe we should do a show where we just define the periphery, define neuromorphism, define all these themes that... Oh, that would be the most controversial episode. You would receive many

letters about this . Letters? Yes, you know what I mean. Mailbox? Comments. Comments.  At today's sponsor, Arteris, engineering innovation never stops.  Their teams are developing the next generation of networking software and integration that brings everything together within a modern SOC.  Through continuous research and development, they automate chip design, improve performance, and reduce time to market for customers in artificial intelligence, automotive, and data centers.  Arteris engineers work on technologies that connect CPUs , GPUs, and accelerators in the most complex silicon systems, using the latest design tools and advanced verification methods. The company works closely with

global leaders such as AMD, Cadence, Synopsys and Renesas to set new standards in system design integration.  If you want to join the team shaping the future of silicon , explore current opportunities and learn more at arteris.com.  We talked about companies offering different form factors.  Hmm, MemoryX, which, um, is headed, it seems, by Keith Kressin , a former Intel employee.  Hmm, he...This company first came onto my radar because Lenovo told me about them . Because they did a demo with Lenovo, or they installed it in a laptop or something. So one of the arguments for all these AI chips is that if they're the right size, shape, and power consumption, they can be placed on an

M.2 module.  And you know, M.2 modules can technically have a maximum of 25 watts, although in reality most SSDs have a power of five to seven watts.  Usually that's how much goes into M.2.  Hmm, because in most cases it needs to be done without any physical cooling on top, or maybe it's just a thin heatsink.  So with devices, especially desktops, that now have three, four, five M.2 slots, or even the latest ... some laptops, you know, have two or three, depending on their size or form factor, if you can put an AI chip in there , because I remember Intel saying they should do that a long time ago with their neural processor, instead of cutting out a separate slot on your processor or

some other part of the motherboard for the GPU, like in laptops, put it in the M.2 slot.  So when Lenovo came out and said, " Hey, we have a laptop with, or I think in their case it was a mini PC with a Memory X MR3 chip."  It was, I think, CES 24. Okay.    He turned around and said: " You know, come over and take a look."  We have an AI chip from an AI startup , not a big player, not Nvidia, not AMD.”  And you're like, "Wait, what?" Yes, he says, “What’s up, one startup, hello. What is going on here? Second, Lenovo, hello.  Yes.  I worked with Lenovo as a journalist for a while. Not exactly the last 5 years or so .  But for me, they always...their design team always likes to create

almost finished products.  OK. Um, and many, many different form factors, many...and it's not spaghetti on the wall, let's see what sticks, because a lot of it is actually well thought out. OK.  Um, some people might disagree depending on your recent BIOS updates or something.  But for them to say, " Hey, we're collaborating with...I mean, there was another player in the AI ​​space .  Um, another AI startup, they also had another M.2 module.  Um, but yeah, no, it's again about showing superiority.  "Give the device more access to more, um, opportunities to run language models."  I mean, at the time it was, well, you know, around the beginning of Lama 3, maybe even Lama 2. So we're

looking at, you know, something like 7 billion parameter models.  Um, about that.  But, I mean, this chip supports, you know, variable precision up to four bits.  Well, yes, this might be one of the first consumer chips that we make four-bit. Yes, I saw it recently on EnCharge. Yes. They are relatively new to the market compared to Memory X. Yes.  So there's, you know, built-in memory with function maps, well, multiplication and accumulation, like kernels for matrix operations, standard ALCs for more sequential operations .  So it looks like it covers a good portion of what would be a transformer base.  You need a close, fast memory.  You need good consistent performance for operators.  You

need good parallel performance for matrix-matrix operations.  Um, and the software stack... So, I have to apologize if anyone from Memory X is watching , um, because you guys turned around, I wanted to say, the second week of January of this year, and said, "It's summer now."  It's summer while we're recording this."  But they came back and said, would you like to do a review of our artificial intelligence accelerator?  I know you don't do equipment reviews. I don't, but my experience is in reviewing hardware processors and other things.  Reviewing AI hardware is a minefield because you can get one check mark wrong in your compiler. Of course.  Yes. And lose half of your

productivity.  Everyone complains that you're not using the latest version of this or that.  And also, for the most part, I don't do reviews anymore.  I would love to have one to look at, and yes.  I think you can talk about architecture.  So, one on M.2.  No, you can just buy one on Amazon.    That's the thing.  You can't . Or maybe you can't here . Oh, maybe.  This is true. This could be a regional problem.  Hmm, but yeah , maybe I should dig up that letter, ping it, and say, " Write back." Because I actually added Keith on LinkedIn about a month ago.  I didn't forget, but I didn't tell you I saw it.  So yeah, um, it's like, I think if more companies in the same, you know, 5- watt range

were offering AI chips on an M.2 module, um, or as a PCI card, just like , you know, Tenstorrent offers theirs or others .  As long as you make it clear that they are available, you know, other developers will definitely pick them up. You can create a community. Yes. It depends on whether you want to create a community, I guess, or what.    Is this one of your priorities, and how big is your startup?  Hmm, because having a community is one thing, but supporting that community is also... My argument is to create it without any support. I think that's...That's...That's ... That's true.  I, um, left a few Discord servers from certain companies because I felt like it was n't right, but it also

felt like some of them, um, didn't really demonstrate that they had a community. Yes, okay. Right?  The first button in your community should be " join our forum", " our Discord", not write us emails, etc. Yeah, I mean, you know, the community is great, and you get all this feedback about, here are all these bugs in your software and so on, but then you really need to act on them and do something about it. Some startups are simply not set up for this level of feedback. But do you want the bug still in your software 3 years from now when it is deployed to a customer? This is one of those times where you have to be careful what you wish for, I guess. Well, yes.  Especially

if it's a mistake, right ?  I would prefer that they find a critical bug before, you know, 10,000 units end up in Lenovo PCs. We're not talking about memory access, which... No, no, no.  Just in general, with the community.  So, we also talked a little bit about SiMa... Yeah. AI.  We looked at them in the previous series, MLSoC, but they also have a new design called Mod...Yeah, it's annoying because they have MLSoC, and now they have Modilex, yeah, MLSoC, which is the second generation... Which is the second generation of MLSoC.  Yeah, they just give it the name, I think, Modilex, to distinguish it from the first one, which isn't really... Contact me, companies.  I help you with your

marketing. With your name. With your name. Modilex—actually not such a bad name because it is multimodal with the changes they made. This is normal.  It just has MLSoC in it. Yes, okay.  So, I think the SOC part is also quite important in distinguishing it. This is not a separate accelerator.  There's a bunch of ARM cores, there's DSP, there's all sorts of things to run a whole program, basically , not just an ML accelerator.  So this applies to robots and things that need to run everything on one program - the entire program on one chip. Yeah, I mean, just looking at my notes, a 16- nanometer chip, so yeah, pretty advanced , advanced, advanced.  Yes, that sounds about right.  But

the maximum is 50, which makes it eligible for Microsoft Co-pilot, but it obviously doesn't .  Yes, A76 A65 cores, as well as a Synopsys machine vision processor. Yes. Um, these are specialized video codecs for the machine vision processor. So this time they also added MIPI.  Yeah, they added a bunch of things for machine vision, like MIPI and... did a bunch of things in the machine vision pipeline.  They also added an internet provider, if I remember correctly. Hmm. Um, but they also added floating point support, which is better for transformers.  Um, yeah, they made a bunch of changes to the hardware, and again, you can watch the news version of the podcast or read about it on

eetimes.com.  Um, yes, it's SOC. Their software history has always been very strong. They went with a big, one-click approach from the beginning, and then it all went straight down to the hardware. Which was a really important event at the time.  More and more companies are now starting to offer this type of mature toolchain, but it feels like this is an area where they have always been ahead of the competition. Em. Um, what else?  Oh yeah, they recently, um, made some kind of deal with Synopsys where they're going to try to offer SimAI's automotive intellectual property to people who are developing automotive chips using Synopsys' tools. Um, so when I told them, this partnership was still

being discussed in vague terms, who would license it to whom and how exactly it would work, um, in terms of tools.  But yeah , this could be a really strong partnership for them.  This could be a really interesting new market for them. But yeah, that means it's another vote of confidence, right?  That means it works.    I have in my notes that they also provided MLPerf results. Yes, yes, they did it.  Um, and they are very proud of that fact.  And they got great, ahem, energy efficiency results, so be sure to check them out too. They're interesting compared to, um, Jetson NX, which is a popular platform for edge development. Yes, the GPU is on the periphery. Graphics processor

on the periphery. Yes, they are one of the few who can say that at least in some dimensions we have surpassed Nvidia in MLPerf , which not many companies can say, so congratulations. In terms of funding, 330 million, which is a huge amount for a company with advanced AI, frankly, including 230 million in Series B. Hmm, just so you know, having a second-rate second-generation chip while being a Series B is pretty cool.  That's pretty cool. Be sure to keep this in mind.  Next up is STMicro, you know, a big player in this industry. They have, uh, neural art. Yes, they call it neural art.  Yes, it's ST, yes, a European company , so it's kind of French and Italian, a lot of French

and Italian people. Yes, neural art is the name they came up with for their neural processor.  Hmm, so they've been talking about launching this neural processor-powered smart controller for a very long time .  Um, and I think it's something that they have one of the largest, meaning most widespread, microcontroller series in the world.  So I don't know how many millions or billions of these microcontrollers are deployed in every single thing, every type of device you can imagine , from home appliances to larger things.  So, modems. Absolutely everything, but this series, STM32, is known worldwide as...yes, yes, as a very popular microcontroller.  So they took a high-end microcontroller from

that series and then added this neural processor next to it so that it had powerful AI potential. They didn't tell us much about the accelerator itself.  But the fact that it is now in the STM32 ecosystem, where there are already trillions of developers working on it, is already very well known.  There is an obvious path to renewal.  They acquired a time series software development company and they...Yes, the software tool chain is mature.  Hmm, they actually did a really good job, and they always sent MLPerf results when they were working on tinyML, hmm, then on MLPerf.  They really... There was also one of the things, I think, that indicated the maturity of this toolchain: when

they were working on MLPerf, a lot of the people who were demonstrating the inference engines and the software solutions were doing it on the STM32 because their toolchain works so, so well, right?  I think it was a huge vote of confidence for them as well.  But yeah, this is something that will be deployed anywhere and everywhere, so...But yeah, this is, um, okay, what else can I say?  This is less than a vertex, less than one vertex.  Uh, it's a relatively small NPU .  So it doesn't...I have 600 giga operations in my notes. 600 gigaoperations. 600 times more than any other STM32 microcontroller. That's right.  So it all depends on scale, as if everything is relative.  Hmm, so for

STM, it's the STM32 series for us , hmm, it's really powerful. Yes, it also says that they have some computer vision pipelines right inside.  So, JPEG H.264 bandwidth support, and then 2 1/2 D and 2D GPUs for, you know, graphics pipelines.  So it sounds less and less like a microcontroller and more and more like an artificial intelligence accelerator, essentially. So, these are small vision programs, yes. Yeah, yeah, the fact that this is, you know, a path of renewal for a lot of places.  This, you know, this comes down to the argument, you know, do we really need to deploy AI everywhere? Have accelerators everywhere?  Hmm, but for some of these things, the cost of silicon is

so insignificant. Yes, just to get the potential of using something ... Yes. Um, that makes sense, and, you know , one of the best ways to do that is to use one of the most popular chip designs. That's the way that everyone uses, and yeah, you talked about having, you know, Synopsys IP and whatever, you know, STMicroelectronics has been in this business for years. So I expect this to be available in all good EDA stores soon. Yes. Does EDA have something like a Play Store? Uh, or the Apple Store? They have their own ecosystems, right? No, no, no, I know, but you just choose what you want. Oh, I understand.  If only it were that simple, right? Yes.  But there are always a lot of leading

players when we talk to you and say, you know, we track somewhere over 150 companies at the moment.  Um, so many of them play at about 1 watt watt plus or minus order of magnitude. Ahem. Um, because there are so many small niche markets they can tap into .  So, a small player can succeed. Absolutely.  Hmm, you don't need as much investment to be a startup building a small chip as you do to build a big chip for a data center.  And if you're going to work in one niche, you don't need such a complex tool chain.  You don't just need all sorts of models. For example, it is much easier for a small company to do this.  So, yes, as much as I expect to see more niches, even more niches coming to

market, and more chip companies emerging in each niche.  This is definitely a growing industry, and I'm actively following it. So it's a niche for Americans. So we mean niche.  We mean niche.  We mean niche. So, I mean, we're looking at you.  This episode was about 1 W plus or minus an order of magnitude.  There's another branch of edge AI, and it's something like micro W, and that's what we're actually going to be shooting next.  So if you're watching this live, stay tuned, because next week it's going to be , you know, pretty much like this, assuming everything comes out in the order that I think it will.  Maybe not .  Who knows?  But stay tuned anyway, because we'll definitely have

more.  Thank you, Sally. Thank you.
