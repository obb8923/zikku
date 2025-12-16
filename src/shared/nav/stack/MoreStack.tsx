import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreScreen } from "@features/More/screens/MoreScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export type MoreStackParamList = {
 More: undefined,
};

export const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="More">
      <Stack.Screen name="More" component={MoreScreen} />
    </Stack.Navigator>
  );
};