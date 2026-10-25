# AI + NocoBase · 品牌片 v3.1（按《NocoBase 产品定义与标准表述》重做）

主线和标准文稿一致：AI 写代码很快 → 但构建可靠的业务系统依然不简单（四个问题，演在一个供应商管理系统上）→ NocoBase → Core 解决前两个 → Studio 解决后两个 → 系统长期稳定迭代。118 秒（要求 120 秒以内），16:9，中文，无旁白。v3.1 换上了 Studio 的新品牌表达「Agent 自主推进，团队掌控全局。」，并把 v3 的 146 秒压到 118 秒（镜头不减，缩短停留），对照表在 `DIRECTION.md` 第 2 节。方案、逐镜头时间表和文案见 `DIRECTION.md`。上一版（v2，一个业务系统的一年）在 git 历史里（提交 6b00819）。配乐和音效都已在审片音轨里。

- **审片（HTML 版）**：双击打开 `preview.html` 就能看、能听。也可以在本目录运行 `./preview.sh`（加秒数从那一秒开始，如 `./preview.sh 48`），它起一个本地服务、用 Chrome 打开，看完按 Ctrl+C 关闭。`preview.html` 就是审片页本身，不跳转；它和渲染用的 `film.html` 通过 `src/load.js` 加载同一组文件。空格播放/暂停，← → 前后 1 秒，[ ] 上一段/下一段，下方按钮按段落跳转。
- **审片的声音**：`AUDIO_ONLY=1 ./make.sh` 生成音轨 `out/film/preview.m4a`（−14 LUFS），同时写一份脚本版 `out/film/preview-audio.js`，审片页把它整段解码到内存里播放（Web Audio），双击打开（file://）也能播；跳转、往回拖、倍速时声画都同步。浏览器要求先点一下页面才出声，点「播放」就算。播放条上的声音按钮写明状态（声音：开/关、音轨加载中…、这一版还没有音轨）。
- **声音的来源**：配乐在 `score.mjs`，音效在 `audio/sfx/`。改了画面时间或配乐后，重新运行 `AUDIO_ONLY=1 ./make.sh`。还没下载 Mixkit 音效时，可以用 `SFX_PARTIAL=1 AUDIO_ONLY=1 ./make.sh` 先出一版不带 whoosh、撞击、点击的审片音轨。
- **Mixkit 音效**：其中 5 个音效来自 Mixkit，授权不允许单独分发，所以不进仓库（`.gitignore`）。重新生成声音前先下载到 `audio/sfx/mixkit/`：`for i in 166 2299 2569 2857 2997; do curl -sLo audio/sfx/mixkit/mixkit-$i.wav https://assets.mixkit.co/active_storage/sfx/$i/$i.wav; done`。
- **英文版**：`preview-en.html`（或 `./preview.sh en`、`./preview.sh en 48`）。英文画面由 `tools/make-en.py` 从 `src/film.js` 生成 `src/film-en.js`，改英文文案只改这个脚本，改完运行 `python3 tools/make-en.py`；中文版改了画面也要重新运行它（脚本会列出没换上的句子）。英文专用的换行和尺寸在 `src/film-en.css`。时间表和中文版逐条相同，共用同一条音轨。出英文静帧加 `--page film-en.html`；排版检查：`node tools/probe.mjs --page film-en.html --base film.html --at 30500,54000`。
- **其他语言版本**（和官网首页的语言一致）：德语 de、西班牙语 es、法语 fr、葡萄牙语（巴西）pt、俄语 ru、印尼语 id、越南语 vi、繁体中文 zh-TW、日语 ja、韩语 ko。审片 `preview-<语言>.html`（或 `./preview.sh ja`、`./preview.sh ja 48`）。按官网的译文规则：产品界面示意（终端、会话卡片、NocoBase 应用、Studio 控制台）在繁体中文版里是繁体中文界面（`tools/make-zh-TW.py` 从中文版转换，台湾用语，人名转繁体，金额用 NT$），在其他语言里沿用英文版的界面，人名、币种也和英文界面一致；只翻译片子对观众说的话（标题、页头、图注、结构图上的字、问题卡片、Agent 状态标签、落版），官网已有的句子用官网的译文。`tools/make-lang.py` 从 `src/film-en.js` 生成其余九种语言的 `src/film-<语言>.js`，文案在 `tools/lang/<语言>.json`（`en.json` 是英文原文，脚本先用它自检，生成结果必须和英文版一字不差）；改了中文或英文版，先运行 `python3 tools/make-en.py`，再运行 `python3 tools/make-lang.py` 和 `python3 tools/make-zh-TW.py`（需要 macOS 的 swift）。版式在 `src/film-<语言>.css`（英文界面的版本叠在 `film-en.css` 之后）。事件表和中文版逐条相同，共用同一条音轨。
- **出静帧**：`node render.mjs --still 48000,96000`（毫秒）→ `out/still-*.png`。
- **成片**：画面和声音在 HTML 里都确认后再 `./make.sh` 渲染，约 40 分钟 → `out/film/film.mp4`。
- **在 Linux 上**：Chrome 需要 `--no-sandbox` 时，用一个包装脚本作 `CHROME`（`exec chrome --no-sandbox "$@"`）；`make.sh` 需要 `ffmpeg` 在 PATH 里。开源 Chromium 不能播放 m4a（AAC），审片请用正式版 Chrome，或加 `?audio=out/film/mix.wav`。

## 文件

- `film.html`、`src/film.js`（时间线）；英文版 `film-en.html`、`preview-en.html`、`src/film-en.js`（生成文件）、`src/film-en.css`、`tools/make-en.py`、`src/film.css`（本片版式：时间轴、进度条、版本徽标、能力看板、Studio 控制台五页、第三幕）
- 引擎来自 skill `nocobase-video`：`src/kit.js`、`src/specimens.js`、`src/nocobase-film.css` 等
- 声音：`score.mjs`（配乐，基于 `score-kit.mjs`）、`mix.mjs`（音效与混音）、`audio/sfx/`（音效及授权说明 `CREDITS.md`）
- 生成：`make.sh`、`render.mjs`（空跑、静帧、成片）、`tools/`（它们用到的小工具，和排版探针 `probe.mjs`）
- `out/` 下只有 `out/film/preview.m4a` 进仓库，其余都是生成文件
