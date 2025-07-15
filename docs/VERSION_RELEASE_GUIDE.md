# Pocker 版本发布与自动更新指南

## 📋 目录
- [作者发布新版本流程](#作者发布新版本流程)
- [自动更新底层逻辑](#自动更新底层逻辑)
- [用户自动更新配置](#用户自动更新配置)
- [故障排除](#故障排除)

## 🚀 作者发布新版本流程

### 1. 版本号更新
作者需要同时更新两个文件中的版本号：

```bash
# 1. 更新应用版本号
src/config/version.js
export const APP_CONFIG = {
    version: 'v0.2.3', // 更新这里
    // ...
};

# 2. 更新包版本号
package.json
{
    "version": "0.2.3", // 更新这里
    // ...
}
```

### 2. 创建Git Tag
```bash
# 提交代码
git add .
git commit -m "Release v0.2.3: 新功能描述"

# 创建并推送tag
git tag v0.2.3
git push origin v0.2.3
git push origin main
```

### 3. 版本发布检查清单
- [ ] 更新 `src/config/version.js` 中的版本号
- [ ] 更新 `package.json` 中的版本号
- [ ] 确保版本号格式为 `v主版本.次版本.修订版本`
- [ ] 创建对应的Git Tag
- [ ] 推送代码和Tag到GitHub
- [ ] 验证GitHub Tags页面显示新版本

## 🔄 自动更新底层逻辑

### 架构概览
```
用户应用 → 版本检查 → GitHub API → 自动更新工作流 → 代码同步
```

### 1. 版本检查机制

#### 触发时机
- 用户访问应用时自动检查
- 使用 `useVersionCheck` Hook

#### 检查流程
```javascript
// src/hooks/useVersionCheck.js
1. 调用 /api/github/latest-tag 接口
2. 获取当前版本：APP_CONFIG.version
3. 获取最新版本：GitHub API tags[0].name
4. 语义化版本比较（major.minor.patch）
5. 如果有新版本且未在24小时内关闭过通知，显示更新提示
```

#### 版本比较算法
```javascript
// 示例：当前 v0.2.1，最新 v0.2.3
const currentParts = ['0', '2', '1'];
const latestParts = ['0', '2', '3'];

// 逐位比较：0=0, 2=2, 1<3 → 需要更新
```

### 2. 自动更新工作流

#### GitHub Actions配置
文件位置：`.github/workflows/auto-update.yml`

#### 工作流触发条件
```yaml
on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时执行一次
  workflow_dispatch:        # 手动触发
```

#### 核心同步逻辑
```bash
# 1. 检查是否需要同步
git clone https://github.com/scoful/pocker.git temp
UPSTREAM_HASH=$(sha256sum temp/src/config/version.js | awk '{print $1}')
LOCAL_HASH=$(sha256sum src/config/version.js | awk '{print $1}')

# 2. 如果hash不同，执行同步
if [ "$UPSTREAM_HASH" != "$LOCAL_HASH" ]; then
    # 备份自动更新工作流
    cp .github/workflows/auto-update.yml /tmp/auto-update.yml
    
    # 清空当前目录（保留.git）
    find . -maxdepth 1 -not -path './.git' -not -path . -exec rm -rf {} \;
    
    # 同步上游代码
    rsync -av --exclude='.git' --exclude='.github/workflows/auto-update.yml' temp/ .
    
    # 恢复自动更新工作流
    mkdir -p .github/workflows && mv /tmp/auto-update.yml .github/workflows/auto-update.yml
    
    # 提交更改
    git add .
    git commit -m "Sync with scoful/pocker"
    git push origin main
fi
```

### 3. 关键设计原则

#### 防止自引用
```bash
# 检查上游仓库是否为自己
UPSTREAM_REPO="scoful/pocker"
CURRENT_REPO="${{github.repository}}"
if [ "$UPSTREAM_REPO" = "$CURRENT_REPO" ]; then
    echo "Self-reference detected. Aborting workflow."
    exit 0
fi
```

#### 保护关键文件
- 自动更新工作流文件不会被覆盖
- 确保用户的自动更新配置不丢失

#### 错误处理
- 同步失败时自动创建Issue
- 包含详细的错误日志
- 自动关闭之前的失败Issue

## 👥 用户自动更新配置

### 1. 在应用中配置
1. 访问"GitHub配置"页面
2. 点击"配置自动更新"
3. 输入仓库名称（格式：`repository-name`）
4. 系统自动检查仓库存在性
5. 自动创建自动更新工作流


### 2. 配置验证
系统会自动验证：
- 仓库是否存在
- 是否有写入权限
- 工作流是否正确创建

## 🔧 故障排除

### 常见问题

#### 1. 版本检查失败
**症状**：不显示更新通知
**原因**：
- GitHub API限制
- 网络连接问题
- Token权限不足

**解决方案**：
```javascript
// 检查控制台错误日志
console.error('Failed to check version:', error);
```

#### 2. 自动更新失败
**症状**：GitHub Actions工作流失败
**原因**：
- 权限不足
- 仓库不存在
- 网络问题

**解决方案**：
- 检查GitHub Actions日志
- 验证Token权限
- 查看自动创建的Issue

#### 3. 版本号不匹配
**症状**：显示错误的版本信息
**原因**：
- `src/config/version.js` 与 `package.json` 版本不一致
- Git Tag格式错误

**解决方案**：
```bash
# 确保版本号格式一致
src/config/version.js: 'v0.2.3'
package.json: '0.2.3'
Git Tag: v0.2.3
```

### 调试工具

#### 1. 版本检查API
```bash
# 手动测试版本检查
curl -X GET "https://your-app.vercel.app/api/github/latest-tag"
```

#### 2. 本地测试
```javascript
// 在浏览器控制台测试
localStorage.removeItem('pocker_update_notification_dismissed_at');
// 刷新页面查看是否显示更新通知
```

#### 3. 工作流日志
- 访问GitHub仓库的Actions页面
- 查看具体的工作流执行日志
- 检查失败步骤的详细信息

## 📝 最佳实践

### 作者发布
1. 遵循语义化版本规范
2. 每次发布都要创建对应的Git Tag
3. 确保版本号在所有文件中保持一致
4. 发布前在测试环境验证功能

### 用户配置
1. 使用私有仓库保护代码安全
2. 定期检查自动更新工作流状态
3. 关注GitHub Issues中的同步失败通知
4. 备份重要的自定义配置

### 监控维护
1. 定期检查GitHub API使用限制
2. 监控自动更新工作流的成功率
3. 及时处理用户反馈的更新问题
4. 保持文档的及时更新
