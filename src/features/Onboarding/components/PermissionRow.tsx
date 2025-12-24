import React from 'react';
import { View } from 'react-native';

import { Text } from '@components/Text';
import { COLORS } from '@constants/COLORS';

export type PermissionRowProps = {
  title: string;
  description: string;
  granted: boolean;
  Icon: React.ComponentType<any>;
};

export const PermissionRow = ({ title, description, granted, Icon }: PermissionRowProps) => {
  return (
    <View className="flex-row items-start">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          granted ? 'bg-greenTab' : 'bg-gray-200'
        }`}
      >
        <Icon width={18} height={18} color={granted ? COLORS.TEXT : COLORS.TEXT_2} />
      </View>
      <View className="flex-1">
        <Text text={title} type="body1" />
        <View className="mt-1">
          <Text
            text={description}
            type="body3"
            style={{ color: COLORS.TEXT_2 }}
          />
        </View>
      </View>
    </View>
  );
};


