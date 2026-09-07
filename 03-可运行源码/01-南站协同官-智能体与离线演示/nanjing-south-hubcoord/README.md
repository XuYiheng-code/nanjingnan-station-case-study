# 南站协同官案例智能体平台

这是面向评委专家的七页展示站，也是一个可操作的案例教学与模拟推演原型。阅读路径为“认识协同官—案例全景—南站破局—智能体系统—问答助手—操作 Demo—证据与验证”。工作台读取已审阅的展示证据、固定权责规则和 SC-01 教学情景，将事件线索整理为需要规定角色确认的协同议题卡。

线上主站为 `https://hubcoord.cn`；小南问答工作台也可从 `https://qaq.hubcoord.cn` 直接进入。两个入口都无需登录。后续更新可直接执行 `./scripts/deploy_ecs.sh`。服务器和证书配置见 `deploy/DEPLOY.md`。

项目、协同议题卡、人工确认和审计记录保存在 `runtime/hubcoord.sqlite3`。平台不读取原始访谈，不连接真实业务系统，也不会发送处置指令。设计说明见 `../南站协同官_平台化建设方案_v0.2.md`。

## 已实现

- 案例项目工作台：新建项目，查看项目活动和历史协同卡。
- 证据与边界库：前端只显示研究团队已审阅、可用于本次展示的证据卡及其来源。
- 协同实验室：按角色、证据和权责规则生成待人工确认的议题卡。
- 证据核验台：展示 12 张已审阅证据卡，并把 4 项稿件冲突单列为待核验问题。
- 权责矩阵与可溯源追问：没有匹配规则或证据时，明确转人工，不猜测责任主体。
- 问答助手“小南”：先从 12 张已审阅证据卡检索相关材料，再调用服务端千问；回答返回来源与定位。事实、分析和利益相关方模拟使用不同提示约束。
- 边界实测：20 条确定性边界断言可在页面中逐条查看并重新运行。
- SQLite 持久化：服务重启后仍可读取项目、卡片、确认角色和审计记录。
- 同源部署：Flask 提供 API 和前端静态资源，Gunicorn 负责生产运行。

## 运行

```bash
cd '创新作品与网页代码整合/03-可运行源码/南站协同官-离线演示与源码/nanjing-south-hubcoord'
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python app.py
```

有四个明确入口：

- `南站协同官-直接打开.html`：首选的评委总入口。Finder 双击即可，先讲清作品、案例和机制，再通向各独立页面。
- `南站协同官-工作台Demo.html`：零依赖离线工作台。证据检索、五个可审计任务节点、双角色确认、越权拦截和纪要下载均在浏览器内完成。节点由同一套确定性流程执行，不是五个独立大模型。
- `static/assistant.html`：小南案例问答工作台。需通过本地服务或线上域名进入，支持 RAG 检索、三种问答模式、来源核对和中文语音输入。
- `启动演示.command`：本地服务版。双击后自动选择空闲端口、使用临时数据库并打开展示站首页；关闭终端后清除本次演练数据。

服务版首次运行需要联网安装 Python 依赖。如果依赖安装失败、端口不可用或服务未能启动，脚本会自动打开离线答辩版。开发运行时打开 `http://127.0.0.1:8152`。

## Docker 部署

构建前先跑只读预检。脚本只使用 Python 标准库：

```bash
python3 scripts/preflight.py
```

输出中没有 `[FAIL]` 且退出码为 `0` 时，再启动容器。Docker 已安装时，预检会额外执行 `docker compose config --quiet`；没有 Docker 时会显示 `[WARN]`，其他检查照常运行。

```bash
cp .env.example .env
# 在 .env 中填写 DASHSCOPE_API_KEY；密钥只由 Flask 服务读取。
docker compose up -d --build
docker compose ps
```

容器端口默认只绑定 `127.0.0.1`，由 Nginx 通过 HTTPS 对外提供服务。当前比赛展示站允许匿名访问，只能放入已经审阅、允许公开的案例材料和模拟数据。若以后需要限制访问，可在 `.env` 同时填写 `HUBCOORD_AUTH_USER` 和 `HUBCOORD_AUTH_PASSWORD`。

## 小南问答接口

`POST /api/v1/assistant/chat` 接受单轮 `question`，也接受最多 12 条 `messages`。`mode` 可选 `facts`、`analysis` 或 `stakeholder`；利益相关方模拟还可传 `stakeholder`，支持 `operator_supervisor`、`management_office_duty`、`hub_liaison` 和 `passenger`。响应中的 `sources` 与 `citations` 均为本次回答实际检索到的证据。

```json
{
  "messages": [
    {"role": "user", "content": "平台企业为什么能减少协调成本？"}
  ],
  "mode": "analysis"
}
```

没有相关证据时，接口不调用模型并返回 `insufficient_evidence`。匿名请求按客户端 IP 限制为每分钟 10 次，超限返回 `429` 和 `Retry-After`。`GET /api/v1/assistant/health` 只报告模型配置状态，不发起计费请求。旧的 `POST /api/v1/assistant/query` 继续保留，供离线和确定性演示使用。

## 验证

```bash
python3 scripts/build_offline_data.py
python3 scripts/build_standalone.py
python3 scripts/preflight.py
.venv/bin/python -m unittest -v
```

离线单文件的完整交互回归：

```bash
python3 ui_offline_check.py
```

`runtime/audit-log.jsonl` 是便于人工查看的附加日志；SQLite 数据库是应用读取的持久化来源。两者都只保存模拟记录。

浏览器演练使用系统 Python 中的 Playwright：

```bash
python3 /Users/xuyiheng/.agents/skills/webapp-testing/scripts/with_server.py \
  --server ".venv/bin/python app.py" --port 8152 -- python3 ui_browser_check.py
```

容器已经运行时，可执行不写入数据的生产烟雾测试：

```bash
python3 ui_production_smoke.py
```
