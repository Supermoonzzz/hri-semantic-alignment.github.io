# HRI Semantic Alignment Prototype  
# 服务机器人多模态语义对齐原型

中文 | [English](README.md)

这是一个用于展示**服务机器人多模态语义对齐**的网页原型。系统结合了多模态感知、家庭语义地图、语义歧义澄清、任务规划和机器人执行动画。

在线访问地址：

```txt
https://hri-semantic-alignment.github.io/
```

## 项目概述

系统包含两个主要页面：

1. `index.html`  
   多模态采集页。用于采集用户姿态、表情和语音，并通过 `BroadcastChannel` / `localStorage` 广播动态语义状态池。

2. `semantic_home_scene.html`  
   家庭语义地图页。用于接收多模态状态，结合家庭语义地图进行澄清、任务规划与机器人执行动画。

## 项目目录结构

```txt
project/
  index.html
  semantic_home_scene.html
  README.md
  README.zh-CN.md
  .nojekyll
  .gitignore

  src/
    bridge/
      stateBridge.js

    perception/
      poseTracker.js
      faceTracker.js
      speechTracker.js

    map/
      semanticMap.js
      mapRenderer.js

    planner/
      llmPlanner.js
      ruleValidator.js
      taskParser.js

    robot/
      robotExecutor.js
      robotStateMachine.js

    ui/
      dom.js
      panels.js
      clarificationDock.js
      sceneBootstrap.js

  styles/
    base.css
    index.css
    scene.css

  semantic_map_examples/
    README.md
    semantic_map_schema_note.json
    examples/
      00_home_household_general.json
      01_kitchen_meal_prep.json
      02_home_office_study.json
      03_living_room_assistance.json
      04_entryway_outing.json
      05_cleaning_laundry.json
      06_first_aid_care.json
      07_children_activity_cleanup.json
```

## 如何使用

### 1. 打开网页

访问：

```txt
https://hri-semantic-alignment.github.io/
```

首页 `index.html` 是多模态采集页，支持：

- 基于 PoseNet 的姿态检测；
- 基于 face-api.js 的表情识别；
- 基于浏览器 `SpeechRecognition` / `webkitSpeechRecognition` 的语音识别；
- 动态语义状态池广播。

点击页面入口按钮，即可打开 `semantic_home_scene.html`。

### 2. 使用多模态输入

系统支持以下输入方式：

- **姿态输入**：抬手、指向左侧、指向右侧、伸手接取等；
- **表情输入**：neutral、happy、sad、angry、surprised 等；
- **语音输入**：通过浏览器语音识别输入自然语言指令；
- **文字输入**：在 `semantic_home_scene.html` 右侧控制台直接输入文字指令。

示例指令：

```txt
把电视遥控器拿给我
把手机充电器拿到客厅
把钥匙串拿给我
把纸巾盒拿到茶几
把签字笔放回书房
```

系统会展示：

```txt
用户输入
→ 语义地图对象匹配
→ 判断是否存在歧义
→ 主动澄清或生成任务计划
→ 机器人拿取、递送、移动或归位
→ 更新语义地图中的对象位置
```

## 语义地图示例

`semantic_home_scene.html` 支持上传自定义语义地图 JSON。

示例语义地图位于：

```txt
semantic_map_examples/examples/
```

目前包含以下案例：

```txt
00_home_household_general.json       普通家庭综合场景
01_kitchen_meal_prep.json            厨房备餐场景
02_home_office_study.json            书房办公场景
03_living_room_assistance.json       客厅辅助场景
04_entryway_outing.json              玄关出门场景
05_cleaning_laundry.json             清洁洗衣场景
06_first_aid_care.json               家庭护理物品场景
07_children_activity_cleanup.json    儿童活动整理场景
```

当前页面布局使用固定房间 key：

```txt
kitchen / dining / living / study / bathroom / cabinet / user
```

如果需要自定义地图，建议保留这些 key，只修改 `label`、`aliases` 和 `objects` 内容。

## 本地运行

不要直接双击 HTML 文件。建议在项目根目录启动本地静态服务器：

```bash
python3 -m http.server 8000
```

然后访问：

```txt
http://localhost:8000/
```

## GitHub Pages 部署

本项目可以直接通过 GitHub Pages 访问。

当前在线地址：

```txt
https://hri-semantic-alignment.github.io/
```

如果你需要自行部署：

1. 新建 GitHub 仓库；
2. 上传本项目所有文件到仓库根目录；
3. 进入仓库 `Settings → Pages`；
4. Source 选择 `Deploy from a branch`；
5. Branch 选择 `main`，目录选择 `/root`；
6. 保存后访问你的 GitHub Pages 地址。

## 浏览器说明

- 摄像头和麦克风需要 HTTPS 或 localhost；
- 推荐使用 Chrome / Edge；
- 语音识别依赖浏览器的 `SpeechRecognition` / `webkitSpeechRecognition`；
- 首次使用时，浏览器会请求摄像头和麦克风权限。

## DeepSeek 后端代理

当前版本已提供 Vercel Serverless Function 代理，文件位于：

```txt
api/deepseek-plan.js
```

前端不会保存真实 DeepSeek API Key。推理链路为：

```txt
GitHub Pages / Vercel 前端 → /api/deepseek-plan → DeepSeek API
```

部署到 Vercel 后，在项目环境变量中配置：

```txt
DEEPSEEK_API_KEY=你的 DeepSeek Key
DEEPSEEK_MODEL=deepseek-v4-flash
HRI_PROXY_TOKEN=自定义随机代理口令
ALLOWED_ORIGINS=https://supermoonzzz.github.io,http://localhost:8000
```

如果整个项目部署在 Vercel，前端会自动调用同域的 `/api/deepseek-plan`。

当前 GitHub Pages 前端已默认接入旅行目的地决策助手 Vercel 项目中的 HRI 专用代理。该代理复用旅行项目的 DeepSeek 配置，并要求填写代理访问口令：

```txt
https://travel-destination-agent-demo-verce.vercel.app/api/hri-plan
```

如果需要切换到其他代理，也可以在场景页填写并保存新的 Vercel 代理地址和对应访问口令，例如：

```txt
https://your-app.vercel.app/api/deepseek-plan
```

## 联系方式

如有任何问题，欢迎联系：

```txt
wyufeng@zju.edu.cn
```
