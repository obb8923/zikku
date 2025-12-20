import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MapScreen } from "@features/Map/screens/MapScreen";

export type MapStackParamList = {
    Map: undefined,
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export const MapStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Map">

            <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
    )
}
