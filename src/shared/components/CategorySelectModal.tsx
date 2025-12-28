import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { Chip, Text } from '@components/index';
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
  const { t } = useTranslation();

  const handleSelect = (chipType: ChipTypeKey) => {
    onSelect(chipType);
    onClose();
  };

 

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* 배경 오버레이 */}
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0)',
          }}
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
        </View>
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <View
            className="w-full bg-component-background rounded-2xl p-4"
            style={{
              paddingBottom: insets.bottom + 16,
            }}
          >
            <View className=" flex-row justify-between items-center mb-4">
            <Text
              type="title3"
              text={t('category', { ns: 'chip' })}
              style={{textAlign: 'left', color: COLORS.TEXT_COMPONENT }}
            />
            <TouchableOpacity onPress={onClose}>
              <Text type="body2" text={t('buttons.close', { ns: 'common' })} style={{ color: COLORS.TEXT_COMPONENT }} />
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
          </View>
        </View>
      </View>
    </Modal>
  );
};

