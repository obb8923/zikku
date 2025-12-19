import Foundation
import UIKit
import React
import Vision
import CoreImage

@objc(SubjectStickerExtractor)
class SubjectStickerExtractor: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    // 백그라운드 큐에서 초기화 가능
    return false
  }

  // iOS 이미지 분석(Subject Lifting) 지원 여부 확인
  @objc
  func isSubjectExtractionSupported(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    if #available(iOS 17.0, *) {
      resolve(true)
    } else {
      resolve(false)
    }
  }

  // 주입된 로컬 이미지 경로에서 피사체 스티커 추출
  @objc
  func analyzeImage(
    _ path: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let pathString = path as String
    
    print("📱 iOS Version: \(UIDevice.current.systemVersion)")

    guard let image = loadImage(from: pathString) else {
      reject(
        "INVALID_IMAGE",
        "Could not load image from path: \(pathString)",
        nil
      )
      return
    }
    
    print("🖼️  Image loaded: \(image.size)")

    // iOS 17 이상만 지원
    if #available(iOS 17.0, *) {
      print("🔍 Using Vision Mask: iOS 17+ path")
      analyzeWithVisionMask(
        imagePath: pathString,
        resolver: resolve,
        rejecter: reject
      )
    } else {
      reject(
        "UNSUPPORTED_VERSION",
        "Subject extraction requires iOS 17.0 or later",
        nil
      )
    }
  }

  // MARK: - Vision (iOS 17+) 전경 마스크 경로

  @available(iOS 17.0, *)
  private func analyzeWithVisionMask(
    imagePath: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    // 이미지 경로를 사용하여 CIImage 로드 (방향 처리 포함)
    guard let ciImage = loadInputImage(from: imagePath) else {
      reject(
        "INVALID_IMAGE",
        "Failed to create CIImage from image path.",
        nil
      )
      return
    }

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(ciImage: ciImage)

    // 백그라운드 스레드에서 처리
    DispatchQueue(label: "EffectsProcessing").async {
      do {
        try handler.perform([request])
      } catch {
        DispatchQueue.main.async {
          reject(
            "ANALYSIS_FAILED",
            "Vision request failed: \(error.localizedDescription)",
            error
          )
        }
        return
      }

      guard let result = request.results?.first else {
        DispatchQueue.main.async {
          reject(
            "ANALYSIS_FAILED",
            "No subject observations found in the image.",
            nil
          )
        }
        return
      }

      do {
        // generateMaskedImage를 사용하여 분리된 피사체 이미지 생성
        // generateMaskedImage는 CVPixelBuffer를 반환하므로 CIImage로 변환 필요
        let maskedPixelBuffer = try result.generateMaskedImage(
          ofInstances: result.allInstances,
          from: handler,
          croppedToInstancesExtent: true
        )

        // CVPixelBuffer를 CIImage로 변환
        let maskedImage = CIImage(cvPixelBuffer: maskedPixelBuffer)
        
        // TODO: 외곽선 기능은 추후 구현
        // 일단 원본 이미지만 사용
        let imageWithOutline = maskedImage

        let context = CIContext()

        guard let cgImage = context.createCGImage(
          imageWithOutline,
          from: imageWithOutline.extent
        ) else {
          DispatchQueue.main.async {
            reject(
              "ANALYSIS_FAILED",
              "Failed to create CGImage from masked image.",
              nil
            )
          }
          return
        }

        // 원본 이미지의 scale 및 orientation 정보를 가져오기 위해 UIImage 로드
        guard let originalImage = self.loadImage(from: imagePath) else {
          DispatchQueue.main.async {
            reject(
              "ANALYSIS_FAILED",
              "Failed to load original image for scale information.",
              nil
            )
          }
          return
        }

        // 원본 이미지의 방향 정보를 유지
        let resultImage = UIImage(
          cgImage: cgImage,
          scale: originalImage.scale,
          orientation: originalImage.imageOrientation
        )

        guard let data = resultImage.pngData() else {
          DispatchQueue.main.async {
            reject(
              "ANALYSIS_FAILED",
              "Failed to convert result image to PNG data.",
              nil
            )
          }
          return
        }

        let fileName = "subject_sticker_mask_\(UUID().uuidString).png"
        let tempDir = NSTemporaryDirectory()
        let url = URL(fileURLWithPath: tempDir).appendingPathComponent(fileName)

        do {
          try data.write(to: url, options: .atomic)

          let osVersion = UIDevice.current.systemVersion
          let method = "visionMask"

          let item: [String: Any] = [
            "id": "0",
            "uri": url.absoluteString,
            "width": resultImage.size.width,
            "height": resultImage.size.height,
            "osVersion": osVersion,
            "method": method
          ]

          DispatchQueue.main.async {
            resolve([item])
          }
        } catch {
          DispatchQueue.main.async {
            reject(
              "ANALYSIS_FAILED",
              "Failed to save sticker image: \(error.localizedDescription)",
              error
            )
          }
        }
      } catch {
        DispatchQueue.main.async {
          reject(
            "ANALYSIS_FAILED",
            "Failed to generate masked image: \(error.localizedDescription)",
            error
          )
        }
      }
    }
  }

  // MARK: - Helpers

  private func loadImage(from path: String) -> UIImage? {
    if path.hasPrefix("file://") {
      if let url = URL(string: path) {
        return UIImage(contentsOfFile: url.path)
      }
    }

    return UIImage(contentsOfFile: path)
  }

  private func loadInputImage(from path: String) -> CIImage? {
    guard let uiImage = loadImage(from: path) else {
      return nil
    }
    
    guard var ciImage = CIImage(image: uiImage) else {
      return nil
    }
    
    // EXIF 방향 정보 확인 및 적용
    if let orientation = ciImage.properties["Orientation"] as? Int32, orientation != 1 {
      ciImage = ciImage.oriented(forExifOrientation: orientation)
    }
    
    return ciImage
  }
  
  // MARK: - 외곽선 추가
  
  /// 이미지에 흰색 외곽선을 추가합니다
  private func addWhiteOutline(to image: CIImage, mask: CIImage) -> CIImage {
    // 외곽선 두께 (픽셀 단위)
    let outlineWidth: CGFloat = 2.0
    
    // 1. 마스크를 그레이스케일로 변환 (알파 채널로 사용)
    let grayMask = mask.applyingFilter("CIColorMatrix", parameters: [
      "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0.2126),
      "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0.7152),
      "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0.0722),
      "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 0)
    ])
    
    // 2. Morphology 필터로 마스크 확장 (경계 감지)
    guard let morphFilter = CIFilter(name: "CIMorphologyMaximum") else {
      return image
    }
    morphFilter.setValue(grayMask, forKey: kCIInputImageKey)
    morphFilter.setValue(outlineWidth, forKey: kCIInputRadiusKey)
    
    guard let expandedMask = morphFilter.outputImage else {
      return image
    }
    
    // 3. 확장된 마스크에서 원본 마스크를 빼서 경계만 추출
    guard let subtractFilter = CIFilter(name: "CIDifferenceBlendMode") else {
      return image
    }
    subtractFilter.setValue(expandedMask, forKey: kCIInputImageKey)
    subtractFilter.setValue(grayMask, forKey: kCIInputBackgroundImageKey)
    
    guard let outlineMask = subtractFilter.outputImage else {
      return image
    }
    
    // 4. 경계를 흰색으로 칠하기
    let whiteOutline = outlineMask.applyingFilter("CIColorMatrix", parameters: [
      "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1),
      "inputBiasVector": CIVector(x: 0, y: 0, z: 0, w: 0)
    ])
    
    // 5. 원본 이미지와 흰색 외곽선 합성
    guard let compositeFilter = CIFilter(name: "CISourceOverCompositing") else {
      return image
    }
    compositeFilter.setValue(whiteOutline, forKey: kCIInputImageKey)
    compositeFilter.setValue(image, forKey: kCIInputBackgroundImageKey)
    
    return compositeFilter.outputImage ?? image
  }
}


