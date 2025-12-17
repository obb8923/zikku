package com.jeong.zikku

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.Segmentation
import com.google.mlkit.vision.segmentation.SegmentationMask
import com.google.mlkit.vision.segmentation.selfie.SelfieSegmenterOptions
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.UUID

@ReactModule(name = SubjectStickerModule.NAME)
class SubjectStickerModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "SubjectStickerExtractor"
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun isSubjectExtractionSupported(promise: Promise) {
    // ML Kit Selfie Segmentation은 minSdk 21 이상에서 동작하며,
    // 현재 프로젝트 minSdkVersion(24)을 만족하므로 기본적으로 지원된다고 본다.
    promise.resolve(true)
  }

  @ReactMethod
  fun analyzeImage(path: String, promise: Promise) {
    val context = reactApplicationContext

    val bitmap = loadBitmap(path)
    if (bitmap == null) {
      promise.reject("INVALID_IMAGE", "Could not load image from path: $path")
      return
    }

    val options = SelfieSegmenterOptions.Builder()
      .setDetectorMode(SelfieSegmenterOptions.SINGLE_IMAGE_MODE)
      .build()

    val segmenter = Segmentation.getClient(options)
    val image = InputImage.fromBitmap(bitmap, 0)

    segmenter
      .process(image)
      .addOnSuccessListener { mask ->
        try {
          val result = buildStickersFromMask(bitmap, mask, context)
          promise.resolve(result)
        } catch (e: Exception) {
          promise.reject("ANALYSIS_FAILED", "Failed to build sticker bitmap: ${e.message}", e)
        }
      }
      .addOnFailureListener { e ->
        promise.reject("ANALYSIS_FAILED", "Segmentation failed: ${e.message}", e)
      }
  }

  private fun loadBitmap(path: String): Bitmap? {
    return try {
      val actualPath = if (path.startsWith("file://")) {
        path.removePrefix("file://")
      } else {
        path
      }
      BitmapFactory.decodeFile(actualPath)
    } catch (_: Exception) {
      null
    }
  }

  private fun buildStickersFromMask(
    bitmap: Bitmap,
    mask: SegmentationMask,
    context: ReactApplicationContext
  ): WritableArray {
    val width = mask.width
    val height = mask.height

    val maskBuffer = mask.buffer
    maskBuffer.rewind()

    // 새 투명 배경 Bitmap (마스크 크기에 맞춤)
    val outputBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

    // 필요 시 원본 비트맵을 마스크 크기로 리사이즈
    val sourceBitmap =
      if (bitmap.width != width || bitmap.height != height) {
        Bitmap.createScaledBitmap(bitmap, width, height, true)
      } else {
        bitmap
      }

    val pixels = IntArray(width * height)
    sourceBitmap.getPixels(pixels, 0, width, 0, 0, width, height)

    val threshold = 0.5f
    val outputPixels = IntArray(width * height)

    var i = 0
    while (i < width * height && maskBuffer.hasRemaining()) {
      val foregroundProb = maskBuffer.float
      val color = pixels[i]

      if (foregroundProb >= threshold) {
        // 전경: 원본 색상 유지 + 알파 255
        outputPixels[i] = color or (0xFF shl 24)
      } else {
        // 배경: 완전 투명
        outputPixels[i] = 0x00000000
      }
      i++
    }

    outputBitmap.setPixels(outputPixels, 0, width, 0, 0, width, height)

    // PNG로 저장
    val fileName = "subject_sticker_mlkit_${UUID.randomUUID()}.png"
    val cacheDir: File = context.cacheDir
    val outFile = File(cacheDir, fileName)

    try {
      FileOutputStream(outFile).use { out ->
        outputBitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      }
    } catch (e: IOException) {
      throw e
    }

    val osVersion = "Android ${Build.VERSION.RELEASE ?: ""}"

    val resultArray = Arguments.createArray()
    val map = Arguments.createMap().apply {
      putString("id", "0")
      putString("uri", "file://${outFile.absolutePath}")
      putDouble("width", width.toDouble())
      putDouble("height", height.toDouble())
      putString("osVersion", osVersion)
      putString("method", "mlkit")
    }

    resultArray.pushMap(map)
    return resultArray
  }
}


