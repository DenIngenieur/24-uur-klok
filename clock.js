/**
 * 24h COUNTERCLOCKWISE CLOCK – OOP with Smooth Twilight Gradient & Moon Phase
 * 
 * Uses SolarDay and MoonPhase from astro.js / moonphase.js.
 * Moon phase is calculated once per day and displayed in the centre of the dial.
 * 
 * Dependencies: astro.js and moonphase.js must be loaded before this file.
 */

// ========== CONFIGURATION ==========
const CONFIG = {
    size: 500,
    showEveryNthHour: 1,
    showEveryNthMinute: 5,
    gradientMargin: 25,
    gradientOpacity: 0.85,
    gradientSteps: 720, // 0.5° per step
    locationPrecision: 2, // decimal places for location cache key
    
    hourTrackerEnabled: true,
    hourTrackerRadius: 5,
    hourTrackerGlow: true,
    
    // Moon settings
    moonRadiusRatio: 0.33,      // 1/3 of clock radius
    moonGlowBlur: 6,
    moonGlowOpacity: 0.15,
    moonDarkColor: "#1a1d2e",
    moonLightColor: "#fff8e0",
    moonBorderColor: "rgba(255,255,240,0.3)",
    
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
        // Twilight anchor colors (HSL values) - more natural sky colors
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

// ========== GLOBAL ANGLE UTILITIES ==========
function degToRad(d) { return d * Math.PI / 180; }
function hourToAngle(h) { return -(h * 15) + 90; }
function minuteToAngle(m) { return -(m * 6) - 90; }
function secondToAngle(s) { return -(s * 6) - 90; }

function getPosition(angleDeg, radius, cx, cy) {
    const rad = degToRad(angleDeg);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// ========== COLOR UTILITIES ==========
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

// ========== TIME SOURCE ==========
class TimeSource {
    getCurrentTime() {
        const now = new Date();
        return {
            date: now,
            timestamp: now.getTime(),
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
            hours: now.getHours(),
            minutes: now.getMinutes(),
            seconds: now.getSeconds(),
            decimalHours: now.getHours() + now.getMinutes()/60 + now.getSeconds()/3600,
            decimalMinutes: now.getMinutes() + now.getSeconds()/60,
            dateKey: `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
        };
    }
}

// ========== HOLOCENE TIMESTAMP ==========
class HoloceneTimestamp {
    constructor() {
        this.element = document.getElementById('timestamp');
        this.lastSecond = -1;
    }
    update(timeData) {
        if (!this.element) return;
        // Only update when seconds change
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

// ========== GEOLOCATION HANDLER ==========
class GeolocationHandler {
    constructor() {
        this.latitude = 50.80724821763106;
        this.longitude = 3.113920551703155;
        this.onLocationChange = null;
    }

    init() {
        const statusEl = document.getElementById('statusMessage');
        if (!navigator.geolocation) {
            if (statusEl) statusEl.textContent = "🌐 Geolocation not supported – using fallback 50.81°N, 3.11°E";
            return;
        }
        if (statusEl) statusEl.textContent = "📍 Requesting location...";
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.latitude = pos.coords.latitude;
                this.longitude = pos.coords.longitude;
                const hem = this.latitude >= 0 ? "Northern" : "Southern";
                if (statusEl) statusEl.textContent = `🌞 ${hem} hemisphere | ${this.latitude.toFixed(1)}° ${this.longitude.toFixed(1)}°`;
                if (this.onLocationChange) this.onLocationChange(this.latitude, this.longitude);
            },
            (err) => {
                if (statusEl) statusEl.textContent = "⚠️ Geolocation denied – using fallback 50.81°N, 3.11°E";
                if (this.onLocationChange) this.onLocationChange(40, 0);
            }
        );
    }
    getLocationKey() {
        const prec = CONFIG.locationPrecision;
        return `${this.latitude.toFixed(prec)}/${this.longitude.toFixed(prec)}`;
    }
}

// ========== MOON RENDERER ==========
class MoonRenderer {
    constructor(config, cx, cy, radius, latitude) {
        this.config = config;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.latitude = latitude;
        this.moonPhase = new MoonPhase();
        this.cachedPhase = null;
        this.cacheDate = null;
    }
    
    updatePosition(cx, cy, radius, latitude) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.latitude = latitude;
    }
    
    updatePhase(timeData) {
        if (this.cacheDate !== timeData.dateKey) {
            this.cachedPhase = this.moonPhase.getPhase(timeData.date);
            this.cacheDate = timeData.dateKey;
        }
    }
    
    draw(ctx) {
        if (!this.cachedPhase) return;
        
        const pct = this.cachedPhase.illumination;
        const lat = this.latitude;
        
        ctx.save();
        ctx.translate(this.cx, this.cy);
        
        // Apply parallactic rotation based on latitude (same as your example)
        let rotation = (lat * Math.PI / 180);
        ctx.rotate(rotation);
        
        // Draw subtle glow behind the moon
        ctx.shadowBlur = this.config.moonGlowBlur;
        ctx.shadowColor = `rgba(255, 255, 240, ${this.config.moonGlowOpacity})`;
        
        // Draw dark base (unlit portion)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.config.moonDarkColor;
        ctx.fill();
        
        // Reset shadow for the lit portion
        ctx.shadowBlur = 0;
        
        // Draw light base - standard "Waxing" starts with bottom lit (horizontal smile)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI, false);
        ctx.fillStyle = this.config.moonLightColor;
        ctx.fill();
        
        // Draw variable ellipse (illumination mask)
        let wFactor = (pct / 50) - 1;
        let ellipseHeight = Math.abs(this.radius * wFactor);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, ellipseHeight, 0, 0, Math.PI * 2);
        ctx.fillStyle = pct < 50 ? this.config.moonDarkColor : this.config.moonLightColor;
        ctx.fill();
        
        // Draw subtle border around the moon
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.config.moonBorderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

// ========== MOON PHASE DISPLAY ==========
class MoonPhaseDisplay {
    constructor() {
        this.element = document.getElementById('moonPhase');
        this.lastDisplayedPhase = null;
    }
    update(phaseData) {
        if (!this.element || !phaseData) return;
        // Only update DOM if phase actually changed
        if (this.lastDisplayedPhase === phaseData.phaseName) return;
        this.lastDisplayedPhase = phaseData.phaseName;
        
        const percent = Math.round(phaseData.illumination);
        this.element.textContent = `${phaseData.symbol} ${phaseData.phaseName} (${percent}%)`;
    }
}

// ========== CLOCK DIAL ==========
class ClockDial {
    constructor(ctx, cx, cy, radius, config) {
        this.ctx = ctx;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.config = config;
        // Pre-calculate hour and half-hour angles
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
        
        // Draw hour ticks
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
        
        // Draw half-hour ticks
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
        ctx.font = `bold ${Math.floor(this.radius * 0.05)}px "Segoe UI", monospace`;
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

// ========== CLOCK HANDS ==========
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

// ========== HOUR TRACKER DOT ==========
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

// ========== GRADIENT GENERATOR ==========
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
        this._offscreenCanvas = null; // Force recreation on next generate
    }
    
    updateLocation(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
        this._offscreenCanvas = null;
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
        
        // --- Determine background colour from sun's altitude at nadir ---
        const c = this.config.colors;
        let nightColor = c.deepNight;  // default: full darkness
        
        if (solar.nadir) {
            // Compute sun's altitude at nadir using SunPosition
            const nadirJD = new JulianDate(solar.nadir);
            const nadirPos = new SunPosition(nadirJD, this.latitude, this.longitude);
            const nadirAlt = nadirPos.altitude();
            
            // Map altitude to the deepest twilight colour
            // Twilight boundaries: civil -6°, nautical -12°, astronomical -18°
            if (nadirAlt > -6) {
                nightColor = c.civil;          // sun never leaves civil twilight
            } else if (nadirAlt > -12) {
                nightColor = c.nautical;       // deepest is nautical twilight
            } else if (nadirAlt > -18) {
                nightColor = c.astronomical;   // deepest is astronomical twilight
            } else {
                nightColor = c.deepNight;      // full astronomical darkness
            }
        }
        
        // --- Build arcs ---
        const arcs = [];
        
        if (noon !== null && sunset !== null)
            arcs.push({ start: noon, end: sunset, startColor: c.solarNoon, endColor: c.sunrise });
        if (sunset !== null && civilDusk !== null)
            arcs.push({ start: sunset, end: civilDusk, startColor: c.sunrise, endColor: c.civil });
        if (civilDusk !== null && naupDusk !== null)
            arcs.push({ start: civilDusk, end: naupDusk, startColor: c.civil, endColor: c.nautical });
        if (naupDusk !== null && astroDusk !== null)
            arcs.push({ start: naupDusk, end: astroDusk, startColor: c.nautical, endColor: c.astronomical });
        
        // Night section: from the deepest dusk to the deepest dawn
        // If both astro dusk and astro dawn exist, we have two arcs (dusk→nadir, nadir→dawn)
        // If one or both are missing, we connect whatever is available to nadir
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

        // --- Draw ---
        if (!this._offscreenCanvas) {
            this._offscreenCanvas = document.createElement('canvas');
            this._offscreenCanvas.width = this.config.size;
            this._offscreenCanvas.height = this.config.size;
        }
        const off = this._offscreenCanvas;
        const offCtx = off.getContext('2d');
        offCtx.clearRect(0, 0, off.width, off.height);
        
        // Fill background with night colour
        offCtx.beginPath();
        offCtx.arc(this.cx, this.cy, this.radius, 0, 2*Math.PI);
        offCtx.fillStyle = hslToString(nightColor.h, nightColor.s, nightColor.l);
        offCtx.fill();
        
        // Draw each arc
        for (const arc of arcs) {
            let start = arc.start;
            let end = arc.end;
            
            // need this to prevent wrap around of colours the wrong way
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

// ========== MAIN CLOCK APPLICATION ==========
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
        
        // Handle page visibility for animation cleanup
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
    }
    
    _resize() {
        // Temporarily remove inline width to let container expand naturally
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
        
        // Update existing objects instead of recreating
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
        // Force phase update on location change
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
        
        // Single time source for entire frame
        const timeData = this.timeSource.getCurrentTime();
        
        this.timestamp.update(timeData);
        
        // Update moon phase using timeData
        if (this.moonRenderer) {
            this.moonRenderer.updatePhase(timeData);
            if (this.moonRenderer.cachedPhase) {
                this.moonDisplay.update(this.moonRenderer.cachedPhase);
            }
        }
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw twilight gradient
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
        
        // Draw moon in the centre
        if (this.moonRenderer) {
            this.moonRenderer.draw(this.ctx);
        }
        
        // Draw dial markings on top of moon
        this.dial.draw();
        
        // Draw hands
        this.hands.draw(timeData);
        this.tracker.draw(timeData.decimalHours);
        
        // Draw centre cap
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
        const loop = () => {
            if (!this._isPageVisible) {
                this.animationId = null;
                return;
            }
            this._render();
            this.animationId = setTimeout(() => requestAnimationFrame(loop), this.config.updateInterval);
        };
        loop();
    }
    
    _stopAnimation() {
        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }
        
    setLatitude(lat) {
        this.geolocation.latitude = lat;
        this._invalidateGradient();
        if (this.gradientGenerator) {
            this.gradientGenerator.updateLocation(lat, this.geolocation.longitude);
        }
        if (this.moonRenderer) {
            this.moonRenderer.updatePosition(this.centerX, this.centerY, this.moonRadius, lat);
            this.moonRenderer.cacheDate = null;  // force moon reorientation
        }
        this._render();
    }
}

// ========== START APPLICATION ==========
// ========== START APPLICATION ==========
window.addEventListener('load', () => {
    const canvas = document.getElementById('clockCanvas');
    if (!canvas) return;
    if (typeof SolarDay === 'undefined') {
        const status = document.getElementById('statusMessage');
        if (status) status.textContent = "Error: astro.js not loaded.";
        return;
    }
    if (typeof MoonPhase === 'undefined') {
        const status = document.getElementById('statusMessage');
        if (status) status.textContent = "Error: moonphase.js not loaded.";
        return;
    }
    
    const app = new ClockApp(canvas, CONFIG);
    window.clockApp = app;
    
    // --- Latitude slider ---
    const latSlider = document.getElementById('latSlider');
    const latLabel = document.getElementById('latLabel');
    const latReset = document.getElementById('latReset');
    
    if (latSlider && latLabel && latReset) {
        // Wait briefly for geolocation to resolve, then set initial slider value
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
            const hemi = lat >= 0 ? 'N' : 'S';
            latLabel.textContent = `Latitude: ${abs}°${hemi}`;
        }
        
        // If geolocation hasn't resolved yet, wait for it
        if (app.geolocation.latitude !== undefined) {
            setInitialSlider();
        } else {
            // Hook into the geolocation callback
            const originalCallback = app.geolocation.onLocationChange;
            app.geolocation.onLocationChange = (lat, lon) => {
                if (originalCallback) originalCallback(lat, lon);
                setInitialSlider();
                // Restore original callback
                app.geolocation.onLocationChange = originalCallback;
            };
        }
    }
});
