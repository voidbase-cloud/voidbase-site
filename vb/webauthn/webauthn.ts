// Passkeys: the counterpart of ../pb/webauthn/webauthn.go (go-webauthn glue). The WebAuthn logic itself is the
// `voidbase/passkeys` module (@simplewebauthn/server); this file registers its four routes on the app:
//   GET  /api/webauthn/registration-options?usernameOrEmail=   POST /api/webauthn/register
//   GET  /api/webauthn/login-options?usernameOrEmail=          POST /api/webauthn/login
// Credentials live in the `passkeys` collection (user, credential_id, credentials), the RP id comes from
// Settings > Application URL.
import { mountWebAuthn } from "voidbase/passkeys";
import type { VoidbaseApp } from "voidbase";

export function register(app: VoidbaseApp) {
  mountWebAuthn(app.router);
}
