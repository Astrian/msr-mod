# MSR Mod
*海量泰拉金曲，全无广告干扰（逃*

MSR Mod 是一款用于「塞壬唱片」官网（monster-siren.hypergryph.com）的替代前端（alternate frontend）。安装后访问塞壬官网可自动重定向至扩展（可在偏好设置中关闭），为其提供更现代的用户界面以及强大的音乐播放队列、星标和歌单等管理功能。

## 开发 & 打包
- 安装 Node 与 npm（在 22 版本测试通过）
- Clone 本项目至本地
- `npm run dev:refresh` 以刷新开发用 `dist` 文件夹
- `npm i` 并进行 `npm run dev` 以开启 Chromium 适用的测试前端
- 在 Chromium 浏览器中加载 `dist` 文件夹
- 使用 `npm run build:chrome` 或 `npm run build:firefox` 构建对应浏览器版本的扩展程序或附加组件

## 隐私协议 & 版权声明
MSR Mod 仅与特定的服务器进行交互，譬如由鹰角网络设立的后端服务器及媒体资源服务器等。同时，您在 MSR Mod 中的部分行为（包括星标、建立歌单等）可根据情况提交至 MSR Mod 的服务器。这些数据将根据您的特定偏好设置公开或隐藏。MSR Mod 不会主动将您的数据汇报给任何第三方，也将利用行业标准保护您的个人信息不被泄露。

「鹰角网络」、「塞壬唱片」或其他相关商标是鹰角网络在中国大陆和（或）其他地区的注册商标。MSR Mod 与鹰角网络无任何关联。