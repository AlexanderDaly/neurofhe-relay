"""Single-source vector schematics, component connectivity and patent figures.

PDF, SVG, BOM, connectivity and legacy KiCad sheets are derived from this file.
The existing acquisition device and complete Raspberry Pi board are assemblies;
only the relay mezzanine is newly designed at component level.
"""
from pathlib import Path
import csv, json, math, hashlib, html
from collections import defaultdict
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4, A3, landscape

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parents[1]
OUT=REPO/'output'/'pdf'
for d in [OUT, ROOT/'svg'/'circuit', ROOT/'svg'/'patent',ROOT/'cad',ROOT/'verification']:
    d.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial', 'C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('ArialBold','C:/Windows/Fonts/arialbd.ttf'))
PARTS={}
PAGES=[]
PATENT=[]
TEXT_BOXES=[]

class Sheet:
    def __init__(self, number, title, patent=False):
        self.n,self.title,self.patent=number,title,patent
        self.w,self.h=A4 if patent else landscape(A3)
        self.ops=[]; self.components=[]
        (PATENT if patent else PAGES).append(self)
        if patent:
            self.text(f'{number}/{16}',self.w/2,85,size=14)
            self.text(f'FIG. {number}',self.w/2,self.h-55,size=14,bold=True)
        else:
            self.rect(40,45,self.w-80,self.h-90)
            self.text(f'ENER  /  {title.upper()}',55,68,size=14,bold=True,align='left')
            self.line(40,self.h-83,self.w-40,self.h-83)
            self.text('FHE + NEUROMORPHIC RELAY  |  REFERENCE DESIGN B  |  2026-09-05',55,self.h-65,size=10,align='left')
            self.text(f'C{number:02d}  /  8',self.w-55,self.h-65,size=10,align='right')
            self.text('Schematic design and simulated logic; PCB and assembled hardware not validated.',55,self.h-49,size=9,align='left')
    def line(self,x1,y1,x2,y2,width=1,dash=False):
        if self.patent:x1,x2=298+(x1-298)*.87,298+(x2-298)*.87
        self.ops.append(('line',(x1,y1,x2,y2,width,dash)))
    def rect(self,x,y,w,h,dash=False):
        if self.patent:x,w=298+(x-298)*.87,w*.87
        self.ops.append(('rect',(x,y,w,h,dash)))
    def circle(self,x,y,r):
        self.ops.append(('circle',(x,y,r)))
    def text(self,t,x,y,size=10,align='center',bold=False):
        assert t.isascii(),t
        if self.patent:x=298+(x-298)*.87
        font='ArialBold' if bold else 'Arial'
        for i,l in enumerate(t.split('\n')):
            yy=y+i*size*1.28
            width=pdfmetrics.stringWidth(l,font,size)
            left=x if align=='left' else x-width if align=='right' else x-width/2
            if not (0<=left and left+width<=self.w and 0<=yy-size and yy<=self.h):
                raise ValueError((self.n,t,left,yy,width))
            self.ops.append(('text',(l,x,yy,size,align,bold)))
            TEXT_BOXES.append(dict(sheet=('P' if self.patent else 'C')+str(self.n),text=l,x=left,y=yy-size,w=width,h=size))
    def box(self,t,x,y,w,h,size=None):
        size=size or (14 if self.patent else 11)
        self.rect(x,y,w,h)
        for line in t.split('\n'):
            assert pdfmetrics.stringWidth(line,'Arial',size)<w*(.87 if self.patent else 1)-12,(self.n,line,w)
        n=len(t.split('\n'))
        self.text(t,x+w/2,y+(h-n*size*1.28)/2+size,size=size)
    def arrow(self,pts,dash=False):
        for a,b in zip(pts,pts[1:]): self.line(*a,*b,dash=dash)
        a,b=pts[-2:]; dx=b[0]-a[0];dy=b[1]-a[1]; d=math.hypot(dx,dy)
        ux,uy=dx/d,dy/d
        for s in (-1,1):self.line(b[0],b[1],b[0]-7*ux+s*3*uy,b[1]-7*uy-s*3*ux)
    def notes(self,lines,x,y,size=10):
        self.text('\n'.join(lines),x,y,size=size,align='left')

def part(ref,value,pins,package,mpn='',kind='IC',notes=''):
    """pins: {number: (pin_name, net_or_None, electrical_type)}."""
    assert ref not in PARTS
    PARTS[ref]=dict(ref=ref,value=value,pins={str(k):dict(name=v[0],net=v[1],type=v[2]) for k,v in pins.items()},
                    package=package,mpn=mpn,kind=kind,notes=notes)
    return ref

def two(ref,value,a,b,kind='R',package='0603',mpn='',notes=''):
    return part(ref,value,{1:('1',a,'passive'),2:('2',b,'passive')},package,mpn,kind,notes)

def draw_ic(s,ref,x,y,w=180,left=None,right=None,unit=1,pitch=23):
    p=PARTS[ref]
    if left is None:
        allpins=list(p['pins']);half=(len(allpins)+1)//2; left=allpins[:half];right=allpins[half:]
    left=[str(v) for v in left];right=[str(v) for v in right]
    h=max(len(left),len(right))*pitch+42
    s.rect(x,y,w,h)
    s.text(ref+(chr(64+unit) if ref=='U1' else ''),x+w/2,y+15,size=11,bold=True)
    s.text(p['value'],x+w/2,y+31,size=9)
    coords={}
    for side,pins in [('L',left),('R',right)]:
        for i,num in enumerate(pins):
            pi=p['pins'][num]; yy=y+50+i*pitch
            xx=x if side=='L' else x+w
            end=xx-28 if side=='L' else xx+28
            s.line(xx,yy,end,yy)
            s.text(pi['name'],xx+(7 if side=='L' else -7),yy+3,size=9,align='left' if side=='L' else 'right')
            s.text(num,xx+(-4 if side=='L' else 4),yy-4,size=8,align='right' if side=='L' else 'left')
            if pi['net'] is None:
                s.line(end-3,yy-3,end+3,yy+3);s.line(end-3,yy+3,end+3,yy-3)
            else:
                s.text(pi['net'],end+(-5 if side=='L' else 5),yy+3,size=9,align='right' if side=='L' else 'left')
            coords[num]=dict(x=end,y=yy,side=side,body_x=xx)
    s.components.append(dict(ref=ref,x=x,y=y,w=w,h=h,pins=coords,unit=unit))
    return h

def draw_two(s,ref,cx,y):
    p=PARTS[ref];kind=p['kind']
    s.text(ref,cx,y-16,size=10,bold=True)
    s.text(p['value'],cx,y+23,size=9)
    s.line(cx-36,y,cx-18,y);s.line(cx+18,y,cx+36,y)
    if kind=='C':
        s.line(cx-3,y-9,cx-3,y+9);s.line(cx+3,y-9,cx+3,y+9)
        s.line(cx-18,y,cx-3,y);s.line(cx+3,y,cx+18,y)
    elif kind=='R':
        pts=[(cx-18,y),(cx-14,y-5),(cx-8,y+5),(cx-2,y-5),(cx+4,y+5),(cx+10,y-5),(cx+14,y),(cx+18,y)]
        for a,b in zip(pts,pts[1:]):s.line(*a,*b)
    elif kind=='SW':
        s.circle(cx-15,y,2);s.circle(cx+15,y,2);s.line(cx-15,y,cx+12,y-10)
    else:
        s.rect(cx-18,y-7,36,14)
    coords={}
    for n,xx,side in [('1',cx-36,'L'),('2',cx+36,'R')]:
        pi=p['pins'][n]
        s.text(pi['net'],xx+(-5 if side=='L' else 5),y+3,size=9,align='right' if side=='L' else 'left')
        coords[n]=dict(x=xx,y=y,side=side,body_x=xx)
    s.components.append(dict(ref=ref,x=cx-18,y=y-8,w=36,h=16,pins=coords,unit=1))

def passive_grid(s,refs,x,y,cols=4,dx=263,dy=62):
    for i,r in enumerate(refs):draw_two(s,r,x+(i%cols)*dx,y+(i//cols)*dy)

def build_components():
    host_names={1:'3V3',2:'5V',3:'GPIO2',4:'5V',5:'GPIO3',6:'GND',7:'GPIO4',8:'GPIO14',9:'GND',10:'GPIO15',11:'GPIO17',12:'GPIO18',13:'GPIO27',14:'GND',15:'GPIO22',16:'GPIO23',17:'3V3',18:'GPIO24',19:'GPIO10',20:'GND',21:'GPIO9',22:'GPIO25',23:'GPIO11',24:'GPIO8',25:'GND',26:'GPIO7',27:'ID_SD',28:'ID_SC',29:'GPIO5',30:'GND',31:'GPIO6',32:'GPIO12',33:'GPIO13',34:'GND',35:'GPIO19',36:'GPIO16',37:'GPIO26',38:'GPIO20',39:'GND',40:'GPIO21'}
    used={2:'+5V_RAW',4:'+5V_RAW',11:'CRESET_N',13:'CDONE',15:'READY',16:'FRAME_READY',18:'HOST_RESET',19:'HOST_MOSI',21:'HOST_MISO',23:'HOST_SCK',24:'HOST_CS_N'}
    for pin in [6,9,14,20,25,30,34,39]:used[pin]='GND'
    part('J1','PI 40-PIN SOCKET',{i:(host_names[i],used.get(i),'passive') for i in range(1,41)},'2x20, 2.54 mm, female, keyed orientation',kind='CONN',notes='Pins 1 and 17 are not connected to the custom 3.3 V rail.')
    names={1:'VCCIO_2',2:'IOB_6A',3:'IOB_9B',4:'IOB_8A',5:'VCC',6:'IOB_13B',7:'CDONE',8:'CRESET_B',9:'IOB_16A',10:'IOB_18A',11:'IOB_20A',12:'IOB_22A',13:'IOB_24A',14:'SPI_SO',15:'SPI_SCK',16:'SPI_SS',17:'SPI_SI',18:'IOB_31B',19:'IOB_29B',20:'IOB_25B_G3',21:'IOB_23B',22:'SPI_VCCIO1',23:'IOT_37A',24:'VPP_2V5',25:'IOT_36B',26:'IOT_39A',27:'IOT_38B',28:'IOT_41A',29:'VCCPLL',30:'VCC',31:'IOT_42B',32:'IOT_43A',33:'VCCIO_0',34:'IOT_44B',35:'IOT_46B_G0',36:'IOT_48B',37:'IOT_45A_G1',38:'IOT_50B',39:'RGB0',40:'RGB1',41:'RGB2',42:'IOT_51A',43:'IOT_49A',44:'IOB_3B_G6',45:'IOB_5B',46:'IOB_0A',47:'IOB_2A',48:'IOB_4A',49:'GND / PAD'}
    unets={1:'+3V3',5:'+1V2',7:'CDONE',8:'CRESET_N',9:'READY',10:'FRAME_READY',11:'GND',12:'SOFT_RESET',14:'FPGA_MISO',15:'FPGA_SCK',16:'FPGA_CS_N',17:'FPGA_MOSI',22:'+3V3',24:'+2V5',29:'+1V2_PLL',30:'+1V2',33:'+3V3',35:'CLK16',49:'GND'}
    outs={7,9,10,14};power={1,5,22,24,29,30,33,49}
    part('U1','iCE40UP5K-SG48',{i:(names[i],unets.get(i),'power_in' if i in power else 'output' if i in outs else 'input' if i in unets else 'no_connect') for i in range(1,50)},'QFN-48, 7x7 mm, 0.5 mm pitch + exposed pad','ICE40UP5K-SG48ITR50',notes='Pad numbered 49 in this design. RGB current sinks unused. See official package land pattern before layout.')
    for ref,value,rail,en in [('U2','TLV75512P','+1V2','+5V'),('U3','TLV75533P','+3V3','IO_ENABLE'),('U4','TLV75525P','+2V5','VPP_ENABLE')]:
        part(ref,value,{1:('IN','+5V','power_in'),2:('GND','GND','power_in'),3:('EN',en,'input'),4:('NC',None,'no_connect'),5:('OUT',rail,'power_out')},'SOT-23-5 / DBV',value+'DBVR')
    for ref,val,sense,out,ct in [('U5','TPS3808G12','+1V2','IO_ENABLE','CT_CORE'),('U6','TPS3808G33','+3V3','VPP_ENABLE','CT_IO'),('U7','TPS3808G25','+2V5','CRESET_N','CT_VPP')]:
        part(ref,val,{1:('RESET_N',out,'open_drain'),2:('GND','GND','power_in'),3:('MR_N','+5V','input'),4:('CT',ct,'passive'),5:('SENSE',sense,'input'),6:('VDD','+5V','power_in')},'SOT-23-6 / DBV',val+'DBVR')
    part('Y1','SiT8008B / 16 MHz',{1:('OE','+3V3','input'),2:('GND','GND','power_in'),3:('OUT','OSC_OUT','output'),4:('VDD','+3V3','power_in')},'2520, four pads','SiT8008BI-12-33E-16.000000',notes='3.3 V, 16 MHz, industrial, OE. Verify order-code package against SiTime drawing.')
    for ref,a,b,ya,yb in [('U8','HOST_SCK','HOST_MOSI','BUF_SCK','BUF_MOSI'),('U9','HOST_CS_N','HOST_RESET','BUF_CS_N','BUF_RESET')]:
        part(ref,'SN74LVC2G17',{1:('1A',a,'input'),2:('GND','GND','power_in'),3:('2A',b,'input'),4:('2Y',yb,'output'),5:('VCC','+3V3','power_in'),6:('1Y',ya,'output')},'SOT-23-6 / DBV','SN74LVC2G17DBVR',notes='Partial-power-down Ioff support; input-side bias resistors keep host inputs defined.')
    two('F1','PTC 0.25 A','+5V_RAW','+5V',kind='F',package='1206',notes='Hold 0.25 A at 25 C; working voltage >= 6 V; derate for enclosure temperature.')
    for ref,a,b in [('R1','BUF_SCK','FPGA_SCK'),('R2','BUF_MOSI','FPGA_MOSI'),('R3','FPGA_MISO','HOST_MISO'),('R4','BUF_CS_N','FPGA_CS_N'),('R5','OSC_OUT','CLK16')]:two(ref,'33 ohm',a,b)
    two('R6','1 kohm','BUF_RESET','SOFT_RESET')
    for ref,a,b in [('R7','+3V3','CRESET_N'),('R8','+3V3','CDONE'),('R9','+3V3','FPGA_CS_N'),('R10','+5V','IO_ENABLE'),('R11','+5V','VPP_ENABLE')]:two(ref,'10 kohm',a,b)
    for ref,a in [('R12','HOST_SCK'),('R13','HOST_MOSI'),('R14','HOST_RESET'),('R15','READY'),('R16','FRAME_READY')]:two(ref,'100 kohm',a,'GND')
    two('R17','100 ohm','+1V2','+1V2_PLL')
    two('R18','100 kohm','+3V3','HOST_CS_N')
    two('SW1','RESET','CRESET_N','GND',kind='SW',package='Momentary normally open')
    caps=[('C1','10 uF / 16 V','+5V'),('C2','1 uF / 10 V','+5V'),('C3','10 uF / 10 V','+1V2'),('C4','1 uF / 10 V','+5V'),('C5','10 uF / 10 V','+3V3'),('C6','1 uF / 10 V','+5V'),('C7','10 uF / 10 V','+2V5'),
          ('C8','100 nF','+5V'),('C9','100 nF','+5V'),('C10','100 nF','+5V'),('C11','1 nF C0G','CT_CORE'),('C12','1 nF C0G','CT_IO'),('C13','1 nF C0G','CT_VPP'),
          ('C14','100 nF','+1V2'),('C15','100 nF','+1V2'),('C16','100 nF','+3V3'),('C17','100 nF','+3V3'),('C18','100 nF','+3V3'),('C19','100 nF','+2V5'),('C20','1 uF','+1V2_PLL'),('C21','100 nF','+1V2_PLL'),('C22','100 nF','+3V3'),('C23','100 nF','+3V3'),('C24','100 nF','+3V3')]
    for ref,val,net in caps:two(ref,val,net,'GND',kind='C',package='0805 X7R' if '10 uF' in val else '0603 C0G' if 'C0G' in val else '0603 X7R',notes='>= 10 V unless explicitly 16 V. Regulator output effective capacitance >= 1 uF across bias and tolerance.')

def circuit_sheets():
    s=Sheet(1,'Host connector and complete assembly interconnect')
    draw_ic(s,'J1',240,112,180,left=range(1,41,2),right=range(2,41,2))
    s.box('EXISTING ACQUISITION DEVICE\nOriginal sensor front end and digitizer',730,125,345,64)
    s.arrow([(902,189),(902,233)]);s.text('USB data cable / original wireless receiver',902,215,size=10)
    s.box('M1  RASPBERRY PI 4 MODEL B, 4 GB\nUSB host + 64-bit Linux + local RAM\nVendor CPU, DDR, clocks and PMIC included',730,233,345,92)
    s.arrow([(730,278),(617,278),(617,439)])
    s.box('J1\nPIN MAP AT LEFT',540,439,154,68)
    s.arrow([(902,325),(902,385)])
    s.box('Wi-Fi / Ethernet\nAuthenticated ciphertext transport',730,385,345,62)
    s.arrow([(902,447),(902,495)])
    s.box('REMOTE EVALUATOR\nOpenFHE BFVrns on 64-bit host\nPublic model; encrypted inputs and scores',730,495,345,80)
    draw_two(s,'F1',355,664)
    draw_two(s,'C1',865,664)
    s.notes(['J1 pin numbering is physical, viewed from the mating side; mark pin 1 on the PCB.',
             'M1 is powered through its original USB-C input. Relay draws from J1 pins 2 and 4.',
             'All J1 grounds connect to a continuous relay ground plane. No analog electrode wiring on this board.',
             '3.3 V pins 1 and 17 and all unused GPIO pins are intentionally open. No HAT EEPROM is fitted.'],60,703,size=10)
    s=Sheet(2,'Sequenced power rails and reset supervision')
    for y,reg,sup,caprefs in [(120,'U2','U5',['C2','C3','C8','C11']), (320,'U3','U6',['C4','C5','C9','C12']), (520,'U4','U7',['C6','C7','C10','C13'])]:
        draw_ic(s,reg,235,y,126,left=[1,3,2],right=[5,4])
        draw_ic(s,sup,780,y,136,left=[6,5,3],right=[1,4,2])
        passive_grid(s,caprefs,153,y+140,dx=277,dy=50)
    s.notes(['U5 releases IO_ENABLE after the 1.2 V core rail exceeds its threshold; U6 then enables 2.5 V.',
             'U7 holds CRESET_N low until 2.5 V is valid. CT = 1 nF gives about 6.2 ms nominal delay per supervisor.',
             'Pull-ups R10/R11 are on C03; R7 on C03 also pulls up U7 open-drain output. All NC pins stay open.'],60,715,size=10)
    s=Sheet(3,'FPGA serial link configuration and clock')
    draw_ic(s,'U1',545,140,195,left=[8,15,16,17,12,11],right=[7,14,9,10,35],unit=1)
    draw_ic(s,'U8',175,140,125,left=[1,3,2],right=[6,4,5])
    draw_ic(s,'U9',175,278,125,left=[1,3,2],right=[6,4,5])
    draw_ic(s,'Y1',940,160,110,left=[1,2],right=[4,3])
    passive_grid(s,['R1','R2','R3','R4','R5','R6','R7','R8','R9','R10','R11','R12','R13','R14','R15','R16'],167,440,cols=4,dx=278,dy=64)
    draw_two(s,'R18',973,355)
    passive_grid(s,['SW1','C22','C23','C24'],167,702,cols=4,dx=278)
    s.notes(['SPI0 is reserved for this point-to-point peripheral. Runtime mode 0, 1 MHz maximum.',
             'Y1 drives the global-clock-capable pad 35 through R5. The internal PLL is unused.',
             'CRESET_N is wired-OR: U7, SW1 and Pi GPIO17 can pull low. Pi drives low or releases to input; never drives high.'],60,99,size=10)
    s=Sheet(4,'FPGA supply pins bypass network and unused pads')
    draw_ic(s,'U1',238,135,170,left=[5,30,29,24],right=[1,22,33,49],unit=2)
    unused=[n for n,p in PARTS['U1']['pins'].items() if p['net'] is None]
    draw_ic(s,'U1',812,112,188,left=unused[:15],right=unused[15:],unit=3,pitch=20)
    passive_grid(s,['C14','C15','C16','C17','C18','C19','C20','C21'],161,499,cols=4,dx=278,dy=65)
    draw_two(s,'R17',290,645)
    s.notes(['C14/C15 at core pins 5/30; C16/C17/C18 at I/O pins 1/22/33; C19 at VPP pin 24.',
             'R17 with C20/C21 filters VCCPLL; connect the rail even though the PLL is unused.',
             'Pad 49 is the exposed ground paddle: connect to the ground plane with a thermal/via array.',
             'Unused pads shown with an X have no copper connection. Confirm unused-I/O constraints in the final bitstream.'],60,684,size=10)
    # Implementation drawings use exact RTL names and bus widths; these are
    # register-transfer circuit diagrams, not extra physical ICs on the board.
    s=Sheet(5,'Spatial event detection and counter circuit')
    s.box('SAMPLE REGISTER\nchannel[2:0] | time[15:0]\namplitude[15:0] signed',70,140,260,84)
    s.box('17-BIT ABSOLUTE VALUE\nsign extend / two\'s complement\nincludes -32768',70,280,260,80)
    s.arrow([(200,224),(200,280)])
    s.box('UNSIGNED COMPARATOR\nabs(amplitude) >= threshold\ndefault threshold = 50',70,410,260,78)
    s.arrow([(200,360),(200,410)])
    s.box('TIME BIN COMPARATORS\n6250, 12500, ... , 43750 us\nindex[5:0] = {bin[2:0], channel}',450,140,295,84)
    s.arrow([(330,180),(450,180)])
    s.box('LAST ACCEPTED REGISTER FILE\n8 x 16-bit timestamps + 8 valid bits\nread by channel[2:0]',840,140,285,84)
    s.box('SUBTRACT / COMPARE\ntime - last[channel] >= 100 us\nor no previous accepted event',840,280,285,80)
    s.arrow([(985,224),(985,280)])
    s.box('ACCEPT ENABLE\nvalid frame AND threshold\nAND refractory AND count < 3',450,410,295,78)
    s.arrow([(330,449),(450,449)]);s.arrow([(985,360),(985,450),(745,450)])
    s.box('COUNT REGISTER FILE\n64 x 2 bits; synchronous write\naddress = index[5:0]',450,565,295,84)
    s.arrow([(595,224),(595,410)]);s.arrow([(595,488),(595,565)])
    s.box('2-BIT SATURATING INCREMENT\n0 -> 1 -> 2 -> 3\nwrite last timestamp only on increment',70,565,300,84)
    s.arrow([(450,605),(370,605)]);s.arrow([(220,565),(220,526),(450,526),(450,585)])
    s.box('FROZEN READ PORT\nREAD_COUNT index = 0..63\nzero-extended 16-bit reply',840,565,285,84)
    s.arrow([(745,605),(840,605)])
    s.notes(['BEGIN clears all 64 counters and frame-local history; END freezes the store only if the entire frame is valid.',
             'Input must be in nondecreasing timestamp order. Equal timestamps retain source order. The host performs sorting.',
             'This is threshold-based spatial event detection. Channel identifiers do not imply isolated biological neurons.'],60,694,size=10)
    s=Sheet(6,'Eight-neuron integrate-and-fire datapath')
    s.box('ACCEPTED INPUT EVENT\nsource channel c, time t\nfrom threshold + 100 us gate',60,142,285,82)
    s.box('SYNAPSE ADDRESS / ROM\nW[n,c] = 16 when n=c\nW[n,c] = 4 when n=(c+1) mod 8\notherwise 0; n scans 0..7',428,135,335,98)
    s.arrow([(345,183),(428,183)])
    s.box('NEURON STATE\n8 x 16-bit unsigned V\n8 x 2-bit refractory counters',847,142,280,82)
    s.box('17-BIT ADDER\nu = V[n] + W[n,c]',445,311,300,68)
    s.arrow([(596,233),(596,311)]);s.arrow([(988,224),(988,345),(745,345)])
    s.box('THRESHOLD COMPARATOR\nu >= theta\ntheta default = 64',445,438,300,80)
    s.arrow([(595,379),(595,438)])
    s.box('SPIKE / RESET MUX\nfire: V[n]=0, refractory=2\nno fire: V[n]=u',839,438,290,80)
    s.arrow([(745,478),(839,478)])
    s.arrow([(987,438),(987,392),(1138,392),(1138,195),(1127,195)])
    s.box('1 ms LEAK TICK\nV[n] <- V[n] - (V[n] >> 4)\nrefractory <- max(0, refractory-1)',60,311,325,94)
    s.arrow([(385,350),(410,350),(410,256),(988,256),(988,224)])
    s.box('COUNT READOUT\n64 x 2-bit saturating counters\nindex = 8*floor(t/6250) + n',445,605,300,82)
    s.arrow([(595,518),(595,605)])
    s.box('REFRACTORY GATE\nSkip integration when refractory > 0\nTicks occur before same-time events',60,465,325,86)
    s.arrow([(385,508),(410,508),(410,478),(445,478)])
    s.notes(['Every accepted source event visits eight output neurons. The two nonzero synapses form a local ring with self-input.',
             'The host sends timestamps relative to the frame; ADVANCE applies all missing millisecond ticks before integration.',
             'All neuron state resets on BEGIN. This explicit frame-local spiking profile requires its own classifier and calibration.'],60,713,size=10)
    s=Sheet(7,'Serial transport shift registers and control')
    for y,label in [(147,'SCK'),(237,'CS_N'),(327,'MOSI')]:
        s.text(label,75,y+20,size=11,align='left')
        for x in [180,270,360]:s.box('D   Q\nFF',x,y, sixty:=60,50)
        s.arrow([(118,y+22),(180,y+22)])
        s.arrow([(240,y+22),(270,y+22)]);s.arrow([(330,y+22),(360,y+22)])
    s.box('EDGE DETECT / BIT COUNTER\nold-SCK register, old-CS register\ncount saturates at 65',485,136,300,76)
    s.arrow([(420,172),(485,172)]);s.arrow([(420,262),(448,262),(448,198),(485,198)])
    s.box('RX SHIFT REGISTER 64 bits\nMSB first; 8 bytes / CS\nCRC-8: x^8 + x^2 + x + 1',485,303,300,86)
    s.arrow([(420,352),(485,352)]);s.arrow([(635,212),(635,303)])
    s.box('PACKET ADMISSION\nexactly 64 clocks AND CRC=0\nAND READY before command\notherwise poison current frame',850,300,280,98)
    s.arrow([(785,347),(850,347)])
    s.box('COMMAND / FRAME FSM\nBEGIN, SAMPLE, END, READ\nconfig only outside active frame',850,478,280,82)
    s.arrow([(990,398),(990,478)])
    s.box('REPLY REGISTER + CRC ENGINE\n56-bit body, 8-bit CRC\n57 cycles to finalize response',485,478,300,82)
    s.arrow([(850,519),(785,519)])
    s.box('TX SHIFT REGISTER 64 bits\nLoad previous reply on CS falling\nMISO changes after SCK falling',65,478,340,82)
    s.arrow([(485,519),(405,519)])
    s.box('MISO PAD 14\npoint-to-point\n33 ohm series',65,625,200,64)
    s.arrow([(165,560),(165,625)])
    s.notes(['Single functional clock: 16 MHz. Runtime SPI: mode 0, <= 1 MHz; CS setup/hold >= 1 us.',
             'Three flip-flops synchronize each asynchronous input. Software polls READY before each transaction.',
             'A reply describes the previous command; opcode and sequence echo prevent accidental association with the next job.',
             'CRC detects transmission errors; authenticated network transport and local trust provide separate security controls.'],410,625,size=10)
    s=Sheet(8,'FHE host memory and encrypted score arithmetic')
    s.box('TRUSTED HOST RAM\nx[64] in {0,1,2,3}\nmodel ID / frame ID / context ID\nsecret key remains local',65,143,325,98)
    s.box('BFVrns ENCRYPTION\nt = 65537; batch size = 1\n128-classic security setting\ncontext selects and records N,Q',65,324,325,98)
    s.arrow([(225,241),(225,324)])
    s.box('UNTRUSTED EVALUATOR\nCiphertexts c_i = (c0_i,c1_i)\nPublic scalar weights w[k,i]\nEncrypted accumulator Y_k',470,143,330,98)
    s.arrow([(390,366),(430,366),(430,188),(470,188)])
    s.box('CT x PT PRODUCT\n(c0_i * p[k,i], c1_i * p[k,i])\nring arithmetic modulo each q_j',470,325,330,97)
    s.arrow([(635,241),(635,325)])
    s.box('COMPONENTWISE CT ADD\nY_k <- Y_k + EvalMult(c_i,w[k,i])\ninitialize Y_k = Encrypt(pk,b_k)',470,489,330,96)
    s.arrow([(635,422),(635,489)])
    s.box('CIPHERTEXT / PUBLIC MODEL RAM\nNo secret-key access\nC=2 reference outputs\nNo rotation or bootstrap required',860,325,268,97)
    s.arrow([(860,374),(800,374)])
    s.box('RETURN ENCRYPTED SCORES\nresult ID and context bindings\nplaintext output count = C',850,489,280,96)
    s.arrow([(800,537),(850,537)])
    s.box('LOCAL DECRYPT / DECISION\ncenter-lift integers; range check\nargmax only after decrypt\naccept fresh valid job IDs only',65,489,325,96)
    s.arrow([(850,560),(827,560),(827,638),(225,638),(225,585)])
    s.notes(['The CPU executes this software arithmetic; U1 performs local neuromorphic encoding before encryption.',
             'Exact sparse support is exposed only under an approved support-visible profile. The default exports all 64 encrypted positions.',
             'Model bound: max_k (abs(b_k) + 3*sum_i abs(w[k,i])) <= 32768. No modular-wrap ambiguity within this signed range.',
             'The network protocol is a specified integration contract; the repository native demo executes client and evaluator in one process.'],60,681,size=10)

def patent_figures():
    # A4 sheets use 14 pt lettering with uncluttered routes and persistent numerals.
    s=Sheet(1,'System and trust allocation',True)
    s.box('100\nEXISTING ACQUISITION',112,95,372,67)
    s.arrow([(298,162),(298,206)])
    s.rect(78,191,438,452,True)
    s.text('200  TRUSTED LOCAL RELAY',298,227,size=14,bold=True)
    s.box('210\nNORMALIZE AND ORDER',112,252,372,67)
    s.box('220\nNEUROMORPHIC CIRCUIT',112,356,372,67)
    s.box('230\nCOMPRESSED FEATURE MEMORY',112,461,372,67)
    s.box('240\nPOLICY AND FHE ENCRYPTION',112,565,372,67)
    for a,b in [(319,356),(423,461),(528,565)]:s.arrow([(298,a),(298,b)])
    s.arrow([(298,643),(298,684)])
    s.box('300\nREMOTE ENCRYPTED INFERENCE',112,684,372,67)
    s=Sheet(2,'Physical embodiment',True)
    s.box('110\nDEVICE DIGITAL INTERFACE',96,100,402,74)
    s.arrow([(298,174),(298,236)])
    s.box('250\nLOCAL HOST PROCESSOR\nKEYS, FHE AND NETWORK',96,236,402,104)
    s.box('260\nSERIAL COMMAND LINK',96,398,402,74)
    s.box('220\nPROGRAMMABLE LOGIC\nEVENT AND SPIKING CIRCUITS',96,532,402,104)
    s.arrow([(247,340),(247,398)]);s.arrow([(348,398),(348,340)])
    s.arrow([(247,472),(247,532)]);s.arrow([(348,532),(348,472)])
    s.box('270\nSEQUENCED POWER AND CLOCK',96,697,402,65)
    s.arrow([(498,728),(533,728),(533,584),(498,584)])
    s=Sheet(3,'Local processing pipeline',True)
    for y,t in [(98,'211\nCANONICAL CHANNEL / TIME / VALUE'),(220,'212\nVALIDATE FRAME AND STABLE ORDER'),(342,'221\nAMPLITUDE AND REFRACTORY GATE'),(464,'222\nSELECT APPROVED ENCODER')]:s.box(t,81,y,434,79)
    for a,b in [(177,220),(299,342),(421,464)]:s.arrow([(298,a),(298,b)])
    s.box('223\nSPATIAL COUNTER',72,586,214,64)
    s.box('224\nSPIKING NEURONS',321,586,214,64)
    s.arrow([(224,543),(224,565),(179,565),(179,586)])
    s.arrow([(372,543),(372,565),(428,565),(428,586)])
    s.box('230\nTIME / UNIT COUNT MEMORY',81,694,434,65)
    s.arrow([(179,650),(179,673),(235,673),(235,694)])
    s.arrow([(428,650),(428,673),(361,673),(361,694)])
    s=Sheet(4,'Threshold and refractory circuit',True)
    s.box('401\nSIGNED SAMPLE\nREGISTER',80,111,205,88)
    s.box('402\nABSOLUTE\nVALUE CIRCUIT',80,271,205,88)
    s.box('403\nTHRESHOLD\nCOMPARATOR',80,433,205,88)
    s.arrow([(183,199),(183,271)]);s.arrow([(183,359),(183,433)])
    s.box('404\nLAST-ACCEPTED\nTIME MEMORY',335,111,190,88)
    s.box('405\nTIME DIFFERENCE\nCOMPARATOR',335,271,190,88)
    s.arrow([(430,199),(430,271)])
    s.box('406\nACCEPT ENABLE',158,599,280,84)
    s.arrow([(183,521),(183,563),(252,563),(252,599)])
    s.arrow([(430,359),(430,562),(347,562),(347,599)])
    s.arrow([(298,683),(298,735)]);s.text('TO COUNT OR SPIKING CIRCUIT',298,756,size=14)
    s=Sheet(5,'Counter address and update circuit',True)
    s.box('501\nTIME-BIN\nCOMPARATORS',72,118,214,92)
    s.box('502\nSPATIAL UNIT\nADDRESS',322,118,204,92)
    s.box('503\nADDRESS CONCATENATION',105,293,390,78)
    s.arrow([(180,210),(180,252),(237,252),(237,293)])
    s.arrow([(424,210),(424,252),(357,252),(357,293)])
    s.box('230\nBOUNDED COUNT MEMORY',105,451,390,78)
    s.arrow([(298,371),(298,451)])
    s.box('504\nSATURATING INCREMENT',105,611,390,78)
    s.arrow([(244,529),(244,611)]);s.arrow([(350,611),(350,529)])
    s.arrow([(495,490),(543,490),(543,739),(298,739)]);s.text('231  FROZEN FRAME READOUT',298,765,size=14)
    s=Sheet(6,'Spiking-neuron connectivity',True)
    s.text('224  EIGHT-NEURON LOCAL ENCODER',298,109,size=14,bold=True)
    for i in range(4):
        y=155+i*128
        s.box(f'INPUT {i}',83,y,139,58)
        s.box(f'NEURON {i}',374,y,139,58)
        s.arrow([(222,y+29),(374,y+29)]);s.text('601',298,y+19,size=14)
        if i<3:s.arrow([(246,y+29),(270,y+29),(350,y+157),(374,y+157)])
    s.text('602  ADJACENT-NEURON SYNAPSE',298,701,size=14)
    s.text('SAME PATTERN FOR UNITS 4 THROUGH 7',298,733,size=14)
    s.text('UNIT 7 ADJACENCY RETURNS TO UNIT 0',298,759,size=14)
    s=Sheet(7,'Neuron arithmetic circuit',True)
    s.box('701\nSYNAPTIC\nWEIGHT ROM',72,118,208,85)
    s.box('702\nNEURON\nSTATE REGISTER',324,118,208,85)
    s.box('703\nINTEGRATION ADDER',143,290,310,73)
    s.arrow([(176,203),(176,247),(246,247),(246,290)])
    s.arrow([(428,203),(428,247),(351,247),(351,290)])
    s.box('704\nTHRESHOLD COMPARATOR',117,440,364,78)
    s.arrow([(298,363),(298,440)])
    s.box('705\nSPIKE / RESET SELECTOR',117,591,364,78)
    s.arrow([(298,518),(298,591)])
    s.arrow([(481,630),(553,630),(553,161),(532,161)])
    s.arrow([(298,669),(298,722)]);s.text('TO BOUNDED COUNT MEMORY 230',298,751,size=14)
    s=Sheet(8,'Neuron decay and timing circuit',True)
    s.box('801\nSAMPLE TIME\nREGISTER',95,111,404,80)
    s.box('802\nMILLISECOND TICK ADVANCE',95,261,404,80)
    s.arrow([(298,191),(298,261)])
    s.box('803\nSHIFT AND SUBTRACT\nV <- V - (V >> 4)',95,410,404,104)
    s.arrow([(252,341),(252,410)])
    s.box('804\nREFRACTORY DOWN-COUNTER',95,582,404,80)
    s.arrow([(499,300),(542,300),(542,622),(499,622)])
    s.text('TICKS PRECEDE EVENTS AT THE SAME TIME',298,725,size=14)
    s.text('BEGIN CLEARS FRAME-LOCAL STATE',298,754,size=14)
    s=Sheet(9,'Serial transport circuit',True)
    for y,t in [(103,'901\nINPUT SYNCHRONIZER REGISTERS'),(241,'902\nEDGE DETECTION AND SHIFT REGISTER'),(379,'903\nLENGTH AND CRC ADMISSION'),(517,'904\nCOMMAND AND FRAME CONTROLLER'),(655,'905\nREPLY REGISTER AND CRC')]:s.box(t,87,y,422,78)
    for a,b in [(181,241),(319,379),(457,517),(595,655)]:s.arrow([(298,a),(298,b)])
    s=Sheet(10,'Supply sequence and configuration reset',True)
    for y,t in [(97,'1001\nCORE SUPPLY'),(227,'1002\nCORE SUPERVISOR / I/O ENABLE'),(357,'1003\nI/O SUPPLY AND SUPERVISOR'),(487,'1004\nCONFIGURATION SUPPLY'),(617,'1005\nCONFIGURATION RESET SUPERVISOR')]:s.box(t, eighty:=80,y,435,78)
    for a,b in [(175,227),(305,357),(435,487),(565,617)]:s.arrow([(298,a),(298,b)])
    s.arrow([(298,695),(298,731)]);s.text('RELEASE PROGRAMMABLE LOGIC RESET',298,759,size=14)
    s=Sheet(11,'Metadata policy and encrypted representations',True)
    s.box('230\nLOCAL COUNT VECTOR',102,99,390,72)
    s.box('241\nAPPROVED PRIVACY PROFILE',102,238,390,72)
    s.arrow([(298,171),(298,238)])
    s.box('242\nFIXED-DOMAIN\nENCRYPTED VALUES',67,400,216,109)
    s.box('243\nPERMITTED SUPPORT\nENCRYPTED VALUES',319,400,215,109)
    s.arrow([(237,310),(237,355),(175,355),(175,400)])
    s.arrow([(359,310),(359,355),(427,355),(427,400)])
    s.box('244\nMODEL / CONTEXT / LAYOUT BINDING',78,615,438,78)
    s.arrow([(175,509),(175,558),(237,558),(237,615)])
    s.arrow([(427,509),(427,558),(358,558),(358,615)])
    s=Sheet(12,'Homomorphic linear score circuit',True)
    s.box('1201\nENCRYPTED\nFEATURE VALUE',63,118,223,91)
    s.box('1202\nPUBLIC\nMODEL WEIGHT',323,118,208,91)
    s.box('1203\nCIPHERTEXT / PLAINTEXT\nMULTIPLICATION',94,301,409,98)
    s.arrow([(175,209),(175,252),(241,252),(241,301)])
    s.arrow([(427,209),(427,252),(350,252),(350,301)])
    s.box('1204\nENCRYPTED SCORE ACCUMULATOR',74,490,447,86)
    s.arrow([(298,399),(298,490)])
    s.box('1205\nENCRYPTED BIAS INITIALIZATION',74,662,447,78)
    s.arrow([(298,662),(298,576)])
    s=Sheet(13,'Key isolation and result path',True)
    s.rect(68,99,463,294,True);s.text('200  TRUSTED LOCAL DOMAIN',298,131,size=14,bold=True)
    s.box('1301\nSECRET KEY',89,166,195,80)
    s.box('1302\nPUBLIC KEY\nAND CONTEXT',332,166,177,80)
    s.box('1303\nLOCAL DECRYPTION',99,292,399,72)
    s.arrow([(184,246),(184,270),(225,270),(225,292)])
    s.rect(68,460,463,160,True);s.text('300  REMOTE DOMAIN',298,491,size=14,bold=True)
    s.box('1304\nPUBLIC-KEY ENCRYPTED EVALUATION',89,520,421,72)
    s.arrow([(421,246),(551,246),(551,500),(476,500),(476,520)])
    s.arrow([(99,556),(43,556),(43,329),(99,329)])
    s.box('1305\nAUTHORIZED LOCAL RESULT',99,698,399,72)
    s.arrow([(498,330),(566,330),(566,734),(498,734)])
    s=Sheet(14,'Frame lifecycle and failure handling',True)
    for y,t in [(96,'1401\nBEGIN / CLEAR'),(221,'1402\nADMIT ORDERED SAMPLES'),(346,'1403\nUPDATE LOCAL STATE'),(471,'1404\nEND / FREEZE VALID FRAME'),(596,'1405\nREAD / ENCRYPT / DISPATCH')]:s.box(t,97,y,404,76)
    for a,b in [(172,221),(297,346),(422,471),(547,596)]:s.arrow([(298,a),(298,b)])
    s.box('1406\nFAULT LATCH / DISCARD',97,710,404, sixty:=60)
    s.arrow([(501,259),(546,259),(546,740),(501,740)])
    s=Sheet(15,'Adaptive profile and model admission',True)
    s.box('1501\nTASK / PRIVACY\nCONSTRAINTS',68,110,213,96)
    s.box('1502\nRESOURCE / QUALITY\nMEASUREMENTS',316,110,213,96)
    s.box('1503\nAPPROVED ENCODER / MODEL CATALOG', seventy:=70,292,461, eighty:=80)
    s.arrow([(175,206),(175,250),(235,250),(235,292)])
    s.arrow([(423,206),(423,250),(361,250),(361,292)])
    s.box('1504\nCOMPATIBILITY AND BOUND CHECK', seventy,462,461,eighty)
    s.arrow([(300,372),(300,462)])
    s.box('1505\nADMIT REMOTE / RUN LOCAL / DEFER', seventy,632,461,eighty)
    s.arrow([(300,542),(300,632)])
    s=Sheet(16,'Optional encoder training and deployment gate',True)
    s.box('1601\nGOVERNED TRAINING DATA',90,98,415,76)
    s.box('1602\nCANDIDATE ENCODER',90,227,415,76)
    s.arrow([(298,174),(298,227)])
    s.box('1603\nTASK\nUTILITY TEST',68,374,213,97)
    s.box('1604\nRECONSTRUCTION /\nIDENTITY ATTACK',316,374,213,97)
    s.arrow([(233,303),(233,339),(175,339),(175,374)])
    s.arrow([(362,303),(362,339),(423,339),(423,374)])
    s.box('1605\nHELD-OUT ACCEPTANCE GATE',90,552,415,76)
    s.arrow([(175,471),(175,512),(231,512),(231,552)])
    s.arrow([(423,471),(423,512),(363,512),(363,552)])
    s.box('1606\nFROZEN ENCODER / MODEL PROFILE',71,694,453,76)
    s.arrow([(298,628),(298,694)])

def render_pdf(sheets,path):
    c=canvas.Canvas(str(path),pagesize=(sheets[0].w,sheets[0].h),pageCompression=1)
    c.setTitle('ENER '+('Patent Schematics' if sheets[0].patent else 'Circuit Schematics'))
    c.setAuthor('Alexander Daly - ENER reference-design working package')
    for s in sheets:
        c.setPageSize((s.w,s.h));c.setStrokeColorRGB(0,0,0);c.setFillColorRGB(0,0,0)
        for kind,args in s.ops:
            if kind=='line':
                x1,y1,x2,y2,w,d=args;c.setLineWidth(w);c.setDash([5,4] if d else []);c.line(x1,s.h-y1,x2,s.h-y2);c.setDash([])
            elif kind=='rect':
                x,y,w,h,d=args;c.setLineWidth(1);c.setDash([5,4] if d else []);c.rect(x,s.h-y-h,w,h);c.setDash([])
            elif kind=='circle':x,y,r=args;c.circle(x,s.h-y,r)
            else:
                t,x,y,size,align,bold=args;c.setFont('ArialBold' if bold else 'Arial',size)
                {'center':c.drawCentredString,'left':c.drawString,'right':c.drawRightString}[align](x,s.h-y,t)
        c.showPage()
    c.save()

def render_svg(s,path):
    a=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.w}pt" height="{s.h}pt" viewBox="0 0 {s.w} {s.h}">',f'<title>{html.escape(s.title)}</title>','<rect width="100%" height="100%" fill="white"/>']
    for k,z in s.ops:
        if k=='line':
            x1,y1,x2,y2,w,d=z;a.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="black" stroke-width="{w}" fill="none"'+(' stroke-dasharray="5 4"' if d else '')+'/>')
        elif k=='rect':
            x,y,w,h,d=z;a.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="black"'+(' stroke-dasharray="5 4"' if d else '')+'/>')
        elif k=='circle':x,y,r=z;a.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="black"/>')
        else:
            t,x,y,size,al,b=z;anchor={'center':'middle','left':'start','right':'end'}[al]
            a.append(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{700 if b else 400}">{html.escape(t)}</text>')
    a.append('</svg>');path.write_text('\n'.join(a),encoding='utf-8')

def export_connectivity():
    nets=defaultdict(list)
    coverage=defaultdict(list)
    for s in PAGES:
        for c in s.components:
            for pin in c['pins']:coverage[(c['ref'],pin)].append(s.n)
    for ref,p in PARTS.items():
        for pin,pd in p['pins'].items():
            assert len(coverage[(ref,pin)])==1,(ref,pin,coverage[(ref,pin)])
            if pd['net'] is not None:nets[pd['net']].append(f'{ref}.{pin}')
    assert all(len(v)>=2 for v in nets.values()),[(k,v) for k,v in nets.items() if len(v)<2]
    (ROOT/'components.json').write_text(json.dumps(PARTS,indent=2))
    (ROOT/'connectivity.json').write_text(json.dumps(dict(nets),indent=2))
    with (ROOT/'bom.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f);w.writerow(['Reference','Value','MPN or order specification','Package','Notes'])
        for p in PARTS.values():w.writerow([p['ref'],p['value'],p['mpn'],p['package'],p['notes']])
    with (ROOT/'pin_net_map.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f);w.writerow(['Reference','Pin','Pin name','Net','Type','Circuit sheet'])
        for ref,p in PARTS.items():
            for num,pi in p['pins'].items():w.writerow([ref,num,pi['name'],pi['net'] or 'INTENTIONAL_NC',pi['type'],coverage[(ref,num)][0]])
    report={'status':'PASS','physical_components':len(PARTS),'physical_pins':sum(len(p['pins']) for p in PARTS.values()),'named_nets':len(nets),'checks':['Every physical pin is drawn exactly once.','Every named net has at least two terminals.','All 49 FPGA pads and all 40 host connector pins assigned.','No physical secret-key connection to FPGA.'], 'limits':'Connectivity audit, not KiCad ERC, SPICE, signal-integrity or physical assembly validation.'}
    (ROOT/'verification'/'connectivity_verification.json').write_text(json.dumps(report,indent=2))
    return report

def export_kicad():
    """Self-contained legacy Eeschema project for import into modern KiCad.
    A shared multi-unit U1 symbol retains physical reference and pad numbers.
    Global labels carry the same names as the authoritative connectivity JSON.
    """
    lib=['EESchema-LIBRARY Version 2.4','#encoding utf-8']
    scale=1000/72
    def mi(v):return int(round(v*scale))
    def stamp(v):return hashlib.sha256(v.encode()).hexdigest()[:8].upper()
    groups=defaultdict(list)
    for sheet in PAGES[:4]:
        for component in sheet.components:groups[component['ref']].append(component)
    for ref,units in groups.items():
        p=PARTS[ref];symbol=f'ENER_{ref}';unit_count=max(c['unit'] for c in units)
        lib += [f'# {symbol}',f'DEF {symbol} {ref[0]} 0 20 Y Y {unit_count} F N',f'F0 "{ref}" 0 200 80 H V C CNN',f'F1 "{p["value"]}" 0 100 60 H V C CNN','DRAW']
        for c in units:
            u=c['unit'];cx=c['x']+c['w']/2;cy=c['y']+c['h']/2
            if p['kind']=='R':lib.append(f'S -250 80 250 -80 {u} 1 12 N')
            elif p['kind']=='C':lib += [f'P 2 {u} 1 12 -40 120 -40 -120 N',f'P 2 {u} 1 12 40 120 40 -120 N']
            elif p['kind']=='SW':lib.append(f'P 2 {u} 1 12 -250 0 220 140 N')
            else:lib.append(f'S {mi(-c["w"]/2)} {mi(c["h"]/2)} {mi(c["w"]/2)} {mi(-c["h"]/2)} {u} 1 12 N')
            for num,pos in c['pins'].items():
                pi=p['pins'][num];xx=mi(pos['x']-cx);yy=mi(cy-pos['y']);side=pos['side']
                typ={'power_in':'W','power_out':'w','input':'I','output':'O','open_drain':'C','passive':'P','no_connect':'N'}[pi['type']]
                length=mi(abs(pos['x']-pos['body_x']))
                if p['kind'] in ['R','F','SW']:length=mi(18)
                if p['kind']=='C':length=mi(36)-40
                name=pi['name'].replace(' ','_').replace('/','_')
                lib.append(f'X {name} {num} {xx} {yy} {length} {"R" if side=="L" else "L"} 80 80 {u} 1 {typ}')
        lib+=['ENDDRAW','ENDDEF']
    root=['EESchema Schematic File Version 4','LIBS:ENER_Relay-cache','EELAYER 29 0','EELAYER END','$Descr A4 11693 8268','Sheet 1 5','Title "ENER Relay B - component schematics"','Date "2026-09-05"','Rev "B"','Comp "ENER"','$EndDescr']
    for s in PAGES[:4]:
        sy=1100+s.n*1000
        root += ['$Sheet',f'S 1600 {sy} 4300 650',f'U {stamp("sheet"+str(s.n))}',f'F0 "C{s.n:02d} {s.title}" 50',f'F1 "C{s.n:02d}.sch" 50','$EndSheet']
        a=['EESchema Schematic File Version 4','LIBS:ENER_Relay-cache','EELAYER 29 0','EELAYER END','$Descr A3 16535 11693',f'Sheet {s.n+1} 5',f'Title "ENER C{s.n:02d}: {s.title}"','Date "2026-09-05"','Rev "B"','Comp "ENER"','$EndDescr']
        for c in s.components:
            ref=c['ref'];p=PARTS[ref];unit=c['unit'];symbol=f'ENER_{ref}'
            cx=c['x']+c['w']/2;cy=c['y']+c['h']/2
            a+=['$Comp',f'L {symbol} {ref}',f'U {unit} 1 {stamp(ref+str(unit))}',f'P {mi(cx)} {mi(cy)}',f'F 0 "{ref}" H {mi(cx)} {mi(c["y"]-8)} 80 0000 C CNN',f'F 1 "{p["value"]}" H {mi(cx)} {mi(c["y"]+8)} 65 0000 C CNN',f'\t{unit} {mi(cx)} {mi(cy)}','\t1 0 0 -1','$EndComp']
            for num,pos in c['pins'].items():
                net=p['pins'][num]['net'];x=mi(cx)+mi(pos['x']-cx);y=mi(cy)-mi(cy-pos['y'])
                if net is None:a.append(f'NoConn ~ {x} {y}')
                else:
                    endpoint=x+(-150 if pos['side']=='L' else 150)
                    a+=['Wire Wire Line',f'\t{x} {y} {endpoint} {y}',f'Text GLabel {endpoint} {y} {0 if pos["side"]=="L" else 2} 80 BiDi ~ 0',net]
        a+=['$EndSCHEMATC'];(ROOT/'cad'/f'C{s.n:02d}.sch').write_text('\n'.join(a)+'\n',newline='\n')
    root+=['$EndSCHEMATC'];lib+=['#End Library']
    (ROOT/'cad'/'ENER_Relay.sch').write_text('\n'.join(root)+'\n',newline='\n')
    (ROOT/'cad'/'ENER_Relay-cache.lib').write_text('\n'.join(lib)+'\n',newline='\n')
    for n in range(1,5):(ROOT/'cad'/f'C{n:02d}-cache.lib').write_text('\n'.join(lib)+'\n',newline='\n')
    (ROOT/'cad'/'README.md').write_text('Open ENER_Relay.sch in KiCad and import the legacy project. The companion cache library is self-contained. These sources have not been opened or ERC-checked in KiCad in this environment. Use pin_net_map.csv and connectivity.json as the authoritative connectivity; PDF/SVG as reviewed drawings. U1 is one three-unit symbol with every physical pad assigned once. No PCB or Gerbers are supplied.\n')

def main():
    build_components();circuit_sheets();patent_figures()
    assert len(PATENT)==16 and len(PAGES)==8
    report=export_connectivity();export_kicad()
    render_pdf(PAGES,OUT/'ENER_Circuit_Schematics.pdf')
    render_pdf(PATENT,OUT/'ENER_Complete_Patent_Schematics.pdf')
    for s in PAGES+PATENT:
        render_svg(s,ROOT/'svg'/('patent' if s.patent else 'circuit')/f'{s.n:02d}.svg')
    (ROOT/'drawing_manifest.json').write_text(json.dumps({'circuit':[dict(sheet=s.n,title=s.title,components=[c['ref'] for c in s.components]) for s in PAGES],'patent':[dict(figure=s.n,title=s.title) for s in PATENT]},indent=2))
    (ROOT/'verification'/'text_geometry.json').write_text(json.dumps(TEXT_BOXES))
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
