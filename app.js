// ===== الإعدادات =====
const params = new URLSearchParams(location.search);

// وقت انتهاء العد التنازلي: نهاية يوم 17 (منتصف الليل بين 17 و 18)
// يعني العداد يعدّ طوال أيام 14-15-16-17، وأول ما يبدأ يوم 18 (أول يوم فعالية) تظهر الصفحة الثانية.
// التوقيت المستخدم: توقيت السعودية (UTC+3)
// وضع التجربة: ?demo أو ?demo=8 يخلي العداد يخلص خلال ثواني لعرض الانتقال.
const demoParam = params.get("demo");
const TARGET_DATE = demoParam !== null
  ? new Date(Date.now() + (parseInt(demoParam, 10) || 8) * 1000)
  : new Date("2026-07-18T00:00:00+03:00");

// ===== عناصر الصفحة =====
const elDays    = document.getElementById("days");
const elHours   = document.getElementById("hours");
const elMinutes = document.getElementById("minutes");
const elSeconds = document.getElementById("seconds");

const countdownScreen = document.getElementById("countdown-screen");
const eventScreen     = document.getElementById("event-screen");

// تحويل الأرقام إلى أرقام عربية (٠١٢٣...)
function toArabic(num) {
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num).padStart(2, "0").replace(/\d/g, (d) => map[d]);
}

function showEventScreen(animate) {
  if (animate) {
    // انتقال ناعم: تلاشي صفحة العد ثم ظهور صفحة الفعاليات
    countdownScreen.classList.add("fade-out");
    setTimeout(() => {
      countdownScreen.classList.add("hidden");
      eventScreen.classList.remove("hidden");
      eventScreen.classList.add("fade-in");
      window.scrollTo(0, 0);
    }, 700);
  } else {
    countdownScreen.classList.add("hidden");
    eventScreen.classList.remove("hidden");
  }
}

function tick() {
  const now = new Date();
  const diff = TARGET_DATE - now;

  if (diff <= 0) {
    elDays.textContent = elHours.textContent = elMinutes.textContent = elSeconds.textContent = "٠٠";
    showEventScreen(true);
    clearInterval(timer);
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  elDays.textContent    = toArabic(days);
  elHours.textContent   = toArabic(hours);
  elMinutes.textContent = toArabic(minutes);
  elSeconds.textContent = toArabic(seconds);
}

tick();
const timer = setInterval(tick, 1000);

// ===== للاختبار فقط: أضف ?preview=event في نهاية الرابط لعرض صفحة الفعاليات مباشرة =====
if (params.get("preview") === "event") {
  showEventScreen(false);
  clearInterval(timer);
}
