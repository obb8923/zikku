import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MapScreen } from "@features/Map/screens/MapScreen";
import { RecordCreateScreen } from '@features/Record/screens/RecordCreateScreen';

export type MapStackParamList = {
    Map: undefined,
    RecordCreate: {
        image: {
            uri: string;
            fileName?: string;
            type?: string;
        };
    };
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export const MapStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Map">

            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="RecordCreate" component={RecordCreateScreen} />
        </Stack.Navigator>
    )
}
