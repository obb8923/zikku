import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip } from '@components/index';
import { useColors } from '@shared/hooks/useColors';
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  variant?: 'default' | 'light';
  onFocus?: () => void;
}

export const ChipInput = ({
  values,
  onChange,
  placeholder,
  variant = 'default',
  onFocus,
}: ChipInputProps) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t('chipInput.placeholder');
  const [inputValue, setInputValue] = useState('');
  const colors = useColors();
  const handleAddChip = () => {
    if (!inputValue.trim()) return;

    const newValues = [...values, inputValue.trim()];
    onChange(newValues);
    setInputValue('');
  };

  const handleRemoveChip = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <View className="px-2 flex-row flex-wrap relative items-center gap-2" >
        {values.map((value, index) => (
          <Chip
            key={index}
            label={value}
            onRemove={() => handleRemoveChip(index)}
            variant={variant}
          />
        ))}
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={defaultPlaceholder}
            placeholderTextColor={colors.TEXT_2}
            onSubmitEditing={handleAddChip}
          onEndEditing={handleAddChip}
          onBlur={handleAddChip}
            onFocus={onFocus}
            returnKeyType="done"
            className="text"
            style={{
              flex: 1,
              fontFamily: 'NotoSansKR-Medium',
              fontSize: 15,
              paddingVertical: 0,  
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 10,
              includeFontPadding: false,
              paddingHorizontal:0,
              minHeight: 32,
              minWidth: 104,
            }}
          />
      </View>
  );
};

