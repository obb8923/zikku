import React, { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Background, Text, AppBar, SearchableList } from '@components/index';
import { SearchableListItem } from '@components/SearchableList';
import { usePersonStore } from '@stores/personStore';
import { useGraphStore } from '@stores/graphStore';
import { useRelationStore } from '@stores/relationStore';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PeopleStackParamList } from '@nav/stack/PeopleStack';
import { GraphNode } from '@/shared/types/graphType';
import { ArrowDirection, RelationStrength } from '@/shared/types/relationType';
import HeartIcon from '@assets/svgs/Heart.svg';
import { useColors } from '@shared/hooks/useColors';
import { logEvent } from '@services/analytics';

type AddRelationScreenNavigationProp = NativeStackNavigationProp<PeopleStackParamList, 'AddRelation'>;
type AddRelationScreenRouteProp = RouteProp<PeopleStackParamList, 'AddRelation'>;

export const AddRelationScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AddRelationScreenNavigationProp>();
  const route = useRoute<AddRelationScreenRouteProp>();
  const people = usePersonStore((state) => state.people);
  const nodes = useGraphStore((state) => state.nodes);
  const addRelation = useRelationStore((state) => state.addRelation);
  const colors = useColors();
  const initialSourcePersonId = route.params?.sourcePersonId ?? null;
  const [sourcePersonId, setSourcePersonId] = useState<string | null>(initialSourcePersonId);
  const [targetPersonId, setTargetPersonId] = useState<string | null>(null);
  const [relationDescription, setRelationDescription] = useState('');
  const [arrowDirection, setArrowDirection] = useState<ArrowDirection>('right');
  const [relationScore, setRelationScore] = useState<RelationStrength | null>(null);

  const getPersonName = (personId: string) => {
    return people.find((p) => p.id === personId)?.name || '';
  };

  const getNodeByPersonId = (personId: string): GraphNode | undefined => {
    return nodes.find((n) => n.personId === personId);
  };

  const handleSave = async () => {
    try {
      // 필수 입력값 검증
      if (!sourcePersonId) {
        Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.selectFirstPerson'));
        return;
      }

      if (!targetPersonId) {
        Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.selectSecondPerson'));
        return;
      }

      if (relationScore === null || relationScore === undefined) {
        Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.selectScore'));
        return;
      }

      const sourceNode = getNodeByPersonId(sourcePersonId);
      const targetNode = getNodeByPersonId(targetPersonId);

      if (!sourceNode) {
        console.error('Source node not found for personId:', sourcePersonId);
        Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.sourceNodeNotFound'));
        return;
      }

      if (!targetNode) {
        console.error('Target node not found for personId:', targetPersonId);
        Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.targetNodeNotFound'));
        return;
      }

      // 관계 스토어에 저장 (관계 설명은 선택사항이므로 빈 문자열도 허용)
      // relationScore는 이미 null 체크를 통과했으므로 RelationStrength 타입으로 안전하게 사용 가능
      // relationStore의 addRelation에서 자동으로 graphStore의 links도 업데이트됨
      await addRelation({
        sourcePersonId,
        targetPersonId,
        description: relationDescription.trim() || '',
        strength: relationScore as RelationStrength,
        arrowDirection,
      });
    logEvent('relation_added', {
      strength: relationScore as number,
      arrow: arrowDirection,
      has_description: Boolean(relationDescription.trim()),
    });

      navigation.goBack();
    } catch (error) {
      console.error('관계 저장 중 오류 발생:', error);
      Alert.alert(t('addRelation.alerts.alert'), t('addRelation.alerts.saveError'));
    }
  };

  const handleSelectSource = (item: SearchableListItem | null) => {
    setSourcePersonId(item?.id || null);
  };

  const handleSelectTarget = (item: SearchableListItem | null) => {
    setTargetPersonId(item?.id || null);
  };

  const getArrowSymbol = (direction: ArrowDirection) => {
    switch (direction) {
      case 'right':
        return '→';
      case 'left':
        return '←';
      case 'both':
        return '↔';
      case 'none':
        return '-';
      default:
        return '→';
    }
  };

  const handleToggleDirection = () => {
    const directions: ArrowDirection[] = ['right', 'left', 'both', 'none'];
    const currentIndex = directions.indexOf(arrowDirection);
    const nextIndex = (currentIndex + 1) % directions.length;
    setArrowDirection(directions[nextIndex]);
  };

  const availablePeople = people.filter((p) => {
    const node = getNodeByPersonId(p.id);
    return node !== undefined;
  });

  const sourcePeopleItems: SearchableListItem[] = availablePeople.map((person) => ({
    id: person.id,
    label: person.name,
  }));

  const targetPeopleItems: SearchableListItem[] = availablePeople
    .filter((person) => person.id !== sourcePersonId)
    .map((person) => ({
      id: person.id,
      label: person.name,
    }));

  return (
    <Background isNavigationBarGap={true}>
      <AppBar
        title={t('addRelation.title')}
        onLeftPress={() => navigation.goBack()}
        onRightPress={handleSave}
        onRightText={t('addRelation.save')}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 두 지인 선택 */}
          <View className="w-full mb-6">
            <Text text={t('addRelation.selectTwoPeople')} type="body3" className="text-text font-semibold mb-2" />
            <View className="w-full flex-row items-center justify-between">
              {/* 지인 1 선택 */}
              <View className="w-[40%]">
                <SearchableList
                  items={sourcePeopleItems}
                  onSelect={handleSelectSource}
                  placeholder={sourcePersonId ? getPersonName(sourcePersonId) : t('addRelation.selectPerson')}
                  selectedItemId={sourcePersonId}
                  maxHeight={200}
                />
              </View>
              {/* 방향성 화살표 */}
              <View className="w-[20%] items-center justify-center">
                <TouchableOpacity
                  className="w-full items-center justify-center"
                  onPress={handleToggleDirection}
                >
                  <Text text={getArrowSymbol(arrowDirection)} type="title2" className="text-text" />
                </TouchableOpacity>
              </View>
              {/* 지인 2 선택 */}
              <View className="w-[40%]">
                <SearchableList
                  items={targetPeopleItems}
                  onSelect={handleSelectTarget}
                  placeholder={targetPersonId ? getPersonName(targetPersonId) : t('addRelation.selectPerson')}
                  selectedItemId={targetPersonId}
                  maxHeight={200}
                />
              </View>
            </View>
          </View>
          {/* 관계 점수 */}
          <View className="w-full mb-6">
            <View className=" w-full flex-row items-center justify-start mb-2">
              <Text text={t('addRelation.relationScore')} type="body3" className="text-text font-semibold" />
              <Text text={relationScore ? relationScore.toString() + t('addRelation.score') : '0' + t('addRelation.score')} type="body3" className="text-text-2 font-semibold ml-2" />
            </View>
            <View className="w-full bg-component-background py-4 rounded-xl flex-row items-center justify-evenly">
              {([1, 2, 3, 4, 5] as RelationStrength[]).map((score) => (
                <TouchableOpacity
                  key={score}
                  className="items-center justify-center"
                  onPress={() => setRelationScore(score)}
                  activeOpacity={0.7}
                >
                  <HeartIcon
                    width={24}
                    height={24}
                    color={relationScore && score <= relationScore ? colors.PRIMARY : colors.COMPONENT_BACKGROUND_2}
                    fill={relationScore && score <= relationScore ? colors.PRIMARY : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* 관계 설명 입력 (선택사항) */}
          <View className="flex-1 border-t border-border pt-6">
            <Text text={t('addRelation.relationDescription')} type="body3" className="text-text-2 font-semibold mb-2" />
            <TextInput
              value={relationDescription}
              onChangeText={setRelationDescription}
              placeholder={t('addRelation.descriptionPlaceholder')}
              placeholderTextColor={colors.TEXT_2}
              multiline
              textAlignVertical="top"
              className="px-0 py-3 text-text"
              style={{
                fontFamily: 'NotoSansKR-Medium',
                fontSize: 15,
                flex: 1,
                paddingVertical: 0,
                paddingTop: 0,
                paddingBottom: 0,
                includeFontPadding: false,

              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </Background>
  );
};

