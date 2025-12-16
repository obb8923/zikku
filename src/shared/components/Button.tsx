import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Text } from '@components/Text';

export type ButtonProps = {
  text: string;
  onPress: () => void;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const Button = ({ text, onPress, backgroundColor, style }: ButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 items-center justify-center rounded-full relative ${backgroundColor ? '' : 'bg-component-background'}`}
      style={[backgroundColor ? { backgroundColor } : undefined, style]}
    >
      {/* <View
      className="absolute top-0 left-0 right-0 bottom-0 rounded-full"
      style={{
        boxShadow: [
          {
            inset: true,
            offsetX: 0,
            offsetY: 0,
            blurRadius: 7.5,
            spreadDistance: 0,
            color: 'rgba(255, 255, 255, 0.7)',
          },
        ],
      }}
    />
    <View
      className="absolute top-0 left-0 right-0 bottom-0 rounded-full"
      style={{
        boxShadow: [
          {
            inset: true,
            offsetX: 0,
            offsetY: 0,
            blurRadius: 2.5,
            spreadDistance: 0,
            color: 'rgba(255, 255, 255, 0.7)',
          },
        ],
      }}
    /> */}
      <Text text={text} className="text-text" type="body1" numberOfLines={1} />
    </TouchableOpacity>
  );
};