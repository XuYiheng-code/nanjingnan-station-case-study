# 南站协同官部署说明

前端页面和后端 API 在同一个容器中运行。服务器只需安装 Docker 与 Docker Compose；项目数据写入名为 `hubcoord_data` 的数据卷，更新容器不会清空数据库。

## 当前线上环境

- 访问地址：`https://hubcoord.cn`
- 备用地址：`https://www.hubcoord.cn`
- 小南问答工作台：`https://qaq.hubcoord.cn`
- ECS：`8.130.29.176`
- SSH 别名：`hubcoord-server`
- 服务器发布目录：`/opt/hubcoord/current`
- 访问方式：公开展示，打开后直接进入网站

本机现有的 `~/.ssh/aliyun_mpa_ed25519` 已获服务器授权，私钥不需要上传到阿里云控制台，也不要通过聊天、邮件或网盘传给其他人。连接服务器时执行：

```bash
ssh hubcoord-server
```

后续更新代码后，在项目目录执行：

```bash
./scripts/deploy_ecs.sh
```

脚本会先做本地预检，再把新版本上传到独立目录，继承服务器上的运行配置，重建容器并检查公网健康状态。旧版本目录不会被覆盖。

## 本地预检

在项目目录执行：

```bash
python3 scripts/preflight.py
```

脚本不启动服务、不构建镜像，也不写入项目或运行数据。它会检查：

- 应用、部署、静态资源和知识包的关键文件是否齐全。
- `data/`、`contracts/` 和 `eval/` 中的 JSON 是否可解析。
- `.env.example` 与可选 `.env` 的必需变量、数字取值、时区和 8152 容器端口是否一致。
- Docker 存在时，`docker-compose.yml` 是否能通过 `docker compose config --quiet` 静态解析。
- `static/` 中是否有外部链接、本机绝对路径或常见密钥痕迹。

`[FAIL]` 会使脚本以退出码 `1` 结束；全部通过时退出码为 `0`。`[WARN]` 用于本机没有 `.env` 或 Docker 的情况，不单独阻止发布。

## 启动

在服务器上进入 `nanjing-south-hubcoord` 目录：

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

容器端口默认绑定到服务器自身的 `127.0.0.1:8152`，不能直接从公网访问。以下两个地址用于服务器本机检查服务状态：

- `/healthz`：应用、知识包和数据库状态
- `/readyz`：供 Docker、负载均衡器判断服务能否接收请求

## 配置域名

当前比赛展示站允许匿名访问，`.env` 中这两项保持为空：

```dotenv
HUBCOORD_AUTH_USER=
HUBCOORD_AUTH_PASSWORD=
```

网站打开后会直接进入首页。公开环境只能使用已经审阅、允许公开的案例材料和模拟数据。若以后需要恢复整站限制访问，应同时填写账号和随机长密码；只填写一项会导致应用拒绝服务。`/healthz` 与 `/readyz` 始终不认证，供本机健康检查使用。

“小南”所用的千问密钥只写入服务器 `/opt/hubcoord/current/nanjing-south-hubcoord/.env`：

```dotenv
DASHSCOPE_API_KEY=请填写阿里云百炼 API Key
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_TIMEOUT_SECONDS=25
QWEN_MAX_TOKENS=900
ASSISTANT_RATE_LIMIT_PER_MINUTE=10
```

不要把真实密钥写进 `.env.example`、源码、静态文件或部署日志。配置后可在服务器本机请求 `/api/v1/assistant/health`，确认返回 `configured`；这个检查不会调用模型。

`deploy/nginx.conf.example` 是通用反向代理示例。线上使用 `deploy/nginx.hubcoord.cn.conf`：`hubcoord.cn` 和 `www.hubcoord.cn` 进入主站，`cad.hubcoord.cn` 进入空间沙盘，`qaq.hubcoord.cn` 的根路径转到 `/assistant.html`。三个站点的反向代理目标都保持为 `http://127.0.0.1:8152`。

首次给 `qaq.hubcoord.cn` 签发独立证书时，先临时启用 `deploy/nginx.qaq.bootstrap.conf`，再运行：

```bash
sudo certbot certonly --webroot --webroot-path /var/www/letsencrypt \
  --cert-name qaq.hubcoord.cn -d qaq.hubcoord.cn
```

证书就绪后停用 bootstrap 配置，安装 `deploy/nginx.hubcoord.cn.conf`，执行 `sudo nginx -t`，确认通过后再重载 Nginx。Certbot 的定时任务负责续期；HTTP 配置保留 `/.well-known/acme-challenge/`，供续期校验使用。

域名启用 HTTPS 后，防火墙只需开放 80 和 443。不要把 `docker-compose.yml` 中的回环地址改成 `0.0.0.0`。

## 更新

替换代码后重新构建：

```bash
docker compose up -d --build
docker compose ps
```

数据卷不会随容器重建而删除。不要运行 `docker compose down -v`，该命令会删除数据库卷。

## 备份与恢复

数据库位于容器内 `/data/hubcoord.sqlite3`。备份前先执行 SQLite 在线备份，或者在短暂停止容器后复制数据卷。至少保留最近三份备份，并在另一台机器上试做一次恢复。

当前公开版本只处理模拟资料，不接入真实业务系统。若要长期面向多人使用或接入真实资料，还需增加独立账号、服务端角色映射、项目级权限和访问日志保留策略。

## 发布前清单

- [ ] 从 `.env.example` 复制生成 `.env`，核对 `HUBCOORD_PUBLIC_PORT`、工作进程数、线程数和时区。
- [ ] 在服务器 `.env` 中填写 `DASHSCOPE_API_KEY`，并确认 `/api/v1/assistant/health` 返回 `configured`。
- [ ] 公开展示时确认 `HUBCOORD_AUTH_USER` 和 `HUBCOORD_AUTH_PASSWORD` 均为空，并确认站内没有未公开材料或真实业务数据。
- [ ] 执行 `python3 scripts/preflight.py`，确认退出码为 `0`。
- [ ] 执行 `.venv/bin/python -m unittest -v`，确认单元测试通过。
- [ ] 备份 `hubcoord_data` 数据卷，记录恢复点。
- [ ] 执行 `docker compose up -d --build` 和 `docker compose ps`，确认容器健康。
- [ ] 访问 `/healthz` 与 `/readyz`，确认都返回成功状态。
- [ ] 执行 `python3 ui_production_smoke.py`，确认首页、健康检查和评估接口可用。
- [ ] 使用域名时，开启 HTTPS，并让防火墙停止对公网开放 8152。
- [ ] 检查 `https://qaq.hubcoord.cn` 是否转到 `/assistant.html`，证书域名是否为 `qaq.hubcoord.cn`。
- [ ] 如果以后加入未公开材料、真实数据或真实处置能力，先恢复登录并补充权限分组。
