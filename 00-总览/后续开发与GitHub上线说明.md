# 后续开发与 GitHub 上线说明

这个整合包现在有两种用途：本地保存完整材料，GitHub Pages 展示作品合集。两件事不要混在一起处理。

如果要继续开发，用外层总包：`创新作品与网页代码整合/`。

如果要直接上传上线，用子目录：`06-GitHub-Pages上线包/`。这个子目录已经去掉原始大视频，保留网页首页、源码说明、静态 Demo、截图、文档和两支预览视频。

## 后续项目放哪里

| 新增内容 | 放置位置 |
| --- | --- |
| 能继续开发的网页、智能体、脚本、仿真、视频工程 | `03-可运行源码/项目名/` |
| 已经导出的 HTML 展示页、汇报页、阅读页 | `04-网页成品与展示材料/` 对应子目录 |
| 终版视频、封面、字幕、制作说明 | `02-终版案例视频/` |
| 创新作品提交包原件 | `01-原始创新作品提交包/` |
| Logo、海报、截图、设计系统 | `05-设计与视觉资产/` |
| 总索引、上线说明、文件清单 | `00-总览/` |

原则很简单：还要改代码的项目进 `03-可运行源码/`；已经导出的展示成品进 `04-网页成品与展示材料/`；视频和视觉资产各自归档。

## GitHub Pages 已准备好的内容

根目录已经补齐这些文件：

```text
index.html                 # 作品合集首页
site-assets/portfolio.css  # 首页样式
web-media/                 # GitHub 友好的预览视频
.nojekyll                  # 让 GitHub Pages 原样发布静态文件
.gitignore                 # 排除依赖、缓存和大体积原始视频
```

上传后，GitHub Pages 会先显示根目录的 `index.html`。这个首页已经链接到工作台网页、3D 沙盘、视频预览、源码说明和材料清单。

`06-GitHub-Pages上线包/` 中也有同样的结构，可以把它当作独立网站根目录上传。

## 大视频怎么处理

当前总包里有多支原始视频超过 100MB，不能作为普通 Git 文件上传。根目录 `.gitignore` 已默认忽略 `*.mp4`，只保留 `web-media/` 下的网页预览版：

```text
web-media/nanjing-south-case-preview.mp4
web-media/hubcoord-guide-preview.mp4
```

原始高清视频继续留在本地 `02-终版案例视频/` 和 `01-原始创新作品提交包/`。如果以后要在线提供高清下载，建议放到 GitHub Releases、学校网盘或其他视频平台，再把链接补进 `index.html`。

参考 GitHub 官方说明：普通 Git 仓库会阻止超过 100 MiB 的单个文件，浏览器上传单个文件不能超过 25 MiB；GitHub Pages 可以直接从仓库中的 HTML、CSS 和 JavaScript 发布静态网站。

## 推荐上线流程

在 GitHub 新建一个仓库后，在本目录运行：

```bash
cd "/Users/xuyiheng/Desktop/智能时代的公共管理：南京那站的案例研究/创新作品与网页代码整合"
git init
git add .
git commit -m "整理南京南站案例作品合集"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

如果使用 `06-GitHub-Pages上线包/`，就把上面第一行目录换成：

```bash
cd "/Users/xuyiheng/Desktop/智能时代的公共管理：南京那站的案例研究/创新作品与网页代码整合/06-GitHub-Pages上线包"
```

然后到 GitHub 仓库：

1. 打开 `Settings`
2. 进入 `Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main`，目录选择 `/root`
5. 保存后等待 Pages 地址生成

如果以后新增项目，只要把项目放进对应目录，更新 `index.html` 和 `00-总览/文件清单.txt`，再提交一次即可。

## 每次新增后的检查

```bash
find . -type d -name node_modules -prune -print
find . -type f -size +100M -print
find . -type f | sort > "00-总览/文件清单.txt"
```

第一条不应输出依赖目录；第二条如果输出文件，说明它不适合直接进普通 Git。第三条用于更新总清单。
