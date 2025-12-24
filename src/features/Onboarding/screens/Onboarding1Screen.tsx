import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, TouchableOpacity, View, Animated as RNAnimated } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import XIcon from '@assets/svgs/X.svg';
import { Background } from '@components/Background';
import { LiquidGlassView } from '@components/LiquidGlassView';
import { Text } from '@components/Text';
import { COLORS } from '@constants/COLORS';
import { OnboardingStackParamList } from '@nav/stack/OnboardingStack';

type Onboarding1ScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding1'>

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 화면 너비를 기준으로 큰/작은 원 크기 결정
const CIRCLE_SIZE_LARGE = SCREEN_WIDTH * 1.4; // 화면 너비보다 조금 크게
const CIRCLE_SIZE_SMALL = SCREEN_WIDTH * 0.2; // 축소 시 크기

// 파티클 y 위치 관련 상수
const PARTICLE_START_TOP = SCREEN_HEIGHT * 0.3;   // 시작 y (절대 위치)
const PARTICLE_END_TRANSLATE_Y = -SCREEN_HEIGHT; // 위로 이동량

// 파티클 애니메이션 관련 상수
const PARTICLE_ANIMATION_BASE_DURATION = 3600; // 기본 애니메이션 지속 시간
const PARTICLE_ANIMATION_RANDOM_DURATION = 7000; // 랜덤 애니메이션 지속 시간
const PARTICLE_SCALE_START = 0.2; // 시작 스케일
const PARTICLE_SCALE_DURATION = 600; // 스케일 애니메이션 지속 시간
const PARTICLE_FADE_DURATION = 400; // 페이드 애니메이션 지속 시간
const PARTICLE_FADE_BEFORE_END = 500; // 페이드 애니메이션 시작 전 지속 시간
const PARTICLE_SIZE = 24;
const PARTICLE_OFFSET_X_RANGE = CIRCLE_SIZE_SMALL * 0.7; // 원 중심 기준 좌우 랜덤 범위
const PARTICLE_SPAWN_INTERVAL_MS = 700; // 파티클 생성 간격
const PARTICLE_SPAWN_COUNT_PER_TICK = 2; // 한 번에 생성할 파티클 개수

// 원 이동 관련 상수
const CIRCLE_PROGRESS_RANGE = [0, 1] as const;
const CIRCLE_TRANSLATE_Y_START = 0;
const CIRCLE_TRANSLATE_Y_END = -SCREEN_HEIGHT * 0.9;

// 텍스트/버튼 opacity 애니메이션 관련 상수
const TOP_TEXT_OPACITY_INPUT = [0, 0.5, 1] as const;
const TOP_TEXT_OPACITY_OUTPUT = [1, 0, 0] as const;

const BOTTOM_TEXT_OPACITY_INPUT = [0, 0.5, 1] as const;
const BOTTOM_TEXT_OPACITY_OUTPUT = [0, 0, 1] as const;

const BOTTOM_HINT_OPACITY_INPUT = [0, 0.3, 0.6, 1] as const;
const BOTTOM_HINT_OPACITY_OUTPUT = [1, 1, 0, 0] as const;

const NEXT_BUTTON_OPACITY_INPUT = [0, 0.7, 1] as const;
const NEXT_BUTTON_OPACITY_OUTPUT = [0, 0, 1] as const;

// 제스처 및 스프링 애니메이션 관련 상수
const SWIPE_TRANSLATION_Y_THRESHOLD = -40;
const SWIPE_VELOCITY_Y_THRESHOLD = -500;
const SPRING_CONFIG = {
  damping: 70,
  stiffness: 300,
} as const;

const AnimatedImage = RNAnimated.createAnimatedComponent(Image);

type Particle = {
  id: number;
  source: any;
  offsetX: number;
};


const FloatingParticle = ({
  source,
  offsetX,
  onFinish,
}: {
  source: any;
  offsetX: number;
  onFinish: () => void;
}) => {
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const scale = useRef(new RNAnimated.Value(PARTICLE_SCALE_START)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;
  const onFinishRef = useRef(onFinish);
  
  // onFinish 콜백을 최신 버전으로 유지
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const duration =
      PARTICLE_ANIMATION_BASE_DURATION +
      Math.random() * PARTICLE_ANIMATION_RANDOM_DURATION;
    RNAnimated.parallel([
      RNAnimated.timing(translateY, {
        toValue: PARTICLE_END_TRANSLATE_Y,
        duration,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scale, {
        toValue: 1,
        duration: PARTICLE_SCALE_DURATION,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacity, {
        toValue: 0,
        duration: PARTICLE_FADE_DURATION,
        delay: duration - PARTICLE_FADE_BEFORE_END,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinishRef.current();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatedImage
      source={source}
      resizeMode="contain"
      style={{
        position: 'absolute',
        top: PARTICLE_START_TOP,
        left: SCREEN_WIDTH / 2 + offsetX - 16,
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        opacity,
        transform: [
          { translateY },
          { scale },
        ],
      }}
    />
  );
};

export const Onboarding1Screen = ({ navigation }: Onboarding1ScreenProps) => {
  // 0 = 아래 큰 원 / 1 = 위쪽(화면 상단 1/5 근처) 작은 원
  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['domain', 'common']);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const particleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);



  // 화면에서 나갈 때 파티클 생성 타이머 정리
  useEffect(() => {
    return () => {
      if (particleIntervalRef.current) {
        clearInterval(particleIntervalRef.current);
        particleIntervalRef.current = null;
      }
    };
  }, []);

  const circleAnimatedStyle = useAnimatedStyle(() => {
    const size = interpolate(
      progress.value,
      CIRCLE_PROGRESS_RANGE,
      [CIRCLE_SIZE_LARGE, CIRCLE_SIZE_SMALL],
    );

    // 아래에서 위로 이동 (대략 화면 상단 1/5 위치 근처까지)
    const translateY = interpolate(
      progress.value,
      CIRCLE_PROGRESS_RANGE,
      [CIRCLE_TRANSLATE_Y_START, CIRCLE_TRANSLATE_Y_END],
    );

    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [{ translateY }],
    };
  });

  // 텍스트 opacity 애니메이션
  const topTextAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      TOP_TEXT_OPACITY_INPUT,
      TOP_TEXT_OPACITY_OUTPUT,
    );
    return { opacity };
  });

  const bottomTextAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      BOTTOM_TEXT_OPACITY_INPUT,
      BOTTOM_TEXT_OPACITY_OUTPUT,
    );
    return { opacity };
  });

  // 아래에 있을 때 하단 안내 문구 opacity
  const bottomHintAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      BOTTOM_HINT_OPACITY_INPUT,
      BOTTOM_HINT_OPACITY_OUTPUT,
    );
    return { opacity };
  });

  // 공이 위로 올라갔을 때 나타나는 "다음" 버튼 opacity
  const nextButtonAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      NEXT_BUTTON_OPACITY_INPUT,
      NEXT_BUTTON_OPACITY_OUTPUT,
    );

    return {
      opacity,
    };
  });

  // 공이 위로 올라갔을 때 공 중앙에 표시될 X 아이콘 opacity
  const centerIconAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 0.7, 1],
      [0, 0, 1],
    );

    return {
      opacity,
      transform: [
        { rotate: '45deg' },
      ],
    };
  });

  const onGestureEnd = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;

    // 위로 스와이프(translationY가 충분히 음수이거나, 위쪽으로 빠른 속도)
    const isSwipeUp =
      translationY < SWIPE_TRANSLATION_Y_THRESHOLD ||
      velocityY < SWIPE_VELOCITY_Y_THRESHOLD;

    if (isSwipeUp) {
      progress.value = withSpring(1, SPRING_CONFIG);
    } else {
      progress.value = withSpring(0, SPRING_CONFIG);
    
    }
  };

  return (
    <Background isStatusBarGap={true} isTabBarGap={false}>
      <View className="flex-1">
        {/* 공이 아래에 있을 때 상단 문구 (opacity로 페이드 인/아웃) */}
        <Animated.View
          className="items-center" 
          style={[topTextAnimatedStyle,{position:'absolute',top:SCREEN_HEIGHT * 0.2,right:0,left:0}]}
        >
          <Text
            text={t('onboarding.screen1.title')}
            type="title1"
            style={{ textAlign: 'center' }}
          />
        </Animated.View>
    

        {/* 공이 위에 있을 때 하단 문구 (opacity로 페이드 인/아웃) */}
        <Animated.View
          className="items-center"
          style={[bottomTextAnimatedStyle,{position:'absolute',bottom:SCREEN_HEIGHT * 0.4,right:0,left:0}]}
        >
          <Text
            text={t('onboarding.screen1.subtitle')}
            type="title1"
            style={{ textAlign: 'center' }}
          />
        </Animated.View>

        {/* 공이 아래에 있을 때, 맨 아래 안내 문구 (공에 가려지지 않도록 위에 zIndex) */}
        <Animated.View
          className="items-center"
          style={[
            bottomHintAnimatedStyle,
            {
              position: 'absolute',
              bottom: insets.bottom +24,
              left: 0,
              right: 0,
              zIndex: 10,
            },
          ]}
        >
          <Text
            text={t('onboarding.screen1.hint_swipe')}
            type="body3"
            style={{ textAlign: 'center' }}
          />
        </Animated.View>

        {/* 공 뒤에서 올라오는 랜덤 이미지 풍선들 */}
        {particles.map((particle) => (
          <FloatingParticle
            key={particle.id}
            source={particle.source}
            offsetX={particle.offsetX}
            onFinish={() => {
              setParticles((current) =>
                current.filter((p) => p.id !== particle.id),
              );
            }}
          />
        ))}

        <PanGestureHandler
          onEnded={onGestureEnd}
        >
          <Animated.View
            className="flex-1 justify-end items-center"
          >
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  bottom: -CIRCLE_SIZE_LARGE / 2, // 절반 정도만 보이게 아래로 내리기
                  overflow: 'hidden',
                },
                circleAnimatedStyle,
              ]}
            >
              <LiquidGlassView
                style={{
                  flex: 1,
                  borderRadius: 9999,
                }}
                effect="clear"
                interactive={false}
              />
              {/* 공이 위로 올라갔을 때 공 중앙에 나타나는 + 아이콘 */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  centerIconAnimatedStyle,
                ]}
              >
                <XIcon width={CIRCLE_SIZE_SMALL * 0.2} height={CIRCLE_SIZE_SMALL * 0.2} />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>

        {/* 공이 위로 올라갔을 때 나타나는 하단 "다음" 버튼 */}
        <Animated.View
          style={[
            nextButtonAnimatedStyle,
            {
              position: 'absolute',
              left: 24,
              right: 24,
              bottom: insets.bottom + 24,
              zIndex: 20,
            },
          ]}
        >
          <TouchableOpacity
            className="items-center justify-center bg-greenTab rounded-full p-4"
            onPress={() => {
              navigation.navigate('Onboarding2');
            }}
          >
            <Text
              text={t('common:components.button.next')}
              type="body2"
              className="text-center text-white"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Background>
  );
};