"""Config flow for GeoSphere forecast integration."""

from __future__ import annotations

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.helpers.selector import NumberSelector, NumberSelectorConfig

from .const import (
    CONF_DAYS,
    CONF_POINT_ID,
    CONF_SCAN_INTERVAL_MIN,
    DEFAULT_DAYS,
    DEFAULT_POINT_ID,
    DEFAULT_SCAN_INTERVAL_MIN,
    DOMAIN,
    MAX_DAYS,
    MIN_DAYS,
)


class GeosphereForecastConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for GeoSphere forecast."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            point_id = int(user_input[CONF_POINT_ID])
            normalized = {
                CONF_POINT_ID: point_id,
                CONF_DAYS: int(user_input[CONF_DAYS]),
                CONF_SCAN_INTERVAL_MIN: int(user_input[CONF_SCAN_INTERVAL_MIN]),
            }

            await self.async_set_unique_id(str(point_id))
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=f"GeoSphere {point_id}",
                data=normalized,
            )

        schema = vol.Schema(
            {
                vol.Required(CONF_POINT_ID, default=DEFAULT_POINT_ID): NumberSelector(
                    NumberSelectorConfig(mode="box", min=1, step=1)
                ),
                vol.Required(CONF_DAYS, default=DEFAULT_DAYS): NumberSelector(
                    NumberSelectorConfig(mode="box", min=MIN_DAYS, max=MAX_DAYS, step=1)
                ),
                vol.Required(
                    CONF_SCAN_INTERVAL_MIN,
                    default=DEFAULT_SCAN_INTERVAL_MIN,
                ): NumberSelector(
                    NumberSelectorConfig(mode="box", min=5, max=180, step=1)
                ),
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema)
