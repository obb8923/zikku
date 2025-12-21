import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Portal } from '@gorhom/portal';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { Chip, LiquidGlassButton, LiquidGlassView, Text } from '@components/index';

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
  if (!visible) {
    return null;
  }

  const handleSelect = (chipType: ChipTypeKey) => {
    onSelect(chipType);
    onClose();
  };

  return (
    <Portal>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}
        pointerEvents="box-none"
      >
        {/* 배경 오버레이 */}
        <View
          className="absolute inset-0"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
          onTouchEnd={onClose}
        />
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1 items-center justify-center px-8"
          pointerEvents="box-none"
        >
          <View className="w-full bg-black p-4 rounded-2xl">
            <Text
              type="title3"
              text="카테고리 선택"
              style={{ marginBottom: 24, textAlign: 'left', color: 'white' }}
            />
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
          </View>
        </View>
      </View>
    </Portal>
  );
};

