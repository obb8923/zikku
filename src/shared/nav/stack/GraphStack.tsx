import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GraphScreen } from "@features/Graph/screens/GraphScreen";
import { PersonDetailScreen } from "@features/PersonDetail/screens/PersonDetailScreen";
import { SubscriptionScreen } from "@features/Subscription/screens/SubscriptionScreen";
const Stack = createNativeStackNavigator<GraphStackParamList>();

export type GraphStackParamList = {
    Graph: undefined,
    PersonDetail: { personId: string },
    Subscription: undefined,
};

export const GraphStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{ headerShown: false }}
            initialRouteName="Graph">

            <Stack.Screen name="Graph" component={GraphScreen} />
            <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
        </Stack.Navigator>
    )
}
