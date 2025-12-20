import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubjectStickerService, type StickerResult } from '@shared/services';
import {DEVICE_WIDTH,DEVICE_HEIGHT} from '@constants/NORMAL';
import {BUTTON_SIZE_MEDIUM} from '@constants/NORMAL';
import { BackButton, Chip, LiquidGlassButton, Note } from '@components/index';
import PlusSmallIcon from '@assets/svgs/PlusSmall.svg';
interface ImageData {
  uri: string;
  fileName?: string;
  type?: string;
}

interface RecordModalProps {
  visible: boolean;
  onClose: () => void;
  image?: ImageData | null;
}

export const RecordModal = ({ visible, onClose, image }: RecordModalProps) => {
  const insets = useSafeAreaInsets();
  const [stickers, setStickers] = useState<StickerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);

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

  if (!visible) {
    return null;
  }

  // 원본 이미지 그대로 사용 (이미지 추출 기능 주석 처리)
  const imageUri = image?.uri;
  
  const ImageSticker = imageUri ? (
    <View style={{ width: DEVICE_WIDTH * 0.5, height: DEVICE_HEIGHT * 0.2}} className="bg-red-900">
      {/* 로딩 인디케이터 주석 처리 (이미지 추출 기능 주석 처리) */}
      {/* {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )} */}
      <Image
        source={{ uri: imageUri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  ) : null;

  return (
    <Portal>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
        }}
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
          <View className="flex-1 px-8">
          {/* 뒤로가기 버튼 */}
          <View className="w-full h-auto mb-2">
          <View style={{ zIndex: 10,transform: [{rotate: '45deg'}], width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
            <LiquidGlassButton onPress={onClose} size="medium">
              <PlusSmallIcon width={24} height={24} color="black" />
            </LiquidGlassButton>
          </View>
          </View>

          {/* 스티커 */}
          <View className="flex-row items-center justify-start bg-red-500">
            {ImageSticker}
          </View>

          {/* 칩 영역 */}
              <View className="w-full mb-4">
                <Chip chipType="LANDSCAPE"/>
              </View>
          
          </View>
      </View>
      </View>
    </Portal>
  );
};


