"""API client for GeoSphere forecast data."""

from __future__ import annotations

from typing import Any

from aiohttp import ClientError

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import FORECAST_DAILY_URL


class GeoSphereApiError(Exception):
    """Error raised for API issues."""


class GeoSphereApiClient:
    """Small async client for GeoSphere daily forecasts."""

    def __init__(self, hass: HomeAssistant) -> None:
        self._session = async_get_clientsession(hass)

    async def async_fetch_daily_forecasts(self) -> dict[str, Any]:
        """Fetch all daily forecasts."""
        try:
            response = await self._session.get(FORECAST_DAILY_URL, timeout=20)
            response.raise_for_status()
            payload: dict[str, Any] = await response.json()
            return payload
        except (TimeoutError, ClientError, ValueError) as err:
            raise GeoSphereApiError(str(err)) from err
