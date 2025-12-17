import { useState } from 'react';
import { View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { supabase } from '@libs/supabase/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@nav/stack/MoreStack';

type LoginScreenNavigationProp = NativeStackNavigationProp<MoreStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('로그인 실패', error.message);
      } else {
        Alert.alert('성공', '로그인되었습니다.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert('회원가입 실패', error.message);
      } else {
        Alert.alert('성공', '회원가입되었습니다. 이메일을 확인해주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background type="white" isStatusBarGap>
      <View className="flex-1 px-6 py-8">
        <Text type="title1" text="로그인" className="mb-8" />
        
        <View className="mb-4">
          <Text type="body2" text="이메일" className="mb-2" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            autoCapitalize="none"
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-base"
          />
        </View>

        <View className="mb-6">
          <Text type="body2" text="비밀번호" className="mb-2" />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white text-base"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-blue-500 rounded-lg py-4 mb-3 items-center"
          activeOpacity={0.8}
        >
          <Text type="body1" text={loading ? '처리 중...' : '로그인'} className="text-white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          className="bg-gray-500 rounded-lg py-4 items-center"
          activeOpacity={0.8}
        >
          <Text type="body1" text={loading ? '처리 중...' : '회원가입'} className="text-white" />
        </TouchableOpacity>
      </View>
    </Background>
  );
};

