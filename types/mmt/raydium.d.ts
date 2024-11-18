// types/mmt/raydium.d.ts
declare module '@raydium-io/raydium-sdk' {
  import { PublicKey } from '@solana/web3.js';
  import BN from 'bn.js';

  export class Liquidity {
    static fetchInfo(params: {
      connection: Connection;
      poolKeys: {
        id: PublicKey;
        programId: PublicKey;
      };
    }): Promise<any>;

    static computeAnotherAmount(params: {
      poolKeys: any;
      poolInfo: any;
      amount: TokenAmount;
      anotherCurrency: Currency;
      slippage: number;
    }): Promise<{
      anotherAmount: TokenAmount;
      minAnotherAmount: TokenAmount;
      currentPrice: Price;
      executionPrice: Price;
      priceImpact: Percent;
      fee: TokenAmount;
    }>;
  }

  export class Token {
    public readonly chainId: number;
    public readonly address: string;
    public readonly decimals: number;
    public readonly symbol: string;
    public readonly name: string;

    constructor(
      chainId: number,
      address: string,
      decimals: number,
      symbol: string,
      name: string
    );
  }

  export class TokenAmount {
    public readonly token: Token;
    public readonly amount: BN;

    constructor(token: Token, amount: BN | number | string);
  }

  export class Percent {
    constructor(numerator: BN, denominator?: BN);
  }

  export class Price {
    constructor(
      baseCurrency: Currency,
      quoteCurrency: Currency,
      denominator: BN,
      numerator: BN
    );
  }

  export interface Currency {
    readonly decimals: number;
    readonly symbol?: string;
    readonly name?: string;
  }

  export const MAINNET_PROGRAM_ID: string;
  export const DEVNET_PROGRAM_ID: string;
}