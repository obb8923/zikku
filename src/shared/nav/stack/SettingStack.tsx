import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SettingScreen } from "@features/Setting/screens/SettingScreen";
import { FeedbackWebViewScreen } from "@features/Setting/screens/FeedbackWebViewScreen";
import { PolicyWebViewScreen } from "@features/Setting/screens/PolicyWebViewScreen";
import { SubscriptionScreen } from "@features/Subscription/screens/SubscriptionScreen";

const Stack = createNativeStackNavigator<SettingStackParamList>();

export type SettingStackParamList = {
  Setting: undefined;
  FeedbackWebView: undefined;
  Subscription: undefined;
  PolicyWebView: {
    title: string;
    url: string;
  };
};

export const SettingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setting" component={SettingScreen} />
      <Stack.Screen name="FeedbackWebView" component={FeedbackWebViewScreen} />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{  animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="PolicyWebView" component={PolicyWebViewScreen} />
    </Stack.Navigator>
  );
};