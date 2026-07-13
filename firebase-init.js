// ===== إعداد الاتصال بـ Firebase (مشترك بين صفحة السائق والخريطة) =====
const firebaseConfig = {
  apiKey: "AIzaSyCzHj9BV1ty2z2jr6mmunyRqTnNHsleRWc",
  authDomain: "monafiss-bus.firebaseapp.com",
  databaseURL: "https://monafiss-bus-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "monafiss-bus",
  storageBucket: "monafiss-bus.firebasestorage.app",
  messagingSenderId: "723877630694",
  appId: "1:723877630694:web:ffa5ab7bfd097769496127",
};

firebase.initializeApp(firebaseConfig);
// مرجع موقع الباص في قاعدة البيانات
window.busRef = firebase.database().ref("bus");
