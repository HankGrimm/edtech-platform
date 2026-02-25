# 🎓 EdTech Platform 2025 - 智能教育 SaaS 平台

> **版本**: v2.3.0 | **技术栈**: Spring Boot 3 + React 19 + BKT + Qwen AI

基于贝叶斯知识追踪（BKT）算法与大语言模型驱动的个性化智能教育平台，面向 SAT 备考场景，支持自适应刷题、AI 解析、游戏化激励、家长监控与管理后台。

---

## 🌟 核心功能

### 🧠 智能刷题引擎
- **BKT 知识追踪**：贝叶斯算法实时计算每个知识点的掌握概率，Redis L1 + MySQL L2 双层缓存
- **OpenSAT 真题库**：集成 [pinesat.com](https://pinesat.com) API，一次批量获取 27 道 R&W / 22 道 Math 真题
- **Qwen-Plus AI 出题**：OpenSAT 不足时自动 fallback，支持 LaTeX 数学公式渲染
- **自适应策略**：高频错题 40% + 薄弱击破 30% + 艾宾浩斯复习 15% + 进阶拓展 10% + 随机 5%
- **纠错模式（Drill Mode）**：答错后锁定知识点，连续答对方可退出

### 📝 练习模式
- 配置面板：选择科目（R&W / Math）、Domain、难度（Easy / Medium / Hard）
- 题目批量预加载，支持**前进 / 后退**自由导航，可跳过当前题
- 顶部分块进度条：答对绿色 ✓，答错红色 ✗，当前题蓝色高亮，点击可跳转
- 点击选项即时判断，无需点击提交按钮
- **解释答案**按钮：答题后按需触发 Gemini/Qwen 流式 AI 解析，不答不调用
- 可选计时器（5–60 分钟滑块），倒计时最后 60 秒变红闪烁

### 📊 考试模式
- 10 题完整模拟考，答完后生成 AI 分析报告
- 报告包含：预估分数、百分位、优势/薄弱领域、逐题错因分析、学习计划

### 🎮 游戏化系统
- **15 种成就徽章**：common / rare / epic / legendary 四档稀有度
- **积分与连胜**：连续学习天数追踪，5 连击触发纸屑庆祝动画
- **周排行榜**：积分 / 连胜 / 练习量三维排名
- **每日目标**：可视化目标设定，90 天热力图日历

### 👨‍👩‍👧 家长监控
- 邀请码绑定家长账号
- 每日时长限制（默认 120 分钟）、允许学习时段（默认 8:00–22:00）
- 孩子学习进度、时间分布、薄弱点全览
- 周报通知与薄弱点提醒

### ⚙️ 个性化设置
- 9 大模块：学习偏好、通知、外观、隐私、账号、订阅、家长控制、个人资料、帮助
- 出题策略权重自定义、难度偏好、每日目标
- 主题 / 字体 / 动画 / 音效开关
- 800ms 防抖自动保存

### 💰 订阅与支付
- 月度 Pro（¥9.99/月）与年度 Pro（¥99/年）
- 完整订单生命周期：PENDING → PAID → CANCELLED / REFUNDED
- 模拟支付接口（演示用），预留 Stripe / Alipay 扩展点

### 🛡️ 安全与权限
- Spring Security + JWT（24 小时有效期，HS256 签名）
- RBAC 四角色：ADMIN / TEACHER / STUDENT / PARENT
- BCrypt 密码加密，无状态 Session

### 🖥️ 管理后台
- 用户管理（分页 + 搜索 + 角色筛选）
- 知识点 CRUD + BKT 参数配置 + 前驱关系维护
- AI Prompt 模板管理
- 平台统计数据与系统日志

---

## 🛠️ 技术架构

### 后端
| 组件 | 技术 | 说明 |
|------|------|------|
| Framework | Spring Boot 3.1.10 | 核心容器 |
| Security | Spring Security + JJWT 0.11.5 | JWT 认证 + RBAC |
| Database | MySQL 8.0 | 业务数据持久化 |
| Cache | Redis 7.0 | BKT 状态 + 题目缓存 |
| ORM | MyBatis Plus 3.5.5 | 数据访问层 |
| AI | Qwen-Plus (DashScope) | 动态出题 + 解析 + 报告 |
| Question Source | OpenSAT API | 真实 SAT 题目 |
| MQ | RabbitMQ 3 | 异步报告生成 |
| Metrics | Micrometer + Prometheus | 监控指标 |
| Java | JDK 17+ | — |

### 前端
| 组件 | 技术 | 说明 |
|------|------|------|
| Framework | React 19 + Vite | 高性能 SPA |
| Styling | Tailwind CSS v4 | 原子化 CSS |
| Router | React Router v6 | 路由管理 |
| Animation | Framer Motion | 页面 + 组件动画 |
| Charts | Recharts | 雷达图、趋势图 |
| Math | KaTeX + React-Latex | 数学公式渲染 |
| Icons | Lucide React | 图标库 |
| Effects | canvas-confetti | 庆祝动画 |

---

## 📂 项目结构

```
edtech-platform2/
├── edtech-web/                # Web API 入口、Controllers、Security
├── edtech-service-kt/         # BKT 知识追踪算法引擎
├── edtech-service-ai/         # AI 出题（Qwen-Plus + OpenSAT）
├── edtech-service-core/       # 基础设施（RabbitMQ、RedisUtils）
├── edtech-model/              # 实体定义与 MyBatis Plus Mapper
├── edtech-common/             # 公共工具类
├── edtech-frontend/           # React 前端（学生端 + 管理端）
│   └── src/
│       ├── pages/             # 20+ 页面
│       ├── components/        # 通用组件
│       └── api/services/      # Axios 接口封装
├── edtech-web/src/main/
│   └── resources/sql/init.sql # 数据库初始化（19 张表）
├── docker-compose.yml
├── prometheus.yml
└── Dockerfile
```

---

## 🗄️ 数据库（19 张表）

| 分类 | 表名 | 说明 |
|------|------|------|
| 核心 | `user` | 用户账号（4 种角色） |
| 核心 | `knowledge_point` | 知识点 + BKT 参数 |
| 核心 | `knowledge_prerequisite` | 知识点前驱关系图 |
| 核心 | `question` | 题库（type=99 为 AI 生成） |
| 核心 | `student_exercise_log` | 答题记录 |
| 核心 | `knowledge_state` | 学生知识点掌握概率 |
| 核心 | `mistake_book` | 错题本 |
| 游戏化 | `achievement` | 15 种成就定义 |
| 游戏化 | `user_achievement` | 用户已解锁成就 |
| 游戏化 | `user_points` | 积分 + 连胜统计 |
| 游戏化 | `leaderboard_weekly` | 周排行榜快照 |
| 游戏化 | `daily_goal` | 每日目标 |
| 游戏化 | `practice_session` | 练习会话记录 |
| 支付 | `subscription_plan` | 订阅套餐 |
| 支付 | `platform_order` | 订单表 |
| 设置 | `user_settings` | 用户偏好（30+ 字段） |
| 设置 | `parent_control` | 家长控制设置 |
| 设置 | `parent_bindings` | 家长-学生绑定关系 |
| 内容 | `learning_resource` | 视频/PDF/互动资源 |

---

## 🚀 部署指南

### 前置要求
- Docker & Docker Compose
- JDK 17+（本地开发）
- Node.js 18+（本地开发）

### 1. 配置环境变量

创建 `.env` 文件并填写：

```env
AI_API_KEY=sk-xxxxxxxx          # 通义千问 Qwen-Plus API Key
JWT_SECRET=your-256-bit-secret  # JWT 签名密钥（生产环境请用随机字符串）
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=edtech_db
REDIS_HOST=redis
SPRING_PROFILES_ACTIVE=docker
```

### 2. 一键启动（Docker）

```bash
docker-compose up -d --build
```

启动服务：

| 服务 | 端口 | 说明 |
|------|------|------|
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| RabbitMQ | 5672 / 15672 | 消息队列 / 管理界面 |
| Prometheus | 9090 | 监控 |
| Backend | 8080 | Spring Boot API |

数据库表结构由 `edtech-web/src/main/resources/sql/init.sql` 自动初始化。

### 3. 本地开发

**后端：**
```bash
mvn spring-boot:run -pl edtech-web
```

**前端：**
```bash
cd edtech-frontend
npm install
npm run dev
```

### 4. 访问地址

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端（开发模式） |
| http://localhost:8080/swagger-ui/index.html | Swagger API 文档 |
| http://localhost:9090 | Prometheus 监控 |
| http://localhost:15172 | RabbitMQ 管理界面 |

---

## 🔑 默认账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 超级管理员 | `admin` | `admin123` | 全平台管理 |
| 学生 | `student` | `123456` | 刷题、报告、设置 |
| 家长 | `parent` | `123456` | 查看孩子学习进度 |

> 首次启动后端时会自动检查并创建以上默认账号（若不存在）。

---

## 🔌 主要 API

### 认证
```
POST /api/auth/login          用户登录，返回 JWT Token
POST /api/auth/register       注册新用户
```

### 练习
```
GET  /api/practice/random     获取 OpenSAT 推荐题（Redis 缓存）
POST /api/practice/submit     提交答案（触发 BKT 更新）
POST /api/ai/generate-question  AI 单题出题（OpenSAT / Qwen 双源）
POST /api/ai/generate-batch   批量出题（R&W 27题 / Math 22题）
GET  /api/ai/explain-stream   流式 AI 解析（SSE）
POST /api/ai/exam-report      生成 SAT 考试报告
```

### 仪表盘 & 报告
```
GET /api/dashboard/radar/{studentId}       知识点掌握雷达图
GET /api/dashboard/prediction/{studentId}  考试成绩预测
GET /api/report/student/{studentId}        答题记录
GET /api/report/trend/{studentId}          正确率趋势
```

### 游戏化
```
GET  /api/achievement/all              所有成就定义
GET  /api/achievement/user/{userId}    用户已解锁成就
GET  /api/achievement/stats/{userId}   积分与连胜统计
GET  /api/leaderboard/weekly           周排行榜
GET  /api/daily-goal/today/{userId}    今日目标
GET  /api/daily-goal/calendar/{userId} 90 天热力图
```

### 支付
```
GET  /api/payment/plans              订阅套餐列表
POST /api/payment/create-order       创建订单
POST /api/payment/mock-pay/{orderNo} 模拟支付（演示）
POST /api/payment/cancel/{orderNo}   取消订单
```

### 家长
```
GET  /api/parent/children/{parentId}      绑定的孩子列表
GET  /api/parent/child-detail/{childId}   孩子学习详情
POST /api/parent/settings                 更新家长控制设置
```

### 管理后台（需 ADMIN 角色）
```
POST   /api/admin/login                    管理员登录
GET    /api/admin/dashboard                平台统计
GET    /api/admin/users                    用户列表（分页）
GET    /api/admin/knowledge-points         知识点列表
POST   /api/admin/knowledge-points         新增/编辑知识点
DELETE /api/admin/knowledge-points/{id}    删除知识点
GET    /api/admin/logs                     系统日志
```

---

## 🧮 BKT 算法说明

贝叶斯知识追踪（Bayesian Knowledge Tracing）用于实时估计学生对每个知识点的掌握概率。

**四个参数（每个知识点独立配置）：**

| 参数 | 含义 | 默认值 |
|------|------|--------|
| `p_init` P(L₀) | 初始掌握概率 | 0.1 |
| `p_transit` P(T) | 学习转移概率 | 0.1 |
| `p_guess` P(G) | 猜对概率 | 0.2 |
| `p_slip` P(S) | 会了但答错概率 | 0.1 |

**更新公式：**

```
答对后：P(L|正确) = P(L)×(1-P(S)) / [P(L)×(1-P(S)) + (1-P(L))×P(G)]
答错后：P(L|错误) = P(L)×P(S) / [P(L)×P(S) + (1-P(L))×(1-P(G))]
转移后：P(L_t+1) = 后验概率 + (1 - 后验概率) × P(T)
```

掌握概率 ≥ 0.8 视为已掌握该知识点。

---

**© 2025 EdTech Inc. All Rights Reserved.**
