import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Text as RNText } from 'react-native';
import { Background, AppBar, Property, Text } from '@components/index';
import { usePersonStore } from '@stores/personStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { PropertyValues, PropertyType } from '@/shared/types/personType';
import { AddPropertyModal } from '@features/AddPerson/components/AddPropertyModal';
import { PlusButton } from '@features/AddPerson/components/PlusButton';
import { useTranslation } from 'react-i18next';
import uuid from 'react-native-uuid';
import { useColors } from '@shared/hooks/useColors';
import { AdmobNative } from '@components/ads/AdmobNative';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import { logEvent } from '@services/analytics';
type AddPersonScreenNavigationProp = NativeStackNavigationProp<PeopleStackParamList, 'AddPerson'>

export const AddPersonScreen = () => {
  const navigation = useNavigation<AddPersonScreenNavigationProp>();
  const { t } = useTranslation();
  const addPerson = usePersonStore((state) => state.addPerson);
  const colors = useColors();
  const isSubscribed = useSubscriptionStore((s) => s.subscriptionInfo.isSubscribed);
  const [name, setName] = useState('');
  const [properties, setProperties] = useState<PropertyType[]>([
    {
      id: uuid.v4() as string,
      type: 'tags',
      values: [],
    },
    {
      id: uuid.v4() as string,
      type: 'organizations',
      values: [],
    },
  ]);
  const [memo, setMemo] = useState('');
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);

  const handleUpdateProperty = (updatedProperty: PropertyType) => {
    setProperties((prev) =>
      prev.map((prop) => (prop.id === updatedProperty.id ? updatedProperty : prop))
    );
  };

  const handleAddProperty = (type: PropertyValues) => {
    const newProperty: PropertyType = {
      id: uuid.v4() as string,
      type,
      values: [],
      ...(type === 'custom' ? { customLabel: t('property.labels.custom') } : {}),
    };
    setProperties((prev) => [...prev, newProperty]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('addPerson.nameRequired.title'),
        t('addPerson.nameRequired.message')
      );
      return;
    }

    const cleanedProperties = properties
      .map((prop) => {
        if (prop.type === 'custom') {
          const trimmedValues = prop.values.map((v) => v.trim()).filter(Boolean);
          return trimmedValues.length > 0 ? { ...prop, values: trimmedValues } : null;
        }
        return prop;
      })
      .filter((prop): prop is PropertyType => !!prop);

    await addPerson({
      name: name.trim(),
      properties: cleanedProperties,
      memo: memo.trim(),
    });
    logEvent('person_added', {
      source: 'manual',
      property_count: cleanedProperties.length,
      has_memo: Boolean(memo.trim()),
    });

    navigation.goBack();
  };

  const existingPropertyTypes = properties.map((p) => p.type);

  return (
    <Background isTabBarGap={false}>
      <AppBar
        title={t('addPerson.title')}
        onLeftPress={() => navigation.goBack()}
        onRightPress={handleSave}
        onRightText={t('addPerson.save')}
      />
      {!isSubscribed && <AdmobNative />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 이름 입력 - 큰 제목 */}
          <View className="mb-8" style={{}}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('addPerson.namePlaceholder')}
              placeholderTextColor={colors.TEXT_2}
              className="text-text"
              style={{
                fontFamily: 'NotoSansKR-SemiBold',
                fontSize: 28,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
                includeFontPadding: false,
              }}
            />
          </View>

          {/* Properties 섹션 */}
          <View className="mb-6">
            {properties.map((property) => (
              <Property
                key={property.id}
                property={property}
                onUpdate={handleUpdateProperty}
              />
            ))}
            <View className="h-6 w-full items-start">
              <PlusButton text={t('addPerson.addProperty')} onPress={() => setShowAddPropertyModal(true)} />
            </View>
          </View>
          <View className="border-b border-border" />
          {/* 메모 섹션 */}
          <View className="my-6">
            <View className="flex-row justify-end">
              <Text
                text={isSubscribed ? `${memo.length}` : `${memo.length}/300`}
                type="caption1"
                className="text-text-2"
              />
            </View>
            <TextInput
              value={memo}
              onChangeText={(text) => setMemo(isSubscribed ? text : text.slice(0, 300))}
              placeholder={t('addPerson.memoPlaceholder')}
              placeholderTextColor={colors.TEXT_2}
              multiline
              maxLength={isSubscribed ? undefined : 300}
              numberOfLines={6}
              textAlignVertical="top"
              className="rounded-lg px-4 py-3 text-text"
              style={{
                fontFamily: 'NotoSansKR-Medium',
                fontSize: 16,
                includeFontPadding: false,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AddPropertyModal
        visible={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        onSelect={handleAddProperty}
        existingTypes={existingPropertyTypes}
        canUseCustom={isSubscribed}
      />
    </Background>
  );
};

