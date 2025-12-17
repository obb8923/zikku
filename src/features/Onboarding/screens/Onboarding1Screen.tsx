import { View, Text, TouchableOpacity } from 'react-native';
import { useOnboardingStore } from '@stores/onboardingStore';

export const Onboarding1Screen = () => {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const handleComplete = async () => {
    await completeOnboarding();
  };

  return (
    <View className='flex-1 items-center justify-center bg-red-500'>
      <Text className="mb-8 text-white text-xl">Onboarding1Screen</Text>
      <TouchableOpacity
        onPress={handleComplete}
        className="px-6 py-3 bg-white rounded-lg"
        activeOpacity={0.8}
      >
        <Text className="text-blue-500 font-semibold text-base">온보딩 완료</Text>
      </TouchableOpacity>
    </View>
  );
}