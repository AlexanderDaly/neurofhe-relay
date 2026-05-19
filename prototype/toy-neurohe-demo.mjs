#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0

const P = 1000003n;
const Q = 1009837n;

function gcd(a, b) {
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a < 0n ? -a : a;
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

function egcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = egcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

function modInv(a, m) {
  const [g, x] = egcd((a % m + m) % m, m);
  if (g !== 1n) throw new Error("inverse does not exist");
  return (x % m + m) % m;
}

function modPow(base, exp, mod) {
  let result = 1n;
  let b = (base % mod + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

function createToyKeypair() {
  const n = P * Q;
  const n2 = n * n;
  const g = n + 1n;
  const lambda = lcm(P - 1n, Q - 1n);
  const lValue = (modPow(g, lambda, n2) - 1n) / n;
  const mu = modInv(lValue, n);
  return {
    publicKey: { n, n2, g },
    privateKey: { lambda, mu },
  };
}

function makeRng(seed) {
  let state = BigInt(seed);
  return function next() {
    state = (1103515245n * state + 12345n) % 2147483648n;
    return state;
  };
}

function createCipher(publicKey, seed = 7) {
  const rng = makeRng(seed);

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
    const r = randomCoprime();
    const gm = modPow(publicKey.g, m, publicKey.n2);
    const rn = modPow(r, publicKey.n, publicKey.n2);
    return (gm * rn) % publicKey.n2;
  }

  function add(left, right) {
    return (left * right) % publicKey.n2;
  }

  function scalarMultiply(ciphertext, scalar) {
    return modPow(ciphertext, BigInt(scalar), publicKey.n2);
  }

  return { encrypt, add, scalarMultiply };
}

function decrypt(publicKey, privateKey, ciphertext) {
  const u = modPow(ciphertext, privateKey.lambda, publicKey.n2);
  const lValue = (u - 1n) / publicKey.n;
  return (lValue * privateKey.mu) % publicKey.n;
}

function buildSparseEventWindow() {
  return {
    schema: "neurofhe.events.v0.demo",
    windowMs: 50,
    timesteps: 8,
    channels: 8,
    encoding: "binary spike count",
    values: [
      [0, 1, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
    ],
  };
}

function flatten(window) {
  return window.values.flat();
}

function makeWeights(length) {
  const normal = Array.from({ length }, (_, index) => {
    const channel = index % 8;
    return [1, 2, 1, 1, 0, 0, 0, 0][channel];
  });
  const anomaly = Array.from({ length }, (_, index) => {
    const channel = index % 8;
    const time = Math.floor(index / 8);
    return [0, 0, 2, 2, 3, 3, 2, 0][channel] + (time >= 3 && time <= 6 ? 1 : 0);
  });
  return { normal, anomaly };
}

function encryptedDot(cipher, encryptedValues, weights) {
  return encryptedValues.reduce((acc, encryptedValue, index) => {
    const weighted = cipher.scalarMultiply(encryptedValue, weights[index]);
    return cipher.add(acc, weighted);
  }, cipher.encrypt(0));
}

function summarizeCiphertext(value) {
  const text = value.toString();
  return `${text.slice(0, 12)}...${text.slice(-8)}`;
}

function runDemo() {
  const eventWindow = buildSparseEventWindow();
  const flattened = flatten(eventWindow);
  const weights = makeWeights(flattened.length);
  const { publicKey, privateKey } = createToyKeypair();
  const cipher = createCipher(publicKey, 91);

  const encryptedValues = flattened.map((value) => cipher.encrypt(value));
  const encryptedScores = {
    normal: encryptedDot(cipher, encryptedValues, weights.normal),
    anomaly: encryptedDot(cipher, encryptedValues, weights.anomaly),
  };

  const scores = {
    normal: Number(decrypt(publicKey, privateKey, encryptedScores.normal)),
    anomaly: Number(decrypt(publicKey, privateKey, encryptedScores.anomaly)),
  };

  const classification = scores.anomaly > scores.normal ? "anomaly" : "normal";
  const spikeCount = flattened.reduce((sum, value) => sum + value, 0);
  const density = spikeCount / flattened.length;

  return {
    project: "NeuroFHE Relay",
    demo: "toy encrypted spike-count classifier",
    caveat: "Educational additive HE demo only; replace with audited HE/FHE library for real prototype.",
    privacyBoundary: {
      edgeSees: ["raw synthetic event window", "plaintext spikes"],
      computeSees: ["public weights", "ciphertext spike values", "encrypted score ciphertexts"],
      clientSees: ["decrypted class scores", "final classification"],
    },
    eventWindow: {
      schema: eventWindow.schema,
      shape: [eventWindow.timesteps, eventWindow.channels],
      encoding: eventWindow.encoding,
      spikeCount,
      density: Number(density.toFixed(4)),
    },
    encryptedPreview: {
      firstSpikeCiphertext: summarizeCiphertext(encryptedValues.find((_, index) => flattened[index] === 1)),
      normalScoreCiphertext: summarizeCiphertext(encryptedScores.normal),
      anomalyScoreCiphertext: summarizeCiphertext(encryptedScores.anomaly),
    },
    publicModel: {
      type: "non-negative linear spike-count classifier",
      classes: Object.keys(weights),
      featureCount: flattened.length,
    },
    decryptedScores: scores,
    classification,
    nextStep: "Port this exact event-window and linear score contract to CKKS/BFV/TFHE using a real HE library, then benchmark against a dense baseline.",
  };
}

console.log(JSON.stringify(runDemo(), null, 2));
