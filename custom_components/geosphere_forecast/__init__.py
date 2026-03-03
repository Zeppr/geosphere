"""GeoSphere forecast integration."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .api import GeoSphereApiClient
from .const import (
    CARD_FILE_NAME,
    CARD_RESOURCE_VERSION,
    CARD_URL_PATH,
    CONF_DAYS,
    CONF_POINT_ID,
    CONF_SCAN_INTERVAL_MIN,
    DEFAULT_DAYS,
    DEFAULT_POINT_ID,
    DEFAULT_SCAN_INTERVAL_MIN,
    DOMAIN,
)
from .coordinator import GeoSphereForecastCoordinator

PLATFORMS = ["sensor"]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up GeoSphere forecast from a config entry."""
    hass.data.setdefault(DOMAIN, {})

    point_id = int(entry.data.get(CONF_POINT_ID, DEFAULT_POINT_ID))
    days = int(entry.data.get(CONF_DAYS, DEFAULT_DAYS))
    scan_interval = int(
        entry.data.get(CONF_SCAN_INTERVAL_MIN, DEFAULT_SCAN_INTERVAL_MIN)
    )

    api_client = GeoSphereApiClient(hass)
    coordinator = GeoSphereForecastCoordinator(
        hass=hass,
        api_client=api_client,
        point_id=point_id,
        days=days,
        scan_interval_minutes=scan_interval,
    )
    await coordinator.async_config_entry_first_refresh()

    hass.data[DOMAIN][entry.entry_id] = coordinator

    # Make card JS available under /geosphere_forecast/geosphere-forecast-card.js
    frontend_path = Path(__file__).parent / "frontend" / CARD_FILE_NAME
    if not hass.data[DOMAIN].get("static_registered"):
        await hass.http.async_register_static_paths(
            [
                StaticPathConfig(
                    CARD_URL_PATH,
                    str(frontend_path),
                    cache_headers=False,
                )
            ]
        )
        hass.data[DOMAIN]["static_registered"] = CARD_RESOURCE_VERSION

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id, None)
    return unload_ok
