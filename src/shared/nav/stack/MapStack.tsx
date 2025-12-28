import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MapScreen } from "@features/Map/screens/MapScreen";
import { MoreScreen } from "@features/More/screens/MoreScreen";
import { ArchiveScreen } from "@features/Archive/screens/ArchiveScreen";
import { ArchiveDetailScreen } from "@features/Archive/screens/ArchiveDetailScreen";
import { MyInfoScreen } from "@features/MyInfo/screens/MyInfoScreen";
import { WebViewScreen } from "@features/More/screens/WebViewScreen";
export type MapStackParamList = {
    Map: undefined,
    More: undefined,
    Archive: undefined,
    ArchiveDetail: { recordId: string },
    MyInfo: undefined,
    WebView: { url: string; title?: string },
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export const MapStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Map">

            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen 
              name="More" 
              component={MoreScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen 
              name="Archive" 
              component={ArchiveScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }}
            />
            <Stack.Screen 
              name="ArchiveDetail" 
              component={ArchiveDetailScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                headerShown: false,
              }}
            />
            <Stack.Screen name="MyInfo" component={MyInfoScreen} />
            <Stack.Screen 
              name="WebView" 
              component={WebViewScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
              }}
            />

        </Stack.Navigator>
    )
}
