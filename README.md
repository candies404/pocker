# Pocker
**_让每个人都有自己的 Docker 私服，Make Docker Great Again。_**

一个基于 Next.js 开发的全栈 Docker 镜像仓库管理系统，用于把 Docker Hub 上的镜像，中转到腾讯云容器镜像服务（TCR）个人版中，一键部署，从此告别 Pull 卡顿和数据安全担忧，我的 Docker 我做主。

## 快速开始
### 部署

本项目支持通过 Vercel 一键部署。

[![](https://vercel.com/button)](https://vercel.com/new/clone?s=https%3A%2F%2Fgithub.com%2Fscoful%2Fpocker&showOptionalTeamCreation=false)

### 获取环境变量

- ACCESS_KEY，本系统鉴权密钥，自己设置一个，用来登陆
- Region，建议直接填：**ap-guangzhou**
- TENCENTCLOUD_SECRET_ID，[腾讯云](https://console.cloud.tencent.com/cam) SecretId，创建一个新的，_**注：权限仅需要勾选 QcloudTCRFullAccess**_
- TENCENTCLOUD_SECRET_KEY，[腾讯云](https://console.cloud.tencent.com/cam) SecretKey，同上
- TENCENTCLOUD_PASSWORD，[腾讯云](https://console.cloud.tencent.com/tcr) 镜像容器服务页面设置的 login 密码，初始化容器镜像服务的时候会要求填。
- GITHUB_TOKEN，[GitHub](https://github.com/settings/tokens/new) 的密钥，创建一个新的，有效期建议永久， _**注：权限只需要勾选 workflow**_

### 设置Vercel环境变量
- 先一键部署[![](https://vercel.com/button)](https://vercel.com/new/clone?s=https%3A%2F%2Fgithub.com%2Fscoful%2Fpocker&showOptionalTeamCreation=false)，跑起来后
- Settings - Environment Variables，把上面获取的环境变量一个一个填好，然后重新部署一次，over，enjoy！！！

## 详细文档
- 写作ing

## 主要功能

- 🔐 密钥验证登录
- 📦 镜像仓库管理
    - 创建/删除镜像仓库
    - 批量删除仓库
    - 搜索镜像
    - 公开/私有仓库切换
- 🏷️ 标签管理
    - 查看镜像标签列表
    - 创建新标签（基于已有镜像）
    - 删除标签
    - 搜索标签
    - 批量删除标签
    - 复制标签pull地址
- 👥 命名空间管理
    - 创建/删除命名空间
    - 查看命名空间列表
- 📊 配额信息查看
  - 查看命名空间、镜像仓库、标签的已用数和总可用数对比
- ⚙️ GitHub Actions 自动化
    - 自动创建/配置 GitHub 仓库
    - 自动配置工作流
    - 查看构建日志
- 🌓 支持暗黑模式
- 🎯 新手引导功能

## 技术栈

- Next.js (Pages Router)
- Tailwind CSS
- Driver.js (新手引导)
- GitHub API
- 腾讯云 API

## 环境要求

- Node.js 16+
- 腾讯云账号密钥
- GitHub 账号密钥

## 开发

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建
npm run build

# 生产环境运行
npm start
```

## 许可证

MIT

## ❤️ 支持项目

如果这个项目对你有帮助，欢迎请作者喝杯瑞幸，一杯在手，幸运共有 ☕

<div align="center">
  <img src="http://scoful-picgo.oss-ap-southeast-1.aliyuncs.com/picgo/wx.jpg" alt="微信" width="300" />
  <img src="http://scoful-picgo.oss-ap-southeast-1.aliyuncs.com/picgo/zfb.jpg" alt="支付宝" width="300" />
</div>

## Star 趋势
[![Stargazers over time](https://starchart.cc/scoful/pocker.svg?variant=adaptive)](https://starchart.cc/scoful/pocker)

You are my ![Visitor Count](https://profile-counter.glitch.me/scoful/count.svg)th visitor
