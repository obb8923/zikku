import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MapScreen } from "@features/Map/screens/MapScreen";
import { MoreScreen } from "@features/More/screens/MoreScreen";
import { ArchiveScreen } from "@features/Archive/screens/ArchiveScreen";
import { MyInfoScreen } from "@/features/MyInfo/screens/MyInfoScreen";
export type MapStackParamList = {
    Map: undefined,
    More: undefined,
    Archive: undefined,
    MyInfo: undefined,
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
            <Stack.Screen name="MyInfo" component={MyInfoScreen} />

        </Stack.Navigator>
    )
}
