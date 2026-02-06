# 🪁 Basant Midnight Master

**Basant Midnight Master** is a high-fidelity, skill-based kite-flying simulator that brings the vibrant tradition of South Asian "Basant" festivals to the web. Set against a neon-lit midnight skyline, players engage in "Pecha" (kite duels) where the goal is to cut the opponent's string using superior physics, timing, and positioning.

## 🌟 Key Features

### 🕹️ Skill-Based Gameplay
*   **Realistic Physics**: String tension, wind drag, and gravity-defying kite movement simulated on HTML5 Canvas.
*   **The "Pecha" Mechanic**: A sophisticated collision system that detects when strings overlap. Success depends on your height advantage and "Boost" timing.
*   **Boost System**: Use a high-intensity charge to increase string friction and cut opponents during a duel.

### 🌐 Peer-to-Peer Multiplayer
*   **Serverless Architecture**: Built using **PeerJS (WebRTC)**. No central game server is required; players connect directly to each other for low-latency combat.
*   **Host-Authoritative Logic**: The "Host" player acts as the source of truth, managing physics and collision detection to ensure a fair and synchronized experience for all connected guests.

### 🤖 Solo Practice Mode
*   **AI Opponents**: Face off against 4 unique AI bots.
*   **Balanced Difficulty**: AI behaviors are tuned to provide a challenge without being overwhelming, allowing new pilots to master the art of the "Kho-ooch!" (the victory cry).

## 🎮 How to Play

### Controls
*   **Movement**: Use the **Virtual Joystick** (Touch) or **WASD/Arrow Keys** (Keyboard) to navigate the sky.
*   **Boost**: Press the **Bolt Button** (Touch) or **Spacebar** (Keyboard) to activate your attack state during a Pecha.
*   **Objective**: Fly higher than your opponent. When your strings cross, wait for the sparks, then activate your **Boost** to cut their string.

### Game Modes
1.  **Solo Practice**: Refine your skills against automated bots. You start with a significant height advantage to learn the mechanics.
2.  **Live Battle**: 
    *   **Host**: Create a room and share the 5-digit Room ID with a friend.
    *   **Join**: Enter a friend's Room ID to connect directly to their session.

## 🛠️ Technical Stack
*   **Frontend**: React 19 + TypeScript.
*   **Styling**: Tailwind CSS for a sleek "Midnight" UI with backdrop blurs and neon accents.
*   **Rendering**: High-performance 2D Canvas API for smooth 60FPS kite movement.
*   **Networking**: PeerJS for decentralized, browser-to-browser communication.

## 🎨 Design Philosophy
The game is designed with a "Neon-Traditional" aesthetic. It pairs the ancient cultural joy of kite flying with a modern, cyberpunk-inspired midnight setting. The UI is focused on clarity, providing real-time feedback on string tension, wind direction, and boost cooldowns.

---
*Created by Saifullah Anwar with ❤️*
