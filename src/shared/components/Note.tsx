import React, { ReactNode } from 'react';
import { LiquidGlassView } from './LiquidGlassView';
import { Text } from './Text';

type NoteProps = {
  text?: string;
  children?: ReactNode;
};

export const Note = ({ text, children }: NoteProps) => {
  return (
    <LiquidGlassView
      borderRadius={12}
      className="w-full"
      innerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      {text ? <Text type="body2" text={text} /> : children}
    </LiquidGlassView>
  );
};

