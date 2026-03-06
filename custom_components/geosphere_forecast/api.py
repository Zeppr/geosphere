"""API client for GeoSphere forecast data."""

from __future__ import annotations

from typing import Any

from aiohttp import ClientError

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import FORECAST_DAILY_URL, FORECAST_FLEXI_URL_TEMPLATE, FORECAST_POINTS_URL


class GeoSphereApiError(Exception):
    """Error raised for API issues."""


class GeoSphereApiClient:
    """Small async client for GeoSphere daily forecasts."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._session = async_get_clientsession(hass)

    async def async_fetch_daily_forecasts(self) -> dict[str, Any]:
        """Fetch all daily forecasts."""
        return await self._async_fetch_json(FORECAST_DAILY_URL)

    async def async_fetch_points(self) -> list[dict[str, Any]]:
        """Fetch all forecast points."""
        payload = await self._async_fetch_json(FORECAST_POINTS_URL)
        if not isinstance(payload, list):
            raise GeoSphereApiError("Invalid points payload")
        return payload

    async def async_fetch_flexi_for_point(self, point_id: int) -> dict[str, Any]:
        """Fetch detailed flexi forecast for a point."""
        url = FORECAST_FLEXI_URL_TEMPLATE.format(point_id=point_id)
        return await self._async_fetch_json(url)

    async def _async_fetch_json(self, url: str) -> Any:
        """Fetch JSON document from GeoSphere API."""
        try:
            response = await self._session.get(url, timeout=20)
            response.raise_for_status()
            payload: dict[str, Any] = await response.json()
            return payload
        except (TimeoutError, ClientError, ValueError) as err:
            raise GeoSphereApiError(str(err)) from err
