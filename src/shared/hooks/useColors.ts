import { useThemeStore } from '@stores/themeStore';

// 라이트 테마 색상
const LIGHT_COLORS = {
  BACKGROUND: '#F7F7F4',
  CARD_BACKGROUND: '#F2F1EE',
  COMPONENT_BACKGROUND: '#E6E5E1',
  COMPONENT_BACKGROUND_2: '#D3D2CB',
  BORDER: '#EDECE9',
  WHITE: '#fefefe',
  BLACK: '#191919',
  PRIMARY: '#FF3900',
  TEXT: '#26251D',
  TEXT_2: '#75746C',
} as const;

// 다크 테마 색상
const DARK_COLORS = {
  BACKGROUND: '#131209',
  CARD_BACKGROUND: '#1B1911',
  COMPONENT_BACKGROUND: '#26241D',
  COMPONENT_BACKGROUND_2: '#3A3834',
  BORDER: '#201E16',
  WHITE: '#fefefe',
  BLACK: '#191919',
  PRIMARY: '#FF3900',
  TEXT: '#EDECEC',
  TEXT_2: '#999895',
} as const;

export type ColorKey = keyof typeof LIGHT_COLORS;

/**
 * 현재 테마에 맞는 색상을 반환하는 hook
 * @returns 현재 테마에 맞는 색상 객체
 */
export const useColors = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme);
  
  return currentTheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};

