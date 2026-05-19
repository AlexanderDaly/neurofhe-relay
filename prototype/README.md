# NeuroFHE Relay Prototype

This is a dependency-free desk demo for the first privacy boundary.

It uses an educational additive homomorphic encryption toy based on Paillier-style arithmetic to classify a synthetic sparse event window. It is not production cryptography and it is not full FHE. Its purpose is to make the product claim visible:

1. The edge creates a sparse spike/event window.
2. The client encrypts each spike count.
3. The compute side evaluates public linear class weights over ciphertexts.
4. The keyholder decrypts the final class scores.

Run:

```sh
node artifacts/neurofhe-relay/prototype/toy-neurohe-demo.mjs
```

The next real prototype should replace this toy scheme with OpenFHE, SEAL/TenSEAL, Concrete, TFHE-rs, or an Octra/HFHE experiment once the operation family is fixed.

