<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_42027677eaecd2f1"
title: "Broadcom Beast XPU：3.5D异构封装的扩展路线、性能收益与工程约束"
domains: ["算力芯片","互联与网络"]
subdomains: ["AI加速器与GPU","存储芯片与HBM","先进封装与制造","芯片设计与IP","网络架构与组网"]
types: ["行业认知","视频"]
companies: "Broadcom；TSMC；Fujitsu；Synopsys；Cadence；Siemens"
published_at: "2026-10-03T14:59:01.305Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=lABUTzWYVlY"
source: "YouTube·TechTechPotato"
---

# Broadcom Beast XPU：3.5D异构封装的扩展路线、性能收益与工程约束

## 行业认知文章

- 行业：算力芯片、互联与网络
- 公司：Broadcom；TSMC；Fujitsu；Synopsys；Cadence；Siemens
- 来源：YouTube·TechTechPotato · [原文链接](https://www.youtube.com/watch?v=lABUTzWYVlY)
- 发布时间：2026-10-03
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
材料来自YouTube频道TechTechPotato，原始链接为https://www.youtube.com/watch?v=lABUTzWYVlY，标注时长581秒，提供的字幕覆盖0:00至9:41。视频解读Broadcom在OCP Taiwan的一份演示，演讲者为Broadcom定制芯片产品副总裁Harish Batlaw；作者说明，这份演示发生在其上一期视频录制之前，本次属于补充解读。全文围绕2028年Beast XPU及通往该产品的2026—2027年技术路线，讨论如何通过3.5D异构封装，把更多计算裸片、高带宽内存和输入输出功能集成到同一封装，以降低互联功耗与延迟，同时应对键合密度、散热、供电、良率、时序和仿真验证等约束。材料给出16组HBM、8颗计算裸片的Beast目标配置，以及现有和后续产品的工艺、带宽与面积变化。后半段着重说明：小芯粒的良率优势需要合格裸片筛选与可测试设计支持，三维堆叠需要可靠的热仿真，电子设计自动化工具必须更早建立仿真与实物的一致性。以下内容仅依据提供的完整文字稿整理；字幕虽已核验首尾、行数及原始文件，但未人工校对识别准确性，部分面积单位和互联协议表述存在歧义。

### 论点1：作者将Beast描述为Broadcom面向2028年的大型XPU产品，并把它与大型模型客户需求及收入增长预期联系起来，但这些商业目标尚未在本材料中得到充分验证。
**相应论据：**[0:00—0:24] 作者称Broadcom将在2028年推出这一大型XPU，面向市场上五家最大前沿模型厂商中的四家，并转述“1,500万颗”的产品数量目标；他还称Broadcom近期财务信息提出，下一年收入翻倍、再下一年再次翻倍。[9:06—9:23] 作者把本次演示同时理解为通往2028年Beast的2026年、2027年技术讨论，并表示Broadcom是这一领域的重要参与者。原文未给出客户名称、1,500万颗对应的统计期间、收入所属业务范围或收入基数。
**相应论证：**作者认为，较大的产品数量目标与连续翻倍的收入预期在方向上相互呼应，因此评价其“说得通”。原文没有建立产品数量、单价、交付节奏与收入之间的量化关系，也没有展开论证Broadcom相对竞争者的市场地位；这些表述应保留为作者转述及判断，不能视为已兑现订单或经过核验的财务预测。

### 论点2：Beast的封装目标是在同一大型基板上集成16组HBM和8颗计算裸片，先进封装是实现这一规模的核心路径。
**相应论据：**[1:01—1:23] 作者说明，Broadcom的“3.5D异构扩展”封装用于把16组高带宽内存HBM和8颗计算裸片放到一个大型基板上，该产品称为Beast；演示由Broadcom定制芯片产品副总裁Harish Batlaw介绍。[0:54—1:04] 作者同时说明，演示早于其上一期视频录制，本次是发现该演示后的补充解读。
**相应论证：**材料把Beast的目标配置与3.5D异构封装直接对应，说明增加计算与内存集成规模需要封装层面的扩展能力。原文没有给出Beast的最终基板尺寸、封装总功耗、内存容量或实测性能，因此该配置只能作为演示中的目标描述。

### 论点3：在扩大处理器互联域或数据中心规模之前，优先增加单个封装内的计算与内存集成量，可以通过缩短连接距离改善功耗、延迟和性能。
**相应论据：**[1:25—2:02] 作者区分三种扩展：纵向扩展是在一个互联域内容纳更多处理器，横向扩展是在数据中心内增加处理器，封装内扩展则是在进行前两者之前，先增加一颗芯片、一个封装内的计算和内存。[2:04—2:24] 作者主张在单一封装内尽可能放入更多芯粒，以提高离开封装之前可获得的性能，并列出更低功耗、更低延迟及可能更好的成本，附带“如果能够处理好这些问题”的条件。
**相应论证：**原文的因果链是：计算和内存更接近，连接距离更短，扩展时的延迟更低，从而获得性能和功耗收益。成本改善带有工程可实现性的前提，原文没有量化节省幅度，也没有比较封装复杂度上升后的完整成本。

### 论点4：Broadcom的XPU扩展路线同时依赖工艺演进、带宽提升和更大的集成面积，不能只用制程节点解释产品升级。
**相应论据：**[2:28—2:44] 演示中的当前代产品采用8组HBM、2颗计算裸片，列出5纳米和3纳米工艺、超过5,000 TOPS的算力，以及约2,000平方毫米硅面积；原文没有交代TOPS的运算精度或稀疏性口径。[2:46—3:14] 后续代际列出3纳米、2纳米及A14，网络带宽提高约2.5倍，内存带宽至少提高2倍，中介层尺寸和硅面积至少扩大2倍，可能达到3.5倍；图中HBM数量从8组，经另一个8组配置，再到12组。
**相应论证：**原文并列展示工艺、带宽、面积和HBM数量变化，体现后续产品通过多项指标共同扩展。这里的8组至12组HBM属于演示中的代际配置，不能直接等同于前文Beast的16组HBM目标；原文也未逐一明确每种工艺与每个配置的对应关系。

### 论点5：3.5D架构通过三维堆叠与芯粒组合，把计算、静态随机存取存储器和输入输出功能分配到不同裸片及工艺节点，以实现异构集成。
**相应论据：**[3:17—3:43] 作者描述多个三维堆叠结构、计算与静态随机存取存储器SRAM的叠放，以及采用最先进工艺的计算引擎；举例Fujitsu Monaka使用2纳米计算裸片与5纳米SRAM，并称SRAM基底裸片还可包含额外网络功能。[3:43—4:07] 芯粒组合可以包含输入输出芯粒、以太网逻辑以及与基底裸片的连接，并采用不同基板和不同工艺技术；作者提到Broadcom的纵向扩展以太网SUE。字幕另有“UA link over US SUE”表述，具体协议关系不清晰。
**相应论证：**原文通过不同功能裸片采用不同工艺、再以封装连接的方式，说明异构集成的模块化思路。Fujitsu Monaka是作者用于解释该思路的例子，不能据此认定Broadcom采用相同配置。原文未展开各功能采用不同节点的成本与性能比较，也未清楚论证字幕中另一互联协议与SUE的关系。

### 论点6：第一代正面对背面堆叠可以拉开发热部件的距离，但其裸片间连接密度受到限制，并需要处理寄生负载。
**相应论据：**[4:28—5:24] 作者称该演示的第一代采用正面对背面连接，即一颗逻辑裸片的正面朝向另一颗的背面，而非晶体管面相对；这样使发热部件相距较远，但仍要处理计算、数据和供电之间的干扰。他指出裸片间互联密度较低，并给出原始硅通孔TSV密度约3,000，分配信号、数据与供电后约减半至1,500，同时存在寄生负载。字幕把前者单位写为“square mil”，后者明确写为“square millimeter”，面积单位口径存在歧义。
**相应论证：**原文将热源间距较大作为这一堆叠方向的优点，同时指出跨裸片连接仍需经过相应结构，并分配给不同用途，因此可用于连接的密度受限。原文没有量化温度改善或寄生负载影响；由于密度单位转写不一致，不能据此进行可靠的面积换算或精确比较。

### 论点7：正面对正面连接与混合键合可以提高裸片间连接密度，但也对晶圆平整度、厚度和键合工艺提出要求。
**相应论据：**[5:26—6:10] 作者说明，将连接结构直接相对，可以获得更高连接密度，演示列出最高约27,000，字幕面积单位写为“square mil”，需保留单位不确定性。他随后提到晶圆需要更薄、更平，以便更容易键合，并列出6微米及9微米间距的混合键合，以及TSMC的CoWoS S、CoWoS L中介层方案。
**相应论证：**原文的解释是，把连接结构放在彼此更近的位置，可以减少其他结构对连接布局的限制，提高连接密度；更薄、更平的晶圆有助于键合。原文没有给出键合良率、不同间距的成本差异或对热性能的实测影响，不能从上述密度数字推导整体产品性能提升倍数。

### 论点8：3.5D设计面临显著提高的单位面积热负荷，散热能力是扩大堆叠规模的重要约束。
**相应论据：**[6:12—6:33] 作者先指出多裸片系统级芯片需要完成逻辑、时钟和设计签核，随后称讨论中的功率密度从约0.5瓦/平方毫米提高至4瓦/平方毫米，相当于热密度增加8倍。[7:54—8:10] 作者进一步指出，无论计算叠在SRAM上、SRAM叠在计算上、计算叠计算还是内存叠内存，都需要解决大量部件集中在狭小空间内的热管理问题。
**相应论证：**原文用单位面积功率提高8倍及堆叠空间受限，解释热管理难度上升。该数字描述的是演示讨论的功率密度变化，原文没有明确其对应的具体裸片、工况或Beast整包功耗，不能直接换算为产品总功率。

### 论点9：供电密度的提高与散热问题并行，三维集成需要处理更高的单位面积电流。
**相应论据：**[6:36—6:43] 作者称供电从每单位面积约1安培提高到5安培，并强调大量电力需要流经这些结构。字幕两次把面积单位写为“square mil”，其究竟指平方密耳还是平方毫米未得到明确校对，不能无条件统一为平方毫米。
**相应论证：**在前后采用同一面积单位的前提下，原文数值表示电流密度提高约5倍，支持供电成为设计挑战的判断。原文没有展开供电路径、电压降、可靠性或具体实现方式，也未证明热密度与电流密度来自同一产品和相同工况。

### 论点10：小芯粒的制造良率优势只有在封装前能够确认裸片合格的条件下，才可能转化为系统级收益。
**相应论据：**[6:43—7:11] 作者指出，采用更小芯粒的出发点是提高良率，但必须把已确认合格的裸片封装在一起才能获得这一好处；难点在于，部分芯粒依赖另一颗芯粒提供基础功能，因而单独测试并不容易。他强调设计时需要同时为良率考虑。
**相应论证：**原文的论证是：单颗小芯粒良率更高，并不自动保证组合封装成功；只有先识别合格裸片，才能避免把有问题的芯粒纳入组合，而功能依赖会增加筛选与测试难度。原文没有提供实际良率、测试覆盖率或封装成本，因此不能量化这一收益。

### 论点11：作者认为开放的三维堆叠芯粒生态比一般开放芯粒生态更难实现，主要原因是跨芯粒依赖和良率协同设计。
**相应论据：**[6:56—7:24] 作者先讨论依赖其他芯粒基础功能的裸片如何测试，以及多芯粒设计必须兼顾良率，随后明确以个人判断表示，面向三维堆叠的开放芯粒生态，比一般开放芯粒生态“更不可能”实现。
**相应论证：**作者从测试依赖和共同面向良率设计的复杂性，推到开放生态的实现难度更高。这是一项基于工程困难的个人推断；原文没有比较具体开放标准、厂商合作案例或生态实施结果，不能视为开放三维芯粒生态必然不可行的结论。

### 论点12：高带宽裸片互联需要把电压、频率和温度差异纳入时序与架构设计，并明确同步或异步运行方式。
**相应论据：**[7:26—7:51] 作者解读高带宽互联时序页，指出两颗芯粒之间存在电压、频率和热状态变化，需要从同一来源供给，并确保二者能够同步运行或以异步方式工作。[6:12—6:20] 他此前还把逻辑设计、时钟处理和设计签核列为多裸片系统级芯片的常规工作。
**相应论证：**原文说明，芯粒间的运行条件存在差异，互联设计必须处理这些变化，并在架构上选择和验证相应时序方式。原文没有展开“同一来源”的具体实现，也没有量化同步与异步方案的延迟、面积或功耗取舍。

### 论点13：可靠的热仿真及其与实物的一致性，是三维堆叠设计和缩短上市周期的重要条件。
**相应论据：**[7:54—8:37] 作者称三维堆叠的热管理需要通过仿真解决；仿真足够准确时，才能据此设计应对热负荷的结构。他强调仿真与实际芯片的一致性是关键，并点名Synopsys、Cadence和Siemens等电子设计自动化厂商，需要在新工艺、新产品开发周期更早阶段把这一工作做好，以更快推向市场。
**相应论证：**原文给出的因果链是：准确模拟堆叠结构的热行为，才能提前形成有效设计；更早建立仿真与实物的一致性，有助于更快上市。原文没有提供仿真误差、缩短开发时间的幅度或工具厂商收入影响，因此这里只能确认其工程作用及作者提出的要求。

### 论点14：Broadcom演示把低功耗、低延迟互联和中介层优化作为封装收益，同时承认基板供给是行业约束。
**相应论据：**[8:40—9:00] 作者概括Broadcom最后一页：互联具有很低功耗和很低延迟，较小中介层有助于成本实现，同时需要确保足够的基板占用面积；他称行业当时受到基板限制。[2:56—3:04] 前文又指出后续代际的中介层尺寸和硅面积将扩大至少2倍、可能达到3.5倍。
**相应论证：**原文把互联效率、中介层成本和基板可用性列为共同需要处理的因素。但“较小中介层”没有明确比较基准，不能理解为后续产品的中介层绝对面积必然小于当前代；它与前述代际面积增长并不构成可直接量化的比较。原文未展开基板限制的产能、供应商、价格或持续时间，也没有提供成本节省数据。

### 论点15：Beast的实现涉及计算、内存、封装和验证的共同扩展；2026—2027年的技术演进是理解2028年目标的重要组成部分。
**相应论据：**[1:06—1:17] 演示把3.5D异构扩展与16组HBM、8颗计算裸片相连。[6:12—8:37] 后半段连续讨论逻辑与时钟签核、热密度、供电、良率、芯粒测试、互联时序以及热仿真。[9:06—9:16] 作者明确表示，本次内容既涉及未来Beast，也涉及Broadcom在2026年和2027年、到达2028年目标之前要做的事情。
**相应论证：**全文通过一系列彼此关联的工程问题，说明扩大封装内计算和内存规模需要多个环节同时推进。原文没有给出2026年、2027年的逐年产品清单、每项技术的完成时间或验证结果，因此不能把这段描述扩展为已确定的量产里程碑。

## 值得关注的信号

材料支持把Broadcom的AI定制加速器业务与先进封装能力结合观察：作者转述的2028年产品目标涉及大型模型客户、较大产品数量和收入增长预期，而技术演示显示，其实现路径包含计算、内存、输入输出、多工艺裸片和封装的协同设计。判断这些目标的可实现性，需要关注高密度键合、单位面积散热与供电能力、合格裸片测试、堆叠良率、时序验证，以及基板和中介层约束。材料还指出Synopsys、Cadence和Siemens等电子设计自动化厂商需要更早提高热仿真与实物的一致性，但没有量化其商业受益。作者关于1,500万颗产品、收入连续翻倍、Broadcom行业地位及开放芯粒生态难度的表述，分别属于转述目标或个人判断；原文没有提供数量对应的时间范围、收入基数、客户名单、订单兑现情况、成本模型、产能安排或竞争份额，因此不足以直接形成收入预测、利润预测或估值结论。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"483b4bff92f73dc462d18db47514983b43f04d84021c92e6b658de6c2253487c","translationSha256":"a46d10bdbedfac5d1b3e2001f6f615b9c1f90288466019a1b43bb7fee430c209","sourceCharacters":11351,"timestampValues":271,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":271,"captionTimestampsManagedByProgram":true,"captionRepairedRows":2} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# 关于博通 Beast XPU 的更多详情

- 来源：YouTube·TechTechPotato

- 原始链接：https://www.youtube.com/watch?v=lABUTzWYVlY

- 时长：581 秒


## 完整文字稿

[0:00] 所以，我最近的一期视频里聊到了
[0:01] 博通的巨兽，这款庞大的 XPU
[0:04] 他们将为2028推出
[0:06] 面向市场上五家最大前沿实验室模型厂商中的四家，嗯，
[0:11] 他们表示
[0:13] 他们将推出15百万颗
[0:15] 这样的芯片。根据他们最近的
[0:17] 财务数据，他们预计
[0:19] 明年收入翻一番，然后
[0:22] 后年收入再翻一番，
[0:24] 这倒也说得通。
[0:26] 不过，我没想到的是，他们还会公布更多
[0:28] 这款巨兽封装的细节。最近
[0:31] 在台湾 OCP 大会上，我们又看到了博通的
[0:34] 一场演讲。内容只是
[0:36] 一点小更新，但我想
[0:37] 带大家了解一下。
[0:41] >> 你的最低规格要求是什么？
[0:47] >> 如果你想支持这个频道，
[0:48] 别忘了点赞和订阅。还有
[0:50] 你也可以买这种
[0:52] T 恤，上面写着“裸片尺寸的良率”。这确实
[0:54] 很重要。说实话，
[0:56] 这场演讲是在
[0:58] 我们拍摄上一期视频之前举行的。我当时只是
[0:59] 不知道它的存在。
[1:01] 还有，特别感谢 Twitter 上的 Tadashi，
[1:03] 他把这场
[1:04] 演讲转给了我。接下来我们就
[1:06] 来聊聊他们的 3.5D
[1:08] 异构扩展。这就是
[1:10] 他们采用的封装方案，目的是
[1:12] 把16个 HBM 和八个算力裸片放到一块
[1:17] 巨大的基板上。别忘了，这款产品
[1:19] 叫作“巨兽”。演讲由
[1:21] Harish Batlaw 主讲。
[1:22] 那边的 ASIC 产品副总裁
[1:23] 博通。
[1:25] 然后，呃，我们由此了解到
[1:28] 数据中心里的内存和算力是什么情况。
[1:31] 你们经常会听我谈到纵向扩展
[1:33] 我们讨论的是在一个域内
[1:34] 尽可能容纳多少处理器。我们还会谈到
[1:36] 横向扩展，也就是我们能把多少，呃，
[1:39] 处理器装进一个数据中心。
[1:40] 中心。
[1:41] 他们的意思是，这更多
[1:43] 关乎芯片内扩展。你能把多少算力和
[1:45] 内存放进一颗芯片，也就是
[1:49] 一个封装里，然后再进行纵向扩展。而
[1:52] 其中的思路是，随着这些，呃，
[1:55] 区域不断增大，只要让部件彼此更近，
[1:57] 延迟更低，
[2:00] 就能获得更好的性能。与纵向扩展相比
[2:02] 也优于横向扩展。
[2:04] 而且，呃，超大型 SoC 的优势在于
[2:06] 我这里就有好几颗，真的就
[2:09] 在我旁边的桌上。你知道，
[2:12] 你会希望一个封装上能有尽可能多的芯粒，
[2:14] 这样在
[2:17] 离开封装之前，尽可能提升
[2:18] 性能。
[2:20] 这样功耗更低、延迟更低，
[2:22] 如果能处理好，成本也更低。
[2:25] 结果发现，你们确实需要那种粘合剂。
[2:28] >> [嗤鼻声]
[2:28] >> 我们在这里看到的是 XPU
[2:30] 产品概况，来自 Broadcom 的介绍，
[2:32] 讲的是当前这一代产品，我们
[2:34] 这里展示的是 8 HBM 版本，采用
[2:36] 两个计算芯片裸片。
[2:38] 5 纳米，3 纳米，5,000 以上
[2:41] 顶部。
[2:42] 我们说的硅面积是
[2:44] 2,000 平方毫米。
[2:46] 接下来我们进入下一代产品，那里
[2:48] 我们有 3 纳米、2 纳米，以及
[2:50] 甚至 A14。
[2:52] 你可以在这一方面选择你的工艺节点
[2:54] 。但网络带宽提升了
[2:56] 两点五倍，内存
[2:57] 带宽至少提升 2 倍。
[3:00] 但中介层的尺寸和硅
[3:01] 面积至少扩大了 2 倍，如果
[3:04] 不是 3 倍半的话。这里的思路是
[3:07] 你从 8 个 HBM，
[3:09] 中间那个也写着 8 个 HBM，增加到 12
[3:12] 个 HBM，而且我们知道之后还会
[3:14] 进一步增加。
[3:16] 嗯
[3:17] 他们这里的说法是，
[3:18] 典型的 3 个半 D
[3:20] 会让人想知道 4D 是什么。XPU
[3:22] 架构方面，你知道，它有
[3:24] 多个 3D 堆栈。计算芯片上有 SRAM，
[3:28] 有算力引擎，位于
[3:30] 最先进的工艺节点上。我们已经
[3:32] 知道这一点了。我们已经看到，
[3:33] 例如，Fujitsu Monaka。那是 2
[3:36] 在5纳米 SRAM 上采用纳米级算力。
[3:39] 而基底裸片就是那个 SRAM，同时还
[3:41] 在上面增加了一些网络功能。而且
[3:43] 通过使用芯粒，你可以配置 IO
[3:45] 芯粒。这意味着，你知道，你的
[3:46] 以太网逻辑。嗯，也可以连接
[3:49] 到你的基底裸片。呃，博通
[3:51] 有这种扩展型以太网 SUE，但
[3:55] 他们也可以做，嗯，
[3:57] 例如通过
[4:00] US SUE 实现 UA 链路。所以，就是这类东西。
[4:03] 嗯，不过你可以采用多个基板，
[4:05] 可以使用多种不同的，呃，
[4:07] 工艺节点技术。
[4:09] 我们本质上是在处理一个
[4:11] 这里是一种更先进的乐高。呃，除了
[4:13] 这一点，你知道，一家晶圆厂可能用的是乐高，
[4:16] 另一家晶圆厂可能用的是得宝，还有一家晶圆厂
[4:18] 可能用的是
[4:20] 《Roblox》（罗布乐思）。
[4:21] 或者别的什么。无论你所在地区的第三方
[4:24] 那些小型品牌积木叫什么，
[4:26] 都可以。
[4:28] 通常，当我们有 3 和 1/2 D 时，
[4:32] 呃，在这个例子里，他们说
[4:34] 这是 Gen 1。我们处理的是
[4:36] 所谓的面对背结构。也就是说，把
[4:38] 一颗逻辑裸片的正面，呃，贴到另一颗裸片的背面。
[4:42] 而不是面对面，
[4:43] 也就是让
[4:45] 晶体管彼此相对，而是把它
[4:48] 放在背面。这意味着你的
[4:50] 发热元件至少
[4:51] 彼此相距较远，但你仍然
[4:53] 必须处理算力
[4:56] 以及数据和电力之类的问题。
[4:59] 确保它们不会互相干扰。呃，
[5:02] 不过现实情况是，你仍然
[5:04] 需要在逻辑电路之间建立连接。
[5:06] 所以，互连
[5:07] 密度较低。
[5:09] 在这里的第 2 张图中，你可以看到原始 TSV
[5:11] 密度是 3,000 每平方密耳。
[5:14] 呃，而且因为你必须，你知道，
[5:16] 在信号、数据和电力之间将其减半，
[5:18] 你的数值是 1 和 1/2 千
[5:21] 每平方毫米。
[5:22] 呃，而且你还必须处理
[5:24] 寄生负载。
[5:26] 至于面对面结构，
[5:28] 我之前说过，如果你把
[5:29] 晶体管对晶体管放置，假如你……
[5:31] 实际上是背靠背放置？还是在这个
[5:33] 案例中，他们采用的是面对面放置。要是
[5:35] 你真的把连接端
[5:36] 和连接端放在一起呢？
[5:38] 他们这里说，这是因为
[5:40] 你不必再处理所有
[5:41] 算力单元都挤在那儿、挡在
[5:44] 路上的问题，因此密度可以更高，达到每平方密耳
[5:46] 27,000 每平方密耳。
[5:48] 呃，而且
[5:50] 这样做也能让你
[5:51] 做一些事情，比如确保晶圆
[5:53] 更……嗯
[5:56] 更薄、更平整，这样当
[5:57] 它们键合在一起时，就能键合在一起
[5:59] 更容易。
[6:00] 他们在这里谈到，嗯，
[6:02] 以 6 微米间距进行混合键合，以及以
[6:04] 9 微米间距进行混合键合，呃，为了实现这一点
[6:06] ，要通过 CoWoS S 或 CoWoS L，也就是台积电
[6:10] 风格的中介层。
[6:12] 这种设计面临的挑战
[6:14] 在于，你必须完成逻辑设计，还要
[6:16] 完成时钟设计、时钟树和签核。
[6:18] 对于这些多芯片设计来说，这是常规工作
[6:20] 片上系统。
[6:21] 但功耗呢？说到功耗，目前我们
[6:24] 谈的仍然是 0.5
[6:27] 瓦特每平方毫米。他们谈的
[6:29] 是 4 瓦特每平方毫米。
[6:32] 呃，所以你知道，这相当于热密度
[6:33] 增加了八倍。然后在
[6:36] 供电方面，我们将
[6:37] 从每平方密耳 1 安培提升到
[6:39] 每平方密耳 5 安培。
[6:40] 嗯
[6:41] 所以，你知道，会有大量功率
[6:43] 流经这些芯片。然后是良率，现在芯粒的良率
[6:46] 总是件挺有意思的事，嗯
[6:48] 因为采用更小的
[6:49] 芯粒设计可以提高良率。但你必须
[6:51] 将已知良品裸片封装在一起，才能
[6:54] 获得这一好处。因此，采用基于芯粒的
[6:56] 设计，其中一部分复杂性在于：
[6:57] 如何测试那些
[7:00] 依赖另一个芯粒提供
[7:02] 基础设施的芯粒？
[7:04] 而且，[哼了一声]这类设计中的一项
[7:05] 技能是，你还要在设计时
[7:06] 考虑良率。这也是
[7:09] 涉及多个芯粒
[7:11] 的难点之一，这也是为什么我认为，
[7:13] 你知道，开放的芯粒生态系统对于
[7:16] 3D 堆叠来说，比起
[7:21] 一般意义上的开放芯粒生态系统，
[7:22] 实现起来更加困难。但你必须能够做到
[7:24] 那个。
[7:25] 呃
[7:26] 这里我们看到的是高带宽
[7:28] 互连时序图。这是在
[7:31] 讨论这样一个事实：你会遇到
[7:33] 电压、频率和热方面的
[7:37] 差异。
[7:40] 小芯片。
[7:41] 而且你需要由同一个
[7:43] 电源供电，但你必须确保
[7:45] 它们要么同步，
[7:47] 要么能够异步运行。所以，
[7:49] 这又涉及架构
[7:51] 设计以及其中的难点。
[7:54] 你还必须能够对这些进行
[7:55] 热建模。
[7:56] 呃，我们之前已经反复说过，
[7:58] 当你堆叠3D 时，无论是
[8:00] 在 SRAM 上堆叠算力，还是在
[8:02] 算力上堆叠 SRAM、在算力上堆叠算力、在内存上堆叠
[8:04] 内存，
[8:05] 其中一项难点是
[8:07] 如何管理热量，尤其是当
[8:08] 一切都被压缩在这么小的
[8:10] 狭小区域里。而实现这一点的方式
[8:13] 就是进行仿真。如果你的
[8:14] 仿真做得好，就能设计出能够应对这些
[8:16] 热问题的方案。所以，
[8:18] 仿真与硅片实测结果之间的相关性
[8:20] 至关重要，这是
[8:22] EDA 领域的一项重要工作，也就是那些制造
[8:24] 用于完成这些工作的软件的公司，
[8:26] 例如 Synopsys、Cadence 和 Siemens，
[8:29] 必须把这件事做好，并确保
[8:31] 在更早的时候就做对，
[8:32] 在新工艺节点和产品的
[8:34] 开发周期中尽早做到，这样
[8:37] 我们就能更快推向市场。
[8:40] 基本上，这其实就是
[8:41] Broadcom 做了一次小幅更新后展示的最后一页。
[8:43] 未来已来。
[8:45] 这种互连的功耗极低，
[8:47] 延迟也极低，
[8:49] 有助于提升性能；他们通过更小的中介层来降低
[8:52] 成本，并且
[8:54] 确保基板的占用面积
[8:56] 足够，考虑到
[8:58] 你知道，作为一个行业，我们现在
[9:00] 受限于基板供应。
[9:02] 所以，你知道，
[9:04] 这
[9:06] 你知道，所以这部分讨论的是
[9:07] Beast 接下来会推出什么，
[9:09] 也讨论了他们今年和明年会做什么，
[9:11] 所以，‘26 和 ‘27，在
[9:14] 他们于 ‘28 推出 Beast 之前。
[9:17] 我已经开始看到 Twitter 上有人
[9:18] 终于意识到
[9:20] 实际上
[9:21] Broadcom 是这个领域的重要参与者。
[9:23] 我希望他们多说一些。
[9:25] 等他们说了，你就会在这里看到。
[9:27] TechTechPotato（科技科技土豆）。
[9:41] >> 嗯哼。

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=lABUTzWYVlY
- 来源：YouTube·TechTechPotato
- 发布时间：2026-10-03
- 行业：算力芯片、互联与网络
- 公司：Broadcom；TSMC；Fujitsu；Synopsys；Cadence；Siemens
- 归档时间：2026-10-10T09:10:21.573Z

---

# More Details on Broadcom's Beast XPU

- 来源：YouTube·TechTechPotato

- 原始链接：https://www.youtube.com/watch?v=lABUTzWYVlY

- 时长：581 秒


## 完整文字稿
[0:00] So, one of my recent videos we spoke
[0:01] about Broadcom's beast, this giant XPU
[0:04] that they're coming out with in 2028 for
[0:06] four of the five biggest um frontier lab
[0:11] model players in the market. They said
[0:13] they're coming to market with 15 million
[0:15] of those. And based on their recent
[0:17] financials where they're claiming a
[0:19] doubling of revenue next year and then a
[0:22] doubling of revenue again the year
[0:24] after, kind of makes sense.
[0:26] What I wasn't expecting however was more
[0:28] detail on that beast package. And
[0:31] recently at OCP Taiwan, we got another
[0:34] presentation from Broadcom. It's just
[0:36] going to be a small update, but I want
[0:37] to take you through it.
[0:41] >> What's your minimum specification?
[0:47] >> And if you want to support the channel,
[0:48] don't forget to like and subscribe. And
[0:50] also you can pick up t-shirts like this
[0:52] one, yield of what die size. It really
[0:54] does matter. So, I have to be honest
[0:56] here, this presentation was given before
[0:58] we filmed the last video. I just didn't
[0:59] know it existed.
[1:01] And uh many thanks to Tadashi over on
[1:03] Twitter who forwarded me to this
[1:04] presentation. And we're going to just
[1:06] talk about their three and a half D
[1:08] heterogeneous scaling. So, this is the
[1:10] packaging that they're doing in order to
[1:12] fit 16 HBMs and eight compute die onto a
[1:17] massive substrate. Don't forget this is
[1:19] called the beast. And it's presented by
[1:21] Harish Batlaw
[1:22] the VP of ASIC products over at
[1:23] Broadcom.
[1:25] And uh we get this idea of you know what
[1:28] memory and compute are in a data center.
[1:31] You'll often hear me talk about scale up
[1:33] where we talk about as many processors
[1:34] as we can in one domain. We talk about
[1:36] scale out which is just how many uh
[1:39] processors we can fit into a data
[1:40] center.
[1:41] What they're saying is that this is more
[1:43] about scale in. How much compute and
[1:45] memory can you put into a chip just into
[1:49] one package before you scale up. And the
[1:52] idea being that as you grow uh these
[1:55] areas, you get better performance by
[1:57] having just stuff closer at lower
[2:00] latency of scaling versus scale up
[2:02] versus scale out.
[2:04] And the benefits of, you know, a massive
[2:06] SOC, um I've got several here literally
[2:09] on the table next to me. You know, you
[2:12] want as many chiplets as you can get on
[2:14] a singular package just to help with as
[2:17] much performance as you can before you
[2:18] go off package.
[2:20] Here we have lower power, lower latency,
[2:22] and better cost if you can deal with it.
[2:25] It turns out you really need that glue.
[2:28] >> [snorts]
[2:28] >> And what we're seeing here is the XPU
[2:30] product profile from Broadcom talking
[2:32] about the current generation, which we
[2:34] have here as the 8 HBM variant across
[2:36] two compute die.
[2:38] 5 nanometer, 3 nanometer, 5,000 plus
[2:41] tops.
[2:42] We're talking about a silicon area of
[2:44] 2,000 square millimeters.
[2:46] Then we move into next generations where
[2:48] we have 3 nanometer, 2 nanometer, and
[2:50] even A14.
[2:52] You choose your process node on that
[2:54] front. But the network bandwidth goes up
[2:56] by two and a half times, memory
[2:57] bandwidth goes up by at least 2x.
[3:00] But the interposer size and the silicon
[3:01] area size is going up by at least 2x if
[3:04] not 3 and a half x. And the idea here is
[3:07] that you're going from 8 HBMs, the
[3:09] middle one also says 8 HBMs going up 12
[3:12] HBMs, and we know it's going to be a lot
[3:14] further on down the line.
[3:16] Um
[3:17] And what they're saying here is that the
[3:18] typical 3 and a half D
[3:20] makes you wonder what 4D is. XPU
[3:22] architecture, you know, you've got
[3:24] multiple 3D stacks. You've got SRAM on
[3:28] compute. You've got compute engine in
[3:30] the most advanced process node. We know
[3:32] this already. We're already seeing, for
[3:33] example, Fujitsu Monaka. That's 2
[3:36] nanometer compute on 5 nanometer SRAM.
[3:39] And the base die is that SRAM, but also
[3:41] some additional networking on top. And
[3:43] by using chiplets, you can have IO
[3:45] chiplets. This means, you know, your
[3:46] Ethernet logic. Um also connecting
[3:49] through to your base die. Uh Broadcom
[3:51] has this uh scale up Ethernet SUE, but
[3:55] they can also do um
[3:57] for example UA link over
[4:00] US SUE. So, it's that sort of stuff.
[4:03] Um but you can have multiple substrates,
[4:05] you can have multiple different uh
[4:07] process node technologies.
[4:09] We're essentially dealing with an
[4:11] advanced form of LEGO here. Uh except
[4:13] that, you know, one fab may be LEGO and
[4:16] another fab may be Duplo and another fab
[4:18] may be
[4:20] Roblox.
[4:21] Or whatever. Whatever the third-party
[4:24] little branded blocks were in your part
[4:26] of the world.
[4:28] Now, typically when we have 3 and 1/2 D,
[4:32] um in this case, this is they're saying
[4:34] this is Gen 1. We're doing dealing with
[4:36] what's called face-to-back. So, you put
[4:38] the face of one uh logic die to the back
[4:42] of the other. Rather than face-to-face,
[4:43] which is um where you put the
[4:45] transistors facing each other, you put
[4:48] it on the back. This means that your
[4:50] heat-generating components are at least
[4:51] far away from each other, but you still
[4:53] have to deal with things like compute
[4:56] and things uh such as data and power.
[4:59] Make sure they don't interfere. Um
[5:02] Reality here is though that is you still
[5:04] need you still need connections between
[5:06] the logic. So, there's a low
[5:07] interconnect density.
[5:09] In two here, you can see the raw TSV
[5:11] density is 3,000 per square mil.
[5:14] Uh and because you have to, you know,
[5:16] half that between signal, data, and
[5:18] power, you're you're 1 and 1/2 thousand
[5:21] per square millimeter.
[5:22] Um and you have to have parasitic
[5:24] loading to deal with.
[5:26] In terms of face-to-face,
[5:28] I said before, what if you put
[5:29] transistor transistor, what if you
[5:31] actually put back-to-back? Or in this
[5:33] case, they're putting face-to-face. What
[5:35] if you actually put the connectivity
[5:36] next to the connectivity?
[5:38] And they're saying here that due cuz you
[5:40] don't have to deal with having all your
[5:41] compute elements right there and in the
[5:44] way, you can have a higher density up to
[5:46] 27,000 per square mil.
[5:48] Uh and
[5:50] allowing this means you can also do
[5:51] things like making sure the wafers are a
[5:53] lot um
[5:56] the thinner and flatter so that when
[5:57] they bond together, they bond together
[5:59] easier.
[6:00] They're saying talking here about um
[6:02] hybrid bonding at 6 micron pitch and at
[6:04] 9 micron pitch uh in order to get that
[6:06] through a CoWoS S or CoWoS L, so TSMC
[6:10] style interposer.
[6:12] The challenges of doing this design
[6:14] where you got to do the logic, you got
[6:16] to clock do the clocking and sign-off.
[6:18] That's standard for these multi-die
[6:20] SOCs.
[6:21] But power, right? Power right now, we're
[6:24] still talking about, you know, 0.5
[6:27] W per square millimeter. They're talking
[6:29] about 4 W per square millimeter.
[6:32] Uh so, you know, this is a factor eight
[6:33] increase in thermal density. And then in
[6:36] terms of power delivery, we're going
[6:37] from, you know, 1 amp per square mil to
[6:39] 5 amps per square mil.
[6:40] Um
[6:41] so, you know, a lot of power going
[6:43] through these. And then yield, now yield
[6:46] with chiplets is always a funny thing um
[6:48] because the idea of having smaller
[6:49] chiplets is higher yield. But you've got
[6:51] to package together known good die to
[6:54] get the benefit of that. So, part of the
[6:56] complexity of having a chiplet-based
[6:57] design is how do you test chiplets
[7:00] that are dependent on another chiplet
[7:02] for their infrastructure?
[7:04] And part [snorts] of the skill in
[7:05] designing these things is you also
[7:06] design for yield. And that's part of the
[7:09] difficulty in having all these multiple
[7:11] chiplets involved, which is why I think,
[7:13] you know, an open chiplet ecosystem for
[7:16] 3D stacking is even less possible than
[7:21] just an open chiplet ecosystem in
[7:22] general. But you have to be able to do
[7:24] that.
[7:25] Uh
[7:26] here we have the uh high-bandwidth uh
[7:28] interconnect timing slide. So, this is
[7:31] talking about the fact that you have uh
[7:33] voltage um and frequency and thermal
[7:37] variations between two different
[7:40] chiplets.
[7:41] And you need to supply both from the
[7:43] same source, but you need to have make
[7:45] sure that they're either synchronous or
[7:47] they can operate asynchronously. So,
[7:49] that again comes into the architecture
[7:51] design and the difficulty therein.
[7:54] You also have to be able to model these
[7:55] for thermals.
[7:56] Uh we've said before time and time again
[7:58] that as you stack 3D, whether you're
[8:00] stacking compute on SRAM, SRAM on
[8:02] compute, compute on compute, memory on
[8:04] memory,
[8:05] part of the difficulty of doing it is
[8:07] how do you manage the thermals when
[8:08] everything is just such in a small
[8:10] confined area. And the way you do that
[8:13] is by simulating it. And if your
[8:14] simulations are good, you can design it
[8:16] to deal with those thermals. So,
[8:18] simulation to silicon correlation is
[8:20] key, and it's one of the big things that
[8:22] the EDA, uh the people who make the
[8:24] software that do these things, such as
[8:26] Synopsys, Cadence, and Siemens,
[8:29] they're having to get right and make
[8:31] sure that they're right earlier on
[8:32] earlier on in the development cycle of a
[8:34] new process node and a product such that
[8:37] we can get time to market quicker.
[8:40] And basically, this is essentially the
[8:41] final slide from Broadcom doing a small
[8:43] update. The future is here.
[8:45] We've got super low power for this
[8:47] interconnect, super low latency for
[8:49] performance, and they're enabling the
[8:52] cost through smaller interposers, and uh
[8:54] making sure that the substrate footprint
[8:56] is sufficient given the fact that, you
[8:58] know, we are substrate limited as an
[9:00] industry right now.
[9:02] So, you know,
[9:04] this is
[9:06] you know, so this is part discussion
[9:07] about what's coming up in the beast, but
[9:09] also what are they going to do this year
[9:11] and next year, so '26 and '27, before
[9:14] till they get to that beast in '28. And
[9:17] I've started to see people on Twitter
[9:18] finally come to the realization that
[9:20] actually
[9:21] Broadcom's a major player in this.
[9:23] My hope is that they speak more.
[9:25] When they do, you'll find it here on
[9:27] TechTechPotato.
[9:41] >> Mhm.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
