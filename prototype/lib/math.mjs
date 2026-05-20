// SPDX-License-Identifier: CC0-1.0

export function gcd(a, b) {
  let left = BigInt(a);
  let right = BigInt(b);
  while (right !== 0n) {
    const next = right;
    right = left % right;
    left = next;
  }
  return left < 0n ? -left : left;
}

export function lcm(a, b) {
  const left = BigInt(a);
  const right = BigInt(b);
  return (left / gcd(left, right)) * right;
}

export function egcd(a, b) {
  const left = BigInt(a);
  const right = BigInt(b);
  if (right === 0n) return [left, 1n, 0n];
  const [g, x1, y1] = egcd(right, left % right);
  return [g, y1, x1 - (left / right) * y1];
}

export function modInv(a, m) {
  const modulus = BigInt(m);
  const [g, x] = egcd(positiveMod(a, modulus), modulus);
  if (g !== 1n) throw new Error("inverse does not exist");
  return positiveMod(x, modulus);
}

export function modPow(base, exp, mod) {
  const modulus = BigInt(mod);
  if (modulus <= 0n) throw new Error("modulus must be positive");
  let result = 1n;
  let b = positiveMod(base, modulus);
  let e = BigInt(exp);
  if (e < 0n) throw new Error("negative exponents are not supported");
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    b = (b * b) % modulus;
    e >>= 1n;
  }
  return result;
}

export function positiveMod(value, modulus) {
  const m = BigInt(modulus);
  return (BigInt(value) % m + m) % m;
}
