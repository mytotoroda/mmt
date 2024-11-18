@echo off
echo Creating Market Making Tool (MMT) Project Structure...

:: Create directories
mkdir app\mmt\config
mkdir app\mmt\orders
mkdir app\mmt\positions
mkdir components\mmt
mkdir hooks\mmt
mkdir contexts\mmt
mkdir lib\mmt
mkdir styles\mmt
mkdir api\mmt\config
mkdir api\mmt\orders
mkdir api\mmt\positions
mkdir api\mmt\stats
mkdir models\mmt
mkdir types\mmt
mkdir utils\mmt

:: Create page files
type nul > app\mmt\page.tsx
type nul > app\mmt\layout.tsx
type nul > app\mmt\config\page.tsx
type nul > app\mmt\orders\page.tsx
type nul > app\mmt\positions\page.tsx

:: Create component files
type nul > components\mmt\Dashboard.tsx
type nul > components\mmt\ConfigPanel.tsx
type nul > components\mmt\OrderBook.tsx
type nul > components\mmt\PositionTable.tsx
type nul > components\mmt\MarketStats.tsx
type nul > components\mmt\TradingChart.tsx
type nul > components\mmt\AlertPanel.tsx
type nul > components\mmt\TokenPairSelect.tsx
type nul > components\mmt\index.ts

:: Create hook files
type nul > hooks\mmt\useMarketMaking.ts
type nul > hooks\mmt\useOrderBook.ts
type nul > hooks\mmt\usePositions.ts
type nul > hooks\mmt\useMarketStats.ts
type nul > hooks\mmt\index.ts

:: Create context files
type nul > contexts\mmt\MarketMakingContext.tsx
type nul > contexts\mmt\OrderContext.tsx
type nul > contexts\mmt\PositionContext.tsx
type nul > contexts\mmt\index.ts

:: Create lib files
type nul > lib\mmt\marketMaker.ts
type nul > lib\mmt\orderManager.ts
type nul > lib\mmt\positionTracker.ts
type nul > lib\mmt\constants.ts
type nul > lib\mmt\utils.ts
type nul > lib\mmt\index.ts

:: Create style files
type nul > styles\mmt\index.css

:: Create API route files
type nul > api\mmt\config\route.ts
type nul > api\mmt\orders\route.ts
type nul > api\mmt\positions\route.ts
type nul > api\mmt\stats\route.ts

:: Create model files
type nul > models\mmt\Config.ts
type nul > models\mmt\Order.ts
type nul > models\mmt\Position.ts
type nul > models\mmt\MarketStats.ts

:: Create type files
type nul > types\mmt\market.ts
type nul > types\mmt\config.ts
type nul > types\mmt\order.ts
type nul > types\mmt\position.ts
type nul > types\mmt\index.ts

:: Create utility files
type nul > utils\mmt\market.ts
type nul > utils\mmt\calculation.ts
type nul > utils\mmt\validation.ts
type nul > utils\mmt\formatting.ts
type nul > utils\mmt\index.ts

echo Market Making Tool (MMT) directory structure created successfully!
pause