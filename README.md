# Jelly Lab Chain Game

2050 × 012S 的 Jelly Lab 6×6 自動連鎖消除遊戲。按下 **START EXPERIMENT**，讓 Jelly 集合、發光、POP、掉落，再連成下一個 Combo。

## Overview

Phase 1 為完整可玩的本機體驗：React + TypeScript strict + Vite，獨立 TypeScript 引擎，沒有後端、登入或正式交易。**PLAY、POINTS 與 Reward Shop 皆為 Phase 1 Local Mock，不是正式會員資產。**

## Gameplay

每個新瀏覽器存檔有 10 PLAY。啟動一局消耗 1 PLAY，生成盤面後自動處理所有連鎖，最後顯示 SCORE、倍率、CASCADES、MATCHES 和 MOCK POINTS。0 PLAY 時無法啟動；不會出現負數。沒有連鎖也是合法的 Small Reaction。

## Controls

| 控制                                     | 行為                                           |
| ---------------------------------------- | ---------------------------------------------- |
| START EXPERIMENT                         | 啟動一局；播放期间停用                         |
| FAST MODE                                | 動畫時間為原本 55%，不改 RNG 或結果            |
| SKIP ANIMATION                           | 立即呈現事先決定的結果，不重抽、不重複結算     |
| SOUND ON / OFF                           | 使用者互動後開啟合成音效；偏好保留             |
| HOW TO PLAY                              | 遊戲說明與特殊角色規則                         |
| REWARD SHOP                              | 獎勵預覽，不扣點、不兌換                       |
| Tab / Shift+Tab / Enter / Space / Escape | 操作控制、在視窗內切換焦點、啟動按鈕、關閉視窗 |

## Board Rules

固定 6 rows × 6 columns。資料為 `Board = (Cell | null)[][]`，每顆 Cell 有唯一 instance ID、symbol ID、specialType 與 settled state。盤面狀態完全由引擎決定，UI 只呈現事件快照與移動座標。

普通角色 5 種：pink、yellow、green、purple、aqua。黃色皇冠是一般角色，標記 Y，只與同色相連，沒有特殊加成。表情、配件、小字標記與 accessible name 均可用來辨認。

## Cluster Match

用 BFS 找出相同普通 Jelly 的上下左右 connected components。至少 3 顆即成立，L / T 型有效，斜角無效。多個獨立群組同一階段一起消除，彼此不合併；同一次扫描只算一個 cascade。

## Cascade

`scan → highlight → pop → special creation → gravity → refill → scan`。

Gravity 保留同欄倖存 Jelly 的順序及 instance ID，空格集中上方；refill 建立新 instance ID 並提供來源／目的座標。上限 `maxCascades = 20`；達上限時保留最後盤面、確實結算並標註安全結束，避免無限動畫。

普通隨機起始盤面若無群組，最多再抽 2 次（`maxInitialRerolls`）；仍無群組就正常結束。Debug 盤面跳過重抽。沒有隱藏保證勝利或真實賭注。

## Combo

| Cascade | 倍率 | 畫面回饋    |
| ------- | ---- | ----------- |
| 1       | ×1   | GOOD        |
| 2       | ×1.2 | GREAT       |
| 3       | ×1.5 | AMAZING     |
| 4       | ×2   | JELLY COMBO |
| 5       | ×3   | SUPER JELLY |
| 6+      | ×5   | LAB FEVER   |

回饋由分數浮現逐步增加柔光、粒子與輕微培養槽脈動。Result 的 MAX COMBO 是**最高計分倍率**；CASCADES 是連鎖階段數，MATCHES 是普通群組總數。

## SCORE

| 群組大小          | 基本分數                  |
| ----------------- | ------------------------- |
| 3 / 4 / 5 / 6 / 7 | 30 / 60 / 120 / 200 / 300 |
| 8+                | `300 + (size - 7) × 100`  |

每個群組 `Math.round(baseScore × comboMultiplier)`，同階段加總。FIRE 額外清除、未在普通群組計分的每格另得 10 分，再乘倍率並取整；爆炸重疊不重複計分。SCORE 是娛樂成績，與 POINTS 分開儲存。

## FIRE Jelly

5 顆以上群組有 30% 機率生成 FIRE。生成位置固定為群組中**最下方，再最左邊的普通 Jelly**；用新 ID 取代，並在該階段清除後放入，確保看得見。

**FIRE 在下一次 scan 自動引爆**，不用玩家點擊或等待另一個群組。清除自己和周圍 3×3，邊界裁切安全。碰到另一 FIRE 會加入 iterative queue；用 triggered instance ID Set 確保每顆每階段最多一次。新 FIRE 不受其生成階段的爆炸影響。

## BONUS Jelly

月亮角色為 BONUS，spawn weight 0.7，五種普通角色各 20；自然生成總權重 100.7。FIRE 的自然生成權重為 0，只從有效群組生成。

BONUS **在出現在 initial / refill 盤面時收集**，用 instance ID 去重。每局只計一次；跨局保存，累積上限 3，達標顯示 BONUS READY。點擊月亮卡片開啟「BONUS MODE · Coming in Phase 2」。Phase 1 不重設已解鎖狀態、不發額外次數或獎品。

## Mock POINTS

**PHASE 1 MOCK ONLY**：`floor(roundScore / 100)`。這不是正式兌獎規則，不能用於正式 POINTS ledger。`totalScore`、`mockPoints` 分開儲存。快轉與略過不會再結算。

## Reward Shop Preview

$50 / $100 / $200 優惠券、Jelly Gift、Limited Jelly，門檻分別為 500 / 1000 / 2000 / 3000 / 5000 POINTS。首頁顯示下一個門檻與進度。

點數足夠顯示 Available / REDEEM；不足顯示 Locked / Not Enough Points，仍可閱讀預覽。任何按鈕都只展示 PHASE 1 PREVIEW，**沒有扣點、庫存或兌換請求**。

## Reference Assets

`reference/` 是 **original design reference**，禁止 destructive edits。

檢查到 `reference/jellyfish-3d-style-board.png`：2048 × 1365 PNG、2,017,067 bytes，兩列各四個角色，沒有分隔線，可保留完整配件安全裁切。

原圖 SHA-256：`6da26ad0f01ad730eb52e7d360fa7c9641103ccfca6ed0859b1985dbe20a5ee2`。

| 原圖位置                     | Production symbol |
| ---------------------------- | ----------------- |
| 上排左：皇冠黃 Jelly         | yellow            |
| 上排第二：月亮／枕頭紫 Jelly | bonus             |
| 上排第三：放大鏡綠 Jelly     | green             |
| 上排右：氣鼓鼓藍 Jelly       | retired（不載入） |
| 下排左：調色盤粉紅 Jelly     | pink              |
| 下排第二：水瓶／淚眼藍 Jelly | aqua              |
| 下排第三：嘆氣紫 Jelly       | purple            |
| 下排右：火焰紅 Jelly         | fire              |

衍生素材放在 `src/assets/jellies/`，7 張 runtime 獨立 256×256 WebP，各約 12–18 KB，總計約 105 KB。只對裁切邊界相連的近白背景去背，保留角色內部奶白材質和配件。原圖沒有被覆寫，且不作為 runtime asset。

`pnpm assets` 執行 `scripts/derive-assets.mjs` 可重建衍生素材。裁切座標、來源雜湊和處理方式記錄於 `src/assets/jellies/provenance.json`。裁切資訊只在素材工具中存在，Engine 不依賴圖片座標。

## Asset Replacement

將新的獨立角色檔放入 `src/assets/jellies/`，更新 `src/game/symbols/index.ts` 的 asset mapping 即可，**不需要修改 Engine**。Registry 集中管理 id、displayName、asset、category、enabled、spawnWeight、specialType、description 和 mark。實際遊戲權重由 `src/game/config/index.ts` 控制。

DM Sans 由 Fontsource 套件本機提供，授權 OFL-1.1；中文使用裝置可用字型。圖片源於此專案所提供的品牌參考圖，其權利仍屬原權利人。

## Project Structure

```text
reference/                 # 唯讀原始視覺參考
scripts/                   # 非破壞式素材工具、1000 局 balance 報告
src/
  assets/jellies/           # 獨立 WebP + provenance
  game/
    config/                # 盤面、機率、分數、倍率、動畫與 Mock conversion
    types/                 # Board / Cell / Event / RoundResult
    engine/                # BFS、重力、refill、特殊連鎖與 round timeline
    rng/                   # RandomSource、DefaultRandom、SeededRandom
    scoring/               # 純計分函式
    symbols/               # UI asset registry；engine 不 import 此處
    debug/                 # 固定盤面與亂數 provider
    services/              # GameService contract / LocalGameService
  components/              # Board、Modal、Rewards、Guide、Result、Debug
  hooks/                   # useGame：播放既定事件、取消等待、快轉
  audio/                   # 使用者互動後啟用 Web Audio
  storage/                 # version、validation、fallback、settlement
  styles/                  # RWD 與 reduced motion
tests/                     # Playwright + axe 瀏覽器回歸
docs/                      # 驗證紀錄
```

Engine 不 import React、DOM 或圖片。可調整數值集中於 Game Config；normal symbol list 與權重可用來測試其他 balance，不需改 React。

## Development

需求：Node.js 22.12+ 或 24+，pnpm 11。專案使用 `pnpm-lock.yaml`，請保留 lockfile。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

開啟終端機列出的網址，預設 `http://127.0.0.1:5173/`。不需要 `.env` 或任何 secret。`pnpm-workspace.yaml` 僅允許 esbuild / sharp 的標準安裝腳本。

## Testing

```sh
pnpm test            # Vitest：engine / scoring / RNG / storage / service
pnpm typecheck      # TypeScript strict
pnpm test:e2e       # Playwright：實際 Chrome、responsive、axe
pnpm balance        # seed 0–999 的連鎖與動畫時長分布
pnpm format:check   # Prettier
```

E2E 使用已安裝的 Google Chrome（`channel: chrome`），可用 `pnpm exec playwright install chrome` 安裝官方測試瀏覽器。測試 runner 會啟動 dev server，若同一 URL 已有 dev server 則重用。

- Vitest 覆蓋引擎、五色群組、FIRE、重力、播放完成協調與舊存檔相容。
- Playwright 覆蓋完整動畫、20 局隨機遊玩、各寬度、鍵盤與 axe。

測試截圖、trace 與 HTML report 產生於 `test-results/` / `playwright-report/`，均不 commit。

## Build

```sh
pnpm build
pnpm preview
```

Production 輸出 `dist/`，使用相對 `base: './'`，可由靜態主機供應，不需 Node server。僅提供根路由，以 query 啟用 Debug。`dist/` 不 commit。GitHub Pages：[遊戲網站](https://alberthuang-012s.github.io/012s-jelly-chain-game/)。既有 deploy-pages.yml 使用 Node 24 建置及部署。

## Debug Mode

加上 `?debug=1` 顯示面板，預設隱藏。

`+10 PLAY`、`+1000 MOCK POINTS`、`RESET LOCAL DATA`、`FORCE HIGH COMBO / FIRE / YELLOW CLUSTER / BONUS / NO MATCH / LARGE CLUSTER`。

FORCE 透過 Engine / Debug Board Provider 啟動真正的一局並扣 1 PLAY；不是直接修改畫面。HIGH COMBO 用重複 RNG 可確定達 20 次上限，建議 Fast 或 Skip 檢查。其餘情境使用固定 seed。執行中不能修改 Debug 資料。Reset 只重設此遊戲的 localStorage key，不清除其他網站資料。

## Storage

Key：`jelly_chain_game_v1`，envelope：`{ version: 1, stats: ... }`。

保存 plays、totalScore、mockPoints、highestRoundScore、highestCombo、totalGames、totalCascades、totalMatches、bonusProgress、soundEnabled、fastMode。驗證數字類型、有限值、非負、整數欄位及 Boolean；壞資料／未知 version 安全回到 defaults。讀寫被封鎖則改用記憶體並顯示提示。

每局先產生完整 `RoundResult`，用**單一次寫入**一起記錄 play 消耗及所有結算結果，再播放。中途 reload 不會遺失獎勵或重複入帳；reload 後回到 idle，前一局結果視窗不重播。畫面中的累積點數於動畫完成才更新。這只是 local mock checkpoint，不是正式 ledger 或安全交易機制。

同一分頁用同步 lock 保護 start；多分頁、跨裝置同步及防竄改不在 Phase 1 範圍，請使用單一分頁體驗。

## Accessibility

真實 button、accessible name、焦點外框、棋盤逐格角色描述、可切換音效與 `aria-live` 狀態。角色不只靠颜色：表情、配件與字母標记也不同。

原生 dialog 搭配 Tab / Shift+Tab 邊界循環、Escape 關閉、開啟／切換視窗時聚焦，以及關閉後恢復原控制焦點。`prefers-reduced-motion` 關閉 bounce、shake、particles、scale ，保留簡短的 WAAPI 位移、流程與結果。FAST MODE 只改時間；Animation、Sound 都不決定遊戲結果。

自動驗證 320 / 375 / 390 / 430 / 768 / 1440px，包含橫向 overflow、36 格、素材載入與手機第一屏按鈕。這是桌面 Chromium 視窗模擬；iOS Safari 和 Android 實機仍需下一輪裝置驗證。

## Phase 1 Limitations

- PLAY、MOCK POINTS、Reward Shop 僅供本機體驗，可被清除或修改，沒有金錢或正式資產價值。
- 無 SHOPLINE、Firebase、Firestore、Authentication 或 Activity Platform API；沒有修改其他 repository。
- BONUS 只有累積與模式預覽，沒有額外遊戲或實際獎品；Reward Shop 不會兌換。
- 使用衍生 256px 素材與合成 Web Audio，後續可換正式獨立 PNG / WebP 與音效。
- 連鎖上限會在極端盤面安全停止；初版 balance 可調整，尚未經正式玩家研究。
- localStorage 不做多分頁協調、不提供跨裝置帳號或防作弊。清除瀏覽器資料會遺失紀錄。

## Phase 2 Integration

用 `RemoteGameService` 實作現有 `GameService`，替換 LocalGameService，沿用 versioned `RoundResult.events` 及純播放層。

下一階段由 **012s-activity-platform** 管理 Authentication、SLOT_SPIN 驗證與扣除、Idempotency-Key、權威 RNG、Game Result、正式 POINTS、Activity Ledger 及 Reward Redemption。Server 需決定結果、保存交易和 ledger，回傳可驗證的事件資料；前端只播放，不能沿用本機 Mock conversion 當正式資產規則。

請先定義 server result schema 與 runtime validation、timeout / retry / idempotency recovery，再串接端點；不要讓 UI import URL 或會員 secret。

## Drop Playback / Compatibility

圖片在扣 PLAY 前完成 decode。Board 使用 useLayoutEffect 在繪製前設定百分比 translate3d，保留 cell ID 與 DOM，免除整數高度誤差。各階段由實際動畫 finished 回報完成，gravity 全部落定才 refill；新補角色從盤面上方進場，各欄微錯開。Fast 設定只影響下一階段，當前動畫不取消。Skip / unmount 解除等待並清理動畫。Reduced motion 保留短位移但不回彈。

儲存格式仍為 version 1，只儲存統計與設定，從未持久化 board 或 pending result。舊存檔額外夾帶的已退役角色資料會被忽略，合法 PLAY、分數、點數與偏好完整保留。新盤面只由目前七種角色產生。
