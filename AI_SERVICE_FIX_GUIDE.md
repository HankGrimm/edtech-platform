# 🔧 AI服务修复完整指南

## 🚨 问题诊断

如果AI服务无法正常生成题目，请按以下步骤逐一排查：

### 1️⃣ **检查API密钥配置**

```bash
# 1. 确保.env文件存在
cp .env.example .env

# 2. 编辑.env文件，设置你的真实API密钥
# AI_API_KEY=sk-your-actual-qwen-plus-key
```

**获取API密钥步骤：**
1. 访问 https://dashscope.console.aliyun.com/
2. 登录阿里云账号
3. 开通通义千问服务
4. 创建API密钥
5. 复制密钥到.env文件

### 2️⃣ **运行诊断脚本**

```bash
# Windows用户
test-ai-service.bat

# Linux/Mac用户  
./test-ai-service.sh
```

### 3️⃣ **手动测试API连接**

```bash
# 1. 启动服务
docker-compose up -d --build

# 2. 测试AI连接
curl http://localhost:8080/api/ai/test/connection

# 3. 测试数学题目生成
curl http://localhost:8080/api/ai/test/simple-math
```

## 🔍 **常见问题解决方案**

### ❌ 问题1: "API密钥未正确配置"

**现象：** 测试接口返回CONFIG_ERROR
**解决：**
```bash
# 检查.env文件内容
cat .env | grep AI_API_KEY

# 确保格式正确（无空格，无引号）
AI_API_KEY=sk-your-actual-key
```

### ❌ 问题2: "AI API调用失败: 401"

**现象：** API返回401未授权错误
**解决：**
1. 检查API密钥是否有效
2. 确认账户余额充足
3. 验证API密钥权限

### ❌ 问题3: "AI API调用失败: 429"

**现象：** API返回429频率限制错误
**解决：**
1. 等待1-2分钟后重试
2. 检查是否有其他程序在调用API
3. 考虑升级API套餐

### ❌ 问题4: "JSON解析失败"

**现象：** AI返回内容但无法解析
**解决：**
1. 查看后端日志中的原始AI响应
2. 检查AI返回格式是否正确
3. 系统会自动降级处理

### ❌ 问题5: "网络连接超时"

**现象：** 请求超时或连接失败
**解决：**
```bash
# 测试网络连接
curl -I https://dashscope.aliyuncs.com

# 检查防火墙设置
# 确保可以访问外网API
```

## 🧪 **验证修复效果**

### 步骤1: 后端API测试
```bash
# 应该返回SUCCESS状态
curl http://localhost:8080/api/ai/test/connection

# 预期响应：
{
  "status": "SUCCESS",
  "message": "AI服务连接正常",
  "testResponse": "2"
}
```

### 步骤2: 前端页面测试
1. 访问 http://localhost:5173/practice
2. 选择科目和难度
3. 点击"🎯 生成专属题目"
4. 应该看到真实的数学题目（不是占位符）

### 步骤3: 验证题目质量
- ✅ 题目内容是真实的数学问题
- ✅ 包含正确的LaTeX公式渲染
- ✅ 不同难度生成不同复杂度的题目
- ✅ 选项设计合理，有干扰性

## 🔧 **高级调试技巧**

### 查看详细日志
```bash
# 查看后端容器日志
docker logs edtech-backend -f

# 筛选AI相关日志
docker logs edtech-backend | grep "AI动态出题"
```

### 测试不同难度
```bash
# 测试Easy难度
curl -X POST "http://localhost:8080/api/ai/generate-question" \
  -H "Content-Type: application/json" \
  -d '{"studentId":1,"subject":"数学","difficulty":"Easy"}'

# 测试Hard难度  
curl -X POST "http://localhost:8080/api/ai/generate-question" \
  -H "Content-Type: application/json" \
  -d '{"studentId":1,"subject":"数学","difficulty":"Hard"}'
```

### 前端调试
```javascript
// 浏览器控制台查看请求
// 打开开发者工具 -> Network -> XHR
// 查看 /api/ai/generate-question 请求详情
```

## 🎯 **成功标准**

当以下所有条件都满足时，AI服务修复成功：

1. ✅ 诊断脚本显示所有检查通过
2. ✅ `/api/ai/test/connection` 返回SUCCESS
3. ✅ 前端练习页面能生成真实题目
4. ✅ 题目包含正确的LaTeX公式
5. ✅ 不同难度生成明显不同的题目
6. ✅ 错误处理优雅，有友好提示

## 🆘 **仍然无法解决？**

如果按照上述步骤仍然无法解决问题，请提供以下信息：

1. **诊断脚本输出结果**
2. **后端日志（最近50行）**：`docker logs edtech-backend --tail 50`
3. **前端控制台错误信息**
4. **API测试响应内容**
5. **.env文件配置**（隐藏真实密钥）

---

**🎯 目标：** 让AI动态出题功能完美工作，生成高质量的个性化数学题目！