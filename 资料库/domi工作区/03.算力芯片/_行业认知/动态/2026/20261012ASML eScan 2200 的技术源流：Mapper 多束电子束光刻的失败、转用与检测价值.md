<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_96dcf67a3329e664"
title: "ASML eScan 2200 的技术源流：Mapper 多束电子束光刻的失败、转用与检测价值"
domains: ["算力芯片"]
subdomains: ["先进封装与制造"]
types: ["行业认知","视频"]
companies: "ASML；Mapper Lithography；TSMC；IMS Nanofabrication；Hermes Microvision（HMI）；AT&T Bell Labs；Lucent；Applied Materials；Nikon；IBM；ASM International；RUSNANO。相关研究机构：Delft University of Technology、CEA-Leti。"
published_at: "2026-10-12T01:58:29.690Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=CqPsGYJHozM"
source: "YouTube·Asianometry"
---

# ASML eScan 2200 的技术源流：Mapper 多束电子束光刻的失败、转用与检测价值

## 行业认知文章

- 行业：算力芯片
- 公司：ASML；Mapper Lithography；TSMC；IMS Nanofabrication；Hermes Microvision（HMI）；AT&T Bell Labs；Lucent；Applied Materials；Nikon；IBM；ASM International；RUSNANO。相关研究机构：Delft University of Technology、CEA-Leti。
- 来源：YouTube·Asianometry · [原文链接](https://www.youtube.com/watch?v=CqPsGYJHozM)
- 发布时间：2026-10-12
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
这篇来自 YouTube·Asianometry 的视频围绕 ASML 多束电子束检测设备 eScan 2200，回顾 Mapper Lithography 从无掩模光刻创业公司到技术被 ASML 收购并用于检测的全过程。电子束直写具有高分辨率、图形设计灵活和省去掩模的优势，但单束串行扫描的吞吐量不足，使其主要用于掩模制造、原型和小批量芯片。Mapper 通过大量低功率电子束并行写入、取消电子束交叉点，尝试同时解决吞吐量和电子间随机相互作用问题；这一方案又带来束流控制、定制芯片、机械定位、散热和数据传输的复杂工程挑战。TSMC 曾投资并支持 Mapper，希望获得 EUV 的替代方案、降低掩模成本，并以多机集群弥补单机速度不足。但 Mapper 的研发进展长期受资金约束，在 EUV 光源和吞吐量快速改善的同时，仍未达到其集群策略所需的单机性能，最终于 2018 年破产。ASML 收购其知识产权和资产后，将多束技术与此前收购的 HMI 电子束检测能力结合，先后推出 eScan 1000、eScan 1100，并进一步推进 eScan 2200。文章最终将这一转用放入 ASML 的整体光刻战略：把曝光前的计算修正、曝光设备以及曝光后的计量和检测通过软件与数据反馈连接起来。原始链接：https://www.youtube.com/watch?v=CqPsGYJHozM；视频标注时长为 1497 秒，所提供字幕时间戳覆盖 0:00—24:43。来源说明称字幕由 YouTube 浏览器原生导出，首尾时间戳、行数及原始文件已核验，但未人工校对识别准确性，且没有逐条结束时间。以下观点、数字与技术解释均按该文字稿整理。

### 论点1：eScan 2200 的多束技术与已破产的 Mapper Lithography 存在技术传承关系，Mapper 原本试图与 ASML 的 EUV 光刻竞争。
**相应论据：**[0:00—0:34] 作者称自己在 Antwerp 的 ITF World 2026 听取 ASML CEO Christophe Fouquet 的演讲时，注意到多束检测设备 eScan 2200，并认出其技术来自已停止经营的荷兰公司 Mapper Lithography；Mapper 曾尝试挑战 ASML 和 EUV，其技术曾获 TSMC 支持。[21:08—21:34] ASML 后来收购 Mapper 的知识产权和资产。[23:01—23:47] 原文将 HMI 电子束检测与 Mapper 多束技术的结合，联系到 eScan 系列的发展。
**相应论证：**原文以作者在产品演讲中的观察引出 Mapper 历史，再通过 ASML 的资产收购和检测技术整合说明技术传承。材料没有逐项列出 eScan 2200 中哪些部件或专利直接来自 Mapper，因此技术关联应保留为原文叙述口径。

### 论点2：电子束直写的主要优势是高分辨率、图形自由度和无掩模，能够避免部分光学成像约束及掩模成本。
**相应论据：**[0:42—1:27] 电子束直写光刻利用聚焦电子束直接在涂有光刻胶的晶圆上写入设计，早期设备在 20 世纪 60 年代出现，结构借鉴电子显微镜。[1:32—1:44] 原文称这类系统自 20 世纪 90 年代起已能实现 20 纳米线宽，如今分辨率可低于 10 纳米。[1:48—2:14] 光刻中某些掩模图形会出现难以成像的“热点”，电子束则可以绘制任意设计；先进掩模的一整套制作费用可达数千万美元，而无掩模写入可以省去这项费用。
**相应论证：**电子束直接按设计扫描，既不依赖实体掩模，也不受同样的掩模图形成像限制，因此原文将高分辨率、设计灵活性和省去掩模费用联系在一起。这些是技术与成本优势，是否足以支持量产仍取决于后文的吞吐量约束。

### 论点3：单束电子束直写的吞吐量不足，限制了其在主流晶圆量产中的使用，并使其更适合掩模、原型和小批量任务。
**相应论据：**[2:21—2:41] 单束电子束需要逐步扫描写入，一片晶圆可能耗时数小时，甚至数天；随着设计复杂度提高，吞吐量问题进一步恶化。[2:46—3:03] 因此电子束光刻主要用于制作光掩模，也用于客户原型芯片或学术实验室的小批量芯片，这些用途未必能在经济上支持昂贵掩模的制作。[3:07—3:17] 作者还提到 MicroWriter 无掩模设备作为相关需求的例子，并明确其不使用电子束。
**相应论证：**串行逐点写入使处理时间随图形任务增加，而量产需要快速处理大量晶圆。原型和小批量场景对速度的容忍度较高，同时掩模固定费用更难被摊薄，因而更能体现无掩模方案的价值。MicroWriter 仅用于说明无掩模需求，原文未提供其经营或性能数据。

### 论点4：SCALPEL 试图把掩模投影方式用于电子束，并通过散射和孔径筛选形成图像，但其电子束交叉点导致不可用普通透镜修正的随机模糊。
**相应论据：**[3:39—4:02] SCALPEL 由 AT&T Bell Labs 于 1989 年提出，作为 193 纳米光刻之后的候选技术。[4:07—5:02] 电子束照射具有四倍尺寸图形的散射掩模，未大幅散射的电子与强散射电子经磁透镜和孔径分离，形成高对比度图像；把过滤任务交给孔径也能减少掩模受到的电子轰击。[5:08—5:46] Bell Labs 研究十余年未能成功；Pieter Kruit 为 ASML 评估类似系统时认为其存在根本缺陷：电子穿过交叉点时相互排斥，产生随机偏移和束流模糊，普通透镜无法修正。[5:46—5:53] Applied Materials 和 Nikon 后续研究相关变体也未取得成功。
**相应论证：**原文把失败原因归结为电子束在交叉点集中后产生的随机相互作用。孔径虽能完成图像筛选，却引入束流集中这一瓶颈；由于模糊具有随机性，原文认为它不能像一般光学像差一样通过普通透镜补偿。

### 论点5：Mapper 的核心构想是用大量低功率电子束并行写入，以减少电子间相互作用并提高处理能力。
**相应论据：**[6:08—6:42] 当时另有两种候选路线：一比一投影需要制作与最终芯片特征同样小的掩模；IBM 的微型电子束柱阵列则面临束流均匀、稳定和控制问题。[6:47—7:07] Pieter Kruit 提出并行产生大量小电子束，最初论文建议 100 万至 1 亿束，每束对应设计中的一个像素；原文称各束功率较低，可避免相互干扰。[7:07—7:31] Bert Kampherbeek 和 Marco Wieland 参与开发，团队授权取得大学知识产权，融资数百万并于 2000 年创立 Mapper Lithography。
**相应论证：**原文将大量并行束的构想同时用于解决单束速度不足和集中束流相互作用问题，并以其他路线的掩模制造难度、束流控制难度说明其提出背景。最初论文的束数属于概念目标，不能与后续原型设备实际束数混用。

### 论点6：Mapper 最初采用光照转换板产生独立电子束源的方案，因电子出射状态和开关响应不可控而失败。
**相应论据：**[7:50—8:32] 初始方案让约百万个光点穿过铬石英掩模，经光学缩小后照射转换板，生成约 100 纳米宽的电子点；原文称约 5 毫米×20 毫米的阵列包含约 2000 万束。[8:39—9:57] 转换板虽可产生稳定数量的电子，但部分电子以错误角度或能量射出。团队最初认为它类似光电阴极，后来发现实际机制是光电二极管向场发射器补充受激电子池，无法直接控制出射电子的能量和位置，也无法足够快地开关。[8:53—8:59] 作者对这一机制解释明确表达了“希望理解正确”的保留。
**相应论证：**按原文解释，稳定的电子产生量并不等于可用于光刻的稳定束流：出射能量和位置失控会造成模糊，开关速度不足又无法按设计及时选择像素。转换板机制的细节应保留作者自述的不确定性，不能当作经过独立核验的技术结论。

### 论点7：增加过滤孔径仍无法挽救初始电子源方案，Mapper 因而转向把单束电子束分成多个可独立开关的并行束。
**相应论据：**[10:04—10:18] 团队加入孔径过滤异常电子，但各小束实际通过孔径的电子数量不稳定，仍不适合光刻。[10:19—10:44] 经过一至两年尝试后，团队采用单束电子束分裂为多个并行小束的方案；每束独立开关，整个阵列在涂有光刻胶的晶圆上扫描约 26 毫米×10 毫米的区域。
**相应论证：**过滤只能筛掉部分异常电子，却未能保证可用束流稳定。原文将这一失败与后续架构转向直接相连：从控制大量独立源，改为控制同一源分出的多束。材料未进一步证明这一改变如何量化改善全部电子源指标。

### 论点8：Mapper 与 IMS 多束掩模写入设备的关键区别是取消缩小光学系统中的交叉点，以更高控制复杂度换取更高束流。
**相应论据：**[10:49—11:20] IMS Nanofabrication 的多束掩模写入设备也从单束分出多束，通过独立遮断和投影缩小在掩模基板上写入，原文称 TSMC 正使用这类设备。[11:27—11:49] IMS 的缩小光学系统需要电子束交叉点；束流过大时会出现电子间相互作用，因此采用相对低电流，写入较慢，对掩模制造仍可接受。[11:49—11:56] Mapper 取消该交叉点，可以提高电流，但控制复杂度明显增加。
**相应论证：**两类设备虽都采用多束，但服务对象和速度要求不同。原文认为掩模写入可以接受较低电流带来的速度代价，晶圆量产光刻则需要更高处理能力；Mapper 为此取消交叉点，并承担更复杂的控制任务。

### 论点9：束流遮断阵列是 Mapper 的关键部件，其定制芯片和加工迭代形成了显著研发成本。
**相应论据：**[12:03—12:24] 束流遮断阵列是一块定制微芯片，可能具有数千个宽约 1—2 微米的孔，通过在对应孔周围施加电压，把不需要的束偏转至阻挡结构。[12:29—12:41] TSMC 使用先进节点制造芯片，Mapper 再自行蚀刻孔洞；每次出错并进行新版本制造，团队需要再向 TSMC 支付约 100 万美元。
**相应论证：**设计数据必须被转化为各小束的独立通断，因此遮断阵列直接影响图形写入。先进芯片制造与后续开孔加工结合，使研发迭代既涉及制造能力，也有较高的重复支出。原文未披露迭代次数或这一部件的累计成本。

### 论点10：Mapper 的机械定位、晶圆冷却和设计数据传输都需要针对电子束架构重新处理，增加了整机开发难度。
**相应论据：**[12:46—13:18] 传统直线电机会产生干扰电子束的磁场，因而不能直接采用；但 Mapper 无需反复对齐掩模和晶圆，连续扫描使其启停需求较低，一位设计人员估计机器加速度比典型 ASML 设备低约 100 倍。[13:25—13:46] 持续电子轰击使晶圆发热，需要主动冷却；设计数据直接流入遮断阵列，铜线无法满足所需传输速度，团队采用玻璃光纤。[13:53—14:02] 多项工程挑战使产品研发持续多年，原文引用一份无掩模光刻会议演示称，团队于 2005 年第四季度首次证明光刻可行性。
**相应论证：**原文将电子束对磁场的敏感性、能量沉积和大量并行束控制所需的数据流，分别联系到执行机构、冷却和通信要求。连续扫描降低了机械加速要求，但不能消除其他系统难题；约 100 倍的加速度差异属于一位设计人员的估计。

### 论点11：Mapper 开发期间，下一代光刻路线仍存在较大不确定性，这为 EUV 替代方案提供了探索窗口。
**相应论据：**[14:08—14:39] 当时 EUV 只是多个下一代光刻候选技术之一，行业会议上的投票结果反映出参与者对最终胜出路线缺乏共识。[14:45—14:57] 另有一派认为可能不会出现新的光刻技术，主张持续采用间距分割等多重图形化方法；原文称这些方法已把晶圆厂推进至 22 纳米节点，但对能延伸多远提出疑问。[15:02—15:12] TSMC 在与 Intel、Samsung 一起支持 ASML 的 EUV 开发时，也探索其他技术。
**相应论证：**原文以行业路线争论解释 Mapper 当时存在的市场与研发机会，并以 TSMC 同时支持多条路线说明客户面对技术不确定性的做法。会议投票没有给出样本或具体比例，不能据此量化各路线获得的产业支持程度。

### 论点12：TSMC 支持 Mapper，主要希望获得可行的 EUV 替代技术，并缓解不断上升的掩模成本。
**相应论据：**[15:17—15:34] TSMC 于 2008 年宣布投资 Mapper，其研发人员购买设备并提供反馈和支持，特别关注无掩模光刻能否改变掩模成本快速上升的趋势。[15:40—15:58] Mapper 于 2007 年末宣布取得 32 纳米级图形里程碑，Burn Lin 表示这是重要突破，证明了 Mapper 低电压方法的多束分辨能力。[16:04—16:18] Mapper 设备也进入 CEA-Leti，参与名为 IMAGINE 的无掩模光刻研究项目。
**相应论证：**投资、购买测试设备和研究合作共同体现了 TSMC 对替代路线与成本问题的关注。Burn Lin 的评价支持当时的分辨率进展，CEA-Leti 提供了完善设备的研究环境；这些证据尚不能证明设备已经达到生产线要求。

### 论点13：Mapper 与 TSMC 计划用多机集群弥补单机吞吐量不足，但方案成立依赖单机先达到目标速度。
**相应论据：**[16:24—16:52] Mapper 目标速度约为每小时 10 片晶圆，而原文称与 EUV 或双重图形化竞争需要约每小时 100 片；十台每小时 10 片的设备在算术上可合计每小时 100 片。[16:52—16:59] 原文另举六台每小时 20 片的设备合计每小时 120 片的例子。[17:22—17:35] 2009 年设备实际吞吐量约每小时 1 片，低于集群策略所需的每小时 10 片。
**相应论证：**集群思路通过增加设备数量补足总处理能力，但原文的合计数字只是按单机速度相加的方案示例。若单机仍只有目标速度的十分之一，计划中的设备数量就无法达到预期总产出。原文未提供集群实测效率、设备协同损耗或完整运行成本。

### 论点14：资金与资源不足持续限制 Mapper 的迭代速度，使分辨率验证与生产所需吞吐量之间的差距迟迟未闭合。
**相应论据：**[17:00—17:17] 原文称 Mapper 的迭代和加速开发不断受资源及资金不足阻碍，欧洲深科技的小项目种子资金相对可得，但类似 Mapper 的大胆项目融资困难。[17:22—17:41] 到 2009 年，Mapper 的 300 毫米晶圆早期原型仅有 110 束，采用较低电压，在 CEA-Leti 洁净室能写出所需分辨率，却只有约每小时 1 片的吞吐量；原文称此时概念研究已经持续约二十年。[17:41—17:50] 作者推测，如果更早推出哪怕只有部分可用的产品，也许能获得更多发展动力。
**相应论证：**原文用能达到分辨率但达不到速度的原型状态，说明技术验证距离产业化仍有明显差距，并将迭代缓慢与资金不足相连。更早推出产品可能形成更强发展动力属于作者的反事实推测，没有实际结果证明。

### 论点15：2012 年融资为 Mapper 带来新的资金与俄罗斯合作，但同期 EUV 光源改进推动竞争路线加速成熟。
**相应论据：**[17:54—18:14] Mapper 于 2012 年完成 8000 万欧元融资，由俄罗斯国有投资基金 RUSNANO 领投；合作包括俄罗斯研究机构，后来在 Moscow 建立制造 Mapper 透镜元件的微机电系统工厂。[18:20—18:30] 同期 ASML 引入预脉冲，在主脉冲前改变锡滴形状，EUV 光源功率和吞吐量快速提高。
**相应论证：**原文把 Mapper 的新融资与 EUV 的技术进步并置，说明获得资金并未停止竞争技术的发展。预脉冲与功率、吞吐量提升的关系按原文叙述保留；材料没有量化该融资对 Mapper 开发速度的改善，也没有给出预脉冲单独贡献的幅度。

### 论点16：2013 年 FLX-1200 已具备一定图形性能，但达到集群所需速度仍要求大幅增加束数；同期 EUV 已实现更高单机吞吐量。
**相应论据：**[18:36—19:03] Mapper 于 2013 年向 CEA-Leti 交付首台试生产原型 FLX-1200，含 1300 束，能够实现 32 纳米半间距；原文称该性能适用于 14—90 纳米节点。设备原始吞吐量仍约每小时 1 片，要达到每小时 10 片，需要将束数由 1300 增至 13000，尚未实现。[19:11—19:16] 同期 ASML 的 EUV 光源达到约 80—100 瓦，对应约每小时处理 60 片晶圆。
**相应论证：**原文用 FLX-1200 的束数和速度说明其尚未达到既定目标，并以 EUV 的进展呈现竞争窗口收窄。增加束数十倍是原文提出的扩展要求，材料没有证明实际吞吐量会严格线性增加；32 纳米半间距与 14—90 纳米节点的适用关系也是原文口径，未展开解释。

### 论点17：评估 Mapper 的经济竞争力应结合投入、占地和维护条件，不能仅看单台设备每小时处理的晶圆数。
**相应论据：**[19:20—19:29] 作者明确提出，Mapper 的关键指标是每百万欧元投入对应的每小时晶圆处理量，或单位洁净室面积对应的每小时处理量，并指出 FLX-1200 的体积更小。[19:36—19:46] 维护人员只需从设备一侧进入即可更换电子源，原文称 EUV 无法做到这一点，并将其视为支持集群的重要条件。
**相应论证：**较小设备和单侧维护可以使多台设备组合的部署与维护更方便，因此原文强调用资本和面积归一化后的产能比较集群方案。材料没有设备价格、面积数字、维护时间或集群总成本，尚不足以完成经济性优劣判断。

### 论点18：EUV 逐渐成熟与核心投资人支持条件变化，使 Mapper 的原始融资叙事更难延续。
**相应论据：**[19:52—19:56] Mapper 团队仍相信能够推出经济上可竞争的主流光刻设备。[20:04—20:14] 长期投资人 Arthur Del Prado 于 2016 年 9 月去世，享年 85 岁，其遗产管理方表示只有找到新的领投方才会继续出资。[20:19—20:24] 原文称 EUV 已推进很远，而 Mapper 仍需大量资金才能把设备推向市场，因此“EUV 替代方案”的融资理由变得困难。
**相应论证：**原文将关键资金支持转为附条件，与竞争路线成熟放在一起，解释 Mapper 继续融资面临的障碍。团队相信具备未来经济竞争力属于当事人的判断，原文没有以完整成本数据证明这一判断。

### 论点19：Mapper 曾探索小批量光刻和个性化安全芯片，但用途转向仍无法避免较高商业化资金需求。
**相应论据：**[20:31—20:42] Mapper 考虑为原型、细分用途和学术研究提供小批量芯片制造设备，但原文称商业化仍需超过 1 亿美元。[20:47—20:58] 团队也探索安全用途的个性化芯片：无需掩模，可为每颗芯片写入特殊的硬件知识产权签名，以提高抵抗克隆和逆向工程的能力。
**相应论证：**原文将这些方向作为主流 EUV 替代路线之外的潜在市场。无掩模使逐芯片设计变化成为可能，但小批量方向仍需大量投入，安全方向也未给出产品、客户或效果验证。原文未展开论证硬件签名具体如何提高安全性及其商业可行性。

### 论点20：Mapper 最终破产，ASML 收购其资产并提供员工岗位，但没有继续原来的光刻设备开发工作。
**相应论据：**[21:02—21:08] Mapper 于 2018 年 12 月申请破产，随后有多家公司希望收购其知识产权。[21:08—21:27] 原文称 ASML 希望把相关技术留在荷兰，其 CEO 向 BNR 表示希望达成交易；数月后宣布以 7500 万欧元收购 Mapper 的知识产权和资产。[21:27—21:34] 当时约 240—270 名员工会获得工作机会，但原有工作不会继续。
**相应论证：**这一结果说明资产、技术和人才被承接，并不等于 Mapper 的原始商业路线被延续。原文随后介绍 ASML 将多束技术转向检测，用途变化构成该收购与 eScan 发展的联系；收购价格不能直接用于推算 Mapper 全部历史投入或投资回报。

### 论点21：先进工艺缺陷缩小提高了电子束检测的需求，其分辨能力可覆盖部分光学检测难以定位的缺陷。
**相应论据：**[21:38—21:47] ASML 在 2016 年以 31 亿美元收购台湾电子束检测公司 Hermes Microvision，即 HMI。[21:55—22:06] 常见光学检测利用光或激光照射晶圆，将测量结果与存储的标准图像或晶圆其他位置的图像比较，偏差提示缺陷。[22:12—22:22] 随 EUV 推进，缺陷变得更小，部分超出光学设备的定位能力；原文称电子束波长更短，可以发现宽约 1—10 纳米的缺陷。
**相应论证：**原文将缺陷尺寸缩小与检测分辨能力需求直接联系，说明电子束检测在先进工艺中的用途。1—10 纳米是原文给出的能力范围，未说明对应设备、测试条件、缺陷类型或检出率，不能据此推断所有电子束检测设备均具备同等能力。

### 论点22：2.5D 和 3D 结构增加了表面以下缺陷的检测需求，电子束电压衬度检测可以通过电学响应获取埋藏接触的信息。
**相应论据：**[22:25—22:36] 原文指出 2.5D、3D 结构增多，并以 3D NAND 为例，称光学检测无法发现堆叠层接触中的缺陷。[22:42—22:55] 电压衬度检测向晶圆表面发射初级电子并测量返回的次级电子，次级电子数量能够反映下方电接触的质量。
**相应论证：**原文把三维结构中接触不在表面的情况，与光学检测的局限联系起来，再以次级电子响应说明电子束可提供与下方电接触相关的信息。材料未展开该电学响应机制的详细条件，也未给出缺陷分类或实测准确率。

### 论点23：电子束检测同样受吞吐量限制，HMI 与 Mapper 多束技术的结合旨在使其更适合快速运行的生产线。
**相应论据：**[23:01—23:06] 半导体生产线运行很快，无法等待电子束设备逐一检查每个晶圆批次。[23:06—23:16] 原文称，把 HMI 电子束检测设备与 Mapper 多束技术结合，可能形成速度足以在生产线上运行的检测设备。
**相应论证：**单束检测需要扫描，原文因此把多束并行作为提高速度的方向。这里使用的是“可能”实现生产线所需速度的表述，材料没有给出全片覆盖时间、抽样比例或各代设备的实际生产线检测速度。

### 论点24：eScan 系列通过增加电子束数量逐步推进性能，eScan 2200 被描述为进一步扩大阵列和提高吞吐量的产品。
**相应论据：**[23:21—23:36] ASML 于 2022 年推出首款多束检测设备 eScan 1000，采用 3×3 阵列，共 9 束；之后 eScan 1100 采用 5×5 阵列，共 25 束。作者称这两款设备在客户使用中表现足够好。[23:36—23:47] 在两次渐进发展之后，eScan 2200 看起来将显著扩大电子束阵列并提高吞吐量，未来还预计有更多设备。
**相应论证：**原文以 9 束到 25 束的产品演进支持多束检测的发展方向，但没有披露 eScan 2200 的具体束数或实际速度。“客户使用中表现足够好”也没有客户名单和量化指标，因此只能保留为作者的概括性评价及对后续产品的预期。

### 论点25：多束检测服务于 ASML 的整体光刻战略，通过曝光前后工具和软件反馈共同改善先进制造表现。
**相应论据：**[23:58—24:25] 原文称新 eScan 设备属于 ASML 长期的整体光刻战略：先进性能不仅依靠晶圆厂里的扫描曝光设备，也需要曝光前的计算光刻与光学修正，以及曝光后的计量、检测和缺陷修正。[24:25—24:28] 各工具把数据与结果反馈至软件，用于分析和持续改善。
**相应论证：**原文明确给出工具协同与数据反馈的关系：曝光前修正设计成像，曝光后测量并识别问题，再将结果用于软件分析和后续改善。材料没有量化这种整合对良率、设备收入或客户成本的实际提升。

### 论点26：Mapper 的案例表明，一项技术在原始商业用途上的失败，仍可能在后续时代和其他用途上获得价值。
**相应论据：**[24:35—24:43] 作者总结，Mapper 技术未能与 ASML 光刻技术竞争，但作为 ASML 更大策略的一部分重新获得用途，提示半导体行业某个时代的失败可能成为另一个时代的成功。[19:52—21:34] 原始光刻路线最终破产并被收购。[21:38—23:47] 多束技术随后转用于电子束检测并进入 eScan 产品演进。
**相应论证：**原文通过用途变化支持这一总结：Mapper 未完成主流无掩模光刻商业化，其多束能力却能用于缓解电子束检测的吞吐量问题。这里的“成功”是作者对技术再利用的评价，材料未提供收购回报、产品利润或其他财务证据。

## 值得关注的信号

材料提供了三个相互关联的设备产业观察角度。第一，先进制造设备的竞争力需要同时考察分辨率、吞吐量、采购投入、洁净室占地和维护便利性；Mapper 所强调的每百万欧元投入对应的每小时晶圆处理量，以及单位洁净室面积对应的处理量，说明单机速度只是经济性的一个维度。但文中没有给出设备价格、集群实测效率或完整成本比较，不能据此认定 Mapper 已具备经济竞争力。第二，深科技商业化需要在技术迭代、资金持续性和竞争技术进步之间匹配时间窗口。Mapper 已证明部分图形分辨率，却仍需扩大束数和补足工程能力；在 EUV 取得进展后，其替代方案的融资吸引力下降，小批量应用的商业化也仍需超过 1 亿美元。第三，先进工艺和三维结构使缺陷检测对分辨率、电学信息和吞吐量的需求同时提高，为多束电子束技术提供了新的应用场景。ASML 将 Mapper 技术纳入 HMI 检测能力和整体光刻体系，体现了既有技术资产在不同用途中的再利用价值。eScan 2200 的具体束数、实际检测速度、售价、订单和收入贡献均未披露，文中只能支持其技术方向及战略关联，尚不能量化商业兑现程度。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"5d8c74471875af8b99ff83838a945da9ff9968726380368656bd9b0f0570af44","translationSha256":"df9df6d0a44069cf70772f93d2309f3442b7917866210019b0a6463d249736c3","sourceCharacters":24471,"timestampValues":293,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":293,"captionTimestampsManagedByProgram":true,"captionRepairedRows":1} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# ASML 的新型多束检测工具并不陌生

- 来源：YouTube·Asianometry

- 原始链接：https://www.youtube.com/watch?v=CqPsGYJHozM

- 时长：1497 秒


## 完整文字稿

[0:00] 我最近在安特卫普参加了 ITF World 2026，并参加了
[0:05] ASML 首席执行官 Christophe Fouquet 的一场演讲。
[0:09] Fouqet 简明扼要地介绍了 ASML 的各项计划，
[0:13] 其中一款产品吸引了我的注意：eScan 2200，一种多光束检测工具。
[0:19] 这引起了我的兴趣，因为我认出了它的多光束技术
[0:23] 来自一家已经倒闭的荷兰光刻初创公司 Mapper Lithography。
[0:28] Mapper 曾试图挑战 ASML 和 EUV，但遗憾的是失败了。在今天的视频中，
[0:34] 一种由 TSMC 支持的大规模并行电子束光刻技术。如今，它如凤凰涅槃般重生。
[0:42] ## 起源
[0:42] 使用光刻对晶圆进行图形化，通常会采用三种介质之一：
[0:46] 光、离子或电子。大多数人会想到光刻，
[0:52] 但电子提供了一种很有吸引力的替代方案。我们可以使用高度
[0:56] 聚焦的电子束，将芯片设计直接印制到涂有抗蚀剂的晶圆上。
[1:02] 这被称为电子束直写光刻，简称 EBDW 光刻。
[1:09] 最早的 EBDW 工具出现在 1960年代，其设计直接仿照了
[1:15] 电子显微镜。它们配有电子枪，用于产生单束
[1:19] 电子束。随后，这束电子会被加速，并通过电子光学系统聚焦。
[1:24] 接着，电子束会在晶圆表面
[1:27] 扫描，有点像 CRT 显示器绘制图像的方式。
[1:32] EBDW 最大的优势就是分辨率。自 20 纳米线
[1:38] 宽线宽以来。如今，它们的分辨率可以低于 1990 纳米——远低于 10 纳米
[1:44] 远远超过先进制程节点的需求。
[1:48] 光刻还会遇到一些问题：掩模上的某些图形
[1:52] 往往无法成功印制，这种情况称为热点。相比之下，电子束
[1:57] 可以绘制任意设计，从而带来更大的设计灵活性。
[2:02] 另一个好处是无需光掩模。因此，EBDW 有时也被称为
[2:09] “无掩模”光刻。一套先进掩模的制造成本可能高达数千万美元，
[2:14] 这对任何芯片制造商来说都是一笔巨大的成本门槛。采用无掩模技术就能省去这笔开支。
[2:21] ## EBDW 的致命弱点
[2:21] 那么，问题在哪里？这项技术的致命弱点是产能。EBDW 慢得像蜗牛。
[2:30] 单束电子束在晶圆上缓慢扫描的同时，逐步写入芯片图形。
[2:34] 对一片晶圆进行图形化可能要花很长时间——甚至数小时或数天。更糟的是，
[2:41] 随着摩尔定律不断推进，设计变得更加复杂，产能问题也会加重。
[2:46] 因此，电子束光刻
[2:48] 大多只用于制造前面提到的光掩模。
[2:52] 电子束光刻工具也可能用于制造原型芯片
[2:57] 用于客户或学术实验室内部的小批量芯片生产。这些用途
[3:03] 在经济上不足以证明昂贵掩模版的成本合理。
[3:07] 顺便说一句，这方面确实有真实需求。我在 SEMICON West 期间，
[3:12] 遇到一家生产“无掩模”光刻机的公司，名为 MicroWriter。
[3:17] 它不用电子束，但确实是无掩模的。挺酷的，去看看吧。
[3:23] ## SCALPEL（电子束光刻系统）
[3:23] 后来发展成 Mapper 的技术是在荷兰开发的。
[3:27] 这个想法最早由代1990后期的 Delft 理工大学物理学教授 Pieter Kruit 提出，他的专长是显微镜中的电子光学。
[3:33] 专攻显微镜电子光学的代尔夫特理工大学。
[3:39] 这段经历让 Kruit 开始参与一种称为电子束
[3:43] 投影光刻的技术。具体来说，就是“SCALPEL”，
[3:46] 意为“带角度限制的散射投影电子束光刻”。
[3:53] 这一概念由1989的传奇机构 AT&T 贝尔实验室（后来成为
[3:59] Lucent 的一部分）发明，作为193纳米光刻之后的下一代光刻技术候选方案。
[4:07] 从某种程度上说，SCALPEL 试图仿照光刻技术，
[4:10] 但使用的是电子束。首先，它将电子束投射到散射掩模版上。
[4:16] 掩模版上印有芯片设计图案，尺寸是实际尺寸的四倍。
[4:21] 出于散热方面的考虑，这种掩模版由一种对电子大体透明的材料制成。
[4:26] 因此，许多电子可以穿过，方向几乎不会改变。
[4:32] 但印在掩模版上的“墨水”会使电子以很大的
[4:36] 角度发生散射。因此，当电子束到达掩模版时，
[4:40] 电子可能出现两种情况之一：要么直接穿过，要么发生散射。
[4:45] 之后，电子会通过一个磁透镜，再通过一个孔径。
[4:50] 这个孔径会滤除强烈散射的电子，从而避免精密而昂贵的
[4:57] 掩模版承担滤波工作，也就避免它受到强烈的电子轰击。
[5:02] 最终，芯片图案会以高对比度成像在涂有光刻胶的晶圆上。
[5:08] 贝尔实验室研究 SCALPEL 十多年，却没能让它实现可用。Kruit 曾帮助
[5:14] ASML 评估一套类似系统，并认定它存在根本性缺陷。
[5:20] 使用孔径会迫使束流中的所有电子通过一个“交叉点”。
[5:26] 电子会相互排斥。因此，带能量的电子通过这个狭窄通道时，
[5:31] 会开始随机地相互干扰，
[5:34] 彼此推开。这会造成束流模糊，破坏分辨率。
[5:41] 由于电子之间的相互作用具有随机性，无法用普通透镜
[5:46] 来校正这种模糊——实际上，这使 SCALPEL 无法使用。Applied Materials 以及后来的 Nikon 多年来
[5:53] 一直在研究这种电子投影光刻的变体，但都没有成功。
[6:00] ## Mapper 的创立
[6:00] 克鲁伊特使用这种器件的经验，让他开始思考如何进行电子束光刻，并避免 SCALPEL 的缺点。
[6:05] 电子束光刻，并避免 SCALPEL 的缺点。
[6:08] 当时，还有另外两种试图避开
[6:12] 这种随机干扰问题的电子束方案。有些系统投射
[6:17] 1:1光掩模图像，但需要1:1掩模，这构成了一个严重问题。你必须
[6:24] 制作一块具有与最终芯片同尺寸特征的掩模。这可不是件容易的事。
[6:30] 另一个候选方案是 IBM 制造的一种系统，它使用由电子束微型柱组成的阵列
[6:36] 并行制作图案，吞吐量相对较高。这种方案可行，
[6:42] 但要如何制造并控制一个均匀且稳定的电子束阵列呢？
[6:47] 克鲁伊特提出的核心概念，是并行产生大量细小的电子束
[6:52] 束斑。他最初的论文提出了一百万到100百万个束斑。每个束斑代表芯片设计中的
[6:59] 一个像素。由于每个束斑的功率都很低，它们不会彼此干扰。
[7:07] 克鲁伊特让他的两名研究生贝尔特·坎弗贝克和马尔科·维兰德开发这一
[7:13] 概念，并将其命名为“逐像素多孔径分辨率增强技术”，简称 MAPPER。
[7:21] 最终，进展足够理想，可以继续推进。于是他们筹集了几百万，
[7:25] 获得大学授予的知识产权许可，并于2000创立了 Mapper Lithography 公司，
[7:31] 两名研究生也加入了团队。
[7:34] 早期投资者之一是亚瑟·德尔·普拉多，
[7:37] 这位荷兰半导体界的传奇人物以创办设备制造商 ASM International 而闻名。没错，
[7:43] 它是 ASML 的母公司之一，至今仍是欧洲规模较大的半导体公司之一。
[7:49] ## 制造设备
[7:50] 最初的设想是让大量电子束
[7:52] 束斑各自拥有独立的电子源。
[7:55] 为此，克鲁伊特等人从一个巧妙的概念着手。他们用大约一百万个小光点组成的阵列，照射
[8:00] 一块标准的透明铬石英光掩模。
[8:05] 掩模图案会挡住或放行某些光点。
[8:11] 随后，一组光学透镜会缩小光点图案阵列，然后
[8:16] 它再照射到一块“转换板”上。转换板会把这组
[8:21] 光转换成一组细小电子束，随后这些电子束可以射向晶圆。
[8:26] 有多少束？每个电子“光点”的宽度约为100纳米。整个阵列
[8:32] 约为5毫米乘以20毫米，因此大约有20百万个细小电子束束斑。
[8:39] 这个方案虽然巧妙，但最终还是失败了。整个方案依赖于
[8:44] 转换板。虽然它确实能稳定地产生电子，
[8:48] 但其中一些电子离开电子源时的角度或能量不对。
[8:53] 嗯，这只是一个非常简化的解释。说得更清楚一些——天啊，我真希望
[8:59] 自己没弄错——他们当时的理解是，转换板会
[9:03] 像光电阴极一样工作。光激发出一个电子。随后电子向上漂移
[9:09] 然后以有序的方式从尖端射出。没有储存——电子本质上是
[9:15] 被击出的——而且电流稳定。这是一种可以开关的电子枪。
[9:22] 结果发现，这种理解是错误的。那块板实际上并不是光电阴极，
[9:27] 而是一个为场发射体供电的光电二极管。我们以为被击出的那个电子
[9:34] 并不是那样产生的。实际上，它来自一群被电场拉向尖端而形成的
[9:40] 受激电子。光只是通过光电二极管为这群电子补充能量。
[9:47] 正因为如此，我们无法直接控制离开尖端的
[9:52] 电子的能量和位置。这会造成模糊。此外，我们无法足够快地
[9:57] 打开或关闭它。所以从纸面上看它很稳定，但实际上不适用于光刻。
[10:04] 于是他们加了一个孔径，用来滤除异常电子。
[10:09] 但成功通过该孔径的那些束流子中的
[10:13] 电子数量并不稳定——这使得这套装置不适用于光刻。
[10:19] 在为此苦苦挣扎了 1-2 年之后，
[10:22] 他们想出了另一个办法：将一束电子束分成许多
[10:27] 平行的束流子。这让我有些想起水流穿过淋浴喷头的样子。
[10:33] 整个阵列扫描时，每个束流子都会单独开关
[10:38] 在一片涂有抗蚀剂的晶圆上，扫描一个 26 毫米乘 10 毫米的区域。再说一次，
[10:44] 就像阴极射线管的电子枪在电视屏幕上扫描一样。
[10:49] ## Mapper 和 IMS
[10:49] 这套装置有些像 IMS 多束掩模写入机，
[10:53] 由位于维也纳的 IMS Nanofabrication 制造。
[10:57] 这是 TSMC 目前用于写制掩模的掩模写入机之一。那台设备也从一束电子束开始，
[11:03] 再将其分成许多束流子。两者一样吗？我也有同样的问题。
[11:10] 使用掩模写入机时，束流子阵列会被逐个消隐，以生成
[11:15] 掩模设计。随后，投影透镜会将阵列缩小到设计的实际尺寸，
[11:20] 以便打印到掩模基板上。Mapper 的设计从这里开始与 IMS 不同。
[11:27] IMS 掩模写入机的缩小光学系统需要一个交叉点——有点像
[11:33] 一个瓶颈，所有电子都必须通过这里。对于电流过大的
[11:38] 电子束，这会引发我们之前讨论过的相同列间相互作用问题。
[11:43] 掩模写入机通过采用相对低电流的电子束来补偿，代价是写入速度
[11:49] 不快。再说一次，这对写掩模来说没问题，但不适用于晶圆厂光刻。Mapper 的系统移除了这个
[11:56] 交叉点——因此可以使用更高电流，但代价是控制复杂度大幅提高。
[12:03] ## 构建原型
[12:03] 构建这台设备是一项巨大的挑战。先从它最关键的
[12:06] 组件开始：束流消隐器阵列。
[12:10] 这是一个特殊定制的微芯片，可能有数千个 1-2 微米
[12:15] 宽的孔，通过干法刻蚀穿透芯片钻出。如果某个
[12:20] 像素对应的束流需要根据设计数据关闭，那么芯片就会
[12:24] 在对应孔周围施加电压，使束流偏转到挡块上。
[12:29] 这是一种采用先进制程制造的高度定制微芯片。台积电先制造芯片，然后由
[12:35] Mapper 团队亲自刻蚀这些孔。这部分很困难。每次出了问题，
[12:41] 他们都得再付大约一百万美元给台积电，以制造下一个版本。
[12:46] 团队在设备的其他部分也面临着挑战。比如，
[12:51] 用于固定和定位晶圆的机电系统。在 Mapper 的方案中，他们不能使用传统的
[12:56] 直线电机，因为这类电机会产生磁场，可能干扰电子束。
[13:02] 不过，由于 Mapper 不需要对准光掩模和晶圆——他们的设备
[13:07] 只是持续扫描晶圆——因此他们不必像典型的光刻设备那样
[13:12] 为剧烈的启停动作进行设计。一位 Mapper 设计师估计，
[13:18] Mapper 设备中的加速度比典型的 ASML 设备小 100 倍。
[13:25] 另一个问题是热量。晶圆不断受到电子束轰击，
[13:30] 因此会变热。所以他们需要想办法主动冷却晶圆。
[13:36] 另一个问题是数据传输速度。由于他们要把芯片设计数据直接流入
[13:41] 束流消隐阵列，就必须非常快速地传输海量数据。由于铜
[13:46] 线跟不上，Mapper 不得不采用玻璃光纤，这在当时相当创新。
[13:53] 这些技术挑战意味着，花了好几年时间才将一款可用的
[13:57] 产品推向市场。根据圣何塞一场无掩模光刻会议的演讲，
[14:02] 他们在 Q4 2005 首次实现了光刻验证。
[14:07] ## 下一代光刻
[14:08] 他们当时在与时间赛跑。那时，
[14:11] 下一代光刻技术究竟会是什么，仍存在很大的不确定性。
[14:16] EUV 显示出一些潜力，但当时它只是若干下一代
[14:21] 光刻候选技术之一。没人知道接下来会是什么。业界经常举办“下一代
[14:26] 光刻”会议，由专家分享并讨论他们的成果。
[14:32] 在这些会议结束时，
[14:34] 与会者会投票选出哪种技术有望从一片混沌中脱颖而出，成为有力竞争者。
[14:39] 投票结果再清楚不过地表明，没人有头绪。这简直是蛮荒西部！
[14:45] 甚至有一派人断言，根本不会出现任何下一代光刻技术！
[14:51] 这些人主张，我们只要无限期地采用多重图形化，比如节距分割。这类方法
[14:57] 确实让晶圆厂推进到了 22 纳米节点，但还能再往前推进多远？
[15:02] 台积电不是那种会把全部筹码押在单一技术上的公司。
[15:06] 因此，即使他们与英特尔和三星一起资助 ASML 开发 EUV，
[15:12] 他们探索了替代方案。这让他们与 Mapper 建立了联系。
[15:17] ## 台积电与 Mapper
[15:17] 在 2008，这家台湾巨头宣布投资 Mapper。
[15:22] 他们想要一种可行的 EUV 替代方案。因此，台积电的研发人员会
[15:27] 购买 Mapper 的设备，并向他们提供反馈和支持。
[15:31] 该公司尤其关注 Mapper 的
[15:34] 这种无掩模光刻技术如何帮助遏制当时飞涨的掩模成本。
[15:40] 该公司公开表达了支持，并且确实对此深信不疑。在 2007 年末，
[15:46] Mapper 宣布在制造 32 纳米级图形方面取得里程碑式进展时，
[15:50] 他们的光刻导师 Burn Lin 博士表示：
[15:53] > 这一成就是一项重大突破。这证明了
[15:58] Mapper 的低电压方案具备多束分辨能力。
[16:04] Mapper Lithography 还将其设备部署在
[16:08] 法国领先的半导体研究机构 CEA-Leti。
[16:11] 这是名为 IMAGINE 的大型无掩模光刻研究项目的一部分。这样的场所
[16:18] 对于找出设备的各种问题并使其为生产晶圆厂做好准备至关重要。
[16:24] Mapper 和台积电为克服产能缓慢问题采取的策略是集群化。
[16:30] 设备的目标速度约为每小时 10 片晶圆。这与每小时约 100 片晶圆的需求似乎相差很大，
[16:36] 要与 EUV 或双重图形化竞争，就需要达到这个速度，对吧？
[16:42] 但通过将多台设备组成集群，
[16:45] 他们可以尝试缩小这段差距。一组由十台每小时处理 10 片晶圆的设备组成的集群可以处理
[16:52] 100 片晶圆。六台每小时能处理 20 片晶圆的设备，总共可以处理 120 片晶圆。
[17:00] ## EUV 的整合，但 Mapper 迭代和加快
[17:03] 开发的能力却一直受到资源和资金匮乏的阻碍。
[17:07] 我在欧洲深科技圈听过几次这种说法。做
[17:13] 困难的事情需要资金。虽然规模较小的项目可以获得种子资金，
[17:17] 但要为 Mapper 想做的这类大胆项目筹集资金并不容易。
[17:22] 到 2009，Mapper 已经有了一台用于 300 毫米晶圆的 Alpha 设备，但只有 110 束，且采用较低的
[17:29] 电压。虽然它在 CEA-LETI 洁净室内印出了正确分辨率的图形，但其产能
[17:35] 约为每小时 1 片晶圆，远低于集群策略奏效所需的 10。
[17:41] 这时，他们已经为这个构想投入了二十年。假如公司能更快拿出成果，
[17:46] 哪怕这个成果只有一半可用，
[17:50] 或许也能带来更大的发展势头。
[17:54] 这导致了一些令人咋舌的情况。在 2012，他们完成了
[17:58] 一轮 80 百万欧元的融资，由俄罗斯国有投资基金
[18:04] RUSNANO 领投。该基金专注于在俄罗斯境内建设纳米技术集群。
[18:10] 作为这项合作的一部分，Mapper 与俄罗斯的研究机构开展了合作
[18:14] 之后还会在莫斯科开设一座 MEMS 晶圆厂，为 Mapper 设备生产透镜元件。
[18:20] 但大约在那轮融资前后，ASML 的 EUV 光源开始取得实质性进展
[18:25] 这得益于引入了预脉冲，在主脉冲发射前重塑锡液滴
[18:30] 随着功率水平迅速提升，EUV 的吞吐量也随之提高。
[18:36] 在 2013，Mapper 向 CEA-Leti 交付了首台原型
[18:39] 预量产设备——名为 FLX-1200——。
[18:45] 这台设备有 1,300 个束流，并且能够以
[18:49] 32 纳米半间距进行图形化——这一性能足以匹配 14-90 纳米节点。
[18:55] 当时，其原始吞吐量仍只有每小时 1 片晶圆。要提升到
[19:00] 所需的每小时 10 片晶圆，就需要把
[19:03] 束流数量从 1,300 增加到 13,000。他们当时还没做到，但这是有可能的。
[19:11] 到那时，ASML 已将光源功率提升到 80 至 100 瓦，
[19:16] 相当于每小时处理约 60 片晶圆。
[19:20] 不过，我想指出，对 Mapper 来说，关键指标并不是
[19:23] 晶圆的原始吞吐量。关键指标是每百万欧元投资对应的每小时晶圆数，或者
[19:29] 每平方米洁净室占地面积对应的每小时晶圆数。FLX-1200 是一台小得多的设备。
[19:36] 此外，维护 FLX-1200 也容易得多。维修人员
[19:41] 只需接触设备的一侧，就能更换光源。
[19:46] EUV 做不到这一点，而这也是实现集群化的关键技术要点。
[19:52] ## 破产与 ASML
[19:52] 即使 EUV 发展势头正盛，Mapper 的人仍然相信，他们本可以将一款在经济上具有竞争力的主流光刻机推向市场。但命运和资金介入了。
[19:56] 但命运和资金介入了。
[20:04] 2016，Arthur Del Prado 在 85 岁时去世。
[20:09] 他一直是坚定的投资者，但在他去世后，他的遗产管理方告诉 Mapper，
[20:14] 只有这家初创公司找到新的领投方，他们才会继续提供资金。
[20:19] 但他们要怎么推介？最初开发 EUV 替代方案的想法很难获得资金，
[20:24] 因为 EUV 已经发展得相当成熟，而 Mapper 还需要更多资金才能将设备推向市场。
[20:31] 他们还寻求开发用于小批量芯片生产的设备，以供原型制作、
[20:36] 小众应用或学术研究使用。也就是我之前提到的 Maskless Litho 设备
[20:42] ——但要将其商业化，需要超过 100 百万美元。
[20:47] 他们还探索了出于安全目的制造个性化芯片。由于没有
[20:52] 掩模，设计人员可以将特殊的硬件 IP 签名写入每一颗芯片，
[20:58] 从而增强芯片抵御克隆和逆向工程的能力。
[21:02] 最终，他们耗尽了时间；2018，公司申请破产。
[21:08] 有几家公司提出收购 Mapper 的 IP，但 ASML 采取行动，将其留在荷兰。他们的
[21:14] CEO 告诉荷兰知名新闻广播电台 BNR，他们想达成一笔交易。
[21:21] 因此，几个月后，ASML 宣布将收购 Mapper 的知识产权和资产，价格为
[21:27] 75 百万欧元。当时在 Mapper 工作的 240-270 人也将获得工作机会，
[21:34] 但这项工作本身不会继续进行。
[21:38] ## 检测
[21:38] ASML 认为 Mapper 的多束技术另有用途。
[21:42] 几年前，在 2016，他们花费 3.1 亿美元收购了一家台湾
[21:47] 公司，名为 Hermes Microvision，简称 HMI。HMI 从事电子束检测。
[21:55] 检测是为了发现缺陷。这些设备大多通过向晶圆上的图案发射光
[22:00] 或激光，并将测量结果与存储在内存中的“黄金图像”或晶圆其他区域的图像进行比较来工作。
[22:06] 偏差意味着可能存在缺陷。
[22:12] 但随着 EUV 的发展，缺陷会变得更小、更难发现，超出使用光学光的检测
[22:16] 工具所能精确定位的范围。电子束的波长短得多，
[22:22] 能够发现宽度小至 1-10 纳米的缺陷。
[22:25] 另一项重要趋势是 2.5D 和 3D 结构的兴起。这类结构
[22:31] 意味着并非所有东西都位于表面。例如，光学检测
[22:36] 无法检测我们为 3D NAND 制造的这些堆叠层中的接触点缺陷。
[22:42] 但电子束检测可以进行一种称为电压衬度检测的检测。在这种检测中，我们向晶圆表面发射初级
[22:48] 电子，并测量反弹回来的“二次”电子。二次电子的数量
[22:55] 会以可预测的方式反映下方电接触的质量。
[23:01] 问题又出在吞吐量上。半导体生产线运行得极快，
[23:06] 没有时间等电子束设备逐批检测每一批晶圆。但如果将
[23:12] HMI 电子束检测设备与 Mapper 的多束技术结合起来，
[23:16] 就有可能制造出速度足够快、能够在线运行的检测设备。
[23:21] 在 2022，ASML 推出了首款多束检测设备：
[23:26] eScan 1000，配备 9 束，排列成 3x3 网格；随后推出 1100，配备 25 束，排列成 5x5 网格。
[23:36] 客户使用时，这两款设备的表现都足够好。经过这两次渐进式改进之后，
[23:42] eScan 2200 似乎大幅增加了束阵列规模，从而提升了吞吐量。
[23:47] 预计还会推出更多设备。
[23:50] ## 结语 在结束之前，我想感谢 Mapper 的几位前员工，
[23:53] 他们慷慨地与我谈起了自己在公司的工作经历。
[23:58] 这款新 eScan 设备是 ASML 长期坚持的整体光刻企业战略的一部分。
[24:04] 核心理念是，光刻不只是晶圆厂车间里的扫描机。要
[24:09] 实现领先水平的性能，我们还需要集成其他工具。例如，
[24:14] 曝光前用于计算光刻和光学校正的工具……
[24:19] 以及曝光后用于计量和检测、以发现并纠正缺陷的工具。
[24:25] 曝光。这些项目共同发挥作用，将数据
[24:28] 和结果反馈到软件中，以供分析并持续改进。
[24:35] Mapper Lithography 的技术未能与 ASML 竞争，
[24:38] 但作为这一更大战略的一部分，它得以重振，这很好地提醒我们，
[24:43] 在半导体行业，一个时代的失败可能会成为另一个时代的成功。

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=CqPsGYJHozM
- 来源：YouTube·Asianometry
- 发布时间：2026-10-12
- 行业：算力芯片
- 公司：ASML；Mapper Lithography；TSMC；IMS Nanofabrication；Hermes Microvision（HMI）；AT&T Bell Labs；Lucent；Applied Materials；Nikon；IBM；ASM International；RUSNANO。相关研究机构：Delft University of Technology、CEA-Leti。
- 归档时间：2026-10-12T03:05:25.029Z

---

# ASML’s New Multibeam Inspection Tool is Familiar

- 来源：YouTube·Asianometry

- 原始链接：https://www.youtube.com/watch?v=CqPsGYJHozM

- 时长：1497 秒


## 完整文字稿
[0:00] I was recently at ITF World 2026 in Antwerp and attended
[0:05] a presentation by ASML's CEO: Christophe Fouquet.
[0:09] As Fouqet crisply walked through ASML's various initiatives,
[0:13] one product caught my eye: The eScan 2200, a multibeam inspection tool.
[0:19] This sparked my interest because I recognized its multibeam technology
[0:23] from a defunct Dutch lithography startup called Mapper Lithography.
[0:28] Mapper tried to take on ASML and EUV, but sadly failed. In today's video,
[0:34] a TSMC-backed massively parallel e-beam lithography tech. Now like the phoenix, reborn.
[0:42] ## Beginnings
[0:42] Patterning a wafer using lithography often employs one of three mediums:
[0:46] Light, Ions, or Electrons. Most people think about photolithography,
[0:52] but electrons offer a compelling alternative. We can use a highly
[0:56] focused electron beam to directly print the chip design onto the resist-coated wafer.
[1:02] They call it Electron Beam Direct Write lithography, or EBDW Lithography.
[1:09] The first EBDW tools emerged in the 1960s and were directly modeled on
[1:15] electron microscopes. They have an electron gun to generate a single
[1:19] beam. That beam is then accelerated and focused with electron optics.
[1:24] The beam is then scanned across the wafer's
[1:27] surface kind of like how a CRT display draws an image.
[1:32] EBDW's single best upside is resolution. Systems have been doing 20 nanometer line
[1:38] widths since the 1990s. Today they can do resolutions below 10 nanometers - far
[1:44] beyond what is demanded for leading edge process nodes.
[1:48] Photolithography also suffers issues where certain patterns on the mask
[1:52] tend to fail to print, called hot spots. Electron beams on the other
[1:57] hand can draw arbitrary designs, granting more design flexibility.
[2:02] Another benefit is that there is no photomask. This is why EBDW is sometimes also called
[2:09] "mask-less" lithography. A set of leading-edge masks can cost tens of millions of dollars to
[2:14] produce - a substantial cost hurdle for any chipmaker. Going maskless gets to skip that.
[2:21] ## EBDW's Achilles Heel
[2:21] So what is the catch? The technique's Achilles Heel is its throughput. EBDW is slow as molasses.
[2:30] The single electron beam writes the chip pattern as it slowly scans across
[2:34] the wafers. It can take a long time - hours, days, even - to pattern a wafer. Worse yet,
[2:41] as Moore's Law progresses, more complex designs worsen the throughput problem.
[2:46] For this reason, electron beam lithography
[2:48] is mostly only used to produce the aforementioned photomasks.
[2:52] E-beam litho tools might also be used to produce prototype chips
[2:57] for clients or special small runs of chips inside academic labs. Purposes
[3:03] that do not economically justify the cost of an expensive mask.
[3:07] There is a real need for that by the way. While I was at SEMICON West,
[3:12] I came across a company producing "maskless" lithography machines, called the MicroWriter.
[3:17] It doesn't use an electron beam, but it is maskless. Pretty cool, go check them out.
[3:23] ## SCALPEL
[3:23] The technology behind what would eventually become Mapper was developed in the Netherlands.
[3:27] The idea was first dreamed up in the late 1990s by Pieter Kruit - a professor of physics at
[3:33] Delft University of Technology specializing in electron optics as part of microscopes.
[3:39] This experience got Kruit involved in something called electron beam
[3:43] projection lithography. Specifically "SCALPEL",
[3:46] which stands for "SCattering with Angular Limitation Projection Electron Beam Lithography".
[3:53] The concept was invented in 1989 by the legendary AT&T Bell Labs (later part of
[3:59] Lucent) as a potential next generation lithography technology after 193-nanometer photolithography.
[4:07] SCALPEL sort of tries to mimic photolithography
[4:10] but for electron beams. First, it projects an electron beam onto a scattering mask.
[4:16] The mask has the chip design printed on it at four times its actual size.
[4:21] For heat reasons, this mask is made out of a material largely transparent
[4:26] to electrons. So many pass through with little change in direction.
[4:32] But the "ink" printed on the mask can cause electrons to scatter at a sharp
[4:36] angle. So when the electron beam reaches the mask,
[4:40] one of two things can happen to its electrons: They either pass through or get scattered.
[4:45] After this, the electrons then go through a magnetic lens and then an aperture.
[4:50] That aperture filters out the strongly scattered electrons. This spares the delicate and expensive
[4:57] mask from doing the filtering and thus receiving a powerful electron bombardment.
[5:02] The end result is a high contrast image of the chip pattern on the resist-coated wafer.
[5:08] Bell Labs worked on SCALPEL for over a decade, but failed to get it to work. Kruit helped
[5:14] evaluate a similar system for ASML, and determined it to be fundamentally flawed.
[5:20] The use of an aperture forces all the electrons in the beam to pass through a "crossover".
[5:26] Electrons repel one another. So energized electrons passing through this chokepoint
[5:31] start stochastically interfering with each other,
[5:34] pushing each other aside. This creates a beam blur that ruins the resolution.
[5:41] Since the interactions between electrons are stochastic, this blur cannot be corrected
[5:46] with ordinary lenses - effectively making SCALPEL unusable. Applied Materials and later Nikon would
[5:53] work on variants of this electron projection lithography for years afterward to no avail.
[6:00] ## Founding Mapper
[6:00] Kruit's experience with this device got him thinking about how to do electron
[6:05] beam lithography and avoid SCALPEL's shortcomings.
[6:08] At the time, there were two other e-beam proposals that tried to avoid
[6:12] this stochastic interference problem. There were systems that projected a
[6:17] 1:1 photomask image but that needed a 1:1 mask, which was a serious problem. You had
[6:24] to produce a mask with features the same size as the final chip. Not an easy task.
[6:30] The other candidate was an IBM-made system that used an array of minicolumns of electron
[6:36] beams to produce designs in parallel with relatively higher throughput. This can work,
[6:42] but how to produce and control an array of beams that is uniform and stable?
[6:47] The core concept that Kruit came up with is to produce many small electron beamlets in
[6:52] parallel. His original paper suggested a million to 100 million beamlets. Each beamlet represents
[6:59] a pixel in the chip design. Since each beamlet is low power, they won't interfere with each other.
[7:07] Kruit got two of his graduate students Bert Kampherbeek and Marco Wieland to develop the
[7:13] concept, which was named "Multiple Aperture Pixel by Pixel Enhancement of Resolution", or MAPPER.
[7:21] Eventually, progress was good enough to move forward. So they raised a few million,
[7:25] licensed the IP from the university, and started the company Mapper Lithography in 2000,
[7:31] with the two graduate students joining the team.
[7:34] One of the early investors was Arthur Del Prado,
[7:37] the Dutch semiconductor legend known for founding equipment-maker ASM International. Yes,
[7:43] one of the parents to ASML and still one of Europe's larger semiconductor companies.
[7:49] ## Building the Tool
[7:50] The original idea was for each of the many electron
[7:52] beamlets to have their own individual source.
[7:55] To do this, Kruit and others started with a clever concept. They illuminated
[8:00] a standard transparent chromium-quartz photomask with an array of a million or
[8:05] so small light spots. The mask pattern blocks or allows certain light spots.
[8:11] A set of optical lens would then shrink the light spot pattern array before it
[8:16] then hits a "converter plate". The converter plate turns this array of
[8:21] light into an array of small electron beams that can then go to the wafer.
[8:26] How many beams? Each electron "spot" was about 100 nanometers wide. The whole array
[8:32] about 5 millimeter by 20 millimeters, so about 20 million little electron beamlets.
[8:39] While clever, this setup ultimately failed. The whole thing depends on
[8:44] the converter plate, and while it did generate stable amounts of electrons,
[8:48] some of those electrons left the source at wrong angles or energies.
[8:53] Well that is a very simplified answer. To be more clear - and oh God I hope I
[8:59] got this right - the understanding they had going in was that the converter plate would
[9:03] act like a photocathode. Light excites an electron. Electron then drifts to the top
[9:09] and then exits the tip at an orderly fashion. Nothing stored - the electron is essentially
[9:15] knocked out - and current is stable. An electron gun we can toggle on and off.
[9:22] Turns out that understanding was wrong. The plate wasn't actually a photocathode,
[9:27] but rather a photodiode feeding a field emitter. The electron we thought was being knocked out was
[9:34] not that. Rather, it was actually coming from a pool of excited electrons created by an electric
[9:40] field pulling them to the tip. The light was just refilling that pool via the photodiode.
[9:47] And because of this, we cannot directly control the energy and position of the
[9:52] electron leaving the tip. Creating blur. Moreover, we cannot switch it on or off
[9:57] fast enough. So on paper, it looks stable but in reality unsuitable for lithography.
[10:04] So they added an aperture to filter out aberrant electrons.
[10:09] But the number of electrons in those beamlets successfully passing through
[10:13] that aperture was not stable - making the setup unsuitable for lithography.
[10:19] After struggling with this for 1-2 years,
[10:22] they came up with a different idea: A single electron beam split into many
[10:27] parallel beamlets. I am somewhat reminded of water flow going through a shower head.
[10:33] Each individual beamlet is switched on and off as the whole array scans
[10:38] a 26-millimeter by 10-millimeter field across a resist-coated wafer. Again,
[10:44] like the cathode ray tube gun scanning across the TV screen.
[10:49] ## Mapper and IMS
[10:49] This setup somewhat resembles the IMS Multi-beam mask-writer,
[10:53] made by IMS Nanofabrication in Vienna.
[10:57] That is one of the mask-writers that TSMC is now using to write its masks. That device also starts
[11:03] with a single beam and splits it up into many beamlets. Is it the same? I had the same question.
[11:10] With the mask-writer, the beamlet array is individually blanked to produce the
[11:15] mask design. A projection lens then shrinks the array to the design’s actual size for
[11:20] printing onto the mask blank. Here at this point, Mapper's design differs from IMS's.
[11:27] The IMS mask-writer tool's demagnifying optics require a crossover point - something like
[11:33] a chokepoint that the electrons have to all pass through. For beams with too high
[11:38] a current, this brings up the same column interaction problems we discussed earlier.
[11:43] The mask-writer compensates by making the beam a relatively low current at the cost of not writing
[11:49] very fast. Again, fine for writing masks but not for fab lithography. Mapper’s system removes this
[11:56] crossover - allowing it to push higher currents but at the cost of much more control complexity.
[12:03] ## Building a Prototype
[12:03] Building the tool was a huge challenge. Starting with its
[12:06] most critical component: the beam blanker array.
[12:10] This was a special custom microchip with potentially thousands of 1-2 micrometer
[12:15] wide holes drilled through it using dry etch. If a beamlet at a certain
[12:20] pixel needs to be switched off per the design data, then the chip runs
[12:24] a voltage around the corresponding hole to deflect the beamlet towards a stopper.
[12:29] This is a very custom microchip fabbed with an advanced node. TSMC first fabs it and then the
[12:35] Mapper team etches the holes themselves. This part was hard. Every time something went wrong,
[12:41] they had to pay another million dollars or so to TSMC for the next version.
[12:46] The team faced other challenges elsewhere in the tool. Like for instance in the
[12:51] mechatronics holding and positioning the wafer. In Mapper's case, they could not use traditional
[12:56] linear motors because those generate magnetic fields that can interfere with the e-beams.
[13:02] Though since Mapper does not need to align photomask and wafer - their tool
[13:07] just continuously scans across that wafer - they don't need to engineer for the same
[13:12] violent stops and starts as a typical litho tool. One Mapper designer estimated that the
[13:18] accelerations in a Mapper machine are 100 times less than a typical ASML machine.
[13:25] Another issue was heat. The wafer constantly struck by electron beams meant that the
[13:30] wafer got hot. So they needed to figure out a way to actively cool the wafer.
[13:36] Another thing was data velocity. Since they were streaming chip design data right into
[13:41] the beam blanker array, they had to transport a huge amount of data very quickly. Since copper
[13:46] wires cannot keep up, Mapper had to adopt glass fiber, which at the time was quite innovative.
[13:53] Such technical challenges meant that it took several years to bring a working
[13:57] product to market. Per a presentation for a meeting on maskless lithography in San Jose,
[14:02] they achieved first proof of lithography in Q4 2005.
[14:07] ## Next Generation Lithography
[14:08] They were racing against the clock. At the time,
[14:11] there was much uncertainty about what would be the next generation lithography technique.
[14:16] EUV showed some potential, but at the time it was just one of several next generation
[14:21] lithography candidates. Nobody knew what was next. The industry frequently held these "Next
[14:26] Generation Lithography" conferences where experts shared and discussed their results.
[14:32] At the end of these conferences,
[14:34] attendees voted on which technology would emerge from the morass as the contender.
[14:39] The results showed all too clearly that nobody had any idea. It was the wild west!
[14:45] One faction even asserted that there would not be any next generation lithography technology at all!
[14:51] These guys advocated we just do multi-patterning like pitch-splitting indefinitely. Such methods
[14:57] did bring the fabs to the 22 nanometer node, but how much further can it go?
[15:02] TSMC is not the type of company to bet the farm on a single technology.
[15:06] So even as they funded EUV development at ASML alongside Intel and Samsung,
[15:12] they explored alternatives. This got them in touch with Mapper.
[15:17] ## TSMC and Mapper
[15:17] In 2008, the Taiwanese giant announced an investment in Mapper.
[15:22] They wanted a workable alternative to EUV. So TSMC's R&D staff would
[15:27] buy Mapper's tools and give them feedback and support.
[15:31] The company was particularly interested in how Mapper's
[15:34] type of maskless lithography can help bend the curve on then-skyrocketing mask costs.
[15:40] The company was vocal in its support and really believed in it. In late 2007,
[15:46] when Mapper announced a milestone in producing 32-nanometer class patterns,
[15:50] their lithography sensei Dr. Burn Lin stated:
[15:53] > This achievement is a significant breakthrough. This proves the
[15:58] multi-beam resolution capability of Mapper's low voltage approach.
[16:04] Mapper Lithography also placed their tool in CEA-Leti,
[16:08] France's leading semiconductor research facility.
[16:11] This was part of a larger maskless litho research program called IMAGINE. Such locations are
[16:18] essential in working out all the machine's kinks and getting it ready for the production fab.
[16:24] Mapper and TSMC's strategy to overcome the slow throughput was clustering. The
[16:30] tool's target speed was about 10 wafers per hour. That seems a big gap from the 100 or
[16:36] so wafers per hour needed to be competitive with either EUV or double-patterning, right?
[16:42] But by clustering several machines together,
[16:45] they can try to close that big gap. A ten-unit cluster of 10 wafer-per-hour machines can do
[16:52] 100 wafers. Six machines capable of 20 wafers per hour can do 120 wafers total.
[17:00] ## EUV's Consolidation But Mapper’s ability to iterate and speed up
[17:03] development was constantly impeded by a lack of resources and money.
[17:07] It is a refrain that I've heard a few times in the European deep-tech community. Doing
[17:13] hard things takes money and while seed funding is available for smaller projects,
[17:17] getting money to do something as bold as what Mapper wanted to do was challenging.
[17:22] By 2009, Mapper had an alpha 300-millimeter wafer tool with just 110 beams and a lower
[17:29] voltage. While it printed at the right resolutions inside the CEA-LETI cleanroom, the throughput was
[17:35] about 1 wafer per hour - far short of the 10 needed for the clustering strategy to work.
[17:41] This was after twenty years of working on the concept. Had the company managed
[17:46] to get something out faster - even if that something was half usable - then
[17:50] perhaps it could have generated more momentum.
[17:54] This led to some eyebrow-raising situations. In 2012, they closed
[17:58] an 80 million euro fund raising round led by the state-owned Russian investment fund
[18:04] RUSNANO. The fund is dedicated to building a nanotechnology cluster inside Russia.
[18:10] As part of this partnership, Mapper worked with Russian research institutes
[18:14] and would later open a MEMS Fab in Moscow to produce lens elements for Mapper tools.
[18:20] But around the time of that fund raise, ASML started showing real gains with their EUV
[18:25] light source thanks to the introduction of a pre-pulse shot to reshape the tin droplet
[18:30] before the main shot. As power levels rapidly rose, so did EUV's throughput.
[18:36] In 2013, Mapper shipped its first prototype
[18:39] pre-production tool - called the FLX-1200 - to CEA-Leti.
[18:45] The tool had 1,300 beamlets and can pattern at a
[18:49] 32-nanometer half-pitch - a performance befitting the 14-90 nanometer nodes.
[18:55] Its raw throughput then was still just 1 wafer per hour. Scaling up
[19:00] to the necessary 10 wafers per hour would require raising the number of
[19:03] beamlets from 1,300 to 13,000. They hadn't gotten there yet but it was possible.
[19:11] By then, ASML had gotten the light source to a range of 80 to 100 watts,
[19:16] translating to ~60 wafers processed per hour.
[19:20] However, I want to note that for Mapper the key metric isn't the
[19:23] raw wafer throughput number. It was wafers per hour per million euro spent. Or wafers
[19:29] per hour per square meter of cleanroom footprint. FLX-1200 was a far smaller tool.
[19:36] Moreover, servicing the FLX-1200 was also way easier. A serviceman
[19:41] only needs to access a single side of the tool to replace the source.
[19:46] That's not possible with EUV and a key technical point to enable the clustering.
[19:52] ## Bankruptcy & ASML
[19:52] Even as EUV rose, Mapper's people still believed that they could have brought an
[19:56] economically competitive mainstream litho machine to the market. But fate and money intervened.
[20:04] In September 2016, Arthur Del Prado died at the age of 85.
[20:09] He had been a steadfast investor, but after his death, his estate told Mapper
[20:14] that they would only continue the funding if the startup found a new lead investor.
[20:19] But what was the pitch? The original idea of doing an EUV alternative was hard to fund
[20:24] because EUV was so far along and Mapper needed so much more funding to bring their tool to market.
[20:31] Another target they pursued included tools for producing small runs of chips for prototyping,
[20:36] niche use cases or academia. So like the Maskless Litho machine that I mentioned
[20:42] earlier - but that would require over $100 million to commercialize.
[20:47] They also explored making personalized chips for security purposes. Not having a
[20:52] mask lets designers write special hardware IP signatures into each individual chip,
[20:58] making them more secure against cloning and reverse-engineering.
[21:02] In the end, they ran out of time and in December 2018, the company filed for bankruptcy.
[21:08] Several firms emerged to acquire Mapper's IP, but ASML moved to keep it in the Netherlands. Their
[21:14] CEO told the reputable Dutch news and radio station BNR that they wanted to do a deal.
[21:21] So a few months later, it was announced that ASML would acquire Mapper’s IP and assets for
[21:27] 75 million euro. Jobs would also be offered to the 240-270 people then working at Mapper,
[21:34] but the work itself would not be continued.
[21:38] ## Inspection
[21:38] ASML saw a different use for Mapper’s multibeam technology.
[21:42] A few years prior in 2016, they paid $3.1 billion to acquire a Taiwanese
[21:47] company called Hermes Microvision or HMI. HMI did electron beam inspection.
[21:55] Inspection is for finding defects. Most of these devices worked by firing light
[22:00] or lasers at the wafer's patterns and comparing the measured result to a "golden image" stored
[22:06] inside memory or an image from another part of the wafer. Deviations hint at defects.
[22:12] But with EUV, defects will get smaller and harder to find - beyond what inspection
[22:16] tools using optical light can pinpoint. Electron beams' far shorter wavelengths
[22:22] can find defects as small as 1-10 nanometers wide.
[22:25] Another major trend has been the rise of 2.5D and 3D structures. Such structures
[22:31] mean that not everything is going to be on the surface. For instance, optical inspection
[22:36] cannot detect defects in the contacts of these stacked layers we make for 3D NAND.
[22:42] But e-beam inspection can do something called Voltage Contrast inspection. Here, we fire primary
[22:48] electrons at the wafer's surface and measure the "secondary" electrons that bounce back. The amount
[22:55] of secondary electrons predictably tells you about the quality of the electrical contacts down below.
[23:01] The problem again has been throughput. The semiconductor line moves extremely fast,
[23:06] and there is no time to wait for an e-beam tool to inspect every wafer lot. But combining
[23:12] the HMI electron beam inspection tool with the multibeam Mapper technology
[23:16] can possibly produce an inspection tool fast enough to run on the line.
[23:21] In 2022, ASML debuted its first multibeam inspection tool:
[23:26] the eScan 1000 with 9 beams in a 3x3 grid, and then the 1100 with 25 beams in a 5x5 grid.
[23:36] They worked well enough when used by customers. After these two incremental moves,
[23:42] the eScan 2200 looks to greatly increase the beam array and thus throughput.
[23:47] And more machines are expected to come.
[23:50] ## Conclusion Before we end, I want to thank the various Mapper
[23:53] ex-employees who graciously spoke with me about their time with the company.
[23:58] This new eScan tool is part of ASML's long-running corporate strategy of holistic lithography.
[24:04] The core idea is that lithography is more than just the scanner on the fab floor. To
[24:09] get leading edge performance, we also need to integrate other tools. Like for instance,
[24:14] tools for computational lithography and optical corrections prior to exposure ...
[24:19] And tools for metrology/inspection to find and correct defects after
[24:25] the exposure. These items all work together in feeding data
[24:28] and results back into the software for analysis and continual improvement.
[24:35] Mapper Lithography's technology failed to compete with ASML's,
[24:38] but its revitalization as part of this larger strategy is a nice reminder that
[24:43] in the semiconductor industry, a failure in one era can be a success in another.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
