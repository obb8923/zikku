import { TouchableOpacity, Platform } from 'react-native';
import GoogleLogo from '@assets/svgs/GoogleLogo.svg';
import AppleLogo from '@assets/svgs/AppleLogo.svg';
import { Text } from '@components/Text';

export const AuthButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-center bg-black rounded-lg py-4 px-6">
    {Platform.OS === 'ios' ? <AppleLogo width={24} height={24} /> : <GoogleLogo width={24} height={24} />}
      <Text type="body1" text="로그인" className="text-white" />
    </TouchableOpacity>
  );
};