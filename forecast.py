"""
forecast.py — 7-day SST linear trend forecast for NS aquaculture sites.

Fits OLS (ordinary least squares) on the last 7 observed days per site,
projects forward 7 days, and flags each projected date against the MHW
90th-percentile threshold from mhw_status.json.

No numpy / scipy — regression uses stdlib arithmetic only.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path


# ---------------------------------------------------------------------------
# OLS linear regression (stdlib only)
# ---------------------------------------------------------------------------

def ols(xs: list, ys: list) -> tuple:
    """
    Return (slope, intercept) for the least-squares line through (xs, ys).
    xs are integer day-offsets; ys are SST values.
    """
    n = len(xs)
    sx  = sum(xs)
    sy  = sum(ys)
    sxy = sum(x * y for x, y in zip(xs, ys))
    sx2 = sum(x * x for x in xs)
    denom = n * sx2 - sx * sx
    if denom == 0:                      # all x identical → flat line at mean
        return 0.0, sy / n
    slope     = (n * sxy - sx * sy) / denom
    intercept = (sy - slope * sx) / n
    return slope, intercept


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    history_path = Path("output") / "sst_history.json"
    mhw_path     = Path("output") / "mhw_status.json"

    if not history_path.exists():
        raise FileNotFoundError(f"{history_path} — run fetch_sst.py first")
    if not mhw_path.exists():
        raise FileNotFoundError(f"{mhw_path} — run mhw_detector.py first")

    history    = json.loads(history_path.read_text())
    mhw_status = json.loads(mhw_path.read_text())

    threshold_by_site: dict[str, float] = {
        rec["site_id"]: rec["threshold"] for rec in mhw_status
    }

    # Group and sort history by site
    by_site: dict[str, list] = {}
    for rec in history:
        by_site.setdefault(rec["site_id"], []).append((rec["date"], rec["sst"]))
    for sid in by_site:
        by_site[sid].sort(key=lambda x: x[0])

    results = []

    for site_id, series in by_site.items():
        window = series[-7:]                # last 7 observed days
        if len(window) < 2:
            print(f"  {site_id}: only {len(window)} record(s), skipping")
            continue

        threshold = threshold_by_site.get(site_id)

        # x = calendar-day offset from first point in window (handles gaps)
        base = datetime.strptime(window[0][0], "%Y-%m-%d")
        xs   = [(datetime.strptime(d, "%Y-%m-%d") - base).days for d, _ in window]
        ys   = [sst for _, sst in window]

        slope, intercept = ols(xs, ys)

        last_date = datetime.strptime(window[-1][0], "%Y-%m-%d")
        last_x    = xs[-1]

        forecast = []
        for step in range(1, 8):
            proj_x   = last_x + step
            proj_sst = round(intercept + slope * proj_x, 4)
            proj_date = (last_date + timedelta(days=step)).strftime("%Y-%m-%d")
            forecast.append({
                "date":            proj_date,
                "projected_sst":   proj_sst,
                "above_threshold": (proj_sst > threshold) if threshold is not None else None,
            })

        results.append({"site_id": site_id, "forecast": forecast})

        # Readable console summary
        d7 = forecast[-1]
        flag = "▲ MHW" if d7["above_threshold"] else "  ok"
        print(
            f"{site_id:14s}  slope={slope:+.4f}°C/d  "
            f"now={ys[-1]:.2f}°C → day+7={d7['projected_sst']:.2f}°C  "
            f"threshold={threshold}°C  {flag}"
        )

    out_path = Path("output") / "forecast.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {len(results)} site forecasts → {out_path}")


if __name__ == "__main__":
    main()
