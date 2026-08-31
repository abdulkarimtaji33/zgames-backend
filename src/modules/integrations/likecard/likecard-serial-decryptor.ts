import { createHash, createDecipheriv } from 'crypto';

/**
 * Decrypts a LikeCard `serialCode` into the real redeemable code. Confirmed against the exact
 * worked example published in LikeCard's own API docs (Create Order / Order Details 200 response
 * sections): AES-256-CBC, key = first 32 chars of SHA256(secretKey) hex digest (used as raw ASCII
 * bytes, not hex-decoded — this matches PHP's `hash()` returning its hex string form and
 * openssl_decrypt truncating an oversized key string), iv = first 16 chars of SHA256(secretIv) hex
 * digest (same ASCII-bytes convention). The ciphertext itself is base64-encoded twice: once by
 * LikeCard, and again internally by PHP's openssl_decrypt when called with $options=0 — so this
 * must base64-decode the input twice before decrypting, exactly mirroring the documented PHP.
 */
export function decryptLikeCardSerial(serialCode: string, secretKey: string, secretIv: string): string {
  const keyHex = createHash('sha256').update(secretKey).digest('hex');
  const key = Buffer.from(keyHex.slice(0, 32), 'utf8');
  const ivHex = createHash('sha256').update(secretIv).digest('hex').slice(0, 16);
  const iv = Buffer.from(ivHex, 'utf8');

  const onceDecoded = Buffer.from(serialCode, 'base64').toString('utf8');
  const ciphertext = Buffer.from(onceDecoded, 'base64');

  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
