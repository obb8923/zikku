import { LinearGradient } from 'react-native-linear-gradient';

export const GradientMask = () => {
  return (
    <>
    {/* 상단 그라데이션 오버레이 */}
    <LinearGradient
    colors={[
        'rgba(0, 0, 0, 0.9)' ,     // 진한 투명도
        'rgba(0, 0, 0, 0.7)',     // 중간 투명도
        'rgba(0, 0, 0, 0.3)',     // 약간 투명
        'rgba(0, 0, 0, 0.1)',       // 완전 투명
    ]}
    locations={[0, 0.2, 0.7, 1]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={{
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      zIndex: 100,
      height: '50%',
      width: '100%',
      pointerEvents: 'none',
    }}
  />
        {/* 하단 그라데이션 오버레이 */}
        <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.1)',       // 완전 투명
          'rgba(0, 0, 0, 0.3)',     // 약간 투명
          'rgba(0, 0, 0, 0.7)',     // 중간 투명도
          'rgba(0, 0, 0, 0.9)'      // 진한 투명도
        ]}
        locations={[0, 0.2, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          height: '50%',
          width: '100%',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};