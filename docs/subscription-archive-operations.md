# YouTube 订阅归档维护

字幕补取由本地脚本调用 Tabbit 官方稳定 CLI 执行，不依赖聊天临时提供 Chrome 工具。每日 09:00 的 `AI Builders Digest` 发现新视频并调用同一消费者；`AI Builders YouTube Archives` 在每天 10:15、11:15、14:15、16:15 补跑。错过运行时间会在 Windows 用户下次登录后补跑。

## 正常处理链路

1. 检查 `~/.follow-builders/pending-archive.json` 和 `.archive.lock`；空队列或已有实际进程持锁时结束。
2. 优先验证并复用字幕缓存。新视频的命令行字幕入口如要求访问验证，立即转入独立浏览器；以后不重复这个失败入口。
3. 官方 CLI 打开原视频，等待可见标题、视频标识和真实播放器时长一致，排除广告时长。读取该播放器提供的平台字幕轨；接口为空时，正常展开同一页面的官方“内容转文字”面板。保留完整 JSON3 响应或完整面板数据及全量显示字幕行。
4. 核验原始响应与导出文字逐行一致，并校验时间戳及文件哈希。细粒度字幕维持首尾跨度和间隔校验；官方面板按段落合并字幕时，必须逐一核对所有源索引连续、跳转视频标识和时间一致、全部面板源段落与全部 DOM 字幕行一致，没有未读取的分页。段落起点跨度不冒充音频覆盖率。
5. GPT-6.1 Sol／高智能／标准速度生成“全文重要观点、各论点及其论据与论证”；GPT-6 Luna／标准智能／标准速度翻译完整全文。
6. 入库、文档回读后，自动调用 `verify-subscription-backlog.cjs`。全部完成时强制使用 `--require-complete`。

## 网站要求正常登录时

打开 Tabbit 浏览器中保留的“Domi 字幕维护”页面，手动完成 YouTube 正常登录。登录由网站和浏览器保存；脚本不读取、复制或导出 Chrome 登录信息、密码、Cookie 或鉴权头。后续任务继续使用同一个独立浏览器实例。

登录过期、验证码、会员和地区限制需要正常处理，不能承诺永久免除网站访问限制。同一全局登录/连接原因不会因为新增视频而反复通知；原因变化或实际归档完成时才提示。

完成正常登录后可立即续跑（PowerShell）：

```powershell
Set-Location -LiteralPath .
$env:ELECTRON_RUN_AS_NODE='1'
& 'node_modules/electron/dist/electron.exe' scripts/process-subscription-archives.cjs --force
```

定时任务默认保留访问和额度退避，不使用 `--force`。不要另外启动本地 ASR，也不要把简介或第三方摘要当成全文。

## 可恢复故障与证据

- Tabbit 升级使 CLI 注册过期：只正常启动已核验签名的稳定浏览器一次，由浏览器更新自身注册；不编辑注册、ACL 或用户配置目录。
- 浏览器执行中断：`archives/browser-active-request.json` 保存原任务和请求 ID。下轮先读取原回执，避免重新导航或重复导出尚未结束的请求。
- `archives/browser-status.json`：全局连接／登录状态及提醒去重。
- `archives/<videoId>/browser-access.json`：该视频准确原因和检查时间。
- `archives/<videoId>/browser-captions/`：原始平台响应、完整导出、结构化时间戳和哈希。
- `browser-transcripts-<日期>-<唯一标识>.json`：本轮导入与完整核验清单。
- `archive.log`、`archive-scheduler.log`：处理进度与 Windows 任务执行记录。

查看任务状态：

```powershell
Get-ScheduledTask -TaskName 'AI Builders YouTube Archives'
Get-ScheduledTaskInfo -TaskName 'AI Builders YouTube Archives'
```

任务进程退出成功仅表示本轮执行结束；内容是否完成以队列、完整核验报告和数据库／文档回读为准。
