/**
 * astro.js – Accurate astronomical calculations (NOAA / Ed Williams)
 * 
 * ============================================================================================
 *
 * Provides:
 * - JulianDate: converts between Date and Julian Day, Sun mean anomaly, equation of center.
 * - SunPosition: calculates Sun's altitude, declination, right ascension, local sidereal time.
 * - SolarDay: computes sunrise, sunset, and twilight times.
 * 
 * All times are returned as UTC Date objects. Use .toLocaleString() to display in local time.
 *
 * ============================================================================================
 *
 * moonphase – Pure astronomical calculation based on J2000 Epoch
 * 
 * Tracks lunar cycles natively in local time.
 * Phase indexing corrected: primary phases hold a precise 1.5% threshold.
 */

// ========== ANGLE UTILITIES ==========
const Angle = {
    degToRad: (deg) => deg * Math.PI / 180,
    radToDeg: (rad) => rad * 180 / Math.PI,
    normDeg: (deg) => { let r = deg % 360; if (r < 0) r += 360; return r; },
    normRad: (rad) => { let r = rad % (2 * Math.PI); if (r < 0) r += 2 * Math.PI; return r; }
};

// ========== JULIAN DATE ==========
class JulianDate {
    constructor(input) {
        if (input instanceof Date) {
            const millis = input.getTime();
            this.jd = millis / 86400000 + 2440587.5;
        } else if (typeof input === 'number') {
            this.jd = input;
        } else {
            throw new Error('Invalid input: must be Date or number');
        }
    }

    toDate() {
        const millis = (this.jd - 2440587.5) * 86400000;
        return new Date(millis);
    }

    daysSinceJ2000() { return this.jd - 2451545.0; }
    julianCenturies() { return this.daysSinceJ2000() / 36525.0; }

    sunMeanAnomaly() {
        const T = this.julianCenturies();
        let M = 357.5291 + 35999.0503 * T - 0.0001559 * T * T - 0.00000048 * T * T * T;
        return Angle.normDeg(M);
    }

    sunEquationOfCenter() {
        const T = this.julianCenturies();
        const Mrad = Angle.degToRad(this.sunMeanAnomaly());
        const C1 = (1.9148 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad);
        const C2 = (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad);
        const C3 = 0.00029 * Math.sin(3 * Mrad);
        return C1 + C2 + C3;
    }

    sunMeanLongitude() {
        const T = this.julianCenturies();
        return Angle.normDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    }
}

// ========== SUN POSITION ==========
class SunPosition {
    constructor(jd, lat, lon) {
        this.jd = jd;
        this.lat = lat;
        this.lon = lon;

        // Public outputs
        this.declination = null;
        this.rightAscension = null;
        this.localSiderealTime = null;
        this.gmst = null;

        this._compute();
    }

    _compute() {
        const n = this.jd.daysSinceJ2000();
        const L = this.jd.sunMeanLongitude();
        const C = this.jd.sunEquationOfCenter();

        // True ecliptic longitude
        let lambda = L + C;
        lambda = Angle.normDeg(lambda);
        const lambdaRad = Angle.degToRad(lambda);

        // Obliquity
        const T = this.jd.julianCenturies();
        let epsilon = 23.439 - 0.0000004 * T;
        epsilon = Angle.normDeg(epsilon);
        const epsRad = Angle.degToRad(epsilon);

        // Declination
        const sinDec = Math.sin(lambdaRad) * Math.sin(epsRad);
        const decRad = Math.asin(Math.min(1, Math.max(-1, sinDec)));
        this.declination = Angle.radToDeg(decRad);

        // Right Ascension
        let alphaRad = Math.atan2(
            Math.cos(epsRad) * Math.sin(lambdaRad),
            Math.cos(lambdaRad)
        );
        alphaRad = Angle.normRad(alphaRad);
        this.rightAscension = Angle.radToDeg(alphaRad);

        // GMST
        let GMST = 280.46061837 + 360.98564736629 * n;
        GMST = Angle.normDeg(GMST);
        this.gmst = GMST;

        // Local Sidereal Time
        const GMSTrad = Angle.degToRad(GMST);
        const lonRad = Angle.degToRad(this.lon);
        this.localSiderealTime = Angle.radToDeg(Angle.normRad(GMSTrad + lonRad));
    }

    /**
     * Calculate the Sun's altitude at this position and time.
     * @returns {number} Altitude in degrees (positive = above horizon, negative = below).
     */
    altitude() {
        const latRad = Angle.degToRad(this.lat);
        const decRad = Angle.degToRad(this.declination);
        const lstRad = Angle.degToRad(this.localSiderealTime);
        const alphaRad = Angle.degToRad(this.rightAscension);

        let Hrad = lstRad - alphaRad;
        Hrad = Angle.normRad(Hrad);
        this.hourAngle = Angle.radToDeg(Hrad);

        const sinAlt = Math.sin(latRad) * Math.sin(decRad) +
                       Math.cos(latRad) * Math.cos(decRad) * Math.cos(Hrad);
        const altRad = Math.asin(Math.min(1, Math.max(-1, sinAlt)));
        return Angle.radToDeg(altRad);
    }
}

// ========== SOLAR DAY (sunrise, sunset, twilight) ==========
class SolarDay {
    constructor(date, lat, lon) {
        this.lat = lat;
        this.lon = lon;
        this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        this._compute();
    }

    _compute() {
        const noonUTC = Date.UTC(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 12, 0, 0);
        const jd = noonUTC / 86400000 + 2440587.5;
        const getTimes = (depression) => this._sunriseSunset(jd, this.lat, this.lon, depression);
        
        const riseSet = getTimes(0.833);
        this.sunrise = riseSet.rise;
        this.sunset = riseSet.set;
        this.isPolarDay = riseSet.isPolarDay;
        this.isPolarNight = riseSet.isPolarNight;
        
        for (const [name, angle] of [['civil', 6], ['nautical', 12], ['astronomical', 18]]) {
            const times = getTimes(angle);
            this[`${name}Dawn`] = times.rise;
            this[`${name}Dusk`] = times.set;
            this[`${name}TwilightMissing`] = (!times.rise && !times.set);
        }
        
        // Solar noon and nadir
        if (this.sunrise && this.sunset) {
            const riseH = this.sunrise.getUTCHours() + this.sunrise.getUTCMinutes()/60 + this.sunrise.getUTCSeconds()/3600;
            const setH = this.sunset.getUTCHours() + this.sunset.getUTCMinutes()/60 + this.sunset.getUTCSeconds()/3600;
            
            let noonH = (riseH + setH) / 2;
            if (setH < riseH) {
                noonH += 12;
                if (noonH >= 24) noonH -= 24;
            }
            
            const midnightUTC = Date.UTC(this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), 0, 0, 0);
            this.solarNoon = new Date(midnightUTC + noonH * 3600000);
            this.nadir = new Date(midnightUTC + ((noonH + 12) % 24) * 3600000);
        } else {
            this.solarNoon = null;
            this.nadir = null;
        }
    }

    _sunriseSunset(jd, lat, lon, depression) {
        const n = jd - 2451545.0;
        const L = (280.46 + 0.9856474 * n) % 360;
        const g = (357.528 + 0.9856003 * n) % 360;
        const lambda = (L + 1.915 * Math.sin(g * Math.PI/180) + 0.020 * Math.sin(2 * g * Math.PI/180)) % 360;
        const eps = 23.439 - 0.0000004 * n / 365.25;
        const dec = Math.asin(Math.sin(eps * Math.PI/180) * Math.sin(lambda * Math.PI/180)) * 180 / Math.PI;
        const ra = Math.atan2(Math.cos(eps * Math.PI/180) * Math.sin(lambda * Math.PI/180),
                              Math.cos(lambda * Math.PI/180)) * 180 / Math.PI;
        const cosH = (Math.sin((-depression) * Math.PI/180) - Math.sin(lat * Math.PI/180) * Math.sin(dec * Math.PI/180)) /
                     (Math.cos(lat * Math.PI/180) * Math.cos(dec * Math.PI/180));
        if (cosH > 1) return { rise: null, set: null, isPolarDay: false, isPolarNight: true };
        if (cosH < -1) return { rise: null, set: null, isPolarDay: true, isPolarNight: false };
        const H = Math.acos(cosH) * 180 / Math.PI;
        const gmst = (280.46061837 + 360.98564736629 * n) % 360;
        const lst = (ra - lon - gmst + 360) % 360;
        let rise = (lst - H) / 15;
        let set  = (lst + H) / 15;
        if (rise < 0) rise += 24;
        if (set >= 24) set -= 24;
        const dayNoon = Math.floor(jd);
        let riseJD = dayNoon + rise / 24;
        let setJD  = dayNoon + set  / 24;
        if (riseJD < jd - 0.5) riseJD += 1;
        if (riseJD > jd + 0.5) riseJD -= 1;
        if (setJD  < jd - 0.5) setJD  += 1;
        if (setJD  > jd + 0.5) setJD  -= 1;
        const riseMs = (riseJD - 2440587.5) * 86400000;
        const setMs  = (setJD  - 2440587.5) * 86400000;
        return {
            rise: new Date(riseMs),
            set: new Date(setMs),
            isPolarDay: false,
            isPolarNight: false
        };
    }
}

// ========== MOONPHASE ==========
class MoonPhase {
    constructor(latitude = 50.8) {
        // Local timezone equivalent of the J2000 Epoch New Moon baseline
        // Mean New Moon near J2000: January 6, 2000 at 18:14 
        this.epochMeanNewMoon = new Date(2000, 0, 6, 18, 14, 0).getTime();
        this.synodicMonth = 29.530588853; // Precise mean synodic month
        if (latitude < 0) { this.hemisphere = "southern"; } else { this.hemisphere = "northern"; }
    }

    /**
     * Calculate moon phase data using local clock time.
     * @param {Date} [date] - JavaScript Date object (Local time). Uses system time if omitted.
     * @returns {object} Phase data.
     */
    getPhase(date = new Date()) {
        // Calculate raw millisecond difference using local system clock values
        const diffMs = date.getTime() - this.epochMeanNewMoon;
        const diffDays = diffMs / (24 * 3600 * 1000);
        
        // Correct JavaScript negative modulo behavior for historical local dates
        let daysSinceNew = diffDays % this.synodicMonth;
        if (daysSinceNew < 0) daysSinceNew += this.synodicMonth;
        
        const daysUntilNext = this.synodicMonth - daysSinceNew;
        
        // Normalized position in cycle (0.0 to 1.0)
        const phasePosition = daysSinceNew / this.synodicMonth;
        const phaseAngle = phasePosition * 360;
        
        // Illumination percentage (0 to 100)
        const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2 * 100;

        // Corrected Phase Indexing (Primary phases hold a narrow ~11 degree window)
        let phaseName;
        if (phasePosition < 0.03 || phasePosition >= 0.97) phaseName = "New Moon";
        else if (phasePosition < 0.22) phaseName = "Waxing Crescent";
        else if (phasePosition < 0.28) phaseName = "First Quarter";
        else if (phasePosition < 0.47) phaseName = "Waxing Gibbous";
        else if (phasePosition < 0.53) phaseName = "Full Moon";
        else if (phasePosition < 0.72) phaseName = "Waning Gibbous";
        else if (phasePosition < 0.78) phaseName = "Last Quarter";
        else phaseName = "Waning Crescent";

        return {
            phaseName: phaseName,
            phaseAngle: Number(phaseAngle.toFixed(2)),
            illumination: Number(illumination.toFixed(2)),
            daysSinceNew: Number(daysSinceNew.toFixed(4)),
            daysUntilNext: Number(daysUntilNext.toFixed(4)),
            symbol: this._getSymbol(phaseName, this.hemisphere )
        };
    }

    _getSymbol(phaseName, hemisphere) {
        // Hemisphere strings are set in constructor:
        // latitude < 0  → "northern"
        // latitude >= 0 → "southern"
        const northernSymbols = {
            "New Moon": "🌑",
            "Waxing Crescent": "🌒",
            "First Quarter": "🌓",
            "Waxing Gibbous": "🌔",
            "Full Moon": "🌕",
            "Waning Gibbous": "🌖",
            "Last Quarter": "🌗",
            "Waning Crescent": "🌘"
        };
        
        const southernSymbols = {
            "New Moon": "🌑",
            "Waxing Crescent": "🌘",
            "First Quarter": "🌗",
            "Waxing Gibbous": "🌖",
            "Full Moon": "🌕",
            "Waning Gibbous": "🌔",
            "Last Quarter": "🌓",
            "Waning Crescent": "🌒"
        };
        
        if (hemisphere === "northern") {
            return northernSymbols[phaseName] || "🌑";
        } else {
            return southernSymbols[phaseName] || "🌑";
        }
    }
}

// ========== EXPOSE TO BROWSER ==========
window.JulianDate = JulianDate;
window.SunPosition = SunPosition;
window.SolarDay = SolarDay;
window.MoonPhase = MoonPhase;
