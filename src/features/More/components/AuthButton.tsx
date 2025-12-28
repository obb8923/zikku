import { TouchableOpacity, Platform, View } from 'react-native';
import GoogleLogo from '@assets/svgs/GoogleLogo.svg';
import AppleLogo from '@assets/svgs/AppleLogo.svg';
import { Text } from '@components/Text';
import { useHapticFeedback } from '@hooks/useHapticFeedback';
import {BUTTON_SIZE_MEDIUM} from '@constants/NORMAL';
export const AuthButton = ({ onPress }: { onPress: () => void }) => {
  const haptic = useHapticFeedback();
  return (
    <TouchableOpacity 
      onPress={() => {
        haptic.impact('light');
        onPress();
      }}
      className="flex-row items-center justify-center bg-white"
      style={{
        minWidth: 150,
        width: '100%',
        minHeight: BUTTON_SIZE_MEDIUM,
        paddingVertical: 3, // 버튼 높이의 1/10 (30pt * 0.1 = 3pt)
        paddingHorizontal: 12,
        borderRadius: 6, // 기본 모서리 반경
      }}
    >
      <View className="flex-row items-center gap-2">
        {Platform.OS === 'ios' ? (
          <AppleLogo width={20} height={20} color="black"/>
        ) : (
          <GoogleLogo width={20} height={20} />
        )}
        <Text type="body1" text="Apple로 로그인" className="text-black font-bold" />
      </View>
    </TouchableOpacity>
  );
};