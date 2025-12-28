import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';
import { useTranslation } from 'react-i18next';
import {Background,Text,} from '@components/index';
import { ONBOARDING_IMAGES } from '../constants/images';
import { preloadOnboardingImages } from '../utils/preloadImages';

type Onboarding1ScreenNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH * 0.7; // 이미지 너비
const IMAGE_GAP = 16; // 이미지 간격

export const Onboarding1Screen = () => {
  const navigation = useNavigation<Onboarding1ScreenNavigationProp>();
  const { t } = useTranslation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 이미지 프리로딩 (컴포넌트 마운트 시 즉시 실행)
  useEffect(() => {
    preloadOnboardingImages();
  }, []);

  useEffect(() => {
    const totalWidth = ONBOARDING_IMAGES.length * (IMAGE_WIDTH + IMAGE_GAP);
    
    const runAnimation = () => {
      scrollX.setValue(0);
      
      if (animationRef.current) {
        animationRef.current.stop();
      }

      animationRef.current = Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: 40000, // 20초 동안 한 세트 이동
        easing: Easing.linear, // 등속도 운동
        useNativeDriver: true,
      });

      animationRef.current.start((finished) => {
        if (finished) {
          // 애니메이션이 완료되면 즉시 다시 시작
          runAnimation();
        }
      });
    };

    runAnimation();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return (
    <Background isStatusBarGap={true} isTabBarGap={false} >
      <TouchableOpacity 
        activeOpacity={1} 
        className="flex-1" 
        onPress={() => navigation.navigate('Onboarding2')}
      >
      <View className="flex-1 py-6 justify-between bg-[#EFEFEF]">
        {/* 제목 영역 */}
        <View className="items-center justify-center flex-1 mb-6">
          <Text text={t('screen1.title', { ns: 'onboarding' })} type="title1" className="text-center text-black font-bold" />
          <Text text={t('screen1.subtitle', { ns: 'onboarding' })} type="title3" className="text-center text-text-2r" />
          </View>
          {/* 히어로 */}
          <View className="flex-1 justify-center overflow-hidden">
            <Animated.View
              style={{
                flexDirection: 'row',
                transform: [{ translateX: scrollX }],
              }}
            >
              {/* 첫 번째 세트 */}
              {ONBOARDING_IMAGES.map((image, index) => (
                <View
                  key={`set1-${index}`}
                  style={{
                    marginRight: IMAGE_GAP,
                    borderRadius: 8,
                    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
                  } as any}
                >
                  <Image
                    source={image}
                    style={{
                      width: IMAGE_WIDTH,
                      height: IMAGE_WIDTH * 0.7,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                </View>
              ))}
              {/* 두 번째 세트 (무한 스크롤을 위해) */}
              {ONBOARDING_IMAGES.map((image, index) => (
                <View
                  key={`set2-${index}`}
                  style={{
                    marginRight: IMAGE_GAP,
                    borderRadius: 8,
                    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
                  } as any}
                >
                  <Image
                    source={image}
                    style={{
                      width: IMAGE_WIDTH,
                      height: IMAGE_WIDTH * 0.7,
                      borderRadius: 8,
                    }}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </Animated.View>
          </View>
          {/* 하단 안내 문구 */}
          <View className="flex-1 items-center justify-end">
            <Text text={t('screen1.continue', { ns: 'onboarding' })} type="body3" className="text-center text-text-2" />
          </View>
      </View>
      </TouchableOpacity>
    </Background>
  );
};