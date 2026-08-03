# LoonResources

## 余杭人才码签到

脚本通过 BoxJs 管理多账户 `oldTokens`，无需在 token 变化时修改或更新 JavaScript。

### BoxJs 配置

在 BoxJs 中添加下面的订阅地址：

```text
https://raw.githubusercontent.com/sdualasijia/LoonResources/main/yuhang_talent.boxjs.json
```

打开“余杭人才码签到”，在 `oldTokens（多账户）` 中输入 token。多个账户使用 `@` 分隔，顺序需要和脚本中的 `names` 保持一致：

```text
token1@token2
```

保存后，Loon 定时任务会从持久化存储读取最新 token。

### Loon 定时任务

```ini
[Script]
cron "1 0 * * *" script-path=https://raw.githubusercontent.com/sdualasijia/LoonResources/main/yuhang_talent_sign_multi.js, timeout=120, tag=余杭人才码签到
```

token 属于敏感数据，请勿分享 BoxJs 配置、备份或包含 token 的日志截图。
