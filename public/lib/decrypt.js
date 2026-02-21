// PURPOSE:
// Decrypt payload produced by encrypt.js
//
// MUST MATCH encryption parameters exactly.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Convert base64 → ArrayBuffer
 */
function b64decode(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

/**
 * Same SHA-256 helper used in encryption.
 */
async function sha256(password) {
    const hash = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(password)
    );
    return new Uint8Array(hash);
}

/**
 * Re-derive the SAME AES key from password.
 * Must use identical salt + iterations.
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
        ["decrypt"]
    );
}

/**
 * MAIN DECRYPT FUNCTION
 *
 * @param {string|object} payload
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function decrypt(payload, password) {
    if (!crypto?.subtle) {
        throw new Error("Web Crypto not available (need HTTPS or localhost)");
    }

    // Accept JSON string or object
    const obj = typeof payload === "string"
        ? JSON.parse(payload)
        : payload;

    // Decode stored values
    const salt = new Uint8Array(b64decode(obj.s));
    const iv = new Uint8Array(b64decode(obj.iv));
    const data = b64decode(obj.d);

    // Re-derive key
    const key = await deriveKey(password, salt, obj.i);

    try {
        // Attempt decryption
        const plaintextBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            data
        );

        return decoder.decode(plaintextBuffer);
    } catch {
        // AES-GCM authentication failed
        throw new Error("Wrong password or corrupted data");
    }
}

// expose globally for <script src>
window.decrypt = decrypt;