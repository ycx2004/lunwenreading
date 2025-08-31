# 论文阅读笔记网站

一个本地部署、界面简洁美观、目录清晰、有点击反馈的论文阅读笔记网站。自动从 `paper-notes/notes` 目录加载 Markdown（.md）笔记并以精致样式呈现。

## 一、本地运行

1. 将本项目保持当前目录结构：
   - index.html
   - styles.css
   - script.js
   - paper-notes/notes/*.md
2. 用浏览器直接双击打开 `index.html` 即可浏览（建议使用 Chrome/Edge）。
3. 如果浏览器因本地安全策略限制无法加载本地 Markdown（较少见），可以使用一个本地静态服务器：
   - Windows PowerShell 执行：
     ```powershell
     # 方法1：Python3
     python -m http.server 8080
     # 然后访问 http://localhost:8080/

     # 方法2：Node（若已安装）
     npx serve -p 8080
     ```

## 二、如何添加新论文并展示出来

方式A（推荐，可视化操作）：
1. 点击左侧“管理”中的“添加新论文”。
2. 在弹窗中输入：
   - 文件名（不带 .md 后缀，例如 `ego-note-2025`），和
   - 论文标题（可选）。
3. 在本地文件夹 `paper-notes/notes/` 中创建相同文件名的 `.md` 文件，并在文件第一行使用 `# 标题` 写入标题。
4. 回到网站，点击“刷新列表”，即可看到新论文；点击即可阅读。

方式B（手动维护清单）：
1. 在 `paper-notes/notes/` 创建你的新 `.md` 文件。
2. 打开网站后，按 F12 打开开发者工具，执行：
   ```js
   const extra = JSON.parse(localStorage.getItem('extraNotes')||'[]');
   extra.push('your-file.md');
   localStorage.setItem('extraNotes', JSON.stringify([...new Set(extra)]));
   ```
3. 点击“刷新列表”即可显示。

> 说明：由于本地静态网页无法直接读取文件夹目录，脚本内置了一个初始清单（当前已包含 `egoplannerandmore.md` 与 `faster-note.md`），并支持通过“添加新论文”把文件名保存到浏览器的 localStorage 中以便展示。你仍需在 `paper-notes/notes/` 目录中创建相应的 `.md` 文件。

## 三、目录层次与交互说明
- 侧边栏按类别（根据文件名与标题关键词）进行分组展示。
- 搜索框可即时过滤列表。
- 点击论文条目有高亮与悬浮反馈，右侧内容区显示 Markdown 渲染后的正文，同时更新面包屑、统计与元信息（分类、字数等）。
- 顶部有主题切换、全屏、移动端菜单按钮，右下角提供“回到顶部”按钮。

## 四、图标含义
- 侧边栏 Logo：打开的书（代表知识与阅读）。
- 文件图标：Markdown 文档。
- 文件夹图标：分类分组。
- 加号：添加新论文。
- 刷新：重建列表和统计。
- 月亮/太阳：深浅色主题切换。
- 展开：全屏阅读。
- 警告三角：加载失败提示。

## 五、风格与自定义
- 使用 `styles.css` 控制配色与布局，已适配暗色主题并包含响应式样式。
- 如需自定义分类规则，可修改 `script.js` 中的 `categorize()` 函数。
- 如需调整统计或元信息规则，可修改 `parseFrontMatter()`。