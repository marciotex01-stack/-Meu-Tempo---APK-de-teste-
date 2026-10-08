import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const K = { hash: 'pin_hash', salt: 'pin_salt', q: 'rec_q', qh: 'rec_h', tries: 'pin_tries', lock: 'pin_lock' };
const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;
const ROUNDS = 1000;

async function digest(value: string, salt: string) {
  let h = salt + value;
  for (let i = 0; i < ROUNDS; i++) {
    h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, h + salt);
  }
  return h;
}

export const isValidPin = (pin: string) => /^\d{4,6}$/.test(pin);

export async function hasPin() {
  return !!(await SecureStore.getItemAsync(K.hash));
}

export async function getQuestion() {
  return (await SecureStore.getItemAsync(K.q)) ?? '';
}

export async function setPin(pin: string, question: string, answer: string) {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(K.salt, salt);
  await SecureStore.setItemAsync(K.hash, await digest(pin, salt));
  await SecureStore.setItemAsync(K.q, question.trim());
  await SecureStore.setItemAsync(K.qh, await digest(answer.trim().toLowerCase(), salt));
  await SecureStore.deleteItemAsync(K.tries);
  await SecureStore.deleteItemAsync(K.lock);
}

export type VerifyResult = { ok: boolean; lockedSeconds: number; triesLeft: number };

async function guard(check: (salt: string) => Promise<boolean>): Promise<VerifyResult> {
  const lockUntil = Number((await SecureStore.getItemAsync(K.lock)) ?? 0);
  if (lockUntil > Date.now()) return { ok: false, lockedSeconds: Math.ceil((lockUntil - Date.now()) / 1000), triesLeft: 0 };
  const salt = (await SecureStore.getItemAsync(K.salt)) ?? '';
  if (await check(salt)) {
    await SecureStore.deleteItemAsync(K.tries);
    return { ok: true, lockedSeconds: 0, triesLeft: MAX_TRIES };
  }
  const tries = Number((await SecureStore.getItemAsync(K.tries)) ?? 0) + 1;
  if (tries >= MAX_TRIES) {
    await SecureStore.setItemAsync(K.lock, String(Date.now() + LOCK_MS));
    await SecureStore.deleteItemAsync(K.tries);
    return { ok: false, lockedSeconds: LOCK_MS / 1000, triesLeft: 0 };
  }
  await SecureStore.setItemAsync(K.tries, String(tries));
  return { ok: false, lockedSeconds: 0, triesLeft: MAX_TRIES - tries };
}

export const verifyPin = (pin: string) =>
  guard(async (salt) => (await digest(pin, salt)) === (await SecureStore.getItemAsync(K.hash)));

export const verifyAnswer = (answer: string) =>
  guard(async (salt) => (await digest(answer.trim().toLowerCase(), salt)) === (await SecureStore.getItemAsync(K.qh)));
