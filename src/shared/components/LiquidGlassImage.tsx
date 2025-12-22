import { Image, ImageStyle, StyleProp, View } from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';
import { BUTTON_SIZE_XXLARGE } from '@constants/NORMAL';
interface LiquidGlassImageProps {
  source: string;
  tintColor?: string;
}

export const LiquidGlassImage = ({ source, tintColor = "rgba(255,255,255)"}: LiquidGlassImageProps) => {
    const width = BUTTON_SIZE_XXLARGE;
    const height = BUTTON_SIZE_XXLARGE;
  return (
    <View style={{width, height, borderRadius: 999, overflow: 'hidden'}}>
      <Image 
        source={{ uri: source }}
        style={{ width: '100%', height: '100%', zIndex: 0, borderRadius:999 }}
        resizeMode="cover"
      />
      <LiquidGlassView 
        borderRadius={999}
        tintColor={tintColor}
        style={{
            width,
            height,
          position: 'absolute',
          opacity: 0.5
        }}
        innerStyle={{
            width,
            height,
            borderRadius:999,
        }}
        effect="clear"
      />
    </View>
  );
}
