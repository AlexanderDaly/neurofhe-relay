"""Workspace-local entry point for the explicitly installed YoWASP tools."""
import sys
if sys.argv[1] == "yosys":
    from yowasp_yosys import run_yosys
    sys.exit(run_yosys(sys.argv[2:]))
if sys.argv[1] == "nextpnr":
    from yowasp_nextpnr_ice40 import run_nextpnr_ice40
    sys.exit(run_nextpnr_ice40(sys.argv[2:]))
if sys.argv[1] == "icepack":
    from yowasp_nextpnr_ice40 import run_icepack
    sys.exit(run_icepack(sys.argv[2:]))
raise SystemExit("Unknown tool")
