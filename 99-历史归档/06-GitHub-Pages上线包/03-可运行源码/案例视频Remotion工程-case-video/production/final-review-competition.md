# 正式参赛视频与网页终审报告

- 审查日期：2026-09-07（Asia/Shanghai）
- 文件截点：四版正式 MP4 的修改时间为 2026-09-07 03:37:06–03:37:07；网页海报为 03:37:42
- 审查方式：只读取文件、解码媒体并在本地浏览器执行页面，不采信口头说明
- `video-shotcraft`：采用 final-review 模式；核查时长、字幕安全区、声音、镜头叙事、首尾画面和交付文件
- 终审结论：**PASS**
- 现实质量评级：**B+**。规定范围内可以提交；没有给出 A/A+，原因见“仍需人工确认的事项”。

## 一、阻断项

无。

本结论按当前验收口径作出：女声和男声是两套独立成片，烧录字幕分别跟随 Maia、Neil 的实际语音时长；同一声线的含 BGM／无 BGM 版本必须共用完全相同的视频流。若以后改回“四个文件的逐像素画面必须相同”，该要求会与“男女声烧录字幕分别同步”冲突，只能改用无烧录字幕母版加外挂字幕。

## 二、Reality Check 与证据范围

规定的通用检查命令已执行，但仓库是静态网页，不是 Laravel 项目：根目录没有 `resources/views/` 或根级 `*.html`；也没有 `qa-playwright-capture.sh`、`public/qa-screenshots/`、`test-results.json`。因此不能把不存在的标准 QA 产物当作证据。本次另行用本机 Playwright/Chromium 生成三档页面截图和交互结果，并用 FFmpeg 生成双声线联系表。

临时证据位置：

- `/tmp/competition-final-contact/female-contact-sheet.jpg`
- `/tmp/competition-final-contact/male-contact-sheet.jpg`
- `/tmp/competition-final-contact/female-subtitle-strips.jpg`
- `/tmp/competition-final-contact/male-subtitle-strips.jpg`
- `/tmp/competition-final-contact/male-transition-check.jpg`
- `/tmp/competition-final-contact/male-endpoint-check.jpg`
- `/tmp/competition-web-review.hyiq9m/terminal-desktop.png`
- `/tmp/competition-web-review.hyiq9m/terminal-tablet.png`
- `/tmp/competition-web-review.hyiq9m/terminal-mobile.png`
- `/tmp/competition-web-review.hyiq9m/terminal-switch-male.png`
- `/tmp/competition-web-review.hyiq9m/terminal-results.json`

这些图片位于 `/tmp`，不是长期交付物；末尾给出重建命令。正式工作区只新增本报告。

## 三、四版媒体文件

### 3.1 容器、编码、时长、音频与完整解码

四个文件均为 MP4，视频为 H.264 High、1920×1080、30 fps、`yuvj420p`、13,893 帧；音频为 AAC-LC、48 kHz、双声道。容器时长均为 463.100 秒，即 7 分 43.1 秒，符合 5–10 分钟要求。

| 文件 | 字节数 | SHA-256 | 全片解码 |
|---|---:|---|---|
| 女声／含 BGM | 313,696,443 | `37218a9fffe50d3aa1d773b34fed0bf35c89207e300ceb36d616679c6e522af0` | `exit=0`，`stderr=0` |
| 女声／无 BGM | 312,056,308 | `f7db9552eeba8fb5ec6a1bde043dbbd5bd867d4df000b2c91e48c11216ccada5` | `exit=0`，`stderr=0` |
| 男声／含 BGM | 314,428,446 | `e50ee9186180e233da647b8c9442137276c0f4f62cd7d997d30a8e506b3e1cbf` | `exit=0`，`stderr=0` |
| 男声／无 BGM | 313,037,055 | `40afb4692076e97284da8cf43b73c24940a57f462e3923b6d60a15bf29ea6705` | `exit=0`，`stderr=0` |

完整解码不是抽样。四个 FFmpeg 进程都解码了视频和音频，并逐帧生成 `framemd5` 清单。

### 3.2 视频流一致性

| 比较 | 视频包 MD5 | 解码帧清单 SHA-256 | 判定 |
|---|---|---|---|
| 女声含 BGM／女声无 BGM | 均为 `dac5861dbad3e9e9a421f85968b77f92` | 均为 `f096d055e44ccdea31ba88b6d1015d19f0d10550fc551a53d99ae51932a631a1` | 完全相同 |
| 男声含 BGM／男声无 BGM | 均为 `9bda205bee795234837f909ceed2cace` | 均为 `9a1c7bfddb2ca5e9aa3001b76b6de1ba5ccae864ec4b1127315fb213a62e065d` | 完全相同 |

男女声视频哈希不同，这是正确结果：两者镜头结构、总帧数和场景时间线相同，烧录字幕的切换点按各自声线单独计算。双声线 21 点联系表逐格显示相同的镜头、图表和场景；差别落在字幕进度。FilmGrain 的独立渲染也使跨声线像素哈希不应被解释为相同。

## 四、阿里云 TTS 与音轨来源

`competition-tts-manifest.json` 记录：

- 女声：Alibaba Cloud Model Studio，`qwen3-tts-instruct-flash-2026-01-26`，Maia，19 段，合计 421.93 秒；
- 男声：同一模型，Neil，19 段，合计 416.25 秒。

文件证据形成了连续链条：

1. `aliyun_competition_tts.py` 指向 `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`，模型和两组 voice 参数与 manifest 一致；相关源码和音频目录没有 `say`、`NSSpeechSynthesizer`、`AVSpeechSynthesizer` 等 Mac 系统语音调用。
2. 38 个实际 MP3 的文件 SHA-256 与 manifest 逐个比对，38/38 相同；文本 SHA-256 也是 38/38 相同；FFprobe 时长与 manifest 的最大差值为 0。
3. `competition-narration.json`、`competition-timeline.json`、男女 manifest 的 19 个 id 和正文逐项一致。
4. 从这 38 个 MP3、规定音效和 BGM 离线重建四条 AAC 后，得到的音频包 MD5 与正式 MP4 完全相同：女含 BGM `25fb2067b1570c90b44b1dcf1d1f7649`，女无 BGM `a67d175f83286fcc2b5b57c86d55acfd`，男含 BGM `80a91e8eb3055db6aae6b5523a220ed0`，男无 BGM `bbc504163c191e717840ec74b9094c6a`。
5. 辅助声学抽样的中位基频约为女声 235.3 Hz、男声 140.4 Hz，支持两条音轨是明显不同的女声／男声，而不是同一录音改名。

按现有文件证据，可排除“正式片误用了 Mac 系统音”或“男女文件只是改名”的情况。仓库没有阿里云任务 ID 或带签名的 API 回执；如果主办方要求第三方不可抵赖的云端凭证，还需另行导出平台调用记录。这不影响当前基于文件的技术判定。

### 4.1 无 BGM 版不是静音版

两条无 BGM 音轨都有旁白和必要音效。全片／开场 0–12 秒／首段旁白的音量实测如下：

| 版本 | 全片平均／峰值 | 0–12 秒平均／峰值 | 12.4–30 秒平均／峰值 |
|---|---|---|---|
| 女声无 BGM | -21.3／-4.0 dB | -24.5／-4.5 dB | -21.0／-4.0 dB |
| 男声无 BGM | -21.6／-1.5 dB | -24.5／-4.5 dB | -20.3／-1.5 dB |

0–12 秒尚未进入旁白，但仍测得开场环境音／音效；12.4 秒后出现对应旁白。`build_competition_audio.py` 也显示 BGM 只是可选混音层，旁白与 SFX 在两类版本中都会保留。

## 五、字幕可读性与男女声同步

烧录字幕使用 60 px 字号、左右各 96 px 安全边距、`whiteSpace: nowrap`，分段上限为 18 个正文字符；句末标点并入前段时最长 19 个 Unicode 字符。双声线联系表和字幕条带没有发现任何字幕被挤成两行、越界或裁切。

联系表中少数“镜头中点”恰好落在 5 帧字幕淡入淡出的最低透明度位置。对这些点追加检查前后各 15 帧，前一条和后一条字幕均为单行，说明这是预设的 0.167 秒转场，不是漏字幕或排版故障。

### 5.1 逐段同步

字幕和对应音频使用相同的 `shot.from + narrationFromFrames` 起点；女声用 `narrationDurationFemaleFrames`，男声用 `narrationDurationMaleFrames`。帧数由实际 MP3 时长取整到 30 fps。女声取整误差最大 0.030 秒，男声最大 0.023 秒，均不超过 1 帧。

下表的“若误用女声时序”用于说明为什么男女声必须使用两套烧录母版；正数表示女声字幕会比男声语音晚结束，负数表示会提前结束。终态没有这些偏差。

| 分段 | 若男声误用女声时序的结束偏差 | 终态男声字幕对 Neil 结束误差 |
|---|---:|---:|
| scale | -2.567 s | +0.010 s |
| small_problems | -0.233 s | +0.017 s |
| three_boundaries | +0.567 s | +0.017 s |
| fourteen_units | +3.200 s | +0.023 s |
| coordination_office | -3.433 s | +0.003 s |
| campaign | -1.667 s | +0.017 s |
| outsourcing | +2.667 s | +0.003 s |
| platform_birth | +0.500 s | +0.003 s |
| single_interface | -0.467 s | +0.017 s |
| city_brain | -1.367 s | +0.023 s |
| multi_source | -0.567 s | +0.010 s |
| standards | -0.633 s | +0.023 s |
| dispatch | -0.133 s | +0.003 s |
| human_verification | +1.300 s | +0.003 s |
| parking_boundary | +6.633 s | +0.023 s |
| institutional_interfaces | +0.067 s | +0.017 s |
| transaction_costs | +4.000 s | +0.017 s |
| two_adjustments | -2.533 s | +0.003 s |
| conclusion | +0.467 s | +0.017 s |

`male-endpoint-check.jpg` 另查了 `scale`、`coordination_office`、`parking_boundary`、`transaction_costs` 的 Neil 结束点前后：结束前仍有最后一条字幕，结束后字幕消失。旧共用女声时序会产生的 2.567–6.633 秒偏差已经消除。

### 5.2 VTT 文件

男女 VTT 均可被 FFprobe 识别为 `webvtt|subtitle`，与 manifest 全文逐字拼接相同。每份 162 条 cue，0 个重叠、0 个多行 cue、0 个孤立标点 cue，最短持续时间分别为 0.430 秒和 0.432 秒，最长一条为 19 个 Unicode 字符。SHA-256：

- 女声 VTT：`92a7687a13c58e2c572543fb2133a53f7e3eadac88f53ea13e1f8f858d66e00e`
- 男声 VTT：`bebcbf03634de5856f5374877728559aa99d18f37e3d72672cf14bd75c25968c`

网页不把 VTT 作为 `<track>` 叠到已有烧录字幕上，因此不会出现双层字幕；两份 VTT 作为可见的“字幕文件”下载项提供，适合无障碍转制和后期使用。

## 六、双声线联系表

抽查点采用开头、19 个镜头各自中点和结尾，共 21 点；女声和男声各抽 21 帧。下表同时是联系表的顺序索引。

| 序号 | 时间／帧 | 镜头 | 文件画面证据 | 字幕 |
|---:|---|---|---|---|
| 1 | 00:10.000／300 | 开头 | 南京南站俯瞰、完整题名、副标题、新团队 Logo、“南雍治道” | 题名字无裁切 |
| 2 | 00:21.300／639 | scale | 站区实景、`>30万`、`可达8万`、多交通方式 | 单行 |
| 3 | 00:39.567／1187 | small_problems | 积水、垃圾桶、车辆、求助四类现场问题 | 单行 |
| 4 | 01:00.833／1825 | three_boundaries | 行政区划、部门、资产权三层结构 | 单行 |
| 5 | 01:27.967／2639 | fourteen_units | 十四单位责任网络和原引语 | 单行；转场点另查 ±15 帧 |
| 6 | 01:56.233／3487 | coordination_office | 综管办连接两区与垂直部门，标出缺权 | 单行 |
| 7 | 02:21.633／4249 | campaign | “一夜变样”与绿都大道问题外移 | 单行 |
| 8 | 02:45.367／4961 | outsourcing | 3–4 家、7–8 家服务商和增加的接口 | 单行 |
| 9 | 03:08.800／5664 | platform_birth | 铁投集团、万物云、交控万物关系 | 单行 |
| 10 | 03:33.433／6403 | single_interface | 多甲方对相对统一执行界面 | 单行 |
| 11 | 03:55.900／7077 | city_brain | 城市小脑真实界面图和识别框 | 单行；转场点另查 ±15 帧 |
| 12 | 04:16.067／7682 | multi_source | 物联、人员、市民、AI 四路信息 | 单行 |
| 13 | 04:38.033／8341 | standards | `500+` 流程／标准进入工单 | 单行 |
| 14 | 05:00.300／9009 | dispatch | 云城队长、专业队伍、无人设备派单 | 单行 |
| 15 | 05:24.800／9744 | human_verification | 处置—到场—判断—复核；2 处驿站、6 处服务点、4 万人次 | 单行 |
| 16 | 05:54.833／10645 | parking_boundary | P1–P8、停车场红线内外两套行动权 | 单行；转场点另查 ±15 帧 |
| 17 | 06:22.033／11461 | institutional_interfaces | 雨花台／江宁会议、执法权／数据权／产权／属地责任 | 单行 |
| 18 | 06:47.033／12211 | transaction_costs | 谈判、协调、监督成本与三次尝试边界 | 单行 |
| 19 | 07:14.033／13021 | two_adjustments | 平台化改结构、智能化扩能力 | 单行 |
| 20 | 07:34.867／13646 | conclusion | “行政边界不变，功能得以整合” | 单行 |
| 21 | 07:42.067／13862 | 结尾 | 结论、团队 Logo、“南雍治道”停留 | 单行，无裁切 |

联系表显示内容沿“现场—分割困境—三次旧尝试—平台化—智能化—停车／制度边界—案例回答”推进。它不是配音覆盖在静态 PPT 上：片中有南京南站航拍与站区实景、现场人物和停车画面、镜头推拉／转场、动态责任网络、平台界面和工单动画。比赛所要求的治理现场、决策困境、治理成效与制度边界均有镜头表达。

## 七、题名、团队名与事实

### 7.1 题名、团队与 Logo

- 正式题名为“从平台化到智能化：政企共创平台企业何以化解行政分割难题？”，副标题为“——以南京南站跨区域公共交通枢纽为例”。视频开头、网页 H1、脚本和 `design-spec.md` 一致。
- 团队名“南雍治道”与 `tmp/submission-package/artifact.md` 的正式填表约定一致，视频首尾和网页均显示正确。
- 视频 `TeamMark` 与网站 `assets/nanyong-mark.svg` 使用同一个 `viewBox="0 0 256 256"` 和六条 path／一个圆点的几何路径。首尾 1920×1080 抽帧显示新 Logo 清晰、未裁切。

### 7.2 关键事实回查

脚本、两套旁白与 `case-video/production/submission-source.md` 逐项比对。代表性核对如下：

| 成片事实 | 底稿位置 | 结果 |
|---|---|---|
| 铁路日发送量超过 30 万人次、车流量可达 8 万辆次 | 373 | 一致 |
| 2012 年公开检查中“14 个单位和部门管”原引语 | 509 | 一致 |
| 2013 年起施行管理办法并设综管办 | 439、503 | 一致 |
| 2024 年铁投集团与万物云共同出资设立交控万物 | 612 | 一致 |
| 整体承接 29 类公共服务、多甲方对一乙方 | 1381 | 一致 |
| 截至调研输入 500 余项业务流程和作业标准 | 766 | 一致，成片保留“截至调研”限定 |
| 2 处云城驿站、6 处服务点、单日最高服务 4 万人次 | 821 | 一致 |
| P1–P8 共 8 个地下停车场，内外权限不同 | 881、950 | 一致 |
| 铁路实时客流、政府平台与企业平台尚未打通 | 970、972 | 一致 |
| 政府保留执法、数据授权和责任认定 | 1484 | 一致 |

没有发现新增识别准确率、虚构股比、把企业合同写成行政授权，或把模拟数据写成真实运行数据。

## 八、网页接入

终态 `film.html`、`showcase.css`、`showcase.js` 通过本地 HTTP 服务和 Playwright/Chromium 检查：

| 项目 | 证据 | 判定 |
|---|---|---|
| 女／男声切换 | 女→男→女→男三次切换，`aria-pressed=true` 跟随当前按钮；视频 URL、ARIA 标签、当前下载地址和文件名同步变化 | 通过 |
| 播放位置 | 三次切换均保持 `currentTime=21.3` 秒 | 通过 |
| 字幕重复 | 每次均 `domTracks=0`、`textTracks=0`；页面没有加载外挂字幕，不会与烧录字幕叠加 | 通过 |
| VTT 交付 | 页面有女声版／男声版两个可见字幕下载链接；HTTP 200、`text/vtt`、11,548 字节 | 通过 |
| 四个视频下载 | 六个相关资源请求均 HTTP 200；四个网站 MP4 与 `case-video/out/` 对应文件逐字节相同 | 通过 |
| 桌面布局 | 1920×1080，`scrollWidth=1920`，无横向溢出 | 通过 |
| 平板布局 | 768×1024，`scrollWidth=768`，无横向溢出 | 通过 |
| 手机布局 | 375×667，`scrollWidth=375`，无横向溢出；播放器、元数据、声线按钮、主下载、辅助下载和字幕下载依次排列 | 通过 |
| 手机触控 | 无 BGM、导览和字幕链接的实测高度均为 44 px；主下载按钮为 120×54 px | 通过 |
| 运行错误 | 三档均 `consoleErrors=[]`、`pageErrors=[]` | 通过 |

网页不提供可开关的浏览器原生字幕轨，提供的是成片烧录字幕和单独 VTT 下载。这符合当前设计口径，也避开了 Chromium 在反复更换 `<track src>` 时累加旧 cue 的问题。若将来明确要求播放器内可开关字幕，应制作无烧录字幕的网页播放版，再加载一个随声线替换的 VTT；不要把 `<track>` 直接叠回当前四版。

## 九、仍需人工确认的事项

以下两项没有影响本次规定范围内的 PASS，但不应被技术报告掩盖：

1. `competition-film-script.md` 第 24、219 行要求对 DOCX 内嵌图和网络来源图逐项确认传播授权。本工作区没有完整授权书或素材许可台账。参赛提交人应在上传前完成权利确认。
2. 浏览器自动化只覆盖本机 Chromium，没有 Safari、Firefox 和真实手机实机记录。页面使用的是原生 `<video>`、按钮和下载链接，兼容风险不高，但若比赛现场指定 Safari，仍应做一次实机播放与下载检查。

## 十、可复核命令

以下命令从项目根目录执行。

### 10.1 容器、编码与完整解码

```bash
for f in case-video/out/南京南站正式参赛案例片_阿里云{女声,男声}_{含BGM,无BGM}.mp4; do
  ffprobe -v error -show_entries \
    format=duration,size:stream=codec_name,profile,codec_type,width,height,pix_fmt,r_frame_rate,nb_frames,sample_rate,channels \
    -of json "$f"
  ffmpeg -v error -xerror -i "$f" -map 0 -f null -
done
```

### 10.2 视频流和音频流哈希

```bash
for f in case-video/out/南京南站正式参赛案例片_阿里云{女声,男声}_{含BGM,无BGM}.mp4; do
  shasum -a 256 "$f"
  ffmpeg -v error -i "$f" -map 0:v:0 -c copy -f md5 -
  ffmpeg -v error -i "$f" -map 0:a:0 -c copy -f md5 -
done
```

若要重做逐帧哈希：

```bash
ffmpeg -v error -xerror -i "case-video/out/南京南站正式参赛案例片_阿里云女声_含BGM.mp4" \
  -map 0:v:0 -f framemd5 pipe:1 -map 0:a:0 -f null /dev/null | shasum -a 256
```

### 10.3 无 BGM 音量

```bash
for voice in 女声 男声; do
  f="case-video/out/南京南站正式参赛案例片_阿里云${voice}_无BGM.mp4"
  ffmpeg -hide_banner -nostats -i "$f" -vn -af volumedetect -f null - 2>&1 | rg 'mean_volume|max_volume'
  ffmpeg -hide_banner -nostats -t 12 -i "$f" -vn -af volumedetect -f null - 2>&1 | rg 'mean_volume|max_volume'
done
```

### 10.4 VTT 健康检查

```bash
for f in case-video/out/competition-audio/{female,male}.zh-CN.vtt; do
  ffprobe -v error -select_streams s:0 -show_entries stream=codec_name,codec_type -of compact=p=0:nk=1 "$f"
  rg -n '^([，。；：？！、…]+)$' "$f" && echo "FAIL: isolated punctuation" || true
done
```

### 10.5 联系表

```bash
frames='eq(n\,300)+eq(n\,639)+eq(n\,1187)+eq(n\,1825)+eq(n\,2639)+eq(n\,3487)+eq(n\,4249)+eq(n\,4961)+eq(n\,5664)+eq(n\,6403)+eq(n\,7077)+eq(n\,7682)+eq(n\,8341)+eq(n\,9009)+eq(n\,9744)+eq(n\,10645)+eq(n\,11461)+eq(n\,12211)+eq(n\,13021)+eq(n\,13646)+eq(n\,13862)'
mkdir -p /tmp/competition-final-contact
ffmpeg -y -v error -i "case-video/out/南京南站正式参赛案例片_阿里云女声_无BGM.mp4" \
  -vf "select='$frames',scale=640:360,tile=3x7:padding=6:margin=6" -frames:v 1 \
  /tmp/competition-final-contact/female-contact-sheet.jpg
ffmpeg -y -v error -i "case-video/out/南京南站正式参赛案例片_阿里云男声_无BGM.mp4" \
  -vf "select='$frames',scale=640:360,tile=3x7:padding=6:margin=6" -frames:v 1 \
  /tmp/competition-final-contact/male-contact-sheet.jpg
```

### 10.6 网页资源一致性

```bash
base='清华大学公共管理案例大赛·2026/智能体工程启动包/nanjing-south-hubcoord/static/assets/films'
cmp "case-video/out/南京南站正式参赛案例片_阿里云女声_含BGM.mp4" "$base/nanjing-south-competition-female.mp4"
cmp "case-video/out/南京南站正式参赛案例片_阿里云女声_无BGM.mp4" "$base/nanjing-south-competition-female-nobgm.mp4"
cmp "case-video/out/南京南站正式参赛案例片_阿里云男声_含BGM.mp4" "$base/nanjing-south-competition-male.mp4"
cmp "case-video/out/南京南站正式参赛案例片_阿里云男声_无BGM.mp4" "$base/nanjing-south-competition-male-nobgm.mp4"
```

---

终审人：TestingRealityChecker / RealityIntegration  
结论适用文件：本报告第 3.1 节列出的四个完整 SHA-256 所对应版本。
