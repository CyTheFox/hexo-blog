---
title: README 面子工程
copyright_author: HIOPLE
date: 2026-11-06 23:00:00
cover: /img/githubxmd.png
tags:
  - 技术
categories:
  - tech
---

## 首屏

首屏结构：

1. 项目图标或 Logo
2. 项目名称
3. 一句话介绍
4. 徽标行
5. 快速开始或在线地址

```html
<div align="center">

<img src=".github/assets/logo.png" alt="项目 Logo" width="96">

# my-project

一个用于处理配置文件的轻量工具。

[![构建](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/user/repo/actions/workflows/ci.yml) [![版本](https://img.shields.io/npm/v/my-project)](https://www.npmjs.com/package/my-project) [![许可证](https://img.shields.io/github/license/user/repo)](./LICENSE)

</div>
```

`<div align="center">` 适合控制首屏居中；图片建议添加 `alt`，并限制宽度，避免大图把标题和徽标推到首屏之外。徽标可以写在同一行，GitHub 会按可用宽度自动换行。

## 徽标是什么

徽标（badge）是一个小型状态标签，通常包含名称、数值和颜色。它适合展示可验证的信息，例如：

- 构建和测试是否通过
- 当前发布版本
- 使用的运行时或框架
- 许可证
- 覆盖率、下载量或文档入口

徽标通常由两部分组成：左侧是图片地址，右侧是跳转链接。

```markdown
[![显示文本](徽标图片地址)](点击后的链接)
```

例如，GitHub Actions 的构建徽标：

```markdown
[![构建与部署](https://github.com/CyTheFox/hexo-blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/CyTheFox/hexo-blog/actions/workflows/deploy.yml)
```

图片地址显示 workflow 当前状态，需要指向项目真实的 workflow 文件位置。

## Shields.io 徽标

[Shields.io](https://shields.io/) 提供大量现成徽标，也支持自定义文字和颜色。常见格式是：

```text
https://img.shields.io/badge/左侧文字-右侧文字-颜色
```

示例：

```markdown
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Hexo](https://img.shields.io/badge/Hexo-8.1.2-0E83CD?logo=hexo&logoColor=white)](https://hexo.io/)
```

常用参数：

| 参数 | 作用 | 示例 |
| --- | --- | --- |
| `logo` | 添加品牌图标 | `logo=node.js` |
| `logoColor` | 设置图标颜色 | `logoColor=white` |
| `style` | 设置外观 | `style=flat-square` |
| `color` | 设置颜色 | `color=brightgreen` |
| `label` | 自定义左侧文本 | `label=运行环境` |

参数使用 `?` 开始，多个参数用 `&` 连接。文字中包含空格或特殊字符时，优先使用 Shields.io 的查询参数或 URL 编码，避免链接失效。

注意，由于`左侧文字-右侧文字-颜色`为徽标格式，故文本中的`-`需要转义，写作`--`。

### 常用徽标来源

- **GitHub Actions**：`/actions/workflows/<workflow>.yml/badge.svg`
- **GitHub Release**：`https://img.shields.io/github/v/release/user/repo`
- **npm 版本**：`https://img.shields.io/npm/v/package-name`
- **许可证**：`https://img.shields.io/github/license/user/repo`
- **下载量**：`https://img.shields.io/npm/dm/package-name`
- **代码覆盖率**：使用项目实际接入的覆盖率服务徽标

版本号、Node.js 版本和主题名称应与项目配置保持一致，对于版本号，可以编写 workflow 在推送 release 时自动修改 README。

## 一行徽标布局

徽标想放在一行，直接连续书写即可：

```markdown
[![CI](...)](...) [![版本](...)](...) [![License](...)](...)
```

如果希望徽标之间更紧凑，可以使用 HTML，但不建议用 `<p>` 包裹 Markdown 徽标。部分渲染器会把 Markdown 当作普通文本，导致徽标不显示。需要严格控制间距时，可使用 HTML 图片链接：

```html
<a href="https://github.com/user/repo/actions"><img src="https://github.com/user/repo/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
<a href="https://github.com/user/repo"><img src="https://img.shields.io/github/stars/user/repo" alt="Stars"></a>
```

一般 README 优先使用 Markdown 写法，兼容性和可读性更好。

## 图片和 Logo 的装饰

### 使用仓库内图片

仓库内图片比临时图床更稳定，也方便版本管理：

```markdown
![项目预览](./.github/assets/preview.png)
```

在 GitHub README 中，`./` 表示当前 README 所在目录。若图片位于 `source/img`，需要根据 README 的实际位置填写相对路径。

建议：

- 文件名使用英文、数字和短横线
- 图片控制在合理尺寸，避免加载过慢
- 所有图片添加有意义的 `alt` 代替显示文本
- Logo 使用固定宽度，例如 `width="64"` 或 `width="96"`

### 图片居中和并排

```html
<p align="center">
  <img src="./docs/demo-light.png" alt="浅色主题预览" width="48%">
  <img src="./docs/demo-dark.png" alt="深色主题预览" width="48%">
</p>
```

并排图片适合展示浅色/深色主题、移动端/桌面端或改造前/改造后效果。移动端屏幕较窄时，两张图可能自动换行，因此不要依赖精确的固定宽度。

### 技术栈用徽标或短列表

技术栈不必写成长篇介绍，可以用徽标和短列表组合：

```markdown
## 技术栈

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

- 构建：Vite
- 运行环境：Node.js
- 内容格式：Markdown
```

徽标负责快速识别，文字负责补充项目中的实际用途。不要把没有使用的框架全部列上去，也不要用徽标代替安装和配置说明。

## 常用装饰元素

### 分隔线

用水平线区分首屏和正文，简单且稳定：

```markdown
---
```

不要连续使用多条分隔线，也不要让每个小段落都被线条切开，否则页面会显得零碎。

### 折叠详情

长日志、完整配置和高级选项可以折叠，保持首屏简洁：

```html
<details>
<summary>查看完整配置</summary>

```yaml
server:
  port: 3000
  host: 0.0.0.0
```

</details>
```

折叠内容适合低频信息，不要把快速开始、安装命令或核心限制藏起来。

### 引用提示

简单提醒可以使用引用块：

```markdown
> 提示：首次运行前请先执行 `npm install`。
```

GitHub 的提示块也很适合 README，但它属于 GitHub 的渲染能力，不是所有 Markdown 平台都支持。若文档需要在多个平台发布，普通引用块更稳妥。

```markdown
> [!WARNING]
> 部署命令会覆盖服务器上的静态文件，请确认目标目录。
```

### 目录

较长的 README 可以加入目录。最简单的做法是手写链接：

```markdown
## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [部署](#部署)
- [许可证](#许可证)
```

## 代码块的装饰与使用

代码块应标注语言，让 GitHub 自动进行语法高亮：

```bash
npm install
npm run server
```

```yaml
site:
  title: My Blog
```

```javascript
const siteTitle = 'My Blog'
```

## 模板

```markdown
<div align="center">

<img src="./.github/assets/logo.png" alt="项目 Logo" width="96">

# my-project

一句话说明项目解决什么问题。

[![构建](https://github.com/user/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/user/repo/actions/workflows/ci.yml) [![版本](https://img.shields.io/github/v/release/user/repo)](https://github.com/user/repo/releases) [![许可证](https://img.shields.io/github/license/user/repo)](./LICENSE)

</div>

## 特性

- 功能一：说明用户能得到什么
- 功能二：说明适用场景
- 功能三：说明与同类工具的区别

## 快速开始

```bash
npm install
npm run dev
```

## 技术栈

- 构建工具：Vite
- 运行环境：Node.js
- 内容格式：Markdown

## 项目结构

```text
.
├── src/
├── docs/
├── package.json
└── README.md
```

## 许可证

[MIT](./LICENSE)
```
