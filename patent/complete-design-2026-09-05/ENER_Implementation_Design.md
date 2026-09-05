FHE + NeuromorphicComplete Reference Design

ENER / NeuroFHE Relay - revision BPrepared September 5, 2026. Submission working target: Wednesday, September 9, 2026.

This package defines a physical relay board, its implementable digital circuits, and the matching patent architecture. An existing headset or acquisition device supplies digital telemetry. A Raspberry Pi 4 runs the local adapter, policy and FHE client; an iCE40UP5K implements the event and spiking circuits. A remote OpenFHE evaluator receives encrypted features and returns encrypted scores.

| Deliverable | Contents |
| --- | --- |
| Patent schematics | 16 A4 black-and-white vector sheets with matching descriptions and reference numerals. |
| Circuit schematics | 8 A3 landscape sheets: four component sheets plus four digital/FHE datapath sheets. |
| Circuit design files | 55 board components; 226 explicitly assigned pins; 32 named nets; BOM, pin map, SVG and legacy KiCad import sources. |
| Actual FPGA implementation | Synthesizable source, generated Verilog, fitted netlist, package constraints, routed configuration image and behavioral tests. |
| Specification working copy | New figure descriptions and a concrete hardware embodiment inserted into a separate copy of the original specification. |

### Evidence and limits

The actual encoder logic passed 74 simulated frames, 14,262 input samples and 4,736 counter comparisons. Place and route passes at 16 MHz; reported maximum frequency is 21.38 MHz. These are software verification results. The relay PCB, assembled electronics, headset-specific driver and distributed FHE deployment have not been physically validated.

The semiconductor choices and the eight-neuron dynamics are concrete design work in this revision. They are not represented as historical prototypes or measured clinical results. No patent has been filed or repository changes published.

[ENER patent source, GitHub main](https://github.com/AlexanderDaly/neurofhe-relay/tree/main/patent)

## 1. Architecture decisions

| Decision | Reference choice and reason |
| --- | --- |
| Acquisition boundary | Use the original device and its digital USB interface or receiver. The relay does not add patient-connected analog electrodes or redesign the headset. |
| Trusted host | Raspberry Pi 4 Model B, 4 GB, 64-bit OS. Existing CPU, DDR, storage controller, network and power circuits remain within this off-the-shelf assembly. |
| Neuromorphic fabric | ICE40UP5K-SG48ITR50, 48-pin QFN plus exposed paddle. Clock is a 16 MHz external oscillator. No external FPGA memory or flash is required. |
| Configuration | Pi SPI slave configuration of FPGA SRAM. Same four SPI pads become the runtime serial link after configuration. |
| Encoder profiles | SPATIAL-64-B: repository-compatible event counter. LIF-64-B: concrete eight-neuron, frame-local integrate-and-fire network. |
| Feature contract | 64 unsigned two-bit counts, index=8*timeBin+unit; 50 ms frame; eight equal time bins; eight units on a 4x2 map. |
| Homomorphic circuit | OpenFHE BFVrns scalar ciphertext/plaintext linear scoring. Two classes in the reference integration; arbitrary approved C is a software generalization. |
| Default disclosure policy | Encrypt all 64 feature positions, including zeros. Support-visible sparse export requires an explicit profile permission. |
| Output decision | Decrypt and perform signed range checks and argmax locally. The evaluator never receives the FHE secret key. |

A complete CPU motherboard schematic is supplied by the board vendor; it is not newly designed here. The newly designed mezzanine is fully enumerated in the component drawings and connectivity files. This module boundary is part of the reference implementation, rather than an unspecified processor placeholder.

[Raspberry Pi 4 Model B datasheet, release 1.1](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf)

[Lattice iCE40 UltraPlus datasheet, FPGA-DS-02008 rev. 2.4](https://www.latticesemi.com/view_document?document_id=51968)

## 2. Acquisition and buffering contract

```text
Canonical sample = (channel, timestamp_us, amplitude)
channel       : uint8, allowed 0..7
timestamp_us  : uint16, allowed 0..49999 within a frame
amplitude     : int16, calibrated integer units
frame         : interval [origin, origin + 50000 us)
unit_x        : channel mod 4
unit_y        : floor(channel / 4)
```

The device adapter converts the original SDK or transport format into this contract. It must bind channel order, sampling rate, scale, offset, polarity and calibration version to the encoder/model profile. The hardware default threshold of 50 is in calibrated integer units; it is not automatically 50 microvolts. The exact headset model has not been supplied, so this package defines the required digital interface rather than claiming an untested vendor driver.

### Deterministic preparation

Use device timestamps or a validated sample-counter clock. Reject missing channels, unknown channels, non-finite values, amplitude conversion overflow and device sequence gaps. Assign each sample to the half-open 50 ms interval. Stable-sort each complete frame by timestamp, preserving original order for ties. Do not substitute arrival order for device time. Retain a frame validity flag that prevents any invalid frame from being encrypted.

| Buffer | Capacity and ownership |
| --- | --- |
| Raw frame bank A/B | Two host buffers, each 512 records x 8 bytes = 4096 bytes. One acquisition writer and one encoder reader; swap only complete valid frames. |
| Input rate envelope | Up to eight channels x 1000 samples/s for the electrical budget: about 400 records per 50 ms. The exact device/driver rate still requires measurement. |
| FPGA feature store | One 64 x 2-bit frozen/active store. BEGIN clears; END freezes. Read all 64 positions before issuing the next BEGIN. |
| HE work queue | Eight feature records maximum; each holds counts plus immutable frame/profile metadata. No unbounded backlog. |
| Overrun | Invalidate the affected acquisition frame. If HE queue is full, defer or use an approved local path; log a gap. Never relabel an old frame as current. |

Compression occurs before FHE encryption. The local host sees raw samples because it is inside the chosen trusted boundary. This is not a design in which plaintext remains secret from the local operating system.

## 3. Host and FPGA pin assignments

| Signal | Pi physical / BCM | FPGA pad | Path / behavior |
| --- | --- | --- | --- |
| SCK | 23 / GPIO11 | 15 | U8 -> R1; mode-0 clock |
| MOSI | 19 / GPIO10 | 17 | U8 -> R2; host to FPGA |
| MISO | 21 / GPIO9 | 14 | R3; FPGA to host |
| CS_N | 24 / GPIO8 | 16 | U9 -> R4; exactly 64 clocks per runtime transaction |
| CRESET_N | 11 / GPIO17 | 8 | Open-drain host control, U7 and SW1; external 10 kohm pull-up |
| CDONE | 13 / GPIO27 | 7 | Configuration status; keep pin reserved for configuration |
| READY | 15 / GPIO22 | 9 | High permits starting a command; falls during core/reply work |
| FRAME_READY | 16 / GPIO23 | 10 | High only for a frozen valid frame |
| SOFT_RESET | 18 / GPIO24 | 12 | U9 -> R6; synchronized into logic |
| Domain rst | Not exposed | 11 | Tied to GND; FPGA initialization plus synchronized soft reset is used |
| Clock | Not exposed | 35 | Y1 -> R5; 16 MHz global clock |
| Power | 2,4 / 5 V | Supply unit | F1, U2-U7 sequenced rails |
| Ground | 6,9,14,20,25,30,34,39 | 49 / paddle | Continuous ground plane |

J1 pin numbers are physical connector numbers, not BCM GPIO numbers. Pins 1 and 17 are deliberately not joined to the mezzanine 3.3 V regulator. SCK, MOSI, CS and soft reset pass through partial-power-down-capable buffers so a powered host does not directly drive those FPGA input pads when their local rail is off. R12-R14 and R18 define the buffer input levels.

[Raspberry Pi 4 Model B datasheet, release 1.1](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf)

[Lattice UltraPlus breakout-board schematic, Appendix A, rev. 1.2](https://media.latticesemi.com/-/media/LatticeSemi/Documents/UserManuals/EI/FPGA-UG-02001-1-2-iCE40-UltraPlus-Breakout-Board.ashx?document_id=51987)

[Texas Instruments SN74LVC2G17 datasheet, rev. N](https://www.ti.com/lit/ds/symlink/sn74lvc2g17.pdf)

## 4. Power tree and supervisor design

| Rail / part | Load allocation | Control |
| --- | --- | --- |
| +5V_RAW -> F1 | 150 mA relay input allocation | 0.25 A hold PTC; reference 5 V operating window 4.75..5.25 V |
| U2, TLV75512P | 1.2 V / 100 mA core+PLL allocation | EN tied to +5V; first rail |
| U5, TPS3808G12 | Sense 1.2 V; nominal trip 1.12 V | RESET_N pulls IO_ENABLE low until threshold + CT delay |
| U3, TLV75533P | 3.3 V / 30 mA I/O, clock, buffers | EN=IO_ENABLE; does not depend on Pi 3.3 V rail |
| U6, TPS3808G33 | Sense 3.3 V; nominal trip 3.07 V | RESET_N controls VPP_ENABLE |
| U4, TLV75525P | 2.5 V / 10 mA configuration allocation | EN=VPP_ENABLE |
| U7, TPS3808G25 | Sense 2.5 V; nominal trip 2.33 V | RESET_N holds CRESET_N low until last rail is valid |

Each TPS3808 receives +5V on pin 6, ground on pin 2, manual-reset high on pin 3 and a 1 nF C0G capacitor from pin 4 to ground. Pin 5 senses its assigned rail. Pin 1 is an open-drain output. Nominal delay is CT[nF]/175 + 0.0005 seconds = 6.21 ms. Delays are illustrative nominal component behavior, not measured board startup.

U2-U4 each have a local input capacitor and a 10 uF output capacitor. Effective output capacitance must remain at least 1 uF after DC-bias and tolerance derating. C14-C19 sit at the respective FPGA supply pins. R17 with C20/C21 filters VCCPLL. The ground paddle must be soldered and tied into the plane.

### Thermal sizing

At 5.25 V input and the 100 mA core allocation, U2 dissipates approximately (5.25-1.2)*0.1 = 0.405 W. Using the listed DBV junction-to-ambient value of 100.8 C/W gives a first-order rise of about 41 C. A 50 C local ambient would imply about 91 C junction before board-specific corrections. This is an allocation check, not a measured FPGA current or a substitute for layout thermal analysis. Verify rail ramps, output load and regulator temperatures on the assembled board.

[Texas Instruments TLV755P datasheet, rev. D](https://www.ti.com/lit/ds/symlink/tlv755p.pdf)

[Texas Instruments TPS3808 datasheet, rev. N](https://www.ti.com/lit/ds/symlink/tps3808.pdf)

[Lattice iCE40 UltraPlus datasheet, FPGA-DS-02008 rev. 2.4](https://www.latticesemi.com/view_document?document_id=51968)

## 5. Clock, reset and configuration sequence

Y1 is SiT8008BI-12-33E-16.000000: 2.5 x 2.0 mm, 3.3 V, industrial temperature range, nominal 16 MHz, 25 ppm stability, output-enable option. Pins are 1=OE, 2=GND, 3=OUT, 4=VDD. OE is tied high; C22 bypasses VDD. R5 is placed near the source. FPGA pad 35 accepts the global clock. No PLL multiplication is used.

### Power-up / configuration procedure

1. Keep host signal GPIOs non-driving until local rails have settled; keep GPIO17 low or high-impedance only. Wait at least 100 ms after board power before initiating configuration.

2. Reserve SPI0 exclusively. Pull CRESET_N low and drive CS_N low to select the FPGA slave configuration mode. Hold reset at least 1 ms.

3. Release CRESET_N to the external pull-up; confirm CDONE is low. Wait at least 1200 us for configuration-memory clearing, following the Lattice slave procedure.

4. Raise CS_N and issue eight dummy clocks. Then lower CS_N and send the complete bitstream MSB first at 1 MHz, with configuration data changing on falling clock edges.

5. After the complete image, raise CS_N; wait/check CDONE and provide at least 49 additional dummy clock cycles. Reject a configuration that never raises CDONE.

6. Change to the runtime mode-0 protocol, assert then release SOFT_RESET for at least 10 us, and query NOP/version. Require reply 0x0201 and zero errors before BEGIN.

A CRC error, reset, CDONE loss or invalid frame requires a new BEGIN and a fresh frame. The 64-count store is volatile. SRAM configuration and the local secret key are not recovered from old network ciphertexts.

[SiTime SiT8008B datasheet, rev. 1.08](https://www.sitime.com/datasheet/SiT8008)

[Lattice iCE40 programming and configuration, section 13](https://www.latticesemi.com/view_document?document_id=46502)

## 6. Runtime serial command format

SPI is mode 0, MSB first, at no more than 1 MHz. A transaction is exactly eight bytes while CS_N is low. Require at least 1 us from CS assertion to first rising clock, at least 1 us after the last clock before CS release, and READY high before asserting the next CS. A native host driver must meet these electrical timings; a generic Linux/Python call is not a real-time throughput guarantee.

| Byte | Field | Encoding |
| --- | --- | --- |
| 0 | Opcode | Command below |
| 1 | Argument | Mode, channel or feature index |
| 2..3 | Timestamp | Unsigned big-endian microseconds within frame |
| 4..5 | Value | Signed big-endian int16 for samples; unsigned bit pattern for configuration |
| 6 | Sequence | Host increments modulo 256; echoed in the next response |
| 7 | CRC-8 | Polynomial 0x07, initial 0, no reflection, no final XOR; covers bytes 0..6 |

| Opcode | Command | Action / legal state |
| --- | --- | --- |
| 0x00 | NOP / VERSION | Any state when READY; payload 0x0201 |
| 0x01 | BEGIN | Argument 0=SPATIAL-64-B, 1=LIF-64-B; clears count/state/error latch; supersedes an abandoned frame |
| 0x02 | END | Only an active frame; freezes only if frame has no fault |
| 0x10 | SAMPLE | Argument=channel 0..7; time <50000; signed value; active frame only |
| 0x11 | READ_COUNT | Argument=index 0..63; frozen valid frame only |
| 0x20 | SET_THRESHOLD | Value 1..32768, outside active frame; clears frozen-frame validity |
| 0x21 | SET_THETA | Value 1..65535, outside active frame; clears frozen-frame validity |

The one-command response pipeline permits each outgoing request to clock out the previous response. Issue a final NOP to retrieve the final READ_COUNT reply. No SPI command writes a cryptographic key, model score or external-network destination.

## 7. Replies, fault flags and recovery

| Byte | Meaning |
| --- | --- |
| 0 | Status: bit 0=frame active; bit 1=frozen frame valid; bits 2..7=0 |
| 1 | Echoed opcode |
| 2 | Echoed request sequence |
| 3 | Echoed argument |
| 4..5 | Unsigned big-endian payload; READ_COUNT returns 0..3 |
| 6 | Sticky error flags |
| 7 | CRC-8 over response bytes 0..6 |

| Bit | Cause | Required host response |
| --- | --- | --- |
| 0 | Wrong length, nonzero CRC residue or command while unavailable | Discard current frame; synchronize replies, then BEGIN a new frame |
| 1 | BEGIN mode not in {0,1} | Reject profile selection |
| 2 | END without active frame | Repair host lifecycle; do not use resulting status alone |
| 3 | Invalid channel/time or decreasing timestamp | Discard frame; investigate acquisition/order mapping |
| 4 | READ without valid frozen frame or index >=64 | Discard readout |
| 5 | Invalid configuration or configuration while frame active | Discard frame; configure only between frames |
| 6 | Unknown opcode | Reject protocol-version mismatch |
| 7 | Reserved | Treat nonzero as unsupported protocol |

The host checks response CRC, opcode, sequence, argument, status and error byte. Sequence echo is a local transport association check, not an authentication mechanism. BEGIN deliberately clears previous errors, so the host must latch any error before beginning again. A failed or corrupt frame is never silently converted into a valid all-zero feature vector.

```text
BEGIN(profile)
for sample in stable_sorted_valid_frame:
    wait READY; SAMPLE(channel, time, amplitude)
wait READY; END
require FRAME_READY and zero error flags
for index in 0..63: READ_COUNT(index)
NOP  # clocks out the last read response
verify every response; hand counts to policy/FHE
```

## 8. Spatial counter circuit

SPATIAL-64-B realizes the deterministic sorter in prototype/lib/spike-sorter.mjs. The host supplies canonical channels in stable timestamp order; the FPGA implements magnitude thresholding, per-channel refractory acceptance, time-bin addressing and bounded counting. Spatial mapping is x=channel mod 4, y=floor(channel/4). It does not perform waveform clustering or claim to identify individual biological neurons.

```text
b = floor(timestamp_us / 6250)
i = 8*b + channel
candidate = abs_int17(amplitude) >= threshold
refractory_ok = !seen[channel] OR
                timestamp_us - last[channel] >= 100
if candidate AND refractory_ok AND count[i] < 3:
    count[i] = count[i] + 1
    last[channel] = timestamp_us
    seen[channel] = 1
```

The magnitude path is 17 bits so -32768 is represented as magnitude 32768 rather than overflowing a signed 16-bit absolute-value circuit. Eight time bins are derived by threshold comparisons; there is no variable divider. Both 0 us and 49999 us are legal. A timestamp of 50000 belongs to the next frame. Exactly 100 us after the last acceptance is legal. At saturation, the count and last-accepted timestamp both remain unchanged, matching the source sorter.

| State element | Width / behavior |
| --- | --- |
| Counts | 64 x 2 bits = 128 bits; register array |
| Last accepted time | 8 x 16 bits = 128 bits |
| Seen flags | 8 bits |
| Frame/order state | Previous 16-bit timestamp, valid flag, active flag and fault latch |
| Clear engine | 6-bit address, one counter cleared per clock |
| Output | READ_COUNT zero-extends the two-bit value to 16 bits |

All state is local to a frame and cleared on BEGIN. A continuous cross-frame refractory or recurrent-state implementation would be a different profile and is not silently substituted here.

[Repository sorter source](https://github.com/AlexanderDaly/neurofhe-relay/blob/main/prototype/lib/spike-sorter.mjs)

## 9. Concrete integrate-and-fire network

LIF-64-B uses the same eight canonical input channels, threshold gate and 100 us source-event refractory interval. Each accepted source event visits eight output neurons in order 0..7. The fixed synaptic matrix is below; rows are output neurons and columns are input channels. Values are dimensionless integer integration increments.

| n / c | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| 1 | 4 | 16 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0 | 4 | 16 | 0 | 0 | 0 | 0 | 0 |
| 3 | 0 | 0 | 4 | 16 | 0 | 0 | 0 | 0 |
| 4 | 0 | 0 | 0 | 4 | 16 | 0 | 0 | 0 |
| 5 | 0 | 0 | 0 | 0 | 4 | 16 | 0 | 0 |
| 6 | 0 | 0 | 0 | 0 | 0 | 4 | 16 | 0 |
| 7 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 16 |

```text
Before any event at time t:
  advance each missing 1 ms tick in ascending order
  for every neuron n:
    V[n] = V[n] - (V[n] >> 4)
    R[n] = max(0, R[n] - 1)
For an accepted event on channel c:
  for n = 0..7:
    if W[n,c] != 0 and R[n] == 0:
      u = V[n] + W[n,c]  # 17-bit sum
      if u >= theta:
        V[n] = 0; R[n] = 2
        count[8*floor(t/6250)+n] = min(3, count[...] + 1)
      else: V[n] = u
```

V is an unsigned 16-bit register; R is a two-bit tick counter; theta defaults to 64. Refractory duration is two tick advances, so the elapsed interval depends on event phase within the millisecond; it is not an exact two-millisecond timer. Increments with weight zero have no effect. A neuron resets on a spike even if its output count is already saturated. There is no cross-frame state, recurrence through output spikes, inhibitory weight or online training in this selected network.

## 10. Local controller and memory schedule

| State | Operation | Bound |
| --- | --- | --- |
| IDLE | Admit one checked command; latch profile or sample | One synchronous admission |
| CLEAR | Clear one of 64 count registers per clock | 64 clocks after BEGIN admission |
| ADVANCE | Apply missing 1 ms leak ticks to all eight neurons | At most 49 ticks in a 50 ms frame |
| CHECK | Apply amplitude/refractory gates; spatial update or dispatch synapses | One decision cycle |
| SYNAPSE | Select neuron, ROM weight and state; integrate/reset/count | 8 clocks per accepted source event |
| REPLY CRC | Finalize 56-bit response body with serial CRC | 57 clocks; READY stays low |

The measured maximum core command latency in the supplied simulation is 65 clock cycles. A conservative protocol budget permits 128 clocks (8 us at 16 MHz) between the final CS release and the next transaction, while still requiring READY. Serial shifting and input synchronizers use the same clock domain. No asynchronous FIFO or unsynchronized multi-bit bus is present.

| Memory / storage | Concrete allocation |
| --- | --- |
| FPGA | Count registers, timestamp registers, neuron registers, transport shift registers, CRC state and FSMs. ROM weights are fixed constants synthesized into logic. |
| Local host | Two raw-frame banks; eight-entry feature queue; public model; FHE context; active keys; bounded job/reply ledger. |
| Remote worker | Public model/context/key, up to 64 input ciphertexts, two encrypted accumulators and one product temporary. |
| Persistent state | Versioned public profiles and signed application binaries. Secret persistence is optional and outside FPGA hardware; volatile session keys are the selected default. |

The source code is the editable behavioral hardware definition. ener_relay.v is generated, and ener_relay.json / ener_relay.asc / ener_relay.bin are synthesis, routed-design and configuration artifacts. The binary is a build result for this exact pinout, not a claim that a physical board has been programmed.

## 11. Privacy representation and model binding

| Profile | Export | Consequences |
| --- | --- | --- |
| DENSE64, default | 64 independently randomized ciphertexts in fixed index order; zeros included | Hides active support in the message contents under HE assumptions. Transport timing and profile identifiers remain visible. |
| SPARSE64, explicit opt-in | Strictly increasing active indices and ciphertexts of their values | Reveals exact support and active count. With binary counts, revealed support determines the feature vector. |
| Other embodiments | Padded/coarsened/encrypted-index approaches remain disclosed alternatives | Not implemented by simply relabeling this sparse kernel. Encrypted indices require an oblivious selection circuit. |

Each approved model includes encoder ID, calibration digest, mode, threshold, theta, frame duration, shape [8,8], channel-map digest, count bound, integer weights, integer biases, class order, representation policy and HE-context digest. A model trained for SPATIAL-64-B is not valid for LIF-64-B merely because both have 64 outputs. A profile update takes effect only between frames and invalidates pending incompatible readouts.

### Integer score range

```text
y[k] = b[k] + sum(i=0..63, W[k,i] * x[i])
x[i] in {0,1,2,3}; t = 65537
B[k] = abs(b[k]) + 3 * sum_i abs(W[k,i])
Require max_k B[k] <= 32768
```

For a convenient bounded model family, abs(W[k,i]) <= 127 and abs(b[k]) <= 8191 imply B[k] <= 32575. Center-lift a decrypted residue r by returning r for r <= 32768 and r-65537 otherwise. This prevents ambiguity from plaintext modular wrap. It does not by itself prove adequate ciphertext-noise margin.

## 12. FHE context and evaluation circuit

The baseline follows the repository native OpenFHE BFVrns linear scorer. It uses scalar feature ciphertexts and a public integer model. Key generation and decryption occur locally; remote computation is ciphertext/plaintext multiplication and ciphertext addition. The selected circuit needs no bootstrapping, rotation or ciphertext/ciphertext multiplication.

```text
CCParams<CryptoContextBFVRNS> p;
p.SetPlaintextModulus(65537);
p.SetMultiplicativeDepth(1);
p.SetBatchSize(1);
p.SetSecurityLevel(HEStd_128_classic);
cc = GenCryptoContext(p);
cc->Enable(PKE); cc->Enable(LEVELEDSHE);
keys = cc->KeyGen();

for each exported i:
  c[i] = cc->Encrypt(pk, cc->MakePackedPlaintext({x[i]}));
for each class k:
  Y[k] = cc->Encrypt(pk, cc->MakePackedPlaintext({b[k]}));
  for each exported i:
    term = cc->EvalMult(c[i],
              cc->MakePackedPlaintext({W[k,i]}));
    Y[k] = cc->EvalAdd(Y[k], term);
```

Use OpenFHE parameter generation to select N and the CRT primes, then record the actual N, each q_j, their total modulus bits, library version, build configuration, security setting and serialization digest in the public context manifest. Fixed parameters mean a fixed approved serialized context per deployment; they do not mean inventing unverified primes. Fail closed if the approved context differs from the received context.

In the reviewed BFVrns parameter generator, multiplicativeDepth, evalAddCount and keySwitchCount cannot be set nonzero together. Therefore this design does not combine depth=1 with evalAddCount=64. Validate the actual worst-case linear circuit and its maximum approved weights with native round-trip tests before admitting a deployment; do not treat a depth field as a complete noise proof.

[OpenFHE BFVrns parameter-generation source](https://openfhe-development.readthedocs.io/en/latest/api/program_listing_file_pke_lib_scheme_bfvrns_bfvrns-parametergeneration.cpp.html)

[OpenFHE example parameter guidance](https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md)

## 13. Host and remote process interface

| Boundary | Required contract |
| --- | --- |
| Acquisition -> encoder | Canonical frame with immutable origin, sample-clock version, stable order and validity. Only local IPC / memory. |
| Encoder -> HE queue | 64 counts; frame ID; encoder/config digest; calibration/channel-map digest; validity; no raw waveform copy. |
| Client -> evaluator | Protocol version; random 128-bit job ID; monotonic session counter; context/key/model/profile digests; shape; representation; bounded ciphertext blob lengths and payload. |
| Evaluator -> client | Same job and digest bindings; ordered C ciphertext scores; server protocol version; explicit error code for public admission failures. |
| Client -> application | Locally decrypted signed scores and approved class result; frame timestamp; validity/freshness; provenance digest. |

Use an authenticated encrypted channel with server identity validation. Serialize an explicit length-prefixed public header followed by individually length-prefixed OpenFHE binary ciphertexts; reject oversized lengths before allocation. Limit a reference request to 64 ciphertexts and a response to two. Set a deployment-specific byte cap after measuring the approved context; do not infer a ciphertext byte size solely from plaintext dimensions.

The worker validates version, model/context/key/profile IDs, class count, feature domain, absence of duplicate indices and the declared representation before evaluation. For DENSE64, require every index 0..63 exactly once in order. For SPARSE64, use only the disclosed indices and reject repetitions or out-of-range values. Neither client nor worker should deserialize arbitrary objects outside the approved schema.

The client binds every response to one outstanding job, accepts it once, rejects expired or mismatched jobs, and performs decryption only after public checks. Correct execution by an actively malicious worker is not proven by transport authentication; a separate verifiable-computation protocol or trusted evaluator would be needed for that stronger property. Do not expose detailed local decryption failures as an oracle to the worker.

This is the completed process/interface design. The repository native demo co-locates client and evaluator; it does not demonstrate this network deployment or hardware integration.

## 14. Key lifecycle and local decision

| Phase | Required action |
| --- | --- |
| Session start | Create context and keypair locally from cryptographic OS entropy; log only public identifiers. No deterministic demo seed in production key generation. |
| Provisioning | Send public key and context. Send evaluation keys only for operators that require them; this linear circuit does not require rotation or relinearization keys. |
| Queueing | Attach immutable context/key/model/encoder IDs; protect raw/feature buffers from untrusted local processes according to the deployment trust model. |
| Rotation | Stop admitting jobs under the old key, drain or expire their bounded ledger, distribute the new public context/key and resume. |
| Result use | Check bindings, decrypt locally, validate signed score range, apply the approved tie-break and output policy. |
| Session end | Stop transmission, invalidate outstanding jobs and release secret-bearing memory. For a strong erasure requirement, use an implementation with explicit zeroization and verify memory/swap behavior. |

Reference tie-break: choose the first class in the signed model manifest when scores tie. A timeout or invalid response produces no new classification. Retain the last result only if the application explicitly labels it stale. The reference relay returns an informational result; it does not directly stimulate neural tissue or drive a safety-critical actuator.

The local host and its operating system are trusted for plaintext and secret-key handling. No claim is made that commodity Pi RAM is a hardware secure enclave. The FPGA has no key register or key-loading command. The remote worker sees public model weights and allowed metadata; model confidentiality is not provided by this public-weight embodiment.

## 15. Throughput and capacity budget

| Quantity | Calculation / result |
| --- | --- |
| Core clock | 16 MHz = 62.5 ns per cycle |
| Runtime SPI | 1 MHz = 64 us for an eight-byte transaction |
| Timing budget per command | 64 us clocking + 1 us setup + 1 us hold + 8 us recovery = 74 us |
| Upper input budget | 8 channels x 1000 samples/s x 0.05 s = 400 SAMPLE commands |
| Frame transaction count | BEGIN + 400 SAMPLE + END + 64 READ + final NOP = 467 |
| Wire/logic budget | 467 x 74 us = 34.558 ms per 50 ms frame, before host scheduling overhead |
| 250 samples/s/channel | Average 100 samples/frame: about 12.358 ms at the same conservative transaction budget |
| FPGA storage | Count store 128 bits; neuron potentials 128 bits; timestamps 128 bits; plus flags, counters, transport and control state |
| FHE input count | Dense: 64 ciphertexts. Sparse: A, 0..64, and disclosed support. |
| FHE kernel work, C=2 | Dense: 128 CT/PT multiplies + 128 CT adds, two bias encryptions and two score decryptions. Sparse: 2A multiplies/adds. |

These are explicit design budgets, not measured end-to-end rates. Host GPIO/syscall scheduling, device decoding, FHE encryption, networking and decryption must be measured on the target. Admission control uses measured context-specific service times. A scalar sparse baseline does not establish superiority over packed dense FHE; packing changes both arithmetic counts and communication cost.

The existing synthetic repository case has 18 active positions out of 64, giving 36 multiplies and 36 additions for two classes. Its plaintext expected scores are 9 and 51 for the repository demo model. Those fixtures establish a regression target, not accuracy on a real headset.

## 16. PCB implementation and commissioning

Implement a four-layer mezzanine with continuous ground reference. Follow the vendor SG48 land pattern and exposed-pad requirements. Keep each supply capacitor close to its named U1 pin; use short local return paths. Route the clock from Y1 through R5 to pad 35 with a continuous reference plane. Place R1/R2/R4 near the buffer outputs and R3 near the FPGA output. Keep header orientation unambiguous and provide a pin-1 marker.

Separate the 5 V feed and core-current path from the clock route. Use sufficient copper for the U2 thermal allocation. Do not connect the independent 3.3 V regulator to Pi header pins 1 or 17. The original headset interface stays within its vendor-approved digital connection. Mechanical clearance to Pi connectors and heatsink must be checked against the vendor drawing before PCB release.

### Ordered bring-up checks

1. Before fitting the Pi or U1, inspect every power net for shorts and verify component package/pad orientation against the datasheet.

2. Use a current-limited bench source. Observe 1.2 V, then 3.3 V, then 2.5 V and CRESET_N with an oscilloscope. Verify monotonic ramps against Lattice limits; do not infer ramp compliance from the nominal LDO startup time.

3. Verify 16 MHz at Y1 and U1 pad 35, DC rail levels, power draw and temperature under a high-switching test image.

4. Configure the FPGA, verify CDONE, exercise the NOP/version command, and capture SCK/CS/MOSI/MISO/READY on a logic analyzer.

5. Replay the supplied synthetic and boundary fixtures; compare every returned count to the software reference. Test malformed packets, reset and acquisition loss.

6. Run native FHE round trips for zero, saturated, random and model-boundary feature vectors; verify exact signed scores for each approved context/model.

7. Integrate the actual headset adapter, then measure acquisition, encoding, encryption, network and result latency separately. Admit only the measured operating envelope.

The package stops at schematic, circuit implementation and software verification. There is no routed PCB, fabrication output, assembled-board measurement or claim of electrical/clinical qualification. The legacy KiCad files are import sources; their import and ERC have not been exercised in this environment.

## 17. Verification evidence

| Check | Observed result |
| --- | --- |
| Behavioral core simulation | 74 frames; 14,262 samples; 4,736 exact counter comparisons; both profiles. |
| Boundary cases | Empty frame, signed minimum, threshold equality, refractory equality, last valid timestamp, saturation and long gaps. |
| Invalid frame handling | Invalid channel, out-of-frame time, decreasing timestamp, injected link fault and active-frame configuration reject. |
| Serial circuit simulation | 18 complete transactions at 1 MHz; bad CRC, short and long packets rejected; reset recovery checked. |
| Synthesis | Yosys synth_ice40 completed; CHECK found zero problems. 2013 LUT4 primitives, 887 flip-flops, 387 carry primitives. |
| Place and route | UP5K SG48; all nine user ports constrained. 2686 / 5280 logic cells. 16 MHz target passes; reported fmax 21.38 MHz. |
| Timing margin | 62.5 ns target period versus approximately 46.78 ns critical path; about 15.72 ns margin in this tool report. |
| Board connectivity | 55 components, 226 physical pins and 32 named nets; every pin drawn once; all named nets have at least two terminals. |

Static timing covers the implemented internal synchronous logic. It does not establish asynchronous metastability probability, board-level signal integrity or external device timing; those are addressed by the specified synchronizers, interface budget and hardware qualification. The 16 MHz selection is based on the final routed result, not on an assumed device maximum.

Reproduce with the pinned tool versions in requirements-hdl.txt and the commands in README.md. The verification directory contains the raw logs, JSON reports and a serial waveform. Generated Verilog is an export of the same hardware model used in simulation.

[Amaranth simulator documentation](https://amaranth-lang.org/docs/amaranth/v0.5.0/simulator.html)

[Yosys and nextpnr framework paper](https://arxiv.org/abs/1903.10407)

## 18. Patent drawing descriptions (1-8)

Figure 1 illustrates an acquisition device 100 and a trusted local relay 200 comprising normalization and ordering 210, a neuromorphic circuit 220, compressed feature memory 230, and policy-controlled FHE encryption 240. The relay provides encrypted features to a remote encrypted inference engine 300.

Figure 2 illustrates a physical embodiment in which a digital device interface 110 connects to a local host processor 250. The host exchanges commands and features with programmable neuromorphic logic 220 over a serial link 260. A sequenced power and clock subsystem 270 supplies the logic.

Figure 3 illustrates canonical sample formation 211, frame validation and stable ordering 212, amplitude/refractory gating 221, and selection 222 between a spatial counter 223 and a spiking-neuron encoder 224. Both profiles write time/unit counts to memory 230.

Figure 4 illustrates a signed sample register 401, an absolute-value circuit 402, and threshold comparator 403. Last-accepted timestamp memory 404 and a time-difference comparator 405 provide a refractory condition to acceptance logic 406.

Figure 5 illustrates time-bin comparators 501 and a spatial-unit address 502 feeding address formation 503. Bounded memory 230 is updated by a saturating increment circuit 504 and exposed through a frozen-frame readout 231.

Figure 6 illustrates selected connections in an eight-neuron local encoder 224. Each input drives a corresponding self-input synapse 601 and an adjacent-neuron synapse 602; the pattern repeats through unit seven and wraps to unit zero.

Figure 7 illustrates synaptic weight ROM 701, neuron state register 702, integration adder 703, threshold comparator 704, and spike/reset selector 705. A threshold crossing resets state and updates bounded output-count memory 230.

Figure 8 illustrates timestamp register 801, tick advance logic 802, shift-and-subtract decay circuit 803, and refractory down-counter 804. Tick updates occur before same-time input events and frame-local state resets on BEGIN.

## 18. Patent drawing descriptions (9-16)

Figure 9 illustrates synchronizer registers 901, edge detection and a serial shift register 902, length/CRC admission 903, command/frame controller 904, and reply/CRC circuit 905. Rejected serial frames invalidate the active feature window.

Figure 10 illustrates core supply 1001, core supervisor and I/O enable 1002, I/O supply/supervisor 1003, configuration supply 1004, and reset supervisor 1005. The logic is released after the required rails become valid.

Figure 11 illustrates application of an approved privacy profile 241 to local counts 230. A fixed-domain encrypted representation 242 or a permitted support-visible representation 243 is bound to model, context and layout metadata 244.

Figure 12 illustrates encrypted feature value 1201 and public model weight 1202 entering ciphertext/plaintext multiplication 1203. Product ciphertexts enter encrypted accumulator 1204, initialized from encrypted bias 1205.

Figure 13 illustrates local secret key 1301, public key/context 1302, local decryption 1303, remote public-key encrypted evaluation 1304, and authorized local result 1305. The secret key remains inside trusted domain 200.

Figure 14 illustrates a frame lifecycle comprising clear 1401, ordered admission 1402, local state update 1403, valid-frame freezing 1404 and read/encrypt/dispatch 1405. Fault latch 1406 prevents dispatch of an invalid frame.

Figure 15 illustrates task/privacy constraints 1501 and resource/quality measurements 1502 selecting among an approved encoder/model catalog 1503. Compatibility and range checks 1504 determine admission to a remote, local or deferred route 1505.

Figure 16 illustrates an optional training embodiment with governed data 1601, candidate encoder 1602, task-utility test 1603, reconstruction/identity attack 1604, held-out acceptance gate 1605, and frozen deployment profile 1606. The fixed reference spiking circuit does not claim to have passed this training process.

## 19. Disclosure coverage and implementation status

| Existing disclosure | Figures / implementation | Status in this revision |
| --- | --- | --- |
| F.1-F.4; J.1: local compression then encryption | Figures 1-5, 11-13; component C01-C04 and datapath C05/C08 | Fully specified reference partition and interfaces |
| F.3.1; J.3/J.9: spatial sparse BFV | Figures 3-5, 11-12; SPATIAL-64-B | Actual hardware logic simulated; native software kernel already exists in source |
| F.3; F.13: neuromorphic hardware | Figures 6-10; LIF-64-B; U1 circuitry | New concrete circuit design; simulated and placed/routed; not physically built |
| F.5, F.11: adaptive profiles and routing | Figure 15; model/profile admission contract | Architecture specified; scheduler and live metrics are integration work |
| F.8, J.10: reconstruction-resistant training | Figure 16 | Optional disclosed training architecture; not a claimed property of the fixed ring encoder |
| F.9-F.10: metadata and trust separation | Figures 11 and 13; explicit DENSE64/SPARSE64 | Exposure defined; dense default is a new selected implementation policy |
| F.12: policy, audit and output | Figures 13-15; frame/job lifecycle | Local acceptance and network contracts specified |
| F.6-F.7; H: CKKS, TFHE, MPC alternatives | Retained in source specification | Not mixed into the selected BFVrns board/runtime path; separate profiles/circuits required |

The reference circuit is one embodiment of the existing architecture. Standard LIF dynamics, ordinary power supervisors and conventional FHE operators are not individually asserted to be novel. This engineering document is not a novelty search, an inventorship determination or an allowance opinion.

The companion specification working copy replaces the six old brief drawing descriptions with the coordinated sixteen-figure set and inserts section F.14. Other original specification language is preserved. The original files remain unchanged. The working copy is intended for the inventor and patent professional to review with the final figures.

## 20. Bill of materials (1-19)

| Ref | Value | Part / order specification | Package |
| --- | --- | --- | --- |
| J1 | PI 40-PIN SOCKET | Specified generic | 2x20, 2.54 mm, female, keyed orientation |
| U1 | iCE40UP5K-SG48 | ICE40UP5K-SG48ITR50 | QFN-48, 7x7 mm, 0.5 mm pitch + exposed pad |
| U2 | TLV75512P | TLV75512PDBVR | SOT-23-5 / DBV |
| U3 | TLV75533P | TLV75533PDBVR | SOT-23-5 / DBV |
| U4 | TLV75525P | TLV75525PDBVR | SOT-23-5 / DBV |
| U5 | TPS3808G12 | TPS3808G12DBVR | SOT-23-6 / DBV |
| U6 | TPS3808G33 | TPS3808G33DBVR | SOT-23-6 / DBV |
| U7 | TPS3808G25 | TPS3808G25DBVR | SOT-23-6 / DBV |
| Y1 | SiT8008B / 16 MHz | SiT8008BI-12-33E-16.000000 | 2520, four pads |
| U8 | SN74LVC2G17 | SN74LVC2G17DBVR | SOT-23-6 / DBV |
| U9 | SN74LVC2G17 | SN74LVC2G17DBVR | SOT-23-6 / DBV |
| F1 | PTC 0.25 A | Specified generic | 1206 |
| R1 | 33 ohm | Specified generic | 0603 |
| R2 | 33 ohm | Specified generic | 0603 |
| R3 | 33 ohm | Specified generic | 0603 |
| R4 | 33 ohm | Specified generic | 0603 |
| R5 | 33 ohm | Specified generic | 0603 |
| R6 | 1 kohm | Specified generic | 0603 |
| R7 | 10 kohm | Specified generic | 0603 |

Electrical ratings, capacitor derating and component-specific notes are in bom.csv. Generic passives are 1% resistors unless otherwise stated, with voltage and thermal ratings chosen for the specified rails. Confirm component availability and footprints during PCB/library release.

## 20. Bill of materials (20-38)

| Ref | Value | Part / order specification | Package |
| --- | --- | --- | --- |
| R8 | 10 kohm | Specified generic | 0603 |
| R9 | 10 kohm | Specified generic | 0603 |
| R10 | 10 kohm | Specified generic | 0603 |
| R11 | 10 kohm | Specified generic | 0603 |
| R12 | 100 kohm | Specified generic | 0603 |
| R13 | 100 kohm | Specified generic | 0603 |
| R14 | 100 kohm | Specified generic | 0603 |
| R15 | 100 kohm | Specified generic | 0603 |
| R16 | 100 kohm | Specified generic | 0603 |
| R17 | 100 ohm | Specified generic | 0603 |
| R18 | 100 kohm | Specified generic | 0603 |
| SW1 | RESET | Specified generic | Momentary normally open |
| C1 | 10 uF / 16 V | Specified generic | 0805 X7R |
| C2 | 1 uF / 10 V | Specified generic | 0603 X7R |
| C3 | 10 uF / 10 V | Specified generic | 0805 X7R |
| C4 | 1 uF / 10 V | Specified generic | 0603 X7R |
| C5 | 10 uF / 10 V | Specified generic | 0805 X7R |
| C6 | 1 uF / 10 V | Specified generic | 0603 X7R |
| C7 | 10 uF / 10 V | Specified generic | 0805 X7R |

Electrical ratings, capacitor derating and component-specific notes are in bom.csv. Generic passives are 1% resistors unless otherwise stated, with voltage and thermal ratings chosen for the specified rails. Confirm component availability and footprints during PCB/library release.

## 20. Bill of materials (39-55)

| Ref | Value | Part / order specification | Package |
| --- | --- | --- | --- |
| C8 | 100 nF | Specified generic | 0603 X7R |
| C9 | 100 nF | Specified generic | 0603 X7R |
| C10 | 100 nF | Specified generic | 0603 X7R |
| C11 | 1 nF C0G | Specified generic | 0603 C0G |
| C12 | 1 nF C0G | Specified generic | 0603 C0G |
| C13 | 1 nF C0G | Specified generic | 0603 C0G |
| C14 | 100 nF | Specified generic | 0603 X7R |
| C15 | 100 nF | Specified generic | 0603 X7R |
| C16 | 100 nF | Specified generic | 0603 X7R |
| C17 | 100 nF | Specified generic | 0603 X7R |
| C18 | 100 nF | Specified generic | 0603 X7R |
| C19 | 100 nF | Specified generic | 0603 X7R |
| C20 | 1 uF | Specified generic | 0603 X7R |
| C21 | 100 nF | Specified generic | 0603 X7R |
| C22 | 100 nF | Specified generic | 0603 X7R |
| C23 | 100 nF | Specified generic | 0603 X7R |
| C24 | 100 nF | Specified generic | 0603 X7R |

Electrical ratings, capacitor derating and component-specific notes are in bom.csv. Generic passives are 1% resistors unless otherwise stated, with voltage and thermal ratings chosen for the specified rails. Confirm component availability and footprints during PCB/library release.

## 21. Reference-numeral register

| Numerals | Meaning / first drawing |
| --- | --- |
| 100,110 | Acquisition device and digital interface; Figures 1-2 |
| 200,210-212 | Trusted relay, normalization, canonical sample and order validation; Figures 1-3 |
| 220-224 | Neuromorphic circuit, gate, selector, counter and spiking profiles; Figures 1-3 |
| 230-231 | Count memory and frozen-frame readout; Figures 1 and 5 |
| 240-244 | FHE/policy, privacy profile, encrypted representations and binding; Figures 1 and 11 |
| 250-270 | Host, serial link, power and clock; Figure 2 |
| 300 | Remote encrypted inference; Figures 1 and 13 |
| 401-406 | Magnitude and refractory acceptance circuits; Figure 4 |
| 501-504 | Address and saturating count update; Figure 5 |
| 601-602 | Self-input and adjacent-neuron synapses; Figure 6 |
| 701-705 | Neuron arithmetic and state selection; Figure 7 |
| 801-804 | Time advance, decay and refractory state; Figure 8 |
| 901-905 | Serial input, checking, controller and reply; Figure 9 |
| 1001-1005 | Power sequence and configuration reset; Figure 10 |
| 1201-1205 | Homomorphic linear-score arithmetic; Figure 12 |
| 1301-1305 | Key separation and result decryption; Figure 13 |
| 1401-1406 | Frame lifecycle and fault handling; Figure 14 |
| 1501-1505 | Adaptive admission and routing; Figure 15 |
| 1601-1606 | Optional training and deployment gate; Figure 16 |

Electrical designators U1, R1, C1 and J1 belong to the circuit/BOM namespace. Patent reference numerals are separate. U1 implements 220, 221, 223, 224 and their detailed circuits. M1 implements 210, 240 and 250. U2-U7 implement the power elements in Figure 10.

## 22. Sources and file guide

Authoritative sources were checked for pin assignments, voltage sequencing, supported device behavior and drawing conventions. The source repository commit for this package is c42d68225934a3bfa46a4bdd7573d035ad907b96. This is a design provenance record, not a statement about legal priority or public-disclosure dates.

[ENER patent source, GitHub main](https://github.com/AlexanderDaly/neurofhe-relay/tree/main/patent)

[Raspberry Pi 4 Model B datasheet, release 1.1](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf)

[Lattice iCE40 UltraPlus datasheet, FPGA-DS-02008 rev. 2.4](https://www.latticesemi.com/view_document?document_id=51968)

[Lattice UltraPlus breakout-board schematic, Appendix A, rev. 1.2](https://media.latticesemi.com/-/media/LatticeSemi/Documents/UserManuals/EI/FPGA-UG-02001-1-2-iCE40-UltraPlus-Breakout-Board.ashx?document_id=51987)

[Lattice iCE40 programming and configuration, section 13](https://www.latticesemi.com/view_document?document_id=46502)

[Texas Instruments TLV755P datasheet, rev. D](https://www.ti.com/lit/ds/symlink/tlv755p.pdf)

[Texas Instruments TPS3808 datasheet, rev. N](https://www.ti.com/lit/ds/symlink/tps3808.pdf)

[Texas Instruments SN74LVC2G17 datasheet, rev. N](https://www.ti.com/lit/ds/symlink/sn74lvc2g17.pdf)

[SiTime SiT8008B datasheet, rev. 1.08](https://www.sitime.com/datasheet/SiT8008)

[OpenFHE BFVrns parameter-generation source](https://openfhe-development.readthedocs.io/en/latest/api/program_listing_file_pke_lib_scheme_bfvrns_bfvrns-parametergeneration.cpp.html)

[OpenFHE example parameter guidance](https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md)

[USPTO MPEP 608.02, drawing requirements](https://www.uspto.gov/web/offices/pac/mpep/s608.html)

| File / folder | Use |
| --- | --- |
| svg/ | Editable vectors for every patent and circuit sheet |
| cad/ | Legacy KiCad import project and cached symbols; import/ ERC not performed here |
| rtl/ | Hardware source, Verilog, pin constraints and routed configuration artifacts |
| verification/ | Simulation, synthesis, routing, connectivity and artifact review records |
| bom.csv / pin_net_map.csv | Complete physical component and pin tables |
| ENER_specification_with_reference_design.md | Original specification working copy with replaced drawing section and new F.14 |
| drawing_descriptions.md | Matching sixteen-figure descriptions and numeral occurrence map |
