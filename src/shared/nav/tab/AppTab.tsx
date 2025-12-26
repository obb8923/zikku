// import React, { useCallback, useState, useEffect, useRef } from 'react';
// import { View, TouchableOpacity, Animated } from 'react-native';
// import {
//   createBottomTabNavigator,
//   TransitionPresets,
//   type BottomTabBarProps,
// } from '@react-navigation/bottom-tabs';
// import { MapStack } from '@nav/stack/MapStack';
// import { ArchiveStack } from '@nav/stack/ArchiveStack';
// import { MoreStack } from '@nav/stack/MoreStack';
// import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
// import MapIcon from '@assets/svgs/Map.svg';
// import ArchiveIcon from '@assets/svgs/Archive.svg';
// import MoreIcon from '@assets/svgs/More.svg';
// import { LiquidGlassButton } from '@components/LiquidGlassButton';
// import CameraIcon from '@assets/svgs/Camera.svg';
// import ImageIcon from '@assets/svgs/Image.svg';
// import {LiquidGlassView} from '@components/LiquidGlassView';
// import {useSafeAreaInsets} from 'react-native-safe-area-context';
// import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
// import { RecordModal } from '@components/RecordModal';
// import { useHasStarted } from '@stores/initialScreenStore';

// export type AppTabParamList = {
//   [TAB_NAME.MAP]: undefined;
//   [TAB_NAME.ARCHIVE]: undefined;
//   [TAB_NAME.MORE]: undefined;
// };

// const Tab = createBottomTabNavigator<AppTabParamList>();

// const CustomTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
//   const isMapTabActive = state.routes[state.index]?.name === TAB_NAME.MAP;
//   const hasStarted = useHasStarted();

//   const archiveAndMoreRoutes = state.routes.filter(
//     (route) =>
//       route.name === TAB_NAME.ARCHIVE || route.name === TAB_NAME.MORE,
//   );
//   const insets = useSafeAreaInsets();

//   // 탭바 fade in 애니메이션
//   const tabBarOpacity = useRef(new Animated.Value(0)).current;

//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedImage, setSelectedImage] = useState<{
//     uri: string;
//     fileName?: string;
//     type?: string;
//   } | null>(null);

//   const handleImagePicked = useCallback(
//     (response: ImagePickerResponse) => {
//       if (response.didCancel || !response.assets || response.assets.length === 0) {
//         setIsModalVisible(false);
//         setSelectedImage(null);
//         return;
//       }

//       const asset = response.assets[0];
//       if (!asset.uri) {
//         setIsModalVisible(false);
//         setSelectedImage(null);
//         return;
//       }

//       const image = {
//         uri: asset.uri,
//         fileName: asset.fileName,
//         type: asset.type,
//         width: asset.width,
//         height: asset.height,
//       };

//       setSelectedImage(image);
//       setIsModalVisible(true);
//     },
//     [],
//   );

//   const handleSelectFromGallery = useCallback(() => {
//     launchImageLibrary(
//       {
//         mediaType: 'photo',
//         selectionLimit: 1,
//       },
//       handleImagePicked,
//     );
   
//   }, [ handleImagePicked]);

//   const handleTakePhoto = useCallback(async () => {
//     launchCamera(
//       {
//         mediaType: 'photo',
//       },
//       handleImagePicked,
//     );
  
//   }, [ handleImagePicked]);

//   // hasStarted 변경 시 탭바 fade in 애니메이션
//   useEffect(() => {
//     if (hasStarted && isMapTabActive) {
//       Animated.timing(tabBarOpacity, {
//         toValue: 1,
//         duration: 350,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       tabBarOpacity.setValue(0);
//     }
//   }, [hasStarted, isMapTabActive, tabBarOpacity]);

//   // 탭바 표시 조건: Map 탭이 활성화되어 있고, 초기 화면을 시작한 경우에만 표시
//   if (!isMapTabActive || !hasStarted) {
//     return null;
//   }

//   return (
//     <Animated.View 
//     pointerEvents="auto"
//     style={{
//       position: 'absolute',
//       bottom: insets.bottom + 10,
//       flexDirection: 'row',
//       alignItems: 'center',
//       backgroundColor: 'transparent', 
//       paddingHorizontal: 16,
//       opacity: tabBarOpacity,
//     }}
//     >

//       <View className="flex-row gap-2">
     

//       {/* 카메라 버튼 */}
     
//         <LiquidGlassButton onPress={handleTakePhoto} size="large">
//           <CameraIcon width={24} height={24} color="black" />
//         </LiquidGlassButton>
//          {/* 갤러리 버튼 */}
//          <LiquidGlassButton onPress={handleSelectFromGallery} size="large">
//           <ImageIcon width={24} height={24} color="black" />
//         </LiquidGlassButton>
//         </View>
//       {/* 기록 모달 */}
//       <RecordModal
//         visible={isModalVisible}
//         onClose={() => {
//           setIsModalVisible(false);
//           setSelectedImage(null);
//         }}
//         image={selectedImage}
//       />
//     </Animated.View>
//   );
// };

// export const AppTab = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarShowLabel: false,
//         tabBarStyle: {
//           position: 'absolute',
//           backgroundColor: 'transparent',
//           borderTopWidth: 0,
//           elevation: 0,
//           overflow: 'visible',
//         },
//         animationEnabled: true,
//         ...TransitionPresets.ShiftTransition,
//       }}
//       tabBar={(props) => <CustomTabBar {...props} />}
//     >
//       <Tab.Screen
//         name={TAB_NAME.MAP}
//         component={MapStack}
//         options={{
//           tabBarLabel: '지도',
//           tabBarIcon: ({ color, size }) => (
//             <MapIcon width={size} height={size} color="black" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name={TAB_NAME.ARCHIVE}
//         component={ArchiveStack}
//         options={{
//           tabBarLabel: '아카이브',
//           tabBarIcon: ({ color, size }) => (
//             <ArchiveIcon width={size} height={size} color="black" />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name={TAB_NAME.MORE}
//         component={MoreStack}
//         options={{
//           tabBarLabel: '더보기',
//           tabBarIcon: ({ color, size }) => (
//             <MoreIcon width={size} height={size} color="black" />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };
