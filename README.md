# bgm2telegram

将 Bangumi 的用户收藏时间线推送到 Telegram 频道

### 效果预览

![效果预览图](https://user-images.githubusercontent.com/25524750/226095791-5a45f264-b3e4-48eb-9f87-c23fd53ff29e.png)

### 使用方法

基于 [Bangumi APP](https://github.com/czy0729/Bangumi) 的 [WebHook](https://www.yuque.com/chenzhenyu-k0epm/znygb4/kfpfze0u7old4en1?singleDoc) 功能运行，仅限在 APP 内的操作才能推送。

请下载版本号不小于 7.10.0 的 Bangumi APP 并在 `设置 / 其他 / Webhook` 页面中配置部署后的 Cloudflare Pages 地址。

地址格式：`https://<域名>/api/apphook?key=<认证密钥>`

使用 Telegram 的 [@BotFather](https://t.me/BotFather) 机器人自助创建 Bot 帐号，然后将 Bot 添加为要推送频道的管理员并给予发送消息权限。

### 环境变量

| 名称         | 必填 | 示例                            | 说明                                          |
| ------------ | ---- | ------------------------------- | --------------------------------------------- |
| BOT_TOKEN    | 是   | `12345678:ASDFGHJKSHWEUW`       | Telegram 机器人的 Bot Token                   |
| PUSH_CHANNEL | 是   | `@username` 或 `-1001234566778` | 要推送到的频道，支持 username 格式和 ID 格式  |
| AUTH_KEY     | 是   | `ABC123`                        | 认证密钥，用来防止他人调用你的 Webhook 地址   |
| NICKNAME     | 否   | `Revincx`                       | 你的昵称，不填写会默认使用 Bangumi 账户的昵称 |

### Cloudflare Pages 部署

#### 快速入口（最接近一键）

[打开 Cloudflare 创建项目](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)

1. 进入链接后选择 `Pages`，然后导入本仓库。
2. 构建命令填写 `npm run build`。
3. 构建输出目录填写 `public`。
4. 在项目设置里添加环境变量：`BOT_TOKEN`、`PUSH_CHANNEL`、`AUTH_KEY`、`NICKNAME`（可选）。
5. 部署完成后，在 Bangumi APP 中填入：`https://<你的域名>/api/apphook?key=<AUTH_KEY>`。

#### 说明（截至 2026-04-13）

Cloudflare 官方 Deploy Button 目前仅支持 Workers 应用，不支持 Pages 项目，因此无法完全做到和 Vercel `env=` 参数那样的纯一键注入变量。

### 本地调试（可选）

```bash
npm install
cp .dev.vars.example .dev.vars
npx wrangler pages dev public
```

Windows PowerShell 可用：

```powershell
npm.cmd install
Copy-Item .dev.vars.example .dev.vars
npx wrangler pages dev public
```

---

参见 Issue：[Bangumi #88](https://github.com/czy0729/Bangumi/issues/88)

