"""Behavioral verification of the synthesizable hardware, independent oracle."""
import json, random, time
from pathlib import Path
from amaranth.sim import Simulator
from relay_hdl import EventCore, RelayTop

ROOT = Path(__file__).resolve().parents[1]

def crc8(data):
    crc = 0
    for x in data:
        crc ^= x
        for _ in range(8):
            crc = ((crc << 1) ^ (7 if crc & 128 else 0)) & 255
    return crc

def pack(op=0, arg=0, ts=0, amp=0, seq=0):
    b = bytes([op, arg]) + ts.to_bytes(2, "big") + (amp & 65535).to_bytes(2, "big") + bytes([seq])
    return b + bytes([crc8(b)])

def reference(samples, mode, threshold=50, theta=64):
    counts, v, ref, last = [0]*64, [0]*8, [0]*8, [None]*8
    tick = 0
    for ch, ts, amp in samples:
        if mode:
            while tick < ts // 1000:
                tick += 1
                v = [x-x//16 for x in v]
                ref = [max(0, x-1) for x in ref]
        if abs(amp) < threshold or (last[ch] is not None and ts-last[ch] < 100):
            continue
        b = ts // 6250
        if not mode:
            i = b*8+ch
            if counts[i] < 3:
                counts[i] += 1
                last[ch] = ts
        else:
            last[ch] = ts
            for n in range(8):
                weight = 16 if n == ch else 4 if n == (ch+1)%8 else 0
                if not weight or ref[n]:
                    continue
                total = v[n] + weight
                if total >= theta:
                    v[n], ref[n] = 0, 2
                    counts[b*8+n] = min(3, counts[b*8+n]+1)
                else:
                    v[n] = total
    return counts

def verify_core():
    dut = EventCore()
    sim = Simulator(dut)
    sim.add_clock(1/16e6)
    stats = dict(frames=0, samples=0, count_comparisons=0, negative_cases=0, max_command_cycles=0)
    async def bench(ctx):
        async def cmd(op, arg=0, ts=0, amp=0):
            while ctx.get(dut.busy):
                await ctx.tick()
            for sig, val in [(dut.op,op),(dut.arg,arg),(dut.timestamp,ts),(dut.amplitude,amp),(dut.valid,1)]:
                ctx.set(sig,val)
            await ctx.tick()
            ctx.set(dut.valid,0)
            cycles = 1
            while not ctx.get(dut.reply):
                await ctx.tick()
                cycles += 1
                assert cycles < 200, "Core did not finish command"
            stats['max_command_cycles'] = max(stats['max_command_cycles'], cycles)
            payload = ctx.get(dut.payload)
            await ctx.tick()
            return payload
        rng = random.Random(731)
        fixtures = [[], [(0,0,50),(0,99,90),(0,100,-50),(0,200,-32768),(0,6250,50), (7,49999,90)],
                    [(c,t,90) for t in range(0,50000,1000) for c in range(8)],
                    [(0,0,90),(0,49999,90)]]
        for _ in range(32):
            fixtures.append(sorted([(rng.randrange(8),rng.randrange(50000),rng.choice([-32768,-51,-50,-49,0,49,50,90,32767])) for _ in range(rng.randrange(1,450))],key=lambda s:s[1]))
        repo_fixture=json.loads((ROOT/'verification'/'repository_fixture.json').read_text())
        fixtures.append(repo_fixture['samples'])
        for mode in (0,1):
            for samples in fixtures:
                await cmd(1,mode)
                for ch,ts,amp in samples:
                    await cmd(0x10,ch,ts,amp)
                await cmd(2)
                assert ctx.get(dut.done) == 1
                observed = [await cmd(0x11,i) for i in range(64)]
                expected = reference(samples,mode)
                assert observed == expected, (mode,observed,expected)
                if mode==0 and samples is fixtures[-1]:
                    assert observed==repo_fixture['expected']
                    stats['repository_fixture_match']=True
                stats['frames'] += 1
                stats['samples'] += len(samples)
                stats['count_comparisons'] += 64
        # Deliberately invalid timestamp, channel and ordering must poison frame.
        for samples in [[(0,50000,90)],[(8,0,90)],[(0,100,90),(0,99,90)]]:
            await cmd(1)
            for ch,ts,amp in samples:
                await cmd(0x10,ch,ts,amp)
            await cmd(2)
            assert not ctx.get(dut.done)
            assert ctx.get(dut.errors)&8
            stats['negative_cases'] += 1
        await cmd(1)
        ctx.set(dut.link_fault,1)
        await ctx.tick()
        ctx.set(dut.link_fault,0)
        await cmd(2)
        assert not ctx.get(dut.done)
        assert ctx.get(dut.errors)&1
        stats['negative_cases'] += 1
        await cmd(1)
        await cmd(0x20,amp=20)
        await cmd(2)
        assert not ctx.get(dut.done)
        assert ctx.get(dut.threshold)==50
        stats['negative_cases'] += 1
        await cmd(0x20,amp=100)
        await cmd(1)
        await cmd(0x10,0,0,99)
        await cmd(0x10,0,100,100)
        await cmd(2)
        assert await cmd(0x11,0)==1
        await cmd(1,1)
        await cmd(2)
        assert [await cmd(0x11,i) for i in range(64)]==[0]*64
    sim.add_testbench(bench)
    sim.run()
    return stats

def verify_spi():
    dut = RelayTop()
    sim = Simulator(dut)
    sim.add_clock(1/16e6)
    result = dict(transactions=0, corrupt_packets=0, bit_rate_hz=1000000)
    async def bench(ctx):
        async def clocks(n):
            for _ in range(n):
                await ctx.tick()
        async def transfer(packet, bits=64):
            for _ in range(500):
                if ctx.get(dut.ready): break
                await ctx.tick()
            assert ctx.get(dut.ready)
            ctx.set(dut.cs_n,0)
            await clocks(16)
            read = 0
            value = int.from_bytes(packet,'big')
            for i in range(bits):
                ctx.set(dut.mosi,(value >> (63-i))&1 if i<64 else 0)
                await clocks(8)
                ctx.set(dut.sck,1)
                read=(read<<1)|ctx.get(dut.miso)
                await clocks(8)
                ctx.set(dut.sck,0)
            await clocks(16)
            ctx.set(dut.cs_n,1)
            await clocks(160)
            result['transactions'] += 1
            return read.to_bytes(8,'big')
        ctx.set(dut.cs_n,1)
        await clocks(20)
        await transfer(pack(0,seq=1))
        response = await transfer(pack(1,seq=2))
        assert crc8(response)==0 and response[1:3]==bytes([0,1]) and response[4:6]==bytes([2,1]),response.hex()
        response = await transfer(pack(0x10,0,100,90,3))
        assert crc8(response)==0 and response[1:3]==bytes([1,2])
        await transfer(pack(2,seq=4))
        assert ctx.get(dut.frame_ready)
        await transfer(pack(0x11,0,seq=5))
        response = await transfer(pack(seq=6))
        assert crc8(response)==0 and response[1:3]==bytes([0x11,5]) and response[5]==1,response.hex()
        await transfer(pack(1,seq=7))
        bad=bytearray(pack(0x10,0,100,90,8)); bad[4]^=1
        await transfer(bad)
        result['corrupt_packets']+=1
        await transfer(pack(2,seq=9))
        assert not ctx.get(dut.frame_ready)
        response=await transfer(pack(seq=10))
        assert crc8(response)==0 and response[6]&1
        await transfer(pack(1,seq=11))
        await transfer(pack(0x10,0,100,90,12),bits=63)
        result['corrupt_packets']+=1
        await transfer(pack(2,seq=13))
        assert not ctx.get(dut.frame_ready)
        await transfer(pack(1,seq=14))
        await transfer(pack(0x10,0,100,90,15),bits=65)
        result['corrupt_packets']+=1
        await transfer(pack(2,seq=16))
        assert not ctx.get(dut.frame_ready)
        ctx.set(dut.soft_reset,1)
        await clocks(20)
        assert not ctx.get(dut.frame_ready) and not ctx.get(dut.ready)
        ctx.set(dut.soft_reset,0)
        await clocks(20)
        await transfer(pack(seq=17))
        response=await transfer(pack(seq=18))
        assert crc8(response)==0 and response[4:6]==bytes([2,1]) and response[6]==0
    sim.add_testbench(bench)
    with sim.write_vcd(str(ROOT/'verification'/'spi_waveform.vcd')):
        sim.run()
    return result

if __name__ == '__main__':
    (ROOT/'verification').mkdir(exist_ok=True)
    start=time.time()
    report=dict(core=verify_core(),spi=verify_spi(),status='PASS',scope='Simulation of the actual synthesizable Amaranth logic; no physical hardware test.')
    report['elapsed_seconds']=round(time.time()-start,2)
    (ROOT/'verification'/'logic_verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
