# ENER complete schematic design - revision B

This package contains the complete relay circuit and FPGA implementation, along with a matching sixteen-figure patent architecture.

The selected hardware is an existing headset/acquisition device, a Raspberry Pi 4 Model B host, and a custom iCE40UP5K-SG48 mezzanine. The FPGA performs spatial counting or the specified eight-neuron integrate-and-fire circuit; FHE runs on the local host and remote evaluator. The headset's analog acquisition hardware is used as supplied.

## Start here

- [Patent schematics](../../output/pdf/ENER_Complete_Patent_Schematics.pdf): 16 A4 black-and-white vector patent figures.
- [Circuit schematics](../../output/pdf/ENER_Circuit_Schematics.pdf): 8 A3 sheets covering the physical circuit and digital/FHE datapaths.
- [Implementation design](../../output/pdf/ENER_Implementation_Design.pdf): specification, equations, interfaces, resource budgets, BOM and evidence.
- [Specification working copy](ENER_specification_with_reference_design.md): matching drawing section and new F.14 embodiment.
- [Drawing descriptions](drawing_descriptions.md): matching captions and numeral occurrences.
- [KiCad import project](cad/ENER_Relay.sch); [SVG sources](svg/) contain all editable vector sheets.
- [BOM](bom.csv), [pin map](pin_net_map.csv), [connectivity](connectivity.json): physical component and connection sources.
- [Hardware source](rtl/relay_hdl.py), [generated Verilog](rtl/ener_relay.v), [pin constraints](rtl/ener_relay.pcf).

## Validation status

The core and SPI circuit were simulated, synthesized and placed/routed for UP5K SG48. The 16 MHz internal timing target passes. Every physical pad is assigned, and the emitted KiCad symbols/wires/global labels are independently parsed back to the authoritative netlist. The PDFs are rendered and reviewed. The verification directory records exact results.

The board has not been assembled. No PCB or Gerbers are supplied. Native KiCad import/ERC and physical electrical tests have not been performed. The exact headset adapter, trained classifier and network FHE deployment require target-specific integration/validation. No end-to-end speed, clinical accuracy, reconstruction resistance or patentability is claimed.

## Rebuild from the repository root

Use Python 3.12, Node, ReportLab, pypdf, pdfplumber and Pillow. Install the HDL requirements into a virtual environment. The package uses the listed tool versions; these do not change the existing prototype dependencies.

```powershell
python -m pip install -r patent/complete-design-2026-09-05/requirements-hdl.txt
python -m pip install reportlab pypdf pdfplumber Pillow
node patent/complete-design-2026-09-05/rtl/generate_repo_fixture.mjs
python patent/complete-design-2026-09-05/rtl/verify_logic.py
python patent/complete-design-2026-09-05/rtl/relay_hdl.py
python patent/complete-design-2026-09-05/rtl/run_tool.py yosys -q -l patent/complete-design-2026-09-05/verification/synthesis.log -p "read_rtlil patent/complete-design-2026-09-05/rtl/relay.il; proc; write_verilog -noattr patent/complete-design-2026-09-05/rtl/ener_relay.v; synth_ice40 -top ener_relay -json patent/complete-design-2026-09-05/rtl/ener_relay.json; stat"
python patent/complete-design-2026-09-05/rtl/run_tool.py nextpnr --up5k --package sg48 --json patent/complete-design-2026-09-05/rtl/ener_relay.json --pcf patent/complete-design-2026-09-05/rtl/ener_relay.pcf --freq 16 --asc patent/complete-design-2026-09-05/rtl/ener_relay.asc --report patent/complete-design-2026-09-05/verification/place_route.json --log patent/complete-design-2026-09-05/verification/place_route.log
python patent/complete-design-2026-09-05/rtl/run_tool.py icepack patent/complete-design-2026-09-05/rtl/ener_relay.asc patent/complete-design-2026-09-05/rtl/ener_relay.bin
python patent/complete-design-2026-09-05/build_drawings.py
python patent/complete-design-2026-09-05/build_design_document.py
```

The drawing builders use Arial and Consolas from the Windows font directory; change font paths when rebuilding on another OS. Render the three PDFs with Poppler into `tmp/pdfs/ener-complete/` using prefixes `patent`, `circuit`, and `design`, then run `verify_artifacts.py`. Review all rendered pages before delivering any revision.

Run `python patent/complete-design-2026-09-05/package_design.py` to build the complete ZIP and its checksum manifest. The ZIP preserves repository-relative paths and includes the unchanged specification and minimal JavaScript fixture dependencies, so the document and fixture builders can run from an extracted copy.

## Source and review boundary

Source repository commit: `c42d68225934a3bfa46a4bdd7573d035ad907b96`. Original patent documents and the previous diagram package are preserved. Figure numbering in this revision is a new coordinated set; use its matching specification working copy. The semiconductor selection, detailed circuit, SPI framing and fixed ring-neuron implementation are proposed design work dated September 5, 2026, not historical experimental evidence. The earlier source's optional training and alternative HE schemes remain separate embodiments.
