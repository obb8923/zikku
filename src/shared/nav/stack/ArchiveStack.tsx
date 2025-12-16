import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ArchiveScreen } from "@features/Archive/screens/ArchiveScreen";
const Stack = createNativeStackNavigator<ArchiveStackParamList>();

export type ArchiveStackParamList = {
    Archive: undefined,
};

export const ArchiveStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Archive">

            <Stack.Screen name="Archive" component={ArchiveScreen} />
        </Stack.Navigator>
    )
}
