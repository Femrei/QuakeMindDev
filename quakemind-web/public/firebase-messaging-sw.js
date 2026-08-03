// Firebase Cloud Messaging Service Worker for QuakeMind Emergency Alerts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyQuakeMindAfetKeyDemo1234567890",
  authDomain: "quakemind-afet.firebaseapp.com",
  projectId: "quakemind-afet",
  storageBucket: "quakemind-afet.appspot.com",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:quakemind123456"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Emergency Notification Received:', payload);
  const notificationTitle = payload.notification?.title || "🔴 QUAKEMIND ACİL AFET UYARISI";
  const notificationOptions = {
    body: payload.notification?.body || "Deprem alarmı! Lütfen hemen güvenli AFAD toplanma alanına geçiniz.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "emergency-alert",
    renotify: true,
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
