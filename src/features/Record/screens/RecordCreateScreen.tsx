import React, { useState } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { SubjectStickerService, type StickerResult } from '@shared/services';

type RecordCreateRouteProp = RouteProp<MapStackParamList, 'RecordCreate'>;

export const RecordCreateScreen = () => {
  const route = useRoute<RecordCreateRouteProp>();
  const image = route.params?.image;

  const [stickers, setStickers] = useState<StickerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractSubjects = async () => {
    if (!image?.uri) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isSupported = await SubjectStickerService.isSupported();

      if (!isSupported) {
        setError('이 기기에서는 자동 피사체 추출을 지원하지 않습니다.');
        setStickers([]);
        return;
      }

      const results = await SubjectStickerService.analyzeImage(image.uri);
      if (!results.length) {
        setError('이미지에서 피사체를 찾지 못했습니다.');
      }
      setStickers(results);
    } catch (e) {
      setError('피사체 추출 중 오류가 발생했습니다.');
      setStickers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-4 pt-16">
      <Text className="mb-4 text-lg font-semibold text-black">새 기록 작성</Text>

      {image ? (
        <View className="items-center">
          <Image
            source={{ uri: image.uri }}
            className="h-48 w-48 rounded-xl bg-gray-200"
            resizeMode="cover"
          />
          {image.fileName ? (
            <Text className="mt-2 text-sm text-gray-600">{image.fileName}</Text>
          ) : null}

          <TouchableOpacity
            className="mt-4 rounded-full bg-black px-5 py-2"
            onPress={handleExtractSubjects}
            disabled={isLoading}
          >
            <Text className="text-sm font-semibold text-white">
              {isLoading ? '추출 중...' : '피사체 자동 추출'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text className="text-gray-500">선택된 이미지가 없습니다.</Text>
      )}

      {isLoading && (
        <View className="mt-4 flex-row items-center">
          <ActivityIndicator />
          <Text className="ml-2 text-sm text-gray-600">이미지에서 피사체를 찾는 중입니다...</Text>
        </View>
      )}

      {error && (
        <Text className="mt-4 text-sm text-red-500">{error}</Text>
      )}

      {stickers.length > 0 && (
        <View className="mt-6">
          <Text className="mb-2 text-sm font-semibold text-black">추출된 스티커</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stickers.map(sticker => (
              <View key={sticker.id} className="mr-3 items-center">
                <Image
                  source={{ uri: sticker.uri }}
                  style={{ width: 96, height: 96 }}
                  className="rounded-xl bg-gray-100"
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* TODO: 이후 텍스트 메모, 태그, 인물 연결 등 폼 요소 추가 */}
    </View>
  );
};


