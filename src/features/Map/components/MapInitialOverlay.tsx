import React, { useState, useRef, useCallback } from 'react';
import { View, ViewStyle, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientMask } from './GradientMask';
import { Text } from '@components/index';
import { LiquidGlassTextButton } from '@components/LiquidGlassTextButton';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import { ArchiveScreen } from '@features/Archive/screens/ArchiveScreen';
import { MoreScreen } from '@features/More/screens/MoreScreen';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';

interface MapInitialOverlayProps {
  onStart: () => void;
  style?: ViewStyle;
}

export const MapInitialOverlay: React.FC<MapInitialOverlayProps> = ({
  onStart,
  style,
}) => {
  const insets = useSafeAreaInsets();
  // 모달 상태 관리
  const [modalType, setModalType] = useState<'archive' | 'more' | null>(null);
  const modalSlideAnim = useRef(new Animated.Value(0)).current;

  const handleArchivePress = useCallback(() => {
    setModalType('archive');
    Animated.spring(modalSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [modalSlideAnim]);

  const handleMorePress = useCallback(() => {
    setModalType('more');
    Animated.spring(modalSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [modalSlideAnim]);

  const handleCloseModal = useCallback(() => {
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalType(null);
    });
  }, [modalSlideAnim]);

  return (
    <View 
      className="flex-1 absolute inset-0"
      style={style}
    >
      <View 
      className="flex-1 justify-between px-4"
        style={{ 
          paddingTop: insets.top + 32, 
          paddingBottom: insets.bottom+16,
          zIndex: 200 
        }}
      >
        {/* title area */}
        <View className="w-full">
          <Text type="title1" text="반가워요" className="text-text-component"/>
          <Text type="title0" text="SEOUL" className="text-text font-bold"/>
        </View>
        {/* button area */}
        <View className="w-full gap-4">
          <LiquidGlassTextButton
            text="시작하기"
            onPress={onStart}
            size="large"
            style={{ width: '100%' }}
            tintColor="white"
            textStyle={{ color: 'black' ,fontWeight: 'bold'}}
          />
        {/* tab button area */}
        <View className="w-full gap-4 flex-row justify-between">
          <LiquidGlassTextButton
            text="기록"
            onPress={handleArchivePress}
            size="large"
            style={{ flex: 1 }}
            tintColor="rgba(255,255,255,0.2)"
            textStyle={{ color: 'black', fontWeight: 'bold' }}
          />
          <LiquidGlassTextButton
            text="설정"
            onPress={handleMorePress}
            size="large"
            style={{flex: 1}}
            tintColor="rgba(255,255,255,0.2)"
            textStyle={{ color: 'black', fontWeight: 'bold' }}
          />
        </View>
        </View>
      </View>
      <GradientMask />
      
      {/* Archive/More 모달 */}
      {modalType && (
        <>
          {/* 배경 오버레이 */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
            }}
            onPress={handleCloseModal}
          />
          {/* 모달 컨텐츠 */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '90%',
              zIndex: 2001,
              transform: [
                {
                  translateY: modalSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1000, 0], // 아래에서 위로 올라옴
                  }),
                },
              ],
            }}
          >
            <View className="flex-1 bg-background rounded-t-3xl" style={{ paddingTop: insets.top }}>
              {/* 닫기 버튼 */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 0,
                  paddingBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  backgroundColor: 'red',
                }}
              >
                <LiquidGlassButton onPress={handleCloseModal} borderRadius={8}>
                  <ChevronLeft width={24} height={24} color="black" />
                </LiquidGlassButton>
              </View>
              {/* 스택 컨텐츠 */}
              <View className="flex-1">
                {modalType === 'archive' && <ArchiveScreen />}
                {modalType === 'more' && <MoreScreen />}
              </View>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
};

