import React from 'react';
import { TouchableOpacity, View, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {LiquidGlassTextButton,Text,LiquidGlassView} from '@components/index';
import { COLORS } from '@constants/COLORS';
import { changeLanguage, supportedLanguages, type SupportedLanguage } from '@i18n/index';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { TypographyType } from './Text';

interface LanguageSelectModalProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
};

export const LanguageSelectModal = ({
  visible,
  onClose,
}: LanguageSelectModalProps) => {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const handleSelect = async (language: SupportedLanguage) => {
    await changeLanguage(language);
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
            <View className="flex-row justify-between items-center mb-4">
              <Text
                type="title3"
                text={t('items.language', { ns: 'more' })}
                style={{ textAlign: 'left', color: COLORS.TEXT_COMPONENT }}
              />
              <TouchableOpacity onPress={onClose}>
                <Text 
                  type="body2" 
                  text={t('buttons.close', { ns: 'common' })} 
                  style={{ color: COLORS.TEXT_COMPONENT }} 
                />
              </TouchableOpacity>
            </View>
            <View className="gap-3">
              {supportedLanguages.map((language) => {
                const isSelected = i18n.language === language;
                const languageName = LANGUAGE_NAMES[language];
                return (
                    <LiquidGlassView
                    borderRadius={16}
                    interactive={true}
                    style={{height: BUTTON_SIZE_MEDIUM}}
                    tintColor=''
                    key={language}
                  >
                    <Pressable
                      onPress={() => handleSelect(language)}
                      className="items-center justify-between px-4 flex-row"
                      style={{height: BUTTON_SIZE_MEDIUM}}
                    >
                    
                       <Text 
                         type='body3' 
                         text={languageName || ''}
                         className='text-text font-semibold'
                       />
                       {isSelected && (
                        <Text text='✓' type='body3' className='text-text font-semibold' />
                       )}
                    </Pressable>
                  </LiquidGlassView>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

