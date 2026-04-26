// ==========================================
// 1. PREMIUM PAGE TRANSITION ENGINE
// ==========================================
(function initPageTransitions() {
    if (!document.getElementById('anikan-transition-styles')) {
        const style = document.createElement('style');
        style.id = 'anikan-transition-styles';
        style.innerHTML = `
            #anikan-global-loader {
                position: fixed; inset: 0; z-index: 999999;
                background: rgba(16, 15, 20, 0.35);
                backdrop-filter: blur(24px) saturate(180%);
                -webkit-backdrop-filter: blur(24px) saturate(180%);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                opacity: 1; visibility: visible;
                transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.5s;
            }
            #anikan-global-loader.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
            .anikan-glass-pill {
                display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                border-radius: 50px; padding: 12px 28px 12px 14px;
            }
            .anikan-liquid-blob {
                width: 32px; height: 32px;
                background: linear-gradient(135deg, #9D4EDD, #c77dff);
                box-shadow: 0 0 20px rgba(157, 78, 221, 0.4);
                animation: anikan-liquid-morph 2s infinite;
            }
            .anikan-loader-text { color: #F5F5F5; font-weight: 600; font-family: 'Poppins', sans-serif; letter-spacing: 1.5px; font-size: 0.95rem; }
            @keyframes anikan-liquid-morph {
                0%, 100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(0deg) scale(1); }
                34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(120deg) scale(1.05); }
                67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; transform: rotate(240deg) scale(0.95); }
            }
            body { animation: anikan-body-fade 0.6s forwards; }
            @keyframes anikan-body-fade { from { opacity: 0.5; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    let loader = document.getElementById('anikan-global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'anikan-global-loader';
        loader.innerHTML = `<div class="anikan-glass-pill"><div class="anikan-liquid-blob"></div><div class="anikan-loader-text">ANIKAN</div></div>`;
        document.documentElement.appendChild(loader); 
    }

    const hideLoader = () => { setTimeout(() => { if (loader) loader.classList.add('hidden'); }, 150); };
    if (document.readyState === 'complete' || document.readyState === 'interactive') { hideLoader(); } else { window.addEventListener('DOMContentLoaded', hideLoader); window.addEventListener('load', hideLoader); }
    window.addEventListener('pageshow', (e) => { if (e.persisted) hideLoader(); });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href || link.target === '_blank' || link.hasAttribute('download') || e.ctrlKey || e.metaKey) return;
        const isInternal = link.origin === window.location.origin && !link.hash && !link.href.includes('javascript:');
        if (isInternal && link.href !== window.location.href) {
            e.preventDefault();
            loader.classList.remove('hidden');
            setTimeout(() => { window.location.href = link.href; }, 300); 
        }
    });
})();

// ==========================================
// 2. GLOBAL OPTIMISTIC UI (INSTANT DATA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const cachedUser = localStorage.getItem('anikan_user_cache'); 
    if (cachedUser) {
        try {
            const userData = JSON.parse(cachedUser);
            let avatarSrc = 'https://api.dicebear.com/7.x/adventurer/svg?seed=AniKan';
            if(userData.avatarUrl) avatarSrc = userData.avatarUrl;
            else if(userData.username) avatarSrc = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userData.username)}`;
            
            const pcAvatarHtml = `<img src="${avatarSrc}" alt="Profile" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.8);">`;
            const mobileAvatarHtml = `<img src="${avatarSrc}" alt="Profile" class="nav-icon" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color); margin-bottom: 4px;">`;

            const bottomAuth = document.getElementById('bottomAuthBtn');
            if(bottomAuth) { bottomAuth.href = 'profile.html'; bottomAuth.innerHTML = `${mobileAvatarHtml}<span class="nav-label">Profile</span>`; }
            const topAuthBtn = document.getElementById('topAuthBtn');
            if(topAuthBtn) { topAuthBtn.href = 'profile.html'; topAuthBtn.innerHTML = `${pcAvatarHtml} Profile`; }
        } catch(e) { console.error("Cache read error"); }
    }
});

// ==========================================
// 3. FIREBASE BACKGROUND SYNC (SILENT UPDATER)
// ==========================================
Promise.all([
    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js")
]).then(async ([appModule, authModule, fsModule]) => {
    const { initializeApp, getApps, getApp } = appModule;
    const { getAuth, onAuthStateChanged } = authModule;
    const { getFirestore, doc, getDoc } = fsModule;

    // --- FIXED CONFIG: Now matches bhx-beats ---
    const firebaseConfig = {
      apiKey: "AIzaSyB8GlFBy3boBwqEDWA625MkWKNM1M7w0O0",
      authDomain: "bhx-beats.firebaseapp.com",
      projectId: "bhx-beats",
      storageBucket: "bhx-beats.firebasestorage.app",
      messagingSenderId: "491393581039",
      appId: "1:491393581039:web:8204fb8753094a64a9401a",
      measurementId: "G-PCV97GFYQ7"
    };
    
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    localStorage.setItem('anikan_user_cache', JSON.stringify(data));

                    let cloudHistory = data.watchHistory || {};
                    let localHistory = JSON.parse(localStorage.getItem('anikan_history')) || {};
                    let changed = false;

                    for (const [id, cloudItem] of Object.entries(cloudHistory)) {
                        if (cloudItem.link && !cloudItem.link.includes('anikan.html')) {
                            if (!localHistory[id] || Number(cloudItem.timestamp) > Number(localHistory[id].timestamp || 0)) {
                                localHistory[id] = cloudItem;
                                if (cloudItem.epIndex) localStorage.setItem(`anikan_ep_${id}`, cloudItem.epIndex);
                                changed = true;
                            }
                        }
                    }
                    if (changed) {
                        localStorage.setItem('anikan_history', JSON.stringify(localHistory));
                        window.dispatchEvent(new Event('historySynced')); 
                    }
                }
            } catch (err) {}
        } else {
            localStorage.removeItem('anikan_user_cache');
        }
    });
});

// ==========================================
// 4. GLOBAL FUNCTION: MY LIST (ANIKAN)
// ==========================================
window.toggleMyList = async function(btn, title, img, link) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
        const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
        const { getFirestore, doc, setDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
        
        // --- FIXED CONFIG: Now matches bhx-beats ---
        const firebaseConfig = {
          apiKey: "AIzaSyB8GlFBy3boBwqEDWA625MkWKNM1M7w0O0",
          authDomain: "bhx-beats.firebaseapp.com",
          projectId: "bhx-beats",
          storageBucket: "bhx-beats.firebasestorage.app",
          messagingSenderId: "491393581039",
          appId: "1:491393581039:web:8204fb8753094a64a9401a",
          measurementId: "G-PCV97GFYQ7"
        };
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app);

        if (!auth.currentUser) {
            alert("Please Sign In to add anime to your List!");
            window.location.href = "login.html";
            return;
        }

        const decodedTitle = decodeURIComponent(title);
        const userRef = doc(db, "users", auth.currentUser.uid);
        
        await setDoc(userRef, {
            myList: arrayUnion({ title: decodedTitle, img: decodeURIComponent(img), link: decodeURIComponent(link), addedAt: Date.now() })
        }, { merge: true });

        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.color = 'var(--primary-color)';
        btn.style.background = 'white';
        btn.style.borderColor = 'var(--primary-color)';
    } catch (e) {
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        alert("Error saving to My List.");
    }
};