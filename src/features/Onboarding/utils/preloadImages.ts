import { Image, ImageSourcePropType } from 'react-native';
import { ONBOARDING_IMAGES } from '../constants/images';

/**
 * 온보딩 이미지들을 프리로딩합니다.
 * Image.prefetch를 사용하여 모든 이미지를 미리 메모리에 로드합니다.
 * 
 * @returns Promise<void> - 모든 이미지 프리로딩이 완료되면 resolve됩니다.
 */
export const preloadOnboardingImages = async (): Promise<void> => {
  try {
    // 모든 온보딩 이미지를 병렬로 프리로딩
    const preloadPromises = ONBOARDING_IMAGES.map((imageSource: ImageSourcePropType) => {
      // require로 로드된 이미지는 Image.resolveAssetSource를 사용하여 URI를 얻어야 합니다
      const resolvedSource = Image.resolveAssetSource(imageSource);
      if (resolvedSource?.uri) {
        return Image.prefetch(resolvedSource.uri);
      }
      return Promise.resolve();
    });

    await Promise.all(preloadPromises);
  } catch (error) {
    // 프리로딩 실패해도 앱은 정상 동작해야 하므로 에러를 무시합니다
     
  }
};

