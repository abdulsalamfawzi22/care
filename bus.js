// ===== الخريطة الحية: تعرض موقع الباص من Firebase =====
const statusbar = document.getElementById("statusbar");
const recenterBtn = document.getElementById("recenter");

// الخريطة تبدأ على منطقة مكة/جدة
const map = L.map("map", { zoomControl: true }).setView([21.42, 39.83], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

const busIcon = L.divIcon({
  className: "bus-marker",
  html: "🚌",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

let marker = null;
let lastUpdated = 0;
let lastPos = null;
let firstFix = true;

function ar(n) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
}

function setStatus(cls, text) {
  statusbar.innerHTML = `<span class="dot ${cls}"></span> ${text}`;
}

// استقبال موقع الباص لحظياً
window.busRef.on("value", (snap) => {
  const d = snap.val();
  if (!d || typeof d.lat !== "number") {
    setStatus("off", "الباص غير نشط حالياً");
    return;
  }
  lastUpdated = d.updated || Date.now();
  lastPos = [d.lat, d.lng];

  if (!marker) marker = L.marker(lastPos, { icon: busIcon }).addTo(map);
  else marker.setLatLng(lastPos);

  if (firstFix) {
    map.setView(lastPos, 15);
    firstFix = false;
  }
});

// حساب حالة النشاط (نشط إذا آخر تحديث خلال 45 ثانية)
function refreshStatus() {
  if (!lastPos) return;
  const age = Math.round((Date.now() - lastUpdated) / 1000);
  if (age <= 45) {
    setStatus("on", `الباص نشط 🟢 — آخر تحديث قبل <span style="direction:ltr;display:inline-block">${ar(Math.max(age,0))}</span> ث`);
  } else {
    const mins = Math.floor(age / 60);
    const txt = mins >= 1 ? `${ar(mins)} د` : `${ar(age)} ث`;
    setStatus("off", `الباص غير نشط — آخر ظهور قبل <span style="direction:ltr;display:inline-block">${txt}</span>`);
  }
}
setInterval(refreshStatus, 1000);

recenterBtn.addEventListener("click", () => {
  if (lastPos) map.setView(lastPos, 16);
  else setStatus("off", "لا يوجد موقع للباص بعد");
});

// زر التوجّه للباص عبر خرائط قوقل
document.getElementById("gmapsBtn").addEventListener("click", () => {
  if (!lastPos) { setStatus("off", "لا يوجد موقع للباص بعد"); return; }
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lastPos[0]},${lastPos[1]}`, "_blank");
});
