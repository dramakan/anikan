// ==========================================
// 1. PREMIUM PAGE TRANSITION ENGINE
// ==========================================
(function initPageTransitions() {
    if (!document.getElementById('Anykan-transition-styles')) {
        const style = document.createElement('style');
        style.id = 'Anykan-transition-styles';
        style.innerHTML = `
            #Anykan-global-loader {
                position: fixed; inset: 0; z-index: 999999;
                background: rgba(16, 15, 20, 0.35);
                backdrop-filter: blur(24px) saturate(180%);
                -webkit-backdrop-filter: blur(24px) saturate(180%);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                opacity: 1; visibility: visible;
                transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.5s;
            }
            #Anykan-global-loader.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
            .Anykan-glass-pill {
                display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                border-radius: 50px; padding: 12px 28px 12px 14px;
            }
            .Anykan-liquid-blob {
                width: 32px; height: 32px;
                background: linear-gradient(135deg, #9D4EDD, #c77dff);
                box-shadow: 0 0 20px rgba(157, 78, 221, 0.4);
                animation: Anykan-liquid-morph 2s infinite;
            }
            .Anykan-loader-text { color: #F5F5F5; font-weight: 600; font-family: 'Poppins', sans-serif; letter-spacing: 1.5px; font-size: 0.95rem; }
            @keyframes Anykan-liquid-morph {
                0%, 100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(0deg) scale(1); }
                34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(120deg) scale(1.05); }
                67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; transform: rotate(240deg) scale(0.95); }
            }
            body { animation: Anykan-body-fade 0.6s forwards; }
            @keyframes Anykan-body-fade { from { opacity: 0.5; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    let loader = document.getElementById('Anykan-global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'Anykan-global-loader';
        loader.innerHTML = `<div class="Anykan-glass-pill"><div class="Anykan-liquid-blob"></div><div class="Anykan-loader-text">Anykan</div></div>`;
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
    const cachedUser = localStorage.getItem('Anykan_user_cache'); 
    if (cachedUser) {
        try {
            const userData = JSON.parse(cachedUser);
            let avatarSrc = 'https://api.dicebear.com/7.x/adventurer/svg?seed=Anykan';
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
                    localStorage.setItem('Anykan_user_cache', JSON.stringify(data));

                    let cloudHistory = data.watchHistory || {};
                    let localHistory = JSON.parse(localStorage.getItem('Anykan_history')) || {};
                    let changed = false;

                    for (const [id, cloudItem] of Object.entries(cloudHistory)) {
                        if (cloudItem.link && !cloudItem.link.includes('index.html')) {
                            if (!localHistory[id] || Number(cloudItem.timestamp) > Number(localHistory[id].timestamp || 0)) {
                                localHistory[id] = cloudItem;
                                if (cloudItem.epIndex) localStorage.setItem(`Anykan_ep_${id}`, cloudItem.epIndex);
                                changed = true;
                            }
                        }
                    }
                    if (changed) {
                        localStorage.setItem('Anykan_history', JSON.stringify(localHistory));
                        window.dispatchEvent(new Event('historySynced')); 
                    }
                }
            } catch (err) {}
        } else {
            localStorage.removeItem('Anykan_user_cache');
        }
    });
});

// ==========================================
// 4. GLOBAL FUNCTION: MY LIST (Anykan)
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
// ==========================================
// 🔥 ADMIN EASTER EGG (SECRET UNLOCK) 🔥
// ==========================================
(function initAdminEasterEgg() {
    // --- 1. MOBILE TRIGGER: 5 Rapid Taps on Footer ---
    let tapCount = 0;
    let tapTimer;
    
    // Look for the main footer
    const footer = document.querySelector('.main-footer');
    if (footer) {
        footer.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimer);
            
            // If tapped 5 times, trigger unlock
            if (tapCount >= 5) {
                triggerAdminUnlock();
                tapCount = 0; // Reset
            }
            
            // Reset counter if they pause for more than 800ms
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 800);
        });
    }

    // --- 2. PC TRIGGER: Type "admin" ---
    let keyBuffer = '';
    const secretWord = 'admin';

    document.addEventListener('keydown', (e) => {
        // Ignore if typing inside a search bar or comment box
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
        
        // Add keystroke to buffer
        keyBuffer += e.key.toLowerCase();
        
        // Keep buffer size manageable
        if (keyBuffer.length > secretWord.length) {
            keyBuffer = keyBuffer.substring(1);
        }
        
        // Check if buffer matches the secret word
        if (keyBuffer === secretWord) {
            triggerAdminUnlock();
            keyBuffer = ''; // Reset
        }
    });

    // --- 3. THE COOL ANIMATION & REDIRECT ---
    function triggerAdminUnlock() {
        // Prevent multiple triggers running at once
        if (document.getElementById('anykan-override-overlay')) return;

        // Create Fullscreen Overlay
        const overlay = document.createElement('div');
        overlay.id = 'anykan-override-overlay';
        
        // Inject Inline Styles & HTML for the animation
        overlay.innerHTML = `
            <div class="override-container">
                <i class="fas fa-fingerprint scanner-icon"></i>
                <div id="unlock-text" class="override-text">AUTHENTICATING...</div>
            </div>
            <style>
                #anykan-override-overlay {
                    position: fixed; inset: 0; background: #09090B; z-index: 999999;
                    display: flex; flex-direction: column; justify-content: center; alignItems: center;
                    opacity: 0; transition: opacity 0.5s ease;
                }
                .override-container {
                    text-align: center;
                    display: flex; flex-direction: column; align-items: center;
                }
                .scanner-icon {
                    font-size: 5rem; color: #9D4EDD; margin-bottom: 25px;
                    text-shadow: 0 0 30px rgba(157, 78, 221, 0.8);
                    animation: pulseScan 1s infinite alternate;
                }
                .override-text {
                    color: #fff; font-family: monospace; font-size: 1.4rem; font-weight: 600;
                    letter-spacing: 4px; text-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
                }
                .text-success { color: #10B981 !important; text-shadow: 0 0 20px rgba(16, 185, 129, 0.8) !important; }
                
                @keyframes pulseScan {
                    0% { transform: scale(0.95); filter: brightness(0.8); }
                    100% { transform: scale(1.05); filter: brightness(1.5); }
                }
            </style>
        `;

        document.body.appendChild(overlay);

        // Sequence 1: Fade In Overlay
        setTimeout(() => overlay.style.opacity = '1', 50);

        // Sequence 2: Access Granted (Green Success)
        setTimeout(() => {
            const textEl = document.getElementById('unlock-text');
            textEl.innerText = "ACCESS GRANTED";
            textEl.classList.add('text-success');
            document.querySelector('.scanner-icon').style.color = '#10B981';
            document.querySelector('.scanner-icon').style.textShadow = '0 0 30px rgba(16, 185, 129, 0.8)';
        }, 1200);

        // Sequence 3: Booting OS
        setTimeout(() => {
            document.getElementById('unlock-text').innerText = "BOOTING ANYKAN OS...";
        }, 2000);
        
        // Sequence 4: Redirect to Dashboard
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html'; // Ensure this matches your actual admin file name
        }, 2800);
    }
})();