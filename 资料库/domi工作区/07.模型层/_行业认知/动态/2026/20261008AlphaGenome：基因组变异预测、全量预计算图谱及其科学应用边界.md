<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_a8ad2d5c1007ab65"
title: "AlphaGenome：基因组变异预测、全量预计算图谱及其科学应用边界"
domains: ["模型层","基础软件与工具链","应用","云与算力服务","其他行业"]
subdomains: ["开源与开放权重模型","模型研究与训练方法","模型开发与评测工具","垂直行业应用","消费与个人应用","智算云与算力租赁"]
types: ["行业认知","视频"]
companies: "Google DeepMind（AlphaGenome、AlphaGenome Atlas、AlphaFold 及字幕所称 SEMA 项目）；Google（Gemini）；Lambda（结尾赞助推广，链接 lambda.ai/papers）；Nvidia（Lambda 推广中提及的 GPU 提供方）；DeepSeek（字幕写作 Deepseek，在 Lambda 推广中作为聊天机器人或智能体运行示例出现）。"
published_at: "2026-10-08T02:44:23.025Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=Wkaw03p3BrM"
source: "YouTube·Two Minute Papers"
---

# AlphaGenome：基因组变异预测、全量预计算图谱及其科学应用边界

## 行业认知文章

- 行业：模型层、基础软件与工具链、应用、云与算力服务、其他行业
- 公司：Google DeepMind（AlphaGenome、AlphaGenome Atlas、AlphaFold 及字幕所称 SEMA 项目）；Google（Gemini）；Lambda（结尾赞助推广，链接 lambda.ai/papers）；Nvidia（Lambda 推广中提及的 GPU 提供方）；DeepSeek（字幕写作 Deepseek，在 Lambda 推广中作为聊天机器人或智能体运行示例出现）。
- 来源：YouTube·Two Minute Papers · [原文链接](https://www.youtube.com/watch?v=Wkaw03p3BrM)
- 发布时间：2026-10-08
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
本材料为 YouTube·Two Minute Papers 视频《DeepMind 的新 AI 刚刚破解了生命密码》的完整字幕，原始链接为 https://www.youtube.com/watch?v=Wkaw03p3BrM，标注时长为1996秒。访谈围绕 AlphaGenome 如何预测基因组变异对分子表型的影响展开：模型同时使用人类和小鼠数据，在约100万碱基对的上下文中进行单碱基分辨率预测；主持人称其在26项变异效应基准中的25项追平或超过最强比较模型。AlphaGenome Atlas 则将约90亿种可能的单核苷酸替换效应预先计算，形成受访者所称的拍字节级数据集，并通过变异影响评分帮助研究者筛选值得深入研究的变异。材料强调，模型当前主要预测剪接、基因表达等分子层面的变化，将这些预测连接到疾病易感性及整个人体的表现仍需要研究；分子任务的物理基础和实验室验证也不能直接等同于完全证明模型内部学到了因果机制。后半段讨论了疾病研究、合成生物学、细胞情境建模、Gemini 交互式科学教学，以及算力和算法继续进步后可能开展的虚拟细胞、气候、材料及农业研究。结尾为 Lambda 的赞助推广。以下内容均依据所提供字幕整理；字幕未人工校对，材料未给出具体论文链接、完整评测设置或许可条款，各项结果与规模数字保留原文陈述口径。

### 论点1：AlphaGenome 的核心任务是解释基因组变异对分子层面功能的影响，帮助人类从读取基因组走向理解基因组。
**相应论据：**[0:59–1:42] 受访者将 AlphaGenome 定义为预测基因组变异的机器学习模型，以人类基因组约30亿个字符为例，提出改变一个字符会对细胞及生物体产生什么影响。[1:50–3:41] 基因组被比作生命的配方，既包含表达哪些蛋白质的信息，也包含何时、何地及以何种数量表达的信息；人类基因组计划使人们首次能够读取至少一个人类基因组的完整配方，而理解具体变异的后果仍是持续多年的研究问题。
**相应论证：**原文通过“读取配方”和“理解配方变化”的区别说明研究目标：序列被读出，并不意味着其功能及变异效应已经被理解。AlphaGenome 尝试将序列变化连接到可预测的分子功能变化。疾病风险是这一研究可能进一步连接的方向，原文后续明确说明当前模型与人体疾病之间仍存在待研究环节。

### 论点2：非编码区域的基因调控是基因组理解的重要难点，理解蛋白质种类之外还需要理解其表达方式。
**相应论据：**[6:52–7:58] 受访者将编码部分比作配方中的原料清单，并以人类蛋白质组约2万种蛋白质说明其口径；将非编码部分比作决定蛋白质如何组合、在哪里表达及表达多少的部分，并称这部分是理解较少的基因组“暗区”，涉及基因调控和蛋白质表达。
**相应论证：**原文的论证是，生命功能不仅取决于合成哪些蛋白质，也取决于表达的时间、位置和数量，因此只理解编码序列不足以解释全部基因组功能。AlphaGenome 希望为这一调控空间提供预测和解释。约2万种蛋白质是受访者的概括口径，原文未进一步细分。

### 论点3：单个变异的分子效应预测与复杂疾病或个体差异解释之间仍有距离，许多重要性状涉及多个变异共同作用。
**相应论据：**[3:55–4:50] 主持人以肌肉增长研究为例，描述年龄、身高、体型、饮食及训练相近的人仍有不同反应，但未提供论文名称或具体数据。[4:52–6:14] 受访者指出，有些变异没有实质影响，有些影响重大且机制较清楚，例如导致镰状细胞贫血的特定突变；许多当前关注的问题是多基因性的。AlphaGenome 尤其研究单个变异对分子表型的影响，而这些分子表型如何影响生物体性质及疾病易感性，还需要连接和研究。
**相应论证：**原文以单一突变疾病与多基因现象的区别说明适用边界：识别一个变异的分子后果，是理解复杂性状的一部分。多个变异如何共同作用，以及分子变化如何转化为人体表现，仍需要后续研究。肌肉增长的例子用于提出个体差异问题，不能作为 AlphaGenome 已能解释该问题的验证证据。

### 论点4：AlphaGenome 向科研社区开放使用和模型权重获取，并支持研究者微调，但商业使用条款未在材料中展开。
**相应论据：**[6:16–6:47] 主持人以“所有人永久免费用于非商业用途”提问，受访者回答确认，并进一步表示，类似 AlphaFold 1、AlphaFold 2 的做法，AlphaGenome 向整个科学社区开放学术使用，研究者可用于自己的研究和微调，模型权重可获取。
**相应论证：**原文明确提供了开放使用、权重获取和微调的陈述，但没有展开开放方式如何影响研究效率，也没有提供完整许可文本、商业使用条件或服务条款。关于开放政策的进一步产业效果，原文未展开论证。

### 论点5：同时使用人类和小鼠数据训练，有助于模型学习跨物种的一般规律，而不是局限于人类数据中的特定模式。
**相应论据：**[8:06–9:30] 主持人询问加入小鼠基因组训练是否会改善人类部分的表现。受访者解释，只提供人类数据时，神经网络可能记忆数据或学习仅适用于人类基因组的机制；要求模型在小鼠背景下解释相同类型的效应，会促使其学习能够解释两种基因组变异的一般原则，有助于泛化并识别分子表型中真正重要的因素。[9:33–10:21] 双方将其类比为跨游戏学习及数学与物理之间的迁移学习。
**相应论证：**原文给出的机制是，跨物种训练增加了模型需要共同解释的情境，使仅适用于单一物种的模式不足以完成任务，从而鼓励学习更一般的规律。游戏及学科类比用于说明迁移学习概念；材料没有给出加入小鼠数据前后的量化对比或消融结果。

### 论点6：AlphaGenome 的关键技术进步，是在约100万碱基对的长上下文中同时实现单碱基分辨率预测。
**相应论据：**[10:23–12:41] 主持人概括此前模型在局部精度与远距离观察之间存在取舍，受访者确认。受访者指出，人类基因组约有30亿个碱基对，变异可能因三维相互作用影响较远的位置；前代模型的上下文较小、分辨率较粗，需要合并多个碱基对观察。其称 AlphaGenome 首次同时实现单碱基分辨率和大窗口。[17:38–17:45] 再次确认上下文窗口约为100万碱基对。前代模型名称在字幕中记为 informer。
**相应论证：**原文将两项设计与生物学需求对应：长上下文用于覆盖较远的调控和相互作用，单碱基分辨率用于处理需要精细定位的变化。二者结合，使模型既能关注变异附近的细节，也能考虑更大范围内的信息。“首次实现”是受访者的陈述，材料未给出完整模型比较表。

### 论点7：材料报告 AlphaGenome 在多数变异效应基准中领先，并将结果归因于分辨率、上下文和训练方法的共同改进。
**相应论据：**[12:44–12:58] 主持人称，AlphaGenome 在26项变异效应基准中的25项追平或超过最强比较模型。[13:07–14:16] 受访者说明项目需要数据、模型架构和训练方法等多方面创新，并表示结果支持团队最初的假设：提高分辨率、扩大上下文窗口并适当进行训练正则化，能够改善结果。[14:26–15:07] 受访者称团队谨慎开展指标和评估工作，结果出现后会再次检查，并强调项目已持续近四五年或更久。
**相应论证：**原文以多项基准结果支持模型性能改善，并以重复检查及长期评估经验说明团队对结果的信心。不过，材料没有列明26项基准、各项成绩、数据划分或消融实验，因此不能据此单独量化各项改进的贡献，也不能将团队的评估信心视为已独立核验。

### 论点8：AlphaGenome Atlas 将逐个查询变异效应扩展为全量预计算的单核苷酸替换效应字典。
**相应论据：**[15:08–16:37] 受访者说明，AlphaGenome 可以回答某个碱基从 A 改为 T，或从 T 改为 C 后会发生什么。按约30亿个位置、每个位置可替换为另外3种碱基计算，共有约90亿种可能的单核苷酸变异。每种变异可产生剪接、基因表达等分子效应信息；AlphaGenome Atlas 预计算这些结果，形成拍字节级数据集并向科研社区提供。
**相应论证：**原文通过“位置数乘以每个位置的替换数”解释预计算规模，并将图谱比作变异效应字典。这里的约90亿种指可能的单核苷酸替换，原文没有将其扩展为多个变异的全部组合或所有变异类型。图谱内容是模型预测结果，材料未声称这些结果都已逐项实验验证。

### 论点9：AlphaGenome Atlas 的数据规模被描述为 AlphaFold 数据库的30倍，显示基因组变异预测具有更高的信息量。
**相应论据：**[16:54–17:35] 受访者称，AlphaFold 曾预测约2.5亿种蛋白质结构，覆盖当时几乎所有已知蛋白质；AlphaFold 数据库已被190个国家超过400万名用户使用。随后明确表示，按实际数据大小衡量，AlphaGenome Atlas 是 AlphaFold 数据库的30倍，并称其产生变异详细效应信息的规模前所未有。
**相应论证：**原文以 AlphaFold 的数据库及使用规模作为参照，突出 AlphaGenome Atlas 的数据体量。30倍比较对应实际数据大小，不能解释为模型准确率、研究价值或用户规模的30倍；190个国家和超过400万用户也仅对应 AlphaFold 数据库。材料未给出两个数据库的具体字节数及统计日期。

### 论点10：模型可以预测部分变异效应的大小，但材料给出的相关性仅对应特定任务的概括结果。
**相应论据：**[17:46–18:15] 主持人称，对于影响基因活动的突变，预测与观测效应大小之间存在较强相关性，论文中的相关系数 ρ 约为0.5，并询问模型是否经常能大致预测效应幅度，而不仅是判断变异是否重要；受访者确认。
**相应论证：**原文以预测效应与观测效应的相关性，支持模型能够估计变化幅度的说法。约0.5是主持人引用的近似数值，材料未交代样本量、具体实验、相关系数计算细节或置信区间，也没有将其推广为全部任务或临床疾病风险预测的统一指标。

### 论点11：变异影响评分旨在帮助研究者对海量变异进行优先级筛选，而不是直接给出疾病诊断。
**相应论据：**[18:15–19:05] 受访者表示，为帮助科学家探索海量数据，团队设计并仔细校准了 AlphaGenome 变异影响评分：高分意味着该变异值得认真分析；低分则意味着有较高信心认为其不会对多种表型产生剧烈影响。字幕先将评分简称记为 AVI，后又出现 AVS，缩写存在转写不一致。
**相应论证：**原文把评分解释为研究筛选信号：高分用于提示进一步分析，低分用于判断发生显著影响的可能性较低。其没有给出评分阈值、校准数据、误差分布或临床用途，也没有将高分等同于致病、将低分等同于完全无影响。

### 论点12：基因组变异解释被视为基础性科学问题，可能支撑疾病理解、治疗研究及合成生物学等多种用途。
**相应论据：**[19:42–20:22] 受访者称，解读基因组有助于理解疾病及研究如何治疗疾病，包括识别疾病通路相关蛋白质的表达调控位置和变异。[20:25–21:32] 其将用途扩展到更广泛的生物学与合成生物学，提到生成式人工智能以及 EVO 等 DNA 语言模型可以生成或采样不同基因组，AlphaGenome 则可以作为研究这些基因组性质的观察工具，并预期模型及后续版本用途广泛。
**相应论证：**原文的连接路径是：疾病及合成生物学问题都涉及基因组如何影响表达和功能，因此变异效应预测可为不同研究方向提供基础信息。EVO 的例子说明生成候选基因组与分析其性质之间的配合，但材料没有展示实际设计成功案例、疗效数据或产业化结果。

### 论点13：分子层面预测和实验室验证有助于研究机制，但原文并未证明模型内部已经完整掌握因果关系。
**相应论据：**[21:44–23:32] 主持人追问如何确认模型学习了机制而不是相关性。受访者表示，AlphaGenome 预测剪接位点、剪接及基因表达等分子性质，这些结果能够用生物物理学解释；其不是直接声称某变异造成某疾病，而是描述细胞层面发生什么。受访者还称，将预测带到实验室验证时，可以看到预测合理并发现新的重要变异。[23:39–23:58] 受访者明确补充，任务具有物理基础，但模型究竟如何完成任务，团队仍在研究和解释。
**相应论证：**原文提出两种支持机制研究的依据：预测对象更接近具体分子过程，且预测可以接受实验检验。但任务本身有物理基础，不等于模型内部机制已经被证明；受访者保留了对内部解释的研究不确定性。材料也未提供具体实验、验证成功率或因果干预设计。

### 论点14：复杂模型之上使用简单的套索正则化预测层，被解释为底层特征表示已经完成了大部分工作。
**相应论据：**[24:02–24:59] 主持人提到，论文在复杂的 AlphaGenome 学习算法之上使用了很简单的套索正则化层。受访者认为这体现了表示能力：模型应在理解 DNA 序列及形成特征表示时完成主要工作，因此上层最终预测器可以采用非常简单的形式。
**相应论证：**原文将特征表示质量与上层预测器复杂度联系起来：如果模型已提取有用信息，最终预测步骤可以较简单。材料没有给出替换上层模型的比较结果，也没有单独证明套索正则化带来的性能贡献；关于这一设计的结论主要是受访者的解释。

### 论点15：后续研发重点包括增强细胞情境感知、扩大训练数据，以及连接分子表型与生物体和疾病层面的表现。
**相应论据：**[25:00–26:20] 受访者称 AlphaGenome 仍需要改进。由于不同细胞行为不同，团队希望模型更清楚预测所处的生物学情境；同时扩大训练数据以提高不同性质的预测准确性，并推动模型产生的分子表型与人体层面性质、疾病易感性之间的连接。
**相应论证：**原文将研发方向与现有问题直接对应：不同细胞需要不同情境信息，数据扩展被用于提高预测准确性，而分子结果的用途还需要通过研究连接到生物体层面的表现。这些均为团队正在探索的方向，材料未给出完成时间、性能提升目标或已实现结果。

### 论点16：Gemini 的科学教学价值可以来自交互式可视化，而不只是文字解释，但示例的物理准确性有限。
**相应论据：**[26:30–28:05] 受访者讲述此前几周与儿子讨论风洞、飞机部件设计及仿真时，Gemini 不仅解释概念，还生成了可以调整参数并观察气流变化的仿真。其明确表示该仿真并非完全准确，但能很好地展示可能性，并通过视觉产物帮助理解概念。[28:07–28:52] 主持人以自己学习流体仿真耗费数月的经历，对提示后即可生成示例的能力表示惊叹。
**相应论证：**原文通过参数可调和结果可视化的示例，说明生成式人工智能能够让学习者观察理论如何表现。该证据是个人使用经历，受访者同时保留了准确性限制；材料没有提供教学效果评估或仿真误差测试，因此只能支持教学演示潜力。

### 论点17：若人工智能能力继续大幅提升，虚拟细胞和生物体仿真可能成为重要研究方向，并影响疾病及合成生物学研究。
**相应论据：**[29:00–29:21] 主持人以过去10年人工智能综合提速约100万倍为假设口径，说明其中包括硬件、变换器架构、实现和工程改进，并进一步假设未来10年再提升100万倍。[29:21–30:05] 受访者指出，模拟细胞、建立虚拟细胞仍超出当前能力；如果能够充分理解细胞运作，会对癌症研究及合成生物学产生重大影响，进而可设想模拟整个生物体。
**相应论证：**原文采用条件性推演：更强的计算和理解能力，可能让目前无法完成的复杂生物系统仿真成为研究对象。两个100万倍均来自主持人的概括或假设，材料未给出测量口径或预测依据；原文也未论证达到某个提速倍数即可实现虚拟细胞，更没有给出兑现时间表。

### 论点18：人工智能科学应用的远景还包括长期气候、能源材料、农业、大脑及材料性质研究，但这些方向在原文中仍是探索性设想。
**相应论据：**[30:05–30:59] 受访者列举长期气候及行动后果研究、更高效储存和转换能量的新材料，以及从第一性原理理解生物学并设计新功能以应对健康和农业问题。[31:26–32:19] 其进一步提到理解大脑、解释材料性质及设计具有新性质的对象，并以超导为例，称目前缺乏完整理论、已有理论较狭窄。
**相应论证：**原文以尚未充分理解的自然现象和复杂系统作为例子，表达科学人工智能未来可能拓展的研究空间。关于具体算法、所需数据、计算规模、实验路径及可达成的效果，原文未展开论证；超导理论的评价也是受访者陈述，材料未进一步界定其适用范围。

### 论点19：结尾的 Lambda 赞助段展示了 GPU 云服务的科研使用场景，但不足以证明其性能或商业竞争力。
**相应论据：**[32:41–33:14] 主持人在赞助推广中表示，自己使用 Lambda 复现人工智能论文，并称有时只需几分钟；还列举模型训练、微调、推理、文生图或视频，以及运行 DeepSeek 聊天机器人或智能体。其称 Lambda 提供 Nvidia GPU，并使用“快速、可靠”等宣传表述，推广链接为 lambda.ai/papers。
**相应论证：**该段以主持人的使用体验列举服务场景，未提供硬件配置、任务规模、计时标准、价格、可靠性统计或竞品对比。对“几分钟复现”“快速、可靠”等宣传判断，原文未展开论证；不能将其视为访谈技术结果或独立评测。

## 值得关注的信号

材料体现的产业意义是：基因组人工智能正在从单次变异预测工具，扩展为可开放使用的模型、预计算数据集及研究筛选工具，潜在用途覆盖疾病机制研究、治疗相关调控位置识别和合成生物学。对相关技术与项目的判断，需要分别考察分子表型预测的可靠性、实验验证、细胞情境覆盖，以及分子结果与人体疾病之间的连接，不能直接将基准领先或数据库规模解释为临床有效性。受访者确认科研及非商业用途开放、模型权重可获取并可微调，但原文未提供商业使用许可、收费机制、收入、成本或商业化进展，因此无法据此判断价值捕获方式或投资回报。Gemini 的教学示例展示了交互式可视化的应用潜力，同时明确存在准确性不足；虚拟细胞、材料设计等属于条件性远景。Lambda 段落说明了科研训练、微调和推理对 GPU 服务的使用场景，但属于赞助宣传，没有可用于评估经营表现或竞争力的独立数据。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"605af07c32e11c99e6e9765da97fb81f497645f5f93fc3928ae0e8b4d31c4101","translationSha256":"6e87907d37efcf74a9ef81fad450551d33db35bd41bc7b2e9af033d879cd6ff9","sourceCharacters":34497,"timestampValues":777,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":777,"captionTimestampsManagedByProgram":true,"captionRepairedRows":1} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# DeepMind 的新 AI 刚刚破解了生命密码

- 来源：YouTube·Two Minute Papers

- 原始链接：https://www.youtube.com/watch?v=Wkaw03p3BrM

- 时长：1996 秒


## 完整文字稿

[0:00] 如果你能够彻底地、真正地
[0:02] 理解细胞的运作方式，
[0:05] 那将对抗击
[0:08] 癌症等疾病产生惊人的影响。
[0:10] >> 我觉得自己像是被扔进了一部
[0:12] 科幻电影里。我们，我们以前只能
[0:14] 梦想着拥有这样的技术，
[0:17] 那时我还是个孩子。现在我也有
[0:19] 一个问题，我在想，也许
[0:22] 只有你能回答这个问题。
[0:24] >> Alpha Genome Atlas 做的事，就是
[0:26] 基本上预先计算了所有这些内容。Alpha
[0:30] Genome Atlas 的规模是 30 倍
[0:33] 于 AlphaFold 数据库。哇。所以，其规模
[0:36] 使得 Alpha Genome 能够生成
[0:40] 关于……影响的详细信息
[0:42] [清嗓子] 变异
[0:43] 这是前所未有的。
[0:45] >> 很高兴见到你，Push。你看，这
[0:47] 对我来说真的很有挑战性，因为这
[0:49] 完全超出了我的
[0:52] 专业领域
[0:53] >> 如果我真有什么专业领域的话。一如既往，我今天来这里
[0:55] 是以学生的身份向你
[0:57] 学习。什么是 Alpha Genome？
[0:59] >> Alpha Genome 是一种机器学习模型，
[1:03] 用于预测基因组中的变异。
[1:08] 所以，我们的基因组，呃，不只是
[1:13] 人类基因组，基因组
[1:16] 基本上就是生命的配方。呃，它
[1:19] 本质上是一种代码。以人类为例，
[1:21] 这是一种包含三十亿个字符的
[1:24] 代码。
[1:27] 如果其中一个字符发生变化，
[1:30] 对细胞的实际
[1:34] 特性会产生什么影响？会产生什么影响
[1:36] 对生物体有什么影响？这些就是
[1:40] Alpha Genome 正试图以某种方式
[1:42] 揭示的东西。
[1:43] >> 如果你是普通人，
[1:45] Alpha Genome 最终会怎样改变
[1:47] 医学或他们的生活？
[1:50] 每个人都会在某种程度上受到……的影响
[1:54] 基因组层面发生的事情。嗯，
[1:58] 基因组是生命的配方。它包含
[2:01] 成分部分，说明
[2:03] 哪些蛋白质……会表达，以及
[2:07] 某种混合部分，讲述
[2:09] 基因调控
[2:12] 嗯，这些蛋白质何时表达
[2:15] 在哪里表达，以及表达多少
[2:16] 数量
[2:17] >> 而所有这些信息都编码在
[2:21] 这份生命配方里。地球上的每一个
[2:23] 人都有一份配方。我
[2:27] 有一份配方。你有一份配方。那个
[2:29] 普通人也有一份配方。我们所有
[2:31] 人的配方虽然相似，
[2:35] 但也有一些变化。可是这些
[2:38] 变化实际上意味着什么？这些变化
[2:41] 会带来什么影响？
[2:43] 这就是我们多年来一直试图
[2:46] 理解的事情，甚至已经持续了几十年。
[2:49] 借助人类基因组计划，
[2:52] 我们首次得以读完
[2:54] 整本配方书，至少是一个人类
[2:58] 基因组的完整配方书。呃，但现在我们
[3:03] 正试图弄清楚如何破译
[3:05] 它，或者理解如果你在某个特定
[3:08] 字符上做出改变，究竟会发生什么。
[3:10] 这会有什么后果？
[3:13] 会导致某种特定疾病吗？
[3:16] 这基本上会和……有关吗？
[3:19] 对某种……的易感性较高，
[3:23] 比如某个……问题，例如可能有
[3:27] 较高的体重指数，或者更容易
[3:29] 患上某些癌症。所有
[3:32] 这些事情在某种程度上都可以通过
[3:36] 更好地理解……所发生的变异来
[3:39] 解读
[3:41] 基因组。
[3:42] >> 嗯。这真是不可思议。我确实
[3:44] 很想问这个问题，因为
[3:48] 我的问题是，我时不时会试着
[3:50] 读医学论文。这不是我的专业领域，
[3:52] 但我……我是个学生。我只是
[3:54] 想学点东西。
[3:55] >> 是啊。
[3:55] >> 我的问题是，每当我读到
[3:58] 关于……我也不知道，任何一种药物的内容时。
[4:00] 我的问题是，每个人都
[4:03] 不一样。
[4:04] >> 是啊。
[4:05] >> 我去理发，理发师
[4:07] 就会说，他从来没见过两个脑袋
[4:09] 一模一样。对。
[4:10] >> 我读过一篇关于肌肉肥大的论文，
[4:14] 就像……像一篇健美论文，讲怎么
[4:16] 练出肌肉，里面有一群
[4:18] 经过仔细挑选的人，年龄相同，
[4:22] >> 身高相同，体格相同，
[4:24] >> 他们吃同样的饮食，进行同样的
[4:27] 训练，结果有一个人变得肌肉
[4:30] 极其发达。他们还做了测量。
[4:31] >> 是啊。
[4:32] >> 其他一些人长了点肌肉。有一个
[4:34] 可怜的家伙一点肌肉都没长。
[4:36] 还有一个，我觉得体重下降了
[4:38] 肌肉。就像这真的很疯狂，我们有多么不同。
[4:41] 我在想，我们彼此
[4:44] 不同这件事，是否意味着我们有可能
[4:46] 终于离……更近了一步
[4:47] 理解每个人都有多么不同，以及这
[4:50] 意味着什么。
[4:52] >> 对，没错。我想，这种
[4:54] 对生命密码的理解或解读
[4:56] 会带来什么后果？
[4:59] 有时候，这些后果可能
[5:01] 毫无意义，对吧？比如，有时候这些
[5:03] 变化，呃，并没有那么
[5:07] 重大。有时候，它们会带来非常
[5:08] 重大的后果，而且这些后果
[5:11] 我们已经非常了解了，对吧？比如，
[5:13] 镰状细胞贫血。有
[5:16] 一种特定类型的突变
[5:18] 会导致镰状细胞贫血，而我们
[5:21] 了解其中会发生什么。但大多数
[5:24] 如今你们关心的那些事情
[5:25] 都……呃……都是
[5:29] 多基因性的，也就是说，
[5:31] 有多个……呃……突变
[5:33] 在发挥作用，导致了
[5:37] 那种特定的……呃……情况，或者那种
[5:39] 特定的现象。从某种意义上说，
[5:41] AlphaGenome 试图做的，就是
[5:44] 弄清楚……尤其是
[5:46] 在单个……呃……
[5:49] 突变变异层面……呃……在
[5:52] 分子表型层面会发生什么。那这些
[5:55] 分子表型……呃……又会如何
[5:58] 影响整个……整个生物体的属性，
[6:01] 或者就人类而言，影响
[6:04] 人类……人类的感受，比如
[6:06] 对特定疾病的易感性。
[6:09] 这仍然需要进一步关联起来，并且还需要
[6:11] 开展一些研究
[6:14] 这件事大概需要处理一下。
[6:16] >> 我的理解是，在我们深入探讨之前，
[6:18] AlphaGenome 永远向我们所有人免费开放，
[6:20] 用于非商业用途。是的，
[6:24] 没错。所以，正如我们对许多
[6:27] 科学模型所做的那样，无论是 AlphaFold 1、Alpha
[6:30] Fold 还是
[6:33] 2 U AlphaGenome，我们都让它
[6:37] 对整个科学界开放，
[6:40] 供学术用途，
[6:42] 让他们可以用它开展自己的
[6:45] 研究，也可以对它进行微调，
[6:47] 并且模型权重是开放的。
[6:50] 这些说法是真的吗？请解释一下。
[6:52] >> 是啊。
[6:52] >> 基因组是细胞的
[6:55] 说明书。
[6:56] >> 完全正确。我认为，基因组正如我刚才所说，
[6:59] 就像一本食谱。
[7:01] 它既有基因组的编码部分，
[7:04] 就像是食谱中的原料
[7:06] 部分，食谱会说明
[7:08] 需要合成哪些蛋白质。
[7:12] 所以，
[7:14] 人类蛋白质组有 20,000 种蛋白质。
[7:16] 我们的基因组
[7:19] 编码了这些 20,000 种蛋白质，而且
[7:21] 这些 20,000 种蛋白质可能存在变异。
[7:24] 然后还有非编码部分，
[7:26] 它负责观察这些蛋白质
[7:28] 是如何混合的，
[7:31] 这些蛋白质又是如何表达的，
[7:33] 它们在哪里表达，
[7:35] 表达量是多少，而这部分基本上是
[7:38] 基因组中那片晦暗的区域
[7:40] 人们对它的了解要少得多，因为它
[7:43] 某种程度上涉及基因的调控
[7:46] 嗯，以及基因和蛋白质的表达，嗯
[7:50] 所以我认为 AlphaGenome 想要做的
[7:53] 是试着，某种程度上，嗯，嗯
[7:55] 以某种方式解读并说明这，这
[7:58] 整个领域。现在我还有一个
[8:00] 问题，我在想，也许
[8:03] 只有你能回答这个问题。所以
[8:06] 我，我真的很好奇这件事。这
[8:08] 是用人类和小鼠的基因组训练的。
[8:11] >> 是的。
[8:12] >> 我很想知道的是
[8:14] 你用人类基因组训练它。
[8:17] 它就会具备一定程度的知识，也，也
[8:19] 也会有一定质量的结果。然后你
[8:22] 再用小鼠基因组训练它。之后
[8:26] 它在人类基因组这部分的表现会更
[8:29] 好吗？
[8:29] >> 是的。所以我认为，目前我
[8:32] 我的意思是，你们多少已经在
[8:35] 许多不同的地方看到过这种情况，在
[8:37] 机器学习中，神经网络试图
[8:40] 拟合数据，而如果你只给它
[8:44] 人类数据，神经网络
[8:47] 就有这样的倾向：它会
[8:49] 记住，或者某种程度上，嗯，嗯，思考
[8:52] 只在人类基因组情况下才有效的
[8:55] 机制。但是通过
[8:59] 训练它，迫使它，迫使
[9:01] 模型在小鼠基因组的
[9:04] 背景下解释同样的效应，我们
[9:08] 是在要求这个模型拓宽思路
[9:11] 并思考能够解释这两种情况的
[9:13] 一般性原理
[9:15] 不同类型的变异。而且
[9:17] 这不仅有助于模型
[9:20] 泛化，也能让模型
[9:24] 在某种程度上学会，呃，了解
[9:26] 什么才是真正重要的，以及究竟
[9:27] 在生理层面上发生了什么，呃，
[9:30] 也就是那些分子表型的情况。
[9:33] 我在 Google DeepMind 的另一篇
[9:35] 论文里见过类似的内容，那是 SEMA 项目，
[9:38] 它玩了很多电子游戏。我
[9:39] 觉得很惊人：你玩一款
[9:42] 电子游戏，在里面取得一些分数，
[9:45] 然后玩了许多其他
[9:47] 电子游戏之后，你在这款游戏里就变得更厉害了。
[9:50] >> 我觉得
[9:50] >> 看起来这可能是同一种
[9:52] 现象，但听起来
[9:53] 像智能，对吧？你，你
[9:55] 把从其他
[9:58] 事物中学到的知识应用到这个事物上。
[9:59] >> 是的，我觉得这就是迁移学习
[10:01] 的实际体现，你能够
[10:04] 从相关但
[10:07] 不同的问题中提取概念，
[10:10] 这能帮助你变得更厉害，对吧？所以如果
[10:13] 你，呃，解数学题，
[10:16] 然后再解物理题，
[10:18] 只要数学能力变强，就能
[10:21] 让你物理也学得更好。据我了解，
[10:23] 这里的重大进展是，
[10:26] 以前的模型要么视野过于狭窄，
[10:28] 目光短浅，
[10:31] 要么从远处观察，但分辨率
[10:34] 很低。现在这个模型两者都能做到。
[10:37] 两者。
[10:38] >> 是的。
[10:39] >> 对还是错？
[10:40] >> 这是对的。所以，当我们开始这段旅程、着手应对解读基因组这一极具雄心的挑战时，
[10:44] 遇到了极其
[10:47] 艰巨的技术挑战。
[10:49] 嗯，我们的基因组，正如我刚才
[10:52] 挑战。呃，我们的基因组，正如我刚才
[10:55] 提到的，大约有 3 十亿个，算是碱基
[11:00] 长的
[11:05] 序列。如果你想
[11:07] 了解某个
[11:10] 特定变异的
[11:12] 影响，就需要
[11:16] 查看它周围更广泛的、范围更大的
[11:19] 区域，因为它可能会影响
[11:22] 相距很远的事物，
[11:24] 这是由于3D相互作用等等。
[11:25] 并不是某个特定的碱基
[11:28] 对只会影响它
[11:31] 附近发生的事情；它周围的区域
[11:32] 可能非常大。所以，早期的
[11:35] 模型版本中，我们有一个
[11:38] 名为 Informer 的模型，它先于
[11:41] AlphaGenome。当时模型的上下文
[11:44] 窗口
[11:46] （也就是我们查看
[11:49] 周边区域的范围）比较小，
[11:53] 而且我们试图分析基因组时所用的
[11:55] 分辨率也
[11:58] 粗糙得多。
[11:59] 对吧？我们没有观察
[12:01] 碱基对层面上发生的情况。我们
[12:03] 看的大致是把大量
[12:06] 碱基对
[12:08] 放在一起观察，而且我们看的不是1
[12:10] 百万碱基对的窗口。我们
[12:12] 看的窗口要小一些。
[12:15] AlphaGenome 想要做的是
[12:18] 成为首个实现这一目标的模型，也就是
[12:20] 以碱基对分辨率运行，并且
[12:23] 拥有非常大的窗口，呃，而且
[12:26] 这使它不仅能够进行某种
[12:29] 精度很高的预测，而这
[12:32] 需要非常高的精度、精度，
[12:34] 还能够，呃，做出一些预测，
[12:36] 这些预测需要对更大范围内的
[12:38] 发生的各种事情进行推理，
[12:41] 也就是该变异附近的事情。
[12:44] 我看到它表现得如此出色，它匹配了
[12:47] 最强的对比模型，或者胜过了它，
[12:49] 在25项26变异效应
[12:53] 基准测试中。我想只有在 AlphaFold 发布时，
[12:56] 我才听说过这种程度的领先
[12:58] 这实在令人难以置信。现在我想
[13:00] 问你，当你看到它
[13:03] 首次开始奏效时，
[13:04] >> 嗯。
[13:05] >> 你是什么感觉？
[13:07] >> 是的。所以我想有一点，嗯，我们
[13:11] 一直在研究这个
[13:12] 问题已经很久了，和我们的许多
[13:14] 科学挑战一样。嗯，这些都是
[13:20] 极其困难的问题，嗯，
[13:22] 需要在许多不同方面进行创新，
[13:25] 比如数据，以及，呃，想出
[13:28] 更好的架构，想出
[13:30] 新的训练思路，
[13:33] 等等。当我们开始看到这些
[13:36] 结果时，我们知道，呃，我们进入了
[13:39] 一个不同的阶段，而，呃，其中一部分
[13:44] 是预料之中的，因为我们已经完成了所有
[13:46] 艰苦的工作，使训练能够
[13:49] 在那种分辨率下进行，而这曾经
[13:51] 以前从未有人这样做过。但要
[13:53] 把它做好，并真正证明
[13:56] 呃，我们最初提出的假设——
[13:59] 如果提高
[14:02] 分辨率，如果扩大上下文
[14:04] 窗口，如果对训练进行
[14:06] 恰当的正则化，那么神经网络就会
[14:10] 呃，呈现出正确的结果
[14:13] 所以，看到这一点确实让
[14:16] 整个团队都很受鼓舞。有没有一个
[14:18] 怀疑的阶段，觉得这、这、这不可能
[14:20] 是对的，你知道，也许、也许我们
[14:23] 是在训练集上测试的，或者
[14:25] 什么的。
[14:26] >> 是的。所以我觉得这正是我们团队
[14:28] 的特点，我们是非常、非常
[14:31] 谨慎的科学家。所以，呃，我们在
[14:33] 指标和评估方面做了
[14:35] 很多工作，所以
[14:39] 结果出来时，你会，你会有一种
[14:42] 真切的，呃，
[14:45] 预期，觉得自己会
[14:47] 呃，呃，再检查一遍，确保
[14:50] 一切都在正常运行，而且这些
[14:52] 结果是有效的。不过，呃，我们对
[14:54] 自己设定的指标很有信心，确信
[14:57] 我们把它们设定正确了，
[14:59] 因为这不是我们在过去一直
[15:01] 做的事情——3
[15:02] 几个月，而是一个
[15:04] 已经持续了将近四五年
[15:07] 甚至更久的项目。
[15:08] >> AlphaGenome Atlas 是什么？
[15:10] >> AlphaGenome Atlas 本质上是，呃，
[15:15] 一部关于基因组发生变异时会
[15:19] 出现什么情况的词典。
[15:20] 所以，我现在已经跟你介绍了 Alpha Genome。
[15:22] Alpha Genome 的作用是查看，嗯，
[15:25] 你的基因组，你可以问它
[15:27] 这样一个问题：如果我把这个碱基对，呃，
[15:31] 或者你基因组里的这个字符，从
[15:34] A 改成 T，或者从 T 改成 C，会有什么
[15:37] 后果，
[15:39] 这非常有帮助。不过，假设你
[15:42] 想了解所有变异的影响，
[15:44] 所有变异。
[15:46] 现在，变异有很多，
[15:48] 因为有三
[15:50] 十亿个碱基对，而且它们每个都可以
[15:52] 有三种方式发生改变，对吧？A
[15:55] 可以变成 T、C 或
[15:58] G，对吧？所以有 9 billion 种
[16:00] 可能的单核苷酸变异，
[16:03] 你可以对它们进行研究。对于每一种
[16:07] 变异，都有大量数据，
[16:09] 你可以，呃，你可以提取这些数据，
[16:11] 了解它在
[16:13] 分子层面的影响，呃，对剪接的影响，
[16:15] 对基因表达等方面的
[16:18] 影响。Alpha
[16:21] Genome Atlas 所做的，就是基本上
[16:23] 预先计算所有这些结果。
[16:26] >> 它基本上会查看所有这些
[16:28] 变异会产生什么影响，然后把这些
[16:31] 海量数据集——一个拍字节大小的数据集——
[16:34] 提供给
[16:37] 科学界。
[16:38] >> 这太不可思议了。感觉就像 AlphaFold
[16:41] 时刻，当时折叠的推理耗时
[16:43] 变得，你知道，非常短。对。后来有一度，Damis
[16:46] 只是说，你知道，我们来把所有东西都折叠
[16:48] 吧。
[16:50] 蛋白质图谱听起来就像是那样
[16:52] 针对基因组的。
[16:54] >> 没错。所以，我是说，对于 Alpha Alpha
[16:56] Fold，我们，嗯，我们对这些结构做出了预测
[17:01] 涵盖了 250 百万种蛋白质的
[17:04] 几乎是当时已知的所有蛋白质。
[17:06] 但是
[17:10] 即使是 AlphaFold 数据库，它现在也已经被
[17:12] 超过 4 百万名用户使用
[17:15] 遍及 190 个国家。就实际规模而言，Alpha
[17:19] 就其实际规模而言
[17:22] 是 AlphaFold 数据库的 30 倍大。
[17:25] 哇。
[17:27] >> 哇。
[17:28] >> 所以，Alpha Genome
[17:31] 能够生成如此大规模、如此
[17:34] 详尽的信息，说明变异
[17:35] 所产生的影响，这前所未有。所有这些信息
[17:38] 都来自一个兆碱基的 DNA 序列。
[17:40] >> 是的。所以，在一个 1 百万左右的
[17:43] 碱基对窗口中，结合上下文
[17:46] >> 对于那些会影响基因活性的突变
[17:49] 预测的影响大小与观察到的影响大小之间
[17:51] 有相当强的相关性。论文中我看到那一行
[17:53] 大约是
[17:56] 大约是 0.5。
[17:58] >> 嗯。
[17:59] >> 但是，但是这太惊人了。
[18:01] >> 嗯。
[18:01] >> 这真是太不可思议了。而且，呃，我
[18:04] 的理解是，它不
[18:06] 只是预测某个突变是否重要，
[18:10] 还常常能大致正确地预测其
[18:12] 影响的大小。这样说公平吗？
[18:14] 是吗？
[18:15] >> 是的，完全正确。我认为我们所做的
[18:18] 尤其是 Alpha Genome Atlas
[18:20] 我们提出了一种新的方法来整理
[18:26] 帮助科学家
[18:28] 整理数据并进行探索
[18:31] 这些海量数据。所以 Alpha
[18:35] Genome 变异影响评分，简称 AVI
[18:38] 评分经过了精心的
[18:42] 校准。如果分数很高
[18:45] 那就意味着这个特定的
[18:48] 变异值得你
[18:51] 认真思考和分析，仔细地
[18:54] 分析。如果 AVS 评分
[18:58] 较低，你可以有很高的信心
[19:00] 认为它不会产生重大的
[19:02] 影响，涉及各种不同的
[19:05] 表型。
[19:06] >> 嗯。对我来说，这听起来像是
[19:08] 那些根节点问题之一：你解决了这个问题，
[19:11] 然后它的
[19:14] 应用就能向许多
[19:16] 方向扩展。我时不时会看看 AlphaFold，
[19:19] 它就是这样一个
[19:20] 根节点问题。最初的
[19:23] 几年里，
[19:24] >> 我还能翻阅
[19:26] 那些使用它的论文，并试着
[19:29] 弄明白它们做了什么。但现在，建立在 AlphaFold
[19:32] 之上的东西已经太多了
[19:35] 多到我们任何人都完全不可能
[19:37] 全部理解。Alpha Genome 看起来会
[19:39] 也变成
[19:41] 同样的情况吗？
[19:42] >> 是的，我认为 Alpha Genome——借助 Alpha
[19:44] Genome，我们正试图解决那个根节点
[19:46] 问题：解读基因组，
[19:48] 对吧？正如你提到的，
[19:51] 它，它确实真的是一个根节点
[19:53] 问题节点问题，就其
[19:56] 影响而言。所以它的影响不仅限于
[19:59] 更好地理解某种意义上的
[20:02] 呃疾病，它也会影响
[20:04] 你会如何治疗
[20:06] 疾病。呃，有哪些关键的
[20:09] 事情是你需要去
[20:10] 理解生物学，以及哪些是
[20:13] 你可以控制
[20:15] 表达的地方，或者哪些变异会
[20:17] 在某种程度上控制表达，呃，某些
[20:20] 蛋白质，而这些蛋白质与该疾病
[20:22] 的发病通路有关。但它不只是
[20:25] 呃，适用于理解
[20:29] 呃疾病和人类健康。呃，它的
[20:32] 影响还超越了，呃，更广泛的
[20:35] 生物学范畴。所以事实上，呃，
[20:38] 现在我们看到，呃，有很多人
[20:42] 对在
[20:45] 合成生物学中使用生成式人工智能感兴趣；而且，当你
[20:47] 在合成某种，呃，新的
[20:50] 生物体或新的蛋白质时，比如说，
[20:53] 这些蛋白质应该具有什么特性，呃，
[20:56] 我们应该考虑哪些特性，对吧？就像
[20:58] 你可能已经见过 DNA 语言
[21:01] 模型，比如 EVO，呃，已经出现，
[21:04] 人们在用它们采样
[21:07] 不同的基因组，以此来解决
[21:10] 不同类型的问题，而且
[21:13] AlphaGenome 给你提供了一种视角，
[21:16] 让你可以研究
[21:19] 这些基因组的特性。所以，呃，这个模型
[21:23] 以及它未来的各种变体，呃，
[21:26] 我们正在开发这些变体，我
[21:28] 认为它们会以某种方式发挥作用
[21:32] 嗯，非常广泛
[21:34] >> 我觉得自己像是被扔进了一部
[21:36] 科幻电影里，就像我们我们
[21:38] 小时候只能梦想拥有这样的技术
[21:40] ，这真是，我
[21:42] 觉得这太不可思议了，我们怎么知道
[21:44] 它学到的是机制，而不仅仅是
[21:47] 相关性呢？通常这就是
[21:49] 许多这类
[21:51] 论文的问题所在，困难之处在于
[21:53] 实际上证明两者之间的联系
[21:55] 在很多情况下几乎是不可能的
[21:57] 案例
[21:58] >> 是的，所以我觉得这是个很好的
[22:00] 问题，我觉得这也一直是
[22:02] 面临的某种挑战之一，对吧？当你
[22:04] 研究计算生物学时，
[22:06] 你不想只学习所有的
[22:09] 统计相关性。你想
[22:12] 让模型能够，呃，你希望模型
[22:15] 能够理解
[22:17] 实际发生的某种因果联系，
[22:20] 正是这些联系让预测成为可能。
[22:24] 而且，呃，如果你想一想
[22:27] AlphaGenome 是如何将这一点
[22:30] 编码进去的，其中一点是它所预测的
[22:33] 属性。它预测
[22:36] 分子层面的属性。
[22:38] 所以，当它
[22:42] 对某种特定变异，
[22:46] 比如剪接位点、
[22:49] 剪接或基因表达，做出预测时，你确实可以看到这一点。这些
[22:51] 都是非常，呃，呃，呃，这些
[22:54] 预测是可以
[22:56] 从生物物理层面解释的，
[22:58] 对吧，而不是从相关性角度来解释。
[23:00] 也就是说，发生了这种变异。
[23:02] 基本上会导致那种特定的
[23:04] 疾病，但这个 AlphaGenome 并不是
[23:07] 在说它基本上实际上
[23:09] 是在告诉你细胞
[23:10] 层面上发生了什么，然后就
[23:12] 验证而言，我们看到的是
[23:16] 实际上，当你做出这些
[23:18] 预测，并真正尝试在实验室里
[23:20] 验证它们时，我们会发现这些
[23:22] 预测是说得通的，而且你可以得出
[23:25] 一些新的发现，关于变异，以及
[23:30] 某些变异的
[23:32] 重要性。
[23:33] >> 本质上，因为整个东西
[23:34] 都基于物理学。这正是
[23:36] 从验证角度来说
[23:38] 有帮助的地方。
[23:39] >> 是的，我认为这些任务在物理上更
[23:40] 需要对物理学进行推理。现在，模型是如何做到这一点的，
[23:43] 那是我们仍在
[23:45] 观察和解读的
[23:47] 事情，但
[23:50] 它被要求解决的任务
[23:54] 是以物理学为基础的。现在，你在
[23:58] AlphaGenome 中有这个极其
[24:02] 复杂的学习算法，然后在论文里，
[24:05] 在它之上还有一层微小的、超级
[24:08] 简单的 Lasso 正则化，
[24:11] 我觉得这真的很有意思。我想象
[24:15] 这就像你发明了一台
[24:17] Formula 1 引擎，
[24:20] 上面还装着一个小小的
[24:22] 自行车铃。
[24:24] >> 是的，我认为这在某种程度上展示了
[24:26] 这种表征的力量，
[24:28] 对吧？你希望像
[24:30] Alpha Genome 这样的模型展现出某种
[24:34] 对它们
[24:37] 所看到的事物，或者它们
[24:40] 如何感知 DNA 序列的根本理解。所以
[24:43] 从某种意义上说，大部分工作都应该
[24:45] 由模型来完成，体现在
[24:47] 特征表示上，然后顶部的
[24:49] 最终预测器
[24:51] 应该采用一种非常简单、对，几乎
[24:54] 微不足道的形式，因为大部分工作
[24:56] 已经在表示
[24:59] 层面完成了。
[25:00] >> 下一步是什么？我们正在开展的工作
[25:03] 有很多，呃，呃，就像 Alpha Genome 一样，
[25:06] 这个故事
[25:09] 并没有到此结束，我们还需要做很多工作
[25:12] 来改进 Alpha
[25:14] Genome，让它变得更好，
[25:17] 提升它对基因组的
[25:19] 理解。嗯，如果你看看基因组学和
[25:25] 生物学，生物学有很多
[25:28] 不同的情境。例如，
[25:30] 不同的细胞行为各不相同，
[25:33] 对吧？所以，让 Alpha Genome
[25:37] 更能意识到它所处的
[25:41] 预测情境
[25:43] ，这是我们正在尝试
[25:45] 研究的一项工作。嗯，扩大
[25:48] Alpha Genome 可以接受训练的数据量，
[25:50] 这样它就能
[25:53] 更准确地预测不同种类
[25:55] 的性质，并关联这些分子
[25:58] 表型——Alpha Genome 能够
[26:01] 生成这些表型，并展示
[26:04] 并展示它们之间的联系，
[26:08] 对生物体特性产生的影响
[26:11] 大致在人类这个层面上，对吧
[26:12] 患病倾向等等。我们如何
[26:15] 为这项工作提供便利？所有
[26:18] 这些都是团队目前正在
[26:20] 探索的方向。
[26:22] >> 正在发生的事情太多了。我、我不想
[26:24] 贪心，但我只是想了解一下
[26:26] 接下来的步骤，比如你们在
[26:28] 此基础上又要做些什么？这
[26:30] 太棒了。你会和你的
[26:33] 儿子一起用 Gemini 探索科学问题，比如
[26:36] 飞机如何产生推力。[倒吸一口气]
[26:40] Gemini 有没有给你的儿子解释过某些事情，
[26:42] 解释得比你更好？有没有这种情况：
[26:45] 你会说：“哎呀，那比我
[26:47] 能说出来的好太多了。”
[26:49] >> 是的。[笑声] 所以，我、我觉得，这并
[26:50] 不只是这些模型解释概念的
[26:55] 能力，还包括通过使用
[26:59] 不同的类比等等；同时，
[27:02] 这些模型也有能力
[27:04] 真正展示
[27:08] 理论如何付诸实践。所以，几
[27:12] 周前，我、我当时试着
[27:15] 向我儿子解释，比如
[27:18] 工程师在设计飞机
[27:21] 零部件时，风洞里会发生
[27:26] 什么，以及会产生什么影响
[27:31] ，他们如何进行这些
[27:32] 模拟。我们就请 Gemini 来
[27:37] 解释，它实际上还创建了一套
[27:39] 模拟
[27:41] ，你可以实际
[27:44] 调整不同的参数
[27:47] ，看看气流会如何
[27:50] 变化。现在它并不完全
[27:52] 准确，但是，呃，但是这是一个很好的
[27:56] 展示，说明可能做到什么，对吧？
[27:58] 呃，还有，像是创建这些视觉
[28:01] 产物，帮助某个人
[28:05] 理解这个概念。我们正生活在
[28:07] 一个不可思议的时代，因为我，我也
[28:09] 记得我第一次写 Fav
[28:11] 斯托克斯流体物理模拟时。
[28:13] 我记得我第一次看
[28:16] 理论时，心想我永远也
[28:18] 不可能理解这个。这，这
[28:19] 永远都不可能实现。结果花了几个月
[28:21] 又几个月去学习、去尝试
[28:24] ，现在我对它的了解也很少
[28:27] 。不过至少，我能写一个基础模拟器
[28:30] 。而你在这里，只要
[28:33] 输入一个提示词，马上就得到一个
[28:37] 模拟，而且就在旁边。
[28:40] >> 是啊。
[28:40] >> 因为，因为智能实在
[28:42] 太不可思议了，它，它能做这种
[28:44] 事情，比如随手编出一个
[28:46] 风洞测试，而且你还可以
[28:47] 大概实时运行，你能看到
[28:49] 其中的流线，简直不可思议
[28:52] ，而且它只会越来越好。
[28:54] >> 是啊。我想我们在
[29:00] 大约 1 百万倍的 AI 加速
[29:04] 最近 10 年。如果你把……考虑在内
[29:06] 这不只是硬件。还要
[29:07] 考虑到，我不知道，
[29:09] 变换器，
[29:10] >> 实现变得有多好，
[29:12] 工程技术，还有所有其他因素。我们
[29:14] 就说过去 1 年里提升了 10 倍
[29:16] 年。
[29:17] >> 如果在接下来的 10 年里，我们再实现一次
[29:20] 1 百万倍，
[29:21] >> 我们能做些什么？有许多，呃，
[29:25] 尚未解决的科学难题，
[29:27] 超出了我们目前的能力。
[29:29] 即使只是模拟一个细胞，
[29:33] 创造一个虚拟细胞，想象一下
[29:36] 这会带来怎样的后果，对吧？比如说，
[29:38] 如果我们能够彻底地、某种程度上
[29:41] 真正理解细胞的运作机制，
[29:44] 那将对
[29:46] 抗击癌症等疾病
[29:49] 或合成生物学等领域产生惊人的影响。现在
[29:53] 再想想，不，我们讨论的是一个细胞；想象一下，某种程度上
[29:55] 模拟一个细胞，再想想
[29:58] 模拟一个生物体，
[30:00] 那将会是某种程度上……这就是
[30:03] 这种理解和能力
[30:05] 所能带来的力量。但关于世界，仍有许多
[30:07] 事情，嗯，我们还只是
[30:11] 刚刚开始了解。比如说，
[30:14] 理解长期气候，
[30:17] 例如，某些
[30:19] 行动对长期
[30:22] 气候会产生怎样的影响。嗯，
[30:26] 比如研发新型材料，
[30:28] 帮助我们储存
[30:31] 能量，呃，以
[30:34] 更高效的方式将能量转换成不同形式。
[30:36] 从第一性原理出发理解生物学，
[30:40] 从而能够真正
[30:43] 设计出具有新功能的方案，应对，呃，
[30:46] 我们正在面临的一些
[30:48] 人类健康领域的挑战，以及
[30:50] 农业和许多其他领域的挑战，呃，
[30:53] 世界正面临的事情。有
[30:56] 这么多，嗯，问题可以
[30:59] 随着这一进步得到解决。
[31:02] >> 太精彩了。通常我会问人们这个
[31:04] 问题，我发现它也会让他们的脑子
[31:07] 有点转不过来，因为 1
[31:09] 百万倍，就像 10 年前，就像 2016，我们
[31:13] 完全不知道今天我们能做什么
[31:16] 而且，而且，想到这点就让人兴奋
[31:18] 好吧，如果再过 10 年
[31:21] 我们会有怎样的能力，而每个人
[31:22] 想得都太局限了，但，但这次
[31:25] 这次真的很棒
[31:26] >> 大自然极其精妙，对吧
[31:30] 可以说，我们也是如此，而且，而且说真的，我，我觉得
[31:33] 有很多值得期待的事情
[31:35] 关于，嗯，理解这个世界。我
[31:38] 我的意思是，我们说的理解
[31:40] 是理解细胞，理解我们
[31:43] 自己的大脑，这又是另一项挑战。
[31:46] 究竟发生了什么，嗯
[31:49] 在，嗯，材料中？它们为什么会
[31:52] 表现出某些性质？我们甚至
[31:54] 已经见过一些，呃，性质
[31:58] 先不说新的性质
[32:00] 就说我们已经见过的性质
[32:02] 比如超导性，我们还没有
[32:04] 一套完整的超导性理论
[32:05] 对吧，我们有一种，算是
[32:07] 比较狭隘的超导性理论
[32:09] 想象一下那些我们尚未
[32:12] 探索的，或者，呃，尚未
[32:14] 真正清晰地理解的性质，为什么这些
[32:18] 现象会发生，以及设计这些物体的
[32:19] 能力。太棒了。
[32:22] 推动肉。每次我们见面，我都会学到
[32:25] 太多了。你知道最棒的部分是什么吗？
[32:27] 是？我我会回家，自己把这些
[32:30] 视频剪辑在一起。所以，我会
[32:32] 再看五六遍，而且
[32:35] 我向你保证，每一节课
[32:37] 都会有新的东西让我
[32:38] 学到。所以，这太棒了。非常感谢
[32:40] 你。
[32:41] >> 谢谢。我经常用 Lambda 在几分钟内复现 AI
[32:45] 研究论文。它
[32:48] 也很适合训练你自己的模型，或
[32:50] 微调现有模型。运行推理，
[32:53] 或进行文生图、文生视频。简单得很。
[32:56] 运行 Deepseek 聊天机器人或智能体。
[32:59] 速度超快，可靠性超高。Lambda 为
[33:02] 你提供强大的 Nvidia GPU 来运行你自己的
[33:05] 实验。我会测试我讲解的
[33:07] 论文中的想法，[清嗓子]
[33:09] 片刻之后，结果就出来了。太棒了。
[33:12] 说真的，现在就去试试吧，网址是
[33:14] lambda.ai/papers. 人工智能/ 原始转写不清：`Peepers`

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=Wkaw03p3BrM
- 来源：YouTube·Two Minute Papers
- 发布时间：2026-10-08
- 行业：模型层、基础软件与工具链、应用、云与算力服务、其他行业
- 公司：Google DeepMind（AlphaGenome、AlphaGenome Atlas、AlphaFold 及字幕所称 SEMA 项目）；Google（Gemini）；Lambda（结尾赞助推广，链接 lambda.ai/papers）；Nvidia（Lambda 推广中提及的 GPU 提供方）；DeepSeek（字幕写作 Deepseek，在 Lambda 推广中作为聊天机器人或智能体运行示例出现）。
- 归档时间：2026-10-10T09:10:55.489Z

---

# DeepMind's New AI Just Cracked The Code Of Life

- 来源：YouTube·Two Minute Papers

- 原始链接：https://www.youtube.com/watch?v=Wkaw03p3BrM

- 时长：1996 秒


## 完整文字稿
[0:00] If you can completely sort of really
[0:02] understand the workings of a cell, that
[0:05] will have amazing consequences for the
[0:08] fight against diseases like cancer.
[0:10] >> I feel like I've been dropped into a
[0:12] science fiction movie. Like we we could
[0:14] only dream of of having technology like
[0:17] this when I was a child. Now I also have
[0:19] a question and I was thinking that maybe
[0:22] only you can answer this question.
[0:24] >> What Alpha Genome Atlas does, it
[0:26] basically premputes all of this. Alpha
[0:30] genome atlas is 30 times the size of
[0:33] alpha fold database. Wow. So the scale
[0:36] at which uh alpha genome can produce
[0:40] this the the detailed information about
[0:42] the effect of [clears throat] variation
[0:43] is unprecedented.
[0:45] >> Good to see you push. Look this is
[0:47] really challenging for me because this
[0:49] is very much outside my field of
[0:52] expertise
[0:53] >> if I have any at all. As always I come
[0:55] here today as a student to learn from
[0:57] you. What is alpha genome?
[0:59] >> Alpha genome is a machine learning model
[1:03] which makes predictions about variation
[1:08] in the genome. So our genome uh not just
[1:13] the human genome but uh genome is
[1:16] basically the recipe of life. Uh what it
[1:19] is it's essentially a code. In the case
[1:21] of humans, it's a code which has three
[1:24] billion characters.
[1:27] And if one of those characters changes,
[1:30] what would be the effect on the actual
[1:34] cell properties? What will be the effect
[1:36] on the organism? These are the things
[1:40] that alpha genome is trying to sort of
[1:42] uncover.
[1:43] >> And if you're the person on the street,
[1:45] what could alpha genome change
[1:47] eventually about medicine or their life?
[1:50] Everyone sort of is affected by uh what
[1:54] happens at the genomics level. Uh the
[1:58] genome is the recipe of life. It has
[2:01] both the ingredient section which says
[2:03] which proteins uh are expressed and the
[2:07] sort of mixing section which sort of
[2:09] talks about uh gene regulation
[2:12] uh when do these proteins get expressed
[2:15] where do they get expressed and in what
[2:16] quantity
[2:17] >> and all of that information is encoded
[2:21] in this recipe of life. Every single
[2:23] person on the planet has a recipe. I
[2:27] have a recipe. You have a recipe. The
[2:29] person on the street has a recipe. All
[2:31] of our recipes, while they are similar,
[2:35] there are some changes. But what do
[2:38] these changes actually mean? What are
[2:41] the implications of these changes?
[2:43] That's what we have been trying to sort
[2:46] of understand for many many years if not
[2:49] decades. With the human genome project
[2:52] for the first time we were able to read
[2:54] the entire recipe book at least for one
[2:58] human sort of genome. U but now we are
[3:03] trying to figure out how do we decipher
[3:05] it or understand what actually happens
[3:08] if you make a change in one particular
[3:10] character. What are the consequences of
[3:13] it? Will it cause a specific disease?
[3:16] Will it basically be uh connected to uh
[3:19] high susceptibility for some kind of uh
[3:23] u problematic issue like maybe having a
[3:27] high body mass index or having more
[3:29] susceptibility to certain cancers. All
[3:32] of these things are can be decoded in
[3:36] some sense by better understanding of uh
[3:39] the variations that happen in the
[3:41] genome.
[3:42] >> Mhm. That is incredible. And I really
[3:44] wanted to ask this because
[3:48] my problem every now and then I try to
[3:50] read medical papers. It's not my field
[3:52] of expertise but I I'm a student. I just
[3:54] try to learn.
[3:55] >> Yeah.
[3:55] >> And my problem is that whenever I read
[3:58] about I don't know any kind of medicine.
[4:00] My problem is that every person is
[4:03] different.
[4:04] >> Yeah.
[4:05] >> And I go to the barber and the barber
[4:07] says that he never saw two heads that
[4:09] are the same. Yeah.
[4:10] >> And I read a paper on muscle hypertrophy
[4:14] like like bodybuilding paper how to
[4:16] build muscle and they have a bunch of
[4:18] people carefully selected, same age,
[4:22] >> same height, same build,
[4:24] >> they get the same diet, they do the same
[4:27] training and one guy gets incredibly
[4:30] muscular. They do the measurements.
[4:31] >> Yeah.
[4:32] >> Some others get a bit of muscle. One
[4:34] poor guy didn't get any muscle at all.
[4:36] And there was one who I think lost
[4:38] muscle. Like it's crazy how how
[4:41] different we are. I'm thinking that that
[4:44] is it possible that that we could
[4:46] finally be one step closer to
[4:47] understanding how how everyone is a bit
[4:50] different and what that means.
[4:52] >> Yeah, exactly. I think so this
[4:54] understanding or deciphering this code
[4:56] of life, what are the consequences?
[4:59] Sometimes those consequences might not
[5:01] mean anything, right? Like sometimes the
[5:03] changes are like uh they are not that
[5:07] material. Sometimes they are very
[5:08] material sort of consequences which are
[5:11] very well understood. Right? For
[5:13] example, cickle cell anemia. There is
[5:16] one particular sort of mutation which
[5:18] causes sort of cickle cell anemia and we
[5:21] understand what happens there. But most
[5:24] of the things that sort of you care
[5:25] about these days u requ are sort of
[5:29] polygenic in the sense that there are
[5:31] multiple sort of uh mutations that are
[5:33] uh acting on that are causing that
[5:37] particular uh incident or that that
[5:39] particular phenomena. And in some sense
[5:41] what alpha genome tries to do is tries
[5:44] to figure out like what happens at
[5:46] especially at a single sort of uh uh
[5:49] mutation variation level uh at the
[5:52] molecular sort of phenotypes. Now how do
[5:55] those molecular phenotypes uh then uh
[5:58] get affect the the property of the whole
[6:01] organism or in in the case of humans the
[6:04] the what the human sort of feels like
[6:06] the s susceptibility to specific disease
[6:09] that's something that will still need to
[6:11] be sort of connected and uh and research
[6:14] will need to be sort of done on that.
[6:16] >> My understanding is that before we dive
[6:18] deeper alpha genome is free for all of
[6:20] us forever for non-commercial use. Yes,
[6:24] exactly. So for as we have sort of done
[6:27] uh for many of our uh scientific uh
[6:30] models whether it's alpha fold one alpha
[6:33] fold 2 u alpha genome we have made it
[6:37] accessible to the entire scientific
[6:40] community for academic sort of use uh
[6:42] for them to sort of use it for their own
[6:45] sort of research fine-tune it sort of
[6:47] and the model weights are available. Are
[6:50] these true? And please explain.
[6:52] >> Yeah.
[6:52] >> The genome is the instruction manual for
[6:55] cells.
[6:56] >> Absolutely. I think the uh the genome as
[6:59] I was saying it's like a recipe book. Uh
[7:01] it has both the coding part of the
[7:04] genome which is like the ingredients
[7:06] sort of section of the recipe book book
[7:08] which says uh what are the proteins that
[7:12] will need to be synthesized. So the
[7:14] human proteome has 20,000 proteins. So
[7:16] our our genome sort of encodes these
[7:19] 20,000 sort of proteins and there could
[7:21] be variations in those 20,000 proteins.
[7:24] And then there's the non-coding part
[7:26] which is the which is sort of which
[7:28] looks at how are these proteins uh sort
[7:31] of mixed. How are these proteins sort of
[7:33] expressed? where are they expressed in
[7:35] what quantity and that part is basically
[7:38] the dark part of the genome which is
[7:40] much less uh well understood because it
[7:43] sort of talks about the regulation of uh
[7:46] uh of genes and uh protein expression um
[7:50] and so I think what alpha genome is
[7:53] trying to do is trying to sort of uh uh
[7:55] sort of decipher and inform this this
[7:58] whole sort of space. Now I also have a
[8:00] question and I was thinking that maybe
[8:03] only you can answer this question. So
[8:06] I'm I'm really curious about this. This
[8:08] is trained on human and mouse genomes.
[8:11] >> Yes.
[8:12] >> And what I would love to know is that
[8:14] you train it on the human genome.
[8:17] It has some amount of knowledge and and
[8:19] and quality of of results. Then you
[8:22] train it on the mouse genome too. after
[8:26] that does it get better at the human
[8:29] part?
[8:29] >> Yeah. And so this I think currently I
[8:32] mean you have sort of sort of seen this
[8:35] in many different sort of places in
[8:37] machine learning neural networks try to
[8:40] fit to the data and uh if you just give
[8:44] it the human data uh the neural network
[8:47] has this susceptibility that it can
[8:49] memorize or sort of uh uh think about uh
[8:52] the mechanisms that only work in the
[8:55] case of the human genome. But by
[8:59] training it by forcing it forcing the
[9:01] model to explain the same effects in the
[9:04] context of the the mouse genome, we are
[9:08] asking the the model to think broader
[9:11] and think about general sort of
[9:13] principles that can explain both these
[9:15] different types of variations. And that
[9:17] really helps in not only model
[9:20] generalization but also making the model
[9:24] sort of learn about uh sort of what
[9:26] really matters and what's really
[9:27] happening at the physiological level uh
[9:30] sort of in those molecular phenotypes.
[9:33] I've seen it in another Google deep mind
[9:35] paper that was the SEMA project which
[9:38] played a bunch of video games and I
[9:39] really found it stunning that you play a
[9:42] video game you have some score on it and
[9:45] after playing a bunch of other video
[9:47] games you get better at this game
[9:50] >> I think
[9:50] >> and it seems like maybe the same
[9:52] phenomenon that that but that sounds
[9:53] like intelligence to me right you you
[9:55] you apply the knowledge from other
[9:58] things to to this thing
[9:59] >> yeah and I think that's transfer
[10:01] learning in action where you are able to
[10:04] extract concepts from things which are
[10:07] related but are different problems and
[10:10] it helps you become better. Right? So if
[10:13] you sort of uh solve your maths problems
[10:16] and then solve your physics problems but
[10:18] just getting better on maths helps you
[10:21] get better on physics. My understanding
[10:23] is that the big advance here was that
[10:26] previous models were either too zoomed
[10:28] in and shortsighted
[10:31] or they looked from far away but at a
[10:34] low resolution. Now this one can do
[10:37] both.
[10:38] >> Yes.
[10:39] >> True or false?
[10:40] >> This is true. So when we started on this
[10:44] journey of u going after this extremely
[10:47] ambitious challenge of deciphering the
[10:49] genome um there were a lot of technical
[10:52] challenges. uh our genome as I just
[10:55] mentioned is 3 billion sort of uh base
[11:00] pairs ATCG right uh sort of a very long
[11:05] sort of sequence and if you want to
[11:07] understand what is the effect of a
[11:10] particular sort of variation you need to
[11:12] look at a broad uh sort of an expanded
[11:16] uh neighborhood around that uh that
[11:19] variant because it can affect sort of uh
[11:22] uh things which are quite far off
[11:24] because of 3D interactions and so on.
[11:25] It's not that a particular sort of base
[11:28] pair only affects uh what happens in its
[11:31] neighborhood like it the neighborhood
[11:32] could be very large. So earlier sort of
[11:35] variations of the model. So we had a
[11:38] model called informer which preceded
[11:41] alpha genome where both the context
[11:44] window
[11:46] in which we were looking at uh the
[11:49] neighborhood was sort of smaller as well
[11:53] as the resolution at which we were
[11:55] trying to analyze the genome was much
[11:58] coarser.
[11:59] Right? We were not looking at what's
[12:01] happening at the base pair level. We
[12:03] were sort of looking at sort of a large
[12:06] number of sort of uh base pairs taken
[12:08] together and we were not looking at 1
[12:10] million base pair window. We were
[12:12] looking at a smaller sort of window.
[12:15] What alpha genome I tries to do and is
[12:18] the first model to achieve that is to
[12:20] operate at the base pair resolution and
[12:23] have this very large window and uh and
[12:26] that allows it to not only make sort of
[12:29] prediction at a lot of precision which
[12:32] require a lot of precision precision but
[12:34] also uh sort of make predictions which
[12:36] involve reasoning about a much larger
[12:38] set of uh uh things that are happening
[12:41] in the neighborhood of that uh variant.
[12:44] I saw that it is so dominant it matched
[12:47] or beat the strongest comparison model
[12:49] in 25 out of 26 variant effect
[12:53] benchmarks. I think only at alpha fold
[12:56] did I hear like this kind of dominance
[12:58] that is absolutely incredible. Now what
[13:00] I'd like to ask you when you saw that it
[13:03] first started working
[13:04] >> Mhm.
[13:05] >> what did it feel like?
[13:07] >> Yeah. So I think one thing that um we
[13:11] were we have been working on this
[13:12] problem for a long time as with many of
[13:14] our scientific uh challenges. Um it is
[13:20] these are incredibly hard problems um
[13:22] and require innovation in many different
[13:25] things like data and sort of uh coming
[13:28] up with a better architecture coming up
[13:30] with sort of new ideas on training and
[13:33] so forth. When we started seeing these
[13:36] results, we knew uh that we were in a
[13:39] different phase and uh part of it was
[13:44] expected because we had done all the
[13:46] hard work of uh enabling training to
[13:49] happen at that resolution which had
[13:51] never been sort of done before. But to
[13:53] get it right and to actually show that
[13:56] uh the original hypothesis that we had
[13:59] gone in with that if you increase the
[14:02] resolution, if you increase the context
[14:04] window, if you regularize the training
[14:06] properly, then neural networks will sort
[14:10] of uh show pro uh show the right results
[14:13] and so that was really rewarding uh to
[14:16] see for the whole team. Was there a
[14:18] phase of suspicion like it it it can't
[14:20] be right you know maybe maybe we we
[14:23] tested on the training set or or
[14:25] something.
[14:26] >> Yeah. So I think this is where we have
[14:28] uh our team sort of we are very very
[14:31] cautious scientists. So uh there is a
[14:33] lot of work that the team does on sort
[14:35] of uh on metrics and evaluation and so
[14:39] when the results came in there's you so
[14:42] you there's a genuine sort of um uh sort
[14:45] of expectation that you you're going to
[14:47] uh uh check it again to make sure that
[14:50] everything is working properly and these
[14:52] are sort of valid results but uh we had
[14:54] a lot of confidence in our metrics that
[14:57] we had set them set them correctly
[14:59] because it was not something that we we
[15:01] have been doing for the last sort of 3
[15:02] months like it's it has been a project
[15:04] for the last almost four five years or
[15:07] more.
[15:08] >> What is alpha genome atlas?
[15:10] >> So alpha genome atlas is essentially uh
[15:15] a sort of a dictionary of what happens
[15:19] when you have variation in the genome.
[15:20] So now I told you about alpha genome.
[15:22] What alpha genome does is it looks at um
[15:25] your genome and you can ask it the
[15:27] question if I change this uh base pair
[15:31] or this character in your genome from a
[15:34] to a t or t to a c what would be the
[15:37] consequence
[15:39] and that's very helpful but suppose you
[15:42] wanted to understand the effects of all
[15:44] variations
[15:46] now all variation there are a lot of
[15:48] variations because like there are three
[15:50] billion base pairs and all of them can
[15:52] be changed three sort of times, right? A
[15:55] A could be changed into a T or a C or a
[15:58] G, right? So there are 9 billion
[16:00] possible single nucleotide variations
[16:03] that you can study. And for every single
[16:07] one of them, there's a lot of data that
[16:09] you can sort of uh that you can extract
[16:11] as to what will be its effect at the
[16:13] molecular level at uh the effect on
[16:15] splicing, the effect on sort of gene
[16:18] expression and and so forth. What alpha
[16:21] genome atlas does, it basically
[16:23] precomputes all of this.
[16:26] >> It basically looks at what happens for
[16:28] all these variations and makes this
[16:31] massive data sets a pabyte size sort of
[16:34] data set and makes it available to the
[16:37] scientific community.
[16:38] >> That's unbelievable. It feels like this
[16:41] alpha fold moment where the inference of
[16:43] time of folding became you know so
[16:46] quick. Yeah. That at some point Damis
[16:48] just said that you know let's fold all
[16:50] the proteins like atlas sounds like that
[16:52] for the genome.
[16:54] >> Exactly. So I mean for for alpha alpha
[16:56] fold we had um we made the predictions
[17:01] for uh structures of 250 million
[17:04] proteins almost all the proteins that
[17:06] were known at that sort of time. But
[17:10] even the alpha fold database which has
[17:12] now been used uh by more than 4 million
[17:15] users across 190 countries alpha in
[17:19] terms of its actual size
[17:22] alpha genome atlas is 30 times the size
[17:25] of alpha fold database.
[17:27] >> Wow.
[17:28] >> So the scale at which uh alpha genome
[17:31] can produce this the the detailed
[17:34] information about the effect of
[17:35] variation is unprecedented. All this
[17:38] from one megabase of DNA sequence.
[17:40] >> Yeah. So with with a 1 million sort of
[17:43] uh base pair window uh in in context
[17:46] >> for mutations that affect gene activity
[17:49] there is a fairly strong correlation
[17:51] between the predicted and the observed
[17:53] effect size. I saw in the paper that row
[17:56] is about 0.5.
[17:58] >> Mhm.
[17:59] >> But but that's stunning.
[18:01] >> Mhm.
[18:01] >> That's that's incredible. And uh my
[18:04] understanding is also that this doesn't
[18:06] just predict whether a mutation matters
[18:10] but often gets the magnitude of the
[18:12] effect roughly correct too. Is that fair
[18:14] to say?
[18:15] >> Yes, absolutely. I think what we did
[18:18] with the especially alpha genome atlas
[18:20] is we came up with um a new way to sort
[18:26] of help scientists
[18:28] sort of look at the data and explore
[18:31] this mass amount of data. So the alpha
[18:35] genome variant impact score or the AVI
[18:38] score is uh sort of carefully sort of
[18:42] calibrated to say if the score is high
[18:45] that means that there is that particular
[18:48] variant is a variant that you should
[18:51] really think about and analyze uh sort
[18:54] of carefully. Um and if the AVS code is
[18:58] low, you can there's high confidence
[19:00] that it will not have uh a dramatic
[19:02] impact on various different sort of
[19:05] phenotypes.
[19:06] >> Mhm. So to me, this sounds like one of
[19:08] those root node problems where you you
[19:11] solve this problem and then it's the
[19:14] applications can grow out of it in so
[19:16] many directions. I check alpha fold
[19:19] every now and then which was one of
[19:20] these root node problems and in the
[19:23] first couple years
[19:24] >> I could actually look through the papers
[19:26] that that used it and I tried to
[19:29] understand what they do now there is so
[19:32] much that's built on top of alpha fold
[19:35] that it's completely hopeless to for any
[19:37] of us to understand all of it does it
[19:39] look like alpha genome is going to be
[19:41] the same
[19:42] >> yeah I think alpha genome with alpha
[19:44] genome we are trying to solve that root
[19:46] node problem of deciphering the genome,
[19:48] right? And and as you sort of mentioned,
[19:51] it it is really truly a root node
[19:53] problems node problem in terms of its
[19:56] implications. So not only does it have
[19:59] implications for understanding sort of
[20:02] uh diseases better, it also has
[20:04] implications for how would you treat
[20:06] diseases. Uh what are the sort of key
[20:09] things that you need to sort of
[20:10] understand about biology and what are
[20:13] the places where you can sort of control
[20:15] expression or what what variations sort
[20:17] of control expression uh of certain sort
[20:20] of proteins which are relevant in that
[20:22] disease path pathway. But it's not just
[20:25] uh applicable for um understanding
[20:29] uh diseases and human health. Uh it has
[20:32] implications that go beyond in uh in
[20:35] broader sort of biology. So in fact uh
[20:38] sort of now we are seeing um a lot of
[20:42] interest in use of generative AI in
[20:45] synthetic biology and again when you are
[20:47] sort of synthesizing sort of uh u new
[20:50] organisms or new sort of proteins like
[20:53] what are the properties that uh we
[20:56] should be sort of thinking of right like
[20:58] you would have seen uh DNA language
[21:01] models like EVO uh sort of come up and
[21:04] and people using them to sample
[21:07] different genomes to uh to solve
[21:10] different types of problems and again
[21:13] alpha genome gives you sort of a lens by
[21:16] which you can study the properties of
[21:19] those genomes and so uh the implications
[21:23] of uh this model and its future sort of
[21:26] variations which we are working on I
[21:28] think will be sort of uh in the same way
[21:32] um very broad
[21:34] >> I feel like I've been dropped into a
[21:36] science science fiction movie like we we
[21:38] could only dream of of having technology
[21:40] like this when I was a child that's I
[21:42] think that's unbelievable how do we know
[21:44] that it learned mechanisms not just
[21:47] correlations like usually that's the
[21:49] that's the problem with many of these
[21:51] papers that the difficult part is
[21:53] actually proving the connection between
[21:55] the two that's almost impossible in many
[21:57] cases
[21:58] >> yeah so I think that's a very good
[22:00] question I think and that has been one
[22:02] of the sort of challenges right when you
[22:04] are looking in computational biology
[22:06] that you don't want just to learn all
[22:09] the statistical correlations. You want
[22:12] to have uh the model you want the model
[22:15] to be able to sort of understand the
[22:17] actual sort of causal sort of links that
[22:20] happen in uh that make the predictions
[22:24] possible. And uh if you think about it
[22:27] like in alpha genome how that is sort of
[22:30] encoded one is that is in terms of the
[22:33] properties that it predicts. It predicts
[22:36] properties at the molecular sort of
[22:38] level. So it can you can really see when
[22:42] it makes a prediction about a particular
[22:46] variation about say splice sites or
[22:49] splicing or gene expression. So those
[22:51] are very sort of uh uh uh those are
[22:54] predictions which are which can be
[22:56] explained biohysically
[22:58] right rather than sort of corrationally
[23:00] that oh this variation happened
[23:02] basically causes that particular sort of
[23:04] disease but this alpha genome is not
[23:07] saying that it's basically actually
[23:09] telling you what is happening at the
[23:10] cellular sort of level and then in terms
[23:12] of validating uh what we have seen is
[23:16] actually when you make take these
[23:18] predictions and actually try to validate
[23:20] them in the lab. We see that those
[23:22] predictions make sense and you can make
[23:25] novel sort of findings uh of uh of
[23:30] variation and and importance of certain
[23:32] variants
[23:33] >> essentially because the whole thing is
[23:34] based in physics. This is what
[23:36] essentially helps in terms of
[23:38] verification.
[23:39] >> Yeah, I think the tasks are more
[23:40] physically required to reason about the
[23:43] physics. Now how the model is doing it
[23:45] that's uh something that we we are still
[23:47] sort of uh looking at and interpreting
[23:50] but uh uh the the the tasks that it is
[23:54] being asked to solve are grounded in
[23:58] physics. Now you have this incredibly
[24:02] sophisticated learning algorithm in
[24:05] alpha genome and then in the paper on
[24:08] top of it you have this tiny super
[24:11] simple layer of lasso regularization and
[24:15] I found that really amusing. I imagine
[24:17] this almost like a a Formula 1 engine
[24:20] you invented and it has a a little
[24:22] bicycle bell on top.
[24:24] >> Yeah, I I think that this sort of shows
[24:26] the the power of the representation,
[24:28] right? what you want uh models like
[24:30] alpha genome to exhibit is sort of a a
[24:34] fundamental understanding of what they
[24:37] are um what they are seeing or how they
[24:40] are perceiving uh the DNA sequence. So
[24:43] in in some sense most of the work should
[24:45] be done by the model in terms of the
[24:47] feature representation and then the sort
[24:49] of the final sort of predictor on top
[24:51] should take a very simple yeah almost
[24:54] trivial form because most of the work
[24:56] has happened at the representation sort
[24:59] of uh layer.
[25:00] >> What's the next step? So there are so
[25:03] many things that uh uh we are working on
[25:06] which is like with alpha genome the the
[25:09] story does not end here like there is a
[25:12] lot that we need to do to improve alpha
[25:14] genome to make it even uh better uh in
[25:17] terms of its understanding of um the
[25:19] genome. Um if you look at genomics and
[25:25] uh biology, biology sort of has a lot of
[25:28] different contexts. For example,
[25:30] different cells behave differently,
[25:33] right? So uh making sort of alpha genome
[25:37] more uh sort of aware of the context in
[25:41] which it needs to make these predictions
[25:43] is one thing that we are sort of trying
[25:45] to work on. um expanding the amount of
[25:48] data that alpha genome can be trained on
[25:50] so that it can uh sort of become much
[25:53] more accurate uh about different kinds
[25:55] of properties connecting these molecular
[25:58] phenotypes that alpha genome uh uh is
[26:01] able to sort of produce and uh showing
[26:04] and uh showing their connections and
[26:08] impact on properties at the organism
[26:11] sort of at the human sort of level right
[26:12] the propensity to disease and so on. How
[26:15] do we sort of facilitate that work? All
[26:18] these things are sort of directions that
[26:20] the team is now looking at.
[26:22] >> There's so much going on. I I don't want
[26:24] to get greedy, but I just wanted to hear
[26:26] about the next steps like what what are
[26:28] you building on on top of this? That's
[26:30] that's awesome. You use Gemini with your
[26:33] son to explore science questions like
[26:36] how airplanes generate thrust. [gasps]
[26:40] Has Gemini ever explained something to
[26:42] your son better than you could? So where
[26:45] you said, "Oh man, that's that's way
[26:47] better than what I would have said."
[26:49] >> Yeah. [laughter] So I I think it's it's
[26:50] not u only the ability of these models
[26:55] in explaining concepts but by using
[26:59] different analogies and so on but also
[27:02] uh the ability of these models to
[27:04] actually uh show
[27:08] the theory in action. So I was um a few
[27:12] sort of weeks back uh I I was trying to
[27:15] sort of explain to my son like what
[27:18] happens in a wind tunnel when sort of uh
[27:21] engineers are designing uh sort of u say
[27:26] um airplane uh sort of parts and what
[27:31] are the effects and how do they do these
[27:32] simulations and uh we we asked Gemini to
[27:37] explain it and it it in fact it creat
[27:39] created a simulation
[27:41] and where sort of uh you could actually
[27:44] play around with different parameters
[27:47] and see what how the airflow sort of uh
[27:50] changes. Now it was not completely
[27:52] accurate but uh but it was a very good
[27:56] demonstration of what is possible right
[27:58] uh and like and creating these visual
[28:01] artifacts that help uh someone
[28:05] understand the concept. We are living in
[28:07] an incredible time because I I also
[28:09] remember when I first wrote my Fav
[28:11] Stokes physics simulation for for
[28:13] fluids. I remember when I first looked
[28:16] at the theory and I thought I'm never
[28:18] going to understand this. This is this
[28:19] is never happening. And it took months
[28:21] and months of studying and and trying
[28:24] and now I I understand it very little
[28:27] about it. But at least a basic simulator
[28:30] I can I can write. And you just here you
[28:33] just enter a prompt and you just got a
[28:37] simulation by the way on the side.
[28:40] >> Yeah.
[28:40] >> Because the because the intelligence is
[28:42] so incredible that it it can do this
[28:44] sort of thing like like just make up a
[28:46] wind tunnel test and and you can
[28:47] probably running real time you can see
[28:49] the streamlines as as it's unbelievable
[28:52] and it's only going to get better.
[28:54] >> Yeah. Now I think we had
[29:00] about a 1 millionx AI speed up in the
[29:04] last 10 years. If you factor in
[29:06] everything, it's not just hardware. It's
[29:07] if you factor in, I don't know,
[29:09] transformers,
[29:10] >> how much better the implementations got,
[29:12] the engineering, the everything. Let's
[29:14] say we got a 1 millionx in the last 10
[29:16] years.
[29:17] >> If in the next 10 years we have another
[29:20] 1 millionx,
[29:21] >> what could we do? There are so many uh
[29:25] open scientific challenges that are
[29:27] beyond our current capabilities.
[29:29] Simulating even a cell,
[29:33] creating a virtual cell, imagine the
[29:36] consequences of that, right? Like we
[29:38] would if you can completely sort of
[29:41] really understand the workings of a cell
[29:44] that will have amazing consequences for
[29:46] the fight against diseases like cancer
[29:49] or synthetic biology and so forth. Now
[29:53] imagine not and that's we are talking
[29:55] about a cell right imagine sort of
[29:58] simulating a organism
[30:00] that will be sort of that is the power
[30:03] that can come from that understanding
[30:05] and that capability but there's so many
[30:07] things um about the world that we still
[30:11] are scratching the surface on sort of
[30:14] understanding uh long-term climate for
[30:17] instance uh what are going to be the
[30:19] consequences of certain um sort of
[30:22] actions on long-term sort of climate. Um
[30:26] sort of coming up with new material
[30:28] types that can help us sort of store
[30:31] energy sort of uh transform energy in
[30:34] different forms in a much more efficient
[30:36] manner. understanding biology at uh from
[30:40] first principles to being able to truly
[30:43] design novel function for tackling uh
[30:46] some of the challenges that we are
[30:48] seeing both in human health as well as
[30:50] sort of in agriculture and many other uh
[30:53] things that the world is facing. There
[30:56] are so many sort of um problems that can
[30:59] be unlocked with that progress.
[31:02] >> That was fantastic. Usually I ask this
[31:04] question people and I see that it kind
[31:07] of breaks their brain too because 1
[31:09] millionx like 10 years ago like 2016 we
[31:13] had no idea what what we could do today
[31:16] and and it's it's so exciting to think
[31:18] that okay if you had another 10 years
[31:21] what would we be capable of and everyone
[31:22] is thinking so small but but this one
[31:25] this one was really good
[31:26] >> nature is extremely sophisticated right
[31:30] sort of we are and and really I I think
[31:33] there's a lot to look forward to in
[31:35] terms of um understanding the world. I
[31:38] mean understanding we are talking about
[31:40] understanding cells understanding our
[31:43] own brain like uh is another sort of
[31:46] challenge. What is actually happening um
[31:49] in uh sort of materials? Why are they
[31:52] exhibiting certain properties? We even
[31:54] sort of properties that we uh have seen
[31:58] uh forget about new types of properties
[32:00] but properties that we have already seen
[32:02] like superconductivity we don't have a
[32:04] complete theory about superc
[32:05] conductivity right we have one sort of
[32:07] narrow theory of superconductivity
[32:09] imagine the new properties that we are
[32:12] yet to sort of explore or uh sort of
[32:14] really uh crisply understand why these
[32:18] phenomenas happen and the ability to be
[32:19] able to design those objects. Fantastic.
[32:22] Push meat. Every time we meet, I learned
[32:25] so much. And you know what the best part
[32:27] is? I I will go home and I cut these
[32:30] videos together myself. So, I'm going to
[32:32] watch it like five or six more times and
[32:35] I guarantee you that every lesson
[32:37] there's going to be something new that I
[32:38] learned. So, this was amazing. Thank you
[32:40] so much.
[32:41] >> Thank you. I use Lambda to reproduce AI
[32:45] research papers often in minutes. It's
[32:48] also great to train your own models or
[32:50] fine-tune an existing one. Run inference
[32:53] or text to image or video. Easy peasy.
[32:56] Running a Deepseek chatbot or agent.
[32:59] Super fast, super reliable. Lambda gives
[33:02] you powerful Nvidia GPUs to run your own
[33:05] experiments. I test ideas from the
[33:07] papers I cover and [clears throat]
[33:09] moments later, results. Love it.
[33:12] Seriously, try it out now at
[33:14] lambda.ai/papers. AI/ Peepers


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
