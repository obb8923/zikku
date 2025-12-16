import { View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TAB_BAR_HEIGHT } from "../constants/TAB_NAV_OPTIONS"

type BackgroundProps = {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle | ViewStyle[];
  isStatusBarGap?: boolean;
  isNavigationBarGap?: boolean;
  isTabBarGap?: boolean;
}
export const Background = ({children,isStatusBarGap=true,isNavigationBarGap=true,isTabBarGap=false,...props}: BackgroundProps) => {
  const insets = useSafeAreaInsets();
  
  // tabBarGap이 true이면 navGap과 관계없이 탭바 높이만큼 gap 추가
  const bottomPadding = isTabBarGap 
    ? insets.bottom + TAB_BAR_HEIGHT 
    : (isNavigationBarGap ? insets.bottom : 0);

  return (
    <View 
    className={`flex-1 bg-background ${props.className}`} 
    style={{
      paddingTop: isStatusBarGap ? insets.top : 0, 
      paddingBottom: bottomPadding, 
      ...props.style}}>
      {children}
    </View>    
  )
}
