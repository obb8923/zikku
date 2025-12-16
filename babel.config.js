module.exports = {
  presets: ['module:@react-native/babel-preset','nativewind/babel'],
  plugins: [ 
    ['module-resolver',
    {
      root: ['./src'], // 별칭 기준 경로
      alias: {
        '@': './src', // @ 를 src 폴더로 매핑
        '@assets': './assets',
        '@features': './src/features',
        '@shared': './src/shared',
        '@components': './src/shared/components',
        '@constants': './src/shared/constants',
        '@libs': './src/shared/libs',
        '@nav': './src/shared/nav',
        '@stores': './src/shared/stores',
        '@shared-types': './src/shared/types',
        '@services': './src/shared/services',
        '@i18n': './src/shared/i18n',
      },
    }],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    'react-native-worklets/plugin'// 무조건 마지막에 추가
  ],
};
