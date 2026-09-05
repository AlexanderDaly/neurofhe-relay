"""ENER reference relay, revision B. Synthesizable Amaranth hardware.

Eight spatial channels, 50 ms frames, eight time bins. The two encoder profiles
share an SPI transport and 64 x 2-bit count store. No FHE secret enters this FPGA.
"""
from amaranth import *
from amaranth.lib.cdc import FFSynchronizer


class EventCore(Elaboratable):
    def __init__(self):
        self.valid = Signal()
        self.op = Signal(8)
        self.arg = Signal(8)
        self.timestamp = Signal(16)
        self.amplitude = Signal(signed(16))
        self.link_fault = Signal()
        self.busy = Signal()
        self.reply = Signal()
        self.payload = Signal(16)
        self.errors = Signal(8)
        self.active = Signal()
        self.done = Signal()
        self.counts = Array(Signal(2, name=f"count_{i}") for i in range(64))
        self.voltage = Array(Signal(16, name=f"v_{i}") for i in range(8))
        self.mode = Signal()
        self.threshold = Signal(16, init=50)
        self.theta = Signal(16, init=64)

    def elaborate(self, platform):
        m = Module()
        last = Array(Signal(16, name=f"last_{i}") for i in range(8))
        seen = Array(Signal(name=f"seen_{i}") for i in range(8))
        refr = Array(Signal(2, name=f"refr_{i}") for i in range(8))
        frame_bad = Signal()
        previous = Signal(16)
        have_previous = Signal()
        clear_index = Signal(6)
        channel = Signal(3)
        time = Signal(16)
        candidate = Signal()
        index = Signal(6)
        neuron = Signal(3)
        next_tick = Signal(16, init=1000)
        bin_number = Signal(3)
        magnitude = Signal(17)
        weight = Signal(5)
        total = Signal(17)
        m.d.comb += [magnitude.eq(Mux(self.amplitude < 0, -self.amplitude.as_signed(), self.amplitude)),
                     bin_number.eq(0), weight.eq(0), total.eq(self.voltage[neuron] + weight)]
        for b in range(1, 8):
            with m.If(self.timestamp >= b * 6250):
                m.d.comb += bin_number.eq(b)
        with m.If(neuron == channel):
            m.d.comb += weight.eq(16)
        with m.Elif(neuron == (channel + 1)[:3]):
            m.d.comb += weight.eq(4)
        m.d.sync += self.reply.eq(0)
        # A transport error poisons this frame even if it occurs while a sample
        # is being processed; no partial or corrupt frame may reach encryption.
        with m.If(self.link_fault):
            m.d.sync += [frame_bad.eq(1), self.done.eq(0), self.errors.eq(self.errors | 1)]
        with m.FSM():
            with m.State("IDLE"):
                m.d.comb += self.busy.eq(0)
                with m.If(self.valid):
                    m.d.sync += self.payload.eq(0)
                    with m.Switch(self.op):
                        with m.Case(0x00):
                            m.d.sync += [self.payload.eq(0x0201), self.reply.eq(1)]
                        with m.Case(0x01):
                            with m.If(self.arg <= 1):
                                m.d.sync += [self.mode.eq(self.arg[0]), self.active.eq(1), self.done.eq(0),
                                             frame_bad.eq(0), self.errors.eq(0), clear_index.eq(0),
                                             previous.eq(0), have_previous.eq(0), next_tick.eq(1000)]
                                for i in range(8):
                                    m.d.sync += [last[i].eq(0), seen[i].eq(0), refr[i].eq(0), self.voltage[i].eq(0)]
                                m.next = "CLEAR"
                            with m.Else():
                                m.d.sync += [self.errors.eq(self.errors | 2), frame_bad.eq(1), self.done.eq(0), self.reply.eq(1)]
                        with m.Case(0x02):
                            with m.If(self.active):
                                m.d.sync += [self.active.eq(0), self.done.eq(~frame_bad & ~self.link_fault), self.reply.eq(1)]
                            with m.Else():
                                m.d.sync += [self.errors.eq(self.errors | 4), self.reply.eq(1)]
                        with m.Case(0x10):
                            with m.If(~self.active | (self.arg >= 8) | (self.timestamp >= 50000) |
                                      (have_previous & (self.timestamp < previous))):
                                m.d.sync += [frame_bad.eq(1), self.done.eq(0), self.errors.eq(self.errors | 8), self.reply.eq(1)]
                            with m.Else():
                                m.d.sync += [channel.eq(self.arg[:3]), time.eq(self.timestamp),
                                             index.eq(Cat(self.arg[:3], bin_number)), candidate.eq(magnitude >= self.threshold),
                                             previous.eq(self.timestamp), have_previous.eq(1)]
                                m.next = "ADVANCE"
                        with m.Case(0x11):
                            with m.If(self.done & (self.arg < 64)):
                                m.d.sync += [self.payload.eq(self.counts[self.arg[:6]]), self.reply.eq(1)]
                            with m.Else():
                                m.d.sync += [self.errors.eq(self.errors | 16), self.reply.eq(1)]
                        with m.Case(0x20, 0x21):
                            with m.If(~self.active & (self.amplitude.as_unsigned() != 0) &
                                      ((self.op == 0x21) | (self.amplitude.as_unsigned() <= 32768))):
                                with m.If(self.op == 0x20):
                                    m.d.sync += self.threshold.eq(self.amplitude.as_unsigned())
                                with m.Else():
                                    m.d.sync += self.theta.eq(self.amplitude.as_unsigned())
                                m.d.sync += [self.done.eq(0), self.reply.eq(1)]
                            with m.Else():
                                m.d.sync += [frame_bad.eq(1), self.done.eq(0), self.errors.eq(self.errors | 32), self.reply.eq(1)]
                        with m.Default():
                            m.d.sync += [frame_bad.eq(1), self.done.eq(0), self.errors.eq(self.errors | 64), self.reply.eq(1)]
            with m.State("CLEAR"):
                m.d.comb += self.busy.eq(1)
                m.d.sync += self.counts[clear_index].eq(0)
                with m.If(clear_index == 63):
                    m.d.sync += self.reply.eq(1)
                    m.next = "IDLE"
                with m.Else():
                    m.d.sync += clear_index.eq(clear_index + 1)
            with m.State("ADVANCE"):
                m.d.comb += self.busy.eq(1)
                with m.If(self.mode & (time >= next_tick)):
                    m.d.sync += next_tick.eq(next_tick + 1000)
                    for i in range(8):
                        m.d.sync += self.voltage[i].eq(self.voltage[i] - (self.voltage[i] >> 4))
                        with m.If(refr[i] != 0):
                            m.d.sync += refr[i].eq(refr[i] - 1)
                with m.Else():
                    m.next = "CHECK"
            with m.State("CHECK"):
                m.d.comb += self.busy.eq(1)
                with m.If(candidate & (~seen[channel] | (time - last[channel] >= 100))):
                    with m.If(self.mode):
                        m.d.sync += [seen[channel].eq(1), last[channel].eq(time), neuron.eq(0)]
                        m.next = "SYNAPSE"
                    with m.Else():
                        with m.If(self.counts[index] < 3):
                            m.d.sync += [self.counts[index].eq(self.counts[index] + 1), seen[channel].eq(1), last[channel].eq(time)]
                        m.d.sync += self.reply.eq(1)
                        m.next = "IDLE"
                with m.Else():
                    m.d.sync += self.reply.eq(1)
                    m.next = "IDLE"
            with m.State("SYNAPSE"):
                m.d.comb += self.busy.eq(1)
                with m.If((weight != 0) & (refr[neuron] == 0)):
                    with m.If(total >= self.theta):
                        m.d.sync += [self.voltage[neuron].eq(0), refr[neuron].eq(2)]
                        with m.If(self.counts[Cat(neuron, index[3:])] < 3):
                            m.d.sync += self.counts[Cat(neuron, index[3:])].eq(self.counts[Cat(neuron, index[3:])] + 1)
                    with m.Else():
                        m.d.sync += self.voltage[neuron].eq(total)
                with m.If(neuron == 7):
                    m.d.sync += self.reply.eq(1)
                    m.next = "IDLE"
                with m.Else():
                    m.d.sync += neuron.eq(neuron + 1)
        return m


class RelayTop(Elaboratable):
    """Mode-0, MSB-first, point-to-point SPI, 64 clocks per chip-select.

    Runtime SCK <= 1 MHz, CS setup/hold >= 1 us. READY must be high before
    asserting CS. MISO returns the previous command's reply (one-job latency).
    Three-stage input synchronizers; all functional logic uses the 16 MHz clock.
    """
    def __init__(self):
        self.sck = Signal()
        self.cs_n = Signal(init=1)
        self.mosi = Signal()
        self.miso = Signal()
        self.ready = Signal()
        self.frame_ready = Signal()
        self.soft_reset = Signal()
        self.core = EventCore()
        self.ports = [self.sck, self.cs_n, self.mosi, self.miso, self.ready, self.frame_ready, self.soft_reset]

    def elaborate(self, platform):
        m = Module()
        soft_reset_sync = Signal()
        m.submodules.reset_sync = FFSynchronizer(self.soft_reset, soft_reset_sync, stages=3)
        m.submodules.core = ResetInserter(soft_reset_sync)(self.core)
        sck, cs, si = Signal(), Signal(init=1), Signal()
        m.submodules.sck_sync = FFSynchronizer(self.sck, sck, stages=3)
        m.submodules.cs_sync = FFSynchronizer(self.cs_n, cs, stages=3, init=1)
        m.submodules.si_sync = FFSynchronizer(self.mosi, si, stages=3)
        old_sck, old_cs = Signal(), Signal(init=1)
        rx, tx, reply_word = Signal(64), Signal(64), Signal(64)
        bit_count = Signal(range(66))
        crc = Signal(8)
        crc_next = Signal(8)
        m.d.comb += crc_next.eq(((crc << 1) ^ Mux(crc[7] ^ si, 7, 0))[:8])
        response_busy = Signal()
        pending = Signal()
        saved_op, saved_arg, saved_seq = Signal(8), Signal(8), Signal(8)
        body, body_shift = Signal(56), Signal(56)
        response_crc = Signal(8)
        response_count = Signal(range(57))
        packet = Signal(64)
        m.d.comb += [packet.eq(rx), self.miso.eq(Mux(cs, 0, tx[63])),
                     self.ready.eq(~self.core.busy & ~response_busy & ~pending & ~soft_reset_sync),
                     self.frame_ready.eq(self.core.done)]
        m.d.sync += [old_sck.eq(sck), old_cs.eq(cs), self.core.valid.eq(0), self.core.link_fault.eq(0)]
        with m.If(old_cs & ~cs):
            m.d.sync += [rx.eq(0), crc.eq(0), bit_count.eq(0), tx.eq(reply_word)]
        with m.If(~cs & ~old_sck & sck):
            m.d.sync += [rx.eq(Cat(si, rx[:63])), crc.eq(crc_next)]
            with m.If(bit_count < 65):
                m.d.sync += bit_count.eq(bit_count + 1)
        with m.If(~cs & old_sck & ~sck & (bit_count != 0)):
            m.d.sync += tx.eq(tx << 1)
        with m.If(~old_cs & cs):
            with m.If((bit_count == 64) & (crc == 0) & self.ready):
                m.d.sync += [self.core.op.eq(packet[56:64]), self.core.arg.eq(packet[48:56]),
                             self.core.timestamp.eq(packet[32:48]), self.core.amplitude.eq(packet[16:32]),
                             saved_op.eq(packet[56:64]), saved_arg.eq(packet[48:56]), saved_seq.eq(packet[8:16]),
                             self.core.valid.eq(1), pending.eq(1)]
            with m.Else():
                m.d.sync += self.core.link_fault.eq(1)
        with m.If(self.core.reply):
            # [status, echoed opcode, sequence, argument, payload_hi, payload_lo, errors]
            new_body = Cat(self.core.errors, self.core.payload, saved_arg, saved_seq, saved_op,
                           Cat(self.core.active, self.core.done, Const(0, 6)))
            m.d.sync += [body.eq(new_body), body_shift.eq(new_body), response_busy.eq(1),
                         response_crc.eq(0), response_count.eq(0), pending.eq(0)]
        with m.Elif(response_busy):
            m.d.sync += [response_crc.eq(((response_crc << 1) ^ Mux(response_crc[7] ^ body_shift[55], 7, 0))[:8]),
                         body_shift.eq(body_shift << 1), response_count.eq(response_count + 1)]
            with m.If(response_count == 56):
                m.d.sync += [reply_word.eq(Cat(response_crc, body)), response_busy.eq(0)]
        with m.If(soft_reset_sync):
            m.d.sync += [pending.eq(0), response_busy.eq(0), reply_word.eq(0), bit_count.eq(0)]
        return m


if __name__ == "__main__":
    from pathlib import Path
    from amaranth.back import rtlil
    p = Path(__file__).resolve().parent
    top = RelayTop()
    (p / "relay.il").write_text(rtlil.convert(top, name="ener_relay", ports=top.ports), encoding="utf-8", newline="\n")
    print("Generated relay.il")
