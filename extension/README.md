# Macrohard vs Code

**简体中文名：巨硬大战代码**

Macrohard vs Code is a compact arcade shooter that lives in an editor tab. Use **Ctrl+Alt+G** to enter the game and press the same shortcut again to pause and return to your previous editor.

## Controls

- `WASD` — Move
- `Space` — Fire
- `R` or `Shift` — Refactor ultimate
- `P` or `Escape` — Pause
- `Ctrl+Alt+G` — Toggle between the game and code

The game runs entirely inside the extension. It does not read or modify workspace files and does not require network access.

Macrohard vs Code is an independent project and is not affiliated with, endorsed by, or sponsored by Microsoft Corporation or xAI.

## Recovery and preferences

After each boss, choosing an upgrade saves a checkpoint at the beginning of the next wave. Reloading the Webview or restoring the open game tab after a VS Code restart loads this checkpoint **paused**. Select **Continue run** when ready. Mid-wave enemy and projectile positions are not saved. Closing a tab permanently is not a save-slot workflow; starting a new run or dying clears the saved checkpoint.

Hiding and revealing an existing panel still retains the current live run. Paused scenes stop their animation loop. Sensitivity and mute settings persist locally.

完成 Boss 战并选择升级后，扩展会保存下一波起点；重载 Webview 或重启后恢复游戏标签时，点击“继续本局”即可从检查点继续。中途敌人与弹幕位置不保存，新开一局或死亡会清除检查点。普通切换标签仍保留当前战局。灵敏度和静音设置会在本地保存。
