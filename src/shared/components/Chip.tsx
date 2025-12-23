import React from 'react';
import { LiquidGlassView } from './LiquidGlassView';
import { Text } from './Text';
import {BUTTON_SIZE_MEDIUM} from '@constants/NORMAL';
import { CHIP_TYPE, CHIP_ICONS, CHIP_COLORS, type ChipTypeKey } from '@constants/CHIP';

type ChipProps = {
  chipType: ChipTypeKey | null;
  color?: string;
  tintColor?: string;
  interactive?: boolean;
};

// 컬러 문자열에서 alpha 값을 변경하는 헬퍼 함수
const setColorAlpha = (color: string, alpha: number): string => {
  // rgba 형식인 경우
  if (color.startsWith('rgba')) {
    return color.replace(/[\d\.]+\)$/g, `${alpha})`);
  }
  // rgb 형식인 경우
  if (color.startsWith('rgb')) {
    return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  }
  // hex 형식인 경우 (#RRGGBB 또는 #RGB)
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = hex.length === 3 ? parseInt(hex[0] + hex[0], 16) : parseInt(hex.slice(0, 2), 16);
    const g = hex.length === 3 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.slice(2, 4), 16);
    const b = hex.length === 3 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // 알 수 없는 형식이면 그대로 반환
  return color;
};

export const Chip = ({ chipType, color, tintColor, interactive = true }: ChipProps) => {
  // chipType이 null인 경우 (선택되지 않은 상태)
  if (chipType === null) {
    return (
      <LiquidGlassView
        borderRadius={BUTTON_SIZE_MEDIUM / 2}
        tintColor={tintColor}
        innerStyle={{
          flexDirection: 'row',
          height: BUTTON_SIZE_MEDIUM,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 6,
          alignSelf: 'flex-start',
          opacity: interactive ? 1 : 0.6,
        }}
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        <Text 
          type="body2" 
          text="이 버튼을 눌러 카테고리를 선택해주세요" 
          style={{ fontWeight: 500 }} 
        />
      </LiquidGlassView>
    );
  }

  // chipType에 따라 텍스트와 아이콘 가져오기
  const text = CHIP_TYPE[chipType];
  const chipTypeValue = CHIP_TYPE[chipType];
  const IconComponent = CHIP_ICONS[chipTypeValue];
  
  // chipType이 있고 color가 지정되지 않았으면 기본 색상 사용
  const chipColor = color || CHIP_COLORS[chipTypeValue];
  const finalTintColor = chipColor ? setColorAlpha(chipColor, 0.4) : tintColor;
  const textColor = chipColor;

  return (
    <LiquidGlassView
      borderRadius={BUTTON_SIZE_MEDIUM / 2}
      tintColor={finalTintColor}
      innerStyle={{
        flexDirection: 'row',
        height: BUTTON_SIZE_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        opacity: interactive ? 1 : 0.6,
      }}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      {IconComponent && (
        <IconComponent width={24} height={24} color={textColor} />
      )}
      <Text 
        type="body2" 
        text={text} 
        style={{ fontWeight: 500,marginLeft: IconComponent ? 8 : 0, ...(textColor ? { color: textColor } : {}) }} 
      />
    </LiquidGlassView>
  );
};

