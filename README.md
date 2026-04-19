# Ping

Demo is deployed at: [418Hack on Railway](https://418hack-production.up.railway.app/)

---

## English

### Project Introduction

Ping is a location-based emotional moment-sharing product. Our mission is not to let you endlessly scroll through videos, but to let you encounter a "moment that understands you." When you arrive at a specific place, Ping shows you the emotions and messages others have left there. Opening one is like having a meaningful connection with someone who understands that moment.

### Why We Need Ping

Current information streams are overwhelming, but the content often feels distant from individual experiences. We aim to create a new type of content tied to **scenes**—not consumed immediately but becoming meaningful in specific locations. Imagine revisiting your campus years later; it's in those familiar corners, under that specific tree, where your past emotions truly make sense.

### Key Features

1. **Scene-Based Content Cards**:
    - Discover Pings within 500m heatmaps but without precise points, ensuring privacy.
    - Unlock content only when you're within 50m of its location for an immersive experience.

2. **Mirage Pings**:
    - "Read once and forget" content that vanishes after opening, capturing ephemeral but authentic feelings.

3. **AI Monthly Reports**:
    - AI collates one-month Pings into an emotional summary, guiding self-reflection and helping you revisit personal changes.

### Demo Walkthrough

1. Upon system login, users can view their current location and surrounding Pings within a 500m radius as heatmaps.
2. Create a new Ping at your present location: e.g., "To my future self: Don't be afraid; things will get better."
3. The newly created Ping will be displayed in the list, with notifications if you're not within 50m to unlock it.
4. When you're close enough to a Ping, it appears as an interactive map marker. Clicking it reveals its full content.
5. Mirage Pings provide a “read-once” experience; after viewing, they disappear forever.

### Usage Instructions

1. Clone the repository:
    
    ```bash
    git clone https://github.com/shantu246/418hack.git
    cd 418hack
    ```

2. Install dependencies:
    
    ```bash
    npm install
    ```

3. Start the development server:
    
    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000) to interact with the demo.

5. For best location accuracy, use a mobile hotspot or browser with access to location services.

### Vision and Future Steps

We believe the future of information isn't just video streams but **"scene cards."** Ping is pioneering this format by delivering content specific to a place, connected to personal emotions and choices. 

Next steps include:
- Enhanced AI recommendations and content moderation.
- Stronger management and operational mechanisms.

---

## 中文

### 项目介绍

Ping 是一款基于位置的情感瞬间分享产品。我们的使命不是让用户刷无尽的视频，而是在刷到的一刻感受到“被理解的瞬间”。当你走到某个地方，它会显示别人留给这个地方的情绪和信息，打开它，就像经历了一次深刻的理解与相遇。

### 为什么需要 Ping

当下的信息流虽然强大，但很多内容和个人的生活场景无关。我们希望创造一种新的内容单元：不求即时消耗，而是在特定场景中倍显意义。设想几年后回到校园的某个角落，只有在那里，你的某段情感才真正成立。

### 核心功能

1. **基于场景的内容卡片**：
    - 500m 范围热力图显示周边 Ping，不暴露精确点位，确保隐私。
    - 到达 50m 内可解锁具体内容，增强用户沉浸感。

2. **幻影 Ping**：
    - "阅后即焚"分享，内容打开后立即消失，打造真实且触动的体验。

3. **AI 月报**：
    - AI 会汇总用户一个月的 Ping，生成情绪总结，帮助用户回顾变化，记录成长。

### 演示流程

1. 登录系统后，可查看当前位置及 500m 热力图内的 Ping。
2. 在当前位置创建新 Ping，例如：“给三年后的我：别害怕，你会越来越好。”
3. 刚创建的 Ping 列表会有提醒，需靠近到 50m 内时才能解锁。
4. 当用户接近 Ping 时，地图会标出可交互标记，点击可查看完整内容。
5. 幻影 Ping 提供“只读一次”的体验，打开后自动焚毁。

### 使用方法

1. 克隆仓库:
    
    ```bash
    git clone https://github.com/shantu246/418hack.git
    cd 418hack
    ```

2. 安装依赖:
    
    ```bash
    npm install
    ```

3. 启动开发服务器:
    
    ```bash
    npm run dev
    ```

4. 打开 [http://localhost:3000](http://localhost:3000) 体验演示。

5. 为确保定位准确性，建议配合手机热点或具有定位权限的浏览器使用。

### 愿景与未来计划

我们相信，未来的信息流不仅限于视频，还应包括基于场景卡片的新内容形态。Ping 是开拓者，它让地点为你传递情感与选择。

未来计划包括：
- 强化推荐与审核机制，提高内容质量。
- 完善管理和运营策略，增强服务能力。