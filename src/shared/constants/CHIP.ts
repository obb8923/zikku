import CloudIcon from '@assets/svgs/Cloud.svg';
import MarkerPinIcon from '@assets/svgs/MarkerPin.svg';
import HeartIcon from '@assets/svgs/Heart.svg';
import StarIcon from '@assets/svgs/Star.svg';
import UserMultipleIcon from '@assets/svgs/UserMultiple.svg';

export const CHIP_TYPE = {
  LANDSCAPE: '풍경',
  PLACE: '장소',
  LIFE: '생명',
  DISCOVERY: '발견',
  TOGETHER: '함께',
} as const;

export type ChipTypeKey = keyof typeof CHIP_TYPE;
export type ChipType = typeof CHIP_TYPE[keyof typeof CHIP_TYPE];

// 칩 타입별 아이콘 매핑
export const CHIP_ICONS = {
  [CHIP_TYPE.LANDSCAPE]: CloudIcon,
  [CHIP_TYPE.PLACE]: MarkerPinIcon,
  [CHIP_TYPE.LIFE]: HeartIcon,
  [CHIP_TYPE.DISCOVERY]: StarIcon,
  [CHIP_TYPE.TOGETHER]: UserMultipleIcon,
} as const;

// 칩 타입별 색상 매핑
export const CHIP_COLORS = {
  [CHIP_TYPE.LANDSCAPE]: '#23B6FF', // 하늘색
  [CHIP_TYPE.PLACE]: '#AA69FF', // 보라색
  [CHIP_TYPE.LIFE]: '#FF6C87', // 빨간색
  [CHIP_TYPE.DISCOVERY]: '#FFB039', // 주황색
  [CHIP_TYPE.TOGETHER]: '#14DC6E', // 초록색
} as const;

// 칩 타입별 틴트 색상 매핑 (rgba, alpha: 0.22)
export const CHIP_TINT_COLORS = {
  [CHIP_TYPE.LANDSCAPE]: 'rgba(35, 182, 255, 0.22)', // 하늘색
  [CHIP_TYPE.PLACE]: 'rgba(170, 105, 255, 0.22)', // 보라색
  [CHIP_TYPE.LIFE]: 'rgba(255, 108, 135, 0.22)', // 빨간색
  [CHIP_TYPE.DISCOVERY]: 'rgba(255, 176, 57, 0.22)', // 주황색
  [CHIP_TYPE.TOGETHER]: 'rgba(20, 220, 110, 0.22)', // 초록색
} as const;

