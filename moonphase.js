/**
 * moonphase.js – Accurate lunar phase calculations
 * 
 * Based on the synodic month (29.53058867 days).
 * Reference new moon: 2026-04-17 11:51 UTC (provided by user).
 * 
 * Returns:
 *   - phaseName     : New Moon, Waxing Crescent, First Quarter, Waxing Gibbous,
 *                     Full Moon, Waning Gibbous, Last Quarter, Waning Crescent
 *   - phaseAngle    : 0° = new moon, 90° = first quarter, 180° = full moon, etc.
 *   - illumination  : percentage of the Moon's disc illuminated (0‑100)
 *   - daysSinceNew  : days since last new moon
 *   - daysUntilNext : days until next new moon
 * 
 * No drawing, no canvas – pure data.
 */

class MoonPhase {
    constructor() {
        // Reference new moon: 2026-04-17 11:51 UTC
        this.refNewMoon = new Date(Date.UTC(2026, 3, 17, 11, 51, 0));
        this.synodicMonth = 29.53058867; // days
    }

    /**
     * Calculate moon phase data for a given date (default: now).
     * @param {Date} [date] - JavaScript Date object (local). If omitted, uses current system time.
     * @returns {object} Phase data.
     */
    getPhase(date = new Date()) {
        // Convert local date to UTC for consistency (moon phase depends on UTC)
        const utcDate = new Date(Date.UTC(
            date.getFullYear(), date.getMonth(), date.getDate(),
            date.getHours(), date.getMinutes(), date.getSeconds()
        ));
        const diffDays = (utcDate - this.refNewMoon) / (24 * 3600 * 1000);
        const phaseAngle = ((diffDays / this.synodicMonth) * 360) % 360;
        const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100;

        let phaseName;
        if (phaseAngle < 45) phaseName = "New Moon";
        else if (phaseAngle < 90) phaseName = "Waxing Crescent";
        else if (phaseAngle < 135) phaseName = "First Quarter";
        else if (phaseAngle < 180) phaseName = "Waxing Gibbous";
        else if (phaseAngle < 225) phaseName = "Full Moon";
        else if (phaseAngle < 270) phaseName = "Waning Gibbous";
        else if (phaseAngle < 315) phaseName = "Last Quarter";
        else phaseName = "Waning Crescent";

        // Days since / until new moon
        let daysSinceNew = diffDays % this.synodicMonth;
        if (daysSinceNew < 0) daysSinceNew += this.synodicMonth;
        const daysUntilNext = this.synodicMonth - daysSinceNew;

        return {
            phaseName: phaseName,
            phaseAngle: phaseAngle,
            illumination: illumination,
            daysSinceNew: daysSinceNew,
            daysUntilNext: daysUntilNext,
            // Optional: symbol for quick display
            symbol: this._getSymbol(phaseName)
        };
    }

    _getSymbol(phaseName) {
        const symbols = {
            "New Moon": "🌑",
            "Waxing Crescent": "🌒",
            "First Quarter": "🌓",
            "Waxing Gibbous": "🌔",
            "Full Moon": "🌕",
            "Waning Gibbous": "🌖",
            "Last Quarter": "🌗",
            "Waning Crescent": "🌘"
        };
        return symbols[phaseName] || "🌑";
    }
}

// Export for browser (attach to window)
window.MoonPhase = MoonPhase;
