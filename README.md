# VVebo Shadowrocket 实验修复

此项目是实验性的 UID 传递方案，并非经验证的完整修复。

## 安装

1. 在 GitHub 用户 ILFPhilK 下新建公开仓库 `vvebo-fix`，默认分支为 `main`。
2. 将 `VVebo.sgmodule` 和 `vvebo-uid-fix.js` 上传至仓库根目录。
3. 在 Shadowrocket 的配置 > 模块中添加链接：
   `https://raw.githubusercontent.com/ILFPhilK/vvebo-fix/main/VVebo.sgmodule`
4. 关闭原 VVebo 模块，启用本模块，并确保 `api.weibo.cn` 的 HTTPS 解密生效。

## 注意

- 此版本在 `/2/users/show` 读取 UID，在 `/2/statuses/user_timeline` 缺少 UID 时补充。
- 此版本未完整合并原作者 `user_timeline` 请求修复逻辑，因此可能仍无法恢复他人主页。
- 使用单个持久化 UID，快速切换多个用户或并发请求可能关联错误；仅适合初步排查。
- 远程脚本会接触匹配的请求 URL，请自行审阅并谨慎开启 HTTPS 解密。
