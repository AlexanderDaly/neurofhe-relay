"""Engineering specification and a matching patent-specification working copy."""
from pathlib import Path
import json, re, csv, html, hashlib
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, PageBreak, Spacer, Preformatted
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[1]
OUT=ROOT/'output'/'pdf'
pdfmetrics.registerFont(TTFont('D','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('DB','C:/Windows/Fonts/arialbd.ttf'))
pdfmetrics.registerFont(TTFont('DM','C:/Windows/Fonts/consola.ttf'))
pdfmetrics.registerFontFamily('D',normal='D',bold='DB',italic='D',boldItalic='DB')
styles={k:ParagraphStyle(k,fontName=font,fontSize=size,leading=lead,spaceAfter=after,keepWithNext=k in ['h','sub']) for k,font,size,lead,after in [('title','DB',27,33,20),('h','DB',18,23,15),('sub','DB',11.5,15,7),('p','D',10.4,14.5,9),('small','D',8.7,11.8,7),('cell','D',8.8,11.6,0),('head','DB',8.8,11.6,0),('code','DM',9.1,12,10)]}
story=[];md=[]
def p(t,style='p'):
    story.append(Paragraph(t,styles[style]));md.append(re.sub('<[^>]+>','',t))
def page(t):
    if story:story.append(PageBreak())
    p(t,'h');md[-1]='## '+md[-1]
def sub(t):p(t,'sub');md[-1]='### '+md[-1]
def table(head,rows,widths):
    cells=[[Paragraph(html.escape(str(v)),styles['head']) for v in head]]+[[Paragraph(html.escape(str(v)),styles['cell']) for v in row] for row in rows]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.8,colors.black),('LINEBELOW',(0,1),(-1,-1),.25,colors.black),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5)]))
    story.extend([t,Spacer(1,10)])
    md.append('| '+' | '.join(head)+' |\n| '+' | '.join(['---']*len(head))+' |\n'+'\n'.join('| '+' | '.join(str(v).replace('|','/') for v in row)+' |' for row in rows))
def code(t):story.append(Preformatted(t,styles['code']));md.append('```text\n'+t+'\n```')
def link(label,url):p(f'<a href="{html.escape(url,quote=True)}">{html.escape(label)}</a>','small');md[-1]=f'[{label}]({url})'

sources={
 'repo':('ENER patent source, GitHub main','https://github.com/AlexanderDaly/neurofhe-relay/tree/main/patent'),
 'pi':('Raspberry Pi 4 Model B datasheet, release 1.1','https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-datasheet.pdf'),
 'fpga':('Lattice iCE40 UltraPlus datasheet, FPGA-DS-02008 rev. 2.4','https://www.latticesemi.com/view_document?document_id=51968'),
 'board':('Lattice UltraPlus breakout-board schematic, Appendix A, rev. 1.2','https://media.latticesemi.com/-/media/LatticeSemi/Documents/UserManuals/EI/FPGA-UG-02001-1-2-iCE40-UltraPlus-Breakout-Board.ashx?document_id=51987'),
 'config':('Lattice iCE40 programming and configuration, section 13','https://www.latticesemi.com/view_document?document_id=46502'),
 'ldo':('Texas Instruments TLV755P datasheet, rev. D','https://www.ti.com/lit/ds/symlink/tlv755p.pdf'),
 'supervisor':('Texas Instruments TPS3808 datasheet, rev. N','https://www.ti.com/lit/ds/symlink/tps3808.pdf'),
 'buffer':('Texas Instruments SN74LVC2G17 datasheet, rev. N','https://www.ti.com/lit/ds/symlink/sn74lvc2g17.pdf'),
 'clock':('SiTime SiT8008B datasheet, rev. 1.08','https://www.sitime.com/datasheet/SiT8008'),
 'he':('OpenFHE BFVrns parameter-generation source','https://openfhe-development.readthedocs.io/en/latest/api/program_listing_file_pke_lib_scheme_bfvrns_bfvrns-parametergeneration.cpp.html'),
 'heguide':('OpenFHE example parameter guidance','https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/README.md'),
 'drawings':('USPTO MPEP 608.02, drawing requirements','https://www.uspto.gov/web/offices/pac/mpep/s608.html'),
 'sim':('Amaranth simulator documentation','https://amaranth-lang.org/docs/amaranth/v0.5.0/simulator.html'),
 'pnr':('Yosys and nextpnr framework paper','https://arxiv.org/abs/1903.10407'),
}
def cite(k):link(*sources[k])

parts=json.loads((BASE/'components.json').read_text())
checks=json.loads((BASE/'verification'/'logic_verification.json').read_text())
pnr=json.loads((BASE/'verification'/'place_route.json').read_text())
cv=json.loads((BASE/'verification'/'connectivity_verification.json').read_text())
fmax=next(iter(pnr['fmax'].values()))
manifest=json.loads((BASE/'drawing_manifest.json').read_text())

p('FHE + Neuromorphic<br/>Complete Reference Design','title')
p('<b>ENER / NeuroFHE Relay - revision B</b><br/>Prepared September 5, 2026. Submission working target: Wednesday, September 9, 2026.')
p('This package defines a physical relay board, its implementable digital circuits, and the matching patent architecture. An existing headset or acquisition device supplies digital telemetry. A Raspberry Pi 4 runs the local adapter, policy and FHE client; an iCE40UP5K implements the event and spiking circuits. A remote OpenFHE evaluator receives encrypted features and returns encrypted scores.')
table(['Deliverable','Contents'],[
['Patent schematics','16 A4 black-and-white vector sheets with matching descriptions and reference numerals.'],
['Circuit schematics','8 A3 landscape sheets: four component sheets plus four digital/FHE datapath sheets.'],
['Circuit design files',f'{len(parts)} board components; {cv["physical_pins"]} explicitly assigned pins; {cv["named_nets"]} named nets; BOM, pin map, SVG and legacy KiCad import sources.'],
['Actual FPGA implementation','Synthesizable source, generated Verilog, fitted netlist, package constraints, routed configuration image and behavioral tests.'],
['Specification working copy','New figure descriptions and a concrete hardware embodiment inserted into a separate copy of the original specification.']],[137,340])
sub('Evidence and limits')
p(f'The actual encoder logic passed {checks["core"]["frames"]} simulated frames, {checks["core"]["samples"]:,} input samples and {checks["core"]["count_comparisons"]:,} counter comparisons. Place and route passes at 16 MHz; reported maximum frequency is {fmax["achieved"]:.2f} MHz. These are software verification results. The relay PCB, assembled electronics, headset-specific driver and distributed FHE deployment have not been physically validated.')
p('The semiconductor choices and the eight-neuron dynamics are concrete design work in this revision. They are not represented as historical prototypes or measured clinical results. No patent has been filed or repository changes published.','small')
cite('repo')

page('1. Architecture decisions')
table(['Decision','Reference choice and reason'],[
['Acquisition boundary','Use the original device and its digital USB interface or receiver. The relay does not add patient-connected analog electrodes or redesign the headset.'],
['Trusted host','Raspberry Pi 4 Model B, 4 GB, 64-bit OS. Existing CPU, DDR, storage controller, network and power circuits remain within this off-the-shelf assembly.'],
['Neuromorphic fabric','ICE40UP5K-SG48ITR50, 48-pin QFN plus exposed paddle. Clock is a 16 MHz external oscillator. No external FPGA memory or flash is required.'],
['Configuration','Pi SPI slave configuration of FPGA SRAM. Same four SPI pads become the runtime serial link after configuration.'],
['Encoder profiles','SPATIAL-64-B: repository-compatible event counter. LIF-64-B: concrete eight-neuron, frame-local integrate-and-fire network.'],
['Feature contract','64 unsigned two-bit counts, index=8*timeBin+unit; 50 ms frame; eight equal time bins; eight units on a 4x2 map.'],
['Homomorphic circuit','OpenFHE BFVrns scalar ciphertext/plaintext linear scoring. Two classes in the reference integration; arbitrary approved C is a software generalization.'],
['Default disclosure policy','Encrypt all 64 feature positions, including zeros. Support-visible sparse export requires an explicit profile permission.'],
['Output decision','Decrypt and perform signed range checks and argmax locally. The evaluator never receives the FHE secret key.']],[128,349])
p('A complete CPU motherboard schematic is supplied by the board vendor; it is not newly designed here. The newly designed mezzanine is fully enumerated in the component drawings and connectivity files. This module boundary is part of the reference implementation, rather than an unspecified processor placeholder.')
cite('pi');cite('fpga')

page('2. Acquisition and buffering contract')
code('Canonical sample = (channel, timestamp_us, amplitude)\nchannel       : uint8, allowed 0..7\ntimestamp_us  : uint16, allowed 0..49999 within a frame\namplitude     : int16, calibrated integer units\nframe         : interval [origin, origin + 50000 us)\nunit_x        : channel mod 4\nunit_y        : floor(channel / 4)')
p('The device adapter converts the original SDK or transport format into this contract. It must bind channel order, sampling rate, scale, offset, polarity and calibration version to the encoder/model profile. The hardware default threshold of 50 is in calibrated integer units; it is not automatically 50 microvolts. The exact headset model has not been supplied, so this package defines the required digital interface rather than claiming an untested vendor driver.')
sub('Deterministic preparation')
p('Use device timestamps or a validated sample-counter clock. Reject missing channels, unknown channels, non-finite values, amplitude conversion overflow and device sequence gaps. Assign each sample to the half-open 50 ms interval. Stable-sort each complete frame by timestamp, preserving original order for ties. Do not substitute arrival order for device time. Retain a frame validity flag that prevents any invalid frame from being encrypted.')
table(['Buffer','Capacity and ownership'],[
['Raw frame bank A/B','Two host buffers, each 512 records x 8 bytes = 4096 bytes. One acquisition writer and one encoder reader; swap only complete valid frames.'],
['Input rate envelope','Up to eight channels x 1000 samples/s for the electrical budget: about 400 records per 50 ms. The exact device/driver rate still requires measurement.'],
['FPGA feature store','One 64 x 2-bit frozen/active store. BEGIN clears; END freezes. Read all 64 positions before issuing the next BEGIN.'],
['HE work queue','Eight feature records maximum; each holds counts plus immutable frame/profile metadata. No unbounded backlog.'],
['Overrun','Invalidate the affected acquisition frame. If HE queue is full, defer or use an approved local path; log a gap. Never relabel an old frame as current.']],[125,352])
p('Compression occurs before FHE encryption. The local host sees raw samples because it is inside the chosen trusted boundary. This is not a design in which plaintext remains secret from the local operating system.')

page('3. Host and FPGA pin assignments')
table(['Signal','Pi physical / BCM','FPGA pad','Path / behavior'],[
['SCK','23 / GPIO11','15','U8 -> R1; mode-0 clock'],['MOSI','19 / GPIO10','17','U8 -> R2; host to FPGA'],['MISO','21 / GPIO9','14','R3; FPGA to host'],['CS_N','24 / GPIO8','16','U9 -> R4; exactly 64 clocks per runtime transaction'],['CRESET_N','11 / GPIO17','8','Open-drain host control, U7 and SW1; external 10 kohm pull-up'],['CDONE','13 / GPIO27','7','Configuration status; keep pin reserved for configuration'],['READY','15 / GPIO22','9','High permits starting a command; falls during core/reply work'],['FRAME_READY','16 / GPIO23','10','High only for a frozen valid frame'],['SOFT_RESET','18 / GPIO24','12','U9 -> R6; synchronized into logic'],['Domain rst','Not exposed','11','Tied to GND; FPGA initialization plus synchronized soft reset is used'],['Clock','Not exposed','35','Y1 -> R5; 16 MHz global clock'],['Power','2,4 / 5 V','Supply unit','F1, U2-U7 sequenced rails'],['Ground','6,9,14,20,25,30,34,39','49 / paddle','Continuous ground plane']],[87,106,57,227])
p('J1 pin numbers are physical connector numbers, not BCM GPIO numbers. Pins 1 and 17 are deliberately not joined to the mezzanine 3.3 V regulator. SCK, MOSI, CS and soft reset pass through partial-power-down-capable buffers so a powered host does not directly drive those FPGA input pads when their local rail is off. R12-R14 and R18 define the buffer input levels.')
cite('pi');cite('board');cite('buffer')

page('4. Power tree and supervisor design')
table(['Rail / part','Load allocation','Control'],[
['+5V_RAW -> F1','150 mA relay input allocation','0.25 A hold PTC; reference 5 V operating window 4.75..5.25 V'],
['U2, TLV75512P','1.2 V / 100 mA core+PLL allocation','EN tied to +5V; first rail'],
['U5, TPS3808G12','Sense 1.2 V; nominal trip 1.12 V','RESET_N pulls IO_ENABLE low until threshold + CT delay'],
['U3, TLV75533P','3.3 V / 30 mA I/O, clock, buffers','EN=IO_ENABLE; does not depend on Pi 3.3 V rail'],
['U6, TPS3808G33','Sense 3.3 V; nominal trip 3.07 V','RESET_N controls VPP_ENABLE'],
['U4, TLV75525P','2.5 V / 10 mA configuration allocation','EN=VPP_ENABLE'],
['U7, TPS3808G25','Sense 2.5 V; nominal trip 2.33 V','RESET_N holds CRESET_N low until last rail is valid']],[130,168,179])
p('Each TPS3808 receives +5V on pin 6, ground on pin 2, manual-reset high on pin 3 and a 1 nF C0G capacitor from pin 4 to ground. Pin 5 senses its assigned rail. Pin 1 is an open-drain output. Nominal delay is CT[nF]/175 + 0.0005 seconds = 6.21 ms. Delays are illustrative nominal component behavior, not measured board startup.')
p('U2-U4 each have a local input capacitor and a 10 uF output capacitor. Effective output capacitance must remain at least 1 uF after DC-bias and tolerance derating. C14-C19 sit at the respective FPGA supply pins. R17 with C20/C21 filters VCCPLL. The ground paddle must be soldered and tied into the plane.')
sub('Thermal sizing')
p('At 5.25 V input and the 100 mA core allocation, U2 dissipates approximately (5.25-1.2)*0.1 = 0.405 W. Using the listed DBV junction-to-ambient value of 100.8 C/W gives a first-order rise of about 41 C. A 50 C local ambient would imply about 91 C junction before board-specific corrections. This is an allocation check, not a measured FPGA current or a substitute for layout thermal analysis. Verify rail ramps, output load and regulator temperatures on the assembled board.')
cite('ldo');cite('supervisor');cite('fpga')

page('5. Clock, reset and configuration sequence')
p('Y1 is SiT8008BI-12-33E-16.000000: 2.5 x 2.0 mm, 3.3 V, industrial temperature range, nominal 16 MHz, 25 ppm stability, output-enable option. Pins are 1=OE, 2=GND, 3=OUT, 4=VDD. OE is tied high; C22 bypasses VDD. R5 is placed near the source. FPGA pad 35 accepts the global clock. No PLL multiplication is used.')
sub('Power-up / configuration procedure')
for t in [
'1. Keep host signal GPIOs non-driving until local rails have settled; keep GPIO17 low or high-impedance only. Wait at least 100 ms after board power before initiating configuration.',
'2. Reserve SPI0 exclusively. Pull CRESET_N low and drive CS_N low to select the FPGA slave configuration mode. Hold reset at least 1 ms.',
'3. Release CRESET_N to the external pull-up; confirm CDONE is low. Wait at least 1200 us for configuration-memory clearing, following the Lattice slave procedure.',
'4. Raise CS_N and issue eight dummy clocks. Then lower CS_N and send the complete bitstream MSB first at 1 MHz, with configuration data changing on falling clock edges.',
'5. After the complete image, raise CS_N; wait/check CDONE and provide at least 49 additional dummy clock cycles. Reject a configuration that never raises CDONE.',
'6. Change to the runtime mode-0 protocol, assert then release SOFT_RESET for at least 10 us, and query NOP/version. Require reply 0x0201 and zero errors before BEGIN.']:
    p(t)
p('A CRC error, reset, CDONE loss or invalid frame requires a new BEGIN and a fresh frame. The 64-count store is volatile. SRAM configuration and the local secret key are not recovered from old network ciphertexts.')
cite('clock');cite('config')

page('6. Runtime serial command format')
p('SPI is mode 0, MSB first, at no more than 1 MHz. A transaction is exactly eight bytes while CS_N is low. Require at least 1 us from CS assertion to first rising clock, at least 1 us after the last clock before CS release, and READY high before asserting the next CS. A native host driver must meet these electrical timings; a generic Linux/Python call is not a real-time throughput guarantee.')
table(['Byte','Field','Encoding'],[
['0','Opcode','Command below'],['1','Argument','Mode, channel or feature index'],['2..3','Timestamp','Unsigned big-endian microseconds within frame'],['4..5','Value','Signed big-endian int16 for samples; unsigned bit pattern for configuration'],['6','Sequence','Host increments modulo 256; echoed in the next response'],['7','CRC-8','Polynomial 0x07, initial 0, no reflection, no final XOR; covers bytes 0..6']],[45,111,321])
table(['Opcode','Command','Action / legal state'],[
['0x00','NOP / VERSION','Any state when READY; payload 0x0201'],['0x01','BEGIN','Argument 0=SPATIAL-64-B, 1=LIF-64-B; clears count/state/error latch; supersedes an abandoned frame'],['0x02','END','Only an active frame; freezes only if frame has no fault'],['0x10','SAMPLE','Argument=channel 0..7; time <50000; signed value; active frame only'],['0x11','READ_COUNT','Argument=index 0..63; frozen valid frame only'],['0x20','SET_THRESHOLD','Value 1..32768, outside active frame; clears frozen-frame validity'],['0x21','SET_THETA','Value 1..65535, outside active frame; clears frozen-frame validity']],[54,106,317])
p('The one-command response pipeline permits each outgoing request to clock out the previous response. Issue a final NOP to retrieve the final READ_COUNT reply. No SPI command writes a cryptographic key, model score or external-network destination.')

page('7. Replies, fault flags and recovery')
table(['Byte','Meaning'],[['0','Status: bit 0=frame active; bit 1=frozen frame valid; bits 2..7=0'],['1','Echoed opcode'],['2','Echoed request sequence'],['3','Echoed argument'],['4..5','Unsigned big-endian payload; READ_COUNT returns 0..3'],['6','Sticky error flags'],['7','CRC-8 over response bytes 0..6']],[55,422])
table(['Bit','Cause','Required host response'],[
['0','Wrong length, nonzero CRC residue or command while unavailable','Discard current frame; synchronize replies, then BEGIN a new frame'],['1','BEGIN mode not in {0,1}','Reject profile selection'],['2','END without active frame','Repair host lifecycle; do not use resulting status alone'],['3','Invalid channel/time or decreasing timestamp','Discard frame; investigate acquisition/order mapping'],['4','READ without valid frozen frame or index >=64','Discard readout'],['5','Invalid configuration or configuration while frame active','Discard frame; configure only between frames'],['6','Unknown opcode','Reject protocol-version mismatch'],['7','Reserved','Treat nonzero as unsupported protocol']],[32,219,226])
p('The host checks response CRC, opcode, sequence, argument, status and error byte. Sequence echo is a local transport association check, not an authentication mechanism. BEGIN deliberately clears previous errors, so the host must latch any error before beginning again. A failed or corrupt frame is never silently converted into a valid all-zero feature vector.')
code('BEGIN(profile)\nfor sample in stable_sorted_valid_frame:\n    wait READY; SAMPLE(channel, time, amplitude)\nwait READY; END\nrequire FRAME_READY and zero error flags\nfor index in 0..63: READ_COUNT(index)\nNOP  # clocks out the last read response\nverify every response; hand counts to policy/FHE')

page('8. Spatial counter circuit')
p('SPATIAL-64-B realizes the deterministic sorter in prototype/lib/spike-sorter.mjs. The host supplies canonical channels in stable timestamp order; the FPGA implements magnitude thresholding, per-channel refractory acceptance, time-bin addressing and bounded counting. Spatial mapping is x=channel mod 4, y=floor(channel/4). It does not perform waveform clustering or claim to identify individual biological neurons.')
code('b = floor(timestamp_us / 6250)\ni = 8*b + channel\ncandidate = abs_int17(amplitude) >= threshold\nrefractory_ok = !seen[channel] OR\n                timestamp_us - last[channel] >= 100\nif candidate AND refractory_ok AND count[i] < 3:\n    count[i] = count[i] + 1\n    last[channel] = timestamp_us\n    seen[channel] = 1')
p('The magnitude path is 17 bits so -32768 is represented as magnitude 32768 rather than overflowing a signed 16-bit absolute-value circuit. Eight time bins are derived by threshold comparisons; there is no variable divider. Both 0 us and 49999 us are legal. A timestamp of 50000 belongs to the next frame. Exactly 100 us after the last acceptance is legal. At saturation, the count and last-accepted timestamp both remain unchanged, matching the source sorter.')
table(['State element','Width / behavior'],[
['Counts','64 x 2 bits = 128 bits; register array'],['Last accepted time','8 x 16 bits = 128 bits'],['Seen flags','8 bits'],['Frame/order state','Previous 16-bit timestamp, valid flag, active flag and fault latch'],['Clear engine','6-bit address, one counter cleared per clock'],['Output','READ_COUNT zero-extends the two-bit value to 16 bits']],[151,326])
p('All state is local to a frame and cleared on BEGIN. A continuous cross-frame refractory or recurrent-state implementation would be a different profile and is not silently substituted here.')
link('Repository sorter source','https://github.com/AlexanderDaly/neurofhe-relay/blob/main/prototype/lib/spike-sorter.mjs')

page('9. Concrete integrate-and-fire network')
p('LIF-64-B uses the same eight canonical input channels, threshold gate and 100 us source-event refractory interval. Each accepted source event visits eight output neurons in order 0..7. The fixed synaptic matrix is below; rows are output neurons and columns are input channels. Values are dimensionless integer integration increments.')
weights=[[16 if n==c else 4 if n==(c+1)%8 else 0 for c in range(8)] for n in range(8)]
table(['n / c']+[str(i) for i in range(8)],[[n]+row for n,row in enumerate(weights)],[53]+[53]*8)
code('Before any event at time t:\n  advance each missing 1 ms tick in ascending order\n  for every neuron n:\n    V[n] = V[n] - (V[n] >> 4)\n    R[n] = max(0, R[n] - 1)\nFor an accepted event on channel c:\n  for n = 0..7:\n    if W[n,c] != 0 and R[n] == 0:\n      u = V[n] + W[n,c]  # 17-bit sum\n      if u >= theta:\n        V[n] = 0; R[n] = 2\n        count[8*floor(t/6250)+n] = min(3, count[...] + 1)\n      else: V[n] = u')
p('V is an unsigned 16-bit register; R is a two-bit tick counter; theta defaults to 64. Refractory duration is two tick advances, so the elapsed interval depends on event phase within the millisecond; it is not an exact two-millisecond timer. Increments with weight zero have no effect. A neuron resets on a spike even if its output count is already saturated. There is no cross-frame state, recurrence through output spikes, inhibitory weight or online training in this selected network.')

page('10. Local controller and memory schedule')
table(['State','Operation','Bound'],[
['IDLE','Admit one checked command; latch profile or sample','One synchronous admission'],['CLEAR','Clear one of 64 count registers per clock','64 clocks after BEGIN admission'],['ADVANCE','Apply missing 1 ms leak ticks to all eight neurons','At most 49 ticks in a 50 ms frame'],['CHECK','Apply amplitude/refractory gates; spatial update or dispatch synapses','One decision cycle'],['SYNAPSE','Select neuron, ROM weight and state; integrate/reset/count','8 clocks per accepted source event'],['REPLY CRC','Finalize 56-bit response body with serial CRC','57 clocks; READY stays low']],[85,302,90])
p('The measured maximum core command latency in the supplied simulation is 65 clock cycles. A conservative protocol budget permits 128 clocks (8 us at 16 MHz) between the final CS release and the next transaction, while still requiring READY. Serial shifting and input synchronizers use the same clock domain. No asynchronous FIFO or unsynchronized multi-bit bus is present.')
table(['Memory / storage','Concrete allocation'],[
['FPGA','Count registers, timestamp registers, neuron registers, transport shift registers, CRC state and FSMs. ROM weights are fixed constants synthesized into logic.'],
['Local host','Two raw-frame banks; eight-entry feature queue; public model; FHE context; active keys; bounded job/reply ledger.'],
['Remote worker','Public model/context/key, up to 64 input ciphertexts, two encrypted accumulators and one product temporary.'],
['Persistent state','Versioned public profiles and signed application binaries. Secret persistence is optional and outside FPGA hardware; volatile session keys are the selected default.']],[128,349])
p('The source code is the editable behavioral hardware definition. ener_relay.v is generated, and ener_relay.json / ener_relay.asc / ener_relay.bin are synthesis, routed-design and configuration artifacts. The binary is a build result for this exact pinout, not a claim that a physical board has been programmed.')

page('11. Privacy representation and model binding')
table(['Profile','Export','Consequences'],[
['DENSE64, default','64 independently randomized ciphertexts in fixed index order; zeros included','Hides active support in the message contents under HE assumptions. Transport timing and profile identifiers remain visible.'],
['SPARSE64, explicit opt-in','Strictly increasing active indices and ciphertexts of their values','Reveals exact support and active count. With binary counts, revealed support determines the feature vector.'],
['Other embodiments','Padded/coarsened/encrypted-index approaches remain disclosed alternatives','Not implemented by simply relabeling this sparse kernel. Encrypted indices require an oblivious selection circuit.']],[107,185,185])
p('Each approved model includes encoder ID, calibration digest, mode, threshold, theta, frame duration, shape [8,8], channel-map digest, count bound, integer weights, integer biases, class order, representation policy and HE-context digest. A model trained for SPATIAL-64-B is not valid for LIF-64-B merely because both have 64 outputs. A profile update takes effect only between frames and invalidates pending incompatible readouts.')
sub('Integer score range')
code('y[k] = b[k] + sum(i=0..63, W[k,i] * x[i])\nx[i] in {0,1,2,3}; t = 65537\nB[k] = abs(b[k]) + 3 * sum_i abs(W[k,i])\nRequire max_k B[k] <= 32768')
p('For a convenient bounded model family, abs(W[k,i]) <= 127 and abs(b[k]) <= 8191 imply B[k] <= 32575. Center-lift a decrypted residue r by returning r for r <= 32768 and r-65537 otherwise. This prevents ambiguity from plaintext modular wrap. It does not by itself prove adequate ciphertext-noise margin.')

page('12. FHE context and evaluation circuit')
p('The baseline follows the repository native OpenFHE BFVrns linear scorer. It uses scalar feature ciphertexts and a public integer model. Key generation and decryption occur locally; remote computation is ciphertext/plaintext multiplication and ciphertext addition. The selected circuit needs no bootstrapping, rotation or ciphertext/ciphertext multiplication.')
code('CCParams<CryptoContextBFVRNS> p;\np.SetPlaintextModulus(65537);\np.SetMultiplicativeDepth(1);\np.SetBatchSize(1);\np.SetSecurityLevel(HEStd_128_classic);\ncc = GenCryptoContext(p);\ncc->Enable(PKE); cc->Enable(LEVELEDSHE);\nkeys = cc->KeyGen();\n\nfor each exported i:\n  c[i] = cc->Encrypt(pk, cc->MakePackedPlaintext({x[i]}));\nfor each class k:\n  Y[k] = cc->Encrypt(pk, cc->MakePackedPlaintext({b[k]}));\n  for each exported i:\n    term = cc->EvalMult(c[i],\n              cc->MakePackedPlaintext({W[k,i]}));\n    Y[k] = cc->EvalAdd(Y[k], term);')
p('Use OpenFHE parameter generation to select N and the CRT primes, then record the actual N, each q_j, their total modulus bits, library version, build configuration, security setting and serialization digest in the public context manifest. Fixed parameters mean a fixed approved serialized context per deployment; they do not mean inventing unverified primes. Fail closed if the approved context differs from the received context.')
p('In the reviewed BFVrns parameter generator, multiplicativeDepth, evalAddCount and keySwitchCount cannot be set nonzero together. Therefore this design does not combine depth=1 with evalAddCount=64. Validate the actual worst-case linear circuit and its maximum approved weights with native round-trip tests before admitting a deployment; do not treat a depth field as a complete noise proof.')
cite('he');cite('heguide')

page('13. Host and remote process interface')
table(['Boundary','Required contract'],[
['Acquisition -> encoder','Canonical frame with immutable origin, sample-clock version, stable order and validity. Only local IPC / memory.'],
['Encoder -> HE queue','64 counts; frame ID; encoder/config digest; calibration/channel-map digest; validity; no raw waveform copy.'],
['Client -> evaluator','Protocol version; random 128-bit job ID; monotonic session counter; context/key/model/profile digests; shape; representation; bounded ciphertext blob lengths and payload.'],
['Evaluator -> client','Same job and digest bindings; ordered C ciphertext scores; server protocol version; explicit error code for public admission failures.'],
['Client -> application','Locally decrypted signed scores and approved class result; frame timestamp; validity/freshness; provenance digest.']],[126,351])
p('Use an authenticated encrypted channel with server identity validation. Serialize an explicit length-prefixed public header followed by individually length-prefixed OpenFHE binary ciphertexts; reject oversized lengths before allocation. Limit a reference request to 64 ciphertexts and a response to two. Set a deployment-specific byte cap after measuring the approved context; do not infer a ciphertext byte size solely from plaintext dimensions.')
p('The worker validates version, model/context/key/profile IDs, class count, feature domain, absence of duplicate indices and the declared representation before evaluation. For DENSE64, require every index 0..63 exactly once in order. For SPARSE64, use only the disclosed indices and reject repetitions or out-of-range values. Neither client nor worker should deserialize arbitrary objects outside the approved schema.')
p('The client binds every response to one outstanding job, accepts it once, rejects expired or mismatched jobs, and performs decryption only after public checks. Correct execution by an actively malicious worker is not proven by transport authentication; a separate verifiable-computation protocol or trusted evaluator would be needed for that stronger property. Do not expose detailed local decryption failures as an oracle to the worker.')
p('This is the completed process/interface design. The repository native demo co-locates client and evaluator; it does not demonstrate this network deployment or hardware integration.')

page('14. Key lifecycle and local decision')
table(['Phase','Required action'],[
['Session start','Create context and keypair locally from cryptographic OS entropy; log only public identifiers. No deterministic demo seed in production key generation.'],
['Provisioning','Send public key and context. Send evaluation keys only for operators that require them; this linear circuit does not require rotation or relinearization keys.'],
['Queueing','Attach immutable context/key/model/encoder IDs; protect raw/feature buffers from untrusted local processes according to the deployment trust model.'],
['Rotation','Stop admitting jobs under the old key, drain or expire their bounded ledger, distribute the new public context/key and resume.'],
['Result use','Check bindings, decrypt locally, validate signed score range, apply the approved tie-break and output policy.'],
['Session end','Stop transmission, invalidate outstanding jobs and release secret-bearing memory. For a strong erasure requirement, use an implementation with explicit zeroization and verify memory/swap behavior.']],[113,364])
p('Reference tie-break: choose the first class in the signed model manifest when scores tie. A timeout or invalid response produces no new classification. Retain the last result only if the application explicitly labels it stale. The reference relay returns an informational result; it does not directly stimulate neural tissue or drive a safety-critical actuator.')
p('The local host and its operating system are trusted for plaintext and secret-key handling. No claim is made that commodity Pi RAM is a hardware secure enclave. The FPGA has no key register or key-loading command. The remote worker sees public model weights and allowed metadata; model confidentiality is not provided by this public-weight embodiment.')

page('15. Throughput and capacity budget')
table(['Quantity','Calculation / result'],[
['Core clock','16 MHz = 62.5 ns per cycle'],['Runtime SPI','1 MHz = 64 us for an eight-byte transaction'],['Timing budget per command','64 us clocking + 1 us setup + 1 us hold + 8 us recovery = 74 us'],['Upper input budget','8 channels x 1000 samples/s x 0.05 s = 400 SAMPLE commands'],['Frame transaction count','BEGIN + 400 SAMPLE + END + 64 READ + final NOP = 467'],['Wire/logic budget','467 x 74 us = 34.558 ms per 50 ms frame, before host scheduling overhead'],['250 samples/s/channel','Average 100 samples/frame: about 12.358 ms at the same conservative transaction budget'],['FPGA storage','Count store 128 bits; neuron potentials 128 bits; timestamps 128 bits; plus flags, counters, transport and control state'],['FHE input count','Dense: 64 ciphertexts. Sparse: A, 0..64, and disclosed support.'],['FHE kernel work, C=2','Dense: 128 CT/PT multiplies + 128 CT adds, two bias encryptions and two score decryptions. Sparse: 2A multiplies/adds.']],[155,322])
p('These are explicit design budgets, not measured end-to-end rates. Host GPIO/syscall scheduling, device decoding, FHE encryption, networking and decryption must be measured on the target. Admission control uses measured context-specific service times. A scalar sparse baseline does not establish superiority over packed dense FHE; packing changes both arithmetic counts and communication cost.')
p('The existing synthetic repository case has 18 active positions out of 64, giving 36 multiplies and 36 additions for two classes. Its plaintext expected scores are 9 and 51 for the repository demo model. Those fixtures establish a regression target, not accuracy on a real headset.')

page('16. PCB implementation and commissioning')
p('Implement a four-layer mezzanine with continuous ground reference. Follow the vendor SG48 land pattern and exposed-pad requirements. Keep each supply capacitor close to its named U1 pin; use short local return paths. Route the clock from Y1 through R5 to pad 35 with a continuous reference plane. Place R1/R2/R4 near the buffer outputs and R3 near the FPGA output. Keep header orientation unambiguous and provide a pin-1 marker.')
p('Separate the 5 V feed and core-current path from the clock route. Use sufficient copper for the U2 thermal allocation. Do not connect the independent 3.3 V regulator to Pi header pins 1 or 17. The original headset interface stays within its vendor-approved digital connection. Mechanical clearance to Pi connectors and heatsink must be checked against the vendor drawing before PCB release.')
sub('Ordered bring-up checks')
for t in [
'1. Before fitting the Pi or U1, inspect every power net for shorts and verify component package/pad orientation against the datasheet.',
'2. Use a current-limited bench source. Observe 1.2 V, then 3.3 V, then 2.5 V and CRESET_N with an oscilloscope. Verify monotonic ramps against Lattice limits; do not infer ramp compliance from the nominal LDO startup time.',
'3. Verify 16 MHz at Y1 and U1 pad 35, DC rail levels, power draw and temperature under a high-switching test image.',
'4. Configure the FPGA, verify CDONE, exercise the NOP/version command, and capture SCK/CS/MOSI/MISO/READY on a logic analyzer.',
'5. Replay the supplied synthetic and boundary fixtures; compare every returned count to the software reference. Test malformed packets, reset and acquisition loss.',
'6. Run native FHE round trips for zero, saturated, random and model-boundary feature vectors; verify exact signed scores for each approved context/model.',
'7. Integrate the actual headset adapter, then measure acquisition, encoding, encryption, network and result latency separately. Admit only the measured operating envelope.']:
    p(t,'small')
p('The package stops at schematic, circuit implementation and software verification. There is no routed PCB, fabrication output, assembled-board measurement or claim of electrical/clinical qualification. The legacy KiCad files are import sources; their import and ERC have not been exercised in this environment.')

page('17. Verification evidence')
table(['Check','Observed result'],[
['Behavioral core simulation',f'{checks["core"]["frames"]} frames; {checks["core"]["samples"]:,} samples; {checks["core"]["count_comparisons"]:,} exact counter comparisons; both profiles.'],
['Boundary cases','Empty frame, signed minimum, threshold equality, refractory equality, last valid timestamp, saturation and long gaps.'],
['Invalid frame handling','Invalid channel, out-of-frame time, decreasing timestamp, injected link fault and active-frame configuration reject.'],
['Serial circuit simulation',f'{checks["spi"]["transactions"]} complete transactions at 1 MHz; bad CRC, short and long packets rejected; reset recovery checked.'],
['Synthesis','Yosys synth_ice40 completed; CHECK found zero problems. 2013 LUT4 primitives, 887 flip-flops, 387 carry primitives.'],
['Place and route',f'UP5K SG48; all nine user ports constrained. {pnr["utilization"]["ICESTORM_LC"]["used"]} / {pnr["utilization"]["ICESTORM_LC"]["available"]} logic cells. 16 MHz target passes; reported fmax {fmax["achieved"]:.2f} MHz.'],
['Timing margin',f'62.5 ns target period versus approximately {1000/fmax["achieved"]:.2f} ns critical path; about {62.5-1000/fmax["achieved"]:.2f} ns margin in this tool report.'],
['Board connectivity',f'{cv["physical_components"]} components, {cv["physical_pins"]} physical pins and {cv["named_nets"]} named nets; every pin drawn once; all named nets have at least two terminals.']],[142,335])
p('Static timing covers the implemented internal synchronous logic. It does not establish asynchronous metastability probability, board-level signal integrity or external device timing; those are addressed by the specified synchronizers, interface budget and hardware qualification. The 16 MHz selection is based on the final routed result, not on an assumed device maximum.')
p('Reproduce with the pinned tool versions in requirements-hdl.txt and the commands in README.md. The verification directory contains the raw logs, JSON reports and a serial waveform. Generated Verilog is an export of the same hardware model used in simulation.')
cite('sim');cite('pnr')

descriptions={
1:'Figure 1 illustrates an acquisition device 100 and a trusted local relay 200 comprising normalization and ordering 210, a neuromorphic circuit 220, compressed feature memory 230, and policy-controlled FHE encryption 240. The relay provides encrypted features to a remote encrypted inference engine 300.',
2:'Figure 2 illustrates a physical embodiment in which a digital device interface 110 connects to a local host processor 250. The host exchanges commands and features with programmable neuromorphic logic 220 over a serial link 260. A sequenced power and clock subsystem 270 supplies the logic.',
3:'Figure 3 illustrates canonical sample formation 211, frame validation and stable ordering 212, amplitude/refractory gating 221, and selection 222 between a spatial counter 223 and a spiking-neuron encoder 224. Both profiles write time/unit counts to memory 230.',
4:'Figure 4 illustrates a signed sample register 401, an absolute-value circuit 402, and threshold comparator 403. Last-accepted timestamp memory 404 and a time-difference comparator 405 provide a refractory condition to acceptance logic 406.',
5:'Figure 5 illustrates time-bin comparators 501 and a spatial-unit address 502 feeding address formation 503. Bounded memory 230 is updated by a saturating increment circuit 504 and exposed through a frozen-frame readout 231.',
6:'Figure 6 illustrates selected connections in an eight-neuron local encoder 224. Each input drives a corresponding self-input synapse 601 and an adjacent-neuron synapse 602; the pattern repeats through unit seven and wraps to unit zero.',
7:'Figure 7 illustrates synaptic weight ROM 701, neuron state register 702, integration adder 703, threshold comparator 704, and spike/reset selector 705. A threshold crossing resets state and updates bounded output-count memory 230.',
8:'Figure 8 illustrates timestamp register 801, tick advance logic 802, shift-and-subtract decay circuit 803, and refractory down-counter 804. Tick updates occur before same-time input events and frame-local state resets on BEGIN.',
9:'Figure 9 illustrates synchronizer registers 901, edge detection and a serial shift register 902, length/CRC admission 903, command/frame controller 904, and reply/CRC circuit 905. Rejected serial frames invalidate the active feature window.',
10:'Figure 10 illustrates core supply 1001, core supervisor and I/O enable 1002, I/O supply/supervisor 1003, configuration supply 1004, and reset supervisor 1005. The logic is released after the required rails become valid.',
11:'Figure 11 illustrates application of an approved privacy profile 241 to local counts 230. A fixed-domain encrypted representation 242 or a permitted support-visible representation 243 is bound to model, context and layout metadata 244.',
12:'Figure 12 illustrates encrypted feature value 1201 and public model weight 1202 entering ciphertext/plaintext multiplication 1203. Product ciphertexts enter encrypted accumulator 1204, initialized from encrypted bias 1205.',
13:'Figure 13 illustrates local secret key 1301, public key/context 1302, local decryption 1303, remote public-key encrypted evaluation 1304, and authorized local result 1305. The secret key remains inside trusted domain 200.',
14:'Figure 14 illustrates a frame lifecycle comprising clear 1401, ordered admission 1402, local state update 1403, valid-frame freezing 1404 and read/encrypt/dispatch 1405. Fault latch 1406 prevents dispatch of an invalid frame.',
15:'Figure 15 illustrates task/privacy constraints 1501 and resource/quality measurements 1502 selecting among an approved encoder/model catalog 1503. Compatibility and range checks 1504 determine admission to a remote, local or deferred route 1505.',
16:'Figure 16 illustrates an optional training embodiment with governed data 1601, candidate encoder 1602, task-utility test 1603, reconstruction/identity attack 1604, held-out acceptance gate 1605, and frozen deployment profile 1606. The fixed reference spiking circuit does not claim to have passed this training process.'}

for start in [1,9]:
    page(f'18. Patent drawing descriptions ({start}-{start+7})')
    for i in range(start,start+8):p(descriptions[i],'small')

page('19. Disclosure coverage and implementation status')
table(['Existing disclosure','Figures / implementation','Status in this revision'],[
['F.1-F.4; J.1: local compression then encryption','Figures 1-5, 11-13; component C01-C04 and datapath C05/C08','Fully specified reference partition and interfaces'],
['F.3.1; J.3/J.9: spatial sparse BFV','Figures 3-5, 11-12; SPATIAL-64-B','Actual hardware logic simulated; native software kernel already exists in source'],
['F.3; F.13: neuromorphic hardware','Figures 6-10; LIF-64-B; U1 circuitry','New concrete circuit design; simulated and placed/routed; not physically built'],
['F.5, F.11: adaptive profiles and routing','Figure 15; model/profile admission contract','Architecture specified; scheduler and live metrics are integration work'],
['F.8, J.10: reconstruction-resistant training','Figure 16','Optional disclosed training architecture; not a claimed property of the fixed ring encoder'],
['F.9-F.10: metadata and trust separation','Figures 11 and 13; explicit DENSE64/SPARSE64','Exposure defined; dense default is a new selected implementation policy'],
['F.12: policy, audit and output','Figures 13-15; frame/job lifecycle','Local acceptance and network contracts specified'],
['F.6-F.7; H: CKKS, TFHE, MPC alternatives','Retained in source specification','Not mixed into the selected BFVrns board/runtime path; separate profiles/circuits required']],[141,168,168])
p('The reference circuit is one embodiment of the existing architecture. Standard LIF dynamics, ordinary power supervisors and conventional FHE operators are not individually asserted to be novel. This engineering document is not a novelty search, an inventorship determination or an allowance opinion.')
p('The companion specification working copy replaces the six old brief drawing descriptions with the coordinated sixteen-figure set and inserts section F.14. Other original specification language is preserved. The original files remain unchanged. The working copy is intended for the inventor and patent professional to review with the final figures.')

rows=[]
for q in parts.values():rows.append([q['ref'],q['value'],q['mpn'] or 'Specified generic',q['package']])
for start in range(0,len(rows),19):
    page(f'20. Bill of materials ({start+1}-{min(start+19,len(rows))})')
    table(['Ref','Value','Part / order specification','Package'],rows[start:start+19],[36,106,188,147])
    p('Electrical ratings, capacitor derating and component-specific notes are in bom.csv. Generic passives are 1% resistors unless otherwise stated, with voltage and thermal ratings chosen for the specified rails. Confirm component availability and footprints during PCB/library release.','small')

page('21. Reference-numeral register')
refs={}
for i,text in descriptions.items():
    for n in re.findall(r'\b[1-9][0-9]{2,3}\b',text):refs.setdefault(n,[]).append(i)
# Every numeral actually printed in a drawing is also extracted independently.
geom=json.loads((BASE/'verification'/'text_geometry.json').read_text())
for g in geom:
    if g['sheet'].startswith('P') and re.fullmatch(r'\d{3,4}',g['text']):
        assert g['text'] in refs,(g['sheet'],g['text'])
table(['Numerals','Meaning / first drawing'],[
['100,110','Acquisition device and digital interface; Figures 1-2'],['200,210-212','Trusted relay, normalization, canonical sample and order validation; Figures 1-3'],['220-224','Neuromorphic circuit, gate, selector, counter and spiking profiles; Figures 1-3'],['230-231','Count memory and frozen-frame readout; Figures 1 and 5'],['240-244','FHE/policy, privacy profile, encrypted representations and binding; Figures 1 and 11'],['250-270','Host, serial link, power and clock; Figure 2'],['300','Remote encrypted inference; Figures 1 and 13'],['401-406','Magnitude and refractory acceptance circuits; Figure 4'],['501-504','Address and saturating count update; Figure 5'],['601-602','Self-input and adjacent-neuron synapses; Figure 6'],['701-705','Neuron arithmetic and state selection; Figure 7'],['801-804','Time advance, decay and refractory state; Figure 8'],['901-905','Serial input, checking, controller and reply; Figure 9'],['1001-1005','Power sequence and configuration reset; Figure 10'],['1201-1205','Homomorphic linear-score arithmetic; Figure 12'],['1301-1305','Key separation and result decryption; Figure 13'],['1401-1406','Frame lifecycle and fault handling; Figure 14'],['1501-1505','Adaptive admission and routing; Figure 15'],['1601-1606','Optional training and deployment gate; Figure 16']],[108,369])
p('Electrical designators U1, R1, C1 and J1 belong to the circuit/BOM namespace. Patent reference numerals are separate. U1 implements 220, 221, 223, 224 and their detailed circuits. M1 implements 210, 240 and 250. U2-U7 implement the power elements in Figure 10.')

page('22. Sources and file guide')
p('Authoritative sources were checked for pin assignments, voltage sequencing, supported device behavior and drawing conventions. The source repository commit for this package is c42d68225934a3bfa46a4bdd7573d035ad907b96. This is a design provenance record, not a statement about legal priority or public-disclosure dates.','small')
for k in ['repo','pi','fpga','board','config','ldo','supervisor','buffer','clock','he','heguide','drawings']:cite(k)
table(['File / folder','Use'],[['svg/','Editable vectors for every patent and circuit sheet'],['cad/','Legacy KiCad import project and cached symbols; import/ ERC not performed here'],['rtl/','Hardware source, Verilog, pin constraints and routed configuration artifacts'],['verification/','Simulation, synthesis, routing, connectivity and artifact review records'],['bom.csv / pin_net_map.csv','Complete physical component and pin tables'],['ENER_specification_with_reference_design.md','Original specification working copy with replaced drawing section and new F.14'],['drawing_descriptions.md','Matching sixteen-figure descriptions and numeral occurrence map']],[211,266])

def footer(c,d):
    c.setStrokeColor(colors.black);c.setLineWidth(.5);c.line(58,46,A4[0]-58,46)
    c.setFont('D',8);c.drawString(58,32,'ENER - COMPLETE REFERENCE DESIGN B - 2026-09-05')
    c.drawRightString(A4[0]-58,32,str(d.page))
doc=SimpleDocTemplate(str(OUT/'ENER_Implementation_Design.pdf'),pagesize=A4,rightMargin=59,leftMargin=59,topMargin=54,bottomMargin=64,title='ENER Complete Implementation Design',author='ENER reference-design working package')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
(BASE/'ENER_Implementation_Design.md').write_text('\n\n'.join(md)+'\n',encoding='utf-8')

brief='## E. Brief Description of Drawings\n\n'+'\n\n'.join(descriptions.values())+'\n\n'
addendum='''### F.14 Concrete Digital Relay and Neuromorphic Circuit Embodiment

In a reference embodiment, an existing neural acquisition device 100 supplies a digital stream through interface 110 to a trusted local host processor 250. The host normalizes channel, timestamp and calibrated integer sample values and performs stable frame ordering 210-212. A programmable logic circuit 220 receives canonical frames over serial link 260 and produces bounded count features in local memory 230. The host applies representation policy 240-244 and encrypts features before transmission to remote evaluator 300. The local host retains the secret key 1301 and decrypts returned scores in circuit 1303 before releasing an authorized local result 1305.

One physical implementation uses a Raspberry Pi 4 Model B host assembly and an iCE40UP5K-SG48 programmable logic device on a dedicated mezzanine. The FPGA core operates at 16 MHz from an external oscillator. The host and FPGA use a mode-0, 1 MHz maximum, eight-byte serial command protocol with sequence echo and CRC admission. Separate core, I/O and configuration supply rails are sequenced using voltage supervisors. The programmable logic is held in configuration reset until the required rails are valid. These named components and rates are illustrative implementation choices and do not restrict the disclosed functional architecture to a particular vendor.

Each feature window spans 50000 microseconds and contains eight equal time bins. Eight spatial units form a four-by-two canonical unit map. A two-bit saturating counter is stored for each time/unit pair, giving 64 feature positions. Index formation 503 concatenates a three-bit time-bin value with a three-bit unit value. A BEGIN command clears all frame-local state. An END command freezes the feature memory only if no frame fault has been latched. Invalid sample ordering, invalid channels or timestamps, serial length/CRC failures and incompatible commands prevent transmission of that frame as valid telemetry.

In a spatial counter profile 223, signed sample values pass through a 17-bit magnitude circuit 402 and comparator 403. A candidate sample is accepted only if its magnitude reaches a configurable threshold, no accepted event for that unit occurred within the preceding 100 microseconds, and the selected count has not reached three. An accepted event increments the corresponding counter and updates timestamp memory 404. Saturated counters do not update the last-accepted timestamp. A channel identifier denotes the selected spatial feature unit and need not identify an individually isolated biological neuron.

In a spiking profile 224, each accepted input event is routed to eight unsigned integrate-and-fire neurons. A concrete synaptic matrix assigns weight 16 from input c to neuron c, weight 4 from input c to neuron (c+1) modulo eight, and weight zero otherwise. Each neuron has a 16-bit potential and a two-bit refractory tick counter. Before processing an event, tick circuit 802 applies each elapsed millisecond update: V becomes V minus (V shifted right by four), and a positive refractory counter decreases by one. For a nonzero synapse and a neuron outside refractory state, adder 703 forms a 17-bit sum of potential and weight. If the sum reaches the threshold, initially 64, selector 705 resets potential to zero, sets the refractory counter to two and increments the time/unit count up to three. Otherwise it stores the sum. All state resets at frame boundaries in this embodiment. Different dynamics, calibrated parameters, connectivity or trained encoders can be provided through separately validated embodiments.

The selected FHE circuit is a public-weight integer linear scorer. For each class k, an encrypted accumulator 1204 is initialized with an encryption of bias b[k], then accumulates ciphertext/plaintext products of encrypted count x[i] and public weight W[k,i]. An example uses BFVrns, plaintext modulus 65537, a depth-one parameter-generation setting, scalar batch size one and a 128-classic security setting. The implementation records and validates the resulting full serialized cryptographic context. A sufficient plaintext-range admission bound is abs(b[k]) + 3 times the sum of absolute weights at most 32768 for every class. This bound addresses modular interpretation; ciphertext correctness and noise margin are separately validated for the actual approved circuit and context.

The default representation encrypts all 64 positions, including zeros. A separately permitted sparse representation discloses an active-position list and encrypts associated values. Exact public support can reveal activity and can determine a binary feature vector. Coarsened, padded or encrypted-position representations require their corresponding model and circuit semantics. Public model, key/context, encoder, calibration, frame and representation identifiers are bound to each job. Returned encrypted scores are accepted only for a fresh outstanding job and decrypted within the trusted local domain. Transport authentication does not itself prove correct computation by a malicious remote evaluator.

The programmable logic described here has been evaluated by simulation and FPGA synthesis/place-and-route software. The detailed component design, a corresponding schematic set and implementation sources are provided as an engineering reference embodiment. These descriptions do not represent an assembled-hardware, trained-model or clinical-performance measurement.

'''
original=(ROOT/'patent'/'ENER_provisional_specification.md').read_text(encoding='utf-8')
updated,n=re.subn(r'## E\. Brief Description of Drawings\n.*?(?=## F\. Detailed Description)',brief,original,flags=re.S)
assert n==1
updated=updated.replace('## G. Example Embodiments',addendum+'## G. Example Embodiments',1)
(BASE/'ENER_specification_with_reference_design.md').write_text(updated,encoding='utf-8')
(BASE/'drawing_descriptions.md').write_text('# Matching patent drawing descriptions - revision B\n\n'+brief+'\n## Reference numeral occurrences\n\n'+'\n'.join(f'- {n}: Figures '+', '.join(map(str,sorted(set(figs)))) for n,figs in sorted(refs.items(),key=lambda kv:int(kv[0])))+'\n\n## Integration note\n\nThese descriptions correspond to the new sixteen-sheet patent set. The companion specification working copy replaces section E and adds F.14. The source specification and previous drawing packages are preserved.\n',encoding='utf-8')
(BASE/'source_manifest.json').write_text(json.dumps({'source_commit':'c42d68225934a3bfa46a4bdd7573d035ad907b96','sources':{k:{'title':v[0],'url':v[1]} for k,v in sources.items()},'new_design_date':'2026-09-05','original_spec_sha256':hashlib.sha256(original.encode()).hexdigest(),'new_sections':['E replaced with sixteen-figure descriptions','F.14 added']},indent=2))
print('Wrote engineering PDF, design Markdown, drawing descriptions and integrated specification working copy.')
