# AI Platform API 文档

## 视觉能力

基础前缀：`/api/ai`

### 1) 人体姿态关键点

- **URL**: `POST /api/ai/vision/pose`
- **说明**: 调用阿里云人体姿态关键点能力，返回关键点坐标（若识别成功）。

请求体示例：

```json
{
  "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

成功响应示例：

```json
{
  "raw": {
    "RequestId": "xxxx",
    "Data": {
      "KeyPoints": [
        { "x": 315.1, "y": 120.4, "score": 0.98 },
        { "x": 320.3, "y": 168.9, "score": 0.96 }
      ]
    }
  },
  "keypoints": [
    { "x": 315.1, "y": 120.4, "score": 0.98 },
    { "x": 320.3, "y": 168.9, "score": 0.96 }
  ]
}
```

失败响应示例（未配置 AK/SK）：

```json
{
  "detail": "未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET"
}
```

失败响应示例（上游调用失败）：

```json
{
  "detail": "姿态识别调用失败: Aliyun RPC 调用失败: ... "
}
```

---

### 2) 动作识别

- **URL**: `POST /api/ai/vision/action`
- **说明**: 调用动作识别能力（账号/区域需开通对应服务）。

请求体示例：

```json
{
  "video_url": "https://example.com/demo.mp4"
}
```

成功响应示例：

```json
{
  "raw": {
    "RequestId": "xxxx",
    "Data": {
      "Label": "jump_rope",
      "Score": 0.93
    }
  }
}
```

失败响应示例（上游调用失败）：

```json
{
  "detail": "动作识别调用失败: Aliyun RPC 调用失败: ... "
}
```

---

### 3) 跳绳计数（简化版）

- **URL**: `POST /api/ai/skipping`
- **说明**: 单帧姿态检测 + 连续请求会话计数（简化版）。建议传 `session_id` 做多人隔离。

请求体示例：

```json
{
  "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "session_id": "student-1001",
  "reset": false
}
```

成功响应示例：

```json
{
  "session_id": "student-1001",
  "count": 12,
  "violations": ["手臂过直，建议肘部微屈"],
  "confidence": 0.9142
}
```

---

### 4) 仰卧起坐计数（简化版）

- **URL**: `POST /api/ai/situp`
- **说明**: 单帧计算头部-躯干夹角，连续请求按会话统计次数（简化版，非视频时序算法）。

请求体示例：

```json
{
  "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
  "session_id": "student-1001",
  "reset": false
}
```

成功响应示例：

```json
{
  "session_id": "student-1001",
  "count": 8,
  "quality": "good",
  "message": "起身幅度良好",
  "trunk_angle": 101.25,
  "confidence": 0.9021
}
```

---

## 环境变量

必填：

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`

可选（默认值已内置，通常无需配置）：

- `ALIYUN_VISION_MAX_RETRIES`（默认 `3`）
- `ALIYUN_VISION_RETRY_BASE_SECONDS`（默认 `0.5`）
- `ALIYUN_POSE_DOMAIN`（默认 `facebody.cn-shanghai.aliyuncs.com`）
- `ALIYUN_POSE_VERSION`（默认 `2019-12-30`）
- `ALIYUN_POSE_ACTION`（默认 `DetectBodyKeypoints`）
- `ALIYUN_ACTION_DOMAIN`（默认 `videorecog.cn-shanghai.aliyuncs.com`）
- `ALIYUN_ACTION_VERSION`（默认 `2020-03-20`）
- `ALIYUN_ACTION_ACTION`（默认 `RecognizeAction`）
- `SKIPPING_MAX_SESSIONS`（默认 `2000`）
- `SKIPPING_SESSION_TTL_SECONDS`（默认 `1800`）

## curl 联调示例

姿态识别：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/vision/pose" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\"}"
```

动作识别：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/vision/action" \
  -H "Content-Type: application/json" \
  -d "{\"video_url\":\"https://example.com/demo.mp4\"}"
```

跳绳计数：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/skipping" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

仰卧起坐计数：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/situp" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

## 错误码与错误场景

### HTTP 状态码

- `200`：请求成功（即使关键点不完整，也会返回业务结果，`confidence` 较低）
- `400`：请求参数问题或未配置 AK/SK
- `404`：调试接口不可用（如 `DEBUG != 1` 时访问 `/api/ai/skipping/stats`）
- `422`：请求体校验失败（字段缺失、类型错误）
- `502`：调用阿里云上游失败或响应解析失败

### 常见错误示例

未配置阿里云密钥（400）：

```json
{
  "detail": "未配置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET"
}
```

姿态识别上游失败（502）：

```json
{
  "detail": "姿态识别调用失败: Aliyun RPC 调用失败: ..."
}
```

动作识别上游失败（502）：

```json
{
  "detail": "动作识别调用失败: Aliyun RPC 调用失败: ..."
}
```

仰卧起坐分析失败（502）：

```json
{
  "detail": "仰卧起坐分析失败: ..."
}
```

### 前端提示映射建议

- `400`：提示“服务配置异常或请求参数错误，请联系管理员”
- `422`：提示“请求参数格式不正确，请检查后重试”
- `502`：提示“AI 服务暂时不可用，请稍后重试”
- `200` 且 `confidence < 0.5`：提示“识别置信度较低，请调整拍摄角度/光线”

## 最小联调流程（5 分钟）

### 1) 准备环境变量

在 `ai-platform` 目录复制配置文件：

```bash
cp .env.example .env
```

至少填写：

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`

联调建议：

- `DEBUG=1`（可访问 `/api/ai/skipping/stats`）

### 2) 安装依赖并启动服务

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3) 先做健康检查

```bash
curl "http://127.0.0.1:8000/health"
```

期望响应：

```json
{
  "status": "ok",
  "service": "ai-platform"
}
```

### 4) 验证姿态识别（基础能力）

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/vision/pose" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\"}"
```

### 5) 验证跳绳/仰卧起坐计数（会话模式）

使用同一个 `session_id` 连续发送多帧：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/skipping" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/situp" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

重置会话计数：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/skipping" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":true}"
```

### 6) 查看会话缓存状态（仅 DEBUG=1）

```bash
curl "http://127.0.0.1:8000/api/ai/skipping/stats"
```

可用于观察：

- 当前会话数
- 清理触发次数
- 最近会话相位/计数是否符合预期

## 最小联调流程（5 分钟）

### 1) 准备环境变量

在 `ai-platform` 目录复制配置文件：

```bash
cp .env.example .env
```

至少填写：

- `ALIYUN_ACCESS_KEY_ID`
- `ALIYUN_ACCESS_KEY_SECRET`

联调建议：

- `DEBUG=1`（可访问 `/api/ai/skipping/stats`）

### 2) 安装依赖并启动服务

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3) 先做健康检查

```bash
curl "http://127.0.0.1:8000/health"
```

期望响应：

```json
{
  "status": "ok",
  "service": "ai-platform"
}
```

### 4) 验证姿态识别（基础能力）

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/vision/pose" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\"}"
```

### 5) 验证跳绳/仰卧起坐计数（会话模式）

使用同一个 `session_id` 连续发送多帧：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/skipping" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/situp" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":false}"
```

重置会话计数：

```bash
curl -X POST "http://127.0.0.1:8000/api/ai/skipping" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"/9j/4AAQSk...\",\"session_id\":\"student-1001\",\"reset\":true}"
```

### 6) 查看会话缓存状态（仅 DEBUG=1）

```bash
curl "http://127.0.0.1:8000/api/ai/skipping/stats"
```

可用于观察：

- 当前会话数
- 清理触发次数
- 最近会话相位/计数是否符合预期
