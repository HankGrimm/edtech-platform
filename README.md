# 🎓 EdTech Platform 2025 - 智能教育 SaaS 平台

> **Status**: v2.2.0 | **License**: Enterprise Proprietary

基于 Spring Boot 3 + React 19 + BKT 算法 + Spring AI 构建的个性化智能教育平台。支持 JWT 认证、RBAC 权限、付费订阅与全链路可观测性。

---

## 🌟 核心特性

### 1. 🛡️ 安全与认证 (Security)
- **Spring Security + JWT**: 无状态认证，每次请求通过 `JwtAuthenticationFilter` 验证 Token。
- **RBAC 权限体系**: `ADMIN` / `TEACHER` / `STUDENT` / `PARENT` 四种角色，接口级权限控制。
- **BCrypt 密码加密**: 所有用户密码使用 BCryptPasswordEncoder 加密存储。
- **真实 DB 认证**: 登录/注册直接操作数据库，不再使用 Mock 数据。

### 2. ⚙️ 个性化设置中心 (Settings Center)
- **9 大模块**: 学习偏好、通知、外观、隐私、账号、订阅、家长控制、个人资料、帮助。
- **学习偏好引擎**: 自定义每日目标、难度偏好、出题策略权重（高频错题/薄弱点/艾宾浩斯/进阶拓展）。
- **家长绑定**: 邀请码绑定家长账号，支持查看权限与每日时长限制。
- **防抖自动保存**: 全局配置 800ms 防抖实时保存。

### 3. 📱 移动端核心页面 (Mobile Core Pages)
- **仪表盘**: 学习概览、进度追踪、今日目标、知识点掌握雷达图、考试成绩预测。
- **错题本**: 智能分类，支持按科目/时间/掌握程度筛选，集成 AI 深度解析。
- **成就系统**: 15 种游戏化徽章（common/rare/epic/legendary），激励持续学习。
- **排行榜**: 周度积分/连胜/练习量三维排名。
- **每日目标**: 可视化目标设定与追踪，热力图日历展示历史完成情况。
- **家长看板**: 孩子学习进度、时间分布、薄弱点全览。

### 4. 🎮 动画与游戏化 (Gamification)
- **Framer Motion**: 页面切换、组件加载专业级动画。
- **答题反馈**: 连击特效 + canvas-confetti 纸屑庆祝动画。
- **声音系统**: 可配置音效开关。
- **微交互**: 悬停、点击波纹、进度环等精致动效。

### 5. 💰 订阅与支付 (Monetization)
- **订阅套餐**: 月度 Pro (¥9.99/月) 与年度 Pro (¥99/年) 两档套餐。
- **订单管理**: 完整订单生命周期（PENDING → PAID → CANCELLED/REFUNDED）。
- **模拟支付**: 演示环境提供 Mock Pay 接口，可一键模拟支付成功。
- **支付策略模式**: `PaymentStrategy` 接口预留 Stripe / Alipay 真实接入扩展点。

### 6. 🧠 核心教学引擎 (Core Engine)
- **BKT 知识追踪**: 贝叶斯算法实时计算知识点掌握概率，Redis L1 + MySQL L2 双层缓存。
- **AI 智能出题**: 接入 Qwen-Plus 大模型，根据掌握度动态生成题目与解析（支持 LaTeX）。
- **OpenSAT 真题**: 集成 OpenSAT API，直接获取真实 SAT 数学/英语题目。
- **自适应策略**: 高频错题 (40%) + 薄弱击破 (30%) + 艾宾浩斯复习 (15%) + 进阶拓展 (10%)。
- **纠错模式**: 答错后自动触发 Drill Mode，连续答对方可退出。
- **知识图谱管理**: 管理端支持知识点 CRUD、BKT 参数配置及前驱关系维护。

### 7. ☁️ 云原生与可观测性 (Cloud Native)
- **Docker 容器化**: `Dockerfile` + `docker-compose.yml` 一键启动全部服务。
- **Spring Boot Actuator**: 健康检查端点 `/actuator/health`。
- **Prometheus**: 集成 Micrometer，暴露 `/actuator/prometheus` 指标端点。
- **RabbitMQ**: 异步报告生成消息队列。

---

## 🛠️ 技术架构

### 后端 (Backend)
| 组件 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Framework** | Spring Boot 3.1.10 | 核心容器 |
| **Security** | Spring Security + JJWT 0.11.5 | JWT 认证与 RBAC 授权 |
| **Database** | MySQL 8.0 | 业务数据持久化 |
| **Cache** | Redis 7.0 | BKT 状态缓存 |
| **ORM** | MyBatis Plus 3.5.5 | 数据访问层 |
| **AI** | Spring AI + Hutool | Qwen-Plus LLM 集成 |
| **MQ** | RabbitMQ | 异步任务 |
| **Metrics** | Micrometer + Prometheus | 监控指标采集 |

### 前端 (Frontend)
| 组件 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite | 高性能 SPA |
| **Styling** | Tailwind CSS v4 | 原子化 CSS |
| **Router** | React Router v6 | 路由管理 |
| **Animation** | Framer Motion | 专业级动画库 |
| **Viz** | Recharts | 数据可视化（雷达图） |
| **Math** | KaTeX / React-Latex | 数学公式渲染 |
| **Icons** | Lucide React | 现代化图标库 |

---

## 🚀 部署指南

### 前置要求
- Docker & Docker Compose
- JDK 17+（仅开发环境）
- Node.js 18+（仅开发环境）

### 1. 配置环境变量
```bash
cp .env.example .env
```
必需配置：
- `AI_API_KEY`: 通义千问 Qwen-Plus API 密钥
- `JWT_SECRET`: JWT 签名密钥（生产环境请使用 256 位随机字符串）

### 2. 一键启动
```bash
docker-compose up -d --build
```
自动启动服务：
- **MySQL**: 3306
- **Redis**: 6379
- **RabbitMQ**: 5672 / 15672 (管理界面)
- **Prometheus**: 9090
- **EdTech Backend**: 8080

数据库表结构由 `edtech-web/src/main/resources/sql/init.sql` 在启动时自动初始化（`spring.sql.init.mode=always`）。

### 3. 启动前端（开发模式）
```bash
cd edtech-frontend
npm install
npm run dev
```

### 4. 访问系统
| 地址 | 说明 |
| :--- | :--- |
| http://localhost:5173 | 前端页面（开发模式） |
| http://localhost:8080/swagger-ui/index.html | Swagger API 文档 |
| http://localhost:9090 | Prometheus 监控 |
| http://localhost:15672 | RabbitMQ 管理界面 |

### 5. 默认账号
| 角色 | 用户名 | 密码 | 权限 |
| :--- | :--- | :--- | :--- |
| **超级管理员** | `admin` | `admin123` | 全平台管理 |
| **学生** | `student` | `123456` | 学习、刷题、查看报告 |
| **家长** | `parent` | `123456` | 查看孩子学习报告与进度 |

---

## 📂 项目结构

```
edtech-platform2/
├── edtech-web/            # Web API、Security、Controllers、Services
├── edtech-service-kt/     # BKT 算法引擎
├── edtech-service-ai/     # AI 内容生成（Qwen-Plus + OpenSAT）
├── edtech-service-core/   # 基础设施（RabbitMQ、Redis 工具）
├── edtech-model/          # 实体定义与 MyBatis Plus Mapper
├── edtech-common/         # 公共工具
├── edtech-frontend/       # React 前端（学生端 + 管理端）
├── sql/                   # 数据库升级脚本（gamification、saas、settings）
├── docker-compose.yml     # 容器编排
├── prometheus.yml         # Prometheus 配置
├── .env.example           # 环境变量模板
└── Dockerfile             # 后端镜像构建
```

---

## 🔌 API 概览

### 认证 (Auth)
- `POST /api/auth/login` — 用户登录，返回 JWT Token
- `POST /api/auth/register` — 注册新用户

### 设置 (Settings)
- `GET /api/settings` — 获取当前用户全量设置
- `PUT /api/settings` — 更新设置（增量）
- `POST /api/settings/bind-parent` — 绑定家长账号

### 练习 (Practice)
- `GET /api/practice/random` — 获取 OpenSAT 推荐题目
- `GET /api/practice/generate` — AI 动态出题
- `POST /api/practice/submit` — 提交答案（触发 BKT 更新）

### AI (AI Services)
- `POST /api/ai/generate-question` — AI 出题（支持 OpenSAT / Qwen 双源）
- `POST /api/ai/explain` — 错题 AI 解析
- `POST /api/ai/exam-report` — 生成 SAT 考试报告

### 支付 (Payment)
- `GET /api/payment/plans` — 获取订阅套餐列表
- `POST /api/payment/create-order` — 创建订单
- `GET /api/payment/orders` — 获取当前用户订单列表
- `POST /api/payment/mock-pay/{orderNo}` — 模拟支付（演示用）
- `POST /api/payment/cancel/{orderNo}` — 取消订单

### 仪表盘 (Dashboard)
- `GET /api/dashboard/radar/{studentId}` — 知识点掌握雷达图数据
- `GET /api/dashboard/prediction/{studentId}` — 考试成绩预测

### 学习报告 (Report)
- `GET /api/report/student/{studentId}` — 答题记录
- `GET /api/report/trend/{studentId}` — 正确率趋势（近 N 天）

### 游戏化 (Gamification)
- `GET /api/achievements` — 成就列表
- `GET /api/leaderboard` — 排行榜
- `GET /api/daily-goals` — 每日目标状态

### 家长 (Parent)
- `GET /api/parent/dashboard` — 家长看板数据

### 管理后台 (Admin，需 ADMIN 角色)
- `POST /api/admin/login` — 管理员登录
- `GET /api/admin/dashboard` — 平台统计数据
- `GET /api/admin/users` — 用户列表（分页+搜索）
- `GET /api/admin/users/{id}` — 用户详情
- `GET /api/admin/knowledge-points` — 知识点列表（含 BKT 参数与前驱关系）
- `POST /api/admin/knowledge-points` — 新增/编辑知识点
- `DELETE /api/admin/knowledge-points/{id}` — 删除知识点
- `GET /api/admin/logs` — 系统日志

---

**© 2025 EdTech Inc. All Rights Reserved.**
