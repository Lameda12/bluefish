"""
species_risk.py — per-species thermal stress assessment for NS aquaculture sites.

Thresholds (°C):
    Atlantic Salmon   stress=23  critical=27
    Eastern Oyster    stress=30
    Blue Mussel       stress=25

Risk levels:
    Low       SST < stress threshold
    Elevated  stress ≤ SST < critical (or SST ≥ stress when no critical defined)
    Critical  SST ≥ critical threshold

Output field semantics:
    threshold  — the boundary that defines the current risk level
                   Low:      stress threshold (what the species is approaching)
                   Elevated: stress threshold (what was just crossed)
                   Critical: critical threshold (what was crossed)
    delta      — current_sst − threshold
                   negative → degrees of buffer remaining below that boundary
                   positive → degrees above that boundary
"""

import json
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Site registry
# ---------------------------------------------------------------------------

SITES = {
    "shelburne":   {"name": "Shelburne",   "lat":  43.8, "lon": -65.3},
    "digby":       {"name": "Digby",       "lat":  44.5, "lon": -65.8},
    "cape_breton": {"name": "Cape Breton", "lat":  45.9, "lon": -60.3},
    "mahone_bay":  {"name": "Mahone Bay",  "lat":  44.5, "lon": -64.4},
}

# ---------------------------------------------------------------------------
# Species thermal thresholds (°C)
# Each entry: (species_label, stress_°C, critical_°C | None)
# ---------------------------------------------------------------------------

SPECIES = [
    ("Atlantic Salmon", 23.0, 27.0),
    ("Eastern Oyster",  30.0, None),
    ("Blue Mussel",     25.0, None),
]


# ---------------------------------------------------------------------------
# Risk calculation
# ---------------------------------------------------------------------------

def assess_risk(sst: float, stress: float, critical: Optional[float]) -> dict:
    """
    Return {risk_level, threshold, delta} for a single species at a given SST.
    """
    if critical is not None and sst >= critical:
        return {
            "risk_level": "Critical",
            "threshold":  critical,
            "delta":      round(sst - critical, 4),
        }
    if sst >= stress:
        return {
            "risk_level": "Elevated",
            "threshold":  stress,
            "delta":      round(sst - stress, 4),
        }
    # Low — threshold reported as stress (what the species is approaching)
    return {
        "risk_level": "Low",
        "threshold":  stress,
        "delta":      round(sst - stress, 4),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    mhw_path = Path("output") / "mhw_status.json"
    if not mhw_path.exists():
        raise FileNotFoundError(f"{mhw_path} not found — run mhw_detector.py first")

    mhw_by_site: dict[str, dict] = {
        rec["site_id"]: rec
        for rec in json.loads(mhw_path.read_text())
    }

    results = []

    for site_id, meta in SITES.items():
        mhw = mhw_by_site.get(site_id)
        if mhw is None:
            print(f"  {site_id}: no MHW record, skipping")
            continue

        sst = mhw["current_sst"]

        species_risk = []
        for species_name, stress, critical in SPECIES:
            assessment = assess_risk(sst, stress, critical)
            species_risk.append({
                "species":     species_name,
                "risk_level":  assessment["risk_level"],
                "threshold":   assessment["threshold"],
                "delta":       assessment["delta"],
            })

        results.append({
            "site_id":      site_id,
            "name":         meta["name"],
            "lat":          meta["lat"],
            "lon":          meta["lon"],
            "mhw_category": mhw["category"],
            "current_sst":  sst,
            "species_risk": species_risk,
        })

        # Console summary
        active_label = f"MHW Cat-{mhw['category']}" if mhw["active"] else "no MHW"
        print(f"{meta['name']:12s}  SST={sst}°C  {active_label}")
        for sr in species_risk:
            marker = "!" if sr["risk_level"] != "Low" else " "
            print(
                f"  {marker} {sr['species']:18s}  {sr['risk_level']:8s}  "
                f"threshold={sr['threshold']}°C  δ={sr['delta']:+.2f}°C"
            )

    out_path = Path("output") / "sites.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {len(results)} sites → {out_path}")


if __name__ == "__main__":
    main()
