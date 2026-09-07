#!/usr/bin/env python3
"""南站协同官本地部署预检。

只读取项目文件并执行静态检查；不启动服务、不构建镜像、不修改数据。
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BUNDLE_ROOT = PROJECT_ROOT.parent

PROJECT_FILES = (
    ".env.example",
    "Dockerfile",
    "Dockerfile.dockerignore",
    "README.md",
    "app.py",
    "docker-compose.yml",
    "gunicorn.conf.py",
    "requirements.txt",
    "scripts/preflight.py",
    "scripts/build_offline_data.py",
    "scripts/build_standalone.py",
    "storage.py",
    "deploy/DEPLOY.md",
    "deploy/nginx.conf.example",
    "static/app.js",
    "static/cad/app.html",
    "static/analysis.html",
    "static/case.html",
    "static/demo.html",
    "static/evidence.html",
    "static/index.html",
    "static/mechanism.html",
    "static/offline-data.js",
    "static/site.css",
    "static/site.js",
    "static/solution.html",
    "static/story.html",
    "static/showcase.css",
    "static/showcase.js",
    "static/styles.css",
    "ui_layout_audit.py",
    "ui_offline_check.py",
    "南站协同官-直接打开.html",
    "南站协同官-工作台Demo.html",
    "启动演示.command",
)

BUNDLE_FILES = (
    "contracts/audit-record.schema.json",
    "contracts/authority-rule.schema.json",
    "contracts/coordination-card.schema.json",
    "contracts/event.schema.json",
    "contracts/evidence-card.schema.json",
    "contracts/manual-review-required.schema.json",
    "contracts/openapi.yaml",
    "data/authority-rules.json",
    "data/evidence-cards.json",
    "data/review-issues.json",
    "data/sc-01-delay-parking-overflow.json",
    "data/source-registry.json",
    "eval/golden-cases.json",
)

REQUIRED_ENV = (
    "HUBCOORD_PUBLIC_PORT",
    "HUBCOORD_PORT",
    "HUBCOORD_WORKERS",
    "HUBCOORD_THREADS",
    "HUBCOORD_TIMEZONE",
)

STATIC_SUFFIXES = {".css", ".html", ".js", ".json", ".map", ".mjs", ".svg"}

STATIC_PATTERNS = (
    (
        "外部链接",
        re.compile(r"(?i)(?:https?:)?//[a-z0-9][a-z0-9.-]*(?::\d+)?(?:[/\s\"'?#]|$)"),
    ),
    (
        "本机绝对路径",
        re.compile(r"(?i)(?:file://|/(?:Users|home|private|var/folders)/|[a-z]:\\(?:Users|Documents and Settings)\\)"),
    ),
    (
        "PEM 私钥",
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    ),
    ("AWS 访问密钥", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Google API 密钥", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("GitHub 访问令牌", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{30,}\b")),
    ("OpenAI 风格密钥", re.compile(r"\bsk-(?:proj-)?[0-9A-Za-z_-]{20,}\b")),
    ("Slack 令牌", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    (
        "疑似明文密钥",
        re.compile(
            r"(?i)\b(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)"
            r"\s*[:=]\s*[\"']?[0-9A-Za-z+/=_-]{12,}"
        ),
    ),
    (
        "Bearer 令牌",
        re.compile(r"(?i)\bauthorization\s*[:=]\s*[\"']?bearer\s+[0-9A-Za-z._~+/-]{12,}"),
    ),
)


class Report:
    def __init__(self) -> None:
        self.passed = 0
        self.warnings = 0
        self.failed = 0

    def pass_(self, message: str) -> None:
        self.passed += 1
        print(f"[PASS] {message}")

    def warn(self, message: str) -> None:
        self.warnings += 1
        print(f"[WARN] {message}")

    def fail(self, message: str) -> None:
        self.failed += 1
        print(f"[FAIL] {message}")


def relative(path: Path) -> str:
    try:
        return str(path.relative_to(BUNDLE_ROOT))
    except ValueError:
        return str(path)


def check_required_files(report: Report) -> None:
    missing = [str(path) for path in PROJECT_FILES if not (PROJECT_ROOT / path).is_file()]
    missing.extend(str(path) for path in BUNDLE_FILES if not (BUNDLE_ROOT / path).is_file())
    if missing:
        report.fail("缺少关键文件：" + "、".join(missing))
        return
    report.pass_(f"关键文件完整（{len(PROJECT_FILES) + len(BUNDLE_FILES)} 个）")


def check_json(report: Report) -> None:
    json_files: list[Path] = []
    for directory in ("contracts", "data", "eval"):
        json_files.extend(sorted((BUNDLE_ROOT / directory).rglob("*.json")))

    if not json_files:
        report.fail("未找到需要检查的 JSON 文件")
        return

    errors: list[str] = []
    for path in json_files:
        try:
            with path.open(encoding="utf-8") as handle:
                json.load(handle)
        except (OSError, UnicodeError) as exc:
            errors.append(f"{relative(path)}: {exc}")
        except json.JSONDecodeError as exc:
            errors.append(f"{relative(path)}:{exc.lineno}:{exc.colno}: {exc.msg}")

    if errors:
        for error in errors:
            report.fail(f"JSON 解析失败：{error}")
        return
    report.pass_(f"JSON 可解析（{len(json_files)} 个）")


def parse_env_file(path: Path, report: Report) -> dict[str, str] | None:
    values: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeError) as exc:
        report.fail(f"无法读取 {path.name}：{exc}")
        return None

    for line_number, raw_line in enumerate(lines, 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].lstrip()
        if "=" not in line:
            report.fail(f"{path.name}:{line_number} 不是 KEY=VALUE 格式")
            return None
        key, value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key):
            report.fail(f"{path.name}:{line_number} 的变量名无效")
            return None
        if key in values:
            report.fail(f"{path.name}:{line_number} 重复定义 {key}")
            return None
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key] = value
    return values


def positive_integer(value: str, maximum: int | None = None) -> bool:
    try:
        number = int(value)
    except ValueError:
        return False
    return number > 0 and (maximum is None or number <= maximum)


def check_environment_and_ports(report: Report) -> None:
    example = parse_env_file(PROJECT_ROOT / ".env.example", report)
    if example is None:
        return

    missing = [key for key in REQUIRED_ENV if not example.get(key)]
    if missing:
        report.fail(".env.example 缺少必需变量：" + "、".join(missing))
        return

    effective = dict(example)
    env_path = PROJECT_ROOT / ".env"
    if env_path.is_file():
        local_env = parse_env_file(env_path, report)
        if local_env is None:
            return
        effective.update(local_env)
        env_source = ".env + 当前进程环境"
    else:
        report.warn("未找到 .env，按 .env.example 的默认值预检")
        env_source = ".env.example + 当前进程环境"

    for key in REQUIRED_ENV:
        if key in os.environ:
            effective[key] = os.environ[key]

    invalid: list[str] = []
    for key in ("HUBCOORD_PUBLIC_PORT", "HUBCOORD_PORT"):
        if not positive_integer(effective[key], maximum=65535):
            invalid.append(f"{key} 必须是 1–65535 的整数")
    for key in ("HUBCOORD_WORKERS", "HUBCOORD_THREADS"):
        if not positive_integer(effective[key]):
            invalid.append(f"{key} 必须是正整数")
    try:
        ZoneInfo(effective["HUBCOORD_TIMEZONE"])
    except (ZoneInfoNotFoundError, ValueError):
        invalid.append("HUBCOORD_TIMEZONE 不是当前系统可识别的 IANA 时区")

    if invalid:
        for item in invalid:
            report.fail(f"环境配置无效：{item}")
        return

    internal_port = effective["HUBCOORD_PORT"]
    compose = (PROJECT_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text(encoding="utf-8")
    dockerignore = (PROJECT_ROOT / "Dockerfile.dockerignore").read_text(encoding="utf-8")
    nginx = (PROJECT_ROOT / "deploy/nginx.conf.example").read_text(encoding="utf-8")
    gunicorn = (PROJECT_ROOT / "gunicorn.conf.py").read_text(encoding="utf-8")
    consistency_errors = []
    if internal_port != "8152":
        consistency_errors.append("HUBCOORD_PORT 必须与容器内部端口 8152 一致")
    if not re.search(r"127\.0\.0\.1:\$\{HUBCOORD_PUBLIC_PORT:-8152\}:8152", compose):
        consistency_errors.append("docker-compose.yml 未把 8152 端口限制在本机回环地址")
    if not re.search(r"(?m)^\s*HUBCOORD_PORT:\s*8152\s*$", compose):
        consistency_errors.append("docker-compose.yml 的 HUBCOORD_PORT 不是 8152")
    if not re.search(r"(?m)^EXPOSE\s+8152\s*$", dockerfile):
        consistency_errors.append("Dockerfile 未声明 EXPOSE 8152")
    if "HUBCOORD_PORT" not in gunicorn:
        consistency_errors.append("gunicorn.conf.py 未读取 HUBCOORD_PORT")
    for required_context in ("data", "contracts", "eval"):
        if f"!{required_context}/**" not in dockerignore:
            consistency_errors.append(f"Docker 构建上下文未包含 {required_context}/")
    if "127.0.0.1:8152" not in nginx:
        consistency_errors.append("Nginx 反向代理目标不是 127.0.0.1:8152")

    if consistency_errors:
        for item in consistency_errors:
            report.fail(f"端口配置不一致：{item}")
        return

    auth_user = effective.get("HUBCOORD_AUTH_USER", "")
    auth_password = effective.get("HUBCOORD_AUTH_PASSWORD", "")
    if bool(auth_user) != bool(auth_password):
        report.fail("环境配置无效：HUBCOORD_AUTH_USER 与 HUBCOORD_AUTH_PASSWORD 必须同时填写")
        return
    if not auth_user:
        report.warn("访问认证未启用；公开部署前请确认只包含允许公开的案例材料和模拟数据")
    report.pass_(f"环境变量和端口配置有效（来源：{env_source}）")


def check_compose(report: Report) -> None:
    docker = shutil.which("docker")
    if docker is None:
        report.warn("未安装 docker，跳过 `docker compose config --quiet`")
        return

    command = [
        docker,
        "compose",
        "--env-file",
        str(PROJECT_ROOT / ".env.example"),
        "-f",
        str(PROJECT_ROOT / "docker-compose.yml"),
        "config",
        "--quiet",
    ]
    try:
        completed = subprocess.run(
            command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        report.fail(f"Docker Compose 静态解析未完成：{exc}")
        return

    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip().splitlines()
        suffix = f"：{detail[-1]}" if detail else ""
        report.fail(f"Docker Compose 静态解析失败{suffix}")
        return
    report.pass_("Docker Compose 静态解析通过")


def check_static_assets(report: Report) -> None:
    static_root = PROJECT_ROOT / "static"
    files = sorted(
        path for path in static_root.rglob("*") if path.is_file() and path.suffix.lower() in STATIC_SUFFIXES
    )
    files.extend((
        PROJECT_ROOT / "南站协同官-直接打开.html",
        PROJECT_ROOT / "南站协同官-工作台Demo.html",
    ))
    if not files:
        report.fail("static/ 中没有可检查的文本资源")
        return

    findings: list[str] = []
    for path in files:
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            findings.append(f"{relative(path)}: 无法读取（{exc}）")
            continue
        for label, pattern in STATIC_PATTERNS:
            scan_text = text
            if label == "外部链接":
                # CAD 沙盘中仅保留已审阅的公开证据来源；浏览器导航允许访问，应用不会向其上传数据。
                if path.is_relative_to(PROJECT_ROOT / "static" / "cad"):
                    continue
                # 同一项目受控子域名是主站的正式模块入口。
                approved_project_url = "https://cad.hubcoord.cn/"
                scan_text = scan_text.replace(approved_project_url, " " * len(approved_project_url))
                # SVG/XML 命名空间是标识符，不会触发网络请求。
                for namespace in ("http://www.w3.org/2000/svg", "http://www.w3.org/1999/xlink"):
                    scan_text = scan_text.replace(namespace, " " * len(namespace))
            for match in pattern.finditer(scan_text):
                line_number = text.count("\n", 0, match.start()) + 1
                findings.append(f"{relative(path)}:{line_number}: {label}")

    if findings:
        for finding in findings:
            report.fail(f"静态资源风险：{finding}")
        return
    report.pass_(f"主站静态资源无外链；CAD 证据链接已隔离，本机路径与常见密钥检查通过（{len(files)} 个）")


def check_standalone(report: Report) -> None:
    path = PROJECT_ROOT / "南站协同官-直接打开.html"
    demo_path = PROJECT_ROOT / "南站协同官-工作台Demo.html"
    try:
        text = path.read_text(encoding="utf-8")
        demo_text = demo_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        report.fail(f"无法读取直接打开版：{exc}")
        return

    failures: list[str] = []
    if '<link rel="stylesheet"' in text or 'src="site.js"' in text:
        failures.append("评委总览仍引用外部 CSS 或 JavaScript")
    if "<style>" not in text or "面向跨主体" not in text or "直接操作 Demo" not in text:
        failures.append("评委总览缺少内联样式或核心作品定义")
    if '<link rel="stylesheet"' in demo_text or 'src="app.js"' in demo_text or 'src="offline-data.js"' in demo_text:
        failures.append("工作台 Demo 仍引用外部运行资源")
    if "window.HUBCOORD_OFFLINE_DATA" not in demo_text:
        failures.append("工作台 Demo 未内嵌离线数据")
    if "事件归并 Agent" not in demo_text or "安全审计 Agent" not in demo_text:
        failures.append("工作台 Demo 缺少五个任务 Agent")

    if failures:
        for item in failures:
            report.fail(f"直接打开版无效：{item}")
        return
    report.pass_("评委总览与工作台 Demo 已生成可直接打开版")


def main() -> int:
    print(f"预检目录：{PROJECT_ROOT}")
    print("模式：只读静态检查\n")
    report = Report()

    checks = (
        ("关键文件", check_required_files),
        ("JSON 数据", check_json),
        ("环境变量与端口", check_environment_and_ports),
        ("Docker Compose", check_compose),
        ("静态资源", check_static_assets),
        ("单文件答辩版", check_standalone),
    )
    for title, check in checks:
        print(f"== {title} ==")
        try:
            check(report)
        except Exception as exc:  # 预检应继续执行其他检查
            report.fail(f"检查器异常：{type(exc).__name__}: {exc}")
        print()

    print(f"结果：{report.passed} 项通过，{report.warnings} 项提醒，{report.failed} 项失败。")
    if report.failed:
        print("预检未通过，请修复 [FAIL] 项后重试。")
        return 1
    print("预检通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
