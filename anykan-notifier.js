// ============================================================================
// ANYKAN OS - GLOBAL REAL-TIME NOTIFICATION & HISTORY SYSTEM
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8GlFBy3boBwqEDWA625MkWKNM1M7w0O0",
    authDomain: "bhx-beats.firebaseapp.com",
    projectId: "bhx-beats",
    storageBucket: "bhx-beats.firebasestorage.app",
    messagingSenderId: "491393581039",
    appId: "1:491393581039:web:8204fb8753094a64a9401a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. INJECT POPUP STYLES
const style = document.createElement('style');
style.innerHTML = `
    #anykan-global-notif {
        position: fixed; top: 25px; right: 25px; transform: translateY(-150%);
        width: 90%; max-width: 380px; background: rgba(11, 12, 16, 0.85);
        backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid rgba(157, 78, 221, 0.3); border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(157, 78, 221, 0.15);
        z-index: 99999; display: flex; gap: 15px; padding: 18px;
        transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
    }
    #anykan-global-notif.show-notif { transform: translateY(0); }
    .notif-popup-icon { width: 45px; height: 45px; border-radius: 50%; background: rgba(157,78,221,0.2); color: #9D4EDD; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .notif-popup-content { display: flex; flex-direction: column; flex-grow: 1; justify-content: center; }
    .notif-popup-title { color: #fff; font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; }
    .notif-popup-body { color: #aaa; font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;}
    .notif-popup-close { background: none; border: none; color: #888; font-size: 1.2rem; cursor: pointer; position: absolute; top: 15px; right: 15px; transition: color 0.3s; }
    .notif-popup-close:hover { color: #fff; }
    @media (max-width: 768px) { #anykan-global-notif { right: 5%; width: 90%; top: 15px; } }
`;
document.head.appendChild(style);

const popupContainer = document.createElement('div');
popupContainer.id = 'anykan-global-notif';
popupContainer.innerHTML = `
    <div class="notif-popup-icon"><i class="fas fa-bullhorn"></i></div>
    <div class="notif-popup-content">
        <div class="notif-popup-title" id="notif-popup-title">Broadcast</div>
        <div class="notif-popup-body" id="notif-popup-body">Message</div>
    </div>
    <button class="notif-popup-close" id="anykan-notif-close"><i class="fas fa-times"></i></button>
`;
document.body.appendChild(popupContainer);

let autoHideTimer;

function showPopup(title, body) {
    document.getElementById('notif-popup-title').innerText = title;
    document.getElementById('notif-popup-body').innerText = body;
    popupContainer.classList.add('show-notif');

    document.getElementById('anykan-notif-close').onclick = () => popupContainer.classList.remove('show-notif');

    clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(() => {
        popupContainer.classList.remove('show-notif');
    }, 8000);
}

// 2. HISTORY HUB LOGIC
let notifHistory = JSON.parse(localStorage.getItem('Anykan_Notif_History')) || [];

function renderHistory() {
    const list = document.getElementById('globalNotifList');
    const badge = document.getElementById('globalNotifBadge');
    if (!list) return;

    if (notifHistory.length === 0) {
        list.innerHTML = `<div class="empty-notifs">No notifications yet.</div>`;
        if (badge) badge.style.display = 'none';
        return;
    }

    list.innerHTML = notifHistory.map(n => `
        <div class="global-notif-item">
            <div class="global-notif-icon"><i class="fas fa-bullhorn"></i></div>
            <div class="global-notif-content">
                <div class="global-notif-title">${n.title}</div>
                <div class="global-notif-body">${n.body}</div>
                <div class="global-notif-time">${new Date(n.timestamp).toLocaleString()}</div>
            </div>
            <button class="global-notif-delete" onclick="window.deleteGlobalNotif('${n.id}')"><i class="fas fa-trash-alt"></i></button>
        </div>
    `).join('');

    const unread = notifHistory.some(n => !n.read);
    if (badge && unread) {
        badge.style.display = 'block';
    }
}

window.deleteGlobalNotif = (id) => {
    notifHistory = notifHistory.filter(n => n.id !== id);
    localStorage.setItem('Anykan_Notif_History', JSON.stringify(notifHistory));
    renderHistory();
};

// 3. FIREBASE LISTENER (Triggered by Admin Dashboard)
const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data();
            const notifId = change.doc.id;
            
            const exists = notifHistory.find(n => n.id === notifId);
            if (!exists) {
                const newNotif = {
                    id: notifId,
                    title: data.title || "Admin Broadcast",
                    body: data.message || data.body || "",
                    timestamp: data.createdAt ? data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt : Date.now(),
                    read: false
                };
                
                notifHistory.unshift(newNotif);
                if (notifHistory.length > 30) notifHistory.pop(); // Max 30 saved
                localStorage.setItem('Anykan_Notif_History', JSON.stringify(notifHistory));
                
                renderHistory();
                
                // Show popup only if it was broadcasted within the last 5 minutes (prevents spam on load)
                if (Date.now() - newNotif.timestamp < 5 * 60 * 1000) {
                    showPopup(newNotif.title, newNotif.body);
                }
            }
        }
    });
});

// 4. UI BINDINGS
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById('globalNotifBtn');
    const dropdown = document.getElementById('globalNotifDropdown');
    const clearBtn = document.getElementById('clearNotifsBtn');

    if (btn && dropdown) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            
            // Mark all as read when opening dropdown
            notifHistory.forEach(n => n.read = true);
            localStorage.setItem('Anykan_Notif_History', JSON.stringify(notifHistory));
            const badge = document.getElementById('globalNotifBadge');
            if (badge) badge.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.classList.remove('active');
            }
        });
        
        dropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            notifHistory = [];
            localStorage.setItem('Anykan_Notif_History', JSON.stringify([]));
            renderHistory();
        });
    }
    
    renderHistory();
});