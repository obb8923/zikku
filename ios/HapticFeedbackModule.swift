import Foundation
import UIKit

@objc(HapticFeedbackModule)
class HapticFeedbackModule: NSObject {
  
  // Impact feedback styles
  @objc(impact:)
  func impact(_ style: String) {
    var impactStyle: UIImpactFeedbackGenerator.FeedbackStyle
    
    switch style {
    case "light":
      impactStyle = .light
    case "medium":
      impactStyle = .medium
    case "heavy":
      impactStyle = .heavy
    case "soft":
      if #available(iOS 13.0, *) {
        impactStyle = .soft
      } else {
        impactStyle = .medium
      }
    case "rigid":
      if #available(iOS 13.0, *) {
        impactStyle = .rigid
      } else {
        impactStyle = .heavy
      }
    default:
      impactStyle = .medium
    }
    
    let generator = UIImpactFeedbackGenerator(style: impactStyle)
    generator.impactOccurred()
  }
  
  // Notification feedback types
  @objc(notification:)
  func notification(_ type: String) {
    var notificationType: UINotificationFeedbackGenerator.FeedbackType
    
    switch type {
    case "success":
      notificationType = .success
    case "warning":
      notificationType = .warning
    case "error":
      notificationType = .error
    default:
      notificationType = .success
    }
    
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(notificationType)
  }
  
  // Selection feedback
  @objc(selection)
  func selection() {
    let generator = UISelectionFeedbackGenerator()
    generator.selectionChanged()
  }
}

