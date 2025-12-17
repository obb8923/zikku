import { View, ViewStyle } from "react-native"
import { TAB_BAR_HEIGHT } from "@constants/TAB_NAV_OPTIONS"
import { useSafeAreaInsets } from "react-native-safe-area-context"

type BackgroundProps = {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle | ViewStyle[];
  type?: 'green' | 'white' ;
  isStatusBarGap?: boolean;
  isTabBarGap?: boolean;
}
export const Background = ({children,isStatusBarGap=false,type='green',isTabBarGap=true,...props}: BackgroundProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
    <View 
    className={`flex-1 ${props.className}`} 
    style={[{paddingTop: isStatusBarGap ? insets.top : 0,paddingBottom: isTabBarGap?TAB_BAR_HEIGHT:insets.bottom}, props.style]}>
      {children}
    </View>    
    </View>    
  )
}
