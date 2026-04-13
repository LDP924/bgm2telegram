# bgm2telegram

将 Bangumi 的用户时间线动态推送到 Telegram 频道

### 效果预览

![效果预览图](https://user-images.githubusercontent.com/25524750/226095791-5a45f264-b3e4-48eb-9f87-c23fd53ff29e.png)

### 使用方法

基于 [Bangumi APP](https://github.com/czy0729/Bangumi) 的 [WebHook](https://www.yuque.com/chenzhenyu-k0epm/znygb4/kfpfze0u7old4en1?singleDoc) 功能运行，仅限在 APP 内的操作才能推送。

请下载版本号不小于 7.10.0 的 Bangumi APP 并在 `设置 / 其他 / Webhook` 页面中配置部署后的 Cloudflare Pages 地址。

地址格式：`https://<域名>/api/apphook?key=<认证密钥>`

使用 Telegram 的 [@BotFather](https://t.me/BotFather) 机器人自助创建 Bot 帐号，然后将 Bot 添加为要推送频道的管理员并给予发送消息权限。

### 当前支持的 WebHook 类型

- `say`
- `collection`
- `ep`
- `mono`
- `friend`
- `group`
- `catalog`

### 环境变量

| 名称         | 必填 | 示例                            | 说明                                          |
| ------------ | ---- | ------------------------------- | --------------------------------------------- |
| BOT_TOKEN    | 是   | `12345678:ASDFGHJKSHWEUW`       | Telegram 机器人的 Bot Token                   |
| PUSH_CHANNEL | 是   | `@username` 或 `-1001234566778` | 要推送到的频道，支持 username 格式和 ID 格式  |
| AUTH_KEY     | 是   | `ABC123`                        | 认证密钥，用来防止他人调用你的 Webhook 地址   |
| NICKNAME     | 否   | `ABC123`                       | 你的昵称，不填写会默认使用 Bangumi 账户的昵称 |

### 说明

由于本人所在地区的网络环境中，原项目使用的 Vercel 部署地址存在直连受限情况，Cloudflare Workers 默认域名同样存在可达性问题，因此本 fork 改为使用 Cloudflare Pages（`pages.dev`）部署。

以上仅基于本人所在地的实际访问情况，不代表其他地区一定存在相同限制；同时也不保证 `pages.dev` 在所有地区均可稳定直连访问，请以实际网络环境为准。

### Cloudflare Pages 部署

[打开 Cloudflare 创建项目](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)

1. 进入 Cloudflare 控制台并选择 `Pages`。
2. 导入本仓库。
3. 构建命令填写 `npm run build`。
4. 构建输出目录填写 `public`。
5. 在项目设置中添加环境变量：`BOT_TOKEN`、`PUSH_CHANNEL`、`AUTH_KEY`、`NICKNAME`（可选）。
6. 部署完成后，在 Bangumi APP 中填入：`https://<你的域名>/api/apphook?key=<AUTH_KEY>`。

### 补充说明

首次创建项目时，在构建向导中填写的环境变量可能不会立即正确应用到部署环境。

如果出现 `Request failed with status code 500`，请先检查 `BOT_TOKEN`、`PUSH_CHANNEL`、`AUTH_KEY`、`NICKNAME`（可选）等环境变量是否已正确生效。必要时可前往 `Settings / Variables and Secrets` 页面重新填写或保存一次，然后重新部署。

该情况为本人实际部署过程中遇到的问题，不同环境下未必都会出现，请以实际情况为准。

---

参见 Issue：[Bangumi #88](https://github.com/czy0729/Bangumi/issues/88)
