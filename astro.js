/**
 * astro.js – Accurate astronomical calculations (NOAA / Ed Williams)
 * 
 * Provides:
 * - JulianDate: converts between Date and Julian Day, Sun mean anomaly, equation of center.
 * - SunPosition: calculates Sun's altitude, declination, right ascension, local sidereal time.
 * - SolarDay: computes sunrise, sunset, and twilight times.
 * 
 * All times are returned as UTC Date objects. Use .toLocaleString() to display in local time.
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
            // Date to JD (UTC)
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
}

// ========== SUN POSITION ==========
class SunPosition {
    constructor(jd, lat, lon) {
        this.jd = jd;
        this.latRad = Angle.degToRad(lat);
        this.lonRad = Angle.degToRad(lon);
        this._compute();
    }

    _compute() {
        const M = this.jd.sunMeanAnomaly();
        const C = this.jd.sunEquationOfCenter();
        let lambda = M + C + 180.0;
        lambda = Angle.normDeg(lambda);
        const lambdaRad = Angle.degToRad(lambda);
        const T = this.jd.julianCenturies();
        let epsilon = 23.439 - 0.0000004 * T;
        epsilon = Angle.normDeg(epsilon);
        const epsRad = Angle.degToRad(epsilon);
        const sinDec = Math.sin(lambdaRad) * Math.sin(epsRad);
        this.decRad = Math.asin(Math.min(1, Math.max(-1, sinDec)));
        let alphaRad = Math.atan2(Math.cos(epsRad) * Math.sin(lambdaRad), Math.cos(lambdaRad));
        alphaRad = Angle.normRad(alphaRad);
        this.alphaRad = alphaRad;
        let GMST = 280.46061837 + 360.98564736629 * this.jd.daysSinceJ2000();
        GMST = Angle.normDeg(GMST);
        const GMSTrad = Angle.degToRad(GMST);
        this.LSTrad = Angle.normRad(GMSTrad + this.lonRad);
    }

    altitude() {
        let Hrad = this.LSTrad - this.alphaRad;
        Hrad = Angle.normRad(Hrad);
        const sinAlt = Math.sin(this.latRad) * Math.sin(this.decRad) +
                       Math.cos(this.latRad) * Math.cos(this.decRad) * Math.cos(Hrad);
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

// ========== EXPOSE TO BROWSER ==========
window.JulianDate = JulianDate;
window.SunPosition = SunPosition;
window.SolarDay = SolarDay;
