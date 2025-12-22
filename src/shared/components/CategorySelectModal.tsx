import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { Chip, LiquidGlassButton, LiquidGlassView, Text } from '@components/index';
import { COLORS } from '@constants/COLORS';

interface CategorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: ChipTypeKey) => void;
  disabled?: boolean;
}

export const CategorySelectModal = ({
  visible,
  onClose,
  onSelect,
  disabled = false,
}: CategorySelectModalProps) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때: 아래에서 위로 슬라이드
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 모달이 닫힐 때: 위에서 아래로 슬라이드
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const handleSelect = (chipType: ChipTypeKey) => {
    onSelect(chipType);
    onClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // 아래에서 위로 300px 이동
  });

  return (
    <Portal>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}
        pointerEvents="box-none"
      >
        {/* 배경 오버레이 */}
        <Animated.View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: opacityAnim,
          }}
          onTouchEnd={onClose}
        />
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            className="w-full bg-component-background rounded-2xl p-4"
            style={{
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY }],
              opacity: opacityAnim,
            }}
          >
            <View className=" flex-row justify-between items-center mb-4">
            <Text
              type="title3"
              text="카테고리 선택"
              style={{textAlign: 'left', color: COLORS.TEXT_COMPONENT }}
            />
            <TouchableOpacity onPress={onClose}>
              <Text type="body2" text="닫기" style={{ color: COLORS.TEXT_COMPONENT }} />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {(Object.keys(CHIP_TYPE) as ChipTypeKey[]).map((chipType) => (
                <TouchableOpacity
                  key={chipType}
                  onPress={() => handleSelect(chipType)}
                  disabled={disabled}
                >
                  <Chip chipType={chipType} />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </View>
    </Portal>
  );
};

