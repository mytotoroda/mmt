@echo off
echo Creating Raydium AMM Project Structure...

mkdir app\amm\swap
mkdir app\amm\pool\create
mkdir app\amm\pool\manage
mkdir components\amm
mkdir hooks
mkdir contexts
mkdir lib\amm
mkdir styles
mkdir api\amm\pools
mkdir api\amm\transactions
mkdir models

type nul > app\amm\page.tsx
type nul > app\amm\swap\page.tsx
type nul > app\amm\pool\page.tsx
type nul > app\amm\pool\create\page.tsx
type nul > app\amm\pool\manage\page.tsx

type nul > components\amm\SwapCard.tsx
type nul > components\amm\PoolCard.tsx
type nul > components\amm\TokenSelect.tsx
type nul > components\amm\PriceChart.tsx
type nul > components\amm\PoolList.tsx
type nul > components\amm\LiquidityForm.tsx
type nul > components\amm\Stats.tsx

type nul > hooks\useAMM.ts
type nul > hooks\usePool.ts
type nul > hooks\useSwap.ts
type nul > hooks\useLiquidity.ts

type nul > contexts\AMMContext.tsx

type nul > lib\amm\constants.ts
type nul > lib\amm\utils.ts
type nul > lib\amm\types.ts
type nul > lib\amm\contracts.ts

type nul > styles\amm.css

type nul > api\amm\route.ts
type nul > api\amm\pools\route.ts
type nul > api\amm\transactions\route.ts

type nul > models\Pool.ts
type nul > models\Transaction.ts

echo Directory structure created successfully!
pause