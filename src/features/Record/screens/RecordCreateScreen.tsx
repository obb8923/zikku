import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { View, Text, Image } from 'react-native';
import type { MapStackParamList } from '@nav/stack/MapStack';

type RecordCreateRouteProp = RouteProp<MapStackParamList, 'RecordCreate'>;

export const RecordCreateScreen = () => {
  const route = useRoute<RecordCreateRouteProp>();
  const image = route.params?.image;

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
        </View>
      ) : (
        <Text className="text-gray-500">선택된 이미지가 없습니다.</Text>
      )}

      {/* TODO: 이후 텍스트 메모, 태그, 인물 연결 등 폼 요소 추가 */}
    </View>
  );
};


