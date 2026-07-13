// ===== صفحة السائق: ترسل موقع الباص لحظياً إلى Firebase =====
const btn = document.getElementById("toggleBtn");
const statusEl = document.getElementById("status");

// المفتاح السري من الرابط (?key=...) — بدونه لن تُقبل الكتابة بعد تفعيل الحماية
const WRITE_KEY = new URLSearchParams(location.search).get("key") || "";

let watchId = null;
let wakeLock = null;
let sentCount = 0;
let running = false;

function setStatus(cls, html) {
  statusEl.innerHTML = `<span class="dot ${cls}"></span> ${html}`;
}

function ar(n) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
}

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (e) { /* تجاهل */ }
}

// إعادة قفل الإبقاء على الشاشة عند الرجوع للصفحة
document.addEventListener("visibilitychange", () => {
  if (running && document.visibilityState === "visible") requestWakeLock();
});

function onPosition(pos) {
  const c = pos.coords;
  // رمز عشوائي يتغيّر كل إرسال — يمنع إعادة استخدام كتابة قديمة أو الكتابة المباشرة
  const nonce = Date.now().toString(36) + Math.random().toString(36).slice(2);
  // تحديث ذرّي: الموقع في /bus + المفتاح والرمز في /gate (غير مقروء) للتحقق من الصلاحية
  const update = {
    bus: {
      lat: c.latitude,
      lng: c.longitude,
      speed: c.speed || 0,
      heading: c.heading || 0,
      accuracy: c.accuracy || 0,
      updated: firebase.database.ServerValue.TIMESTAMP,
      n: nonce,
    },
    "gate/k": WRITE_KEY,
    "gate/t": nonce,
  };
  firebase
    .database()
    .ref()
    .update(update)
    .then(() => {
      sentCount++;
      setStatus(
        "on",
        `يتم إرسال الموقع ✅<br>عدد التحديثات: <span class="mono">${ar(sentCount)}</span><br>` +
          `الدقة: <span class="mono">${ar(Math.round(c.accuracy || 0))}</span> م`
      );
    })
    .catch(() => {
      setStatus("err", "❌ رابط السائق غير صالح (مفتاح خاطئ) — استخدم رابط السائق الصحيح");
    });
}

function onError(err) {
  let msg = "خطأ في تحديد الموقع";
  if (err.code === 1) msg = "❌ رفضت إذن الموقع — فعّله من إعدادات المتصفح ثم أعد المحاولة";
  else if (err.code === 2) msg = "❌ الموقع غير متاح — تأكد أن GPS مفعّل";
  else if (err.code === 3) msg = "⏳ انتهت المهلة — جاري إعادة المحاولة...";
  setStatus("err", msg);
}

async function start() {
  if (!navigator.geolocation) {
    setStatus("err", "❌ جهازك لا يدعم تحديد الموقع");
    return;
  }
  running = true;
  sentCount = 0;
  btn.textContent = "⏹️ إيقاف الإرسال";
  btn.classList.add("stop");
  setStatus("off", "⏳ جاري الحصول على الموقع...");
  await requestWakeLock();
  watchId = navigator.geolocation.watchPosition(onPosition, onError, {
    enableHighAccuracy: true,
    maximumAge: 2000,
    timeout: 20000,
  });
}

async function stop() {
  running = false;
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  if (wakeLock) { try { await wakeLock.release(); } catch (e) {} wakeLock = null; }
  btn.textContent = "▶️ ابدأ إرسال الموقع";
  btn.classList.remove("stop");
  setStatus("off", "متوقف — الباص غير نشط الآن");
}

btn.addEventListener("click", () => {
  if (running) stop(); else start();
});
