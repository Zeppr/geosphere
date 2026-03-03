# GeoSphere Forecast (Home Assistant + HACS)

Custom Home Assistant integration for a 7-day forecast from GeoSphere Austria.

Data source used by this integration:
- `https://www.geosphere.at/data/forecasts/daily`
- filtered by `point_id` (default `1372`)

The URL you provided (`https://geosphere.at/de#tab=chart&point_id=1372`) uses this backend dataset for daily forecasts.

## Features

- Config Flow (UI setup)
- Polling sensor with daily forecast data in attributes
- Custom Lovelace card (`geosphere-forecast-card`)
- HACS-ready structure

## Installation via HACS

1. Push this repository to GitHub.
2. In Home Assistant: HACS -> Integrations -> three dots -> Custom repositories.
3. Add your repo URL as category `Integration`.
4. Install `GeoSphere Forecast`.
5. Restart Home Assistant.

## Setup

1. Home Assistant -> Settings -> Devices & Services -> Add Integration.
2. Search for `GeoSphere Forecast`.
3. Configure:
   - `point_id` (default `1372`)
   - `days` (default `7`)
   - `scan_interval_minutes` (default `60`)

This creates one sensor entity (name depends on your config entry title), for example:
- `sensor.geosphere_1372_forecast`

## Add Lovelace resource

Add a JS resource manually:

- URL: `/geosphere_forecast/geosphere-forecast-card.js`
- Type: `module`

## Card config example

```yaml
type: custom:geosphere-forecast-card
entity: sensor.geosphere_1372_forecast
title: GeoSphere 7 Tage
days: 7
```

## Notes

- The card reads forecast rows from entity attribute `daily`.
- Each row contains: `datetime`, `high`, `low`, `symbol`, `warning`.
