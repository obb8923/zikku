import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { Text } from '@components/Text';
import { PropertyValues } from '@/shared/types/personType';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from 'react-native';

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PropertyValues) => void;
  existingTypes: PropertyValues[];
  canUseCustom?: boolean;
}


export const AddPropertyModal = ({
  visible,
  onClose,
  onSelect,
  existingTypes,
  canUseCustom = true,
}: AddPropertyModalProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const lockedTitle = t('subscription.lockedFeatureTitle', '구독 필요');
  const lockedMessage = t('subscription.lockedFeatureMessage', '구독 시 사용 가능한 기능입니다.');

  const AVAILABLE_PROPERTIES: PropertyValues[] = [
    'tags',
    'organizations',
    'phone',
    'birthday',
    'likes',
    'dislikes',
    'personality',
    'custom',
  ];

  const availableProperties = AVAILABLE_PROPERTIES.filter(
    (type) => !existingTypes.includes(type)
  );



  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <View
          className="bg-background rounded-t-3xl p-4 max-h-[80%]" style={{ paddingBottom: insets.bottom + 4 }}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text text={t('addPerson.modal.title')} type="title4" className="text-text" />
            <TouchableOpacity onPress={onClose}>
              <Text text={t('addPerson.modal.close')} type="body1" className="text-text" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableProperties}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isCustom = item === 'custom';
              const locked = isCustom && !canUseCustom;
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (locked) {
                      Alert.alert(lockedTitle, lockedMessage);
                      return;
                    }
                    onSelect(item);
                    onClose();
                  }}
                  className={`py-3 border-b border-border ${locked ? 'opacity-50' : ''}`}
                  disabled={false}
                >
                  <Text
                    text={
                      locked
                        ? `${t(`property.labels.${item}`)} (${t('subscription.lockedLabel', '구독 전용')})`
                        : t(`property.labels.${item}`)
                    }
                    type="body1"
                    className={locked ? 'text-text-2' : 'text-text'}
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

