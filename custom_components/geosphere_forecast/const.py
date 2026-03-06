"""Constants for GeoSphere forecast integration."""

from __future__ import annotations

DOMAIN = "geosphere_forecast"

CONF_POINT_ID = "point_id"
CONF_DAYS = "days"
CONF_SCAN_INTERVAL_MIN = "scan_interval_minutes"

DEFAULT_NAME = "GeoSphere Forecast"
DEFAULT_POINT_ID = 1372
DEFAULT_DAYS = 7
DEFAULT_SCAN_INTERVAL_MIN = 60

MIN_DAYS = 1
MAX_DAYS = 10

FORECAST_DAILY_URL = "https://www.geosphere.at/data/forecasts/daily"
FORECAST_POINTS_URL = "https://www.geosphere.at/data/forecasts/points"
FORECAST_FLEXI_URL_TEMPLATE = "https://www.geosphere.at/data/forecasts/flexi/{point_id}"

CARD_URL_PATH = "/geosphere_forecast/geosphere-forecast-card.js"
CARD_FILE_NAME = "geosphere-forecast-card.js"
CARD_RESOURCE_VERSION = "1.0.0"

ATTR_DAILY = "daily"
ATTR_LOCATION_NAME = "location_name"
ATTR_POINT_ID = "point_id"
ATTR_LAST_UPDATED = "last_updated"
