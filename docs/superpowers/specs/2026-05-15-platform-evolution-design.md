# Platform Evolution Design — 超越 lovart.ai & liblib.tv

**Goal:** 将 photoToAIimage 从单功能工具进化为面向日本消费者和 KOL 的社交创作平台，分三阶段超越 lovart.ai（专业设计 Agent）和 liblib.tv（中文模型社区）的日本市场覆盖。

**Architecture:** 在现有 Next.js + Prisma + NextAuth 基础上，分三阶段叠加社交层、创作者工具层、AI 质量层，每阶段独立可交付。不改动现有生成流程、支付结构、数据库核心模型。

**Tech Stack:** Next.js 14 App Router, Prisma (SQLite→PostgreSQL), NextAuth v4, Gemini 2.5 Flash Image, Stripe, Cloudinary, next-intl (ja/en/zh)

---

## 竞品分析

### lovart.ai

- **定位**：AI 设计 Agent，输入文字 → 输出 PSD/FIG/SVG/视频等完整品牌物料
- **目标用户**：专业设计师、品牌团队、营销机构
- **定价**：$29–$89/月订阅制
- **护城河**：多格式输出、品牌规范感知、专业工具集成
- **弱点**：不专注人像/照片，日本市场渗透弱，无社区功能

### liblib.tv (liblib.art)

- **定位**：中国最大 AI 模型社区，12 万+ 模型，1.8 万+ ComfyUI 工作流
- **目标用户**：中文创作者、二次元爱好者、游戏美术
- **定价**：免费额度 + VIP 订阅 + LoRA 训练按次收费
- **护城河**：社区网络效应、中文本土化、国风/二次元模型深度
- **弱点**：日文社区几乎空白，操作复杂需技术知识，非照片转换专项

### 差异化定位

```
                    专业/复杂
                        ↑
           liblib ●     |
           (模型社区)    |
                        |
← 图像生成  ————————————+———————————→  照片转换/人像
                        |
                        |    ● 目标位置（Phase 3完成后）
                        |   (日本消费者+KOL的
                        |    最佳照片风格平台)
                        |
           lovart ●     ↓
                    消费者/简单
```

---

## 目标用户 & 市场

- **主市场**：日本
- **用户 A**：普通消费者 — 把照片变风格晒 Twitter/X、Instagram、LINE
- **用户 B**：内容创作者/KOL — 批量出图、风格统一、商业变现

---

## 整体进化路线图

```
现在              Phase 1           Phase 2           Phase 3
"工具"    →→→   "有社区的工具"  →→→  "创作者平台"  →→→  "质量领导者"
（3个月）         （3个月）            （4个月）
```

| | Phase 1：社交优先 | Phase 2：创作者平台 | Phase 3：质量差异化 |
|--|--|--|--|
| **核心目标** | 留住用户、驱动传播 | 锁定 KOL、创造收入 | 建立品质壁垒 |
| **成功指标** | 次日留存率 > 30% | KOL 月活 > 500 人 | 用户好评率 > 85% |
| **竞品压制** | 填补 liblib 日文空白 | 超越 lovart 照片垂直深度 | 建立 liblib 无法复制的质量口碑 |

---

## Phase 1：社交分享 & 社区画廊

### 目标

让每一张生成的图成为获客入口。用户晒图 → 好友点链接 → 注册尝试。

### P0 功能（必须上线才有效果）

| 功能 | 说明 |
|------|------|
| 作品公开开关 | 生成完成后显示"公開/非公開"切换（默认非公開） |
| 公开画廊页 `/gallery` | 瀑布流展示所有公开作品，按风格筛选，按热度/最新排序 |
| 作品详情页 `/work/[id]` | 独立 URL，显示原图缩略+风格名+点赞数+"このスタイルで試す"按钮 |
| 一键分享 | 结果页显示 Twitter/X、LINE、复制链接按钮，预填分享文案 |
| 点赞系统 | 登录用户可点赞，数量公开显示 |
| 用户主页 `/profile/[username]` | 展示该用户所有公开作品 |
| 用户名设置 | 让用户设置唯一 handle（现仅有 email） |

### P1 功能（Phase 1 后期迭代）

| 功能 | 说明 |
|------|------|
| 首页社区展示区 | 首页底部加入"みんなの作品"精选展示区块 |
| 收藏功能 | 保存他人作品到个人收藏夹 |
| 关注系统 | 关注创作者，个人主页显示关注/粉丝数 |
| 风格榜单 | 本周最热风格 Top 5 |

### 关键用户流

**生成 → 晒图（留存 + 传播）**
```
生成结果页
  └→ "公開する？"开关（默认关闭）
       └→ 开启 → 分享区出现：
            [Twitter/X で共有] [LINE で送る] [リンクをコピー]
            预填文案："〇〇スタイルで変換！ #FormaAI #AIアート"
```

**浏览画廊 → 激发尝试（新用户转化）**
```
/gallery 瀑布流
  └→ 点击作品 → 弹出详情
       └→ [このスタイルで試す →]
            └→ 跳到生成页，风格预选好
```

**外部链接 → 注册（SNS 病毒传播）**
```
Twitter 分享链接 → /work/[id]
  └→ 看到效果 + [無料で試す]
       └→ 注册 → 自动跳回生成页（风格预选）
```

### 数据模型变更

**扩展现有表：**

```prisma
// ProjectVariant 新增
isPublic    Boolean  @default(false)
title       String?
likeCount   Int      @default(0)
viewCount   Int      @default(0)

// User 新增
username    String?  @unique
bio         String?
avatarUrl   String?
```

**新增表：**

```prisma
model Like {
  id        String   @id @default(cuid())
  userId    String
  variantId String
  createdAt DateTime @default(now())
  @@unique([userId, variantId])
}

model SavedWork {
  id        String   @id @default(cuid())
  userId    String
  variantId String
  createdAt DateTime @default(now())
  @@unique([userId, variantId])
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  @@unique([followerId, followingId])
}
```

### 新增路由

| 路由 | 类型 | 说明 |
|------|------|------|
| `/[locale]/gallery` | 页面 | 公开画廊主页 |
| `/[locale]/work/[id]` | 页面 | 作品详情 + 分享落地页 |
| `/[locale]/profile/[username]` | 页面 | 用户公开主页 |
| `/api/gallery` | GET | 分页获取公开作品列表 |
| `/api/works/[id]/like` | POST/DELETE | 点赞/取消 |
| `/api/works/[id]/public` | PATCH | 切换公开状态 |

### 影响现有文件

| 文件 | 改动 |
|------|------|
| `src/components/GenerateForm.tsx` | 结果面板增加公开开关 + 分享按钮区 |
| `src/app/[locale]/page.tsx` | 首页底部增加社区展示区块（P1） |
| `prisma/schema.prisma` | 新增 3 张表 + 4 个字段 |
| `messages/{locale}.json` | 新增 gallery、profile、share 文案 |

---

## Phase 2：创作者工具套件

### 目标

让 KOL 把这个工具变成日常工作流的一部分，通过批量生成和 API 创造稳定付费需求。

### P0 功能

| 功能 | 说明 |
|------|------|
| 批量生成 `/batch` | 一次上传最多 20 张，队列处理，完成后打包下载 |
| 风格预设 | 保存生成配置（风格+尺寸+数量）为命名预设，一键复用 |
| 创作者主页增强 | 显示粉丝数、总获赞、本月生成量，作品按系列分组 |
| API Key 管理 | 生成密钥、查看用量、设置月额度上限 |

### P1 功能

| 功能 | 说明 |
|------|------|
| 公共 REST API | `POST /api/v1/generate`，支持程序化调用 |
| 预设公开分享 | 将预设公开，其他用户一键使用 |
| 系列（Series）功能 | 将多张作品归组为主题系列 |
| 数据分析面板 | 风格受欢迎度、获赞趋势、粉丝增长 |

### 关键用户流

**KOL 批量出图**
```
/batch
  └→ 拖拽上传多张照片（最多 20 张）
       └→ 选风格 + 尺寸 → [一括生成スタート]
            └→ 实时进度（1/20, 2/20...）
                 └→ 完成 → [ZIPでダウンロード] 或逐张公开
```

**预设保存复用**
```
结果页
  └→ [この設定をプリセット保存]
       └→ 输入名称"夏のアニメシリーズ"
            └→ 下次生成页：预设下拉 → 一键填入
```

**API 调用**
```
/settings/api → 生成 API Key
  └→ curl -X POST https://forma.ai/api/v1/generate \
       -H "Authorization: Bearer {key}" \
       -F "image=@photo.jpg" \
       -F "style=anime_pro"
  └→ 返回 { "imageUrl": "...", "creditsUsed": 1 }
```

### 数据模型变更

```prisma
model StylePreset {
  id        String   @id @default(cuid())
  userId    String
  name      String
  styleId   String
  outputSize String
  count     Int
  isPublic  Boolean  @default(false)
  useCount  Int      @default(0)
  createdAt DateTime @default(now())
}

model BatchJob {
  id         String   @id @default(cuid())
  userId     String
  styleId    String
  outputSize String
  status     String   // pending / processing / completed / failed
  totalCount Int
  doneCount  Int      @default(0)
  createdAt  DateTime @default(now())
  items      BatchItem[]
}

model BatchItem {
  id         String   @id @default(cuid())
  batchJobId String
  variantId  String?
  status     String   // waiting / done / failed
  inputKey   String
  job        BatchJob @relation(fields: [batchJobId], references: [id])
}

model APIKey {
  id           String    @id @default(cuid())
  userId       String
  keyHash      String    @unique
  name         String
  monthlyLimit Int       @default(100)
  usedThisMonth Int      @default(0)
  lastUsedAt   DateTime?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
}
```

**扩展现有表：**

```prisma
// User 新增
isCreator   Boolean @default(false)
socialLinks Json?

// ProjectVariant 新增
batchJobId  String?
presetId    String?
seriesId    String?
```

### 新增路由

| 路由 | 类型 | 说明 |
|------|------|------|
| `/[locale]/batch` | 页面 | 批量生成 |
| `/[locale]/presets` | 页面 | 我的预设 |
| `/[locale]/creator` | 页面 | 创作者数据面板 |
| `/[locale]/settings/api` | 页面 | API Key 管理 |
| `/api/v1/generate` | POST | 公开 REST API |
| `/api/batch` | POST | 创建批量任务 |
| `/api/batch/[id]` | GET | 查询批量进度 |
| `/api/presets` | GET/POST | 获取/创建预设 |

### 影响现有文件

| 文件 | 改动 |
|------|------|
| `src/components/GenerateForm.tsx` | 结果页增加预设保存按钮 |
| `src/app/api/generate/route.ts` | 支持 API Key 认证路径 |
| `src/lib/credits.ts` | 批量任务 credits 批量扣除逻辑 |
| `src/lib/storage/` | 支持多文件队列上传 |
| `prisma/schema.prisma` | 新增 4 张表 + 5 个字段 |
| `messages/{locale}.json` | 新增 batch、preset、creator、api 文案 |

---

## Phase 3：AI 质量差异化

### 核心理念

护城河不是"换更好的模型"，而是**让用户感觉自己在掌控 AI**。  
提供消费者友好的精细控制，比 liblib（太复杂）和 lovart（不专注人像）都做得更好。

### P0 功能

| 功能 | 说明 |
|------|------|
| 质量反馈系统 | 生成后 👍/👎，积累数据识别差评率高的风格×照片组合 |
| 风格强度滑块 | 生成前调节强度（弱/中/强），解决"变换太过/认不出脸"核心痛点 |
| 生成后精修工具 | 亮度/对比度/饱和度 + 滤镜，Canvas API 实现，不消耗 Credits |
| 人脸质量检测 | 上传后自动检测人脸，模糊/遮挡/无人脸时提前警告 |

### P1 功能

| 功能 | 说明 |
|------|------|
| 背景分离控制 | 抠出人物，单独选背景风格（自然/都市/渐变），再整体风格化 |
| 多张对比选择 | 同一张照片同时生成 2 种强度，并排比较 |
| 负面提示词 | Consumer 友好版（"不要眼镜""不要暗背景"），非技术 prompt |
| 质量排行榜 | 每种风格展示社区评分最高的 10 张，直观体现质量标准 |

### 关键用户流

**风格强度控制**
```
生成页 — 选完风格后
  └→ 滑块："スタイル強度" 弱 ←——→ 强
       每档显示示例缩略图
  └→ 生成后："強度を変えてもう一度" 一键重生成
```

**生成后精修**
```
结果页
  └→ [かんたん編集] 展开：
       ☀️ 明るさ / 🎨 鮮やかさ / 🌡️ 暖かさ
       フィルター: [ナチュラル][ビビッド][マット][クール]
       实时预览 → [保存]（不消耗 Credits）
```

**质量反馈**
```
结果页（生成 5 秒后出现）：
  "この結果はいかがでしたか？"
  [👍 いい感じ] [👎 イマイチ]
    └→ 👎 → 选原因：顔が変わりすぎた / スタイルが弱い / 画質が粗い
  └→ 汇总到管理后台 → 识别差评率高风格 → 优化 prompt
```

### 数据模型变更

```prisma
model GenerationFeedback {
  id        String   @id @default(cuid())
  variantId String
  userId    String?
  rating    String   // positive / negative
  reason    String?
  createdAt DateTime @default(now())
}

model QualityMetrics {
  id         String   @id @default(cuid())
  styleId    String   @unique
  avgRating  Float
  totalCount Int
  updatedAt  DateTime @updatedAt
}
```

**扩展现有表：**

```prisma
// Project 新增
styleStrength Float?  // 0.3 ~ 1.0, default: 0.7
bgRemoved     Boolean @default(false)

// ProjectVariant 新增
refinements   Json?   // { brightness, saturation, warmth, filter }
refinedUrl    String?
```

### 新增路由

| 路由 | 类型 | 说明 |
|------|------|------|
| `/api/works/[id]/feedback` | POST | 提交质量反馈 |
| `/api/works/[id]/refine` | POST | 应用精修参数 |
| `/api/admin/quality` | GET | 管理后台质量数据 |

### 影响现有文件

| 文件 | 改动 |
|------|------|
| `src/components/GenerateForm.tsx` | 增加强度滑块 + 人脸检测提示 + 精修面板 |
| `src/app/api/generate/route.ts` | 接收 `styleStrength` 参数 |
| `src/lib/providers/gemini-image.ts` | 根据强度动态调整 prompt |
| `src/lib/prompts.ts` | 每种风格增加强/弱两套 prompt 变体 |
| `prisma/schema.prisma` | 新增 2 张表 + 4 个字段 |
| `messages/{locale}.json` | 新增 quality、refine、feedback 文案 |

---

## 数据库变更汇总（三阶段）

| 阶段 | 新增表 | 新增字段 |
|------|--------|----------|
| Phase 1 | Like, SavedWork, Follow | ProjectVariant×4, User×3 |
| Phase 2 | StylePreset, BatchJob, BatchItem, APIKey | User×2, ProjectVariant×3 |
| Phase 3 | GenerationFeedback, QualityMetrics | Project×2, ProjectVariant×2 |
| **合计** | **9 张新表** | **16 个新字段** |

---

## 实施原则

- **不改动现有生成流程、rate limit、analytics、水印、安全检查**
- **不删除 Fal / HuggingFace / Mock provider 逻辑**
- **不改动支付结构和 Stripe 集成**
- **每个 Phase 独立可上线**，不依赖下一 Phase
- **数据库迁移**每个 Phase 各执行一次 `prisma migrate dev`
- **Safety block（safetyBlocked）不得 fall-through 到下一个 provider**

---

## 成功指标

| 指标 | Phase 1 目标 | Phase 2 目标 | Phase 3 目标 |
|------|-------------|-------------|-------------|
| 次日留存率 | > 30% | > 40% | > 50% |
| 月活用户 | 1,000+ | 5,000+ | 20,000+ |
| 付费转化率 | 5% | 10% | 15% |
| KOL 月活 | — | 500+ | 2,000+ |
| 用户好评率 | — | — | > 85% |
| SNS 分享数/月 | 500+ | 2,000+ | 10,000+ |
