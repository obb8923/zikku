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

        let context = CIContext()

        guard let cgImage = context.createCGImage(
          maskedImage,
          from: maskedImage.extent
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

        // 원본 이미지의 scale 정보를 가져오기 위해 UIImage 로드
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

        let resultImage = UIImage(
          cgImage: cgImage,
          scale: originalImage.scale,
          orientation: .up
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
}


