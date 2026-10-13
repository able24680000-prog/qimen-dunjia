# 奇门遁甲桌面快捷启动器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 Windows 用户桌面创建“奇门遁甲”快捷方式，双击后后台启动本地网站并打开首页。

**Architecture:** 在项目内保存一个独立 PowerShell 启动脚本，由桌面 `.lnk` 调用。脚本先探测固定地址，未启动时调用现有 Vite 开发命令，等待服务可用后再交给默认浏览器打开。

**Tech Stack:** Windows PowerShell 5.1、WScript.Shell、Node.js/npm、Vite 8

## Global Constraints

- 固定访问地址为 `http://127.0.0.1:5174/`。
- 快捷方式名称为“奇门遁甲”。
- 启动过程不保留可见命令行窗口。
- 不修改排盘算法、知识库、页面结构和浏览器本地数据。
- 不新增 npm 依赖。

---

### Task 1: 创建后台启动脚本

**Files:**
- Create: `qimen-website/scripts/start-desktop.ps1`

**Interfaces:**
- Consumes: 系统 `npm.cmd`、`qimen-website/package.json` 中的 `dev` 脚本
- Produces: 可由 PowerShell 直接执行的本地网站启动入口

- [ ] **Step 1: 写入启动脚本**

脚本应接受 `-NoOpen` 测试开关，检查 `http://127.0.0.1:5174/`，必要时执行：

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

启动输出分别写入 `%TEMP%\qimen-desktop-launcher.out.log` 和 `%TEMP%\qimen-desktop-launcher.err.log`。等待 20 秒仍不可访问时，用中文消息框提示启动失败。

- [ ] **Step 2: 验证 PowerShell 语法**

Run:

```powershell
$errors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'qimen-website/scripts/start-desktop.ps1'),
  [ref]$null,
  [ref]$errors
) | Out-Null
if ($errors.Count) { $errors | Format-List; exit 1 }
```

Expected: exit code `0`，没有语法错误输出。

- [ ] **Step 3: 验证重复启动保护**

先确保网站服务在 `5174` 端口运行，再执行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File qimen-website/scripts/start-desktop.ps1 -NoOpen
```

Expected: exit code `0`，不创建第二个 Vite 进程。

### Task 2: 创建桌面快捷方式

**Files:**
- Create: `%USERPROFILE%\Desktop\奇门遁甲.lnk`

**Interfaces:**
- Consumes: `qimen-website/scripts/start-desktop.ps1`
- Produces: 用户可双击的桌面入口

- [ ] **Step 1: 用 WScript.Shell 创建快捷方式**

快捷方式属性：

```text
TargetPath: C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
Arguments: -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<absolute path>\qimen-website\scripts\start-desktop.ps1"
WorkingDirectory: <absolute path>\qimen-website
Description: 启动奇门遁甲本地网站
WindowStyle: 7
```

图标使用 `C:\Windows\System32\imageres.dll,3`，避免 Windows 不支持 SVG 快捷方式图标。

- [ ] **Step 2: 验证快捷方式字段**

使用 `WScript.Shell.CreateShortcut()` 重新读取 `.lnk`，断言 `TargetPath`、`Arguments`、`WorkingDirectory` 和 `Description` 与设计一致。

- [ ] **Step 3: 验证实际启动**

通过 `Start-Process` 执行桌面快捷方式，等待网站响应，再确认：

```powershell
(Invoke-WebRequest 'http://127.0.0.1:5174/' -UseBasicParsing -TimeoutSec 5).StatusCode
```

Expected: `200`。

### Task 3: 回归检查与交付

**Files:**
- Verify: `qimen-website/scripts/start-desktop.ps1`
- Verify: `%USERPROFILE%\Desktop\奇门遁甲.lnk`

**Interfaces:**
- Consumes: Task 1 和 Task 2 的产物
- Produces: 可重复使用的桌面启动体验

- [ ] **Step 1: 运行网站回归检查**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run verify:qimen
npm.cmd run verify:knowledge
```

Expected: 四项全部通过。

- [ ] **Step 2: 检查工作区与桌面产物**

Run:

```powershell
Test-Path 'qimen-website/scripts/start-desktop.ps1'
Test-Path ([IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), '奇门遁甲.lnk'))
```

Expected: 两项均为 `True`。

- [ ] **Step 3: 记录交付结果**

向用户说明桌面快捷方式已创建、双击行为、固定网址以及启动失败时日志所在位置。

