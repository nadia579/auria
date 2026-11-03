// App lock: PIN (stored only as a salted SHA-256 hash) and fingerprint via WebAuthn.
// It's a "door lock": it stops someone who picks up your unlocked phone.
// The data itself is not encrypted.

// Both crypto.subtle and WebAuthn only exist on HTTPS (or localhost)
export const lockAvailable = () => window.isSecureContext && !!crypto.subtle;

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(salt + ':' + pin);
  return toHex(await crypto.subtle.digest('SHA-256', bytes));
}

// --- Fingerprint -----------------------------------------------------------

const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function biometricAvailable(): Promise<boolean> {
  if (!lockAvailable() || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Asks the phone to create a credential protected by fingerprint/face; returns its id
export async function registerBiometric(): Promise<string> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: 'Auria' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'auria', displayName: 'Auria' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error('Registrazione annullata');
  return toB64(credential.rawId);
}

// Resolves true if the phone confirmed your fingerprint
export async function verifyBiometric(credentialId: string): Promise<boolean> {
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: 'public-key', id: fromB64(credentialId) }],
        userVerification: 'required',
        timeout: 60000,
      },
    });
    return result !== null;
  } catch {
    return false;
  }
}
