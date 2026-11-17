<div align="center">

<img src="source/img/王霸之卵.jpeg" alt="icon" width="128">

# ByTheFox的小站

记录生活~~那这辈子有了~~、技术与想法。

[![构建校验](https://github.com/CyTheFox/hexo-blog/actions/workflows/build.yml/badge.svg)](https://github.com/CyTheFox/hexo-blog/actions/workflows/build.yml) [![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/) [![Hexo](https://img.shields.io/badge/Hexo-8.1.2-0E83CD?logo=hexo&logoColor=white)](https://hexo.io/)

线上：<https://bythefox.xyz/blog/> · 后台：<https://bythefox.xyz/blog/admin/>

</div>

## 技术栈

- **静态网站生成器**：Hexo 8.1.2
- **运行环境**：Node.js 20
- **主题**：AnZhiYu、Butterfly、Landscape
- **模板与内容渲染**：EJS、Pug、Marked、Stylus
- **站点扩展**：文章归档、分类、标签、搜索数据库生成器

## 部署方式

服务器（腾讯云东京）自己拉代码构建，**不需要在 GitHub 配部署密钥**：

```
本地 / 后台 commit + push (main)
  → 服务器 blog-sync.timer（每分钟）git fetch
  → 有新提交就 git pull --rebase + hexo generate
  → /home/blog/blog/public/  ← nginx: location /blog/ { alias ... }
```

GitHub Actions 只跑 `.github/workflows/build.yml` 做构建校验（`npm ci` + `hexo generate`），
不会 rsync 到服务器，避免两边同时写 `public/`。

手动触发一次部署：

```bash
sudo -u blog /usr/local/bin/blog-sync.sh          # 有待部署提交时更新
sudo -u blog /usr/local/bin/blog-sync.sh --force  # 强制重新生成
sudo -u blog curl -s localhost:8088/api/sync      # 或走 OAuth 服务的接口
journalctl -u blog-sync -n 50                     # 看构建日志
```

## 本地开发

```bash
npm install
npm run server
```

生成静态文件：

```bash
npm run build
```
