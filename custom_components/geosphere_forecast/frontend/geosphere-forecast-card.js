class GeosphereForecastCard extends HTMLElement {
  static DISPLAY_DAYS = 5;

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You need to define an entity");
    }
    this._config = {
      ...config,
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._content) {
      const card = document.createElement("ha-card");
      this._content = document.createElement("div");
      card.appendChild(this._content);
      this.appendChild(card);
    }

    const stateObj = hass.states[this._config.entity];
    if (!stateObj) {
      this._content.innerHTML = `<div>Entity nicht gefunden: ${this._config.entity}</div>`;
      return;
    }

    const attrs = stateObj.attributes || {};
    const daily = Array.isArray(attrs.daily)
      ? attrs.daily.slice(0, GeosphereForecastCard.DISPLAY_DAYS)
      : [];
    const locationName = attrs.location_name || "Unbekannt";
    const updatedLabel = this._formatUpdated(attrs.last_updated);

    if (!daily.length) {
      this._content.innerHTML = `<div style="padding:12px;">Keine Vorhersagedaten verfuegbar.</div>`;
      return;
    }

    const daysHtml = daily
      .map((day) => {
        const date = day.datetime
          ? new Date(day.datetime).toLocaleDateString("de-AT", {
              weekday: "short",
            })
          : "-";

        const high = this._formatTemp(day.high);
        const low = this._formatTemp(day.low);
        const symbolCode = Number(day.symbol);
        const iconSvg = this._symbolSvg(symbolCode);
        const rr = this._formatRain(day.rr);
        const rainRow =
          rr !== null
            ? `<div class="rain-line"><span class="rain-drop" aria-hidden="true">${this._dropSvg()}</span>${rr} mm</div>`
            : `<div class="rain-line rain-empty"></div>`;

        return `
          <div class="day-col">
            <div class="day-title">${date}</div>
            <div class="weather-icon" aria-hidden="true">${iconSvg}</div>
            <div class="temp-line"><span class="low">${low}</span><span class="temp-sep">|</span><span class="high">${high}</span></div>
            ${rainRow}
          </div>
        `;
      })
      .join("");

    this._content.innerHTML = `
      <style>
        .geosphere-wrap { padding: 12px; }
        .location-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
        .location { font-weight: 600; font-size: 16px; }
        .updated { font-size: 11px; opacity: 0.8; text-align: right; white-space: nowrap; }
        .days-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
        .day-col {
          border: 0;
          border-radius: 8px;
          padding: 4px 3px;
          text-align: center;
          background: var(--card-background-color);
        }
        .day-title { font-size: 11px; font-weight: 600; margin-bottom: 2px; color: var(--primary-text-color); text-transform: capitalize; }
        .weather-icon {
          width: 38px;
          height: 38px;
          margin: 0 auto 2px;
          color: var(--primary-color);
        }
        .weather-icon svg {
          width: 38px;
          height: 38px;
          display: block;
          overflow: visible;
        }
        .temp-line {
          font-size: 13px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 4px;
          white-space: nowrap;
          letter-spacing: 0;
          color: var(--primary-text-color);
        }
        .high { font-weight: 700; }
        .low { font-weight: 700; }
        .temp-sep { color: #a8c319; margin: 0 5px; font-size: 12px; }
        .rain-line {
          min-height: 14px;
          font-size: 11px;
          line-height: 1.2;
          font-weight: 500;
          color: var(--primary-text-color);
          white-space: nowrap;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        .rain-empty { visibility: hidden; }
        .rain-drop { width: 15px; height: 15px; display: inline-block; }
        .rain-drop svg { width: 15px; height: 15px; display: block; }
        @media (max-width: 420px) {
          .geosphere-wrap { padding: 8px; }
          .location-row { margin-bottom: 8px; }
          .location { font-size: 14px; }
          .updated { font-size: 10px; }
          .days-grid { gap: 3px; }
          .day-col { padding: 5px 2px; }
          .day-title { font-size: 10px; }
          .weather-icon, .weather-icon svg { width: 30px; height: 30px; }
          .temp-line { font-size: 11px; }
          .temp-sep { font-size: 11px; margin: 0 3px; }
          .rain-line { font-size: 10px; min-height: 12px; gap: 4px; }
          .rain-drop, .rain-drop svg { width: 12px; height: 12px; }
        }
      </style>
      <div class="geosphere-wrap">
        <div class="location-row">
          <div class="location">${locationName}</div>
          <div class="updated">${updatedLabel}</div>
        </div>
        <div class="days-grid">${daysHtml}</div>
      </div>
    `;
  }

  _formatTemp(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "-";
    }
    return `${Math.round(Number(value))}°C`;
  }

  _formatRain(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }
    const mm = Math.round(Number(value) * 10) / 10;
    if (mm <= 0) {
      return null;
    }
    return mm.toLocaleString("de-AT", { maximumFractionDigits: 1 });
  }

  _formatUpdated(value) {
    if (!value) {
      return "Aktualisiert: -";
    }
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) {
      return "Aktualisiert: -";
    }
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yy = String(dt.getFullYear()).slice(-2);
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `Aktualisiert ${dd}.${mm}.${yy} um ${hh}:${min} Uhr`;
  }

  getCardSize() {
    return 5;
  }

  _symbolVariant(code) {
    const map = {
      1: "sun-clear",
      2: "sun-mostly-clear",
      3: "sun-partly-cloudy",
      4: "sun-mostly-cloudy",
      5: "cloud-overcast",
      6: "fog-ground",
      7: "fog-high",
      8: "rain-light",
      9: "rain-moderate",
      10: "rain-heavy",
      11: "sleet-light",
      12: "sleet-moderate",
      13: "sleet-heavy",
      14: "snow-light",
      15: "snow-moderate",
      16: "snow-heavy",
      17: "shower-light",
      18: "shower-moderate",
      19: "shower-heavy",
      20: "sleet-shower-light",
      21: "sleet-shower-moderate",
      22: "sleet-shower-heavy",
      23: "snow-shower-light",
      24: "snow-shower-moderate",
      25: "snow-shower-heavy",
      26: "thunder-light",
      27: "thunder-moderate",
      28: "thunder-heavy",
      29: "thunder-sleet-light",
      30: "thunder-sleet-heavy",
      31: "thunder-snow-light",
      32: "thunder-snow-heavy",
    };
    return map[code] || "cloud-overcast";
  }

  _symbolSvg(code) {
    const variant = this._symbolVariant(code);
    const cSun = "#f6c443";
    const cCloud = "#9fa4ab";
    const cCloudDark = "#5f646b";
    const cRain = "#7fc8ff";
    const cFog = "#ffffff";
    const cStroke = "#6f7680";
    const cBolt = "#ffd54f";
    const cSnow = "#ffffff";

    const sun = `
      <circle cx="12" cy="10.5" r="4.3" fill="${cSun}" stroke="#d6a72a" stroke-width="0.8"/>
      <path d="M12 2.4v2.3M12 16.4v2.3M4 10.5h2.3M17.7 10.5H20M6.1 4.6l1.6 1.6M16.3 14.8l1.6 1.6M6.1 16.4l1.6-1.6M16.3 6.2l1.6-1.6" fill="none" stroke="${cSun}" stroke-linecap="round" stroke-width="1.6"/>
    `;
    const cloudSmall = `
      <path d="M10.2 18.2h7.4a2.9 2.9 0 0 0 0-5.8h-.2a3.8 3.8 0 0 0-7.1-1.1 3 3 0 1 0-.1 6.9Z" fill="#d6d9dd" stroke="#8f98a1" stroke-linejoin="round" stroke-width="1"/>
    `;
    const cloudMedium = `
      <path d="M8.8 18.1h8.8a3.4 3.4 0 0 0 0-6.8h-.2a4.3 4.3 0 0 0-8.3-1.2 3.4 3.4 0 1 0-.3 8Z" fill="#c6ccd2" stroke="#8a949d" stroke-linejoin="round" stroke-width="1"/>
    `;
    const cloudLarge = `
      <path d="M7.6 18h10a3.7 3.7 0 0 0 0-7.4h-.2a4.7 4.7 0 0 0-9-1.3A3.7 3.7 0 1 0 7.6 18Z" fill="#b6bec6" stroke="#7f8993" stroke-linejoin="round" stroke-width="1"/>
    `;
    const cloudOvercast = `
      <path d="M6.8 18h10.8a4 4 0 0 0 0-8h-.2a5 5 0 0 0-9.6-1.4A4 4 0 1 0 6.8 18Z" fill="#9ea6af" stroke="#717c87" stroke-linejoin="round" stroke-width="1"/>
    `;
    const cloudDark = `
      <path d="M7.1 18h10.2a3.8 3.8 0 0 0 0-7.6h-.2a4.9 4.9 0 0 0-9.4-1.3 3.8 3.8 0 1 0-.6 7.6Z" fill="${cCloudDark}" stroke="#4b4f55" stroke-linejoin="round" stroke-width="1"/>
    `;
    const rain = (count) =>
      Array.from({ length: count }, (_, i) => {
        const x = 8 + i * 3.2;
        return `<ellipse cx="${x}" cy="21" rx="1" ry="1.6" fill="${cRain}"/>`;
      }).join("");
    const snow = (count) =>
      Array.from({ length: count }, (_, i) => {
        const x = 9 + i * 3.3;
        return `<circle cx="${x}" cy="21" r="1.05" fill="${cSnow}" stroke="#e8edf3" stroke-width="0.6"/>`;
      }).join("");
    const thunder = `
      <path d="M13.6 14.2h-2.2l1-3.3-2.8 4.5h2.2l-.9 3 2.7-4.2Z" fill="${cBolt}" stroke="#d6ad2d" stroke-linejoin="round" stroke-width="0.9"/>
    `;
    const thunder2 = `
      <path d="M11.2 14.2H9l1-3.3-2.8 4.5h2.2l-.9 3 2.7-4.2Z" fill="${cBolt}" stroke="#d6ad2d" stroke-linejoin="round" stroke-width="0.9"/>
    `;
    const fogGround = `
      <path d="M4.5 10.8h15M3.5 13.7h17M5 16.6h14" fill="none" stroke="${cFog}" stroke-linecap="round" stroke-width="1.8"/>
    `;
    const fogHigh = `
      <path d="M5.8 9.8h12.4M4.8 12.7h14.4M6.2 15.6h11.6" fill="none" stroke="${cFog}" stroke-linecap="round" stroke-width="1.4"/>
    `;

    let body = cloudMedium;
    if (variant === "sun-clear") {
      body = sun;
    } else if (variant === "sun-mostly-clear") {
      body = `<g opacity="0.98">${sun}</g>${cloudSmall}`;
    } else if (variant === "sun-partly-cloudy") {
      body = `<g opacity="0.97">${sun}</g>${cloudMedium}`;
    } else if (variant === "sun-mostly-cloudy") {
      body = `<g opacity="0.92">${sun}</g>${cloudLarge}`;
    } else if (variant === "cloud-overcast") {
      body = cloudOvercast;
    } else if (variant === "fog-ground") {
      body = `${cloudOvercast}${fogGround}`;
    } else if (variant === "fog-high") {
      body = `${cloudLarge}${fogHigh}`;
    } else if (variant === "rain-light") {
      body = `${cloudLarge}${rain(2)}`;
    } else if (variant === "rain-moderate") {
      body = `${cloudLarge}${rain(3)}`;
    } else if (variant === "rain-heavy") {
      body = `${cloudOvercast}${rain(4)}`;
    } else if (variant === "sleet-light") {
      body = `${cloudLarge}${rain(1)}${snow(1)}`;
    } else if (variant === "sleet-moderate") {
      body = `${cloudLarge}${rain(2)}${snow(2)}`;
    } else if (variant === "sleet-heavy") {
      body = `${cloudOvercast}${rain(3)}${snow(2)}`;
    } else if (variant === "snow-light") {
      body = `${cloudLarge}${snow(2)}`;
    } else if (variant === "snow-moderate") {
      body = `${cloudLarge}${snow(3)}`;
    } else if (variant === "snow-heavy") {
      body = `${cloudOvercast}${snow(4)}`;
    } else if (variant === "shower-light") {
      body = `<g opacity="0.95">${sun}</g>${cloudMedium}${rain(2)}`;
    } else if (variant === "shower-moderate") {
      body = `<g opacity="0.9">${sun}</g>${cloudLarge}${rain(3)}`;
    } else if (variant === "shower-heavy") {
      body = `${cloudOvercast}${rain(4)}`;
    } else if (variant === "sleet-shower-light") {
      body = `<g opacity="0.95">${sun}</g>${cloudMedium}${rain(1)}${snow(1)}`;
    } else if (variant === "sleet-shower-moderate") {
      body = `<g opacity="0.9">${sun}</g>${cloudLarge}${rain(2)}${snow(2)}`;
    } else if (variant === "sleet-shower-heavy") {
      body = `${cloudOvercast}${rain(3)}${snow(3)}`;
    } else if (variant === "snow-shower-light") {
      body = `<g opacity="0.95">${sun}</g>${cloudMedium}${snow(2)}`;
    } else if (variant === "snow-shower-moderate") {
      body = `<g opacity="0.9">${sun}</g>${cloudLarge}${snow(3)}`;
    } else if (variant === "snow-shower-heavy") {
      body = `${cloudOvercast}${snow(4)}`;
    } else if (variant === "thunder-light") {
      body = `${cloudDark}${rain(2)}${thunder}`;
    } else if (variant === "thunder-moderate") {
      body = `${cloudDark}${rain(3)}${thunder}`;
    } else if (variant === "thunder-heavy") {
      body = `${cloudDark}${rain(4)}${thunder}${thunder2}`;
    } else if (variant === "thunder-sleet-light") {
      body = `${cloudDark}${rain(1)}${snow(1)}${thunder}`;
    } else if (variant === "thunder-sleet-heavy") {
      body = `${cloudDark}${rain(3)}${snow(2)}${thunder}${thunder2}`;
    } else if (variant === "thunder-snow-light") {
      body = `${cloudDark}${snow(2)}${thunder}`;
    } else if (variant === "thunder-snow-heavy") {
      body = `${cloudDark}${snow(4)}${thunder}${thunder2}`;
    }

    return `<svg viewBox="0 0 24 24" role="img" focusable="false">${body}</svg>`;
  }

  _dropSvg() {
    return `<svg viewBox="0 0 24 24" role="img" focusable="false"><path d="M12 3.2c0 0-5.5 6-5.5 10a5.5 5.5 0 1 0 11 0c0-4-5.5-10-5.5-10Zm0 2.8c1.8 2.2 4 5.4 4 7.2a4 4 0 0 1-8 0c0-1.8 2.2-5 4-7.2Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;
  }

  _symbolText(code) {
    const map = {
      1: "Wolkenlos",
      2: "Heiter",
      3: "Wolkig",
      4: "Stark bewoelkt",
      5: "Bedeckt",
      6: "Bodennebel",
      7: "Hochnebel",
      8: "Leichter Regen",
      9: "Maessiger Regen",
      10: "Starker Regen",
      11: "Schneeregen",
      12: "Schneeregen",
      13: "Schneeregen",
      14: "Leichter Schneefall",
      15: "Maessiger Schneefall",
      16: "Starker Schneefall",
      17: "Regenschauer",
      18: "Regenschauer",
      19: "Starker Regenschauer",
      20: "Schneeregenschauer",
      21: "Schneeregenschauer",
      22: "Schneeregenschauer",
      23: "Schneeschauer",
      24: "Schneeschauer",
      25: "Starker Schneeschauer",
      26: "Gewitter",
      27: "Gewitter",
      28: "Starkes Gewitter",
      29: "Gewitter mit Schneeregen",
      30: "Starkes Gewitter mit Schneeregen",
      31: "Gewitter mit Schneefall",
      32: "Starkes Gewitter mit Schneefall",
    };
    return map[code] || "Unbekannt";
  }

  static getStubConfig() {
    return {
      entity: "sensor.geosphere_forecast_forecast",
    };
  }
}

customElements.define("geosphere-forecast-card", GeosphereForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "geosphere-forecast-card",
  name: "GeoSphere Forecast Card",
  description: "Zeigt 7 Tage Vorhersage aus der GeoSphere Integration",
});
