// app/api/mmt/strategy/config/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');

    if (!poolId) {
      return NextResponse.json(
        { success: false, message: '풀 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    const [configs] = await connection.query(`
      SELECT 
        base_spread,
        bid_adjustment,
        ask_adjustment,
        check_interval,
        min_trade_size,
        max_trade_size,
        trade_size_percentage,
        target_ratio,
        rebalance_threshold,
        max_position_size,
        max_slippage,
        stop_loss_percentage,
        emergency_stop,
        enabled
      FROM mmt_pool_configs 
      WHERE pool_id = ?
    `, [poolId]);

    // 설정이 없는 경우 기본값 반환
    const config = configs[0] || {
      base_spread: 0.001,
      bid_adjustment: -0.0005,
      ask_adjustment: 0.0005,
      check_interval: 30,
      min_trade_size: 100,
      max_trade_size: 10000,
      trade_size_percentage: 0.05,
      target_ratio: 0.5,
      rebalance_threshold: 0.05,
      max_position_size: 50000,
      max_slippage: 0.01,
      stop_loss_percentage: 0.05,
      emergency_stop: false,
      enabled: false
    };

    return NextResponse.json({
      success: true,
      config: {
        baseSpread: config.base_spread * 100, // 백분율로 변환
        bidAdjustment: config.bid_adjustment * 100,
        askAdjustment: config.ask_adjustment * 100,
        checkInterval: config.check_interval,
        minTradeSize: config.min_trade_size,
        maxTradeSize: config.max_trade_size,
        tradeSizePercentage: config.trade_size_percentage * 100,
        targetRatio: config.target_ratio,
        rebalanceThreshold: config.rebalance_threshold * 100,
        maxPositionSize: config.max_position_size,
        maxSlippage: config.max_slippage * 100,
        stopLossPercentage: config.stop_loss_percentage * 100,
        emergencyStop: config.emergency_stop,
        enabled: config.enabled
      }
    });

  } catch (error) {
    console.error('Error fetching strategy config:', error);
    return NextResponse.json(
      { success: false, message: '전략 설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool();
  let connection = null;

  try {
    const data = await request.json();
    const {
      poolId,
      baseSpread,
      bidAdjustment,
      askAdjustment,
      checkInterval,
      minTradeSize,
      maxTradeSize,
      tradeSizePercentage,
      targetRatio,
      rebalanceThreshold,
      maxPositionSize,
      maxSlippage,
      stopLossPercentage,
      emergencyStop,
      enabled,
      walletAddress // 설정 변경자 지갑 주소
    } = data;

    if (!poolId) {
      return NextResponse.json(
        { success: false, message: '풀 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 이전 설정 조회 (변경 이력용)
      const [oldConfig] = await connection.query(
        'SELECT * FROM mmt_pool_configs WHERE pool_id = ?',
        [poolId]
      );

      // 설정 업데이트
      await connection.query(`
        INSERT INTO mmt_pool_configs (
          pool_id,
          base_spread,
          bid_adjustment,
          ask_adjustment,
          check_interval,
          min_trade_size,
          max_trade_size,
          trade_size_percentage,
          target_ratio,
          rebalance_threshold,
          max_position_size,
          max_slippage,
          stop_loss_percentage,
          emergency_stop,
          enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          base_spread = VALUES(base_spread),
          bid_adjustment = VALUES(bid_adjustment),
          ask_adjustment = VALUES(ask_adjustment),
          check_interval = VALUES(check_interval),
          min_trade_size = VALUES(min_trade_size),
          max_trade_size = VALUES(max_trade_size),
          trade_size_percentage = VALUES(trade_size_percentage),
          target_ratio = VALUES(target_ratio),
          rebalance_threshold = VALUES(rebalance_threshold),
          max_position_size = VALUES(max_position_size),
          max_slippage = VALUES(max_slippage),
          stop_loss_percentage = VALUES(stop_loss_percentage),
          emergency_stop = VALUES(emergency_stop),
          enabled = VALUES(enabled)
      `, [
        poolId,
        baseSpread / 100,
        bidAdjustment / 100,
        askAdjustment / 100,
        checkInterval,
        minTradeSize,
        maxTradeSize,
        tradeSizePercentage / 100,
        targetRatio,
        rebalanceThreshold / 100,
        maxPositionSize,
        maxSlippage / 100,
        stopLossPercentage / 100,
        emergencyStop,
        enabled
      ]);

      // 변경 이력 기록
      await connection.query(`
        INSERT INTO mmt_pool_config_history (
          pool_id,
          change_type,
          changed_fields,
          old_values,
          new_values,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        poolId,
        oldConfig.length ? 'UPDATED' : 'CREATED',
        JSON.stringify(Object.keys(data)),
        oldConfig.length ? JSON.stringify(oldConfig[0]) : null,
        JSON.stringify(data),
        walletAddress
      ]);

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: '전략 설정이 성공적으로 저장되었습니다.'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating strategy config:', error);
    return NextResponse.json(
      { success: false, message: '전략 설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}