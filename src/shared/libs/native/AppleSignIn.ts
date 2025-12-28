import { NativeModules } from 'react-native';
const { AppleSignInModule } = NativeModules;

export async function signInWithAppleNative(): Promise<string> {
  const result = await AppleSignInModule.signInWithApple();
  return result.idToken;
} 