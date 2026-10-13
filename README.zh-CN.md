<div align="center">

<img src="./vscode.png" alt="VS Code" width="120" />

# 🎮 微软大战代码：游戏版

### 微软 &nbsp;⚔️ 大战 ⚔️&nbsp; 代码

*在你最爱的代码编辑器里开打的街机射击游戏*

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[English](./README.md) | **简体中文**

<br/>

<a href="http://vscode.emerard.me/">
  <img src="https://img.shields.io/badge/▶️_立即游玩-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white&labelColor=1f1f1f" height="72" alt="立即游玩" />
</a>

<br/><br/>

![游戏演示](./Gameplay.gif)

**[🕹️ 怎么玩](#怎么玩)** • **[🧩 扩展](#vs-code-扩展)** • **[💻 开发](#开发)**

*“VS 从来不是 Visual Studio，是‘大战’。”*

</div>

一款把名字当真的街机射击游戏：微软手握 TypeScript 编译器，和代码本身开战。整个游戏运行在复刻的 VS Code 工作台里，Bug、语法错误和遗留代码巨石 MONOLITH 挡在你和版本发布之间。

## 怎么玩

| 按键 | 操作 |
|---|---|
| `WASD` / 方向键 | 移动 |
| `空格` | 射击 |
| `R` / `Shift` | 重构大招（`R` 充能条满时） |
| `Esc` / `P` | 暂停 |

触屏设备会显示方向键、射击、重构和暂停按钮。

**一局**包含五波敌人和一个最终 Boss，熟练后约 5 分钟。第 1 波前选一个升级，第 1–4 波每波结束后再选一个；这四次清波还会额外给 +5 最大生命、+2 弹药和 +4% 伤害。清完第 5 波并击败 MONOLITH 即获胜。选升级时游戏暂停。

<details>
<summary><b>升级</b>（8 种）</summary>

| 升级 | 效果 |
|---|---|
| ⚡ 编译器升级 | 武器等级 +1（弹道更多，上限 5） |
| ❤️ 堆内存扩容 | 最大生命 +12，并回复 12 |
| 📦 缓冲区溢出 | 弹匣 +5，并回复 5 发 |
| ⚙️ 快速 GC | 每层换弹快 10%（上限 30%） |
| 🔥 超频 CPU | 每层射速快 8%（上限 24%） |
| ↟ 类型穿透 | 每级多穿透一个不同敌人（上限 2 级） |
| ↔ 反射 API | 侧墙反弹一次，并为基础武器增加斜射（上限 1 级） |
| ⚠ 缓冲区压力 | 弹药 ≤25% 时每级伤害 +25%（上限 2 级） |

</details>

<details>
<summary><b>敌人</b>（9 种）</summary>

| 敌人 | 符号 | 生命 | 分数 | 行为 |
|---|---|---|---|---|
| Bug | 🪲 | 10 | 100 | 缓慢追踪玩家 |
| 语法错误 | `};` | 20 | 200 | 皮厚，会瞄准射击 |
| 意大利面代码 | `goto` | 15 | 150 | 快速且飘忽 |
| 内存泄漏 | `malloc()` | 40 | 300 | 越长越大越硬，同时变慢 |
| 404 错误 | `404` | 15 | 250 | 反弹移动，周期性冲刺 |
| 合并冲突 | `<<<<` | 35 | 350 | 死亡时分裂 |
| 死循环 | `while(1)` | 25 | 400 | 螺旋移动，四向弹幕 |
| 竞态条件 | `async` | 20 | 500 | 瞬移后攻击 |
| **MONOLITH** | `LegacyWrapper` | 600 | 5000 | 三阶段 Boss：召唤小兵、追踪弹、散射 |

</details>

**道具：** ☕ 咖啡（加速）· 🤖 Copilot（8 秒内武器等级 +1）· 🐳 Docker（护盾）· 🩹 Hotfix（+30 生命）

**连击**随击杀累积（对 Boss 每造成 5% 生命伤害也 +1），提供有上限的分数、伤害、射速和大招充能加成。

**局外成长：** 累计清 5 波解锁散射起手，首次通关解锁穿透起手，每累计 5 波永久 +2 生命（上限 +10）。进度和最高分保存在本地。

## 工作台就是界面

每个 VS Code 面板都显示本局的真实信息：

- **资源管理器** —— 分数、波次和发布进度；可打开敌人目录和项目元数据
- **搜索** —— 敌人数据库
- **源代码管理** —— 把已清的波次显示成版本历史
- **运行和调试** —— 帧间隔、实体数、最高连击
- **扩展** —— 已安装的升级及其实时状态
- **设置** —— 移动灵敏度、音效、English / 中文
- **问题面板 / 状态栏** —— 警告数是本波剩余的 Bug；Boss 在场时就是那个阻塞发布的错误

## VS Code 扩展

`extension/` 会把游戏打包成 **巨硬大战代码**（Macrohard vs Code），一个不读取工作区、不联网的独立 Webview。按 `Ctrl+Alt+G`（macOS 为 `Cmd+Alt+G`）进入游戏，再按一次暂停并回到编辑器。每次选完升级都会保存检查点，重启 VS Code 后从那一波开头继续。

```bash
npm --prefix extension install
npm run package:extension   # → artifacts/macrohard-vs-code-0.1.0.vsix
```

## 开发

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify       # 类型检查、lint、单元测试、构建
npm run test:e2e     # Playwright（Windows 用 Edge；其他平台：npx playwright install chromium && CI=1 npm run test:e2e）
npm run deploy       # 先 verify，再把 dist/ 发布到 GitHub Pages
```

扩展相关检查：`npm run verify:extension` 和 `npm --prefix extension run test:integration`（设置 `VSCODE_EXECUTABLE_PATH` 可复用本机 VS Code）。

```
App.tsx          工作台外壳：布局状态与组装
components/      工作台各部件（活动栏、侧栏、标签页、面板、状态栏）与游戏浮层
game/            模拟层：固定 60 Hz 时钟、玩家、敌人、战斗、成长、渲染
utils/           多语言、品牌名、音效合成、设置、格式化
constants.ts     敌人、道具、升级数据
extension/       VS Code 扩展宿主与 Webview 入口
```

`game/` 下的玩法逻辑是纯函数并有单元测试，React 只负责工作台。工作台配色是 `tailwind.config.js` 里的 Tailwind 令牌（`vsc-*`、`syntax-*`）。运行时约定和设计决策见 [docs/optimization-notes.md](docs/optimization-notes.md) 与 [docs/gameplay-direction.md](docs/gameplay-direction.md)。

## 许可

[MIT](LICENSE)。与微软无关；谨以此献给现实中打过的每一个 Bug 🪲
