<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_c2aedd7ad3e60d5d"
title: "DeepSeek OCR：以视觉词元压缩文本的效率、训练数据用途与记忆能力边界"
domains: ["模型层","云与算力服务"]
subdomains: ["多模态与生成模型","开源与开放权重模型","模型研究与训练方法","智算云与算力租赁"]
types: ["行业认知","视频"]
companies: "DeepSeek；Lambda；Nvidia"
published_at: "2026-10-12T01:58:29.690Z"
importance: 0
confidence: 0
evidence_status: "平台字幕／转录，未人工校对"
worth_following: true
source_url: "https://www.youtube.com/watch?v=4fLVq6HJsKc"
source: "YouTube·Two Minute Papers"
---

# DeepSeek OCR：以视觉词元压缩文本的效率、训练数据用途与记忆能力边界

## 行业认知文章

- 行业：模型层、云与算力服务
- 公司：DeepSeek；Lambda；Nvidia
- 来源：YouTube·Two Minute Papers · [原文链接](https://www.youtube.com/watch?v=4fLVq6HJsKc)
- 发布时间：2026-10-12
- 原文存档：本文下方「原文存档」章节

## 摘要

### 全文重要观点
本材料为 Two Minute Papers 的 YouTube 视频《DeepSeek 解决了 AI 的内存问题》完整字幕，原始链接为 https://www.youtube.com/watch?v=4fLVq6HJsKc，标注时长337秒。视频介绍 DeepSeek OCR 将文本等信息渲染为图像，再通过学习式编码压缩为视觉词元，最后恢复为文本的思路。按视频转述，10倍压缩、占用空间减少90%时，可恢复超过96%的文本；压缩接近20倍时，光学字符识别准确率降至60%。其编码器依次使用局部窗口注意力、16倍卷积压缩器和全局视觉处理，以降低高分辨率文档的处理成本。视频还转述论文称，单张 A100 GPU 每天可生成超过20万页用于大语言模型和视觉语言模型训练的数据。后半段明确提出两项限制：单凭光学字符识别结果不足以证明真正的文本压缩；后续压力测试提示，模型可能较多依赖语言先验，通过上下文猜测被压缩掉的文字。视频称该系统开放且免费，并可为其他开放模型生成训练数据；结尾包含 Lambda 的服务推广。以下内容仅依据所给字幕整理，论文、压力测试及推广说法均未独立核验。字幕说明已核验首尾时间戳、行数和原始文件，但识别准确性未人工校对。

### 论点1：持续增加对话和附加文档，会扩大模型需要保留的信息量，并提高运行成本；视频由此提出让人工智能主动遗忘或压缩信息的研究动机。
**相应论据：**[0:05–0:14] 视频称，人工智能读取的文字会成为词元，而词元成本较高，书越长，处理负担越重。[0:17–0:34] 视频以人类记忆细节会逐渐淡化为类比，称 DeepSeek 研究人员提出让人工智能也进行“人工遗忘”。[0:43–0:51] 视频进一步指出，对话越长、附加文档越多，继续运行就越昂贵，因为系统需要记住全部内容。
**相应论证：**原文的论证链条是：更多对话和文档意味着更多需要保留的词元，词元增加带来更高的处理成本，因此减少历史信息的表示规模具有研究价值。人类遗忘仅用于说明研究动机，原文未证明人工智能的压缩机制与人类记忆机制相同，也未给出上下文长度与成本之间的定量关系。

### 论点2：DeepSeek OCR 的核心思路是将文本等信息转成图像，再压缩成较少的视觉词元，以缩小信息表示规模。
**相应论据：**[0:54–1:15] 视频介绍，将大量信息“甚至包括文本”渲染成图像，再压缩图像；这一过程有些类似 JPEG 图像压缩，但采用学习式、基于词元的压缩，得到的数据表示显著缩小。[2:16–2:23] 视频给出的形式化描述是：输入少量压缩后的视觉词元，输出数量大得多的文本词元。
**相应论证：**原文用输入输出表示的变化解释压缩思路：先把文本放入视觉表示，再用较少视觉词元承载信息，随后解码回更多文本词元。其所展示的效率目标是缩小表示规模并保留文字恢复能力。原文未给出完整的词元计数口径、文件大小比较或端到端运行成本，因此不能把视觉词元减少直接等同于所有成本同比下降。

### 论点3：视频报告了压缩倍率与文字恢复表现之间的权衡：10倍压缩下仍可恢复超过96%的文本，接近20倍压缩时识别准确率降至60%。
**相应论据：**[1:24–1:43] 视频称，在10倍压缩、使用空间减少90%的情况下，能够恢复超过96%的文本。[1:48–1:54] 当压缩提高到接近20倍时，光学字符识别准确率降至60%。
**相应论证：**原文通过两个压缩水平的结果说明，较高压缩倍率可以保留相当比例的文字信息，但进一步提高倍率会损害识别表现。需要保留两组数字的原始表述差异：前者是“恢复超过96%的文本”，后者是“光学字符识别准确率60%”。字幕未说明二者是否采用完全一致的指标定义，也未提供测试集、文档类型、语言、版面复杂度、统计分母或误差范围。

### 论点4：这项工作以光学字符识别为直接任务，但视频认为其研究意义还包括通过视觉表示压缩文本信息，不能仅概括为把 JPEG 接入人工智能。
**相应论据：**[2:01–2:23] 视频先指出，这是一篇关于光学字符识别的论文：输入文档，可能包括手写笔记，输出文字；从表示上看，是由少量压缩视觉词元生成更多文本词元。[2:26–2:35] 视频提出它是否只是已有30多年历史的 JPEG 技术接入人工智能。[2:45–2:52] 视频随后用“JPEG 压缩像素，这项工作压缩记忆”的表述强调区别，同时说明信息先转成图片，再压缩图片。
**相应论证：**原文的区别主要在于压缩目标及其与文字恢复任务的结合：JPEG 被描述为压缩像素，这项工作则被解释为借助图像表示压缩原本需要保存的信息。“压缩记忆”属于视频的解释性表述，后文又明确承认单凭光学字符识别不足以证明真正文本压缩。因此，该论点应理解为视频对研究方向的概括，不能据此认定人工智能长期记忆问题已被解决。原文未展开 JPEG 与该系统的完整性能对照。

### 论点5：编码器通过先局部处理、再卷积压缩、最后全局处理的结构，尝试控制高分辨率文档的处理成本。
**相应论据：**[2:58–3:17] 视频称关键工程设计是一个能够处理高分辨率文档、同时避免成本急剧增加的编码器，其顺序为局部窗口注意力、16倍卷积压缩器、全局视觉处理。[3:21–3:30] 视频将其通俗解释为：不对每个像素都投入完整注意力，而是先浏览、再压缩，最后读取。
**相应论证：**原文以处理顺序说明成本控制机制：先在局部窗口内处理视觉信息，经压缩减少后续需要处理的表示，再执行全局视觉处理，从而避免一开始就对全部高分辨率像素进行完整注意力处理。原文未给出各阶段的计算量、显存占用或对照实验；其中“16倍”指卷积压缩器的表述，不能直接视为前述10倍或接近20倍压缩实验的同一口径。

### 论点6：当文档处理成本足够低时，该系统还可用于批量生成模型训练数据；视频转述的吞吐量为单张 A100 GPU 每天超过20万页。
**相应论据：**[3:33–3:47] 视频指出，低成本处理能力使系统用途不止于保留旧数据，还能帮助生成新数据。[3:47–4:01] 视频转述论文称，系统可为大语言模型和视觉语言模型生成训练数据，在单张 A100 GPU 上每天处理超过200,000页，并称其速度合理。
**相应论证：**原文的因果关系是，文档处理足够便宜且吞吐量足够高，便有条件将这一能力用于大规模训练数据制备。单卡每天超过20万页是其支持这一用途的主要量化证据。字幕未说明页面分辨率、平均文字量、数据生成流程、批处理设置、输出质量、电力成本或人工审核需求，也未明确“页”的具体计量方式，因此不能直接换算为单位成本或可直接用于训练的高质量数据量。

### 论点7：光学字符识别成绩本身不足以证明真正的文本压缩能力，这一限制来自视频对论文自身表述的转述。
**相应论据：**[4:04–4:11] 视频明确表示需要考察局限，并称论文自身指出：“仅靠光学字符识别，不足以证明真正的文本压缩。”
**相应论证：**原文将已展示的识别结果与更广泛的文本压缩能力区分开来，要求限制对实验结果的外推范围。字幕没有继续解释何种评测足以证明真正文本压缩，也未给出其他验证结果；原文未展开论证。因此，前述识别准确率不能单独支撑“已解决人工智能记忆问题”这一标题层面的强结论。

### 论点8：高压缩下的文字恢复可能较多依赖语言先验和上下文猜测，恢复正确不一定意味着模型仍能从图像中读到相应文字。
**相应论据：**[4:13–4:19] 视频称，后续压力测试提示，模型可能高度依赖语言先验，而不只是视觉记忆。[4:21–4:34] 视频解释，当图像压缩过度时，模型可能已经无法真正看到缺失文字，而是根据上下文猜测最可能的词，类似更强的自动补全。
**相应论证：**原文提出了文字恢复结果的另一种解释：输出与原文相符，可能部分来自语言模型对上下文的预测，而非压缩表示完整保留了文字信息。这会限制识别准确率作为视觉信息保真证据的力度。该判断保留了“可能”和“提示”的不确定性；字幕未提供压力测试的来源、具体设计、样本或数值，不能据此确定语言先验贡献的比例，也不能认定全部恢复结果都依赖猜测。

### 论点9：视频认为该系统的开放、免费属性及其训练数据生成能力，有助于其他开放模型的发展。
**相应论据：**[4:35–4:46] 视频称，该系统向所有人开放且免费，同时能够创建训练数据，帮助其他开放模型产生。
**相应论证：**原文以可获得性和训练数据供给两方面说明其对开放模型生态的价值：用户可以使用该系统，其他模型也可以利用其生成的数据。字幕未说明具体开放范围、代码或权重获取方式、许可证、免费使用条件，也未列举已有其他模型采用这些数据的实例。除上述作用关系外，原文未展开论证，不能进一步推定其商业许可或已经兑现的生态成果。

### 论点10：视频结尾推广 Lambda 的 GPU 服务，列举研究复现、模型训练与微调、推理及生成任务等用途，但没有提供独立性能或可靠性证据。
**相应论据：**[5:03–5:11] 主讲人称，自己使用 Lambda 复现人工智能论文，常能在几分钟内完成，并表示其适合训练自己的模型或微调已有模型。[5:11–5:25] 推广内容继续列举推理、文本生成图像或视频、运行聊天机器人或智能体等用途，称服务快速可靠，并提供 Nvidia GPU。[5:25–5:34] 主讲人表示用其测试所介绍论文中的想法，并引导访问 lambda.ai/papers。字幕在[5:17]将聊天机器人名称记录为“deep sea”，未人工校对，因此不据此确定具体产品名称。
**相应论证：**这一段以主讲人的个人使用陈述和任务清单介绍 Lambda 的服务范围，属于视频推广内容。原文未提供论文复现的任务规模、完成标准、运行配置、价格、速度对照、服务可用性或第三方验证；关于“几分钟”“快速”“可靠”的性能和可靠性说法，原文未展开论证，也不能用来验证前述 DeepSeek OCR 的研究结果。

## 值得关注的信号

材料提供的主要研究价值，是将文档处理效率落实到压缩倍率、文本恢复表现、编码器结构和单卡数据生成吞吐量等具体指标。按原文，在10倍压缩下仍能恢复超过96%的文本，以及单张 A100 GPU 每天生成超过20万页训练数据的说法，提示这一方法可能用于降低文档表示与训练数据制备的资源需求，但材料未提供完整测试条件、成本测算、客户采用、商业收入或盈利数据。投资判断还需保留原文的能力边界：光学字符识别表现不能直接证明长期记忆或真正文本压缩能力，语言先验也可能影响恢复准确率。开放、免费与支持其他开放模型训练属于视频陈述，不能据此确定具体许可、商业化模式或价值捕获能力。结尾 Lambda 内容属于推广，不能作为该研究效果或服务可靠性的独立证据。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"6574080d5f63919443faf5f21b712f30d6ef0f091f425429190ea365feeca0e4","translationSha256":"8519357fd0bab522ed44891397ec307dab0cf2ab80770ef7cc6c1a9061262ee7","sourceCharacters":5604,"timestampValues":122,"timestampOrderVerified":true,"englishProseChecked":true,"captionRowsVerified":122,"captionTimestampsManagedByProgram":true,"captionRepairedRows":0} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

# DeepSeek 解决了 AI 的内存问题

- 来源：YouTube·Two Minute Papers

- 原始链接：https://www.youtube.com/watch?v=4fLVq6HJsKc

- 时长：337 秒


## 完整文字稿

[0:00] 如果 AI 记住一本书的最佳方式，是停止阅读它呢？
[0:02] 你看，AI 读到的每个词都会变成
[0:05] token，而 token 很贵。书越
[0:08] 长，AI 就越难以消化它。但我们人类会做一些
[0:11] 奇怪的事。我们并不会把所有事情
[0:14] 都记得一清二楚。有些细节会淡去。年纪越大的
[0:17] 爷爷，在学校时就越优秀。
[0:19] Deep Seek 的科学家们提出了这个
[0:22] 问题：“如果我们也让 AI 这么做
[0:25] 呢？”让人工
[0:27] 智能进行人工
[0:30] 遗忘。
[0:32] 但是，这个提议也太疯狂了。为什么
[0:34] 要这么做？这怎么说得通？
[0:36] 好吧，我们一起来看看。随着我们
[0:39] 不断与 AI 系统对话，对话越
[0:41] 久，附加的文档越多，持续运行
[0:43] 的成本就越高，
[0:46] 因为它必须记住所有内容。
[0:48] 现在，Deep Seek OCR 说不用担心。
[0:51] 我们把这锅庞大的信息大杂烩，
[0:54] 甚至包括文本，都渲染成一张图像，
[0:57] 然后压缩这张图像，有点像
[1:00] JPEG 对图像所做的压缩。
[1:03] 但是，这是通过学习实现的，而且基于 token。
[1:06] 现在，这些数据的体积
[1:09] 大幅缩小了。不过，这还是不太
[1:12] 说得通。这样有什么好处？我的
[1:15] 意思是，我们会丢失很多信息，
[1:17] 对吧？先别急，
[1:20] 也就是说，我们会丢失大量信息，
[1:22] 级别下，我们会丢失多少
[1:24] 各位学者同仁，来看看会丢失多少
[1:27] 在10倍压缩下丢失的信息
[1:29] 空间。
[1:32] 所有内容，并且只占用90%的空间。
[1:35] 那压缩率可真高。那么
[1:39] 这会是什么呢？我们能还原超过
[1:43] 96% 的文本。这简直不可思议。所以，
[1:48] 为什么不再进一步呢？嗯，
[1:50] 随着压缩率提高到接近 20 倍，OCR
[1:54] 准确率降到了 60%。
[1:57] 哇。我原以为会低得多得多。好吧，
[2:01] 现在有个重要问题。这真的是
[2:03] 新东西吗？我是说，起初我对这项工作有点
[2:05] 困惑，因为这是一篇关于 OCR 的
[2:08] 不起眼的论文。没错，它确实做 OCR。
[2:11] 也就是说，你给它一份文档，
[2:13] 甚至可能是一张手写便条，它
[2:16] 就会把文字还给你。从形式上说，它
[2:18] 会取少量压缩后的
[2:21] 视觉 token，并将它们转换成数量多得多的
[2:23] 文本 token。但这
[2:26] 不就是 JPEG 吗？我是说，这项技术
[2:29] 已经有 30 多年历史了。这个想法
[2:32] 不错，但这不就是把 JPEG 接入
[2:35] 一个 AI 系统吗？嗯，也不完全是。这里有
[2:37] 大量新东西。亲爱的学者同仁们，
[2:40] 这里是《两分钟论文》，我是
[2:42] Karolis Jonaityte 博士。你看，JPEG
[2:45] 压缩的是像素。这种方法压缩的是
[2:48] 记忆。首先，这些记忆
[2:50] 会被转换成图像，然后我们
[2:52] 再压缩这张图像。但我们
[2:55] 还没做完呢。不，不，不。
[2:58] 还差得远呢。关键的工程
[3:00] 技巧是，他们创建了一个编码器，
[3:03] 专为处理非常高分辨率的文档而设计，
[3:05] 同时不会让成本
[3:07] 暴涨。为此，第一，
[3:11] 它先使用局部窗口注意力。第二，
[3:14] 采用 16 倍的卷积压缩器。而且
[3:17] 三，它进行全局视觉处理。
[3:21] 好，那这意味着什么？嗯，
[3:24] 换句话说，它不会全神贯注地盯着每一个
[3:26] 像素。不，它会快速浏览、
[3:30] 压缩，然后才读取。而且
[3:33] 有件事很巧妙。一旦你
[3:36] 能以足够低的成本做到这一点，突然间
[3:38] 这就不只是记住旧
[3:41] 数据了。等等，这是不是意味着它不仅能
[3:44] 理解文档，还能
[3:47] 帮助生成新数据？是的。这篇论文
[3:51] 说，它每天能为
[3:53] LLM 和 VLM 生成训练数据，超过 200,000
[3:57] 页，而且只用一块 A100 GPU，速度
[4:01] 也还算合理。我们在这里都是同行学者
[4:04] ，所以也要看看局限性。
[4:07] 论文自身指出，单靠 OCR 并不足以
[4:11] 证明真正实现了文本压缩，
[4:13] 而且后续的压力测试显示，
[4:16] 模型可能严重依赖语言
[4:19] 先验，而不只是视觉记忆。换句话
[4:21] 说，当图像压缩得过于
[4:23] 厉害时，它可能并没有真正看见
[4:26] 缺失的文本，而是
[4:29] 根据上下文猜出最可能的词语，
[4:31] 有点像自动补全，不过
[4:34] 更好。
[4:35] 总的来说，这绝对棒极了。
[4:38] 这不仅是一个向所有人
[4:41] 免费开放的系统，它还会创建
[4:43] 训练数据，帮助其他开放模型
[4:46] 得以诞生。这实在
[4:49] 太惊人了。活在这个时代真好。而且
[4:52] 别忘了，每一篇研究论文
[4:54] 都在推动人类进步。不过，未来
[4:57] 属于那些理解未来的人。
[4:59] 也许，订阅并点击铃铛，
[5:01] 如果你觉得喜欢这个视频。我经常用
[5:03] Lambda 在几分钟内复现 AI 研究论文。
[5:06] 它也很适合用来
[5:09] 训练你自己的模型，或微调一个
[5:11] 现有模型。运行推理，或进行文本生成
[5:14] 图像或视频，轻轻松松。运行一个
[5:17] 深海聊天机器人或智能体，速度超快，
[5:20] 非常可靠。Lambda 为你提供
[5:22] 强大的 Nvidia GPU，让你运行自己的
[5:25] 实验。我会测试我介绍的论文中的想法，
[5:27] 片刻之后，
[5:30] 就能得到结果。太棒了。真的，快去试试，
[5:34] 现在就访问 lambda.ai/papers.

> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=4fLVq6HJsKc
- 来源：YouTube·Two Minute Papers
- 发布时间：2026-10-12
- 行业：模型层、云与算力服务
- 公司：DeepSeek；Lambda；Nvidia
- 归档时间：2026-10-12T03:08:54.976Z

---

# DeepSeek Solved AI’s Memory Problem

- 来源：YouTube·Two Minute Papers

- 原始链接：https://www.youtube.com/watch?v=4fLVq6HJsKc

- 时长：337 秒


## 完整文字稿
[0:00] What if the best way for an AI to
[0:02] remember a book is to stop reading it?
[0:05] You see, every word an AI reads becomes
[0:08] tokens, and tokens are expensive. The
[0:11] longer the book, the more the AI chokes
[0:14] on it. But, we humans do something
[0:17] strange. We don't remember everything
[0:19] perfectly. Some details fade. The older
[0:22] grandpa is, the better he was at school.
[0:25] And scientists at Deep Seek asked the
[0:27] question, "What if we make an AI do
[0:30] that, too?" Asking artificial
[0:32] intelligence to do artificial
[0:34] forgetting.
[0:36] But, what a crazy proposition. Why would
[0:39] you do that? How does that even make
[0:41] sense? Well, let's see together. As we
[0:43] keep talking to an AI system, the longer
[0:46] we talk, the more documents we attach,
[0:48] the more expensive it is to keep running
[0:51] because it has to remember everything.
[0:54] Now, Deep Seek OCR says not to worry.
[0:57] Let's take this big soup of information,
[1:00] even text, and render it as an image,
[1:03] and then compress that image, a bit like
[1:06] what JPEG compression does to images.
[1:09] But, this is learned and token-based.
[1:12] And now, this data is drastically
[1:15] smaller. But, this still doesn't make
[1:17] too much sense. So, how is that good? I
[1:20] mean, we lose a lot of information,
[1:22] right? Well, hold on to your papers,
[1:24] fellow scholars, and let's see how much
[1:27] information we lose at 10x compression
[1:29] level that is throwing away almost
[1:32] everything and using 90% less space.
[1:35] That is a lot of compression. And what
[1:39] can that be? We can recover more than
[1:43] 96% of the text. That is insane. So,
[1:48] why not push it a bit further? Well, as
[1:50] we go up to nearly 20x compression, OCR
[1:54] accuracy falls to 60%.
[1:57] Wow. I expected much, much lower. Okay,
[2:01] now important question. Is this really
[2:03] new? I mean, at first I was a bit
[2:05] confused by this work because this is an
[2:08] unassuming paper about OCR. Yes, this
[2:11] does OCR. So, you give it a document,
[2:13] maybe even a handwritten note, and it
[2:16] gives you the text back. Formally, it
[2:18] takes a small amount of compressed
[2:21] vision tokens and turns them into a much
[2:23] larger number of text tokens. But, is
[2:26] this just JPEG? I mean, that technology
[2:29] is more than 30 years old. The idea is
[2:32] good, but is this just JPEG plugged into
[2:35] an AI system? Well, not quite. There is
[2:37] tons of new stuff here. Dear fellow
[2:40] scholars, this is Two Minute Papers with
[2:42] Dr. Karolis Jonaityte. You see, JPEG
[2:45] compresses pixels. This compresses
[2:48] memories. First, these memories are
[2:50] turned into a picture, and then we
[2:52] compress that picture. But, we are not
[2:55] done yet. No, no, no.
[2:58] Not even close. The key engineering
[3:00] trick is that they created an encoder
[3:03] that is built to survive very
[3:05] high-resolution documents without
[3:07] exploding in cost. To do that, one, it
[3:11] uses local window attention first. Two,
[3:14] a 16x convolutional compressor. And
[3:17] three, it does global visual processing.
[3:21] Okay, and what does that mean? Well, in
[3:24] other words, it does not stare at every
[3:26] pixel with full attention. No, it skims,
[3:30] it squeezes, and only then it reads. And
[3:33] here is something brilliant. Once you
[3:36] can do this cheaply enough, suddenly
[3:38] this is not just about remembering old
[3:41] data. Wait, does that mean that it can
[3:44] not only understand documents, but also
[3:47] help generate new data? Yes. The paper
[3:51] says it can generate training data for
[3:53] LLMs and VLMs at more than 200,000
[3:57] pages per day on a single A100 GPU in
[4:01] sane speeds. Now, we are fellow scholars
[4:04] here, so we look at limitations, too.
[4:07] The paper itself says OCR alone is not
[4:11] enough to prove true text compression,
[4:13] and a later stress test suggests the
[4:16] model may rely heavily on language
[4:19] priors, not just visual memory. In other
[4:21] words, when the image becomes too
[4:23] compressed, it may not truly see the
[4:26] missing text anymore, but it also
[4:29] guesses the most likely words from the
[4:31] context, kind of like auto complete, but
[4:34] better.
[4:35] Overall, this is absolutely fantastic.
[4:38] This is not only an open system that is
[4:41] free for all of us, but it also creates
[4:43] training data to help other open models
[4:46] come into being. That is absolutely
[4:49] amazing. What a time to be alive. And
[4:52] don't forget, every research paper
[4:54] pushes humanity forward. But, the future
[4:57] belongs to the ones who understand it.
[4:59] Perhaps, subscribe and hit the bell if
[5:01] you feel that you enjoyed this. I use
[5:03] Lambda to reproduce AI research papers
[5:06] often in minutes. It's also great to
[5:09] train your own models or fine-tune an
[5:11] existing one. Run inference or text to
[5:14] image or video, easy peasy. Running a
[5:17] deep sea chatbot or agent, super fast,
[5:20] super reliable. Lambda gives you
[5:22] powerful Nvidia GPUs to run your own
[5:25] experiments. I test ideas from the
[5:27] papers I cover, and moments later,
[5:30] results. Love it. Seriously, try it out
[5:34] now at lambda.ai/papers.


> 来源：YouTube 浏览器原生导出完整字幕，首尾时间戳、行数及原始文件已核验；导出不含逐条结束时间，未人工校对识别准确性。
