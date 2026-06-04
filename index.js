// --- 0. HARDWARE DETECTION (RUNS IMMEDIATELY) ---
(function initUI() {
    let isLowEnd = false;
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) isLowEnd = true;
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 4) isLowEnd = true;
    if ('connection' in navigator && (navigator.connection.effectiveType === '3g' || navigator.connection.effectiveType === '2g')) isLowEnd = true;

    if (isLowEnd) {
        document.documentElement.classList.add('lite-mode');
        console.log("Budget device detected: Lite UI activated.");
    }
})();

// --- UNIFIED MASTER FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB8GlFBy3boBwqEDWA625MkWKNM1M7w0O0",
  authDomain: "bhx-beats.firebaseapp.com",
  projectId: "bhx-beats",
  storageBucket: "bhx-beats.firebasestorage.app",
  messagingSenderId: "491393581039",
  appId: "1:491393581039:web:8204fb8753094a64a9401a"
};

let firebaseInstance = null;
async function getFirebase() {
    if (firebaseInstance) return firebaseInstance;
    
    const [appModule, authModule, firestoreModule] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js")
    ]);

    const app = !appModule.getApps().length ? appModule.initializeApp(firebaseConfig) : appModule.getApp();
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);
    
    firebaseInstance = { app, auth, db, appModule, authModule, firestoreModule };
    return firebaseInstance;
}

// --- GLOBAL ADD TO MY LIST FUNCTION ---
window.toggleMyList = async function(btnElement, title, img, link) {
    title = decodeURIComponent(title);
    img = decodeURIComponent(img);
    link = decodeURIComponent(link);
    const itemId = link; 

    try {
        const { auth, db, firestoreModule } = await getFirebase();
        const user = auth?.currentUser;

        let localList = JSON.parse(localStorage.getItem('dramakan_mylist')) || [];
        const existsLocally = localList.findIndex(i => i.link === link);

        const updateBtnUI = (isAdded) => {
            if(isAdded) {
                btnElement.style.color = "#10b981";
                if(btnElement.innerText.includes('My List')) btnElement.innerHTML = '<i class="fas fa-check"></i> Added';
                else btnElement.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                btnElement.style.color = "";
                if(btnElement.innerText.includes('Added')) btnElement.innerHTML = '<i class="fas fa-plus"></i> My List';
                else btnElement.innerHTML = '<i class="fas fa-plus"></i>';
            }
        };

        if (user) {
            const userRef = firestoreModule.doc(db, "users", user.uid);
            const docSnap = await firestoreModule.getDoc(userRef);
            
            if (docSnap.exists()) {
                let data = docSnap.data();
                let profiles = data.profiles || [];
                const activeProfId = localStorage.getItem('Anykan_active_profile_id') || 'prof_default';
                let profIndex = profiles.findIndex(p => p.id === activeProfId);
                if(profIndex === -1) profIndex = 0;
                
                let profMyList = profiles[profIndex].myList || [];
                const existsDbIndex = profMyList.findIndex(i => i.link === link);
                
                if (existsDbIndex > -1) {
                    profMyList.splice(existsDbIndex, 1);
                    updateBtnUI(false);
                } else {
                    profMyList.push({ title, img, link, id: itemId });
                    updateBtnUI(true);
                }
                
                profiles[profIndex].myList = profMyList;
                await firestoreModule.updateDoc(userRef, { profiles: profiles });
                localStorage.setItem('dramakan_mylist', JSON.stringify(profMyList));
            }
        } else {
            if (existsLocally > -1) {
                localList.splice(existsLocally, 1);
                updateBtnUI(false);
            } else {
                localList.push({ title, img, link, id: itemId });
                updateBtnUI(true);
            }
            localStorage.setItem('dramakan_mylist', JSON.stringify(localList));
        }
    } catch(e) {
        console.error("Error updating My List", e);
        alert("Please log in to manage your list.");
    }
};

document.addEventListener('DOMContentLoaded', async function () {
    
    // --- 1. SAFELY HANDLE AUTH UI & GATEKEEPER MODAL ---
    try {
        const { auth, db, firestoreModule } = await getFirebase();
        auth.onAuthStateChanged(async (user) => {
            const bottomAuthBtn = document.getElementById('bottomAuthBtn');
            const topAuthBtn = document.getElementById('topAuthBtn');
            
            if (user) {
                if(bottomAuthBtn) {
                    bottomAuthBtn.querySelector('.nav-label').innerText = 'Profile';
                    bottomAuthBtn.href = 'profile.html';
                }
                if(topAuthBtn) {
                    topAuthBtn.href = 'profile.html';
                    topAuthBtn.classList.add('logged-in');
                }

                const userDocRef = firestoreModule.doc(db, "users", user.uid);
                const docSnap = await firestoreModule.getDoc(userDocRef);
                
                let profiles = [];
                if (docSnap.exists() && docSnap.data().profiles) {
                    profiles = docSnap.data().profiles;
                } else {
                    profiles = [{
                        id: 'prof_default',
                        name: user.displayName || "User",
                        avatar: user.photoURL || `https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png`
                    }];
                }

                const sessionSelected = sessionStorage.getItem('Anykan_Session_Profile_Selected');
                const savedActiveId = localStorage.getItem('Anykan_active_profile_id');
                let activeProfile = profiles.find(p => p.id === savedActiveId) || profiles[0];

                if (!sessionSelected) {
                    const gatekeeperModal = document.getElementById('gatekeeperModal');
                    const gatekeeperGrid = document.getElementById('gatekeeperProfilesGrid');
                    
                    if (gatekeeperModal && gatekeeperGrid) {
                        gatekeeperGrid.innerHTML = profiles.map((prof) => {
                            const isEmoji = prof.avatar && prof.avatar.length <= 10 && !prof.avatar.includes('http') && !prof.avatar.includes('data:image');
                            return `
                                <div class="profile-item" onclick="window.selectGatekeeperProfile('${prof.id}', '${encodeURIComponent(JSON.stringify(prof))}')">
                                    ${isEmoji ? `<div class="avatar-placeholder">${prof.avatar}</div>` : `<img src="${prof.avatar}" alt="${prof.name}">`}
                                    <span>${prof.name}</span>
                                </div>
                            `;
                        }).join('');
                        
                        gatekeeperModal.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                } else {
                    updateHeaderAvatar(activeProfile);
                }

                window.selectGatekeeperProfile = (id, profStr) => {
                    const prof = JSON.parse(decodeURIComponent(profStr));
                    localStorage.setItem('Anykan_active_profile_id', id);
                    sessionStorage.setItem('Anykan_Session_Profile_Selected', 'true');
                    
                    document.getElementById('gatekeeperModal').classList.remove('active');
                    document.body.style.overflow = '';
                    
                    updateHeaderAvatar(prof);
                    window.dispatchEvent(new Event('profileSwitched'));
                };

                function updateHeaderAvatar(prof) {
                    const isEmoji = prof.avatar && prof.avatar.length <= 10 && !prof.avatar.includes('http') && !prof.avatar.includes('data:image');
                    
                    if(topAuthBtn) {
                        if (isEmoji) {
                            topAuthBtn.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:1.4rem; background:rgba(255,255,255,0.1); border-radius:50%;">${prof.avatar}</div>`;
                        } else {
                            topAuthBtn.innerHTML = `<img src="${prof.avatar}" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                        }
                    }
                    
                    if(bottomAuthBtn) {
                        const existingIcon = bottomAuthBtn.querySelector('.nav-icon');
                        if (existingIcon) {
                            if (isEmoji) {
                                existingIcon.outerHTML = `<div class="nav-icon avatar-icon" style="display:flex; align-items:center; justify-content:center; width:26px; height:26px; font-size:1.2rem; background:rgba(255,255,255,0.1); border-radius:50%; margin-bottom:4px;">${prof.avatar}</div>`;
                            } else {
                                existingIcon.outerHTML = `<img src="${prof.avatar}" class="nav-icon avatar-icon" alt="Profile" style="width:26px; height:26px; object-fit:cover; border-radius:50%; margin-bottom:4px; border:2px solid transparent; transition:all 0.4s ease;">`;
                            }
                        }
                    }
                }

            } else {
                if(bottomAuthBtn) {
                    bottomAuthBtn.querySelector('.nav-label').innerText = 'Login';
                    bottomAuthBtn.href = 'login.html';
                }
                if(topAuthBtn) {
                    topAuthBtn.innerHTML = '<i class="fas fa-user"></i>';
                    topAuthBtn.href = 'login.html';
                    topAuthBtn.classList.remove('logged-in');
                }
            }
        });
    } catch(e) { console.error("Auth Init Error:", e); }

    // --- 2. MOBILE MENU TOGGLE ---
    const menuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    document.body.appendChild(overlay);

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            overlay.classList.toggle('active');
        });
        overlay.addEventListener('click', () => {
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // --- 3. DATA POPULATION ---
    let fuse;
    const searchInputs = document.querySelectorAll('.search-input-field');
    const searchResultsBoxes = document.querySelectorAll('.search-results');
    const API_ORIGIN = window.location.origin.replace(':5501', ':8000').replace(':5500', ':8000');

    function populateGrid(elementId, items) {
        const grid = document.getElementById(elementId);
        if (!grid || !items || items.length === 0) return;
        
        grid.innerHTML = items.map((media) => {
            const safeTitle = encodeURIComponent(media.title);
            let actualImgString = 'assets/default-poster.jpg';
            if (typeof media.img === 'string') {
                actualImgString = media.img;
            } else if (media.img && typeof media.img === 'object') {
                actualImgString = media.img.extraLarge || media.img.large || media.img.medium || media.img.url || 'assets/default-poster.jpg';
            }

            const safeImg = encodeURIComponent(actualImgString);
            const safeLink = encodeURIComponent(media.link || `watch.html?id=${media.id}`);
            let optimizedImg = actualImgString;
            
            if (typeof optimizedImg === 'string') {
                if (optimizedImg.includes('image.tmdb.org/t/p/w500')) {
                    optimizedImg = optimizedImg.replace('/w500/', '/w342/');
                } else if (optimizedImg.includes('m.media-amazon.com') && optimizedImg.includes('._V1_')) {
                    optimizedImg = optimizedImg.replace(/\._V1_.*\.jpg$/i, '._V1_SX250.jpg');
                }
            }

            return `
            <a href="${media.link || `watch.html?id=${media.id}`}" class="anime-card">
                <div class="anime-card-img"><img src="${optimizedImg}" alt="${media.title}" loading="lazy" decoding="async"></div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${media.title}</h3>
                    <p class="anime-card-meta">${media.type}</p>
                </div>
                <button class="bookmark-btn" onclick="event.preventDefault(); window.toggleMyList(this, '${safeTitle}', '${safeImg}', '${safeLink}')" title="Add to My List">
                    <i class="fas fa-plus"></i>
                </button>
            </a>
        `;
        }).join('');
    }

    async function initializeAnimeSite() {
        let data = [];
        
        // --- LOCAL JSON FETCH ---
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`./anykan.json?v=${timestamp}`, { cache: 'no-store' });
            if (response.ok) {
                data = await response.json();
                localStorage.setItem('Anykan_master_db', JSON.stringify(data));
                fuse = new Fuse(data, { keys: ['title'], threshold: 0.4 });
            }
        } catch (err) { 
            console.error("Local JSON Load Error:", err); 
        }

        // --- HERO BANNER ---
        const heroCard = document.getElementById('hero-card');
        if (heroCard && data.length > 0) {
            let heroItems = data.filter(d => d.Hero === 'Y');
            if (heroItems.length === 0) heroItems = data.filter(d => d.Trend === "T").slice(0, 3);
            if (heroItems.length === 0) heroItems = data.slice(0, 3); 
            
            const item = heroItems[0]; 
            const safeLink = item.link || `watch.html?id=${item.id}`;
            const pcBanner = item.heroPCImg ? item.heroPCImg : item.img; 
            const mobileBanner = item.img;
            
            heroCard.innerHTML = `
                <div class="hero-image-wrapper">
                    <img class="hero-image pc-banner" src="${pcBanner}" alt="${item.title}">
                    <img class="hero-image mobile-banner" src="${mobileBanner}" alt="${item.title}">
                </div>
                <div class="hero-depth-shadow"></div>
                <div class="hero-vignette"></div>
                <div class="hero-content">
                    <div class="series-badge">${item.type ? item.type.toUpperCase() : 'FEATURED'}</div>
                    <h1 style="color: #fff; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; text-shadow: 0 4px 15px rgba(0,0,0,0.8); margin-bottom: 15px; line-height: 1.1;">${item.title}</h1>
                    <div class="hero-meta-tags">
                        <span>⭐ ${item.imdb || item.score || 'N/A'}</span>
                        <span class="meta-dot">•</span>
                        <span>${item.release_date || 'New'}</span>
                    </div>
                    <div class="hero-actions">
                        <a href="${safeLink}" class="btn-n btn-play"><i class="fas fa-play"></i> Play</a>
                        <button class="btn-n btn-mylist" onclick="window.toggleMyList(this, '${encodeURIComponent(item.title)}', '${encodeURIComponent(item.img)}', '${encodeURIComponent(safeLink)}')"><i class="fas fa-plus"></i> My List</button>
                    </div>
                </div>
            `;
        }

        function renderContinueWatching() {
            try {
                const savedActiveId = localStorage.getItem('Anykan_active_profile_id') || 'prof_default';
                const historyKey = 'Anykan_history_' + savedActiveId;
                
                let historyObj = JSON.parse(localStorage.getItem(historyKey));
                if (!historyObj && savedActiveId === 'prof_default') {
                    historyObj = JSON.parse(localStorage.getItem('Anykan_history')) || {};
                }

                const historyArr = Object.values(historyObj || {})
                    .filter(item => item && item.link && item.title && !item.link.toLowerCase().includes('index.html'))
                    .sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
                
                const cwSection = document.getElementById('continue-watching-section');
                const cwGrid = document.getElementById('continue-watching-grid');
                
                if (cwSection && cwGrid) {
                    if(historyArr.length > 0) {
                        cwSection.style.display = 'block';
                        cwSection.classList.add('is-visible'); 
                        
                        cwGrid.innerHTML = historyArr.map((item) => {
                            let actualImgString = 'assets/default-poster.jpg';
                            if (typeof item.img === 'string') {
                                actualImgString = item.img;
                            } else if (item.img && typeof item.img === 'object') {
                                actualImgString = item.img.extraLarge || item.img.large || item.img.medium || item.img.url || 'assets/default-poster.jpg';
                            }

                            return `
                            <a href="${item.link}" class="anime-card" style="border-color: rgba(157, 78, 221, 0.4);">
                                <div class="anime-card-img"><img src="${actualImgString}" alt="${item.title}" loading="lazy" decoding="async"></div>
                                <div class="anime-card-info">
                                    <h3 class="anime-card-title">${item.title}</h3>
                                    <p class="anime-card-meta" style="color: var(--primary-color);"><i class="fas fa-play"></i> Resume</p>
                                </div>
                            </a>`
                        }).join('');
                    } else { 
                        cwSection.style.display = 'none'; 
                    }
                }
            } catch(e) {}
        }
        renderContinueWatching(); 
        window.addEventListener('profileSwitched', renderContinueWatching);

        // --- GRID CONFIGS ---
        const gridConfigs = [
            { id: 'popular-anime-grid', apiEndpoint: `${API_ORIGIN}/anime/popular?page=1` },
            { id: 'trending-anime-grid', apiEndpoint: `${API_ORIGIN}/anime/trending?page=1` },
            { id: 'upcoming-anime-grid', apiEndpoint: `${API_ORIGIN}/anime/upcoming?page=1` },
            { id: 'schedule-anime-grid', apiEndpoint: `${API_ORIGIN}/anime/schedule?page=1` },
            { id: 'trending-grid', filterType: "Trending" }, 
            { id: 'hollywood-grid', filterType: "Hollywood Movie" },
            { id: 'bollywood-grid', filterType: "Bollywood Movie" },
            { id: 'web-shows-grid', filterType: ["Web Show", "English Series"] },
            { id: 'hindi-dramas-grid', filterType: "Hindi Drama" }
        ];

        const gridObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const targetId = entry.target.id;
                    const config = gridConfigs.find(c => c.id === targetId);

                    if (config) {
                        let sectionData = [];
                        
                        if (config.apiEndpoint) {
                            try {
                                const res = await fetch(config.apiEndpoint);
                                if (!res.ok) throw new Error(`HTTP Error`);
                                
                                const apiData = await res.json();
                                const animeList = apiData.results || apiData.data || apiData;
                                
                                if (Array.isArray(animeList)) {
                                    sectionData = animeList.slice(0, 15).map(anime => {
                                        // Robust mapping for schedule/nested items
                                        const media = anime.media || anime;
                                        
                                        let safeTitle = "Unknown";
                                        if (media.title) {
                                            safeTitle = typeof media.title === 'string' 
                                                ? media.title 
                                                : (media.title.english || media.title.romaji || media.title.userPreferred || "Unknown");
                                        }
                                        
                                        let safeImg = 'assets/default-poster.jpg';
                                        if (typeof media.image === 'string') safeImg = media.image;
                                        else if (media.coverImage) {
                                            if (typeof media.coverImage === 'string') safeImg = media.coverImage;
                                            else safeImg = media.coverImage.extraLarge || media.coverImage.large || safeImg;
                                        } else if (media.poster) safeImg = media.poster;
                                        
                                        const metaText = anime.airingAt 
                                            ? new Date(anime.airingAt * 1000).toLocaleDateString() 
                                            : (media.type || "Anime");

                                        return {
                                            id: media.id,
                                            title: safeTitle,
                                            img: safeImg,
                                            type: metaText,
                                            link: `watch-anime.html?id=${media.id}` 
                                        };
                                    });
                                }
                            } catch (err) {
                                console.error(`API Fetch Failed for ${targetId}:`, err);
                            }
                        } 
                        else if (data.length > 0) {
                            if (config.filterType === "Trending") {
                                sectionData = data.filter(d => d.Trend === "T").slice(0, 15);
                            } else if (Array.isArray(config.filterType)) {
                                sectionData = data.filter(d => config.filterType.includes(d.type)).slice(0, 15);
                            } else {
                                sectionData = data.filter(d => d.type === config.filterType).slice(0, 15);
                            }
                        }
                        
                        populateGrid(targetId, sectionData);
                        observer.unobserve(entry.target);
                    }
                }
            });
        }, { rootMargin: '300px' });

        gridConfigs.forEach(config => {
            const el = document.getElementById(config.id);
            if (el) gridObserver.observe(el);
        });
    }

    // --- SEARCH INTEGRATION (API PRIMARY, FUSE FALLBACK) ---
    searchInputs.forEach((input, index) => {
        let debounceTimer; 
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer); 
            debounceTimer = setTimeout(async () => {
                const query = input.value.trim();
                const targetResultsBox = searchResultsBoxes[index];
                
                if (query.length < 2) { 
                    targetResultsBox.style.display = 'none'; 
                    return; 
                }
                
                targetResultsBox.innerHTML = '<div style="padding:10px; text-align:center; color:var(--text-muted);">Searching...</div>';
                targetResultsBox.style.display = 'block';

                try {
                    const res = await fetch(`${API_ORIGIN}/anime/search?query=${encodeURIComponent(query)}&page=1`);
                    if (!res.ok) throw new Error("API failed");
                    const searchData = await res.json();
                    const results = searchData.results || searchData.data || [];

                    if (results.length === 0) throw new Error("No API results");

                    targetResultsBox.innerHTML = results.slice(0, 10).map(item => {
                        const safeTitle = item.title?.english || item.title?.romaji || item.title?.userPreferred || item.name || 'Unknown';
                        let safeImg = 'assets/default-poster.jpg';
                        if (typeof item.image === 'string') safeImg = item.image;
                        else if (item.coverImage) safeImg = item.coverImage.extraLarge || item.coverImage.large || item.coverImage;
                        else if (item.poster) safeImg = item.poster;

                        return `
                        <a href="watch-anime.html?id=${item.id}" class="search-result-item">
                            <img src="${safeImg}" width="45" height="60" loading="lazy" decoding="async">
                            <div><div class="search-result-title">${safeTitle}</div><small style="color:var(--primary-color);">${item.type || 'Anime'}</small></div>
                        </a>`;
                    }).join('');

                } catch (err) {
                    // Fallback to local search if API fails or returns empty
                    if (fuse) {
                        const localResults = fuse.search(query, { limit: 10 });
                        if (localResults.length > 0) {
                            targetResultsBox.innerHTML = localResults.map(({ item }) => {
                                return `
                                <a href="${item.link || `watch.html?id=${item.id}`}" class="search-result-item">
                                    <img src="${item.img}" width="45" height="60" loading="lazy" decoding="async">
                                    <div><div class="search-result-title">${item.title}</div><small style="color:var(--primary-color);">${item.type}</small></div>
                                </a>`;
                            }).join('');
                        } else {
                            targetResultsBox.innerHTML = '<div style="padding:10px; text-align:center; color:var(--text-muted);">No results found.</div>';
                        }
                    } else {
                        targetResultsBox.innerHTML = '<div style="padding:10px; text-align:center; color:#ff4d4d;">Search failed to connect.</div>';
                    }
                }
            }, 500); 
        });
    });

    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.latest-episodes').forEach(section => {
        section.classList.add('fade-in-section');
        sectionObserver.observe(section);
    });

    initializeAnimeSite();
});

document.addEventListener("DOMContentLoaded", function() {
    const modal = document.getElementById("animeModal");
    const openBtn = document.getElementById("animeRequestBtn");
    const closeBtn = document.getElementById("closeAnimeModal");
    const form = document.getElementById("animeRequestForm");

    if(openBtn && modal) {
        openBtn.onclick = async () => {
            const { auth } = await getFirebase();
            if (!auth.currentUser) {
                alert("You must be logged in to request content. Redirecting to Login...");
                window.location.href = "login.html";
            } else { modal.style.display = "flex"; }
        };
        closeBtn.onclick = () => modal.style.display = "none";
        window.onclick = (e) => { if(e.target === modal) modal.style.display = "none"; }
    }

    if(form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById("submitBtn");
            const status = document.getElementById("statusMessage");
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            try {
                const { auth, db, firestoreModule } = await getFirebase();
                const user = auth.currentUser;
                
                await firestoreModule.addDoc(firestoreModule.collection(db, "requests"), {
                    userId: user.uid,
                    animeName: document.getElementById("animeName").value.trim(),
                    status: "Pending",
                    createdAt: new Date().getTime()
                });

                status.style.display = "block";
                status.style.color = "#10b981";
                status.innerHTML = "<i class='fas fa-check-circle'></i> Request securely sent!";
                form.reset();
            } catch (err) {
                status.style.display = "block";
                status.style.color = "#ef4444";
                status.innerHTML = "<i class='fas fa-exclamation-circle'></i> Error: " + err.message;
            } finally {
                submitBtn.innerText = "Send Request";
                submitBtn.disabled = false;
            }
        };
    }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Failed', err));
  });
}