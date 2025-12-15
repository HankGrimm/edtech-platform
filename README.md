# 🎓 EdTech Platform 2025 - 商业级智能教育 SaaS 平台

> **Status**: Commercial Ready (v2.1.0) | **License**: Enterprise Proprietary

基于 Spring Boot 3 + React 19 + BKT 算法 + Spring AI 构建的下一代个性化智能教育 SaaS 平台。支持多租户、RBAC 权限、付费订阅与全链路可观测性，专为在线教育机构打造。

---

## 🌟 2025 商业版核心特性

### 1. 🛡️ 企业级安全与合规 (Security & Compliance)
- **Spring Security + JWT**: 无状态认证架构，支持 Token 自动刷新与黑名单。
- **RBAC 权限体系**: 细粒度控制 `ADMIN` (平台), `TEACHER` (机构), `STUDENT`, `PARENT` 角色。
- **数据合规**: 敏感字段 (PII) 自动加密存储，防 SQL 注入/XSS，符合 GDPR 隐私标准。

### 2. ⚙️ 个性化设置中心 (Settings Center) [NEW]
- **全方位自定义**: 9大模块覆盖学习、隐私、外观等设置。
- **学习偏好引擎**: 自定义每日目标、难度偏好、出题策略权重（高频错题/薄弱点/艾宾浩斯/进阶拓展）。
- **家长控制**: 扫码绑定家长，支持查看权限控制与每日时长限制。
- **无感保存**: 全局配置实时防抖保存，体验丝般顺滑。

### 3. 📱 全新移动端核心页面 (Mobile Core Pages) [NEW]
- **仪表盘升级**: 全新设计的学习概览，包含进度追踪、今日目标完成情况、知识点掌握雷达图。
- **错题本页面**: 智能分类错题，支持按科目、时间、掌握程度筛选，集成AI深度解析。
- **成就系统**: 游戏化徽章与等级体系，激励持续学习，展示学习里程碑。
- **排行榜**: 实时学习排名，支持好友PK与班级排名，激发学习动力。
- **每日目标**: 可视化目标设定与追踪，番茄钟专注模式，健康学习提醒。
- **家长看板**: 家长专属视图，全面了解孩子学习进度、时间分布、成绩趋势。

### 4. 🎮 沉浸式动画与游戏化体验 (Immersive Animations & Gamification) [NEW]
- **流畅过渡动画**: 页面切换、组件加载均配备专业级动画效果，提升用户体验。
- **答题反馈系统**: 正确/错误答案即时视觉+听觉反馈，增强学习沉浸感。
- **进度可视化**: 知识点掌握进度、学习 streak、成就解锁等动态效果。
- **庆祝时刻**: 完成目标、解锁成就时的炫酷弹窗动画与音效。
- **微交互细节**: 按钮悬停、点击波纹、拖拽排序等精致交互动效。
- **声音系统**: 集成专业音效库，提供可配置的声音开关选项。

### 5. 🏢 多租户与机构管理 (Multi-tenancy)
- **SaaS 架构**: 支持单实例服务多机构（Domain Isolation），数据逻辑隔离。
- **机构后台**: 独立配置品牌 Logo、专属课程内容与定价策略。

### 6. 💰 商业化与变现 (Monetization)
- **订阅系统**: 集成 Stripe / Alipay 支付接口，支持月付/年付订阅计划。
- **订单管理**: 完整的订单生命周期管理（待支付、已支付、退款）。

### 7. 🧠 核心教学引擎 (Core Engine)
- **BKT 知识追踪**: 贝叶斯算法实时计算知识点掌握概率 (Redis L1 + MySQL L2)。
- **AI 智能辅导**: 接入 Qwen-Plus 大模型，生成千人千面的题目与详细解析 (Markdown/LaTeX)。
- **自适应学习路径**: 基于知识图谱与当前状态推荐最佳学习内容。
- **极致个性化练习**: 
  - **智能出题策略**: 融合高频错题重练 (40%)、薄弱击破 (30%)、艾宾浩斯复习 (15%)、进阶拓展 (10%)。
  - **纠错专项模式**: 错题后自动触发 Drill Mode，直到连续答对为止。
  - **游戏化激励**: 知识点金牌掌握特效，提升学习成就感。
  - **知识点管理后台**: 管理端支持知识点新增 / 编辑 / 删除、BKT 参数配置及前驱关系维护，所有配置实时落库并驱动 BKT 引擎。

### 8. ☁️ 云原生与可观测性 (Cloud Native)
- **Docker 容器化**: 提供标准 `Dockerfile` 与 `docker-compose.yml` 一键部署。
- **全链路监控**: 集成 Actuator + Prometheus + Grafana，实时监控 JVM、DB 连接池与业务指标。
- **健康检查**: 集成 Spring Boot Actuator，支持应用健康状态实时监测。

---

## 🛠️ 技术架构

### 后端 (Backend)
| 组件 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Framework** | Spring Boot 3.1.10 | 核心容器 |
| **Security** | Spring Security + JJWT | 认证与授权 |
| **Database** | MySQL 8.0 | 业务数据持久化 |
| **Cache** | Redis 7.0 (Redisson) | 缓存与分布式锁 |
| **ORM** | MyBatis Plus | 数据访问层 |
| **AI** | Spring AI / Hutool | LLM 集成 (Qwen) |
| **MQ** | RabbitMQ | 异步任务 (报告生成) |
| **Metrics** | Micrometer + Prometheus | 监控指标采集 |

### 前端 (Frontend)
| 组件 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite | 高性能 SPA |
| **Styling** | Tailwind CSS v4 | 原子化 CSS |
| **Router** | React Router v6 | 路由管理 |
| **Animation** | Framer Motion | 专业级动画库 |
| **Sound** | Howler.js | 音频播放系统 |
| **Viz** | Recharts | 数据可视化 (雷达图) |
| **Math** | KaTeX / React-Latex | 数学公式渲染 |
| **Icons** | Lucide React | 现代化图标库 |

---

## 🚀 商业版部署指南 (Production Deployment)

### 1. 前置要求
- Docker & Docker Compose
- JDK 17+ (仅开发环境)
- Node.js 18+ (仅开发环境)

### 1.1 环境变量配置
复制环境变量模板并配置：
```bash
cp .env.example .env
```
必需配置：
- `AI_API_KEY`: 通义千问 Qwen-Plus API 密钥
- `JWT_SECRET`: JWT 签名密钥 (生产环境请使用安全的256位密钥)

### 2. 数据库初始化
执行以下 SQL 脚本初始化数据库结构：
1. `sql/init.sql` (核心业务表：知识点、知识点前驱关系、题目、知识状态、错题本)
2. `sql/saas_upgrade.sql` (SaaS 增强表：租户、权限、订单)
3. `sql/settings_upgrade.sql` (设置中心表：用户偏好、家长绑定) [NEW]
4. `sql/gamification_upgrade.sql` (游戏化功能表：成就、积分、排行榜) [NEW]

### 3. 一键启动 (Docker Compose)
在项目根目录下执行：
```bash
docker-compose up -d --build
```
系统将自动启动以下服务：
- **MySQL**: 3306 (edtech_db)
- **Redis**: 6379
- **RabbitMQ**: 5672 / 15672 (Admin)
- **Prometheus**: 9090
- **EdTech Backend**: 8080

### 4. 访问系统
- **前端页面**: [http://localhost:5173](http://localhost:5173) (开发模式) 或通过 Nginx 反向代理
- **Swagger 文档**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **Prometheus**: [http://localhost:9090](http://localhost:9090)

### 5. 默认账号
| 角色 | 用户名 | 密码 | 权限 |
| :--- | :--- | :--- | :--- |
| **超级管理员** | `admin` | `admin123` | 全平台管理 |
| **学生** | `student` | `123456` | 学习、刷题、查看报告 |
| **家长** | `parent` | `123456` | 查看孩子学习报告与进度 |

---

## 📂 项目结构 (SaaS Edition)

```
edtech-platform2/
├── .github/               # GitHub 模板和工作流
├── edtech-web/            # [核心] Web API, Security Config, Auth Controller
├── edtech-service-kt/     # [核心] BKT 算法引擎
├── edtech-service-ai/     # [核心] AI 内容生成服务
├── edtech-service-core/   # 基础设施 (MQ, Payment Strategy, Tenant Context)
├── edtech-model/          # 实体定义 (User, KnowledgePoint, KnowledgePrerequisite, Question, State 等)
├── edtech-frontend/       # React 前端 (含学生端、管理端仪表盘、知识点管理、设置中心)
├── sql/                   # 数据库脚本 (init, saas, settings, gamification)
├── docker-compose.yml     # 容器编排
├── prometheus.yml         # Prometheus 监控配置
├── .env.example          # 环境变量模板
├── CONTRIBUTING.md       # 贡献指南
└── Dockerfile            # 后端镜像构建
```

---

## 🔌 API 概览

### 认证 (Auth)
- `POST /api/auth/login`: 用户登录 (JWT)
- `POST /api/auth/register`: 注册新用户

### 设置 (Settings) [NEW]
- `GET /api/settings`: 获取用户全量设置
- `PUT /api/settings`: 更新用户设置 (支持增量更新)
- `POST /api/settings/bind-parent`: 绑定家长账号

### 移动端核心功能 (Mobile Core Features) [NEW]
- `GET /api/dashboard/stats`: 获取学习统计信息
- `GET /api/wrong-questions`: 获取错题列表
- `GET /api/achievements`: 获取成就列表
- `GET /api/leaderboard`: 获取排行榜数据
- `GET /api/daily-goals`: 获取每日目标状态
- `GET /api/parent/dashboard`: 获取家长看板数据

### 商业化 (Commerce)
- `POST /api/payment/create-order`: 创建订阅订单
- `GET /api/payment/webhook`: 支付回调 (Stripe/Alipay)

### 核心学习 (Learning)
- `GET /api/practice/random`: 获取 AI 推荐题目
- `POST /api/ai/explain`: 生成错题智能解析

### 管理后台 (Admin)
- `POST /api/admin/login`: 管理员登录
- `GET /api/admin/knowledge-points`: 获取知识点列表（含 BKT 参数与前驱关系）
- `POST /api/admin/knowledge-points`: 新增 / 编辑知识点（名称、学科、描述、BKT 参数、前驱关系）
- `DELETE /api/admin/knowledge-points/{id}`: 删除知识点（自动清理相关前驱关系）

---

**© 2025 EdTech Inc. All Rights Reserved.**
