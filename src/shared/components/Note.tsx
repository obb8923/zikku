import React, { ReactNode } from 'react';
import { LiquidGlassView } from './LiquidGlassView';
import { Text } from './Text';

type NoteProps = {
  text?: string;
  children?: ReactNode;
  // 상위에서 detail 모드 등일 때 상호작용 비활성화용
  interactive?: boolean;
};

export const Note = ({ text, children, interactive = true }: NoteProps) => {
  return (
    <LiquidGlassView
      borderRadius={12}
      className="w-full"
      interactive={interactive}
      innerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      {text ? <Text type="body2" text={text} /> : children}
    </LiquidGlassView>
  );
};

