#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HapticFeedbackModule, NSObject)

RCT_EXTERN_METHOD(impact:(NSString *)style)
RCT_EXTERN_METHOD(notification:(NSString *)type)
RCT_EXTERN_METHOD(selection)

@end

