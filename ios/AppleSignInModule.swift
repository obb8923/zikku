import Foundation
import AuthenticationServices

@objc(AppleSignInModule)
class AppleSignInModule: NSObject, ASAuthorizationControllerDelegate {
  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?

  @objc(signInWithApple:rejecter:)
  func signInWithApple(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.resolve = resolve
    self.reject = reject

    let request = ASAuthorizationAppleIDProvider().createRequest()
    request.requestedScopes = [.email, .fullName]

    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self
    controller.performRequests()
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
       let identityToken = appleIDCredential.identityToken,
       let tokenString = String(data: identityToken, encoding: .utf8) {
      resolve?(["idToken": tokenString])
    } else {
      reject?("NO_TOKEN", "Unable to fetch identity token", nil)
    }
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    reject?("APPLE_SIGNIN_ERROR", error.localizedDescription, error)
  }
}
