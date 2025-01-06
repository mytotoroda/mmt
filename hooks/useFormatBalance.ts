// hooks/useFormatBalance.ts
import { useMemo } from 'react';

export const useFormatBalance = () => {
  const formatBalance = useMemo(() => {
    return (balance: number) => {
      // 0이거나 undefined인 경우 "0"으로 표시
      if (!balance) return "0";
      
      // 숫자를 문자열로 변환
      const balanceStr = balance.toString();
      
      // 소수점 위치 찾기
      const decimalIndex = balanceStr.indexOf('.');
      
      if (decimalIndex === -1) {
        // 소수점이 없는 경우 그대로 반환
        return balanceStr;
      }
      
      // 소수점 이하 숫자들을 검사하여 유효한 마지막 숫자 위치 찾기
      let lastNonZeroIndex = balanceStr.length - 1;
      while (lastNonZeroIndex > decimalIndex && balanceStr[lastNonZeroIndex] === '0') {
        lastNonZeroIndex--;
      }
      
      // 소수점 이하가 모두 0인 경우
      if (lastNonZeroIndex === decimalIndex) {
        return balanceStr.slice(0, decimalIndex);
      }
      
      // 유효한 숫자까지만 자르기
      return balanceStr.slice(0, lastNonZeroIndex + 1);
    };
  }, []);

  return formatBalance;
};