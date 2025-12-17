import Foundation
import UIKit
import React
import VisionKit
import Vision

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
    if #available(iOS 16.0, *) {
      resolve(ImageAnalyzer.isSupported)
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

    guard let image = loadImage(from: pathString) else {
      reject(
        "INVALID_IMAGE",
        "Could not load image from path: \(pathString)",
        nil
      )
      return
    }

    // iOS 17 이상이면 Vision 기반 전경 마스크 시도 후, 실패 시 VisionKit 경로로 폴백
    if #available(iOS 17.0, *) {
      analyzeWithVisionMask(
        image: image,
        success: { stickers in
          if !stickers.isEmpty {
            resolve(stickers)
          } else {
            // 전경 마스크 결과가 비어 있으면 VisionKit 경로로 폴백
            self.analyzeWithVisionKit(
              image: image,
              resolver: resolve,
              rejecter: reject
            )
          }
        },
        failure: { _ in
          // 실패 시에도 VisionKit 경로로 폴백
          self.analyzeWithVisionKit(
            image: image,
            resolver: resolve,
            rejecter: reject
          )
        }
      )
      return
    }

    // iOS 16: VisionKit Subject Lifting 경로만 사용
    analyzeWithVisionKit(
      image: image,
      resolver: resolve,
      rejecter: reject
    )
  }

  // MARK: - VisionKit (iOS 16+) 경로

  private func analyzeWithVisionKit(
    image: UIImage,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.0, *) else {
      reject(
        "UNSUPPORTED_OS",
        "Subject extraction requires iOS 16 or later for VisionKit.",
        nil
      )
      return
    }

    guard ImageAnalyzer.isSupported else {
      reject(
        "UNSUPPORTED_DEVICE",
        "This device does not support ImageAnalyzer.",
        nil
      )
      return
    }

    let analyzer = ImageAnalyzer()

    // 기본 설정으로도 subjects / backgroundRemoval 이 포함되므로 별도 설정 없이 사용
    analyzer.analyze(image: image) { result in
      switch result {
      case .success(let analysis):
        let stickers = Self.buildStickersFromVisionKit(
          analysis: analysis
        )
        resolve(stickers)

      case .failure(let error):
        reject(
          "ANALYSIS_FAILED",
          "Image analysis failed: \(error.localizedDescription)",
          error
        )
      }
    }
  }

  @available(iOS 16.0, *)
  private static func buildStickersFromVisionKit(
    analysis: ImageAnalysis
  ) -> [[String: Any]] {
    var results: [[String: Any]] = []

    let subjects = analysis.subjects
    if subjects.isEmpty {
      return results
    }

    let osVersion = UIDevice.current.systemVersion
    let method = "visionKit"

    for (index, subject) in subjects.enumerated() {
      let stickerImage = subject.image

      guard let data = stickerImage.pngData() else {
        continue
      }

      let fileName = "subject_sticker_\(UUID().uuidString).png"
      let tempDir = NSTemporaryDirectory()
      let url = URL(fileURLWithPath: tempDir).appendingPathComponent(fileName)

      do {
        try data.write(to: url, options: .atomic)

        let item: [String: Any] = [
          "id": "\(index)",
          "uri": url.absoluteString,
          "width": stickerImage.size.width,
          "height": stickerImage.size.height,
          "osVersion": osVersion,
          "method": method
        ]

        results.append(item)
      } catch {
        // 개별 스티커 저장 실패는 전체 실패로 보지 않고 무시
        continue
      }
    }

    return results
  }

  // MARK: - Vision (iOS 17+) 전경 마스크 경로

  @available(iOS 17.0, *)
  private func analyzeWithVisionMask(
    image: UIImage,
    success: @escaping ([[String: Any]]) -> Void,
    failure: @escaping (Error?) -> Void
  ) {
    guard let ciImage = CIImage(image: image) else {
      failure(nil)
      return
    }

    let request = VNGenerateForegroundInstanceMaskRequest { request, error in
      if let error = error {
        failure(error)
        return
      }

      guard
        let observations = request.results as? [VNInstanceMaskObservation],
        let observation = observations.first
      else {
        success([])
        return
      }

      let mask = observation.mask
      let maskImage = CIImage(cvPixelBuffer: mask)
      let original = ciImage

      let clear = CIImage(color: .clear).cropped(to: original.extent)

      // 마스크를 알파 채널로 사용하는 합성
      let composited = original.applyingFilter(
        "CIBlendWithMask",
        parameters: [
          kCIInputBackgroundImageKey: clear,
          kCIInputMaskImageKey: maskImage
        ]
      )

      let context = CIContext()

      guard
        let cgImage = context.createCGImage(
          composited,
          from: composited.extent
        )
      else {
        success([])
        return
      }

      let resultImage = UIImage(
        cgImage: cgImage,
        scale: image.scale,
        orientation: image.imageOrientation
      )

      guard let data = resultImage.pngData() else {
        success([])
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

        success([item])
      } catch {
        failure(error)
      }
    }

    let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])

    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try handler.perform([request])
      } catch {
        failure(error)
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
}


