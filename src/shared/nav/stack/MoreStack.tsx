import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreScreen } from "@features/More/screens/MoreScreen";
import { AuthScreen } from "@/features/Auth/screens/AuthScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export type MoreStackParamList = {
  More: undefined;
  Auth: undefined;
};

export const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="More">
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
};