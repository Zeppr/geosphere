"""DataUpdateCoordinator for GeoSphere forecast integration."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import GeoSphereApiClient, GeoSphereApiError
from .const import CONF_DAYS, CONF_POINT_ID, DOMAIN

_LOGGER = logging.getLogger(__name__)


class GeoSphereForecastCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Coordinator fetching and filtering forecast data for one point."""

    def __init__(
        self,
        hass,
        api_client: GeoSphereApiClient,
        point_id: int,
        days: int,
        scan_interval_minutes: int,
    ) -> None:
        super().__init__(
            hass,
            logger=_LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=scan_interval_minutes),
        )
        self._api_client = api_client
        self._point_id = point_id
        self._days = days

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            raw = await self._api_client.async_fetch_daily_forecasts()
        except GeoSphereApiError as err:
            raise UpdateFailed(err) from err

        features = raw.get("features")
        if not isinstance(features, list):
            raise UpdateFailed("Missing features in GeoSphere response")

        selected_feature: dict[str, Any] | None = None
        for feature in features:
            props = feature.get("properties", {})
            if props.get("point_id") == self._point_id:
                selected_feature = feature
                break

        location_name: str | None = None
        if selected_feature is not None:
            props = selected_feature.get("properties", {})
            forecast_items = props.get("forecast", [])
            if not isinstance(forecast_items, list):
                raise UpdateFailed("Invalid forecast payload")

            daily = []
            for item in forecast_items[: self._days]:
                daily.append(
                    {
                        "datetime": item.get("time"),
                        "high": item.get("high"),
                        "low": item.get("low"),
                        "rr": item.get("rr", 0),
                        "symbol": item.get("symbol"),
                        "warning": item.get("warning"),
                    }
                )
        else:
            # Fallback: for many local points (e.g. 1372), daily endpoint has no entry.
            # We aggregate daily highs/lows from flexi point data.
            daily, location_name = await self._async_build_daily_from_flexi()

        if not location_name:
            location_name = await self._async_resolve_location_name()

        return {
            CONF_POINT_ID: self._point_id,
            CONF_DAYS: self._days,
            "location_name": location_name,
            "daily": daily,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def _async_resolve_location_name(self) -> str | None:
        """Try to resolve point display name via points endpoint."""
        try:
            points = await self._api_client.async_fetch_points()
        except GeoSphereApiError:
            return None
        for point in points:
            if point.get("point_id") == self._point_id:
                return point.get("name")
        return None

    async def _async_build_daily_from_flexi(self) -> tuple[list[dict[str, Any]], str | None]:
        """Build daily summary values from flexi timeseries for a point."""
        try:
            flexi = await self._api_client.async_fetch_flexi_for_point(self._point_id)
        except GeoSphereApiError as err:
            raise UpdateFailed(f"point_id {self._point_id} not found") from err

        timestamps = flexi.get("timestamps")
        features = flexi.get("features")
        if not isinstance(timestamps, list) or not isinstance(features, list) or not features:
            raise UpdateFailed("Invalid flexi payload")

        params = features[0].get("properties", {}).get("parameters", {})
        t2m = params.get("t2m", {}).get("data", [])
        sy = params.get("sy", {}).get("data", [])
        rr = params.get("rr", {}).get("data", [])

        if not isinstance(t2m, list) or not isinstance(sy, list) or not isinstance(rr, list):
            raise UpdateFailed("Invalid flexi parameter payload")

        grouped: dict[str, dict[str, Any]] = {}
        series_len = min(len(timestamps), len(t2m), len(sy), len(rr))
        for idx in range(series_len):
            ts = timestamps[idx]
            if not isinstance(ts, str) or len(ts) < 10:
                continue
            day_key = ts[:10]
            bucket = grouped.setdefault(
                day_key, {"high": None, "low": None, "rr": 0.0, "symbols": [], "warning": 0}
            )

            temp = t2m[idx]
            if isinstance(temp, (int, float)):
                bucket["high"] = temp if bucket["high"] is None else max(bucket["high"], temp)
                bucket["low"] = temp if bucket["low"] is None else min(bucket["low"], temp)

            symbol = sy[idx]
            if isinstance(symbol, int):
                bucket["symbols"].append(symbol)

            rain = rr[idx]
            if isinstance(rain, (int, float)):
                bucket["rr"] += float(rain)

        daily: list[dict[str, Any]] = []
        for day_key in sorted(grouped.keys())[: self._days]:
            bucket = grouped[day_key]
            symbol = None
            if bucket["symbols"]:
                counts: dict[int, int] = {}
                for code in bucket["symbols"]:
                    counts[code] = counts.get(code, 0) + 1
                symbol = max(counts, key=counts.get)
            daily.append(
                {
                    "datetime": day_key,
                    "high": bucket["high"],
                    "low": bucket["low"],
                    "rr": round(bucket["rr"], 1),
                    "symbol": symbol,
                    "warning": 0,
                }
            )

        if not daily:
            raise UpdateFailed(f"point_id {self._point_id} not found")

        location_name = await self._async_resolve_location_name()
        return daily, location_name
