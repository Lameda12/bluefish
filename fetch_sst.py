"""
Fetch 30-day SST history from NOAA ERDDAP CoralTemp (NOAA_DHW / CRW_SST)
for four Nova Scotia aquaculture sites and write to output/sst_history.json.

Because the 5 km CoralTemp product land-masks shallow coastal pixels, the
script first scouts a ±0.3° box around each site to locate the nearest valid
ocean grid cell, then pulls the full 30-day series for that cell.
"""

import json
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _require_col(cols: list, name: str) -> int:
    """Return the index of *name* in *cols*, raising a descriptive error when absent."""
    try:
        return cols.index(name)
    except ValueError:
        raise RuntimeError(
            f"Expected column '{name}' not found in API response. "
            f"Available columns: {cols}"
        )


def _extract_table(payload: dict, context: str) -> tuple[list, list]:
    """Return (columnNames, rows) from an ERDDAP JSON payload, raising on bad structure."""
    if "table" not in payload:
        raise RuntimeError(f"ERDDAP response missing 'table' key ({context})")
    table = payload["table"]
    if "columnNames" not in table or "rows" not in table:
        raise RuntimeError(f"ERDDAP table missing 'columnNames' or 'rows' ({context})")
    return table["columnNames"], table["rows"]

SITES = [
    {"site_id": "shelburne",   "lat":  43.8, "lon": -65.3},
    {"site_id": "digby",       "lat":  44.5, "lon": -65.8},
    {"site_id": "cape_breton", "lat":  45.9, "lon": -60.3},
    {"site_id": "mahone_bay",  "lat":  44.5, "lon": -64.4},
]

ERDDAP_BASE   = "https://coastwatch.pfeg.noaa.gov/erddap"
DATASET_ID    = "NOAA_DHW"
VAR           = "CRW_SST"
TIME_SUFFIX   = "T12:00:00Z"
SEARCH_RADIUS = 0.6   # degrees — widened to recover Shelburne coastal pixel


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def dataset_last_date() -> datetime:
    """Return the latest timestamp available in NOAA_DHW."""
    url = f"{ERDDAP_BASE}/info/{DATASET_ID}/index.json"
    resp = requests.get(url, timeout=30, verify=True)
    resp.raise_for_status()
    cols, rows = _extract_table(resp.json(), "dataset info")
    row_type_idx  = _require_col(cols, "Row Type")
    var_name_idx  = _require_col(cols, "Variable Name")
    attr_name_idx = _require_col(cols, "Attribute Name")
    value_idx     = _require_col(cols, "Value")
    for row in rows:
        if (row[row_type_idx] == "attribute"
                and row[var_name_idx] == "time"
                and row[attr_name_idx] == "actual_range"):
            max_epoch = float(row[value_idx].split(",")[1].strip())
            return datetime.fromtimestamp(max_epoch, tz=timezone.utc)
    raise RuntimeError("Cannot read time actual_range from ERDDAP info endpoint")


def nearest_ocean_cell(site: dict, sample: datetime) -> tuple[float, float]:
    """
    Query a ±SEARCH_RADIUS box on `sample` and return the (lat, lon) of the
    non-null grid cell closest to the target site coordinates.
    """
    lat, lon = site["lat"], site["lon"]
    r = SEARCH_RADIUS
    t = sample.strftime(f"%Y-%m-%d{TIME_SUFFIX}")
    constraint = (
        f"{VAR}"
        f"[({t}):1:({t})]"
        f"[({lat - r}):1:({lat + r})]"
        f"[({lon - r}):1:({lon + r})]"
    )
    url = f"{ERDDAP_BASE}/griddap/{DATASET_ID}.json?{constraint}"
    resp = requests.get(url, timeout=60, verify=True)
    resp.raise_for_status()
    cols, rows = _extract_table(resp.json(), f"nearest-cell scan for {site['site_id']}")
    lat_i   = _require_col(cols, "latitude")
    lon_i   = _require_col(cols, "longitude")
    sst_i   = _require_col(cols, VAR)

    best_cell, best_dist = None, float("inf")
    for row in rows:
        if row[sst_i] is None:
            continue
        rlat, rlon = row[lat_i], row[lon_i]
        dist = ((rlat - lat) ** 2 + (rlon - lon) ** 2) ** 0.5
        if dist < best_dist:
            best_dist = dist
            best_cell = (rlat, rlon)

    if best_cell is None:
        raise RuntimeError(
            f"No valid SST cell found within {r}° of "
            f"{site['site_id']} on {sample.date()}"
        )
    return best_cell


def erddap_timeseries(
    cell_lat: float, cell_lon: float, start: datetime, end: datetime
) -> list[dict]:
    """Fetch a full time series for an exact grid cell; return [{date, sst}]."""
    t0 = start.strftime(f"%Y-%m-%d{TIME_SUFFIX}")
    t1 = end.strftime(f"%Y-%m-%d{TIME_SUFFIX}")
    constraint = (
        f"{VAR}"
        f"[({t0}):1:({t1})]"
        f"[({cell_lat}):1:({cell_lat})]"
        f"[({cell_lon}):1:({cell_lon})]"
    )
    url = f"{ERDDAP_BASE}/griddap/{DATASET_ID}.json?{constraint}"
    resp = requests.get(url, timeout=60, verify=True)
    resp.raise_for_status()
    cols, rows = _extract_table(resp.json(), f"timeseries for ({cell_lat}, {cell_lon})")
    time_i  = _require_col(cols, "time")
    sst_i   = _require_col(cols, VAR)

    records = []
    for row in rows:
        sst = row[sst_i]
        if sst is None:
            continue
        records.append({
            "date": row[time_i][:10],
            "sst":  round(float(sst), 4),
        })
    return records


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Checking dataset time coverage…")
    last_available = dataset_last_date()

    utc_now  = datetime.now(timezone.utc).replace(hour=12, minute=0, second=0, microsecond=0)
    yesterday = utc_now - timedelta(days=1)
    end      = min(last_available, yesterday)
    start    = end - timedelta(days=29)   # 30-day window

    print(f"Window: {start.date()} → {end.date()} (dataset ends: {last_available.date()})")

    output_dir = Path("output")
    output_dir.mkdir(exist_ok=True)

    all_records: list[dict] = []

    for site in SITES:
        print(f"\n{site['site_id']} ({site['lat']}N {abs(site['lon'])}W)")
        try:
            cell_lat, cell_lon = nearest_ocean_cell(site, end)
            print(f"  nearest ocean cell → ({cell_lat}, {cell_lon})")
            series = erddap_timeseries(cell_lat, cell_lon, start, end)
            for rec in series:
                all_records.append({
                    "site_id": site["site_id"],
                    "date":    rec["date"],
                    "sst":     rec["sst"],
                })
            print(f"  {len(series)} records")
        except Exception as exc:
            print(f"  ERROR: {exc}")

    out_path = output_dir / "sst_history.json"
    out_path.write_text(json.dumps(all_records, indent=2))
    print(f"\nWrote {len(all_records)} records → {out_path}")


if __name__ == "__main__":
    main()
