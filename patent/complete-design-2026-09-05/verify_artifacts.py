"""Independent re-read of PDF geometry, exported CAD nets and RTL pad mapping."""
import json,re,hashlib
from pathlib import Path
from collections import defaultdict
import pdfplumber
from pypdf import PdfReader
from PIL import Image,ImageDraw

B=Path(__file__).resolve().parent
R=B.parents[1]
parts=json.loads((B/'components.json').read_text())
expected=json.loads((B/'connectivity.json').read_text())

def verify_cad():
    lib=(B/'cad'/'ENER_Relay-cache.lib').read_text()
    symbols={}
    for block in re.findall(r'^DEF .*?^ENDDEF',lib,re.M|re.S):
        name=block.split()[1]
        pins=[]
        for line in block.splitlines():
            if line.startswith('X '):
                q=line.split();pins.append(dict(num=q[2],x=int(q[3]),y=int(q[4]),unit=int(q[9])))
        symbols[name]=pins
    got=defaultdict(list);ncs=[];seen=set()
    for path in sorted((B/'cad').glob('C??.sch')):
        text=path.read_text();lines=text.splitlines();wires=[];labels={};nc=set()
        for i,line in enumerate(lines):
            if line=='Wire Wire Line':
                a,b,c,d=map(int,lines[i+1].split());wires.append(((a,b),(c,d)))
            if line.startswith('Text GLabel'):
                q=line.split();labels[(int(q[2]),int(q[3]))]=lines[i+1]
            if line.startswith('NoConn'):
                q=line.split();nc.add((int(q[2]),int(q[3])))
        graph=defaultdict(list)
        for a,b in wires:graph[a].append(b);graph[b].append(a)
        for block in re.findall(r'\$Comp\n(.*?)\$EndComp',text,re.S):
            sym,ref=re.search(r'^L (\S+) (\S+)',block,re.M).groups()
            unit=int(re.search(r'^U (\d+)',block,re.M).group(1))
            x,y=map(int,re.search(r'^P (\d+) (\d+)',block,re.M).groups())
            for pin in symbols[sym]:
                if pin['unit']!=unit:continue
                identity=f'{ref}.{pin["num"]}';assert identity not in seen,identity;seen.add(identity)
                pos=(x+pin['x'],y-pin['y']);pending=[pos];visited=set();names=set()
                while pending:
                    here=pending.pop()
                    if here in visited:continue
                    visited.add(here)
                    if here in labels:names.add(labels[here])
                    pending.extend(graph[here])
                target=parts[ref]['pins'][pin['num']]['net']
                if target is None:
                    assert pos in nc and not names,(identity,pos,names)
                    ncs.append(identity)
                else:
                    assert names=={target},(identity,pos,target,names)
                    got[target].append(identity)
    assert {k:sorted(v) for k,v in got.items()}=={k:sorted(v) for k,v in expected.items()}
    return dict(status='PASS',pins=len(seen),intentional_nc=len(ncs),nets=len(got),scope='Independent parser re-read of emitted legacy KiCad symbols, units, wires and global labels; not KiCad ERC.')

def verify_pads():
    constraints=dict(re.findall(r'set_io (\w+) (\d+)',(B/'rtl'/'ener_relay.pcf').read_text()))
    want={'clk':'35','rst':'11','sck':'15','cs_n':'16','mosi':'17','miso':'14','ready':'9','frame_ready':'10','soft_reset':'12'}
    assert constraints==want
    nets={'clk':'CLK16','rst':'GND','sck':'FPGA_SCK','cs_n':'FPGA_CS_N','mosi':'FPGA_MOSI','miso':'FPGA_MISO','ready':'READY','frame_ready':'FRAME_READY','soft_reset':'SOFT_RESET'}
    for port,pin in constraints.items():assert parts['U1']['pins'][pin]['net']==nets[port]
    pnr=json.loads((B/'verification'/'place_route.json').read_text())
    assert all(x['achieved']>=16 and x['constraint']==16 for x in pnr['fmax'].values())
    assert (B/'rtl'/'ener_relay.bin').stat().st_size>50000
    return dict(status='PASS',pad_constraints=constraints,configuration_bytes=(B/'rtl'/'ener_relay.bin').stat().st_size)

def verify_pdfs():
    records=[]
    for name,count in [('ENER_Complete_Patent_Schematics.pdf',16),('ENER_Circuit_Schematics.pdf',8),('ENER_Implementation_Design.pdf',None)]:
        path=R/'output'/'pdf'/name;reader=PdfReader(path)
        if count:assert len(reader.pages)==count
        with pdfplumber.open(path) as pdf:
            titles=[]
            for i,p in enumerate(pdf.pages):
                text=p.extract_text() or '';assert len(text)>10
                for c in p.chars:
                    assert c['x0']>=0 and c['x1']<=p.width+.2 and c['top']>=0 and c['bottom']<=p.height+.2,(name,i,c)
                if name.startswith('ENER_Complete'):
                    assert min(c['size'] for c in p.chars)>=13.99
                    assert min(c['x0'] for c in p.chars)>=70.8,(i,'left margin')
                    assert max(c['x1'] for c in p.chars)<=p.width-42.5,(i,'right margin')
                    assert min(c['top'] for c in p.chars)>=70.8,(i,'top margin')
                    assert max(c['bottom'] for c in p.chars)<=p.height-28.3,(i,'bottom margin')
                    assert not p.images,'Patent figures must be vector'
                    assert f'FIG. {i+1}' in text
                titles.append(text.splitlines()[0])
        records.append(dict(file=name,pages=len(reader.pages),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),page_starts=titles))
    return records

def contacts():
    folder=R/'tmp'/'pdfs'/'ener-complete'
    for prefix in ['patent','circuit','design']:
        pages=sorted(folder.glob(prefix+'-*.png'))
        for start in range(0,len(pages),4):
            ims=[]
            for p in pages[start:start+4]:
                im=Image.open(p).convert('RGB');im.thumbnail((560,770));ims.append((p.name,im))
            sheet=Image.new('RGB',(1160,1620),'#dddddd');d=ImageDraw.Draw(sheet)
            for n,(name,im) in enumerate(ims):
                x=20+(n%2)*580;y=30+(n//2)*810
                d.text((x,y-20),name,fill='black');sheet.paste(im,(x,y))
            sheet.save(folder/f'contact_{prefix}_{start//4+1:02d}.png')

report={'cad_export':verify_cad(),'fpga_pin_match':verify_pads(),'pdfs':verify_pdfs()}
(B/'verification'/'artifact_verification.json').write_text(json.dumps(report,indent=2))
contacts()
print(json.dumps({k:v for k,v in report.items() if k!='pdfs'},indent=2))
for p in report['pdfs']:print(p['file'],p['pages'],'pages')
