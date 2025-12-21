import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubjectStickerService, type StickerResult } from '@shared/services';
import {DEVICE_WIDTH,DEVICE_HEIGHT} from '@constants/NORMAL';
import {BUTTON_SIZE_MEDIUM} from '@constants/NORMAL';
import { Chip, LiquidGlassButton, Text } from '@components/index';
import PlusSmallIcon from '@assets/svgs/PlusSmall.svg';
interface ImageData {
  uri: string;
  fileName?: string;
  type?: string;
  width?: number;
  height?: number;
}

interface RecordModalProps {
  visible: boolean;
  onClose: () => void;
  image?: ImageData | null;
}

export const RecordModal = ({ visible, onClose, image }: RecordModalProps) => {
  const insets = useSafeAreaInsets();
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [displayImageSize, setDisplayImageSize] = useState<{ width: number; height: number } | null>(null);

  // URI 정규화 함수
  const normalizeUri = (uri: string): string => {
    if (!uri) return uri;
    
    // 이미 올바른 형식인 경우 그대로 반환
    if (uri.startsWith('http://') || 
        uri.startsWith('https://') || 
        uri.startsWith('file://') ||
        uri.startsWith('content://') ||
        uri.startsWith('ph://') ||
        uri.startsWith('assets-library://')) {
      return uri;
    }
    
    // 절대 경로인 경우 file:// 추가
    if (uri.startsWith('/')) {
      return `file://${uri}`;
    }
    
    return uri;
  };

  // 이미지 크기 가져오기 (여러 방법 시도)
  const getImageSizeWithFallback = async (uri: string): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      // 방법 1: resolveAssetSource로 경로 처리 시도 (로컬 파일)
      try {
        const resolvedSource = Image.resolveAssetSource({ uri });
        if (resolvedSource && resolvedSource.width && resolvedSource.height) {
          console.log('[RecordModal] resolveAssetSource로 크기 가져오기 성공:', {
            width: resolvedSource.width,
            height: resolvedSource.height,
            uri
          });
          resolve({
            width: resolvedSource.width,
            height: resolvedSource.height
          });
          return;
        }
      } catch (error) {
        console.log('[RecordModal] resolveAssetSource 실패:', error);
      }

      // 방법 2: file:// 접두사 제거 후 시도 (iOS 시뮬레이터 호환성)
      let uriToTry = uri;
      if (uri.startsWith('file://')) {
        uriToTry = uri.replace('file://', '');
        console.log('[RecordModal] file:// 제거 후 시도:', uriToTry);
        
        Image.getSize(
          uriToTry,
          (width, height) => {
            console.log('[RecordModal] Image.getSize (file:// 제거) 성공:', { width, height });
            resolve({ width, height });
          },
          (error) => {
            console.log('[RecordModal] Image.getSize (file:// 제거) 실패, 원본 URI 시도:', error);
            // 방법 3: 원본 URI로 다시 시도
            tryGetSizeWithOriginalUri(uri, resolve);
          }
        );
        return;
      }

      // 방법 3: 원본 URI로 시도
      tryGetSizeWithOriginalUri(uri, resolve);
    });
  };

  // 원본 URI로 Image.getSize 시도
  const tryGetSizeWithOriginalUri = (uri: string, resolve: (value: { width: number; height: number } | null) => void) => {
    Image.getSize(
      uri,
      (width, height) => {
        console.log('[RecordModal] Image.getSize (원본 URI) 성공:', { width, height, uri });
        resolve({ width, height });
      },
      (error) => {
        console.error('[RecordModal] Image.getSize 최종 실패:', error, 'URI:', uri);
        resolve(null);
      }
    );
  };

  // 이미지 원본 크기 가져오기
  useEffect(() => {
    if (!image?.uri) {
      setImageSize(null);
      return;
    }

    let isCancelled = false;
    
    console.log('[RecordModal] 이미지 URI 확인:', image.uri);
    console.log('[RecordModal] 이미지 metadata:', { width: image.width, height: image.height });
    
    // metadata에서 크기 정보가 있으면 우선 사용
    if (image.width && image.height && image.width > 0 && image.height > 0) {
      console.log('[RecordModal] metadata에서 크기 정보 사용:', { width: image.width, height: image.height });
      setImageSize({ width: image.width, height: image.height });
      return;
    }
    
    // URI 정규화: 로컬 파일 경로 처리
    const normalizedUri = normalizeUri(image.uri);
    console.log('[RecordModal] 정규화된 URI:', normalizedUri);
    
    // 이미지 크기 가져오기 (resolveAssetSource 우선, 실패 시 Image.getSize)
    getImageSizeWithFallback(normalizedUri).then((size) => {
      if (isCancelled) return;
      
      if (!size || !size.width || !size.height || size.width <= 0 || size.height <= 0) {
        console.warn('[RecordModal] 이미지 크기가 유효하지 않음:', size);
        setImageSize(null);
        return;
      }
      
      setImageSize({ width: size.width, height: size.height });
    }).catch((error) => {
      if (isCancelled) return;
      console.error('[RecordModal] 이미지 크기 가져오기 최종 실패:', error);
      setImageSize(null);
    });

    return () => {
      isCancelled = true;
    };
  }, [image?.uri]);

  // 상위 뷰 폭과 이미지 원본 크기를 기반으로 표시 크기 계산
  useEffect(() => {
    if (!containerWidth || !imageSize) {
      setDisplayImageSize(null);
      return;
    }

    // padding 8 * 2 = 16 (좌우 각 8) = 32px 총
    // Tailwind p-8은 32px이므로 좌우 각 32px = 64px
    const padding = 64; // p-8 = 32px * 2
    const availableWidth = containerWidth - padding;
    
    // 이미지 비율 계산
    const imageAspectRatio = imageSize.width / imageSize.height;
    
    // 상위 뷰의 폭을 기준으로 width 결정
    const displayWidth = availableWidth;
    // 비율에 맞춰 height 계산: (원본 height / 원본 width) * 설정된 width
    const displayHeight = (imageSize.height / imageSize.width) * displayWidth;
    
    setDisplayImageSize({ width: displayWidth, height: displayHeight });
  }, [containerWidth, imageSize]);

  // 이미지 추출 기능 임시 주석 처리
  // useEffect(() => {
  //   if (visible && image?.uri) {
  //     // UI가 먼저 렌더링되도록 무거운 작업을 다음 프레임으로 지연
  //     const timeoutId = setTimeout(() => {
  //       handleExtractSubjects();
  //     }, 0);
  //     
  //     return () => {
  //       clearTimeout(timeoutId);
  //     };
  //   } else {
  //     // 모달이 닫히면 상태 초기화
  //     setStickers([]);
  //     setIsLoading(false);
  //     setExtractionFailed(false);
  //   }
  // }, [visible, image?.uri]);

  // 이미지 추출 기능 임시 주석 처리
  // const handleExtractSubjects = async () => {
  //   if (!image?.uri) {
  //     return;
  //   }

  //   setIsLoading(true);
  //   setExtractionFailed(false);

  //   try {
  //     const isSupported = await SubjectStickerService.isSupported();
  //     console.log('[RecordModal] 지원 여부:', isSupported);

  //     if (!isSupported) {
  //       setExtractionFailed(true);
  //       setStickers([]);
  //       return;
  //     }

  //     const results = await SubjectStickerService.analyzeImage(image.uri);
  //     console.log('[RecordModal] 분석 결과:', {
  //       count: results.length,
  //       results: results.map(r => ({
  //         id: r.id,
  //         uri: r.uri,
  //         width: r.width,
  //         height: r.height,
  //         method: r.method,
  //       })),
  //     });

  //     if (results.length > 0) {
  //       setStickers(results);
  //       setExtractionFailed(false);
  //     } else {
  //       setExtractionFailed(true);
  //       setStickers([]);
  //     }
  //   } catch (e) {
  //     setExtractionFailed(true);
  //     setStickers([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // 원본 이미지 그대로 사용 (이미지 추출 기능 주석 처리)
  // iOS에서 file:// 경로는 제거한 버전이 더 잘 작동할 수 있음
  const getImageSourceUri = (uri: string | undefined): string | undefined => {
    if (!uri) return undefined;
    // file:// 접두사 제거 (iOS 호환성)
    if (uri.startsWith('file://')) {
      return uri.replace('file://', '');
    }
    return normalizeUri(uri);
  };
  
  // const imageUri = image?.uri ? getImageSourceUri(image.uri) : undefined;
  const imageUri = image?.uri;

  // 이미지 URI 변경 로그
  useEffect(() => {
    if (imageUri) {
      console.log('[RecordModal] 렌더링용 이미지 URI:', imageUri);
    } else {
      console.log('[RecordModal] 이미지 URI 없음');
    }
  }, [imageUri]);

  if (!visible) {
    return null;
  }
  
  return (
    <Portal>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
        pointerEvents="box-none"
      >
        {/* 배경 오버레이 */}
        <View
          className="absolute inset-0"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.8)'}}
          pointerEvents="none"
        />
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1"
          style={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
          pointerEvents="box-none"
        >
          {/* 모달 컨텐츠 영역 */}
          <View className="flex-1 px-8 justify-between">
          {/* 뒤로가기 버튼 */}
          <View className="w-full h-auto mb-2">
          <View style={{ zIndex: 10,transform: [{rotate: '45deg'}], width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
            <LiquidGlassButton onPress={onClose} size="medium">
              <PlusSmallIcon width={24} height={24} color="black" />
            </LiquidGlassButton>
          </View>
          </View>


          {/* 폴라로이드 */}
          <View 
          className="w-auto p-8" 
          style={{ 
            maxHeight: DEVICE_HEIGHT * 0.6,
            maxWidth: DEVICE_WIDTH * 0.7,
            minHeight: DEVICE_HEIGHT * 0.3,
            minWidth: DEVICE_WIDTH * 0.4,
            backgroundColor: '#E1E0DF'
          }}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setContainerWidth(width);
          }}
          >
          {/* 스티커 */}
          {imageUri && displayImageSize && (
            <View 
              style={{
                width: displayImageSize.width,
                height: displayImageSize.height,
                alignSelf: 'center',
                backgroundColor: '#000'
              }}
            >
              <Image
                source={{ uri: imageUri }}
                style={{ 
                  width: displayImageSize.width, 
                  height: displayImageSize.height 
                }}
                resizeMode="contain"
              />
            </View>
          )}
          {/* 여백, 노트 */}
          <View className="w-full h-24 bg-red-500">
            <Text text="12:34" type="digit" />
            {/* <Note text="노트" /> */}
          </View>
          </View>

          {/* 칩 영역 */}
              <View className="w-full mb-4 h-1/12 bg-red-500">
                <Chip chipType="LANDSCAPE"/>
              </View>
          
          </View>
      </View>
      </View>
    </Portal>
  );
};


