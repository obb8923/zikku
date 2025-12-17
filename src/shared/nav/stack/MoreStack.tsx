import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreScreen } from "@features/More/screens/MoreScreen";
import { LoginScreen } from "@features/Login/screens/LoginScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export type MoreStackParamList = {
  More: undefined;
  Login: undefined;
};

export const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="More">
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};