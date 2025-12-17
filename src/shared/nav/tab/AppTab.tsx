import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapStack } from '@nav/stack/MapStack';
import { ArchiveStack } from '@nav/stack/ArchiveStack';
import { MoreStack } from '@nav/stack/MoreStack';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';

export type AppTabParamList = {
  [TAB_NAME.MAP]: undefined;
  [TAB_NAME.ARCHIVE]: undefined;
  [TAB_NAME.MORE]: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export const AppTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name={TAB_NAME.MAP}
        component={MapStack}
        options={{
          tabBarLabel: '지도',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🗺️</Text>
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.ARCHIVE}
        component={ArchiveStack}
        options={{
          tabBarLabel: '아카이브',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name={TAB_NAME.MORE}
        component={MoreStack}
        options={{
          tabBarLabel: '더보기',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};
