// --- 0. THEME & HARDWARE DETECTION ---
(function initUI() {
    const savedTheme = localStorage.getItem('Anykan_theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.documentElement.classList.add('light-mode');
    }

    let isLowEnd = false;
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) isLowEnd = true;
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 4) isLowEnd = true;
    if (isLowEnd) {
        document.documentElement.classList.add('lite-mode');
        console.log("Budget device detected: Lite UI activated.");
    }
})();

// --- FIREBASE CONFIGURATION ---
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

document.addEventListener('DOMContentLoaded', async function () {
    
    // --- 1. SAFELY HANDLE AUTH UI (Fixes Auto Logout UI Bug) ---
    try {
        const { auth } = await getFirebase();
        auth.onAuthStateChanged((user) => {
            const bottomAuthBtn = document.getElementById('bottomAuthBtn');
            // Simply update the text, DO NOT run window.location.href redirects here.
            if (user) {
                if(bottomAuthBtn) bottomAuthBtn.querySelector('.nav-label').innerText = 'Profile';
            } else {
                if(bottomAuthBtn) bottomAuthBtn.querySelector('.nav-label').innerText = 'Login';
            }
        });
    } catch(e) { console.error("Auth Init Error:", e); }

    // --- 2. UI TOGGLES ---
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (document.documentElement.classList.contains('light-mode')) icon.className = 'fas fa-moon';
        else icon.className = 'fas fa-sun';

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            const isLight = document.documentElement.classList.contains('light-mode');
            localStorage.setItem('Anykan_theme', isLight ? 'light' : 'dark');
            icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

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

    function populateGrid(elementId, items) {
        const grid = document.getElementById(elementId);
        if (!grid) return;
        grid.innerHTML = items.map((media) => {
            const safeTitle = encodeURIComponent(media.title);
            const safeImg = encodeURIComponent(media.img);
            const safeLink = encodeURIComponent(media.link || `watch.html?id=${media.id}`);

            let optimizedImg = media.img;
            if (optimizedImg) {
                if (optimizedImg.includes('image.tmdb.org/t/p/w500')) optimizedImg = optimizedImg.replace('/w500/', '/w342/');
                else if (optimizedImg.includes('m.media-amazon.com') && optimizedImg.includes('._V1_')) optimizedImg = optimizedImg.replace(/\._V1_.*\.jpg$/i, '._V1_SX250.jpg');
            }

            // Dramakan Pure Poster HTML structure mapped to anime-card
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
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`/anykan.json?v=${timestamp}`, { cache: 'no-store' });
            data = await response.json();
            
            localStorage.setItem('Anykan_master_db', JSON.stringify(data));
            fuse = new Fuse(data, { keys: ['title'], threshold: 0.4 });

            // --- 4. SINGLE STATIC HERO INJECTION (DRAMAKAN STYLE) ---
            const heroCard = document.getElementById('hero-card');
            if (heroCard) {
                let heroItems = data.filter(d => d.Hero === 'Y');
                if (heroItems.length === 0) heroItems = data.filter(d => d.Trend === "T").slice(0, 3);
                if (heroItems.length === 0) heroItems = data.slice(0, 3); 
                
                const item = heroItems[0]; // ONLY ONE BANNER
                const safeLink = item.link || `watch.html?id=${item.id}`;
                const pcBanner = item.heroPCImg ? item.heroPCImg : item.img; 
                
                heroCard.innerHTML = `
                    <div class="hero-image-wrapper">
                        <img class="hero-image" src="${pcBanner}" alt="${item.title}">
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

            // Continue watching
            function renderContinueWatching() {
                try {
                    const historyObj = JSON.parse(localStorage.getItem('Anykan_history')) || {};
                    const historyArr = Object.values(historyObj)
                        .filter(item => item && item.link && item.title && !item.link.toLowerCase().includes('index.html'))
                        .sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
                    
                    const cwSection = document.getElementById('continue-watching-section');
                    const cwGrid = document.getElementById('continue-watching-grid');
                    
                    if (cwSection && cwGrid) {
                        if(historyArr.length > 0) {
                            cwSection.style.display = 'block';
                            cwGrid.innerHTML = historyArr.map((item) => {
                                return `
                                <a href="${item.link}" class="anime-card" style="border-color: rgba(157, 78, 221, 0.4);">
                                    <div class="anime-card-img"><img src="${item.img}" alt="${item.title}" loading="lazy" decoding="async"></div>
                                    <div class="anime-card-info">
                                        <h3 class="anime-card-title">${item.title}</h3>
                                        <p class="anime-card-meta" style="color: var(--primary-color);"><i class="fas fa-play"></i> Resume</p>
                                    </div>
                                </a>`
                            }).join('');
                        } else { cwSection.style.display = 'none'; }
                    }
                } catch(e) {}
            }
            renderContinueWatching(); 

            // Trending
            let manualTrending = data.filter(d => d.Trend === "T");
            populateGrid('trending-grid', manualTrending.slice(0, 15)); 

            // Grid Mappings
            const gridConfigs = [
                { id: 'hollywood-grid', filterType: "Hollywood Movie" },
                { id: 'bollywood-grid', filterType: "Bollywood Movie" },
                { id: 'anime-classic-grid', filterType: "Anime" },
                { id: 'web-shows-grid', filterType: ["Web Show", "English Series"] },
                { id: 'hindi-dramas-grid', filterType: "Hindi Drama" },
                { id: 'upcoming-grid', isUpcoming: true }
            ];

            const gridObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const targetId = entry.target.id;
                        const config = gridConfigs.find(c => c.id === targetId);

                        if (config) {
                            let sectionData = [];
                            if (config.isUpcoming) {
                                sectionData = data.filter(d => d.status === "Upcoming").slice(0, 15);
                            } else if (Array.isArray(config.filterType)) {
                                sectionData = data.filter(d => config.filterType.includes(d.type)).slice(0, 15);
                            } else {
                                sectionData = data.filter(d => d.type === config.filterType).slice(0, 15);
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

        } catch (err) { console.error("AnyKan JSON Load Error:", err); }
    }

    // Bind Search Logic to all search inputs (Mobile & PC)
    searchInputs.forEach((input, index) => {
        let debounceTimer; 
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer); 
            debounceTimer = setTimeout(() => {
                const query = input.value.trim();
                const targetResultsBox = searchResultsBoxes[index];
                
                if (query.length < 1 || !fuse) { targetResultsBox.style.display = 'none'; return; }
                
                const results = fuse.search(query, { limit: 10 });
                targetResultsBox.innerHTML = results.map(({ item }) => {
                    return `
                    <a href="${item.link || `watch.html?id=${item.id}`}" class="search-result-item">
                        <img src="${item.img}" width="45" height="60" loading="lazy" decoding="async">
                        <div><div class="search-result-title">${item.title}</div><small style="color:var(--primary-color);">${item.type}</small></div>
                    </a>`;
                }).join('');
                targetResultsBox.style.display = 'block';
            }, 300); 
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

// Modal Firebase Logic
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

// PWA Logic retained
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Failed', err));
  });
}