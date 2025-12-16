import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@assets/svgs/Search.svg';
import { Text, SearchInput } from '@components/index';
import { useColors } from '@shared/hooks/useColors';

type PeopleListHeaderProps = {
  count: number;
  searchQuery: string;
  isSearchVisible: boolean;
  onToggleSearch: () => void;
  onChangeSearch: (text: string) => void;
};

export const PeopleListHeader = ({
  count,
  searchQuery,
  isSearchVisible,
  onToggleSearch,
  onChangeSearch,
}: PeopleListHeaderProps) => {
  const { t } = useTranslation();
  const colors = useColors();
    return (
    <View className="p-4">
      <View className="px-4 flex-row items-center justify-between">
        <View className="flex-row items-center justify-start gap-2">
          <Text text={t('people.listLabel')} type="title4" className="text-text  " />
          <Text text={`${count}`} type="body1" className="text-text-2 font-semibold" />
        </View>
        <TouchableOpacity
          onPress={onToggleSearch}
          className={`p-2 rounded-full ${isSearchVisible ? 'bg-component-background' : ''}`}
          activeOpacity={0.8}
        >
          <SearchIcon width={18} height={18} color={colors.TEXT} />
        </TouchableOpacity>
      </View>
      {isSearchVisible && (
        <View className="mt-2">
          <SearchInput
            value={searchQuery}
            onChangeText={onChangeSearch}
            placeholder={t('people.searchPlaceholder')}
            className="w-full"
          />
        </View>
      )}
    </View>
  );
};

