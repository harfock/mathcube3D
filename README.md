# Math Cube Puzzle

A 3D spatial math puzzle game where you observe a rotating cube, deduce hidden equations, and click the correct number blocks to solve them. Built with Three.js and the native Web Audio API.

---

## Features

### English
*   **3D Spatial Puzzle:** Interact with a hollow 3x3x3 cube (26 blocks) in a fully rotatable 3D space.
*   **Dynamic Equations:** Solve masked equations using mixed operators (+, -, ×, ÷). The number of operators scales from 1 to 4 based on the level tier.
*   **Multi-Path Solutions:** Equations are not fixed paths. For example, `? + ? = 8` can be solved by clicking 3 and 5, or 2 and 6.
*   **Smart Progression:** 20 levels across 4 difficulty tiers. Early levels use blanks to reduce clicks; later levels introduce negative numbers, complex chains, and division.
*   **Reward System:** Earn stars based on time and accuracy. Beating your personal best time grants a permanent bonus hint for all future levels.
*   **Golden Apple Collection:** Every level won adds a slender, shiny golden apple to a 3D pyramid stack on the main menu.
*   **Procedural Audio:** All sound effects are synthesized in real-time using the native Web Audio API (no external audio files).
*   **Modern UI:** A sleek, non-rectangular interface with organic shapes, fluid animations, and a cinematic victory sequence.

### 中文 (Traditional Chinese)
*   **3D 空間益智：** 在完全可旋轉的 3D 空間中，與中空的 3x3x3 方塊（26 個方塊）進行互動。
*   **動態方程式：** 解開遮罩方程式，支援混合運算符（+、-、×、÷）。運算符數量會根據關卡層級從 1 到 4 遞增。
*   **多路徑解法：** 方程式沒有固定路徑。例如 `? + ? = 8` 可以透過點擊 3 和 5，或 2 和 6 來解答。
*   **智能難度遞進：** 共 20 個關卡，分為 4 個難度層級。早期關卡會留白以減少點擊次數；後期關卡會引入負數、複雜鏈式運算和除法。
*   **獎勵系統：** 根據時間和準確度賺取星星。打破個人最佳紀錄可為所有未來關卡永久增加額外提示。
*   **金蘋果收集：** 每贏得一個關卡，都會在主選單的 3D 金字塔堆疊中增加一顆纖細閃亮的金蘋果。
*   **程式化音效：** 所有音效均使用原生 Web Audio API 即時合成（無需外部音訊檔案）。
*   **現代化 UI：** 流暢的非矩形介面，採用有機形狀、流體動畫，以及電影級的勝利過場動畫。

---

## How to Play

### English
1.  **Observe:** Look at the masked equation at the top of the screen (e.g., `? + ? × ? = 15`).
2.  **Rotate:** Drag the mouse to rotate the 3D cube and find the numbers. You can also use the **Arrow Keys** or **WASD** to rotate the view.
3.  **Deduce & Click:** Figure out which numbers fit the equation and click the corresponding blocks. The red dot indicates the starting block.
4.  **Calculator Aid:** For equations with 3 or more numbers, a calculator sidebar will appear after you select two blocks, showing their running total to help you find the last number.
5.  **Hints:** If you are stuck, click the hexagonal **HINT** button. It will highlight a correct block but adds a **10-second penalty** to your time. You start with 3 hints, plus 1 bonus hint for every personal record you break.
6.  **Win:** Complete all rounds to trigger the golden apple cinematic. Your score, time, and stars will be saved.

### 中文 (Traditional Chinese)
1.  **觀察：** 查看螢幕上方的遮罩方程式（例如 `? + ? × ? = 15`）。
2.  **旋轉：** 拖曳滑鼠旋轉 3D 方塊以尋找數字。您也可以使用 **方向鍵** 或 **WASD** 來旋轉視角。
3.  **推導與點擊：** 找出符合方程式的數字，並點擊對應的方塊。紅點會指示起始方塊的位置。
4.  **計算機輔助：** 對於包含 3 個或以上數字的方程式，當您選擇兩個方塊後，側邊欄會出現計算機，顯示目前的運算結果，幫助您找出最後一個數字。
5.  **提示：** 如果卡關，請點擊六角形的 **HINT（提示）** 按鈕。它會高亮顯示一個正確的方塊，但會為您的時間增加 **10 秒的懲罰**。您初始擁有 3 次提示，每打破一次個人紀錄可額外獲得 1 次提示。
6.  **勝利：** 完成所有回合即可觸發金蘋果過場動畫。您的分數、時間和星星將會被儲存。

---

## Tech Stack

*   **Rendering:** Three.js (r160)
*   **Audio:** Native Web Audio API (Custom `AudioManager.js` chiptune synthesizer)
*   **Language:** Vanilla JavaScript (ES Modules)
*   **Styling:** CSS3 (Organic shapes, backdrop filters, animations)

---

## Setup and Installation

Because the game uses ES Modules (`import`), it cannot be run directly by opening the HTML file in a browser (the `file://` protocol blocks module loading). You must serve it via a local web server.

### Option 1: Python (Easiest)
If you have Python installed, open your terminal in the project folder and run:
```bash
# Python 3
python3 -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```
Then open your browser and go to `http://localhost:5500`.

### Option 2: Node.js (http-server)
If you have Node.js installed:
```bash
npx http-server -p 5500
```
Then open your browser and go to `http://localhost:5500`.

### Option 3: VS Code Live Server
If you use Visual Studio Code, install the **Live Server** extension, right-click `index.html`, and select "Open with Live Server".

---

## Project Structure

```text
math-cube-puzzle/
├── index.html          # Main game file (HTML, CSS, and Game Logic)
├── js/
│   └── AudioManager.js # Procedural audio synthesizer
└── README.md           # This file
```

---

## Controls

*   **Mouse / Touch:** Drag to rotate the cube. Click to select blocks.
*   **Keyboard:** 
    *   `W` / `Up Arrow`: Rotate camera up.
    *   `S` / `Down Arrow`: Rotate camera down.
    *   `A` / `Left Arrow`: Rotate camera left.
    *   `D` / `Right Arrow`: Rotate camera right.
*   **UI:** Click the hexagonal buttons to use hints or navigate menus.

---

## License

This project is open-source and available for educational and personal use.
