// SPDX-License-Identifier: CC0-1.0

import { gcd, lcm, modInv, modPow } from "./math.mjs";

const DEFAULT_P = 1000003n;
const DEFAULT_Q = 1009837n;

export function createToyKeypair(options = {}) {
  const p = BigInt(options.p ?? DEFAULT_P);
  const q = BigInt(options.q ?? DEFAULT_Q);
  const n = p * q;
  const n2 = n * n;
  const g = n + 1n;
  const lambda = lcm(p - 1n, q - 1n);
  const lValue = (modPow(g, lambda, n2) - 1n) / n;
  const mu = modInv(lValue, n);

  return {
    publicKey: { scheme: "toy-paillier-additive", n, n2, g },
    privateKey: { lambda, mu },
  };
}

export function createToyCipher(publicKey, options = {}) {
  const rng = makeRng(options.seed ?? 7);

  function randomCoprime() {
    let r = (rng() % (publicKey.n - 2n)) + 2n;
    while (gcd(r, publicKey.n) !== 1n) {
      r = (r + 1n) % publicKey.n;
      if (r < 2n) r = 2n;
    }
    return r;
  }

  function encrypt(message) {
    const m = BigInt(message);
    if (m < 0n || m >= publicKey.n) {
      throw new Error("toy Paillier message must be in [0, n)");
    }
    const r = randomCoprime();
    const gm = modPow(publicKey.g, m, publicKey.n2);
    const rn = modPow(r, publicKey.n, publicKey.n2);
    return (gm * rn) % publicKey.n2;
  }

  function add(left, right) {
    return (BigInt(left) * BigInt(right)) % publicKey.n2;
  }

  function scalarMultiply(ciphertext, scalar) {
    const value = BigInt(scalar);
    if (value < 0n) throw new Error("negative scalar multiplication is not supported");
    return modPow(ciphertext, value, publicKey.n2);
  }

  return { encrypt, add, scalarMultiply };
}

export function decrypt(publicKey, privateKey, ciphertext) {
  const u = modPow(ciphertext, privateKey.lambda, publicKey.n2);
  const lValue = (u - 1n) / publicKey.n;
  return (lValue * privateKey.mu) % publicKey.n;
}

export function summarizeCiphertext(value, options = {}) {
  const head = options.head ?? 12;
  const tail = options.tail ?? 8;
  const text = BigInt(value).toString();
  if (text.length <= head + tail + 3) return text;
  return `${text.slice(0, head)}...${text.slice(-tail)}`;
}

export function estimateBigIntBytes(value) {
  const hex = BigInt(value).toString(16);
  return Math.ceil(hex.length / 2);
}

function makeRng(seed) {
  let state = BigInt(seed);
  return function next() {
    state = (1103515245n * state + 12345n) % 2147483648n;
    return state;
  };
}
