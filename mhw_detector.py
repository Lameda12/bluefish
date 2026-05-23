"""
Marine heatwave detector for NS aquaculture sites (Hobday et al. 2016/2018).

Threshold (90th-percentile climatology)
    The requested dataset NOAA_DHW_climatology / CRW_SST_90th is not publicly
    hosted on any reachable ERDDAP server.  We use the next best equivalent:
    jplMURSST41clim (MUR SST daily climatology 2003-2014) which publishes
    mean_sst and standard_deviation for each day-of-year at 0.01° resolution.

    P90 ≈ mean + 1.2816 × std   (exact for normally-distributed SST)

Category (Hobday et al. 2018 intensity-ratio framework)
    δ  = P90 − mean  (= 1.2816 × std, the "category step")
    I  = SST − P90   (intensity above threshold)
    ratio = I / δ
      I   (Moderate): 0  < ratio ≤ 1
      II  (Strong):   1  < ratio ≤ 2
      III (Severe):   2  < ratio ≤ 3
      IV  (Extreme):  ratio > 3
"""

import json
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SITES = [
    {"site_id": "shelburne",   "lat":  43.8, "lon": -65.3},
    {"site_id": "digby",       "lat":  44.5, "lon": -65.8},
    {"site_id": "cape_breton", "lat":  45.9, "lon": -60.3},
    {"site_id": "mahone_bay",  "lat":  44.5, "lon": -64.4},
]

CLIM_ERDDAP   = "https://coastwatch.pfeg.noaa.gov/erddap"
CLIM_DATASET  = "jplMURSST41clim"        # DOY-indexed mean + std
SEARCH_RADIUS = 0.3                       # degrees – clears coastal land mask
Z90           = 1.2816                    # N(0,1) quantile for 90th percentile
MHW_MIN_DAYS  = 5                         # Hobday et al. 2016 definition


# ---------------------------------------------------------------------------
# Climatology fetch
# ---------------------------------------------------------------------------

def fetch_threshold(site: dict, doy: int) -> tuple[float, float, float]:
    """
    Return (mean_sst, threshold_p90, delta) for the nearest valid MUR cell.
    delta = P90 - mean = Z90 * std  (the Hobday category step).
    """
    lat, lon = site["lat"], site["lon"]
    r = SEARCH_RADIUS
    url = (
        f"{CLIM_ERDDAP}/griddap/{CLIM_DATASET}.json"
        f"?mean_sst[({doy}):1:({doy})]"
        f"[({lat - r}):1:({lat + r})]"
        f"[({lon - r}):1:({lon + r})]"
        f",standard_deviation[({doy}):1:({doy})]"
        f"[({lat - r}):1:({lat + r})]"
        f"[({lon - r}):1:({lon + r})]"
    )
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    table = resp.json()["table"]
    cols   = table["columnNames"]
    lat_i  = cols.index("latitude")
    lon_i  = cols.index("longitude")
    mean_i = cols.index("mean_sst")
    std_i  = cols.index("standard_deviation")

    best, best_dist = None, float("inf")
    for row in table["rows"]:
        if row[mean_i] is None or row[std_i] is None:
            continue
        dist = ((row[lat_i] - lat) ** 2 + (row[lon_i] - lon) ** 2) ** 0.5
        if dist < best_dist:
            best_dist, best = dist, row

    if best is None:
        raise RuntimeError(
            f"No valid MUR climatology cell within {r}° of "
            f"{site['site_id']} for DOY {doy}"
        )

    mean_sst = float(best[mean_i])
    std_sst  = float(best[std_i])
    delta    = Z90 * std_sst          # = P90 - mean
    threshold = mean_sst + delta
    return round(mean_sst, 4), round(threshold, 4), round(delta, 4)


# ---------------------------------------------------------------------------
# MHW detection helpers
# ---------------------------------------------------------------------------

def parse_date(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def current_streak(series: list[tuple[str, float]], threshold: float) -> int:
    """
    Count consecutive calendar days above `threshold` ending at the last entry.
    A gap of >1 calendar day in the records breaks the streak.
    Returns 0 if the latest value is at or below threshold.
    """
    if not series:
        return 0
    sorted_series = sorted(series, key=lambda x: x[0])
    streak = 0
    prev_date = None
    for date_str, sst in reversed(sorted_series):
        curr = parse_date(date_str)
        if prev_date is not None and (prev_date - curr).days > 1:
            break            # non-consecutive calendar days → streak broken
        if sst > threshold:
            streak += 1
            prev_date = curr
        else:
            break
    return streak


def mhw_category(sst: float, threshold: float, delta: float) -> int:
    """Hobday et al. 2018 intensity-ratio category (I–IV)."""
    intensity = sst - threshold
    if delta <= 0:
        return 1
    ratio = intensity / delta
    if ratio <= 1:
        return 1
    if ratio <= 2:
        return 2
    if ratio <= 3:
        return 3
    return 4


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    history_path = Path("output") / "sst_history.json"
    if not history_path.exists():
        raise FileNotFoundError(f"{history_path} not found – run fetch_sst.py first")

    history: list[dict] = json.loads(history_path.read_text())

    # Group records by site
    by_site: dict[str, list[tuple[str, float]]] = {s["site_id"]: [] for s in SITES}
    for rec in history:
        sid = rec["site_id"]
        if sid in by_site:
            by_site[sid].append((rec["date"], rec["sst"]))

    # Day-of-year for today (1–365; MUR clim uses DOY not leap-aware)
    now = datetime.now(timezone.utc)
    doy = now.timetuple().tm_yday
    # jplMURSST41clim only has DOY 1-365
    doy = min(doy, 365)

    print(f"Today: {now.date()}  DOY: {doy}")

    results: list[dict] = []
    Path("output").mkdir(exist_ok=True)

    for site in SITES:
        sid = site["site_id"]
        series = sorted(by_site.get(sid, []))
        if not series:
            print(f"  {sid}: no SST data, skipping")
            continue

        current_sst = series[-1][1]
        current_date = series[-1][0]

        print(f"\n{sid}  (latest SST {current_sst}°C on {current_date})")

        try:
            mean_sst, threshold, delta = fetch_threshold(site, doy)
        except Exception as exc:
            print(f"  ERROR fetching climatology: {exc}")
            continue

        print(f"  MUR clim DOY {doy}: mean={mean_sst}°C  P90={threshold}°C  δ={delta}°C")

        streak = current_streak(series, threshold)
        active = streak >= MHW_MIN_DAYS

        if active:
            cat = mhw_category(current_sst, threshold, delta)
            cat_label = ["", "I", "II", "III", "IV"][cat]
            print(f"  MHW ACTIVE  streak={streak}d  category={cat_label}")
        else:
            cat = None
            print(f"  No MHW  (streak={streak}d above threshold, need {MHW_MIN_DAYS})")

        results.append({
            "site_id":      sid,
            "active":       active,
            "category":     cat,
            "days_duration": streak,
            "current_sst":  current_sst,
            "threshold":    threshold,
        })

    out_path = Path("output") / "mhw_status.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nWrote {len(results)} site statuses → {out_path}")


if __name__ == "__main__":
    main()
