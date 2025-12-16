import React from 'react';
import { StyleProp, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useColors } from '@shared/hooks/useColors';

type SearchInputProps = Omit<TextInputProps, 'style' | 'className'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export const SearchInput = ({ className = '', ...props }: SearchInputProps) => {
  const colors = useColors();

  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor || colors.TEXT_2}
      returnKeyType={props.returnKeyType || 'search'}
      className={`flex-1 px-2 rounded-xl bg-component-background border border-border text-text ${className}`}
      style={{
        fontFamily: 'NotoSansKR-Medium',
        fontSize: 15,
        paddingTop: 10,
        paddingBottom: 10,
        includeFontPadding: false,
        ...props.style,
      }}
    />
  );
};

