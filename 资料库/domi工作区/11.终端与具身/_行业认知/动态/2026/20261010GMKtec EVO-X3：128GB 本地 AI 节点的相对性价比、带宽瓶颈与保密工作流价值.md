<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_34498075cdc5942a"
title: "GMKtec EVO-X3：128GB 本地 AI 节点的相对性价比、带宽瓶颈与保密工作流价值"
domains: ["终端与具身","算力芯片","互联与网络","模型层","应用"]
subdomains: ["AI终端与硬件","CPU与通用处理器","AI加速器与GPU","存储芯片与HBM","铜连接与线缆","网络架构与组网","开源与开放权重模型","企业应用与生产力","垂直行业应用"]
types: ["行业认知","视频"]
companies: "GMKtec；AMD；Apple；NVIDIA；Microsoft；MediaTek；MicroEnter（视频赞助商，字幕另有 Microenter、Microsenter 等拼写）；Marll、Realtech（网络适配器相关名称，按未经人工校对的字幕保留）"
published_at: "2026-10-10T01:40:18.425Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=-nZiqOh-vEw"
source: "YouTube·ServeTheHome"
---

# GMKtec EVO-X3：128GB 本地 AI 节点的相对性价比、带宽瓶颈与保密工作流价值

## 行业认知文章

- 行业：终端与具身、算力芯片、互联与网络、模型层、应用
- 公司：GMKtec；AMD；Apple；NVIDIA；Microsoft；MediaTek；MicroEnter（视频赞助商，字幕另有 Microenter、Microsenter 等拼写）；Marll、Realtech（网络适配器相关名称，按未经人工校对的字幕保留）
- 来源：YouTube·ServeTheHome · [原文链接](https://www.youtube.com/watch?v=-nZiqOh-vEw)
- 发布时间：2026-10-10
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
ServeTheHome 的 Patrick 评测了搭载 AMD Ryzen AI Max Plus 395、128GB 内存和 2TB 或 4TB NVMe 固态硬盘的 GMKtec EVO-X3。作者认为，在其所述的 2026 年 10 月内存及同类整机价格环境下，这款约 3,599—3,799 美元的设备具有一定相对性价比，主要价值在于以较低功耗承载本地开放权重模型，并通过 Oculink 扩展独立显卡。EVO-X3 与 EVO-X2 虽然采用相同处理器，但主板、机箱、散热及接口设计存在明显差异；作者认可新平台的整体设计，同时批评其仍只有 2.5GbE、USB 接口偏少且取消了 DisplayPort。
全文后半段进一步讨论了容量与速度的区别：128GB 内存有利于容纳较大模型，但约 250 多 GB/s 的内存带宽会限制生成阶段速度；作者认为约 1,200 亿参数的混合专家模型适合这类平台，但未交代具体模型、量化精度或测试结果。作者将本地 AI 的商业价值归结为数据留在组织内部，以及在保密和生产力工作流中节约时间。上述判断主要来自评测观察和个人观点，原文未提供完整性能表、业务效果测算或保密协议条款分析。
来源为 https://www.youtube.com/watch?v=-nZiqOh-vEw，标注时长 1,196 秒，提供字幕覆盖至 [19:55]。字幕未经人工校对，部分公司、产品名称及价格存在识别疑点；本文保留这些不确定性。视频披露由 MicroEnter 赞助，赞助商名称在字幕中另有拼写变体。

### 论点1：EVO-X3 的绝对售价较高，但作者认为其在录制时的同类 128GB 设备价格环境中具有相对性价比。
**相应论据：**[0:58—1:22] 作者强调，从开始测试、编辑到录制期间，EVO-X3 和竞争产品的价格都发生了变化；EVO-X3 当时约为 3,599—3,799 美元，并希望录制至发布的未来 48 小时内价格保持在该区间。[1:24—2:00] 作者称，若在评测 EVO-X2 时听到约 3,800 美元会觉得很贵，但其购买的 MacBook Pro 在到货两周后涨价，现价约 7,500 美元；作者解释 Apple 需要在内存、固态硬盘等成本之上获得利润。[2:03—2:32] 字幕谈及 NVIDIA DGX Spark 时出现“$49.99”和此前“$39.99”的金额，同时又称现在的 128GB 版本接近 7,000 美元；N1X 系统中的 Microsoft Surface Ultra，128GB 版本约在 5,500 美元区间。这些名称和金额均未经人工校对，DGX Spark 的金额不能据此擅自统一或补零。[3:25—3:33] 作者明确将比较置于“2026 年 10 月”的价格环境。[19:26—19:39] 作者称其团队经常采购内存、持续感受到 AI 带来的价格上涨，并强调这不是 500 或 1,000 美元的迷你电脑。
**相应论证：**作者通过同时期高内存容量设备的价格比较，解释为何同样约 3,800 美元的售价在不同市场环境下会得到不同评价，并以其内存采购经历支持成本压力的判断。原文没有给出各竞争设备的完整配置、统一报价来源或价格历史，也没有分解 EVO-X3 成本；Apple 利润需求及 AI 导致涨价的具体因果机制，原文未展开论证。该结论应保留为作者录制时的相对价格判断。

### 论点2：128GB 容量与较高内存带宽的组合是 EVO-X3 的主要购买价值，但传统家庭实验室负载与 AI 负载应采用不同的内存成本判断。
**相应论据：**[2:43—3:02] 作者举例称，64GB DDR5-6400 模组的价格此前约为 2,000 美元，现在在 eBay 上约为 2,700 美元，并提到合计 5,400 美元的内存采购成本；字幕把模组类型写为“ECCR DIMs”，具体类型未经核验。[3:02—3:23] 对家庭实验室，尤其传统虚拟机基础设施，作者通常建议条件允许时采用 DDR4；对于 AI，内存带宽是挑战，但从容量看，EVO-X3 是以这一带宽水平获得 128GB 整机的低成本方式之一。[13:16—13:29] 作者认为，买家支付这一价格购买 128GB 内存，主要是为了运行本地 AI，而非游戏或 Microsoft Word 等普通用途。
**相应论证：**作者区分了以容量和成本为主要考虑的传统虚拟机负载，以及需要兼顾容量与带宽的 AI 负载，从而解释为何便宜的 DDR4 方案与 EVO-X3 可以分别适合不同需求。原文未提供 DDR4 与该平台在相同任务下的性能或总成本比较，服务器内存模组价格也不能直接等同于整机内置内存成本。

### 论点3：EVO-X3 与 EVO-X2 采用相同处理器，并不意味着它们是同一平台；新产品进行了明显的主板、机箱和散热设计调整。
**相应论据：**[0:23—0:56] 作者介绍 EVO-X3，并回顾此前采用 AMD Ryzen AI Max Plus 395、别名“Stricks Halo”的 EVO-X2；该别名按字幕拼写保留。[3:40—4:25] EVO-X3 可以通过底部两个螺丝安装支架、竖直放置，外观与 EVO-X2 明显不同；作者强调两者主板和部分功能不同。[4:43—5:06] 机箱多个位置布置通风口，侧面主要用于散热，这也是外形变化的原因之一。[9:12—9:40] 拆机后可见较大比例的机箱空间用于散热，侧面有大风扇和热管；作者认为主板形态类似笔记本电脑主板，并推测 GMKtec 为这一散热器和机箱形态投入了较多设计工作。
**相应论证：**作者以实际外观、主板和散热布局的差异，反驳仅凭处理器相同就把两代产品视为完全相同系统的判断。关于外观更好、设计投入更大的评价属于观察和主观判断，原文没有给出研发投入、温度或噪声数据。

### 论点4：仅配备 2.5GbE 是 EVO-X3 的重要短板，尤其会限制依赖网络存储的本地 AI 节点。
**相应论据：**[5:17—5:46] EVO-X3 仍只有一个 2.5GbE 接口。作者认为，较晚推出的这一代产品应该升级到 10GbE，并提到 AMD Ryzen AI Halo 有 10GbE、其他见过的方案有两个 10GbE 接口。[5:47—6:05] 作者设想用户运行 AI 模型、传输游戏等文件，或因本地存储昂贵而把内容放到网络附加存储设备；在这些情况下，2.5GbE 会成为网络传输瓶颈。[15:10—15:14] 作者再次提出 2026 年的该类平台应有 10GbE。[16:01—16:13] 作者批评一台超过 3,500 美元、可作为服务器使用的设备仍只有 2.5GbE。
**相应论证：**作者将高速网络需求与通过网络附加存储扩展容量的使用方式联系起来：当模型或其他文件需要经网络传输时，本机存储和内存能力不能消除低速网络接口的限制。原文没有提供网络吞吐、模型加载耗时或实际存储节约数据，因此瓶颈的具体严重程度仍取决于文件规模和访问方式。

### 论点5：减少 USB 和显示接口可能符合本地 AI 服务器用途，但会降低通用性，并使外接高速网络的补救方案产生接口占用。
**相应论据：**[4:27—4:42] 前面有两个 USB Type-A 接口，其中一个为 USB 3、一个为 USB 2，另有音频接口。[6:08—6:39] 作者提出可以用 USB 10GbE 适配器，并提及此前评测的“Marll AQC 1113”和“Realtech RTL 8159”方案，名称及型号按字幕保留；但后面只有一个 USB Type-C／USB4 接口，接入网络适配器后就不能同时用于其他设备，此外还有一个 Type-A 接口。[6:41—6:55] 后面有 HDMI，取消了 EVO-X2 的 DisplayPort。[15:15—16:01] 作者猜测 GMKtec 可能发现用户通常只接一两台显示器和较少外设，因此将产品重点转向服务器；评测中的设备运行 Ubuntu，用作本地大语言模型服务器。[12:29—12:46] 作者还提到有人建议用内部 M.2 接口接 10GbE 适配器并切割机箱，但他不推荐这种做法。
**相应论证：**作者认为，减少显示和外设接口可以与本地 AI 服务器的使用定位相容，但缺少原生 10GbE 又削弱了这一定位的完整性。USB 网络适配器虽能补足网络速度，却占用唯一的 USB4 接口；内部 M.2 改造则增加安装复杂度。关于厂商依据用户连接习惯决定接口配置的说法明确属于作者猜测，原文未提供用户调查或厂商说明。

### 论点6：Oculink 是 EVO-X3 的突出差异化功能，可以将大容量集成平台与外接独立显卡结合。
**相应论据：**[0:11—0:17] 视频开头指出，设备除 USB4 外还提供 Oculink，可以连接独立显卡。[6:58—7:02] Oculink 位于直流电源输入旁。[7:43—7:55] 作者称团队实际尝试过通过 Oculink 连接显卡扩展坞，接通电源后能够使用外接显卡。[7:58—8:35] 作者提出，大模型可以利用主平台的 128GB 内存容纳，速度可能较慢；较小模型若需要更快运行，可交给外接独立显卡。[8:36—8:54] 作者认为也可以接 5080、5090 等显卡玩游戏，但不认为这种高端外接显卡游戏用途是该平台的理想定位，更倾向于用于 AI。[16:13—16:16] 作者在总结中再次将 Oculink 视为突出功能。
**相应论证：**作者把模型容量与推理速度需求分开：集成平台用于承载较大的模型，独立显卡用于更快运行能够装入其显存的较小模型。连接成功有实际尝试支持，但原文没有外接显卡性能、链路开销、扩展坞成本或模型调度测试，也没有证明两套内存可以合并成单一模型可用的统一容量。

### 论点7：作者认为，Oculink 在迷你电脑上的外部显卡用途，延续了其连接能力，但服务器内部连接已更多转向 MCIO。
**相应论据：**[7:02—7:30] 作者回顾称，Oculink 在 Ice Lake 一代、约 2022 年以前的服务器中较常见；从约 2022 年开始，服务器内部连接大多转向 MCIO，也存在自定义连接器。作者把原因之一归结为 Oculink 连接器较脆弱、MCIO 更好。[7:33—7:45] 作者认为，游戏公司和社区推动了将 Oculink 用作设备到外部显卡扩展坞的连接方式。
**相应论证：**作者以连接器结构可靠性解释服务器内部接口迁移，并以厂商及社区推动解释 Oculink 外接显卡用途的发展。原文未提供可靠性测试、采用率、具体服务器样本或迁移资料，这一历史判断及因果解释未进一步展开论证。

### 论点8：EVO-X3 的存储可扩展性具有实际用途，作者认为本地 AI 平台比部分普通迷你电脑更值得配置性能较好的固态硬盘。
**相应论据：**[9:42—10:04] 可维护部件包括 AMD／MediaTek Wi-Fi 7 模块和 NVMe 存储，出厂可选 2TB 或 4TB 固态硬盘。[10:06—10:25] 作者称这类系统主要使用 PCIe 第 4 代固态硬盘，并认为 EVO-X3 适合用性能更好的硬盘；与其对其他迷你电脑推荐低成本 QLC 存储的观点相比，这台设备可能更需要存储性能。[10:27—10:36] 设备预装 Windows，但团队常用 Linux，作者提出可以增加另一块固态硬盘。[12:20—12:27] 作者认为内部实际可做的扩展主要是增加存储，同时提醒当时 NAND 存储价格较高。
**相应论证：**作者将额外存储与容量扩展、不同操作系统使用需求联系起来，并据此提出采用性能较好固态硬盘的建议。原文没有报告硬盘具体型号、容量布局、读写测试或存储性能对模型任务的影响，因此更高性能硬盘的必要性，原文未展开论证。

### 论点9：EVO-X3 的处理器和内存不可升级，内部维护范围有限，而机箱拆装便利性仍可改善。
**相应论据：**[9:01—9:09] 打开面板需要拆较多螺丝，进入内部并不方便。[11:27—11:51] 作者认为 Wi-Fi 模块和 M.2 固态硬盘基本是仅有的可维护部件，希望机箱提供小型免工具维护面板。[11:52—12:06] AMD Ryzen AI Max Plus 395 和 128GB LPDDR5X 内存均焊接在主板上。[12:07—12:22] 作者预计大多数用户主要连接 USB、HDMI 或 Oculink 外设，不会频繁进行内部改装，因为除增加存储外可操作空间有限。
**相应论证：**焊接处理器和内存限定了升级边界，少量可更换部件又让大范围拆机显得不够便利，因此作者建议用局部维护面板降低存储和无线模块的维护难度。对大多数用户行为的判断属于作者预期，原文未给出维修率或使用调查。

### 论点10：较高性能模式可以提升平台表现，但相应需要更强散热；原文的性能评价主要是定性观察。
**相应论据：**[12:49—13:09] 测试主要采用较高性能模式。作者称 BIOS 中存在不同性能设置，低性能模式下片上系统功耗大约为“五十多瓦”，高性能模式约为 140W；在 140W 设置下需要更好的散热，也确实获得更多性能。[13:11—13:14] 作者评价该机的 Stricks Halo 表现较好，优于不少其他系统。[9:12—9:36] 拆机显示机箱为侧面大风扇、热管等散热部件分配了较多空间。
**相应论证：**作者把更高功耗设置、更多性能和散热设计联系起来，用来解释 EVO-X3 为什么需要较大的散热布局。原文未给出任务名称、基准成绩、温度、噪声、持续运行时间或同功耗比较，因此不能量化性能提升，也不能确认所有负载都获得相同比例的收益。

### 论点11：128GB 容量有助于承载较大模型，但约 250 多 GB/s 的内存带宽会限制生成阶段速度；作者认为约 1,200 亿参数的混合专家模型是这类平台的适用区间。
**相应论据：**[7:58—8:23] 作者承认 Stricks Halo 的内存带宽不算高，但强调 128GB 容量能够容纳较大的模型，代价可能是运行较慢。[13:33—13:46] 作者称本地 AI 使用时受到约“250 多 GB/s”内存带宽约束，解码即逐词元生成阶段通常或几乎总会受到这一数值限制。[13:47—14:11] 作者提到 AMD、NVIDIA 和 Apple 都有 128GB 设备，认为这使约 1,200 亿参数的混合专家模型形成适合此类平台的区间，并称这些模型运行效果较好。
**相应论证：**作者明确区分了能否装入模型与生成速度：容量决定模型能否承载，带宽限制其所述生成阶段的表现。约 1,200 亿参数混合专家模型适合该平台的判断，原文没有给出模型名称、量化位宽、上下文长度、系统内存占用、可用显存分配或每秒生成词元数，不能将其理解为任意精度和任意上下文条件下都能运行的承诺。

### 论点12：整机高负载功耗与日常大语言模型推理功耗不同，较低实际功耗是作者认可这类集成平台的原因之一。
**相应论据：**[14:13—14:22] 作者称曾把整机功耗推到约 160—180W，但运行大语言模型时经常更低，例如 100W 或以下。[14:23—14:37] 作者强调，运行大语言模型不代表始终满负载，也不代表一直处于 160W 或 140W；在这类平台上通常会明显低于 100W。[14:39—14:52] 作者认为，较低功耗是相对独立显卡方案的购买理由之一，但使用 GDDR7 内存的显卡在受内存带宽约束的任务上可以提供更多性能。
**相应论证：**作者根据实际运行观察，提醒读者不要把高负载整机功耗或片上系统功耗设置等同于所有推理任务的持续耗电，同时提出功耗与性能之间的取舍。原文没有交代测量位置、模型、请求强度或独立显卡对照结果，因此不能据此计算每次任务能耗、长期电费或单位吞吐能效。

### 论点13：作者总体认为 EVO-X3 优于 EVO-X2，并比 AMD Ryzen AI Halo 更便宜，但后者的原生 10GbE 会影响最终采购取舍。
**相应论据：**[15:02—15:08] 作者明确回答 EVO-X3 是比 EVO-X2 更好的平台。[15:10—15:24] 同时再次指出其缺少 10GbE、USB 接口偏少、取消 DisplayPort。[16:18—16:38] 相比 AMD Ryzen AI Halo，作者认为 EVO-X3 的优势包括 Oculink 和价格；其价格低数百美元，2TB 版本的价差更大。[16:39—16:53] 作者称选择 EVO-X3 的一个理由是更便宜，但 Ryzen AI Halo 有 10GbE；如果给 EVO-X3 购买 USB4 10GbE 适配器，价格优势还剩多少就不明确。
**相应论证：**作者的整体评价并非只依据同款处理器，而是结合平台设计、扩展能力和售价；与 Ryzen AI Halo 的比较则加入了网络功能补齐成本。原文没有给出两台设备完整同配置价格或适配器费用，因此只支持价差可能被部分抵消的判断，尚不足以确定哪台总成本更低。

### 论点14：本地 AI 与开放权重模型的核心价值之一，是在本地部署条件下减少向外部模型服务提供商发送资料的需要。
**相应论据：**[16:55—17:20] 作者认为本地 AI 出现了复兴，并赞赏开放权重模型；拥有这类系统后，可以不把数据发送给前沿模型服务商或其他模型服务商，从而避免对托管平台、数据处理及是否用于训练的不确定性。[18:03—18:16] 作者强调，相比使用其提及的云端模型，资料可以保留在本地，文档不进入云端服务商，也不会因外发而被其用于训练，理由是资料没有离开自身边界。
**相应论证：**作者把开放权重模型能够本地运行，与资料留在组织内部的工作方式联系起来，认为这可以减少对外部服务商数据处理行为的依赖。其论证成立的条件是相关处理确实全部在本地完成；原文没有核查操作系统、应用、更新或其他软件是否存在数据外传，也未说明各外部模型服务商实际的数据政策。

### 论点15：保密协议资料和律师等专业工作流，是作者认为需要本地 AI 的具体应用场景，但其协议判断未经过条款分析。
**相应论据：**[17:22—17:45] 作者举例称，若资料受保密协议约束，再把资料发送给模型服务商，“可能”违反保密协议；他进而认为，人们最终需要某种形式的本地 AI，因为这类工作流不适合把数据发到组织外部。[18:16—18:23] 作者以律师及其他不希望敏感资料外流的职业为例，强调本地处理的价值。
**相应论证：**作者从保密义务对资料接收方的限制，推导出本地处理在部分专业工作流中的用途。原文未提供任何具体保密协议条款、授权例外或法律分析，因此只能保留其“可能违反”的条件性判断；由这一场景进一步推导广泛用户都将需要本地 AI，原文未展开论证。

### 论点16：本地开放权重模型的价值不要求其能力超过前沿模型；作者认为应把模型能力与资料处理位置共同纳入选择。
**相应论据：**[17:46—18:03] 作者明确表示，不认为字幕所写的“Quen 3.6 35B A3B”优于 Opus、Fable 等模型，并称“GPT 5.6 six”更强；这些名称和版本按未经人工校对的字幕保留，不能据此确定真实型号。[18:03—18:23] 作者认为，较强的外部模型需要发送资料，而本地系统可以把资料留在自身边界内。[18:30—18:44] 作者称，从字幕所写的约 350 亿参数模型到约 1,200 亿参数范围的开放权重模型，如今已具备很强能力。
**相应论证：**作者承认能力差距，同时认为某些工作流对资料处理位置的要求，可以让较弱但能够本地运行的模型具有购买价值。原文没有提供模型评测、任务样本或成功率，“已经很有能力”及与前沿模型的强弱比较均未展开实证论证。

### 论点17：对于能够实际节省工作时间的用户，3,500—4,000 美元的本地 AI 设备可能值得购买，但这一判断取决于实际使用效果。
**相应论据：**[18:44—19:05] 作者认为，对于有业务或工作任务的部分 STH 读者与视频观众，3,500—4,000 美元虽然不便宜，但若每周能节省数小时工作，设备可能值得购买。[19:06—19:24] 作者将 AI 定价与工作效率联系起来，并提出竞争对手若使用这类能力，可能在任务上花更少时间、效率更高或完成更多工作。[19:34—19:41] 作者认为较高售价换来的是更多实际能力。
**相应论证：**作者提出一个条件性购买逻辑：如果设备能够持续完成有价值的工作并节省时间，其价值可超出普通迷你电脑的硬件用途。竞争压力进一步构成采用动机。原文没有给出具体业务任务、节约工时记录、人工审核成本、使用年限、维护成本或回收期，因此没有完成投资回报测算，也未验证竞争对手使用后的效率优势。

## 值得关注的信号

材料提示，本地 AI 整机的价值需要同时考察可用内存容量、内存带宽、功耗、网络接口、外部显卡扩展及实际工作流收益。EVO-X3 的竞争力主要来自作者所述价格环境下的 128GB 容量和 Oculink 扩展能力；其生成速度、网络传输与维护便利性仍有明确约束。与 AMD Ryzen AI Halo 比较时，还需要把补购 10GbE 适配器的费用及占用唯一 USB4 接口的代价计入，原文没有完成这一总成本比较。对于需要处理保密资料的企业或专业人士，本地部署可以具有独立于模型能力排名的购买价值，但原文有关违反保密协议、广泛采用本地 AI及节省工时的判断均未通过具体条款或业务案例验证。作者提出的 3,500—4,000 美元设备每周节省数小时的购买逻辑，是条件性价值判断，不能直接视为已验证的投资回报。原文价格仅代表作者录制时的口径，且存在字幕金额歧义，也不足以独立证明内存涨价幅度、AI 对涨价的因果贡献或厂商盈利能力。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"bcc59574675ebfcbccb767adcdecaad556ea25e05740c2d7897675b09b1e91d2","translationSha256":"3b56490167f8b845ed9c66752cf27792acf513b2d243a2ff1305d65a521c3eb2","sourceCharacters":27795,"timestampValues":599,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":599,"captionTimestampsManagedByProgram":true,"captionRepairedRows":0} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# 一台价值 128GB 的本地 AI 节点？GMKtec EVO-X3

- 来源：YouTube·ServeTheHome

- 原始链接：https://www.youtube.com/watch?v=-nZiqOh-vEw

- 时长：1196 秒


## 完整文字稿

[0:00] 这台迷你 PC 看起来很酷，而且它还搭载了
[0:02] 一颗 AMD Ryzen AIAX Plus 395 处理器，
[0:05] 内存最高可达 128 GB，并且
[0:08] 配备两块或 4 TB NVME SSD。更重要的是，
[0:11] 我们不仅有 USB 4，而且
[0:13] 还有一个 Oculink 接口。所以，如果你
[0:15] 想接上一块独立 GPU，
[0:17] 也可以做到。各位，今天我们有
[0:19] 很多内容要讲。那我们开始吧。
[0:21] 大家好，我是 ST 的 Patrick，
[0:23] 这就是 GMK Tech Evo X3。现在，
[0:28] 你们可能还记得，第一台我们评测的
[0:31] AMD Ryzen AI Max Plus 395 系统，
[0:35] 也就是 Stricks Halo 系统，就是
[0:37] 这台，GMK Tech Evo X2。你们
[0:41] 可以看到，Evo X3 看起来完全
[0:44] 不像 Evo X2。事实上，我注意到的第一
[0:47] 件事是，我就在想，这
[0:49] 真的是同一家公司吗？不过
[0:50] 显然确实是。所以今天我们
[0:52] 接下来要谈谈所有的
[0:53] 做出的所有有趣设计选择。
[0:56] 由 Evo X3 打造的。嘿，大家好，在……之前
[0:58] 我想先聊聊定价，因为自从我们开始
[1:00] 测试它、开始剪辑视频，到现在，价格
[1:01] 已经变了。而且变的不只是这套系统的
[1:03] 定价，还有市场上其他系统的
[1:06] 定价。我这么说的意思是，
[1:08] 其他系统的定价……
[1:09] ……市场。我的意思是，
[1:12] Evo X3 现在的价格大约在 3599 到……之间
[1:15] 3799。希望在接下来的 48 小时里
[1:18] 这个区间。各位，我明白。我们
[1:20] 这段视频发布时，它仍会保持在……
[1:22] 这个区间。伙计们，我明白。我们……的时候
[1:24] 如果我告诉你，Evo X2，如果我告诉你一个盒子
[1:27] 基于此，价格会是 $3,800，
[1:29] 你会觉得：“嗯，这简直
[1:31] 太离谱了。”不过，我们先稍微聊聊
[1:32] 这里的竞品情况，
[1:34] 对吧？我旁边这台 MacBook Pro
[1:36] 是我特意买的，因为我们
[1:38] 在 Substack 上发文说，苹果
[1:39] 肯定要涨价了。我买了它，它
[1:41] 送到了，然后两周后，苹果
[1:43] 就大幅涨价，让它现在变成一台
[1:45] $7,500的笔记本电脑，这简直
[1:47] 太离谱了，但你当时就知道他们会涨
[1:49] 价，因为他们本质上
[1:50] 卖它的价格相当于128 GB 内存
[1:54] 的价格，再加上 SSD，也许再加
[1:56] 一点点。所以，苹果
[1:57] 当然需要利润空间，所以他们会卖
[1:58] 得比这个贵很多。现在，它是一台
[2:00] $7,500的笔记本电脑，这可真够夸张的。另一个
[2:03] 有意思的地方是，英伟达
[2:05] 例如，把它的128 GB 设备拿出来，现在
[2:08] 有一款 $49.99 的 DGX Spark，它
[2:12] 一年前我们评测时，还是昂贵的128 GB、$39.99，而
[2:16] 现在
[2:18] 128 GB 那款只要不到 $7,000。
[2:22] 另外，像N1X系统，例如微软
[2:26] Surface Ultra，那台配备128 GB 内存的设备
[2:30] 价格大概在 $5,500
[2:32] 这个区间。一方面，它的价格
[2:35] 高得离谱，要 $3,800。但放在
[2:39] 如今的市场环境下来看，实际上
[2:41] 也没那么贵。事实上，如果你看
[2:43] 一下，如果我们去买64 GB
[2:45] DDR5 6400 ECC DIMM，用于一台新
[2:49] 服务器，我们最终会花，呃，它
[2:51] 以前是2,000。我一直在用
[2:52] 有一段时间是那样，然后有人就会说
[2:53] 那现在已经完全不相关了，因为现在
[2:55] 在 eBay 上那些东西的价格大概是 $2,700
[2:57] 美元。我的意思是，价格简直离谱
[2:59] 但我们光是这个就花了 $5,400 美元。
[3:02] 所以我的意思是，我想，首先，对于家庭
[3:04] 实验室，尤其是用于遗留系统的虚拟
[3:06] 机基础设施，我通常会告诉
[3:08] 大家，如果你能用 DDR4，我的意思是 100%
[3:10] 那 AI 相关的东西就应该用它
[3:12] 内存带宽是个挑战，但
[3:14] 另一方面，就内存容量而言，这是
[3:16] 你能以最低成本之一
[3:19] 在这种内存带宽水平的系统中获得 128 GB。
[3:23] 你知道，
[3:25] 总体来说，我们正在谈论
[3:26] 内存成本有多高，
[3:28] 以及配备 120 GB 内存的系统在
[3:30] 2026 年 10 月的价格，其实并不
[3:33] 算太贵。我还想感谢
[3:34] 本视频的赞助商
[3:35] MicroEnter。我们过一会儿
[3:37] 会介绍它。那么，来看看硬件。好，在我们
[3:38] 介绍所有接口以及类似
[3:40] 这些东西之前，先来谈谈
[3:41] 这款产品最明显的不同之处
[3:42] ，也就是它的设计。如果你
[3:43] 看这里，呃，我们已经
[3:46] 装上了支架。底部有两颗小螺丝
[3:47] ，你实际上可以把它
[3:49] 竖着放。说真的，伙计们，这
[3:50] 东西看起来特别酷。事实上，Sam
[3:52] 负责我们所有的照片和 B-roll
[3:54] 以及这类工作，他
[3:56] 以及所有这类东西，他
[3:57] 可能正在拆解吧，我也不知道， 10,
[3:59] 甚至可能有十几台这样的 Stricks Halo
[4:01] 小主机，而他一直在谈论
[4:04] 这一台。比如，他说你得去录
[4:05] 这段视频，因为它实在太酷了。现在，
[4:07] 这是一个很好的视角，可以让你看到为什么 Evo
[4:09] X2 和 Evo X3 不同，对吧？我的意思是，
[4:12] 它们显然不同。它们
[4:13] 内部采用了不同的主板。它们
[4:15] 至少有一些不同的功能。
[4:16] 所以我真的
[4:18] 觉得，你知道，有些人
[4:19] 会看到 Evo X2、Evo X3，然后看到
[4:22] 相同的处理器。我觉得他们会以为
[4:23] 这是完全相同的系统，但显然
[4:25] 并非如此。我们来聊聊接口吧，对吧？
[4:27] 首先，这边有一个小小的咔嗒声，呃，
[4:28] 电源按钮。你可以听听。
[4:30] 太棒了。然后前面有两个 USB Type-A
[4:33] 接口。我们有一个 USB 3 接口
[4:34] 和一个 USB 2 接口。前面还有一个音频
[4:38] 插孔。所以如果你想
[4:40] 接上耳机，我想你可以
[4:42] 这么做。接下来看看背面，
[4:43] 你会注意到，基本上
[4:44] 顶部、底部，还有这一
[4:47] 侧都有通风口。我，我甚至不知道它们是
[4:49] 怎么摆放的，不过系统
[4:51] 背面也有通风口，那里的接口都是
[4:54] 主要接口。现在，你会看到
[4:56] 它两侧实际上只是
[4:58] 专门用于散热的，我们会给你看
[4:59] 内部情况，但这也是
[5:02] 它采用完全不同的
[5:03] 外形规格的原因之一，与前
[5:06] 一代设备相比。现在，
[5:08] 另一点是，背面的接口
[5:10] 非常有意思。原因
[5:12] 在于它们
[5:13] 有一些不错的地方，也有一些
[5:14] 会让你摸不着头脑
[5:16] 的地方。现在，最奇怪的
[5:17] 事情之一确实是以太网端口。
[5:19] 我们先从这个说起，因为这是一个
[5:21] 2 和 1/2 千兆以太网端口，你
[5:23] 知道，最初那款 Evo X2 推出
[5:26] 时，2 上面配的是 1 千兆。我想
[5:27] 那还算不错吧。我也不确定。但它
[5:29] 真的就像是一款早期设备。这
[5:31] 是一款产品周期稍晚一些的设备，
[5:33] 但我们仍然只有 2 和 1/2 千兆
[5:35] 以太网。我觉得这完全是个失误。
[5:36] 它本该配备一个 10 GB 以太网
[5:38] 端口。Ryzen AI Halo 盒子有 10 千兆。
[5:42] 我们见过的其他方案配有两个 10
[5:44] 千兆端口。我是说，感觉
[5:46] 2.5 千兆实在太慢了。而其中
[5:47] 一个主要原因是，如果你
[5:49] 在运行 AI 模型，或者做其他事情，
[5:51] 比如你可能想玩游戏，
[5:52] 还想通过网络传输文件，
[5:54] 而且你有一台 NAS，
[5:55] 也许会把一些东西转移过去，
[5:57] 因为如今存储很贵。
[5:59] 所以 NAS 确实能帮你
[6:00] 节省存储成本。嗯，你知道，现在我们的
[6:03] 网络就成了瓶颈，因为
[6:05] 我们只能用 2 和 1/2 千兆。
[6:08] 现在，你可以做的一件事
[6:09] 是使用一个 USB 10 千兆
[6:12] 适配器。我们测试过 Marll
[6:14] AQC 1113，也测试过 Realtech RTL 的
[6:18] 8159 系列方案。我们有不少
[6:20] 在 ST 主板侧的评测中。
[6:23] 但这台设备背面只有一个 USB Type-C 和 USB
[6:26] 4接口。所以，如果你
[6:28] 确实用它来做这件事，那就不能
[6:30] 再把这个 USB 端口用于其他用途。
[6:32] 此外还有一个 Type-A 接口。但
[6:34] 你肯定会注意到的一点是，
[6:36] USB 接口并不算多。
[6:37] 我确实希望接口能更多一些。这就说到了中间
[6:39] 这部分，也就是 HDMI 接口。
[6:41] 你会注意到这里没有
[6:43] DisplayPort 接口。所以，和 Evo
[6:44] 这里有一个显示接口。所以，与 Evo
[6:47] X2，我想这实际上可能是裁剪过的
[6:50] 版本，对吧？所以在我看来，
[6:53] 这感觉有点奇怪，不过这里有一个
[6:55] 补救之处。直流电源输入旁边
[6:58] 有一个 Oculink 接口。如果你不了解
[7:00] Oculink 的历史，这里说件
[7:02] 挺有意思的事。我们其实在
[7:03] 大约 Ice Lake
[7:06] 相当多，也许像是 Ice Lake
[7:08] 服务器代际。所以，就像之前2022,
[7:11] 服务器已经都换成了 MCIO，或者说几乎都换了。
[7:12] 我知道有些人用了定制连接器，
[7:16] 但原因之一就是
[7:18] MCIO 连接器，或者说那个……Oculink
[7:19] 连接器有多么脆弱。MCIO 就好得多。
[7:21] MCIO 接口，或者呃 Oculink
[7:23] 服务器内部用的是 MCIO，而不是 Oculink。
[7:25] 所以，这只是，你知道，大约从 2022 年开始
[7:27] 你知道，游戏公司也参与了进来，而且
[7:30] 围绕着使用它形成了
[7:33] 一种社区推动力
[7:35] ，把它装上去
[7:36] 比如围绕着……的社区势头
[7:38] Oculink，以及将其用作外部
[7:41] 连接器，以便能够从
[7:43] 像这样的设备连接到类似 GPU
[7:45] 扩展坞的设备上，而且 100% 我们之前试过这个。你
[7:48] 实际上可以把 GPU 通过 Oculink
[7:51] 呃，你知道，连接到 GPU 扩展坞
[7:53] 上，接好连接并通电，就能有一块
[7:55] 外接 GPU 连在这台设备上。所以，
[7:58] 如果你在做 AI，我知道很多
[8:00] 人会这么想，我们会在
[8:01] 性能部分谈到这一点，他们会说：
[8:02] “嘿，Stricks Halo，内存
[8:05] 带宽不算大。我希望能有更高的内存
[8:07] 带宽。”而且你知道，这确实如此，
[8:09] 但我想 GMK tech
[8:11] 团队的看法是：你看，我们
[8:13] 可以，如果你想运行一个大模型，
[8:15] 速度可能没那么快，但实际上
[8:16] 按容量来说，你可以在我们的 128 GB
[8:19] 内存容量里装下它。嗯，你知道，你
[8:21] 在主板上的
[8:23] Halo GPU 和内存子系统上肯定能做到这一点。但如果
[8:26] 你想用一个更小的模型，而且
[8:27] 想让这个更小的模型运行得更快，
[8:29] 那为什么不接上一块 GPU，
[8:31] 兼得两全呢？”
[8:33] 我想这说得通。我、我
[8:35] 其实很喜欢这个想法。而且我
[8:36] 知道肯定会有人
[8:38] 说：“哦，我可以装上一块，比如说，
[8:39] 你知道的，5080、5090，或者类似的显卡
[8:41] 接到外置扩展坞里，然后我就能玩
[8:43] 非常流畅的电子游戏。”我
[8:45] 想你确实可以这么做，但我、我不认为
[8:46] 这款平台适合
[8:48] 真正采用这种方案
[8:51] 游戏。比如你可以这么做，但说真的
[8:53] 如果你打算这么做，我觉得
[8:54] 如今你这么做是为了 AI。
[8:56] 说实话吧。但在进入
[8:58] 性能部分之前，我们何不打开系统看看
[8:59] 它是怎么工作的。好，
[9:01] 现在打开面板。要打开它
[9:02] 其实并不太容易。
[9:03] 里面有很多螺丝。
[9:05] 所以，这并不是一种特别方便的
[9:07] 拆卸方式，有点令人扫兴，
[9:09] 不过进入内部后，有
[9:10] 几件事我想指出来。
[9:12] 首先，看看这
[9:14] 机箱有多大一部分实际上是用来
[9:16] 散热的。事实上，我第一次看到这块
[9:17] 主板时，Sam把它打开了，他
[9:19] 当时给我看，我当时真的
[9:20] 觉得，哇，这
[9:21] 看起来简直像是
[9:22] 笔记本电脑主板之类的。
[9:24] 它就是有这种感觉，
[9:26] 侧边有大风扇，
[9:28] 还有大热管，而且
[9:30] 看起来GMK Tech确实下了很大功夫，
[9:33] 专门设计了这块主板，
[9:34] 让它能搭配这套散热器，并适配这种
[9:36] 机身规格，尤其是我们已经
[9:38] 评测过这么多这类产品之后。感觉
[9:40] 这算是个挺有意思的小细节。
[9:42] 另外，进入内部后，还有
[9:43] 几样东西可以自行维修，
[9:44] 我想，如果你愿意的话。首先，你
[9:46] 可以看到Wi-Fi 7。所以，这是一个，嗯，你
[9:49] 知道的，AMD MediaTek的Wi-Fi 7解决方案之一，
[9:51] 当然，因为我们有
[9:53] Stricks Halo。然后另一件
[9:54] 你可以做的事是，你可以装上，我
[9:56] 想，NVME 硬盘，如果你真的想这么做的话
[9:58] 。这台机器出厂时会安装一块
[10:00] NVME 硬盘。根据你选择的型号
[10:02] ，你可以选 2 TB 或 4
[10:04] TBTE 硬盘。坦白说，在这类
[10:06] 系统里，你会使用
[10:07] PCI Gen 4 硬盘。实际上，这
[10:09] 种情况下，我觉得你可以
[10:11] 用一块性能稍高一些的
[10:12] 硬盘，因为在我看来，这类
[10:15] 系统确实是那种稍微
[10:16] 更好的存储性能可能会
[10:18] 有用的系统。而对于其他一些迷你 PC，我
[10:20] 会建议使用低成本 QLC 存储，但这台
[10:23] 我觉得你知道，你
[10:24] 可能会希望它的性能
[10:25] 再好一些。说到运行这些
[10:27] 系统，我们通常会运行 Linux，不过当然
[10:28] 它也附带 Windows，而且有
[10:30] 很多人也会想要 Windows
[10:31] 。所以你可以做的一件事
[10:33] 是再买一块 SSD。所以如果你
[10:36] 想这么做，可以去
[10:37] MicroEnter，因为 MicroEnter 有
[10:39] 很多 SSD。他们也有外置
[10:41] 硬盘、内置硬盘，
[10:43] 处理器、主板、机箱，各种
[10:45] 电脑配件。此外，
[10:47] 他们还有 Raspberry
[10:49] Pi。如果你想做 3D 打印，
[10:52] 当然，MicroEnter 在这方面也能满足你
[10:54] ，他们有种类多得惊人的选择。我们
[10:56] 最近有机会去参加俄亥俄州哥伦布市
[10:59] 门店的盛大重新开业活动，现场还有
[11:01] 那里有成千上万的人。能见到大家真是太
[11:03] 棒了。附近有一家 Micro Center，你可以
[11:05] 去那里挑选各种所需的零件，
[11:06] 从 UPS 到网线，应有尽有。
[11:08] 这样你就能可靠地运行像这样的
[11:11] 系统。Micro Center 库存充足，
[11:12] 有大量商品，所以这特别
[11:15] 方便。他们也有很多网络设备，
[11:17] 比如你可以去买 Ubiquiti 设备，
[11:18] 还能轻松找到高速网络交换机，
[11:21] 完全没问题。再次感谢
[11:23] Microsenter 赞助
[11:24] 本视频。不过现在，我们继续回到正题。
[11:26] 现在，我注意到一件事，我觉得
[11:27] GMK 在内部和外部设计方面
[11:29] 还可以做得更好一些。比如我觉得
[11:30] 可能 Wi-Fi 网卡以及
[11:32] 以及外观设计。我觉得……
[11:34] 可维护部件。而且我希望机箱上
[11:37] 这些 M.2 固态硬盘确实是唯一的
[11:40] 把所有螺丝都拧下来，
[11:41] 再钻进这台机器里。我希望你
[11:43] 只要打开一个小小的免工具面板，
[11:44] 就能维护这些部件。还有一点是，
[11:46] 你没法维护机内的其他部件，
[11:47] 因为 Strix Halo、AMD Ryzen AI Max Plus
[11:49] 一个无需工具即可拆卸的小面板，然后进行维护
[11:51] 这些。不过还有一点是
[11:52] 觉得大多数购买这套系统的人，
[11:54] 可能真的只是插上设备，
[11:56] Ryzen AI Max Plus 395 芯片，它
[11:59] 焊接在主板上，内存也是
[12:03] 128 GB 的 LP DDR5X 内存。坦白说，我
[12:07] 我认为购买这套系统的大多数人都会
[12:08] 真的只是准备去试试，也许插上
[12:10] 把设备插到 USB 端口上，还有 HDMI，
[12:13] 也许是 Oculink 接口，但我
[12:15] 确实不太觉得有很多人会拆开
[12:18] 这台系统，然后说：“哦，我想
[12:20] 进去做很多工作，对吧？
[12:21] 除了加装存储之外，能做的
[12:22] 事情实在不多。”而且如果你
[12:24] 里面已经装了一块盘，nan
[12:26] 现在的价格相当贵，
[12:27] 对吧？好。有个人提到了一个
[12:29] 想法，我想你也可以
[12:31] 用这里的 M.2 两个接口来装上
[12:34] 一个类似 10 吉比特的网卡之类的东西，如果
[12:36] 你真的想这么做的话。有些办法挺奇特，
[12:38] 也许你会想买一台
[12:39] 昂贵的系统，再用电磨机挖出一个位置，
[12:42] 好装上一个类似 10 吉比特的网卡。我不认为
[12:44] 这是个好主意，不过
[12:46] 大概还是会有人这么做。话虽如此，
[12:47] 我们来看看性能。好，现在
[12:49] 说到性能，我们测试时
[12:50] 更多采用了高性能模式。
[12:52] 顺便说一下，这台设备有不同的性能模式，
[12:54] 你可以在 BIOS 里
[12:54] 启用之类的设置。你也可以使用
[12:57] 低性能模式，我想这时
[12:58] SOC 的功耗大约是 50
[13:00] 瓦左右，然后你可以一路调到
[13:02] 高性能模式，
[13:03] 大约是 140 瓦，而在 140 瓦时
[13:06] 我想这就是你需要更好
[13:07] 散热的原因，不过性能确实会
[13:09] 更强。所以，总体而言，
[13:11] 这台机器里的 Strix Halo
[13:12] 性能确实相当不错，比
[13:14] 很多其他系统都更好。说到底，
[13:16] 像这样的系统，你
[13:18] 真的不会买它来
[13:19] 玩游戏，或者只是运行 Microsoft Word，
[13:22] 之类的。但我认为你真正
[13:23] 买的是 128 GB 内存，
[13:25] 并且愿意支付这个价格，尤其是如今，
[13:27] 因为你想要运行本地 AI。而
[13:29] 我认为这很有道理，
[13:30] 而且这么做有很多理由。
[13:32] 不过，现在还有另一件事，
[13:33] 就是，你知道，在本地 AI 方面，你
[13:35] 只能受限于大约 250
[13:37] GB/秒的内存带宽。
[13:40] 所以，你的解码
[13:41] 性能基本上总会受到限制，或者几乎
[13:43] 总会受到内存带宽这个数值的
[13:44] 限制。但在我看来，酷的地方是，
[13:47] 因为有这么多这种
[13:49] 那是因为这种东西有很多
[13:51] 128 千兆，呃，内存设备，对吧？你
[13:54] Nvidia 的设备，还有 Apple
[13:56] Nvidia 设备，你还有 Apple
[13:59] 搭配 128 GB，呃，你知道，内存
[14:01] 达到那种理想的甜蜜点，也就是那些
[14:04] 并达到那些……的理想区间
[14:06] 120左右的十亿参数模型，一个
[14:08] 这些模型在这类平台上
[14:10] 运行得相当不错。说到
[14:11] 整体功耗，我们让这台机器的功耗降到了
[14:13] 整体功耗，我们测得这个
[14:15] 盒子到大约 160 180 瓦。但很多
[14:17] 实际功耗会低得多，
[14:19] 实际上运行在低得多的水平
[14:21] 大约 100 瓦特或更少。而这就是
[14:23] 有人以为，只要运行
[14:25] 大语言模型，就一定会
[14:26] LLM，你必然会
[14:28] 压力很大，比如说，你知道，运行在
[14:29] 100%，功耗会达到 160 瓦
[14:32] 或者一直保持 140 瓦
[14:34] 但这些设备的工作方式真的不是这样的。
[14:36] 通常情况下，功耗会远低于
[14:37] 100 瓦。这种平台上就是如此。而且
[14:39] 这也是你会选择
[14:41] 这类产品，而不是 GPU 的一个重要原因：
[14:44] 它的功耗低得多。
[14:46] 当然，比如说，配备
[14:48] GDDR7 内存的 GPU，性能会强得多
[14:50] ，尤其是在
[14:52] 受内存带宽限制时。
[14:54] 这就引出了我们总结出的关键经验教训，
[14:56] 对我来说，嗯，我们得聊到这里了。
[14:58] 好了，各位。做这些
[14:59] 视频时，我喜欢总结关键经验教训。
[15:01] 那么，我们从这套
[15:02] 系统中学到了什么？我来提几点想法，
[15:03] 好吗？首先，你们觉得这
[15:05] 是不是比 Evo X2 更好的平台？
[15:08] 是的，我觉得是。现在，这套设备有些地方
[15:10] 我希望它能做到。第一，它应该
[15:11] 配备 10 千兆以太网。它有 2026。你们
[15:14] 需要它。第二点也很重要：
[15:16] 我觉得它需要更多 USB
[15:18] 接口。我不太喜欢它
[15:20] 只有几个 USB 接口这一点。而且，
[15:22] 我们还失去了上一版上的 DisplayPort
[15:24] 接口。这看起来可能
[15:26] 不是什么大问题，但退一步想想，
[15:28] GMK Tech 在这里做了什么？
[15:31] 他们打造了一个平台，
[15:34] USB 接口更少，显示输出也更少，
[15:36] 而且他们可能还做了一些
[15:37] 营销宣传，说在我们的 Evo X2，
[15:40] 人们通常只连接一两台
[15:41] 显示器。也许他们，呃，你
[15:44] 知道，也不会连接那么多 USB
[15:46] 外设。也许像这台，它
[15:47] 实际上运行着 Ubuntu，因为
[15:49] 我们把它当作服务器来运行
[15:51] 本地 LLM。所以也许他们会说，好吧，
[15:53] 你知道，我们要打造一个
[15:54] 更适合做服务器的平台，
[15:56] 这才是重点。我们不需要
[15:57] 所有那些输入输出接口，对吧？而且
[16:01] 我理解这一点。但另一方面，你
[16:03] 只有 2 和 12 千兆以太网。所以你
[16:05] 用 2026 搭了一台服务器。那可是
[16:08] 超过 3,500 美元，而且你仍然
[16:11] 只有 2 和 12 千兆以太网。我不明白
[16:13] 这有什么道理，伙计们。对我来说，最突出的特点，
[16:15] 当然是 Oculink 接口。我觉得
[16:16] 这一点真的很不错。另外，当我们
[16:18] 拿它和这边这台 AMD
[16:21] Ryzen AI Halo 系统比较时，我认为
[16:24] 这台系统有一大优势，
[16:25] 显然不只是
[16:28] Oculink，我认为还有
[16:30] 价格。我的意思是，这台要便宜
[16:32] 几百美元，如果你买 2 TB
[16:34] 型号，价格就比
[16:36] Ryzen Halo 或 Ryzen AI Halo 盒子低不少。所以，
[16:39] 在我看来，你之所以会选
[16:41] 这台而不是 AMD 的盒子，
[16:43] 是因为，嗯，它它更
[16:45] 便宜。我想这算是个不错的理由，
[16:47] 但这台有 10 千兆以太网。
[16:49] 所以，如果你买一个 10 千兆适配器，给你的
[16:51] USB 4 端口，我不知道要提前多久
[16:53] 我不知道这样能让你领先多少。现在，另一个关键教训
[16:55] 真正学到的，其实就是整个本地 AI
[16:56] 这回事，伙计们。我觉得它又
[16:58] 重新兴起了。就直说吧。
[17:00] 还有，能使用开放权重模型，
[17:01] 我觉得很棒。好处是
[17:04] 如果你有这样一台系统，你
[17:06] 就不必把数据发给一家
[17:08] 前沿模型提供商或任何模型
[17:11] 提供商。我不需要把我的
[17:13] 数据发到我不知道的地方。我也不知道
[17:15] 那是什么托管平台。我不知道
[17:17] 我的数据会发生什么。他们会
[17:19] 用我的数据训练吗？诸如此类的
[17:20] 事情。让我给你一个非常
[17:22] 简单的理由，说明你为什么可能会需要它。
[17:24] 如果你有一份 NDA，并且正在获取
[17:26] NDA 下的信息，而你现在
[17:28] 又把它发送给一家模型提供商，你
[17:30] 很可能就违反了那份 NDA。所以，
[17:33] 在某个时候，你知道，我觉得
[17:34] 每个人都得有某种
[17:36] 形式的本地 AI，因为如果你
[17:39] 把数据发出去，这类工作流程就无法
[17:41] 进行——也就是把数据发到
[17:43] 组织之外，因为你根本不知道
[17:45] 这些数据会被怎么使用。还有，伙计们，
[17:46] 我不是说
[17:48] Quen 3.6 35B A3B比
[17:53] Opus 或者 Fable 之类的
[17:55] 模型更好。我绝对不
[17:56] 认为事实是这样。GPT
[18:00] 呃 5.6六好得多。当然如此。
[18:03] 但另一方面，如果我使用那些模型，就得把
[18:05] 数据发送出去；而使用本地模型，我可以
[18:07] 把所有数据都留在这里。本地的所有
[18:09] 文件，我知道都不会被发送到
[18:11] 一家云服务提供商。他们不会
[18:13] 用来训练，因为它们不会
[18:14] 离开我的边界。对我来说，这是
[18:16] 一件非常有价值的事，尤其是，
[18:18] 你知道，如果你是律师，或者你
[18:20] 知道，有很多职业
[18:21] 你未必希望那些
[18:23] 数据跑到谁也不知道的地方去。而且
[18:26] 我还知道另一件事，那就是我们
[18:27] 会收到很多评论，说
[18:28] “哦，你知道，这个
[18:29] 简直太贵了，之类的。”
[18:30] 但是，你知道，说到底，
[18:32] 考虑到开源权重
[18:34] 模型能做的事，尤其是从可能
[18:35] 那个，你知道，Quen 3.6 6呃 35B
[18:39] 模型，一直到可能 120B uh 范围的模型。
[18:41] 如今它们的能力都很强，所以你
[18:44] 知道，我真的觉得现在已经到了
[18:46] 这样的阶段：如果你有一家企业，或者
[18:47] 有一些事情需要
[18:49] 完成。坦白说，我认为绝大多数
[18:51] STH 的读者和 YouTube 上的朋友，你
[18:54] 知道，如果某样东西是 3500 美元
[18:55] 或 $4,000，我不是说这很便宜，
[18:57] 但另一方面，你知道，如果它是
[18:59] 能让你每周少花几个小时
[19:02] 在工作上的东西，那也许值得，也许
[19:05] 确实值得，对吧？对。而且我
[19:06] 觉得这正是，我认为，AI 产品
[19:08] 的定价方式。我理解大家
[19:10] 为什么不喜欢这样。但另一方面，
[19:12] 你知道，你还有什么选择呢，对吧？如果
[19:13] 你在和别人竞争，
[19:14] 而他们有这个，你却没有，那么
[19:17] 他们就会，你知道，花费
[19:18] 在任务上花的时间更少，或者效率更高，或者能做更多事情，不管具体是哪一种
[19:20] ，而你却没有。
[19:21] 总之，第一点，
[19:24] 我知道 AI 正在推高
[19:26] 价格。就像，我们每天都能感受到。我们
[19:28] 买了大量内存，每天都能明显感受到
[19:29] 这一点。所以，这不是一台
[19:31] 每天都在用它。所以，这不是一台
[19:34] $500迷你电脑。它不是一台$1,000迷你电脑，
[19:37] 真正获得更多
[19:39] 能力。但我相信大家
[19:41] 对此会有很多想法。
[19:43] 所以，请一定在
[19:44] 评论区告诉我。另外，如果你喜欢这段
[19:45] 视频，或者只是想分享给
[19:47] 朋友和同事，何不
[19:48] 去分享呢？也请点个
[19:49] 赞，点击订阅，并打开
[19:50] 通知，这样每当我们发布
[19:52] 精彩的新视频时，你就能看到。
[19:53] 一如既往，感谢收看。祝你
[19:54] 度过美好的一天。
[19:55] 那

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=-nZiqOh-vEw
- 来源：YouTube·ServeTheHome
- 发布时间：2026-10-10
- 行业：终端与具身、算力芯片、互联与网络、模型层、应用
- 公司：GMKtec；AMD；Apple；NVIDIA；Microsoft；MediaTek；MicroEnter（视频赞助商，字幕另有 Microenter、Microsenter 等拼写）；Marll、Realtech（网络适配器相关名称，按未经人工校对的字幕保留）
- 归档时间：2026-10-10T09:10:56.463Z

---

# A Value 128GB Local AI Node? The GMKtec EVO-X3

- 来源：YouTube·ServeTheHome

- 原始链接：https://www.youtube.com/watch?v=-nZiqOh-vEw

- 时长：1196 秒


## 完整文字稿
[0:00] This mini PC looks cool, but it also has
[0:02] an AMD Ryzen AIAX Plus 395 processor in
[0:05] it with up to 128 GB of memory and
[0:08] either two or 4 TB NVME SSD. What's
[0:11] more, not only do we get USB 4, but
[0:13] there's also an Oculink port. So, if you
[0:15] wanted to go and put a discrete GPU, you
[0:17] could do that as well. Guys, we have a
[0:19] lot to get to today. So, let's get to
[0:21] it. Hey guys, this is Patrick from ST
[0:23] and this is the GMK Tech Evo X3. Now,
[0:28] you might remember that the first AMD
[0:31] Ryzen AI Max Plus 395, also known as
[0:35] Stricks Halo system that we reviewed was
[0:37] this one, the GMK Tech Evo X2. And you
[0:41] can see that the Evo X3 looks nothing
[0:44] like the Evo X2. In fact, the first
[0:47] thing I noticed with this is like, is
[0:49] this even the same company? But
[0:50] apparently, it is. And so today we're
[0:52] going to go talk about all of the
[0:53] interesting design choices that GMK Tech
[0:56] made with the Evo X3. Hey guys, before
[0:58] we get too far in this, I want to talk
[1:00] about pricing because that has changed
[1:01] since we started testing it, we started
[1:03] editing the video and now. And it's not
[1:06] just the pricing of the system, but also
[1:08] the pricing of other systems in the
[1:09] market. What I mean by that is that the
[1:12] Evo X3 is now somewhere in the 3599 to
[1:15] 3799. And hopefully in the next 48 hours
[1:18] between when I'm recording this and when
[1:20] this video goes live, it will stay in
[1:22] that range. And guys, I get it. When we
[1:24] did the Evo X2, if I told you that a box
[1:27] based on that was going to be $3,800,
[1:29] you'd be like, "Well, that's absolutely
[1:31] crazy." But just let's talk a little bit
[1:32] about the competition here for a sec,
[1:34] right? This MacBook Pro that's sitting
[1:36] next to me, I actually bought because we
[1:38] put on our Substack like Apple's going
[1:39] to have to raise prices. I bought it, it
[1:41] arrived, and then two weeks later, Apple
[1:43] jacked their prices, making this now a
[1:45] $7,500 laptop, which is absolutely
[1:47] silly, but you knew they had a raised
[1:49] prices because they were essentially
[1:50] selling it for what 128 gigs of RAM
[1:54] would cost, plus the SSD and maybe a
[1:56] little bit more. So, of course, Apple
[1:57] needs margin, so they're going to sell
[1:58] it for a lot more than that. Now, it's a
[2:00] $7,500 laptop, which is wild. The other
[2:03] interesting thing though is that Nvidia,
[2:05] for example, took its 128 gig boxes, and
[2:08] now there's a $49.99 DGX Spark, which
[2:12] was the expensive 128 gig, $39.99 one a
[2:16] year ago when we reviewed it, and now
[2:18] the 128 gig one is just shy of $7,000.
[2:22] Also, the N1X systems like the Microsoft
[2:26] Surface Ultra, that thing at 128 gigs is
[2:30] somewhere in the, you know, $5,500
[2:32] range. The price of this on one hand is
[2:35] very high at $3,800. But putting it in
[2:39] the context of like today, it's actually
[2:41] not that bad. In fact, if you look at
[2:43] it, if we were to go and just buy 64 gig
[2:45] DDR5 6400 ECCR DIMs for like a new
[2:49] server, we would end up spending uh it
[2:51] used to be 2,000. and I've been using
[2:52] that for a while and somebody's like
[2:53] that's not even relevant anymore cuz now
[2:55] it's like $2,700 on eBay for those
[2:57] things. I mean absolutely crazy price
[2:59] but we spent $5,400 bucks just for that.
[3:02] So I mean so I guess number one for home
[3:04] labs especially for legacy like virtual
[3:06] machine infrastructure I generally tell
[3:08] people if you can do DDR4 I mean 100%
[3:10] you should go do that for the AI stuff
[3:12] memory bandwidth is a challenge but on
[3:14] the other hand memory capacity wise this
[3:16] is some of the lowest cost way that you
[3:19] can go get 128 gigs in a system at this
[3:23] memory bandwidth level. You know,
[3:25] overall like what we're we're talking
[3:26] about in terms of how much memory costs
[3:28] and systems with 120 gigs of memory cost
[3:30] in like October 2026 is actually not
[3:33] that bad. And I just want to say thank
[3:34] you to the sponsor of this video,
[3:35] MicroEnter. And we're going to be going
[3:37] over there in a little bit. So, let's
[3:38] get to the hardware. Okay, so before we
[3:40] get to all the ports and all that kind
[3:41] of stuff, let's talk about the obvious
[3:42] thing that is way different with this
[3:43] one, and that is just the design. If you
[3:46] look at this, uh, we have the stand
[3:47] installed. There's two little screws at
[3:49] the bottom, and you can actually go and
[3:50] put it vertically. Frankly, guys, this
[3:52] thing looks super cool. In fact, Sam,
[3:54] who does all of our photos and B-roll
[3:56] and all that kind of stuff, he's
[3:57] probably taking apart, I don't know, 10,
[3:59] maybe even a dozen of these Stricks Halo
[4:01] boxes, and he just keeps talking about
[4:04] this one. Like, you got to go record the
[4:05] video because it is so cool. Now, this
[4:07] is a great view to show you why the Evo
[4:09] X2 and Evo X3 are different, right? I
[4:12] mean, they are clearly different. They
[4:13] have different motherboards inside. They
[4:15] have different features, at least some
[4:16] different features. And so I really
[4:18] think that, you know, some folks are
[4:19] going to see the Evo X2, Evo X3, see the
[4:22] same processor. I think that they're the
[4:23] exact same system, but they are clearly
[4:25] not. Let's talk about the ports, right?
[4:27] First off, we have the little clicky uh
[4:28] power button over here. You can hear.
[4:30] Awesome. And then we have two USB typeA
[4:33] ports on the front. We get a USB 3 port
[4:34] and a USB 2 port. There's also a audio
[4:38] jack on the front. So if you want to go
[4:40] and hook up headphones, I guess you can
[4:42] do that. And as we get to the back,
[4:43] you'll notice that we have vents pretty
[4:44] much on, you know, top bottom here, this
[4:47] side. I I don't even know how these are
[4:49] oriented, but also in the back of the
[4:51] system where we have all of the main
[4:54] ports. Now, here you're going to see
[4:56] that the sides of this are actually just
[4:58] dedicated to cooling, and we'll show you
[4:59] that inside, but it is one of the
[5:02] reasons that this is a completely
[5:03] different form factor than the previous
[5:06] generation of this device. Now, the
[5:08] other thing is the ports on the back are
[5:10] super interesting. And the reason
[5:12] they're interesting is because there's
[5:13] some good stuff here and there's some
[5:14] stuff that just will make you scratch
[5:16] your head. Now, one of the weirdest
[5:17] things is really the Ethernet port.
[5:19] Let's start with that because this is a
[5:21] 2 and 1/2 gig Ethernet port, which you
[5:23] know when the first original Evo X2 came
[5:26] out, 2 and 1 half gig on it. I guess
[5:27] that was good. I don't know. But it was
[5:29] really like just an early device. This
[5:31] is a kind of later in the cycle device
[5:33] and we still only have 2 and 1/2 gig
[5:35] Ethernet. I think this is a total miss.
[5:36] This should have been a 10 GB Ethernet
[5:38] port. The Ryzen AI Halo box has 10 gig.
[5:42] Other solutions we've seen have two 10
[5:44] gig ports. I mean, it just feels like
[5:46] two and a half gig is too slow. And one
[5:47] of the big reasons for that is if you
[5:49] are running AI models or doing other
[5:51] things like you maybe want to play games
[5:52] and you want to go transfer things over
[5:54] your network and you have a NAS that
[5:55] maybe you're offloading stuff too
[5:57] because storage is expensive these days.
[5:59] So NAS can actually help with your
[6:00] storage costs. Well, you know, now our
[6:03] networking becomes a bottleneck because
[6:05] we're stuck with only 2 and 1/2 gig.
[6:08] Now, one of the things that you could do
[6:09] is you could go and use a USB 10 gig
[6:12] adapter. We've looked at both the Marll
[6:14] AQC 1113 as well as Realtech RTL the
[6:18] 8159based solutions. We have a bunch of
[6:20] reviews on the ST main side of those.
[6:23] But there is only one USB type-C and USB
[6:26] 4 port on the back of this. So, if you
[6:28] you do use it for that, then you're not
[6:30] using that USB port for something else.
[6:32] Also, there is a type A port. But
[6:34] something you'll definitely notice is
[6:36] that there's not a whole lot of USB
[6:37] ports. I definitely wish that there were
[6:39] more. And that gets us to this center
[6:41] part here, which is our HDMI port.
[6:43] You're going to notice that there's no
[6:44] display port here. So, unlike the Evo
[6:47] X2, this is actually a I guess maybe cut
[6:50] down version of your overall like
[6:53] display outputs, right? So, that to me
[6:55] kind of feels weird, but there is a
[6:58] saving grace here. Next to the DC power
[7:00] input, we get an Ocul. Now, if you don't
[7:02] know the history of Oculink, just kind
[7:03] of a fun thing. We actually saw Oculink
[7:06] quite a bit in maybe like the ice lake
[7:08] generation of servers. So, like pre2022,
[7:11] it was a pretty common connector. Now,
[7:12] servers all moved to MCIO or almost all
[7:16] moved. I know some people have some
[7:18] custom connectors, but one of the
[7:19] reasons was just kind of how flimsy the
[7:21] MCIO connect or the uh Oculink
[7:23] connectors were. MCIO was just better.
[7:25] So that's just you know from about 2022
[7:27] onwards and servers instead of Oculink
[7:30] internally you got MCIO. Now what
[7:33] happened though was I think a lot of uh
[7:35] you know gaming companies and there was
[7:36] like community momentum around putting
[7:38] Oculink and using that as an external
[7:41] connector to be able to go and go from a
[7:43] device like this to something like a GPU
[7:45] dock and 100% we tried this earlier. you
[7:48] can actually go and put a GPU an Oculink
[7:51] uh you know connection to a GPU dock
[7:53] connect it up power it up and have an
[7:55] external GPU attached to this thing. So,
[7:58] if you are doing AI, I know a lot of
[8:00] folks, and we'll talk about this in the
[8:01] performance section, are going to say,
[8:02] "Hey, Stricks Halo, not a ton of memory
[8:05] bandwidth. I wish I had more memory
[8:07] bandwidth." And you know, that's true,
[8:09] but I guess the way that the GMK tech
[8:11] guys are looking at is like, look, we
[8:13] have if you want to run a big model,
[8:15] maybe not as fast, but you can actually
[8:16] fit it capacity-wise in our 128 gig
[8:19] memory footprint. Well, you know, you
[8:21] could definitely do that on the mains
[8:23] Halo GPU and memory subsystem. But if
[8:26] you want to have a smaller model and you
[8:27] want to go fast with that smaller model,
[8:29] well, why don't you go and put a GPU on
[8:31] there and get the best of both worlds?
[8:33] And I guess that makes sense. I I
[8:35] actually really like that idea. And I
[8:36] know inevitably somebody is going to
[8:38] say, "Oh, I could go put like a, you
[8:39] know, 5080, 5090 or something like that
[8:41] into an external dock and I could play
[8:43] like really fast video games." And I
[8:45] guess you could, but I I don't think
[8:46] that this is the right platform for
[8:48] really like that kind of solution for
[8:51] gaming. like you could do it, but really
[8:53] if you're going to do that, I think
[8:54] these days you're going to do it for AI.
[8:56] Let's face it. But before we get to the
[8:58] performance, why don't we get inside the
[8:59] system and show you how it works. Okay,
[9:01] now opening up the panel. It's not
[9:02] actually super easy to get in this.
[9:03] There's a lot of screws to get inside.
[9:05] So, this isn't like a super easy way to
[9:07] go access it, which is kind of a bummer,
[9:09] but once you're inside, there are a
[9:10] couple things that I want to point out.
[9:12] The first thing is just how much of this
[9:14] chassis is actually dedicated to
[9:16] cooling. In fact, when I first saw this
[9:17] motherboard, Sam had this open and he
[9:19] was like showing me and I I really
[9:20] thought like I was like, man, this
[9:21] almost looks like it could have been
[9:22] like a laptop motherboard or something.
[9:24] It just it just feels like that where
[9:26] you have like the big fans on the side
[9:28] and you have the big heat pipes and it
[9:30] really looks like GMK Tech went into a
[9:33] lot of effort to have a motherboard
[9:34] designed with this cooler and in this
[9:36] form factor, especially after we have
[9:38] reviewed so many of these. It just seems
[9:40] like an interesting little bit. And
[9:42] also, once you're inside, there are a
[9:43] couple things that you could service, I
[9:44] guess, if you wanted to. First off, you
[9:46] get Wi-Fi 7. So, this is like an um you
[9:49] know, one of the AMD MediaTek Wi-Fi 7
[9:51] solutions, of course, because we have
[9:53] the Stricks Halo. And then the other
[9:54] thing you can do is you could put, I
[9:56] guess, NVME drives if you really wanted
[9:58] to. This will come installed with an
[10:00] NVME drive. And depending on the model
[10:02] that you pick, you can get a two TB or 4
[10:04] TBTE drive. Now, frankly, in these types
[10:06] of systems, you're going to be using
[10:07] like PCI Gen 4 drives. And actually this
[10:09] would be a case where I think you could
[10:11] use a little bit higher performance
[10:12] drive just because to me this is the
[10:15] kind of system that actually a little
[10:16] better storage performance is probably
[10:18] useful in some of the other mini PCs I
[10:20] say go use lowcost QLC storage but this
[10:23] I think is something that you know you
[10:24] probably want to have a little bit more
[10:25] performance in. Now running these
[10:27] systems we often run Linux but of course
[10:28] it comes with Windows and there are a
[10:30] lot of folks that will want the Windows
[10:31] as well. And so one thing that you could
[10:33] do is get another SSD. And so if you
[10:36] wanted to do that, you might head over
[10:37] to MicroEnter because MicroEnter has
[10:39] lots of SSDs. They also have external
[10:41] hard drives, internal hard drives,
[10:43] processors, motherboards, cases, all
[10:45] kinds of computer components. Beyond
[10:47] that, they have things like Raspberry
[10:49] Pies. If you want to go do 3D printing,
[10:52] of course, MicroEnter has you covered
[10:54] there with a crazy selection. We
[10:56] recently got to go to the Columbus, Ohio
[10:59] store's grand reopening and there were
[11:01] thousands of people there. It was so
[11:03] awesome to get to meet everyone. Just
[11:05] having a microenter nearby where you can
[11:06] go and pick up whatever kinds of parts
[11:08] you want from a UPS to network cables.
[11:11] So, you can go run something like this
[11:12] system reliably. The microenter has tons
[11:15] of items in stock which makes it super
[11:17] easy. They also have lots of networking
[11:18] gear like you can go get ubiquity gear
[11:21] and find high-speed network switches, no
[11:23] problem. Again, I just want to say thank
[11:24] you to Microsenter for sponsoring this
[11:26] video. But now, let's get back to it.
[11:27] Now, something that I noticed that I
[11:29] think GMK could also do a little bit
[11:30] better of when they do their internal
[11:32] and external design. It's like I think
[11:34] that the maybe the Wi-Fi card and also
[11:37] the M.2 SSDs, those are really the only
[11:40] serviceable parts that are in here. And
[11:41] I wish there was a little door on the
[11:43] chassis so that way you didn't have to
[11:44] like open up with all the screws and
[11:46] like get inside this thing. I wish you
[11:47] could just go and like open up like a
[11:49] little toolless panel and go service
[11:51] those. The other thing though is that
[11:52] you're not servicing anything else in
[11:54] here because the Stricks Halo, the AMD
[11:56] Ryzen AI Max Plus 395 chip that's
[11:59] soldered onto the motherboard, as is the
[12:03] 128 GB of LP DDR5X memory. Frankly, I
[12:07] think most people who buy the system are
[12:08] really just going to go and maybe plug
[12:10] in devices on the USB ports, the HDMI,
[12:13] maybe the Oculink port, but I don't
[12:15] really see a lot of folks getting inside
[12:18] this system and saying like, "Oh, I want
[12:20] to go and and do a lot of work, right?
[12:21] There's just not that much you can do
[12:22] other than adding storage." And if you
[12:24] already have a drive in there, nan
[12:26] prices are pretty expensive these days,
[12:27] right? Okay. One idea that somebody
[12:29] pointed out was also, I guess you could
[12:31] use the M.2 two in here to go and put
[12:34] like a 10 gig adapter or something if
[12:36] you really wanted to. There's some funky
[12:38] ways and maybe you want to buy an
[12:39] expensive system and dremel out a spot
[12:42] for like a 10 gig adapter. I don't think
[12:44] that's a good idea, but probably
[12:46] somebody will do it. With that though,
[12:47] let's get to the performance. Okay, now
[12:49] in terms of performance, we tested this
[12:50] more at the higher performance mode.
[12:52] There are different performance modes,
[12:54] by the way, at this thing that you can
[12:54] enable in BIOS and stuff. You can have a
[12:57] lower performance mode where I think the
[12:58] SOC runs at like something like 50
[13:00] something watts and then you go all the
[13:02] way up to the high performance mode
[13:03] which is like 140 watts and at 140 watts
[13:06] I guess it's really why you need that
[13:07] better cooling but you do definitely get
[13:09] more performance. So the overall
[13:11] performance of the Stricks Halo in this
[13:12] is actually pretty good and it's better
[13:14] than a lot of other systems. And let's
[13:16] face it in a system like this you're
[13:18] really not going to be buying it for
[13:19] gaming or just running Microsoft Word or
[13:22] something like that. But I think you're
[13:23] really buying 128 GB of memory and
[13:25] paying that price, especially these days
[13:27] because you want to go run local AI. And
[13:29] I think that makes a lot of sense and
[13:30] there are a lot of reasons to go do
[13:32] that. Now, the other thing though is
[13:33] that, you know, on local AI, you're
[13:35] stuck with that like 250 something
[13:37] gigabytes of uh per second of memory
[13:40] bandwidth. And so, you're just kind of
[13:41] always going to be limited or almost
[13:43] always limited in your decode
[13:44] performance by that memory bandwidth
[13:47] figure. But to me, the cool thing is
[13:49] that because there's so many of these
[13:51] 128 gig uh memory devices, right? You
[13:54] have both the AMD device, you also have
[13:56] Nvidia devices, and you also have Apple
[13:59] with 128 gig uh, you know, memory
[14:01] devices. It gives you the ability to go
[14:04] and hit that kind of sweet spot of those
[14:06] 120ish billion parameter models, a
[14:08] mixture of of expert models, and those
[14:10] are the ones that work pretty darn well
[14:11] on these types of platforms. In terms of
[14:13] overall power consumption, we got this
[14:15] box to about 160 180 watts. But a lot of
[14:17] times when you're running LMS, it's
[14:19] running actually at a lot lower than
[14:21] that, like 100 watts or less. And that's
[14:23] very very common. So I I don't want
[14:25] somebody to think that if you're running
[14:26] LLM, you're necessarily going to be
[14:28] stressed, like, you know, running at
[14:29] 100% and you're going to be at 160 watts
[14:32] or 140 watts all the time, cuz it's
[14:34] really just not how these things work.
[14:36] Usually, you're going to be well under
[14:37] 100 watts in a platform like this. And
[14:39] that is one of the big reasons that you
[14:41] would get something like this over a GPU
[14:44] also is just because you're using a lot
[14:46] less power. But of course, a GPU with
[14:48] GDDR7 memory, for example, will give you
[14:50] a lot more performance, especially when
[14:52] you're memory bandwidth constrainted.
[14:54] That gets us to our key lessons learned,
[14:56] which to me, yeah, let's we got to get
[14:58] there. Okay, guys. With all these
[14:59] videos, I like to have key lessons
[15:01] learned. And what do we learn from the
[15:02] system? Let me give you some ideas,
[15:03] right? First off, do I think that this
[15:05] is a better platform than the Evo X2?
[15:08] Yes, I do. Now, there are things that I
[15:10] wish this had. Number one, it should
[15:11] have 10 gigabit Ethernet. It's 2026. You
[15:14] need it. Second thing, and an important
[15:16] one, is I think this needs more USB
[15:18] ports. I don't love the fact that it
[15:20] only has a couple USB ports. And also,
[15:22] we've lost the display port from the
[15:24] previous version. And that may not seem
[15:26] like a big thing, but just take a step
[15:28] back and think about, well, what did GMK
[15:31] Tech do here? They made a platform that
[15:34] has fewer USB ports, fewer display
[15:36] outputs, and they probably have some
[15:37] marketing stuff that said in our Evo X2,
[15:40] people really only connected one or two
[15:41] displays usually. And maybe they uh, you
[15:44] know, also didn't connect that many USB
[15:46] peripherals. Maybe like this one, this
[15:47] one's actually running Ubuntu because
[15:49] we're using it as a server to go and run
[15:51] LLM locally. So maybe they said, well,
[15:53] you know, we're going to create a
[15:54] platform that's a better server and
[15:56] that's really the focus. We don't need
[15:57] all those input output ports, right? and
[16:01] I get that. But on the other hand, you
[16:03] only have 2 and 12 gig Ethernet. So you
[16:05] built a server in 2026. That's, you
[16:08] know, over over $3,500 and you still
[16:11] have 2 and 12 gig Ethernet. I don't get
[16:13] it, guys. To me, the standout feature,
[16:15] of course, is the Oculink port. I think
[16:16] that's really good. Also, when we
[16:18] compare it to something like the AMD
[16:21] Ryzen AI Halo system over here, one of
[16:24] the big things that I think is better
[16:25] about this system clearly is not just
[16:28] the Oculink, but also I think it's the
[16:30] price. I mean, this thing is a couple
[16:32] hundred less and if you get the two TB
[16:34] model, you know, quite a bit less than
[16:36] the Ryzen Halo or Ryzen AI Halo box. So,
[16:39] just to me, the reason that you would
[16:41] get this over, you know, the AMD's box
[16:43] is because, well, it's it's less
[16:45] expensive. So, that's a good reason I
[16:47] guess, but this one has 10 gig Ethernet.
[16:49] So, if you buy a 10 gig adapter for your
[16:51] USB 4 port, I don't know how far ahead
[16:53] you are. Now, the other key lesson
[16:55] learned is really this whole local AI
[16:56] thing, guys. It's I think it's had a
[16:58] resurgence. Let's call it what it is.
[17:00] And also, just having openweight models,
[17:01] I think it's great. The nice thing is
[17:04] that if you have a system like this, you
[17:06] don't have to go and send your data to a
[17:08] Frontier model provider or any model
[17:11] provider. I don't need to go and send my
[17:13] data to I don't know where. I don't know
[17:15] what hosting platform. I don't know
[17:17] what's going on with my data. Are they
[17:19] going to train on my data? All that kind
[17:20] of stuff. Let me give you just a really
[17:22] simple reason why you might want that.
[17:24] If you have an NDA and you are getting
[17:26] information under NDA and you're now
[17:28] sending it to a model provider, you're
[17:30] probably violating that NDA. So, like at
[17:33] some point, you know, I think
[17:34] everybody's going to have to have some
[17:36] form of local AI just because you can't
[17:39] do those types of workflows if you're
[17:41] sending your data off like outside of
[17:43] your organization cuz you just don't
[17:45] know how that's going to be used. And
[17:46] hey guys, like I'm not going to say that
[17:48] Quen 3.6 35B A3B is uh is better than
[17:53] Opus or, you know, Fable or any of that
[17:55] kind of stuff. I I definitely don't
[17:56] think that's the case by any means. GPT
[18:00] uh 5.6 six way better. Of course, it is.
[18:03] But on the other hand, I have to send my
[18:05] data if I use one of those versus I can
[18:07] keep it all locally here. All the
[18:09] documents I know are not going to go to
[18:11] a cloud provider. They're not going to
[18:13] be trained on because they're not
[18:14] leaving my perimeter. And to me, that's
[18:16] a super valuable thing, especially like,
[18:18] you know, if you're an attorney or, you
[18:20] know, there are a lot of professions
[18:21] where you don't necessarily want that
[18:23] data to go out to who knows where. And
[18:26] the other thing I know is that we're
[18:27] going to get a lot of comments that are
[18:28] going to say, "Oh, you know, this is
[18:29] like so expensive and stuff like that."
[18:30] But, you know, at the end of the day,
[18:32] with what you can do with openweight
[18:34] models, especially anywhere from maybe
[18:35] that, you know, Quen 3.6 six uh 35B
[18:39] model up to maybe 120B uh range model.
[18:41] They're so capable these days that you
[18:44] know I really think that it's at the
[18:46] point where if you have a business or
[18:47] you have stuff that you need to get
[18:49] done. I frankly think the vast majority
[18:51] of STH readers and folks on YouTube, you
[18:54] know, if it's if something's 3500 bucks
[18:55] or $4,000, I'm not saying that's cheap,
[18:57] but on the other hand, you know, if it's
[18:59] something that saves you a couple hours
[19:02] a week of work, then maybe it is maybe
[19:05] it is worthwhile, right? Right. And I
[19:06] think that's really, I think, how the AI
[19:08] stuff is priced. And I get why folks
[19:10] don't like that. But on the other hand,
[19:12] you know, what's your option, right? If
[19:13] you're competing against somebody and
[19:14] they have this and you don't, then
[19:17] they're going to be, you know, spending
[19:18] less time on tasks or they're going to
[19:20] be more efficient or they're going to be
[19:21] able to do more, whatever it is, and and
[19:24] you're not. So, long story short, number
[19:26] one, I know that AI is raising the
[19:28] prices. Like, we feel it every day. We
[19:29] buy a ton of memory and definitely feel
[19:31] it every single day. So, this is not a
[19:34] $500 mini PC. It's not a $1,000 mini PC,
[19:37] but I think what it gets is it gets you
[19:39] to the point that you actually get more
[19:41] capability. But I'm sure you guys are
[19:43] going to have lots of thoughts on that.
[19:44] So, definitely let me know down in the
[19:45] comments. Also, if you did like this
[19:47] video or you just want to share with
[19:48] your friends and colleagues, why don't
[19:49] you go do that? But also, give it a
[19:50] like, click subscribe, and turn on the
[19:52] notifications so you can see whenever we
[19:53] come out with great new videos. As
[19:54] always, thanks for watching. Have an
[19:55] awesome day.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
