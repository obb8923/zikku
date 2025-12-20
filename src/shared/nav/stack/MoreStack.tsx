import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreScreen } from "@features/More/screens/MoreScreen";
import { MyInfoScreen } from "@features/MyInfo/screens/MyInfoScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

export type MoreStackParamList = {
  More: undefined;
  MyInfo: undefined;
};

export const MoreStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="More">
      <Stack.Screen name="More" component={MoreScreen} />
      <Stack.Screen name="MyInfo" component={MyInfoScreen} />
    </Stack.Navigator>
  );
};