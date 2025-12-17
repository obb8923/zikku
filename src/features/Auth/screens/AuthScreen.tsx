import { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { supabase } from '@libs/supabase/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';
import { useAuthStore } from '@stores/authStore';

import { AuthButton } from '../components/AuthButton';
type AuthScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'Auth'>;

export const AuthScreen = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [loading, setLoading] = useState(false);
  const handleGoogleLogin = useAuthStore((s) => s.handleGoogleLogin);
  const handleAppleLogin = useAuthStore((s) => s.handleAppleLogin);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // 로그인 성공 시 이전 화면으로 돌아가기
  useEffect(() => {
    if (isLoggedIn) {
      navigation.goBack();
    }
  }, [isLoggedIn, navigation]);


  const handleLoginPress = async () => {
    if(Platform.OS === 'ios') {
      await handleAppleLogin();
    } else {
      await handleGoogleLogin();
    }
  };
  return (
    <Background type="white" isStatusBarGap>
      <AuthButton onPress={handleLoginPress} />
    </Background>
  );
};

