// 4-2. lib/mmt/constants.ts - 상수 정의
export const DEFAULT_STRATEGY_CONFIG: MarketMakingStrategy = {
  baseSpread: 0.1,
  bidAdjustment: -0.05,
  askAdjustment: 0.05,
  checkInterval: 30,
  minTradeSize: 100,
  maxTradeSize: 10000,
  tradeSizePercentage: 5,
  targetRatio: 0.5,
  rebalanceThreshold: 5.0,
  maxPositionSize: 50000,
  maxSlippage: 1.0,
  stopLossPercentage: 5.0,
  emergencyStop: false,
  enabled: false
};