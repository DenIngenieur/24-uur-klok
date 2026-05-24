/**
 * 24u TEGEN DE KLOK IN KLOK – OOP met vloeiende schemeringsovergang & Maanfase
 * 
 * Maakt gebruik van SolarDay en MoonPhase uit astro.js / moonphase.js.
 * Maanfase wordt eenmaal per dag berekend en in het midden van de wijzerplaat weergegeven.
 * 
 * Afhankelijkheden: astro.js moet vóór dit bestand worden geladen.
 */

// ========== CONFIGURATIE ==========
const CONFIG = {
    size: 500,
    showEveryNthHour: 1,
    showEveryNthMinute: 5,
    gradientMargin: 25,
    gradientOpacity: 0.85,
    gradientSteps: 720, // 0.5° per stap
    locationPrecision: 2, // decimalen voor locatie-cache-sleutel
    
    hourTrackerEnabled: true,
    hourTrackerRadius: 5,
    hourTrackerGlow: true,
    
    // Maan instellingen
    moonRadiusRatio: 0.33,      // 1/3 van de klokradius
    moonGlowBlur: 6,
    moonGlowOpacity: 0.15,
    moonDarkColor: "#1a1d2e",
    moonLightColor: "#fff8e0",
    moonBorderColor: "rgba(255,255,240,0.3)",

    // Vertalingen (NL actief, EN als commentaar)
    moonPhaseNames: {
        "New Moon": "Nieuwe Maan",
        // "New Moon": "New Moon",
        "Waxing Crescent": "Wassende Halve Maan",
        // "Waxing Crescent": "Waxing Crescent",
        "First Quarter": "Eerste Kwartier",
        // "First Quarter": "First Quarter",
        "Waxing Gibbous": "Wassende Maan",
        // "Waxing Gibbous": "Waxing Gibbous",
        "Full Moon": "Volle Maan",
        // "Full Moon": "Full Moon",
        "Waning Gibbous": "Afnemende Maan",
        // "Waning Gibbous": "Waning Gibbous",
        "Last Quarter": "Laatste Kwartier",
        // "Last Quarter": "Last Quarter",
        "Waning Crescent": "Afnemende Halve Maan"
        // "Waning Crescent": "Waning Crescent"
    },
    // locatie-gerelateerde berichten
    location: {
        geolocationNotSupported: "🌐 Geolocatie wordt niet ondersteund – standaardwaarde 50.81°N, 3.11°E gebruikt",
        // geolocationNotSupported: "🌐 Geolocation not supported – using fallback 50.81°N, 3.11°E",
        requestingLocation: "📍 Locatie wordt opgehaald...",
        // requestingLocation: "📍 Requesting location...",
        geolocationDenied: "⚠️ Locatietoegang geweigerd – standaardwaarde 50.81°N, 3.11°E gebruikt",
        // geolocationDenied: "⚠️ Geolocation denied – using fallback 50.81°N, 3.11°E",
        fallbackCoordinates: { latitude: 50.81, longitude: 3.11 },
        fallbackCoordinatesText: "50.81°N, 3.11°E"
    },
    hemisphere: {
        northern: "Noordelijk",
        // northern: "Northern",
        southern: "Zuidelijk"
        // southern: "Southern"
    },
    coordinateDisplay: {
        format: "🌞 {hemisphere} halfrond | {latitude}° {longitude}°"
        // format: "🌞 {hemisphere} hemisphere | {latitude}° {longitude}°"
    },
    // labels voor feedback. Wijzig deze waarden om de UI-tekst te vertalen.
    labels: {
        day: "Dag",
        // day: "Day",
        latitude: "Breedtegraad"
        // latitude: "Latitude"
    },

    // Kleuren om uit te kiezen :-)
    colors: {
        background: "#0a0e1a",
        dialFace: "#111625",
        dialBorder: "#2a3550",
        marginRing: "#1a1e2e",
        textGeneral: "#fff5e0",
        minuteMarkers: "#ffffff",
        hourHand: "#f0f3ff",
        minuteHand: "#b9c7d9",
        secondHand: "#ff4d6d",
        tickMajor: "#ffffff",
        tickMinor: "#5b6e8c",
        // Schemering ankerkleuren (HSL-waarden) - meer natuurlijke hemelkleuren
        deepNight: { h: 235, s: 70, l: 8 },
        astronomical: { h: 240, s: 55, l: 18 },
        nautical: { h: 250, s: 40, l: 30 },
        civil: { h: 280, s: 30, l: 45 },
        sunrise: { h: 35, s: 60, l: 55 },
        solarNoon: { h: 50, s: 40, l: 75 },
        polarDay: { h: 51, s: 100, l: 70 }
    },
    
    handLengths: { hour: 0.38, minute: 0.58, second: 0.72 },
    handWidths: { hour: 6, minute: 4, second: 2 },
    updateInterval: 250,
};

// ========== GLOBALE HOEK-UTILITIES ==========
// Hergebruik van astro.js's Angle-object (geen duplicatie)
// Angle is globaal gedefinieerd door astro.js. We gebruiken het direct.
function degToRad(d) { return Angle.degToRad(d); }
function hourToAngle(h) { return -(h * 15) + 90; }
function minuteToAngle(m) { return -(m * 6) - 90; }
function secondToAngle(s) { return -(s * 6) - 90; }

function getPosition(angleDeg, radius, cx, cy) {
    const rad = degToRad(angleDeg);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// ========== KLEUR-UTILITIES ==========
function hslToString(h, s, l, alpha = CONFIG.gradientOpacity) {
    return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

function lerpHSL(color1, color2, t) {
    let h1 = color1.h, h2 = color2.h;
    let dh = h2 - h1;
    if (Math.abs(dh) > 180) {
        if (dh > 0) h1 += 360;
        else h2 += 360;
    }
    return {
        h: (h1 + (h2 - h1) * t) % 360,
        s: color1.s + (color2.s - color1.s) * t,
        l: color1.l + (color2.l - color1.l) * t
    };
}

// ========== TIJDSBRON ==========
class TimeSource {
    constructor() {
        this.dayOfYearOverride = null;  // null = gebruik echte vandaag
    }
    
    getCurrentTime() {
        const now = new Date();
        
        let date;
        if (this.dayOfYearOverride !== null) {
            date = new Date(now.getFullYear(), 0, this.dayOfYearOverride);
            date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        } else {
            date = now;
        }
        
        return {
            date: date,
            timestamp: date.getTime(),
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hours: date.getHours(),
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            decimalHours: date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600,
            decimalMinutes: date.getMinutes() + date.getSeconds()/60,
            dateKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        };
    }
}

// ========== HOLOCENE TIJDSTEMPEL ==========
class HoloceneTimestamp {
    constructor() {
        this.element = document.getElementById('timestamp');
        this.lastSecond = -1;
    }
    update(timeData) {
        if (!this.element) return;
        // Alleen bijwerken als seconden veranderen
        if (timeData.seconds === this.lastSecond) return;
        this.lastSecond = timeData.seconds;
        
        const year = timeData.year + 10000;
        const month = String(timeData.month+1).padStart(2,'0');
        const day = String(timeData.day).padStart(2,'0');
        const hours = String(timeData.hours).padStart(2,'0');
        const minutes = String(timeData.minutes).padStart(2,'0');
        const seconds = String(timeData.seconds).padStart(2,'0');
        this.element.textContent = `HE ${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
}

// ========== GEOLOCATIE AFHANDELAAR ==========
class GeolocationHandler {
    constructor() {
        this.latitude = 50.80724821763106;
        this.longitude = 3.113920551703155;
        this.onLocationChange = null;
    }

    init() {
        const statusEl = document.getElementById('statusMessage');
        if (!navigator.geolocation) {
            if (statusEl) statusEl.textContent = CONFIG.location.geolocationNotSupported;
            return;
        }
        if (statusEl) statusEl.textContent = CONFIG.location.requestingLocation;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.latitude = pos.coords.latitude;
                this.longitude = pos.coords.longitude;
                const hem = this.latitude >= 0 ? CONFIG.hemisphere.northern : CONFIG.hemisphere.southern;
                if (statusEl) statusEl.textContent = CONFIG.coordinateDisplay.format
                    .replace('{hemisphere}', hem)
                    .replace('{latitude}', this.latitude.toFixed(1))
                    .replace('{longitude}', this.longitude.toFixed(1));
                if (this.onLocationChange) this.onLocationChange(this.latitude, this.longitude);
            },
            (err) => {
                if (statusEl) statusEl.textContent = CONFIG.location.geolocationDenied;
                if (this.onLocationChange) this.onLocationChange(
                    CONFIG.location.fallbackCoordinates.latitude,
                    CONFIG.location.fallbackCoordinates.longitude
                );
            }
        );
    }

    getLocationKey() {
        const prec = CONFIG.locationPrecision;
        return `${this.latitude.toFixed(prec)}/${this.longitude.toFixed(prec)}`;
    }
}

// ========== MAAN RENDERDER ==========
class MoonRenderer {
    constructor(config, cx, cy, radius, latitude) {
        this.config = config;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.latitude = latitude;
        this.moonPhase = new MoonPhase(latitude); // latitude toegevoegd voor maaniconen
        this.cachedPhase = null;
        this.cacheDate = null;
    }

    updatePosition(cx, cy, radius, latitude) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.latitude = latitude;
        
        // --- DIT TOEVOEGEN ---
        // Maanfase-object opnieuw aanmaken met de nieuwe latitude
        this.moonPhase = new MoonPhase(latitude);
        this.cacheDate = null;   // Forceer herberekening van de fase bij volgende tekening
    }
    
    updatePhase(timeData) {
        if (this.cacheDate !== timeData.dateKey) {
            this.cachedPhase = this.moonPhase.getPhase(timeData.date);
            this.cacheDate = timeData.dateKey;
        }
    }

    draw(ctx) {
        if (!this.cachedPhase) return;

        const phaseName = this.cachedPhase.phaseName;
        const illumination = this.cachedPhase.illumination;
        const isWaxing = phaseName.includes("Waxing") || phaseName === "First Quarter";
        const useBottomSemicircle = !isWaxing && phaseName !== "New Moon" && phaseName !== "Full Moon";

        ctx.save();
        ctx.translate(this.cx, this.cy);
        
        // Parallactische rotatie op basis van breedtegraad
        let rotation = -(this.latitude * Math.PI / 180);
        ctx.rotate(rotation);
        
        // Gloed
        ctx.shadowBlur = this.config.moonGlowBlur;
        ctx.shadowColor = `rgba(255, 255, 240, ${this.config.moonGlowOpacity})`;
        
        // 1. Donkere volle maan basis
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.config.moonDarkColor;
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // 2. Lichte halfcirkel (boven voor wassend, onder voor afnemend)
        let startAngle = useBottomSemicircle ? Math.PI : 0;
        let endAngle = useBottomSemicircle ? 2 * Math.PI : Math.PI;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, startAngle, endAngle, false);
        ctx.fillStyle = this.config.moonLightColor;
        ctx.fill();
        
        // 3. Ellips masker (exact zoals in origineel)
        let wFactor = (illumination / 50) - 1;
        let ellipseHeight = Math.abs(this.radius * wFactor);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, ellipseHeight, 0, 0, Math.PI * 2);
        ctx.fillStyle = illumination < 50 ? this.config.moonDarkColor : this.config.moonLightColor;
        ctx.fill();
        
        // Rand
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.config.moonBorderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

// ========== MAANFASE WEERGAVE ==========
class MoonPhaseDisplay {
    constructor() {
        this.element = document.getElementById('moonPhase');
        this.lastDisplay = null;
    }
    update(phaseData) {
        if (!this.element || !phaseData) return;
        const percent = Math.round(phaseData.illumination);
        //const displayString = `${phaseData.symbol} ${phaseData.phaseName} (${percent}%)`;
        const displayString = `${phaseData.symbol} ${CONFIG.moonPhaseNames[phaseData.phaseName]} (${percent}%)`;
        // Alleen DOM bijwerken als de fase daadwerkelijk is veranderd
        if (this.lastDisplay === displayString) return;
        this.lastDisplay = displayString;
        this.element.textContent = displayString;
    }
}

// ========== KLOKWIJZERPLAAT ==========
class ClockDial {
    constructor(ctx, cx, cy, radius, config) {
        this.ctx = ctx;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.config = config;
        // Voorbereken uur- en halfuurhoeken
        this._hourAngles = [];
        this._halfHourAngles = [];
        for (let h = 0; h < 24; h++) {
            this._hourAngles.push(hourToAngle(h));
            this._halfHourAngles.push(hourToAngle(h + 0.5));
        }
    }
    
    updatePosition(cx, cy, radius) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
    }
    
    draw() {
        this._drawTicks();
        this._drawHourNumbers();
        this._drawMinuteMarkers();
        this._drawBorder();
    }
    
    _drawTicks() {
        const ctx = this.ctx;
        const start = this.radius - 20;
        const end = this.radius - 4;
        
        ctx.save();
        
        // Uurstrepen
        for (let h = 0; h < 24; h++) {
            const angle = this._hourAngles[h];
            const p1 = getPosition(angle, start, this.cx, this.cy);
            const p2 = getPosition(angle, end, this.cx, this.cy);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = (h % 6 === 0) ? 3 : 1.5;
            ctx.strokeStyle = this.config.colors.tickMajor;
            ctx.stroke();
        }
        
        // Halfuurstrepen
        const minorStart = start + 3;
        const minorEnd = end - 2;
        for (let h = 0; h < 24; h++) {
            const angle = this._halfHourAngles[h];
            const p1 = getPosition(angle, minorStart, this.cx, this.cy);
            const p2 = getPosition(angle, minorEnd, this.cx, this.cy);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.config.colors.tickMinor;
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    _drawHourNumbers() {
        const ctx = this.ctx;
        const r = this.radius + 18;
        
        ctx.save();
        ctx.font = `bold ${Math.floor(this.radius * 0.08)}px "Segoe UI", monospace`;
        ctx.fillStyle = this.config.colors.textGeneral;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        for (let h = 0; h < 24; h++) {
            if (h % this.config.showEveryNthHour !== 0) continue;
            const angle = this._hourAngles[h];
            const pos = getPosition(angle, r, this.cx, this.cy);
            ctx.fillText(h.toString(), pos.x, pos.y);
        }
        
        ctx.restore();
    }
    
    _drawMinuteMarkers() {
        const ctx = this.ctx;
        const r = this.radius * 0.7;
        
        ctx.save();
        ctx.font = `bold ${Math.floor(this.radius * 0.08)}px "Segoe UI", monospace`;
        ctx.fillStyle = this.config.colors.minuteMarkers;
        ctx.shadowBlur = 2;
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1.5;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        for (let m = 0; m < 60; m++) {
            if (m % this.config.showEveryNthMinute !== 0) continue;
            const angle = minuteToAngle(m);
            const pos = getPosition(angle, r, this.cx, this.cy);
            ctx.strokeText(m.toString(), pos.x, pos.y);
            ctx.fillText(m.toString(), pos.x, pos.y);
        }
        
        ctx.restore();
    }
    
    _drawBorder() {
        const ctx = this.ctx;
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.radius, 0, 2*Math.PI);
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.config.colors.dialBorder;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, this.radius - 12, 0, 2*Math.PI);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,200,0.2)";
        ctx.stroke();
        
        ctx.restore();
    }
}

// ========== KLOKWIJZERS ==========
class ClockHands {
    constructor(ctx, cx, cy, maxRadius, config) {
        this.ctx = ctx;
        this.cx = cx;
        this.cy = cy;
        this.maxRadius = maxRadius;
        this.config = config;
    }
    
    updatePosition(cx, cy, maxRadius) {
        this.cx = cx;
        this.cy = cy;
        this.maxRadius = maxRadius;
    }
    
    draw(time) {
        this._drawHand(hourToAngle(time.decimalHours), this.config.handLengths.hour, this.config.handWidths.hour, this.config.colors.hourHand);
        this._drawHand(minuteToAngle(time.decimalMinutes), this.config.handLengths.minute, this.config.handWidths.minute, this.config.colors.minuteHand);
        this._drawHand(secondToAngle(time.seconds), this.config.handLengths.second, this.config.handWidths.second, this.config.colors.secondHand);
    }
    
    _drawHand(angle, lenRatio, width, color) {
        const ctx = this.ctx;
        const len = this.maxRadius * lenRatio;
        const pos = getPosition(angle, len, this.cx, this.cy);
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.strokeStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.stroke();
        ctx.restore();
    }
}

// ========== UUR VOLGSTIP ==========
class HourTracker {
    constructor(ctx, cx, cy, maxRadius, config) {
        this.ctx = ctx;
        this.cx = cx;
        this.cy = cy;
        this.maxRadius = maxRadius;
        this.config = config;
    }
    
    updatePosition(cx, cy, maxRadius) {
        this.cx = cx;
        this.cy = cy;
        this.maxRadius = maxRadius;
    }
    
    draw(decimalHours) {
        if (!this.config.hourTrackerEnabled) return;
        const ctx = this.ctx;
        const r = this.maxRadius - 24;
        const angle = hourToAngle(decimalHours);
        const pos = getPosition(angle, r, this.cx, this.cy);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.config.hourTrackerRadius, 0, 2*Math.PI);
        ctx.fillStyle = this.config.colors.hourHand;
        if (this.config.hourTrackerGlow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.config.colors.hourHand;
        }
        ctx.fill();
        ctx.restore();
    }
}

// ========== VERLOOP GENERATOR ==========
class GradientGenerator {
    constructor(config, cx, cy, radius, latitude, longitude) {
        this.config = config;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.latitude = latitude;
        this.longitude = longitude;
        this.gradientSteps = this.config.gradientSteps;
        this._offscreenCanvas = null;
    }
    
    updatePosition(cx, cy, radius) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        // Geen noodzaak om canvas opnieuw aan te maken; gewoon hergebruiken (grootte is vast)
    }
    
    updateLocation(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this._offscreenCanvas = null; // Forceer hercreatie bij volgende generatie
    }
    
    generate(timeData) {
        const solar = new SolarDay(timeData.date, this.latitude, this.longitude);

        if (solar.isPolarDay) {
            return this._makeSolidGradient(this.config.colors.polarDay);
        }
        if (solar.isPolarNight) {
            return this._makeSolidGradient(this.config.colors.deepNight);
        }
        
        const getAngle = (date) => {
            if (!date) return null;
            const hour = date.getHours() + date.getMinutes()/60 + date.getSeconds()/3600;
            let angle = hourToAngle(hour);
            if (angle > 0) { angle -= 360; }
            return angle;
        };
        
        const astroDawn = getAngle(solar.astronomicalDawn);
        const naupDawn = getAngle(solar.nauticalDawn);
        const civilDawn = getAngle(solar.civilDawn);
        const sunrise = getAngle(solar.sunrise);
        const sunset = getAngle(solar.sunset);
        const civilDusk = getAngle(solar.civilDusk);
        const naupDusk = getAngle(solar.nauticalDusk);
        const astroDusk = getAngle(solar.astronomicalDusk);
        const noon = getAngle(solar.solarNoon);
        const nadir = getAngle(solar.nadir);  
        
        // --- Bepaal achtergrondkleur op basis van zonhoogte bij nadir ---
        const c = this.config.colors;
        let nightColor = c.deepNight;  // standaard: volledige duisternis
        
        if (solar.nadir) {
            // Bereken zonhoogte bij nadir met SunPosition
            const nadirJD = new JulianDate(solar.nadir);
            const nadirPos = new SunPosition(nadirJD, this.latitude, this.longitude);
            const nadirAlt = nadirPos.altitude();
            
            // Grenzen van de schemering: civil -6°, nautical -12°, astronomical -18°
            if (nadirAlt > -6) {
                nightColor = c.civil;          // zon verlaat nooit de civiele schemering
            } else if (nadirAlt > -12) {
                nightColor = c.nautical;       // diepste is nautische schemering
            } else if (nadirAlt > -18) {
                nightColor = c.astronomical;   // diepste is astronomische schemering
            } else {
                nightColor = c.deepNight;      // volledige astronomische duisternis
            }
        }
        
        // --- Bogen opbouwen ---
        const arcs = [];
        
        if (noon !== null && sunset !== null)
            arcs.push({ start: noon, end: sunset, startColor: c.solarNoon, endColor: c.sunrise });
        if (sunset !== null && civilDusk !== null)
            arcs.push({ start: sunset, end: civilDusk, startColor: c.sunrise, endColor: c.civil });
        if (civilDusk !== null && naupDusk !== null)
            arcs.push({ start: civilDusk, end: naupDusk, startColor: c.civil, endColor: c.nautical });
        if (naupDusk !== null && astroDusk !== null)
            arcs.push({ start: naupDusk, end: astroDusk, startColor: c.nautical, endColor: c.astronomical });
        
        // Nachtgedeelte: van de diepste schemering tot de diepste dageraad
        if (astroDusk !== null && astroDawn !== null) {
            arcs.push({ start: astroDusk, end: nadir, startColor: c.astronomical, endColor: nightColor });
            arcs.push({ start: nadir, end: astroDawn, startColor: nightColor, endColor: c.astronomical });
        } else if (naupDusk !== null && naupDawn !== null) {
            arcs.push({ start: naupDusk, end: nadir, startColor: c.nautical, endColor: nightColor });
            arcs.push({ start: nadir, end: naupDawn, startColor: nightColor, endColor: c.nautical });
        } else if (civilDusk !== null && civilDawn !== null) {
            arcs.push({ start: civilDusk, end: nadir, startColor: c.civil, endColor: nightColor });
            arcs.push({ start: nadir, end: civilDawn, startColor: nightColor, endColor: c.civil });
        } else if (sunset !== null && sunrise !== null) {
            arcs.push({ start: sunset, end: nadir, startColor: c.sunrise, endColor: nightColor });
            arcs.push({ start: nadir, end: sunrise, startColor: nightColor, endColor: c.sunrise });
        }
        
        if (astroDawn !== null && naupDawn !== null)
            arcs.push({ start: astroDawn, end: naupDawn, startColor: c.astronomical, endColor: c.nautical });
        if (naupDawn !== null && civilDawn !== null)
            arcs.push({ start: naupDawn, end: civilDawn, startColor: c.nautical, endColor: c.civil });
        if (civilDawn !== null && sunrise !== null)
            arcs.push({ start: civilDawn, end: sunrise, startColor: c.civil, endColor: c.sunrise });
        if (sunrise !== null && noon !== null)
            arcs.push({ start: sunrise, end: noon, startColor: c.sunrise, endColor: c.solarNoon });

        // --- Tekenen ---
        if (!this._offscreenCanvas) {
            this._offscreenCanvas = document.createElement('canvas');
            this._offscreenCanvas.width = this.config.size;
            this._offscreenCanvas.height = this.config.size;
        }
        const off = this._offscreenCanvas;
        const offCtx = off.getContext('2d');
        offCtx.clearRect(0, 0, off.width, off.height);
        
        // Achtergrond vullen met nachtkleur
        offCtx.beginPath();
        offCtx.arc(this.cx, this.cy, this.radius, 0, 2*Math.PI);
        offCtx.fillStyle = hslToString(nightColor.h, nightColor.s, nightColor.l);
        offCtx.fill();
        
        // Elke boog tekenen
        for (const arc of arcs) {
            let start = arc.start;
            let end = arc.end;
            
            // nodig om omslag van kleuren in de verkeerde richting te voorkomen
            if (start < end) start += 360;
            
            const totalAngle = Math.abs(end - start);
            const steps = Math.round((totalAngle / 360) * this.gradientSteps);
            
            for (let i = 0; i < steps; i++) {
                const t = i / steps;
                const nextT = (i + 1) / steps;
                
                const segStart = start + (end - start) * t;
                const segEnd = start + (end - start) * (nextT + 0.05);
                
                const color = lerpHSL(arc.startColor, arc.endColor, t);
                
                offCtx.beginPath();
                offCtx.moveTo(this.cx, this.cy);
                offCtx.arc(this.cx, this.cy, this.radius, degToRad(segStart), degToRad(segEnd), true);
                offCtx.closePath();
                offCtx.fillStyle = hslToString(color.h, color.s, color.l);
                offCtx.fill();
            }
        }
        
        return off;
    }
    
    _makeSolidGradient(color) {
        if (!this._offscreenCanvas) {
            this._offscreenCanvas = document.createElement('canvas');
            this._offscreenCanvas.width = this.config.size;
            this._offscreenCanvas.height = this.config.size;
        }
        const off = this._offscreenCanvas;
        const offCtx = off.getContext('2d');
        offCtx.clearRect(0, 0, off.width, off.height);
        
        offCtx.beginPath();
        offCtx.arc(this.cx, this.cy, this.radius, 0, 2*Math.PI);
        offCtx.fillStyle = hslToString(color.h, color.s, color.l);
        offCtx.fill();
        return off;
    }
}

// ========== HOOFD KLOKTOEPASSING ==========
class ClockApp {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.timeSource = new TimeSource();
        this.geolocation = new GeolocationHandler();
        this.gradientCache = null;
        this.cacheKey = null;
        this.gradientGenerator = null;
        this.moonRenderer = null;
        
        this.clockRadius = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.gradientRadius = 0;
        this.moonRadius = 0;
        
        this.dial = null;
        this.hands = null;
        this.tracker = null;
        this.timestamp = new HoloceneTimestamp();
        this.moonDisplay = new MoonPhaseDisplay();
        
        this.animationId = null;
        this._isPageVisible = true;
        
        this._init();
    }
    
    _init() {
        this._resize();
        window.addEventListener('resize', () => this._resize());
        
        // Pagina zichtbaarheid afhandelen voor opschonen animatie
        document.addEventListener('visibilitychange', () => {
            this._isPageVisible = !document.hidden;
            if (this._isPageVisible) {
                this._startAnimation();
            } else {
                this._stopAnimation();
            }
        });
        
        this.geolocation.onLocationChange = () => {
            this._invalidateGradient();
            if (this.gradientGenerator) {
                this.gradientGenerator.updateLocation(this.geolocation.latitude, this.geolocation.longitude);
            }
            this._updateMoonRenderer();
        };
        this.geolocation.init();
        this._startAnimation();

        // --- Dag van het jaar schuifregelaar ---
        const daySlider = document.getElementById('daySlider');
        const dayLabel = document.getElementById('dayLabel');
        const dayReset = document.getElementById('dayReset');

        if (daySlider && dayLabel && dayReset) {
            const updateDaySliderRange = () => {
                const now = new Date();
                const maxDay = this._isLeapYear(now.getFullYear()) ? 366 : 365;
                const todayDay = this._getDayOfYear(now);
                
                daySlider.max = maxDay;
                
                // Alleen waarde bijwerken als we in de "vandaag"-modus zijn
                if (this.timeSource.dayOfYearOverride === null) {
                    daySlider.value = todayDay;
                    dayLabel.textContent = `${CONFIG.labels.day}: ${todayDay}`;
                }
            };
            
            // Initiële bereik instellen
            updateDaySliderRange();
            
            daySlider.addEventListener('input', () => {
                const dayOfYear = parseInt(daySlider.value);
                this.timeSource.dayOfYearOverride = dayOfYear;
                dayLabel.textContent = `${CONFIG.labels.day}: ${dayOfYear}`;
                // Forceer verloop/maan regeneratie
                this.gradientCache = null;
                this.cacheKey = null;
                if (this.moonRenderer) {
                    this.moonRenderer.cacheDate = null;
                }
            });
            
            dayReset.addEventListener('click', () => {
                this.timeSource.dayOfYearOverride = null;
                const todayDay = this._getDayOfYear(new Date());
                daySlider.value = todayDay;
                dayLabel.textContent = `${CONFIG.labels.day}: ${todayDay}`;
                this.gradientCache = null;
                this.cacheKey = null;
                if (this.moonRenderer) {
                    this.moonRenderer.cacheDate = null;
                }
            });
        }
    }
    
    _resize() {
        // Inline breedte tijdelijk verwijderen zodat container natuurlijk kan uitzetten
        this.canvas.style.width = '';
        this.canvas.style.height = '';
        
        const container = this.canvas.parentElement;
        const maxSize = Math.min(container.clientWidth, window.innerWidth * 0.8, this.config.size);
        this.canvas.style.width = `${maxSize}px`;
        this.canvas.style.height = `${maxSize}px`;
        this.canvas.width = this.config.size;
        this.canvas.height = this.config.size;
        
        this.clockRadius = this.config.size / 2 - 35;
        this.centerX = this.config.size / 2;
        this.centerY = this.config.size / 2;
        this.gradientRadius = this.clockRadius - this.config.gradientMargin;
        this.moonRadius = this.clockRadius * this.config.moonRadiusRatio;
        
        // Bestaande objecten bijwerken in plaats van opnieuw aanmaken
        if (this.dial) {
            this.dial.updatePosition(this.centerX, this.centerY, this.clockRadius);
        } else {
            this.dial = new ClockDial(this.ctx, this.centerX, this.centerY, this.clockRadius, this.config);
        }
        
        if (this.hands) {
            this.hands.updatePosition(this.centerX, this.centerY, this.clockRadius);
        } else {
            this.hands = new ClockHands(this.ctx, this.centerX, this.centerY, this.clockRadius, this.config);
        }
        
        if (this.tracker) {
            this.tracker.updatePosition(this.centerX, this.centerY, this.clockRadius);
        } else {
            this.tracker = new HourTracker(this.ctx, this.centerX, this.centerY, this.clockRadius, this.config);
        }
        
        if (this.gradientGenerator) {
            this.gradientGenerator.updatePosition(this.centerX, this.centerY, this.gradientRadius);
        }
        
        this._invalidateGradient();
        this._updateMoonRenderer();
        this._render();
    }

    _invalidateGradient() {
        this.gradientCache = null;
        this.cacheKey = null;
        if (!this.gradientGenerator) {
            this.gradientGenerator = new GradientGenerator(
                this.config, 
                this.centerX, 
                this.centerY, 
                this.gradientRadius, 
                this.geolocation.latitude, 
                this.geolocation.longitude
            );
        }
    }
    
    _updateMoonRenderer() {
        if (this.moonRenderer) {
            this.moonRenderer.updatePosition(this.centerX, this.centerY, this.moonRadius, this.geolocation.latitude);
        } else {
            this.moonRenderer = new MoonRenderer(
                this.config,
                this.centerX,
                this.centerY,
                this.moonRadius,
                this.geolocation.latitude
            );
        }
        // Forceer fase-update bij locatiewijziging
        this.moonRenderer.cacheDate = null;
    }
    
    _updateGradientCache(timeData) {
        const locKey = this.geolocation.getLocationKey();
        const newKey = `${timeData.dateKey}|${locKey}`;
        if (this.cacheKey !== newKey || !this.gradientCache) {
            this.gradientCache = this.gradientGenerator.generate(timeData);
            this.cacheKey = newKey;
        }
    }
    
    _render() {
        if (!this.ctx) return;
        
        // Enkele tijdsbron voor het hele frame
        const timeData = this.timeSource.getCurrentTime();

        // Max dag van schuifregelaar bijwerken als jaar verandert (schrikkeljaar)
        const daySlider = document.getElementById('daySlider');
        const dayLabel = document.getElementById('dayLabel');
        if (daySlider) {
            const maxDay = this._isLeapYear(timeData.year) ? 366 : 365;
            if (daySlider.max != maxDay) {
                daySlider.max = maxDay;
            }
            // Als in "vandaag"-modus, schuifregelaar synchroniseren met werkelijke dag
            if (this.timeSource.dayOfYearOverride === null) {
                const todayDay = this._getDayOfYear(new Date());
                if (daySlider.value != todayDay) {
                    daySlider.value = todayDay;
                    if (dayLabel) dayLabel.textContent = `Dag: ${todayDay}`;
                }
            }
        }
        
        this.timestamp.update(timeData);
        
        // Maanfase bijwerken met timeData
        if (this.moonRenderer) {
            this.moonRenderer.updatePhase(timeData);            
            if (this.moonRenderer.cachedPhase) {
                this.moonDisplay.update(this.moonRenderer.cachedPhase);
            }
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Schemeringsverloop tekenen
        this._updateGradientCache(timeData);
        if (this.gradientCache) {
            this.ctx.drawImage(this.gradientCache, 0, 0);
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, this.gradientRadius, 0, 2*Math.PI);
            this.ctx.fillStyle = hslToString(
                this.config.colors.deepNight.h,
                this.config.colors.deepNight.s,
                this.config.colors.deepNight.l
            );
            this.ctx.fill();
        }
        
        // Maan in het midden tekenen
        if (this.moonRenderer) {
            this.moonRenderer.draw(this.ctx);
        }
        
        // Wijzerplaatmarkeringen bovenop de maan tekenen
        this.dial.draw();
        
        // Wijzers tekenen
        this.hands.draw(timeData);
        this.tracker.draw(timeData.decimalHours);
        
        // Middelpuntkapje tekenen
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 4, 0, 2*Math.PI);
        this.ctx.fillStyle = this.config.colors.secondHand;
        this.ctx.shadowBlur = 4;
        this.ctx.fill();
        this.ctx.restore();
    }
    
    _startAnimation() {
        if (this.animationId) return;
        // Vereenvoudigde animatielus: geen requestAnimationFrame + setTimeout, alleen setTimeout
        const loop = () => {
            if (!this._isPageVisible) {
                this.animationId = null;
                return;
            }
            this._render();
            this.animationId = setTimeout(loop, this.config.updateInterval);
        };
        loop();
    }
    
    _stopAnimation() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
        
    _isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    _getDayOfYear(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        return Math.floor((date - startOfYear) / (24 * 3600 * 1000)) + 1;
    }
           
    setLatitude(lat) {
        this.geolocation.latitude = lat;
        this._invalidateGradient();
        if (this.gradientGenerator) {
            this.gradientGenerator.updateLocation(lat, this.geolocation.longitude);
        }
        if (this.moonRenderer) {
            this.moonRenderer.updatePosition(this.centerX, this.centerY, this.moonRadius, lat);
            this.moonRenderer.cacheDate = null;  // forceer maan heroriëntatie
        }
        this._render();
    }
}

// ========== TOEPASSING STARTEN ==========
window.addEventListener('load', () => {
    const canvas = document.getElementById('clockCanvas');
    if (!canvas) return;
    if (typeof SolarDay === 'undefined') {
        const status = document.getElementById('statusMessage');
        if (status) status.textContent = "Fout: astro.js niet geladen.";
        return;
    }
    if (typeof MoonPhase === 'undefined') {
        const status = document.getElementById('statusMessage');
        if (status) status.textContent = "Fout: astro.js niet geladen.";
        return;
    }
    
    const app = new ClockApp(canvas, CONFIG);
    window.clockApp = app;
    
    // --- Breedtegraad schuifregelaar ---
    const latSlider = document.getElementById('latSlider');
    const latLabel = document.getElementById('latLabel');
    const latReset = document.getElementById('latReset');
    
    if (latSlider && latLabel && latReset) {
        // Even wachten tot geolocatie is opgelost, dan initiële schuifregelaarwaarde instellen
        const setInitialSlider = () => {
            const originalLat = app.geolocation.latitude;
            latSlider.value = originalLat;
            updateSliderLabel(originalLat);
            
            latSlider.addEventListener('input', () => {
                const lat = parseFloat(latSlider.value);
                updateSliderLabel(lat);
                app.setLatitude(lat);
            });
            
            latReset.addEventListener('click', () => {
                latSlider.value = originalLat;
                updateSliderLabel(originalLat);
                app.setLatitude(originalLat);
            });
        };
        
        function updateSliderLabel(lat) {
            const abs = Math.abs(lat).toFixed(1);
            const hemi = lat >= 0 ? 'N' : 'Z';
            latLabel.textContent = `${CONFIG.labels.latitude}: ${abs}°${hemi}`;
        }
        
        // Als geolocatie nog niet is opgelost, wachten
        if (app.geolocation.latitude !== undefined) {
            setInitialSlider();
        } else {
            // Inhaken op de geolocatie callback
            const originalCallback = app.geolocation.onLocationChange;
            app.geolocation.onLocationChange = (lat, lon) => {
                if (originalCallback) originalCallback(lat, lon);
                setInitialSlider();
                // Originele callback herstellen
                app.geolocation.onLocationChange = originalCallback;
            };
        }
    }
});
