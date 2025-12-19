#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SubjectStickerExtractor, NSObject)

RCT_EXTERN_METHOD(isSubjectExtractionSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(analyzeImage:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end