import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@components/Text';
import FilterIcon from '@assets/svgs/Filter.svg';
import { useColors } from '@shared/hooks/useColors';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { APPBAR_HEIGHT, DEVICE_HEIGHT } from '@constants/NORMAL';
import { useTranslation } from 'react-i18next';
export type FilterType = 'group' | 'tag' | null;
export type FilterValue = { type: FilterType; value: string } | null;
export const GROUP_ALL_VALUE = '__GROUP_ALL__';
export const TAG_ALL_VALUE = '__TAG_ALL__';

interface FilterDropdownProps {
  groups: string[];
  tags: string[];
  selectedFilter: FilterValue;
  onSelectFilter: (filter: FilterValue) => void;
}

export const FilterDropdown = ({
  groups,
  tags,
  selectedFilter,
  onSelectFilter,
}: FilterDropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const handleSelect = (type: 'group' | 'tag', value: string) => {
    // 같은 항목을 다시 선택하면 필터 해제
    if (selectedFilter?.type === type && selectedFilter?.value === value) {
      onSelectFilter(null);
    } else {
      onSelectFilter({ type, value });
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelectFilter(null);
    setIsOpen(false);
  };

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="p-2"
        activeOpacity={0.7}
      >
        <FilterIcon
          width={18}
          height={18}
          color={selectedFilter ? colors.PRIMARY : colors.TEXT}
        />
      </TouchableOpacity>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
            className="flex-1"
            style={StyleSheet.absoluteFill}
          >
            <View 
            className="bg-background rounded-lg shadow-lg border border-border mx-4 z-50 overflow-hidden"
            style={{ position: 'absolute', top: APPBAR_HEIGHT + insets.top - 15,right:0  , height:DEVICE_HEIGHT/2}}
            >
                <ScrollView
                contentContainerStyle={{ padding: 8, paddingRight: 16 }}
                >
                {/* 그룹 섹션 */}
                {groups.length > 0 && (
                  <View className="mb-2">
                    <Text
                      text={t('graph.filter.group')}
                      type="body3"
                      className="text-text font-semibold px-3 py-2"
                    />
                    <TouchableOpacity
                      key="group-all"
                      onPress={() => handleSelect('group', GROUP_ALL_VALUE)}
                      className={`px-3 py-2 ${
                        selectedFilter?.type === 'group' &&
                        selectedFilter?.value === GROUP_ALL_VALUE
                          ? 'bg-component-background'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              selectedFilter?.type === 'group' &&
                              selectedFilter?.value === GROUP_ALL_VALUE
                                ? colors.TEXT
                                : 'transparent',
                            borderWidth: 1,
                            borderColor: colors.COMPONENT_BACKGROUND,
                          }}
                        />
                        <Text text={t('graph.filter.all')} type="body2" className="text-text" />
                      </View>
                    </TouchableOpacity>
                    {groups.map((group) => (
                      <TouchableOpacity
                        key={group}
                        onPress={() => handleSelect('group', group)}
                        className={`px-3 py-2 ${
                          selectedFilter?.type === 'group' &&
                          selectedFilter?.value === group
                            ? 'bg-component-background'
                            : ''
                        }`}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-4 h-4 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                selectedFilter?.type === 'group' &&
                                selectedFilter?.value === group
                                  ? colors.TEXT
                                  : 'transparent',
                              borderWidth: 2,
                              borderColor: colors.BORDER,
                            }}
                          />
                          <Text text={group} type="body2" className="text-text" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 태그 섹션 */}
                {tags.length > 0 && (
                  <View className="mb-2">
                    <Text
                      text={t('graph.filter.tag')}
                      type="body3"
                      className="text-text font-semibold px-3 py-2"
                    />
                    <TouchableOpacity
                      key="tag-all"
                      onPress={() => handleSelect('tag', TAG_ALL_VALUE)}
                      className={`px-3 py-2 ${
                        selectedFilter?.type === 'tag' &&
                        selectedFilter?.value === TAG_ALL_VALUE
                          ? 'bg-component-background'
                          : ''
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-4 h-4 rounded-full mr-2"
                          style={{
                            backgroundColor:
                              selectedFilter?.type === 'tag' &&
                              selectedFilter?.value === TAG_ALL_VALUE
                                ? colors.TEXT
                                : 'transparent',
                            borderWidth: 2,
                            borderColor: colors.BORDER,
                          }}
                        />
                        <Text text={t('graph.filter.all')} type="body2" className="text-text" />
                      </View>
                    </TouchableOpacity>
                    {tags.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => handleSelect('tag', tag)}
                        className={`px-3 py-2 ${
                          selectedFilter?.type === 'tag' &&
                          selectedFilter?.value === tag
                            ? 'bg-component-background'
                            : ''
                        }`}
                      >
                        <View className="flex-row items-center">
                          <View
                            className="w-4 h-4 rounded-full mr-2"
                            style={{
                              backgroundColor:
                                selectedFilter?.type === 'tag' &&
                                selectedFilter?.value === tag
                                  ? colors.TEXT
                                  : 'transparent',
                              borderWidth: 1,
                              borderColor: colors.COMPONENT_BACKGROUND,
                            }}
                          />
                          <Text text={tag} type="body2" className="text-text" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 필터 해제 */}
                {selectedFilter && (
                  <TouchableOpacity
                    onPress={handleClear}
                    className="px-3 py-2 border-t border-border mt-2"
                  >
                    <Text text={t('graph.filter.clear')} type="body2" className="text-primary" />
                  </TouchableOpacity>
                )}

                {/* 그룹과 태그가 모두 없을 때 */}
                {groups.length === 0 && tags.length === 0 && (
                  <View className="px-3 py-4">
                    <Text
                      text={t('graph.filter.noFilters')}
                      type="body3"
                      className="text-component-background-2 text-center"
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

