import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  createBottomTabNavigator,
  TransitionPresets,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { MapStack } from '@nav/stack/MapStack';
import { ArchiveStack } from '@nav/stack/ArchiveStack';
import { MoreStack } from '@nav/stack/MoreStack';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
import MapIcon from '@assets/svgs/Map.svg';
import ArchiveIcon from '@assets/svgs/Archive.svg';
import MoreIcon from '@assets/svgs/More.svg';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
import {LiquidGlassView} from '@components/LiquidGlassView';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
export type AppTabParamList = {
  [TAB_NAME.MAP]: undefined;
  [TAB_NAME.ARCHIVE]: undefined;
  [TAB_NAME.MORE]: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const CustomTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  const isMapTabActive = state.routes[state.index]?.name === TAB_NAME.MAP;
  if (!isMapTabActive) {
    return null;
  }

  const archiveAndMoreRoutes = state.routes.filter(
    (route) =>
      route.name === TAB_NAME.ARCHIVE || route.name === TAB_NAME.MORE,
  );
  const insets = useSafeAreaInsets();
  return (
    <View 
    style={{
      position: 'absolute',
      bottom: insets.bottom + 10,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent', 
      paddingHorizontal: 16,
    }}
    >
      {/* 왼쪽: 탭들 (아이콘만, flex-1) */}
      <LiquidGlassView 
       className="flex-1 flex-row justify-start gap-6"
       innerStyle={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginRight: 16,
        height: 56,
       }}
      >
        {archiveAndMoreRoutes.map((route, index) => {
          const isFocused = state.index === state.routes.indexOf(route);
          const { options } = descriptors[route.key];
          const size = 24;

          const icon =
            options.tabBarIcon?.({
              focused: isFocused,
              size,
              color: 'black',
            }) ?? null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              className="items-center justify-center"
              style={{
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </TouchableOpacity>
          );
        })}
      </LiquidGlassView>
      {/* 오른쪽: FAB (리퀴드글래스 버튼) */}
      <LiquidGlassButton
        onPress={() => {
          navigation.navigate(TAB_NAME.MAP);
        }}
        size="large"
      >
        <PlusSmall width={24} height={24} color="black" />
      </LiquidGlassButton>
    </View>
  );
};

export const AppTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        animationEnabled: true,
        ...TransitionPresets.ShiftTransition,
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0.7, 1, 1],   // 흐림 강도 살짝 증가
              extrapolate: 'clamp',
            }),
        
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [60, 0, -60],   // 이동 거리 축소 → 쫀쫀함 핵심
                  extrapolate: 'clamp',
                }),
              }
            ],
          },
        })
        
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name={TAB_NAME.MAP}
        component={MapStack}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color, size }) => (
            <MapIcon width={size} height={size} color="black" />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.ARCHIVE}
        component={ArchiveStack}
        options={{
          tabBarLabel: '아카이브',
          tabBarIcon: ({ color, size }) => (
            <ArchiveIcon width={size} height={size} color="black" />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.MORE}
        component={MoreStack}
        options={{
          tabBarLabel: '더보기',
          tabBarIcon: ({ color, size }) => (
            <MoreIcon width={size} height={size} color="black" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
