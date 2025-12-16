import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useActiveTab, TabName, useSetActiveTab } from '@stores/tabStore';
import { useColors } from '@shared/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeopleIcon from '@assets/svgs/People.svg';
import GraphIcon from '@assets/svgs/Graph.svg';
import SettingIcon from '@assets/svgs/Setting.svg';
import { TAB_NAME, TAB_BAR_HEIGHT } from '@constants/TAB_NAV_OPTIONS';
// import { Text } from './Text';

// 탭 버튼 컴포넌트
interface TabButtonProps {
  tabName: TabName;
  isActive: boolean;
  onPress: () => void;
  icon: React.ComponentType<any>;
  label: string;
  iconSize: number;
}

const TabButton = ({
  tabName: _tabName,
  isActive,
  onPress,
  icon: Icon,
  label: _label,
  iconSize
}: TabButtonProps) => {
  const colors = useColors();
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`items-center justify-center p-2 rounded-full ${isActive ? 'bg-component-background' : ''}`}>
      <Icon
        width={iconSize}
        height={iconSize}
        color={isActive ? colors.TEXT : colors.TEXT_2}
      />
      </View>
      {/* <Text 
        text={label}
        type="caption1"
        className="mt-1"
        style={{
          color: isActive ? COLORS.WHITE : COLORS.BLACK
        }}
      /> */}
    </TouchableOpacity>
  );
};

export const TabBar = () => {
  const activeTab = useActiveTab();
  const setActiveTab = useSetActiveTab();
  const handleTabPress = (tabName: TabName) => {
    setActiveTab(tabName);
  };
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-background border-t border-border absolute bottom-0 left-0 right-0 w-full z-50 flex-row"
      style={{
        paddingBottom: insets.bottom,
        height: TAB_BAR_HEIGHT + insets.bottom,
      }}
    >

      <TabButton
        tabName={TAB_NAME.PEOPLE}
        isActive={activeTab === TAB_NAME.PEOPLE}
        onPress={() => handleTabPress(TAB_NAME.PEOPLE)}
        icon={PeopleIcon}
        label={TAB_NAME.PEOPLE}
        iconSize={20}
      />

      <TabButton
        tabName={TAB_NAME.GRAPH}
        isActive={activeTab === TAB_NAME.GRAPH}
        onPress={() => handleTabPress(TAB_NAME.GRAPH)}
        icon={GraphIcon}
        label={TAB_NAME.GRAPH}
        iconSize={22}
      />
      <TabButton
        tabName={TAB_NAME.SETTING}
        isActive={activeTab === TAB_NAME.SETTING}
        onPress={() => handleTabPress(TAB_NAME.SETTING)}
        icon={SettingIcon}
        label={TAB_NAME.SETTING}
        iconSize={22}
      />
    </View>
  );
};
