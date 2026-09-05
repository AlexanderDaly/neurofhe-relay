"""Create and verify the complete, repository-relative design handoff archive."""
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

B = Path(__file__).resolve().parent
R = B.parents[1]
OUT = R / 'output'
ARCHIVE = OUT / 'ENER_Complete_Schematic_Design_B_2026-09-05.zip'

files = {p for p in B.rglob('*') if p.is_file()
         and '__pycache__' not in p.parts and p.suffix != '.pyc'}
report = json.loads((B / 'verification/artifact_verification.json').read_text())
for item in report['pdfs']:
    p = OUT / 'pdf' / item['file']
    assert hashlib.sha256(p.read_bytes()).hexdigest() == item['sha256'], p
    files.add(p)

# Include the unchanged source specification and the small fixture's import
# closure so the supplied regression and document builders also work after unzip.
files.update([R / 'patent/ENER_provisional_specification.md', R / 'LICENSE'])
pending = [R / 'prototype/lib/spike-sorter.mjs', R / 'prototype/lib/classifier.mjs']
while pending:
    p = pending.pop().resolve()
    if p in files:
        continue
    assert p.is_relative_to(R) and p.is_file(), p
    files.add(p)
    for rel in re.findall(r'from\s+[\"\'](\.[^\"\']+)[\"\']', p.read_text(encoding='utf-8')):
        pending.append((p.parent / rel).resolve())

readme = '''# ENER complete schematic design — revision B

Prepared September 5, 2026. This archive contains the complete reference design
using an existing acquisition device, Raspberry Pi local host, custom UP5K FPGA
relay circuit and a local/remote FHE software partition.

Start with:

1. output/pdf/ENER_Complete_Patent_Schematics.pdf — 16 patent figures.
2. output/pdf/ENER_Circuit_Schematics.pdf — eight component/datapath sheets.
3. output/pdf/ENER_Implementation_Design.pdf — 26-page implementation specification.

Editable sources, the 55-component BOM, all 226 pin assignments, KiCad import
files, SVG figures, FPGA hardware sources and verification evidence are under
patent/complete-design-2026-09-05/. Its README gives exact rebuild commands.
ENER_specification_with_reference_design.md is the separate patent working copy
with the matching figure descriptions and the new circuit embodiment.

The FPGA logic was simulated, synthesized and placed/routed. This archive is a
schematic and implementation design, not a fabricated board or validated headset
deployment. KiCad import/ERC and physical testing remain unperformed. The circuit
PDF and authoritative pin/net tables are available independently of KiCad.

Unzip into a new directory, preserving paths. The unchanged original specification
and minimal repository fixture sources are included for reproducibility, together
with the repository license. The complete original project is at:
https://github.com/AlexanderDaly/neurofhe-relay
Source commit: c42d68225934a3bfa46a4bdd7573d035ad907b96.

SHA256SUMS.txt lists checksums for every payload file (including this README).
ARCHIVE_MANIFEST.json records the same payload entries and their byte sizes.
The two inventory files intentionally do not hash themselves or one another.
'''

payload = {p.relative_to(R).as_posix(): p.read_bytes() for p in sorted(files)}
payload['PACKAGE_README.md'] = readme.encode('utf-8')
entries = [{'path': name, 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}
           for name, data in sorted(payload.items())]
manifest = {'revision': 'B', 'date': '2026-09-05',
            'source_commit': 'c42d68225934a3bfa46a4bdd7573d035ad907b96',
            'files': entries}
payload['ARCHIVE_MANIFEST.json'] = json.dumps(manifest, indent=2).encode('utf-8')
payload['SHA256SUMS.txt'] = ''.join(f"{x['sha256']}  {x['path']}\n" for x in entries).encode('utf-8')

with ZipFile(ARCHIVE, 'w', compression=ZIP_DEFLATED, compresslevel=9) as z:
    for name, data in sorted(payload.items()):
        z.writestr(name, data)
with ZipFile(ARCHIVE) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(payload)
    for entry in entries:
        data = z.read(entry['path'])
        assert len(data) == entry['bytes']
        assert hashlib.sha256(data).hexdigest() == entry['sha256']

result = {'archive': ARCHIVE.name, 'status': 'PASS', 'entries': len(payload),
          'bytes': ARCHIVE.stat().st_size,
          'sha256': hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),
          'checks': 'ZIP CRC, entry count, all payload byte sizes and SHA-256 digests'}
(OUT / 'ENER_Complete_Schematic_Design_B_2026-09-05_manifest.json').write_text(
    json.dumps({'verification': result, **manifest}, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
