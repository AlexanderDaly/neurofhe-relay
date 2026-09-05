# Matching patent drawing descriptions - revision B

## E. Brief Description of Drawings

Figure 1 illustrates an acquisition device 100 and a trusted local relay 200 comprising normalization and ordering 210, a neuromorphic circuit 220, compressed feature memory 230, and policy-controlled FHE encryption 240. The relay provides encrypted features to a remote encrypted inference engine 300.

Figure 2 illustrates a physical embodiment in which a digital device interface 110 connects to a local host processor 250. The host exchanges commands and features with programmable neuromorphic logic 220 over a serial link 260. A sequenced power and clock subsystem 270 supplies the logic.

Figure 3 illustrates canonical sample formation 211, frame validation and stable ordering 212, amplitude/refractory gating 221, and selection 222 between a spatial counter 223 and a spiking-neuron encoder 224. Both profiles write time/unit counts to memory 230.

Figure 4 illustrates a signed sample register 401, an absolute-value circuit 402, and threshold comparator 403. Last-accepted timestamp memory 404 and a time-difference comparator 405 provide a refractory condition to acceptance logic 406.

Figure 5 illustrates time-bin comparators 501 and a spatial-unit address 502 feeding address formation 503. Bounded memory 230 is updated by a saturating increment circuit 504 and exposed through a frozen-frame readout 231.

Figure 6 illustrates selected connections in an eight-neuron local encoder 224. Each input drives a corresponding self-input synapse 601 and an adjacent-neuron synapse 602; the pattern repeats through unit seven and wraps to unit zero.

Figure 7 illustrates synaptic weight ROM 701, neuron state register 702, integration adder 703, threshold comparator 704, and spike/reset selector 705. A threshold crossing resets state and updates bounded output-count memory 230.

Figure 8 illustrates timestamp register 801, tick advance logic 802, shift-and-subtract decay circuit 803, and refractory down-counter 804. Tick updates occur before same-time input events and frame-local state resets on BEGIN.

Figure 9 illustrates synchronizer registers 901, edge detection and a serial shift register 902, length/CRC admission 903, command/frame controller 904, and reply/CRC circuit 905. Rejected serial frames invalidate the active feature window.

Figure 10 illustrates core supply 1001, core supervisor and I/O enable 1002, I/O supply/supervisor 1003, configuration supply 1004, and reset supervisor 1005. The logic is released after the required rails become valid.

Figure 11 illustrates application of an approved privacy profile 241 to local counts 230. A fixed-domain encrypted representation 242 or a permitted support-visible representation 243 is bound to model, context and layout metadata 244.

Figure 12 illustrates encrypted feature value 1201 and public model weight 1202 entering ciphertext/plaintext multiplication 1203. Product ciphertexts enter encrypted accumulator 1204, initialized from encrypted bias 1205.

Figure 13 illustrates local secret key 1301, public key/context 1302, local decryption 1303, remote public-key encrypted evaluation 1304, and authorized local result 1305. The secret key remains inside trusted domain 200.

Figure 14 illustrates a frame lifecycle comprising clear 1401, ordered admission 1402, local state update 1403, valid-frame freezing 1404 and read/encrypt/dispatch 1405. Fault latch 1406 prevents dispatch of an invalid frame.

Figure 15 illustrates task/privacy constraints 1501 and resource/quality measurements 1502 selecting among an approved encoder/model catalog 1503. Compatibility and range checks 1504 determine admission to a remote, local or deferred route 1505.

Figure 16 illustrates an optional training embodiment with governed data 1601, candidate encoder 1602, task-utility test 1603, reconstruction/identity attack 1604, held-out acceptance gate 1605, and frozen deployment profile 1606. The fixed reference spiking circuit does not claim to have passed this training process.


## Reference numeral occurrences

- 100: Figures 1
- 110: Figures 2
- 200: Figures 1, 13
- 210: Figures 1
- 211: Figures 3
- 212: Figures 3
- 220: Figures 1, 2
- 221: Figures 3
- 222: Figures 3
- 223: Figures 3
- 224: Figures 3, 6
- 230: Figures 1, 3, 5, 7, 11
- 231: Figures 5
- 240: Figures 1
- 241: Figures 11
- 242: Figures 11
- 243: Figures 11
- 244: Figures 11
- 250: Figures 2
- 260: Figures 2
- 270: Figures 2
- 300: Figures 1
- 401: Figures 4
- 402: Figures 4
- 403: Figures 4
- 404: Figures 4
- 405: Figures 4
- 406: Figures 4
- 501: Figures 5
- 502: Figures 5
- 503: Figures 5
- 504: Figures 5
- 601: Figures 6
- 602: Figures 6
- 701: Figures 7
- 702: Figures 7
- 703: Figures 7
- 704: Figures 7
- 705: Figures 7
- 801: Figures 8
- 802: Figures 8
- 803: Figures 8
- 804: Figures 8
- 901: Figures 9
- 902: Figures 9
- 903: Figures 9
- 904: Figures 9
- 905: Figures 9
- 1001: Figures 10
- 1002: Figures 10
- 1003: Figures 10
- 1004: Figures 10
- 1005: Figures 10
- 1201: Figures 12
- 1202: Figures 12
- 1203: Figures 12
- 1204: Figures 12
- 1205: Figures 12
- 1301: Figures 13
- 1302: Figures 13
- 1303: Figures 13
- 1304: Figures 13
- 1305: Figures 13
- 1401: Figures 14
- 1402: Figures 14
- 1403: Figures 14
- 1404: Figures 14
- 1405: Figures 14
- 1406: Figures 14
- 1501: Figures 15
- 1502: Figures 15
- 1503: Figures 15
- 1504: Figures 15
- 1505: Figures 15
- 1601: Figures 16
- 1602: Figures 16
- 1603: Figures 16
- 1604: Figures 16
- 1605: Figures 16
- 1606: Figures 16

## Integration note

These descriptions correspond to the new sixteen-sheet patent set. The companion specification working copy replaces section E and adds F.14. The source specification and previous drawing packages are preserved.
