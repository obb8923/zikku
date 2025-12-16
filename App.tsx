import './global.css';
import 'intl-pluralrules';
import '@i18n/index';
import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider } from '@gorhom/portal';
import { AppNavigation } from '@nav/index';
import { useInitStoreEffect } from '@stores/initStore';

export default function App() {
  useInitStoreEffect();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PortalProvider>
          <View style={{flex:1}}>
            <StatusBar 
              barStyle='light-content' 
              translucent={true}
            />
            <AppNavigation />
          </View>
        </PortalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}