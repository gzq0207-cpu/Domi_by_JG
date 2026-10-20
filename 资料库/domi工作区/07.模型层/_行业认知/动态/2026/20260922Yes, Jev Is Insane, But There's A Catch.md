<!-- domi:managed:start -->
---
domi_schema: 6
entity_type: "news_event"
article_type: "article"
event_id: "art_38d10547bdd3074f"
title: "是的，Jev 简直不可思议，但有个问题"
domains: ["模型层"]
subdomains: ["模型研究与训练方法"]
types: ["行业认知","视频"]
companies: "typesafe.ai"
published_at: "2026-09-21T16:00:00.000Z"
importance: 6
confidence: 6
evidence_status: "二手报道"
worth_following: true
source_url: "https://www.youtube.com/watch?v=qBBRRsH0rQc"
source: "YouTube·Two Minute Papers"
---

# 是的，Jev 简直不可思议，但有个问题

## 行业认知文章

- 行业：模型层
- 公司：typesafe.ai
- 来源：YouTube·Two Minute Papers · [原文链接](https://www.youtube.com/watch?v=qBBRRsH0rQc)
- 发布时间：2026-09-21
- 原文存档：本文下方「原文存档」章节

## 摘要

【核心观点】初创 typesafe.ai 发布名为 Jev 的"System One Models"决策模型：不生成文本、专做决策——问题与候选项输入、一个答案即时输出，号称比现有聊天机器人快约200倍；作者肯定其工程组合价值，同时提醒区分事实与病毒式营销。
【关键事实】Jev 的三个组合创新：① 为"做决策"而非"生成 token"设计的新架构；② 并行采样（parallel sampling）——一次性评估所有候选答案而非逐 token 生成；③ 名为 RLCD 的训练方法，使置信度与正确率大致校准（自称80%把握时约80/100次正确），可据此决定何时信任它、何时回退到更重的模型。用例：实时游戏（世界状态为问题、可选动作为选项）；给 LLM Agent 系统分流简单决策（打开哪个文件、重试还是放弃），可显著加速 Agent 并降低 token 消耗与成本。作者指出：无正式研究论文、仅官网高层描述；核心思想可追溯到约90年前的分类器，与 setfit、RLCD 等近年开放工作一脉相承，社区已有开源复现实现。

## 值得关注的信号

【值得关注的信号】"快而小的决策模型 + 慢而大的 LLM"分层架构是降低 Agent 推理成本的现实路径；若置信度校准可信，可作路由/回退机制显著降本。但该方向思想并不新，竞争壁垒存疑——跟踪开源实现与实际落地效果，比单一公司的营销叙事更可靠。

## 后续动作

仅归档
<!-- domi:managed:end -->

<!-- domi:translation:start -->
<!-- domi:translation:receipt {"version":7,"model":"gpt-6-luna","reasoningEffort":"medium","serviceTier":"standard","complete":true,"sourceSha256":"734b87ce3c06d3ea45bd96a62198e946e2db586df19646ffcde9b87d9bed3490","translationSha256":"7d8012630d444437989a66d9726e4ddfd2a861c260ff807e3e2eb90746c98620","sourceCharacters":6012,"timestampValues":0,"timestampOrderVerified":true,"englishProseChecked":true} -->
## 中文全文

> 由 GPT-6 Luna 翻译，标准智能、标准速度。英文原文保留供核对。

- 链接：https://www.youtube.com/watch?v=qBBRRsH0rQc
- 频道：Two Minute Papers
- 发布日期：2026-09-22
- 时长：5分16秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

❤️ 点击此处了解 Lambda 并注册使用其 GPU 云服务：https://lambda.ai/papers

📝 Jev:
https://typesafe.ai/blog/introducing-system-one-models-and-jev

完整歌曲：https://www.youtube.com/watch?v=4RtUJkjrKMI

先前的论文、实现和模型：
https://huggingface.co/convaiinnovations/laya
https://arxiv.org/abs/2503.23303
https://huggingface.co/DeepMostInnovations/sales-conversion-model-reinf-learning
https://huggingface.co/datasets/DeepMostInnovations/saas-sales-conversations
https://arxiv.org/abs/2510.01237
https://huggingface.co/blog/setfit
https://proceedings.iclr.cc/paper_files/paper/2025/hash/5503a7c69d48a2f86fc00b3dc09de686-Abstract-Conference.html

Sources:
https://x.com/alexisgallagher/status/2100312082491322873?s=46
https://x.com/tamarajtran/status/2100694549362553153?s=46
https://x.com/maubaron/status/2100738237237002706?s=46
https://x.com/elvissun/status/2100951347080421409?s=46
https://x.com/completeskeptic/status/2099925684256899543?s=46
https://x.com/completeskeptic/status/2099925685720760404?s=46
https://x.com/filippkowalski/status/2100864984448147770?s=46
https://x.com/egafni/status/2100770895325524242?s=46
https://x.com/mizorewww/status/2101473552956555427
https://x.com/miu21590/status/2101857866378362926?s=46
https://x.com/atomic_chat_hq/status/2102160983409955244?s=46
https://x.com/HugoDuprez/status/2100953089003921543?s=20
https://x.com/heyxviraj/status/2102048070649405592?s=20

🙏 我们要感谢慷慨的 Patreon 支持者，正是他们让《Two Minute Papers》得以实现：
Adam Bridges、B Shang、Carlos Galarza、Christian Ahlin、Eric Tyson、Juan Benet、Lukas Biewald、Michael Tedder、Owen Skarpness、Ryan Stankye、Shawn Becker、Steef、Taras Bobrovytsky、Tazaur Sagenclaw、Tybie Fitzhugh、Ueli Gallizzi

## 全文

一款名为 Jev 的新 AI 正在风靡全球。但为什么要对一个连文字都不会写的 AI 系统感到兴奋呢？它确实能在互联网上运行。那么我们就来把事实和炒作区分开来。好，它不会写文字。相反，它会做决策：输入一个问题和一些选项，输出一个答案。有点像《谁想成为百万富翁？》但你不用等着 [音乐] 答案出来，它会立刻给出答案，速度最多可达我们现在的聊天机器人的 200 倍。这非常有用。你还可以用它玩电子游戏。好耶。输入的是世界状态，可能的答案就是你可以采取的行动。如果它快到极致，

可以实时执行任务。但它会变得更好。LLM 的速度相对较慢。因此，当你用一个超级智能的 AI 编写代码时，所有事情都要花很长时间。不过，在这个过程中，你也会遇到一些简单的决策：我该打开哪个文件？哪种故障更重要？是重试还是继续？这正是 Jev 能提供帮助的地方。把这些决策交给 Jev，它几乎能立即解决。在某些情况下，它可以显著加快一个类似 Fable 的 AI 系统，甚至减少 token 用量。它让事情变得更便宜、更快。这太棒了。现在，虽然还没有研究论文，但你们这些学者同仁中可能有人会说：“好吧，这是一个分类器，这个想法可以追溯到

早在 90 年前就已经如此了。”那么，这里有什么新东西呢？首先，没有正式的研究论文。网站上只有一段高层次的介绍，但这可不能阻止我们这些学者做研究，对吧？好了，各位学者，把论文拿稳。这次来点更有感觉的。>> 拿稳你的论文。[音乐] 让智慧流淌。拿稳你的论文。科学牵动着你的灵魂。[音乐] 拿稳你的论文。未来今夜刚刚开始。接下来这位带来了火花，让我们的梦想继续闪耀。[音乐] 顺便说一句，这回我们说的是真正的歌曲。所以，类似的想法多年来已经被反复探索。还有一些开放

论文在理念上出奇地接近，我们也在这里赞颂了不起的科学与研究。所以我想向这些早期开放研究成果背后的科学家们致以诚挚的谢意。Jev 的基本想法肯定不新，但 Jev 还结合了三个要素。第一，一种专为做决策而非生成 token 构建的新架构。第二，它一次性评估所有可能的答案，而不是逐个评估。他们称之为并行采样。第三，一种新的训练方法，他们称为 RLCD；在这种方法下，模型置信度大致与它答对的频率相匹配。所以，如果 [清嗓子] 它说自己有 80% 的把握，那么它应该有 80 的概率在 100 次中答对，而不是每次都答对。

这有什么好处呢？这样你就可以查看置信度数值，并决定何时相信它，或者转而使用更强大、更聪明的模型。再说一次，类似的想法多年来已经被研究过，但这个方案的组合方式令人惊叹，给了我们一个非常实用的新工具。太喜欢了。你们这些学者也在不断推出它的开源实现。这就是开放科学的最佳状态。你们太棒了。所以，让我们保持理性，把事实和炒作区分开来。它很棒吗？是的，它让我们离快速、本地化、可以永久拥有的 AI 又近了一步。它是否也被炒作和

病毒式营销大肆放大了？是的。它是新东西吗？部分是。我花了更长时间才把这个视频做出来给你们看。这对播放量不太有利，但我这么做是为了讲得更简洁。去看看相关论文，也看看你们这些学者是如何在实践中使用它的。那样的视频对你更有帮助。订阅并点击铃铛，获取更多论文内容。我经常用 Lambda 在几分钟内复现 AI 研究论文。它也很适合训练你自己的模型，或微调现有模型。运行推理、文生图或视频生成，轻轻松松。运行 Deepseek 聊天机器人或智能体，速度飞快、可靠性超高。Lambda 为你提供强大的 Nvidia GPU，让你运行自己的实验。我会测试自己介绍的论文中的想法，然后过一会儿

就能看到结果。太喜欢了。说真的，现在就去 lambda.ai/papers 试试吧。各位爱看论文的人。
<!-- domi:translation:end -->

## 原文存档

- 原文链接：https://www.youtube.com/watch?v=qBBRRsH0rQc
- 来源：YouTube·Two Minute Papers
- 发布时间：2026-09-21
- 行业：模型层
- 公司：typesafe.ai
- 归档时间：2026-10-09T09:02:18.745Z

---

- 链接：https://www.youtube.com/watch?v=qBBRRsH0rQc
- 频道：Two Minute Papers
- 发布日期：2026-09-22
- 时长：5分16秒
- 字幕来源：YouTube 英文自动字幕（机器清洗，未人工校对）

## 简介

❤️ Check out Lambda here and sign up for their GPU Cloud: https://lambda.ai/papers

📝 Jev:
https://typesafe.ai/blog/introducing-system-one-models-and-jev

Full song: https://www.youtube.com/watch?v=4RtUJkjrKMI

Previous papers, implementations, models:
https://huggingface.co/convaiinnovations/laya
https://arxiv.org/abs/2503.23303
https://huggingface.co/DeepMostInnovations/sales-conversion-model-reinf-learning
https://huggingface.co/datasets/DeepMostInnovations/saas-sales-conversations
https://arxiv.org/abs/2510.01237
https://huggingface.co/blog/setfit
https://proceedings.iclr.cc/paper_files/paper/2025/hash/5503a7c69d48a2f86fc00b3dc09de686-Abstract-Conference.html

Sources:
https://x.com/alexisgallagher/status/2100312082491322873?s=46
https://x.com/tamarajtran/status/2100694549362553153?s=46
https://x.com/maubaron/status/2100738237237002706?s=46
https://x.com/elvissun/status/2100951347080421409?s=46
https://x.com/completeskeptic/status/2099925684256899543?s=46
https://x.com/completeskeptic/status/2099925685720760404?s=46
https://x.com/filippkowalski/status/2100864984448147770?s=46
https://x.com/egafni/status/2100770895325524242?s=46
https://x.com/mizorewww/status/2101473552956555427
https://x.com/miu21590/status/2101857866378362926?s=46
https://x.com/atomic_chat_hq/status/2102160983409955244?s=46
https://x.com/HugoDuprez/status/2100953089003921543?s=20
https://x.com/heyxviraj/status/2102048070649405592?s=20

🙏 We would like to thank our generous Patreon supporters who make Two Minute Papers possible:
Adam Bridges, B Shang, Carlos Galarza, Christian Ahlin, Eric Tyson, Juan Benet, Lukas Biewald, Michael Tedder, Owen Skarpness, Ryan Stankye, Shawn Becker, Steef, Taras Bobrovytsky, Tazaur Sagenclaw, Tybie Fitzhugh, Ueli Gallizzi

## 全文

A new AI called Jev is taking the world by storm. But why get excited for an AI system that can't even write text? It properly run over the internet. So let's try to separate the facts from the hype. Okay, so it does not write text. Instead, it makes decisions, a question, and some options go in. One answer comes out. Kind of like who wants to be a millionaire? But you don't wait [music] for the answer. It pops out instantly, up to about 200 times faster than our chatbots today. That is very useful. You can also play video games with it. Hooray. The question is the world state. And the potential answers are the moves you can make. And if it is extremely fast, it

can play things in real time. But it gets better. LLMs are relatively slow. So when you code up something with a super smart AI, everything takes a long time. But along the way, you also have a few simple decisions, too. Which file do I open? Which failure matters. Retry or move on. And this is where Jev can help. Offload these decisions to Jev and it solves them nearly instantly. In some cases, it can meaningfully speed up a fablelike AI system and even cut down the token usage. It makes things cheaper and faster. That is amazing. Now, there is no research paper, but some of you fellow scholars probably say, "Okay, this is a classifier, an idea that dates

back around 90 years now." So, what's new here? Well, first, there is no official research paper. There is only a highlevel description on the website, but it doesn't stop us fellow scholars from doing our research, does it? Now, hold on to your papers, fellow scholars. Come on, this time with more feel. >> Hold on to your paper. [music] Let that wisdom roll. Hold on to your paper. Science got your soul. [music] Hold on to your paper. The future just stars tonight. And here's the one who shows the spark that keeps our dreams alive. [music] Now we're talking actual song, by the way. So similar ideas have been explored for years and years now. There are open

papers surprisingly close in spirit and we celebrate amazing science and research here. So I would like to say a big thank you to the scientists behind these earlier open works. So the basic idea in Jev is certainly not new but Jev also combined three ingredients. One, a new architecture that is built to make decisions instead of generating tokens. Two, it evaluates all possible answers all at once instead of one by one. They call it parallel sampling. and three, a new training method they call RLCD, where the AS confidence roughly matches how often it is right. So if [clears throat] it says 80% confident, it should be correct about 80 times out of 100, not always.

Why is that good? Well, this way you can actually look at the confidence value and decide when to trust it or fall back to a heavier, smarter model. Once again, similar ideas have been explored for years now, but the way this one is put together, it is an incredible combination that gives us a really useful new tool. Love it. And you fellow scholars are also pumping out open-source implementations of it as well. That is open science at its best. You are amazing. So, let's be level-headed and separate the facts from the hype. Is it awesome? Yes, one ingredient closer to fast local AI that we will be able to own forever. Now, is it also heavily amplified by hype and

viral marketing? Yes. Is it new? Partly. Okay. I took a bit longer to make this for you. That's not great for views, but I do it to be more concise. Look up related papers and see how you fellow scholars use it in practice. That is a better video for you. Subscribe and hit the bell for more papers. I use Lambda to reproduce AI research papers often in minutes. It's also great to train your own models or fine-tune an existing one. Run inference or text to image or video. Easy peasy. Running a Deepseek chatbot or agent. Super fast, super reliable. Lambda gives you powerful Nvidia GPUs to run your own experiments. I test ideas from the papers I cover and moments

later, results. Love it. Seriously, try it out now at lambda.ai/papers. Ei peepers.
