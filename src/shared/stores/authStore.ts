import { create } from 'zustand';
import { supabase } from '@libs/supabase/supabase.ts'; // supabase 클라이언트 경로 확인 필요
import { Alert, Platform } from 'react-native';
import { getUserProfile, type UserProfile } from '@libs/supabase/userProfileService';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  userId: string | null;
  userProfile: UserProfile | null;
  checkLoginStatus: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  handleGoogleLogin: () => Promise<void>;
  handleAppleLogin: () => Promise<void>;
  handleEmailLogin: (email: string, password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  isLoading: false,
  userId: null,
  userProfile: null,
  checkLoginStatus: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ 
          isLoggedIn: true,
          userId: session.user.id
        });
        if (__DEV__) {
          console.log('[AuthStore] isLoggedIn set to true in checkLoginStatus()');
        }
        // 로그인 상태 확인 후 프로필 가져오기
        await get().fetchUserProfile();
      } else {
        set({ 
          isLoggedIn: false,
          userId: null,
          userProfile: null
        });
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      set({ 
        isLoggedIn: false,
        userId: null,
        userProfile: null
      });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchUserProfile: async () => {
    try {
      const profile = await getUserProfile();
      
      // 프로필을 가져오지 못한 경우 로그아웃 처리
      if (!profile) {
        console.log('[AuthStore] 프로필을 가져오지 못함. 로그아웃 처리합니다.');
        await get().logout();
        return;
      }
      
      set({ userProfile: profile });
      if (__DEV__) {
        console.log('[AuthStore] User profile fetched:', profile);
      }
    } catch (error) {
      console.error('[AuthStore] Error fetching user profile:', error);
      // 에러 발생 시에도 로그아웃 처리
      console.log('[AuthStore] 프로필 가져오기 에러 발생. 로그아웃 처리합니다.');
      await get().logout();
    }
  },
  login: () => {
    set({ isLoggedIn: true, isLoading: false });
    if (__DEV__) {
      console.log('[AuthStore] isLoggedIn set to true in login()');
    }
  },
  logout: async () => {
    set({ isLoading: true });
    try {
      // Supabase 연결 끊기
      await supabase.auth.signOut();
      set({
        isLoggedIn: false,
        userId: null,
        userProfile: null,
      });
      if (__DEV__) {
        console.log('[AuthStore] 로그아웃 완료');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      // 에러가 발생해도 로그아웃 상태로 설정
      set({ 
        isLoggedIn: false,
        userId: null,
        userProfile: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  deleteAccount: async () => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        set({ isLoading: false });
        return false;
      }

      // users 테이블에서 사용자 데이터 삭제
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('users 테이블 삭제 오류:', deleteError);
        Alert.alert('오류', '사용자 데이터 삭제 중 오류가 발생했습니다.');
        set({ isLoading: false });
        return false;
      }

      // 로그아웃 처리 (Auth 계정은 서버에서 처리하거나 별도 API 필요)
      await supabase.auth.signOut();
      set({
        isLoggedIn: false,
        userId: null,
        userProfile: null,
      });
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('오류', '회원 탈퇴 중 오류가 발생했습니다.');
      set({ isLoading: false });
      return false;
    }
  },
  handleGoogleLogin: async () => {
    if (Platform.OS === 'ios') {
      Alert.alert('알림', 'iOS에서는 Apple 로그인만 지원됩니다.');
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      console.log('Google UserInfo:', JSON.stringify(userInfo, null, 2));

      if (userInfo && userInfo.data && userInfo.data.idToken) {
        const idToken = userInfo.data.idToken;
        console.log('Google ID Token received:', idToken);

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          options: {
            queryParams: {
              prompt: 'select_account'
            }
          }as any
        });

        if (error) {
          console.error('Supabase 로그인 에러 상세:', {
            message: error.message,
            status: error.status,
            name: error.name,
            details: error
          });
          let errorMessage = '로그인 중 오류가 발생했습니다.';
          if (error.status === 400) {
            errorMessage = '인증 정보가 올바르지 않습니다.';
          } else if (error.status === 500) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
          Alert.alert('Google 로그인 오류', errorMessage);
          set({ isLoggedIn: false });
        } else if (data.session) {
          console.log('구글 로그인 성공, 현재 사용자 정보:', data.user);
          
          set({ 
            isLoggedIn: true,
            userId: data.user.id 
          });
          if (__DEV__) {
            console.log('[AuthStore] isLoggedIn set to true in handleGoogleLogin()');
          }
          // 로그인 성공 후 프로필 가져오기
          await get().fetchUserProfile();
        }
      } else {
        console.error('Google ID 토큰을 받지 못했습니다:', userInfo);
        Alert.alert('Google 로그인 오류', 'Google 인증 정보를 받지 못했습니다.');
        set({ isLoggedIn: false });
      }
    } catch (error: any) {
      if (error.code) {
        console.log('Google Sign-In error code:', error.code, error.message);
        if (String(error.code) !== '12501' && String(error.code) !== 'SIGN_IN_CANCELLED') {
          Alert.alert('Google 로그인 오류', `오류 코드: ${error.code} - ${error.message}`);
        }
      } else {
        console.log('Google Sign-In unexpected error:', error);
        Alert.alert('Google 로그인 오류', '알 수 없는 오류가 발생했습니다.');
      }
      set({ isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
  handleAppleLogin: async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('알림', 'Apple 로그인은 iOS에서만 지원됩니다.');
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      // 네이티브 모듈에서 idToken 받아오기
      const { signInWithAppleNative } = await import('../libs/native/AppleSignIn');
      const idToken = await signInWithAppleNative();
      
      if (!idToken) {
        Alert.alert('Apple 로그인 오류', 'idToken을 받아오지 못했습니다.');
        set({ isLoggedIn: false });
        return;
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });
      // console.log('data: ',data)

      if (error) {
        Alert.alert('Apple 로그인 오류', error.message || '로그인 중 오류가 발생했습니다.');
        set({ isLoggedIn: false });
      } else if (data.session) {
        set({
          isLoggedIn: true,
          userId: data.user.id,
        });
        if (__DEV__) {
          console.log('[AuthStore] isLoggedIn set to true in handleAppleLogin()');
        }
        // 로그인 성공 후 프로필 가져오기
        await get().fetchUserProfile();
      }
    } catch (error: any) {
      Alert.alert('Apple 로그인 오류', error.message || '알 수 없는 오류가 발생했습니다.');
      set({ isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
  handleEmailLogin: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        let errorMessage = '로그인 중 오류가 발생했습니다.';
        if (error.status === 400) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (error.status === 429) {
          errorMessage = '로그인 시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.status === 500) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        Alert.alert('이메일 로그인 오류', errorMessage);
        set({ isLoggedIn: false });
        return false;
      } else if (data.session) {
        set({
          isLoggedIn: true,
          userId: data.user.id,
        });
        if (__DEV__) {
          console.log('[AuthStore] isLoggedIn set to true in handleEmailLogin()');
        }
        // 로그인 성공 후 프로필 가져오기
        await get().fetchUserProfile();
        
        return true;
      }
      return false;
    } catch (error: any) {
      Alert.alert('이메일 로그인 오류', error.message || '알 수 없는 오류가 발생했습니다.');
      set({ isLoggedIn: false });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
