import { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const subscribe = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return;

    try {
      const res  = await fetch(`${API}/api/push/vapid-public-key`);
      const { publicKey } = await res.json();

      const reg  = await navigator.serviceWorker.ready;
      const sub  = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch(`${API}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(sub),
      });

      setSubscribed(true);
    } catch (err) {
      console.error('Push subscribe error:', err);
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch(`${API}/api/push/unsubscribe`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    }
  };

  return { permission, subscribed, subscribe, unsubscribe };
}
