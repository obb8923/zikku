import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';
import { Background, Text, LiquidGlassView } from '@components/index';
import { useOnboarding } from '@hooks/useOnboarding';

type Onboarding2ScreenNavigationProp = NativeStackNavigationProp<OnboardingStackParamList, 'Onboarding2'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BALL_SIZE = SCREEN_WIDTH * 0.4; // 공 크기
const IMAGE_GAP = 16; // 이미지 간격

const onboardingImages = [
  require('@assets/pngs/onboarding/1.png'),
  require('@assets/pngs/onboarding/2.png'),
  require('@assets/pngs/onboarding/3.png'),
  require('@assets/pngs/onboarding/4.png'),
  require('@assets/pngs/onboarding/5.png'),
  require('@assets/pngs/onboarding/6.png'),
];

export const Onboarding2Screen = () => {
  const navigation = useNavigation<Onboarding2ScreenNavigationProp>();
  const { completeOnboarding } = useOnboarding();
  const scrollX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const totalWidth = onboardingImages.length * (BALL_SIZE + IMAGE_GAP);
    
    const runAnimation = () => {
      scrollX.setValue(0);
      
      if (animationRef.current) {
        animationRef.current.stop();
      }

      animationRef.current = Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: 40000, // 40초 동안 한 세트 이동
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
        onPress={() => navigation.navigate('Onboarding3')}
      >
      <View className="flex-1 py-6 justify-between bg-[#EFEFEF]">
        {/* 제목 영역 */}
        <View className="items-center justify-center flex-1 mb-6">
          <Text text="구슬에 담아 기록하세요" type="title1" className="text-center text-black font-bold" />
          <Text text="이 순간이 잊혀지지 않도록" type="title3" className="text-center text-text-2" />
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
              {onboardingImages.map((image, index) => (
                <View
                  key={`set1-${index}`}
                  style={{
                    width: BALL_SIZE,
                    height: BALL_SIZE,
                    borderRadius: BALL_SIZE / 2,
                    marginRight: IMAGE_GAP,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={image}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                  <LiquidGlassView
                    borderRadius={BALL_SIZE / 2}
                    style={{
                      width: BALL_SIZE,
                      height: BALL_SIZE,
                      position: 'absolute',
                    }}
                    innerStyle={{
                      width: BALL_SIZE,
                      height: BALL_SIZE,
                      borderRadius: BALL_SIZE / 2,
                    }}
                    effect="clear"
                    tintColor="rgba(255,255,255,0)"

                  />
                </View>
              ))}
              {/* 두 번째 세트 (무한 스크롤을 위해) */}
              {onboardingImages.map((image, index) => (
                <View
                  key={`set2-${index}`}
                  style={{
                    width: BALL_SIZE,
                    height: BALL_SIZE,
                    borderRadius: BALL_SIZE / 2,
                    marginRight: IMAGE_GAP,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={image}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                  <LiquidGlassView
                    borderRadius={BALL_SIZE / 2}
                    style={{
                      width: BALL_SIZE,
                      height: BALL_SIZE,
                      position: 'absolute',
                    }}
                    innerStyle={{
                      width: BALL_SIZE,
                      height: BALL_SIZE,
                      borderRadius: BALL_SIZE / 2,
                    }}
                    effect="clear"
                    tintColor="rgba(255,255,255,0)"
                  />
                </View>
              ))}
            </Animated.View>
          </View>
          {/* 하단 안내 문구 */}
          <View className="flex-1 items-center justify-end">
            <Text text="탭하여 계속하기" type="body3" className="text-center text-text-2" />
          </View>
      </View>
      </TouchableOpacity>
    </Background>
  );
};