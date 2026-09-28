# Math Cube

## English

Math Cube is a browser-based 3D mathematics game designed for desktop and mobile browsers. It is built with HTML, CSS, JavaScript and Three.js and can be hosted directly on GitHub Pages.

### Main Modes

- **Normal Mode** — Solve equations by selecting numbers on rotating 3D cubes.
- **Endless Mode** — Choose the correct answer from several choices. Questions become progressively more challenging.

### Current UI / Gameplay Features

- Responsive layout for desktop, tablet and mobile screens.
- Cyber visual theme using a focused **green → blue → purple** gradient rather than a seven-colour rainbow.
- Large, high-contrast text intended to remain readable on smaller screens and for older players.
- Home button available during gameplay.
- Normal Mode cube rotation using left/right controls and automatic rotation after inactivity.
- Normal Mode target warning uses the cube's own border: when three or more unresolved targets remain, the first unresolved cube can receive a flashing red border instead of an additional overlay or red dot.
- Calculator display follows the selected language.
- Assist drawer can be opened and closed from the Assist button.
- Golden Apples are retained as the Normal Mode level-progress indicator.
- Points system is shared by the game modes. The default maximum is 10 points.
- Points Shop supports purchases using score.
- Purchase confirmation shows the previous and new point totals.
- Game sounds are generated with the browser Web Audio API; no external sound files are required.
- Multiple interface languages are supported by the current UI, including English, Traditional Chinese, Simplified Chinese, Japanese and Korean.
- Optional character/background PNG assets can be added without changing the core game logic.

### Project Structure

```text
math-cube-redone/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── three-setup.js
│   ├── levelconfig.js
│   ├── progress.js
│   ├── apple.js
│   ├── rounds.js
│   ├── AudioManager.js
│   ├── dom.js
│   ├── i18n.js
│   ├── utils.js
│   └── secrets.js
└── assets/
    └── README.txt
```

### Running Locally

Because the project uses JavaScript modules and a Three.js import map, run it through a local web server rather than opening `index.html` directly with `file://`.

For example:

```bash
python3 -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/
```

### GitHub Pages

1. Upload the project files to a GitHub repository.
2. Keep the `index.html`, `css/`, `js/` and `assets/` paths unchanged.
3. Enable GitHub Pages for the repository.
4. Open the published Pages URL in a modern browser.

### Three.js

The project currently loads Three.js 0.160.0 from jsDelivr through the import map in `index.html`. An internet connection is therefore required unless the Three.js modules are later bundled locally.

### Optional Art Assets

See `assets/README.txt` for the recommended PNG files. The game can run without those optional images.

### Compatibility Notes

The interface is designed to work across current desktop and mobile browsers. Touch and pointer interactions are used for controls, and the layout uses responsive viewport sizing and safe-area support where available.

Avoid removing the original game modules unless their functionality is intentionally being replaced. Normal Mode contains the existing 3D game, level progression, scoring and Golden Apple systems.

---

## 繁體中文（Big5 版本另見 README_BIG5.txt）

Math Cube 是一個瀏覽器 3D 數學遊戲，適合桌面電腦、平板及手機瀏覽器使用。遊戲使用 HTML、CSS、JavaScript 及 Three.js 製作，可以直接部署到 GitHub Pages。

### 主要模式

- **普通模式** — 旋轉 3D 數字魔方，選擇數字完成算式。
- **無盡模式** — 從多個答案中選出正確答案，題目會逐步增加難度。

### 目前 UI 及遊戲功能

- 支援桌面、平板及手機的響應式畫面。
- 統一採用 **綠 → 藍 → 紫** 的 Cyber 漸變色，不使用七色彩虹配色。
- 大字體及高對比度設計，方便小屏幕及年長玩家閱讀。
- 遊戲進行中提供「首頁」按鈕。
- 普通模式可使用左右按鈕旋轉魔方，停止操作一段時間後會自動旋轉。
- 普通模式在有三個或以上未完成目標時，使用魔方本身的邊框作提示：第一個未完成目標會出現閃動紅色邊框，不再使用額外浮動紅框或紅點。
- 計算機顯示會跟隨目前選擇的語言。
- 「輔助」按鈕可以打開及關閉輔助抽屜。
- 保留 Golden Apples（金色蘋果）作為普通模式的過關進度顯示。
- 遊戲模式共用「點數」系統，預設上限為 10 點。
- 「點數商店」可以使用分數購買點數。
- 購買確認視窗會顯示購買前及購買後的點數。
- 遊戲聲效使用瀏覽器 Web Audio API 產生，不需要額外音效檔案。
- 目前介面支援英文、繁體中文、簡體中文、日文及韓文。
- 可以加入額外角色及背景 PNG，不影響核心遊戲程式。

### 專案結構

```text
math-cube-redone/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── three-setup.js
│   ├── levelconfig.js
│   ├── progress.js
│   ├── apple.js
│   ├── rounds.js
│   ├── AudioManager.js
│   ├── dom.js
│   ├── i18n.js
│   ├── utils.js
│   └── secrets.js
└── assets/
    └── README.txt
```

### 本機執行

由於遊戲使用 JavaScript Modules 及 Three.js Import Map，不建議直接以 `file://` 開啟 `index.html`。請使用本機 Web Server。

例如：

```bash
python3 -m http.server 5500
```

然後開啟：

```text
http://127.0.0.1:5500/
```

### GitHub Pages

1. 將整個專案上載至 GitHub Repository。
2. 保持 `index.html`、`css/`、`js/` 及 `assets/` 的路徑不變。
3. 在 Repository 啟用 GitHub Pages。
4. 使用現代瀏覽器開啟發布後的 Pages 網址。

### Three.js

目前專案透過 `index.html` 的 Import Map，從 jsDelivr 載入 Three.js 0.160.0。因此，如果日後沒有將 Three.js 模組改為本地檔案，遊戲需要互聯網連線才能載入 3D 引擎。

### 可選圖像素材

建議的 PNG 素材及尺寸請參閱 `assets/README.txt`。即使沒有這些可選圖片，遊戲仍然可以運作。

### 相容性注意事項

介面設計以目前常用的桌面及手機瀏覽器為目標。控制功能使用 Touch / Pointer 互動，並使用響應式 Viewport 尺寸及可用的 Safe Area 支援。

除非準備正式取代原有功能，否則不應刪除原本的遊戲模組。普通模式仍然包含原有的 3D 遊戲、關卡進度、計分及 Golden Apples 系統。
