"""Sensor platform for GeoSphere forecast integration."""

from __future__ import annotations

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    ATTR_DAILY,
    ATTR_LAST_UPDATED,
    ATTR_LOCATION_NAME,
    ATTR_POINT_ID,
    CONF_POINT_ID,
    DOMAIN,
)
from .coordinator import GeoSphereForecastCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    coordinator: GeoSphereForecastCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([GeoSphereForecastSensor(coordinator, entry)])


class GeoSphereForecastSensor(
    CoordinatorEntity[GeoSphereForecastCoordinator], SensorEntity
):
    """Forecast sensor with 7-day data in attributes."""

    _attr_has_entity_name = True
    _attr_name = "Forecast"
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS

    def __init__(self, coordinator: GeoSphereForecastCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_forecast"

    @property
    def native_value(self):
        """Use today's max temperature as state."""
        if not self.coordinator.data:
            return None
        daily = self.coordinator.data.get("daily", [])
        if not daily:
            return None
        return daily[0].get("high")

    @property
    def extra_state_attributes(self):
        """Expose full daily list for custom card rendering."""
        if not self.coordinator.data:
            return None
        return {
            ATTR_POINT_ID: self.coordinator.data.get(CONF_POINT_ID),
            ATTR_LOCATION_NAME: self.coordinator.data.get("location_name"),
            ATTR_DAILY: self.coordinator.data.get("daily", []),
            ATTR_LAST_UPDATED: self.coordinator.data.get("updated_at"),
        }
