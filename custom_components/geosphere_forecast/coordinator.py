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

        if selected_feature is None:
            raise UpdateFailed(f"point_id {self._point_id} not found")

        props = selected_feature.get("properties", {})
        forecast_items = props.get("forecast", [])
        if not isinstance(forecast_items, list):
            raise UpdateFailed("Invalid forecast payload")

        daily = []
        for item in forecast_items[: self._days]:
            time_value = item.get("time")
            daily.append(
                {
                    "datetime": time_value,
                    "high": item.get("high"),
                    "low": item.get("low"),
                    "symbol": item.get("symbol"),
                    "warning": item.get("warning"),
                }
            )

        return {
            CONF_POINT_ID: self._point_id,
            CONF_DAYS: self._days,
            "location_name": props.get("name"),
            "daily": daily,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
