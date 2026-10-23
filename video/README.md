# AI + NocoBase · 品牌片 v2（一个业务系统的一年）

主线是一个供应商管理系统的一年：第一天起点高（Core），每一次迭代有章法（Studio），之后很多年走得远。141 秒，16:9，中文，无旁白，带配乐和音效。方案、逐镜头时间表、文案和配乐计划见 `DIRECTION.md`。

- **审片（HTML 版）**：通过任一本地服务打开 `preview.html`，比如在仓库根目录 `python3 -m http.server 8000` 后访问 `http://localhost:8000/video/preview.html`。它会跳到 `film.html?preview`，两者是同一个审片页。片子自己的脚本、样式和音轨每次加载都带新的 `?v=`，改动后普通刷新就能看到。空格播放/暂停，← → 前后 1 秒，[ ] 上一段/下一段，下方按钮按段落跳转，播放条上有「声音」开关。
- **声音**：仓库里带着审片用的音轨 `out/film/preview.m4a`（−14 LUFS），打开就有声音。改了画面时间或配乐后，`AUDIO_ONLY=1 ./make.sh` 重新生成。配乐在 `score.mjs`，音效在 `audio/sfx/`。
- **Mixkit 音效**：其中 5 个音效来自 Mixkit，授权不允许单独分发，所以不进仓库（`.gitignore`）。重新生成声音前先下载到 `audio/sfx/mixkit/`：`for i in 166 2299 2569 2857 2997; do curl -sLo audio/sfx/mixkit/mixkit-$i.wav https://assets.mixkit.co/active_storage/sfx/$i/$i.wav; done`。
- **出静帧**：`node render.mjs --still 48000,96000`（毫秒）→ `out/still-*.png`。
- **成片**：画面和声音在 HTML 里都确认后再 `./make.sh` 渲染，约 40 分钟 → `out/film/film.mp4`。
- **在 Linux 上**：Chrome 需要 `--no-sandbox` 时，用一个包装脚本作 `CHROME`（`exec chrome --no-sandbox "$@"`）；`make.sh` 需要 `ffmpeg` 在 PATH 里。开源 Chromium 不能播放 m4a（AAC），审片请用正式版 Chrome，或加 `?audio=out/film/mix.wav`。

## 文件

- `film.html`、`src/film.js`（时间线）、`src/film.css`（本片版式：时间轴、进度条、版本徽标、能力看板、Studio 控制台五页、第三幕）
- 引擎来自 skill `nocobase-video`：`src/kit.js`、`src/specimens.js`、`src/nocobase-film.css` 等
- 声音：`score.mjs`（配乐，基于 `score-kit.mjs`）、`mix.mjs`（音效与混音）、`audio/sfx/`（音效及授权说明 `CREDITS.md`）
- 生成：`make.sh`、`render.mjs`（空跑、静帧、成片）、`tools/`（它们用到的三个小工具）
- `out/` 下只有 `out/film/preview.m4a` 进仓库，其余都是生成文件
