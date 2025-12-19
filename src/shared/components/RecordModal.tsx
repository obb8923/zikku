import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubjectStickerService, type StickerResult } from '@shared/services';

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

  useEffect(() => {
    if (visible && image?.uri) {
      handleExtractSubjects();
    } else {
      // 모달이 닫히면 상태 초기화
      setStickers([]);
      setIsLoading(false);
      setExtractionFailed(false);
    }
  }, [visible, image?.uri]);

  const handleExtractSubjects = async () => {
    if (!image?.uri) {
      console.log('[RecordModal] 스티커 추출 시작: 이미지 URI가 없습니다.');
      return;
    }

    console.log('[RecordModal] 스티커 추출 시작:', { imageUri: image.uri });
    setIsLoading(true);
    setExtractionFailed(false);

    try {
      console.log('[RecordModal] 지원 여부 확인 중...');
      const isSupported = await SubjectStickerService.isSupported();
      console.log('[RecordModal] 지원 여부:', isSupported);

      if (!isSupported) {
        console.log('[RecordModal] 스티커 추출이 지원되지 않습니다.');
        setExtractionFailed(true);
        setStickers([]);
        return;
      }

      console.log('[RecordModal] 이미지 분석 시작:', image.uri);
      const results = await SubjectStickerService.analyzeImage(image.uri);
      console.log('[RecordModal] 분석 결과:', {
        count: results.length,
        results: results.map(r => ({
          id: r.id,
          uri: r.uri,
          width: r.width,
          height: r.height,
          method: r.method,
        })),
      });

      if (results.length > 0) {
        console.log('[RecordModal] 스티커 추출 성공:', results.length, '개');
        setStickers(results);
        setExtractionFailed(false);
      } else {
        console.log('[RecordModal] 스티커 추출 실패: 결과가 없습니다.');
        setExtractionFailed(true);
        setStickers([]);
      }
    } catch (e) {
      console.error('[RecordModal] 스티커 추출 에러:', e);
      setExtractionFailed(true);
      setStickers([]);
    } finally {
      setIsLoading(false);
      console.log('[RecordModal] 스티커 추출 완료');
    }
  };

  if (!visible) {
    return null;
  }

  // 스티커가 있으면 스티커를, 없으면 원본 이미지를 렌더링
  const imageUri = stickers.length > 0 && !isLoading ? stickers[0].uri : image?.uri;
  
  const ImageSticker = imageUri ? (
    <View style={{ width: 300, height: 300, backgroundColor: '#000000' }}>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
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
      >
        {/* 배경 오버레이 */}
        <View
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1"
          style={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingHorizontal: 32,
          }}
        >
        {/* 스티커 */}
        <View className="flex-row items-center justify-start">
         {ImageSticker}
         </View>
        </View>
      </View>
    </Portal>
  );
};


