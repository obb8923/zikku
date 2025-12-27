import { View, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background, LiquidGlassInput, LiquidGlassTextButton } from '@components/index';
import { Text } from '@components/Text';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import { COLORS } from '@constants/COLORS';
import XIcon from '@assets/svgs/X.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/shared/stores/authStore';
import { useEffect, useState } from 'react';
import { updateUserProfile, type UserProfile } from '@/shared/libs/supabase/userProfileService';

type MyInfoScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'MyInfo'>;

export const MyInfoScreen = () => {
  const navigation = useNavigation<MyInfoScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const userProfile = useAuthStore((s) => s.userProfile);
  const fetchUserProfile = useAuthStore((s) => s.fetchUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 편집용 상태
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    // 스토어의 프로필 정보로 편집 상태 초기화
    if (userProfile) {
      setEditedProfile(userProfile);
    }
  }, [userProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateUserProfile(editedProfile);
    setIsSaving(false);
    
    if (success) {
      // 스토어의 프로필 정보 갱신
      await fetchUserProfile();
      setIsEditing(false);
      Alert.alert('성공', '프로필이 업데이트되었습니다.');
    } else {
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setEditedProfile(userProfile || {});
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            const logout = useAuthStore.getState().logout;
            await logout();
            navigation.navigate('Map');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말 회원 탈퇴를 하시겠습니까?\n탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            const deleteAccount = useAuthStore.getState().deleteAccount;
            const success = await deleteAccount();
            if (success) {
              Alert.alert('완료', '회원 탈퇴가 완료되었습니다.');
              navigation.goBack();
            } else {
              Alert.alert('오류', '회원 탈퇴 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  return (
    <Background isStatusBarGap={false}>
      <View className="pt-4 px-6 mb-4 flex-row justify-between items-center">
        <Text 
          type="title3" 
          text="내 정보" 
          style={{ fontWeight: '600', color: COLORS.TEXT_2, flex: 1 }} 
        />
        <LiquidGlassButton size="small" onPress={() => navigation.goBack()}>
          <XIcon width={20} height={20} color={COLORS.TEXT} />
        </LiquidGlassButton>
      </View>
      <ScrollView
        className="flex-1 px-8"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="w-full items-center justify-center gap-6">
          {userProfile ? (
            <View className="w-full gap-4">
              {/* 아바타 */}
              <View className="w-full items-center">
                <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                  {editedProfile.avatar_url ? (
                    <Image 
                      source={{ uri: editedProfile.avatar_url }} 
                      style={{ width: 96, height: 96 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text type="title2" text={editedProfile.nickname?.charAt(0).toUpperCase() || userProfile?.nickname?.charAt(0).toUpperCase() || 'U'} />
                  )}
                </View>
              </View>

              {/* 닉네임 */}
              <View className="w-full gap-2">
                <Text type="body2" text="닉네임" className="text-gray-600" />
                {isEditing ? (
                  <LiquidGlassInput
                    value={editedProfile.nickname || ''}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, nickname: text })}
                    placeholder="닉네임을 입력하세요"
                  />
                ) : (
                  <View className="w-full p-4 rounded-lg bg-gray-50">
                    <Text type="body1" text={userProfile.nickname || '닉네임 없음'} />
                  </View>
                )}
              </View>

              {/* 사용자 코드 (읽기 전용) */}
              <View className="w-full gap-2">
                <Text type="body2" text="사용자 코드" className="text-gray-600" />
                <View className="w-full p-4 rounded-lg bg-gray-50">
                  <Text type="body1" text={userProfile.code || '코드 없음'} />
                </View>
              </View>

              {/* 편집/저장 버튼 */}
              <View className="w-full gap-3 mt-4">
                {isEditing ? (
                  <View className="w-full gap-3 flex-row">
                    <View className="flex-1">
                      <LiquidGlassTextButton
                        text="취소"
                        onPress={handleCancel}
                        size="large"
                        tintColor="rgba(255,255,255,0.2)"
                        textStyle={{ color: 'black', fontWeight: 'bold' }}
                      />
                    </View>
                    <View className="flex-1">
                      <LiquidGlassTextButton
                        text={isSaving ? '저장 중...' : '저장'}
                        onPress={handleSave}
                        size="large"
                        tintColor="white"
                        textStyle={{ color: 'black', fontWeight: 'bold' }}
                        disabled={isSaving}
                      />
                    </View>
                  </View>
                ) : (
                  <LiquidGlassTextButton
                    text="편집"
                    onPress={() => setIsEditing(true)}
                    size="large"
                    tintColor="white"
                    textStyle={{ color: 'black', fontWeight: 'bold' }}
                  />
                )}
              </View>

              {/* 로그아웃/회원 탈퇴 버튼 */}
              <View className="w-full gap-3 mt-6">
                <LiquidGlassTextButton
                  text="로그아웃"
                  onPress={handleLogout}
                  size="large"
                  tintColor="rgba(255,255,255,0.2)"
                  textStyle={{ color: 'black', fontWeight: 'bold' }}
                />
                <LiquidGlassTextButton
                  text="회원 탈퇴"
                  onPress={handleDeleteAccount}
                  size="large"
                  tintColor="rgba(255,0,0,0.1)"
                  textStyle={{ color: '#DC2626', fontWeight: 'bold' }}
                />
              </View>
            </View>
          ) : (
            <Text type="body1" text="사용자 정보를 불러올 수 없습니다." className="text-text-2"/>
          )}
        </View>
      </ScrollView>
    </Background>
  );
};

