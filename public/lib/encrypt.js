// PURPOSE:
// Encrypt text using a password.
//
// SECURITY PIPELINE:
// password → SHA-256 → PBKDF2 → AES-GCM
//
// WHY:
// SHA-256 normalizes the password
// PBKDF2 slows brute force
// AES-GCM provides authenticated encryption

const encoder = new TextEncoder();

/**
 * Convert ArrayBuffer → base64 string
 * (so we can safely store/transmit binary data)
 */
function b64encode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
}

/**
 * Hash the password using SHA-256.
 * This normalizes arbitrary password input into fixed-length bytes.
 */
async function sha256(password) {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(password)
    );
    return new Uint8Array(hash);
}

/**
 * Derive a strong AES key from the password.
 *
 * Steps:
 *   1. Hash password (your requirement)
 *   2. Import as PBKDF2 key material
 *   3. Stretch using PBKDF2 with salt + iterations
 *   4. Output AES-GCM 256-bit key
 */
async function deriveKey(password, salt, iterations) {
    const hashedPassword = await sha256(password);

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        hashedPassword,
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );
}

/**
 * MAIN ENCRYPT FUNCTION
 *
 * @param {string} plaintext
 * @param {string} password
 * @returns {Promise<string>} JSON payload
 */
export async function encrypt(plaintext, password) {
    if (!crypto?.subtle) {
        throw new Error("Web Crypto not available (need HTTPS or localhost)");
    }

    // Generate random salt (for PBKDF2)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Generate random IV (required for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive encryption key from password
    const iterations = 210000; // good balance for casual privacy
    const key = await deriveKey(password, salt, iterations);

    // Encrypt the plaintext
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plaintext)
    );

    // Return compact JSON payload
    return JSON.stringify({
        v: 1,                     // version (future-proofing)
        i: iterations,            // PBKDF2 iterations
        s: b64encode(salt),       // salt
        iv: b64encode(iv),        // initialization vector
        d: b64encode(ciphertext), // encrypted data (+ auth tag)
    });
}

// expose globally for <script src>
window.encrypt = encrypt;