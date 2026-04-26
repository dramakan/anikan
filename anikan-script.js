// --- 0. THEME & HARDWARE DETECTION (RUNS IMMEDIATELY) ---
(function initUI() {
    // A. Theme Setup
    const savedTheme = localStorage.getItem('anikan_theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // Automatically apply light mode if user prefers it or previously saved it
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.documentElement.classList.add('light-mode');
    }

    // B. Hardware Power Setup (Lite Mode Fallback)
    let isLowEnd = false;
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) isLowEnd = true;
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 4) isLowEnd = true;
    if ('connection' in navigator && (navigator.connection.effectiveType === '3g' || navigator.connection.effectiveType === '2g')) isLowEnd = true;

    if (isLowEnd) {
        document.documentElement.classList.add('lite-mode');
        console.log("Budget device detected: Lite UI activated.");
    }
})();

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

// --- SINGLETON FIREBASE LOADER ---
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

document.addEventListener('DOMContentLoaded', function () {

    // --- 0. THEME TOGGLE LISTENER ---
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (document.documentElement.classList.contains('light-mode')) icon.className = 'fas fa-moon';
        else icon.className = 'fas fa-sun';

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('light-mode');
            const isLight = document.documentElement.classList.contains('light-mode');
            localStorage.setItem('anikan_theme', isLight ? 'light' : 'dark');
            icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        });
    }

    // --- 1. MOBILE MENU LOGIC ---
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
            const icon = menuToggle.querySelector('i');
            if (icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }
        });
        overlay.addEventListener('click', () => {
            navLinks.classList.remove('active');
            overlay.classList.remove('active');
            if (menuToggle.querySelector('i')) { menuToggle.querySelector('i').className = 'fas fa-bars'; }
        });
    }

    function shuffleArray(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // --- 2. DATA POPULATION & CAROUSELS ---
    let fuse;
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    function populateGrid(elementId, items) {
        const grid = document.getElementById(elementId);
        if (!grid) return;
        grid.innerHTML = items.map(anime => {
            const safeTitle = encodeURIComponent(anime.title);
            const safeImg = encodeURIComponent(anime.img);
            const safeLink = encodeURIComponent(anime.link || `watch.html?id=${anime.id}`);
            return `
            <a href="${anime.link || `watch.html?id=${anime.id}`}" class="anime-card">
                <div class="anime-card-img"><img src="${anime.img}" alt="${anime.title}" loading="lazy" decoding="async"></div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${anime.title}</h3>
                    <p class="anime-card-meta">${anime.type}</p>
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
            const cachedAnime = localStorage.getItem('anikan_master_db');
            const localVersion = localStorage.getItem('anikan_db_version') || "0";
            
            const fb = await getFirebase();
            const db = fb.db;
            const firestoreModule = fb.firestoreModule;
            const { collection, getDocs, doc, getDoc, query, orderBy, limit } = firestoreModule;

            let serverVersion = "0";
            try {
                const configRef = doc(db, "system", "config");
                const configSnap = await getDoc(configRef);
                if (configSnap.exists()) {
                    serverVersion = configSnap.data().lastUpdated.toString();
                }
            } catch(e) { console.log("Version check skipped/failed.", e); }

            // FIXED CACHE TRAP: Ensures cache isn't just an empty array causing blank screens
            let parsedCache = [];
            try { parsedCache = JSON.parse(cachedAnime) || []; } catch(e) {}

            if (cachedAnime && localVersion === serverVersion && parsedCache.length > 0) {
                data = parsedCache;
                console.log("Database is up to date! Loaded from LocalStorage.");
            } else {
                console.log("Fetching fresh anime from Firebase...");
                const cmsSnap = await getDocs(collection(db, "anime"));
                cmsSnap.forEach((d) => { 
                    let item = d.data();
                    item.id = d.id; 
                    data.push(item); 
                });
                
                if(data.length > 0) {
                    localStorage.setItem('anikan_master_db', JSON.stringify(data));
                    localStorage.setItem('anikan_db_version', serverVersion);
                }
            }

            fuse = new Fuse(data, { keys: ['title'], threshold: 0.4 });

            function renderContinueWatching() {
                try {
                    const historyObj = JSON.parse(localStorage.getItem('anikan_history')) || {};
                    const historyArr = Object.values(historyObj)
                        .filter(item => item && item.link && item.title && !item.link.toLowerCase().includes('index.html'))
                        .sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
                    
                    const cwSection = document.getElementById('continue-watching-section');
                    const cwGrid = document.getElementById('continue-watching-grid');
                    
                    if (cwSection && cwGrid) {
                        if(historyArr.length > 0) {
                            cwSection.style.display = 'block';
                            cwGrid.innerHTML = historyArr.map(item => `
                                <a href="${item.link}" class="anime-card" style="border-color: rgba(157, 78, 221, 0.4);">
                                    <div class="anime-card-img"><img src="${item.img}" alt="${item.title}" loading="lazy" decoding="async"></div>
                                    <div class="anime-card-info">
                                        <h3 class="anime-card-title">${item.title}</h3>
                                        <p class="anime-card-meta" style="color: var(--primary-color);"><i class="fas fa-play"></i> Resume</p>
                                    </div>
                                </a>
                            `).join('');
                        } else {
                            cwSection.style.display = 'none';
                        }
                    }
                } catch(e) { console.error("CW Render Error:", e); }
            }
            
            renderContinueWatching(); 
            window.addEventListener('historySynced', renderContinueWatching);

            // RENDER TRENDING
            try {
                const q = query(collection(db, "anime_stats"), orderBy("views", "desc"), limit(15));
                const querySnapshot = await getDocs(q);
                let dynamicTrending = [];
                querySnapshot.forEach((docStats) => {
                    if(docStats.data().title) {
                        const found = data.find(d => d.title && d.title.toLowerCase() === docStats.data().title.toLowerCase());
                        if(found) dynamicTrending.push(found);
                    }
                });
                if(dynamicTrending.length > 0) populateGrid('trending-grid', dynamicTrending);
                else populateGrid('trending-grid', data.filter(d => d.Trend === "T").slice(0, 15));
            } catch(e) { 
                populateGrid('trending-grid', data.filter(d => d.Trend === "T").slice(0, 15)); 
            }

            const gridConfigs = [
                { id: 'shonen-grid', filterType: "Shonen" },
                { id: 'isekai-grid', filterType: "Isekai" },
                { id: 'romance-grid', filterType: "Romance" },
                { id: 'movies-grid', filterType: "Movie" },
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
                                sectionData = shuffleArray(data.filter(d => d.status === "Upcoming")).slice(0, 15);
                            } else if (config.filterType === "Movie") {
                                sectionData = shuffleArray(data.filter(d => d.type === "Movie")).slice(0, 15);
                            } else {
                                sectionData = shuffleArray(data.filter(d => d.genre && d.genre.includes(config.filterType))).slice(0, 15);
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

        } catch (err) { console.error("Firebase Database Load Error:", err); }
    }

    if (searchInput) {
        let debounceTimer; 
        
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer); 
            
            debounceTimer = setTimeout(() => {
                const query = searchInput.value.trim();
                if (query.length < 1 || !fuse) { searchResults.style.display = 'none'; return; }
                
                const results = fuse.search(query, { limit: 10 });
                searchResults.innerHTML = results.map(({ item }) => {
                    return `
                    <a href="${item.link || `watch.html?id=${item.id}`}" class="search-result-item">
                        <img src="${item.img}" width="45" height="60" loading="lazy" decoding="async">
                        <div><div class="search-result-title">${item.title}</div><small style="color:var(--primary-color);">${item.type}</small></div>
                    </a>`;
                }).join('');
                searchResults.style.display = 'block';
            }, 300); 
        });
    }

const sliderWrapper = document.querySelector('.slider-wrapper');
    if (sliderWrapper) {
        let slideIndex = 0;
        let autoSlideInterval;
        let isAnimating = false;

        function initSlider() {
            let currentSlides = sliderWrapper.querySelectorAll('.slide');
            
            // FIX FOR MOBILE HERO: Sets background image dynamically
            currentSlides.forEach(slide => {
                const img = slide.querySelector('.slide-bg-image');
                if (img) slide.style.backgroundImage = `url('${img.src}')`;
            });

            // BUG FIX: Infinite carousels need at least 3 slides. 
            // If you only have 2, this safely clones them so the mobile loop never crashes!
            if (currentSlides.length === 2) {
                const clone1 = currentSlides[0].cloneNode(true);
                const clone2 = currentSlides[1].cloneNode(true);
                sliderWrapper.appendChild(clone1);
                sliderWrapper.appendChild(clone2);
            }

            if (window.innerWidth <= 992 && sliderWrapper.children.length > 1) {
                sliderWrapper.prepend(sliderWrapper.lastElementChild);
                sliderWrapper.style.transition = 'none';
                sliderWrapper.style.transform = `translateX(-100%)`;
                Array.from(sliderWrapper.children).forEach(s => s.classList.remove('active'));
                sliderWrapper.children[1].classList.add('active');
            }
            startAutoSlide();
        }

        function moveNext() {
            if (isAnimating) return;
            isAnimating = true;

            if (window.innerWidth <= 992 && sliderWrapper.children.length > 1) {
                sliderWrapper.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
                sliderWrapper.style.transform = `translateX(-200%)`;
                
                if(sliderWrapper.children[1]) sliderWrapper.children[1].classList.remove('active');
                if(sliderWrapper.children[2]) sliderWrapper.children[2].classList.add('active');

                setTimeout(() => {
                    sliderWrapper.style.transition = 'none';
                    sliderWrapper.appendChild(sliderWrapper.firstElementChild);
                    sliderWrapper.style.transform = `translateX(-100%)`;
                    isAnimating = false;
                }, 700);
            } else {
                const totalPC = sliderWrapper.children.length;
                slideIndex = (slideIndex + 1) % totalPC;
                sliderWrapper.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
                sliderWrapper.style.transform = `translateX(-${slideIndex * 100}%)`;
                setTimeout(() => { isAnimating = false; }, 700);
            }
        }

        function movePrev() {
            if (isAnimating) return;
            isAnimating = true;

            if (window.innerWidth <= 992 && sliderWrapper.children.length > 1) {
                sliderWrapper.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
                sliderWrapper.style.transform = `translateX(0%)`;
                
                if(sliderWrapper.children[1]) sliderWrapper.children[1].classList.remove('active');
                if(sliderWrapper.children[0]) sliderWrapper.children[0].classList.add('active');

                setTimeout(() => {
                    sliderWrapper.style.transition = 'none';
                    sliderWrapper.prepend(sliderWrapper.lastElementChild);
                    sliderWrapper.style.transform = `translateX(-100%)`;
                    isAnimating = false;
                }, 700);
            } else {
                const totalPC = sliderWrapper.children.length;
                slideIndex = (slideIndex - 1 + totalPC) % totalPC;
                sliderWrapper.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
                sliderWrapper.style.transform = `translateX(-${slideIndex * 100}%)`;
                setTimeout(() => { isAnimating = false; }, 700);
            }
        }

        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(moveNext, window.innerWidth <= 992 ? 3500 : 5000);
        }

        function resetAutoSlide() { startAutoSlide(); }

        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');
        if (nextBtn) nextBtn.addEventListener('click', () => { moveNext(); resetAutoSlide(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { movePrev(); resetAutoSlide(); });

        let startX = 0;
        let isDragging = false;
        let dragThresholdMet = false;

        function handleDragStart(e) {
            if (isAnimating) return;
            isDragging = true;
            dragThresholdMet = false;
            startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            clearInterval(autoSlideInterval); 
        }

        function handleDragMove(e) {
            if (!isDragging) return;
            const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
            if (Math.abs(startX - currentX) > 10) dragThresholdMet = true; 
        }

        function handleDragEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            const endX = e.type.includes('mouse') ? e.pageX : e.changedTouches[0].clientX;
            const diffX = startX - endX;

            if (Math.abs(diffX) > 50) { 
                if (diffX > 0) moveNext(); else movePrev(); 
            }
            resetAutoSlide(); 
        }

        sliderWrapper.addEventListener('touchstart', handleDragStart, { passive: true });
        sliderWrapper.addEventListener('touchmove', handleDragMove, { passive: true });
        sliderWrapper.addEventListener('touchend', handleDragEnd);
        
        sliderWrapper.addEventListener('mousedown', handleDragStart);
        sliderWrapper.addEventListener('mousemove', handleDragMove);
        sliderWrapper.addEventListener('mouseup', handleDragEnd);
        sliderWrapper.addEventListener('mouseleave', handleDragEnd);

        // Uses event delegation for clicks since slides might be cloned dynamically
        sliderWrapper.addEventListener('click', (e) => {
            if (dragThresholdMet) { e.preventDefault(); return; }
            const slide = e.target.closest('.slide');
            if (!slide) return;
            
            if (window.innerWidth <= 992 && !slide.classList.contains('active')) return;
            const btn = slide.querySelector('.btn-primary');
            const mobileLink = slide.querySelector('a[href^="watch.html"]');
            
            if (btn) window.location.href = btn.getAttribute('href');
            else if (mobileLink) window.location.href = mobileLink.getAttribute('href');
        });

        initSlider();
    }
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
                alert("You must be logged in to request an anime. Redirecting to Login...");
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
                const { collection, addDoc } = firestoreModule;
                const user = auth.currentUser;
                
                if (!user) {
                    status.style.display = "block";
                    status.style.color = "#ff4d4d";
                    status.innerText = "Error: Authentication expired. Please login again.";
                    return;
                }
                
                const animeName = document.getElementById("animeName").value.trim();

                await addDoc(collection(db, "requests"), {
                    userId: user.uid,
                    userEmail: user.email || "No email provided", 
                    animeName: animeName,
                    status: "Pending",
                    notified: false, 
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

document.addEventListener("DOMContentLoaded", function() {
    const installPopup = document.getElementById('appInstallPopup');
    const closeInstallBtn = document.getElementById('closeInstallPopup');
    
    if (installPopup && closeInstallBtn) {
        if (sessionStorage.getItem('hideInstallPopup') === 'true') installPopup.classList.add('hidden');
        closeInstallBtn.addEventListener('click', () => {
            installPopup.classList.add('hidden');
            sessionStorage.setItem('hideInstallPopup', 'true');
        });
    }
});