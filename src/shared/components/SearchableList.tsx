import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@components/Text';
import { useColors } from '@shared/hooks/useColors';
export interface SearchableListItem {
  id: string;
  label: string;
}

interface SearchableListProps {
  items: SearchableListItem[];
  onSelect: (item: SearchableListItem | null) => void;
  placeholder?: string;
  selectedItemId?: string | null;
  maxHeight?: number;
}

export const SearchableList = ({
  items,
  onSelect,
  placeholder,
  selectedItemId,
  maxHeight = 200,
}: SearchableListProps) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('common.searchPlaceholder');
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chip 표시 (선택됨 + 드롭다운 닫힘)
  if (selectedItem && !isOpen) {
    return (
      <TouchableOpacity
        onPress={() => {
          onSelect(null);
          setSearchQuery('');
        }}
        className="items-center justify-center flex-row rounded-full bg-component-background px-4 py-1"
      >
        <Text
          text={selectedItem.label}
          type="body2"
          className="text-text mr-2 font-semibold"
        />
        <Text text="X" type="body3" className="text-text font-semibold" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="relative z-10">
      <TextInput
        ref={inputRef}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={defaultPlaceholder}
        onFocus={() => {
          setIsOpen(true);
          setSearchQuery(selectedItem?.label || '');
        }}
        style={{
          fontFamily: 'NotoSansKR-Medium',
          fontSize: 15,
          paddingVertical: 6,
          includeFontPadding: false,
        }}
        className="px-2 h-18 rounded-lg text-text bg-component-background"
        placeholderTextColor={colors.TEXT_2}
      />

      {/* 투명 오버레이: 드롭다운이 열렸을 때 외부 클릭 감지 */}
      {isOpen && (
        <TouchableWithoutFeedback
          onPress={() => {
            setIsOpen(false);
            setSearchQuery('');
            Keyboard.dismiss();
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            pointerEvents="box-none"
          />
        </TouchableWithoutFeedback>
      )}
      {/*  드롭다운 열렸을 때 외부 클릭 감지 오버레이 */}
      {isOpen && (
          <TouchableWithoutFeedback
            onPress={() => {
              setIsOpen(false);
              setSearchQuery('');
              Keyboard.dismiss();
            }}
            style={{backgroundColor: 'red',position: 'absolute',top: 0,bottom: 0,left: -9999,right: -9999}}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -9999,
                right: -9999,
              }}
            />
          </TouchableWithoutFeedback>
        )}
      {/* 드롭다운 리스트 */}
      {isOpen && filteredItems.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 34,
            left: 0,
            right: 0,
            maxHeight,
          }}
          className="border border-border rounded-lg bg-background"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  onSelect(item);
                  setIsOpen(false);
                  setSearchQuery('');
                  Keyboard.dismiss();
                }}
                className={`px-4 py-3 border-b border-border ${
                  selectedItemId === item.id ? 'bg-component-background' : ''
                }`}
              >
                <Text text={item.label} type="body1" className="text-text" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
