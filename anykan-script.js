// --- 0. THEME & HARDWARE DETECTION (RUNS IMMEDIATELY) ---
(function initUI() {
    const savedTheme = localStorage.getItem('Anykan_theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.documentElement.classList.add('light-mode');
    }

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
  appId: "1:491393581039:web:8204fb8753094a64a9401a",
  measurementId: "G-PCV97GFYQ7"
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

document.addEventListener('DOMContentLoaded', function () {
    const marqueeContainer = document.querySelector('.marquee-container');
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContainer && marqueeContent) {
        const clone = marqueeContent.cloneNode(true);
        marqueeContainer.appendChild(clone);
    }

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

    let fuse;
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    function populateGrid(elementId, items) {
        const grid = document.getElementById(elementId);
        if (!grid) return;
        grid.innerHTML = items.map(media => {
            const safeTitle = encodeURIComponent(media.title);
            const safeImg = encodeURIComponent(media.img);
            const safeLink = encodeURIComponent(media.link || `watch.html?id=${media.id}`);
            return `
            <a href="${media.link || `watch.html?id=${media.id}`}" class="anime-card">
                <div class="anime-card-img"><img src="${media.img}" alt="${media.title}" loading="lazy" decoding="async"></div>
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
            // THE 0-READ JSON ARCHITECTURE
            const response = await fetch('/anykan.json');
            data = await response.json();
            
            localStorage.setItem('Anykan_master_db', JSON.stringify(data));
            fuse = new Fuse(data, { keys: ['title'], threshold: 0.4 });

            // --- 1. DYNAMIC HERO SLIDER W/ PC/MOBILE POSTERS ---
            const heroWrapper = document.getElementById('hero-slider-wrapper');
            if (heroWrapper) {
                let heroItems = data.filter(d => d.Hero === 'Y');
                
                // Fallback to top 3 trending if nothing is marked as Hero
                if (heroItems.length === 0) {
                    heroItems = data.filter(d => d.Trend === "T").slice(0, 3);
                    if (heroItems.length === 0) heroItems = data.slice(0, 3); 
                }
                
                heroWrapper.innerHTML = heroItems.map(item => {
                    const safeLink = item.link || `watch.html?id=${item.id}`;
                    // Use wide PC banner if it exists, otherwise fall back to regular poster
                    const pcBanner = item.heroPCImg ? item.heroPCImg : item.img; 
                    
                    return `
                    <div class="slide" style="--mobile-poster: url('${item.img}');">
                        <img class="slide-bg-image" src="${pcBanner}" alt="${item.title}">
                        <div class="slide-content">
                            <h1 class="slide-title">${item.title}</h1>
                            <div class="slide-meta"><span>⭐ ${item.imdb || item.score || 'N/A'}</span><span>${item.type}</span></div>
                            <p class="slide-desc">${item.synopsis}</p>
                            <a href="${safeLink}" class="btn btn-primary">Watch Now</a>
                        </div>
                        <div class="hero-mobile-bar">
                            <div class="hero-mobile-title">${item.title}</div>
                            <a href="${safeLink}"><button class="hero-play-btn"><i class="fas fa-play"></i></button></a>
                        </div>
                    </div>`;
                }).join('');
                
                initSlider(); 
            }

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

            // --- 2. ADVANCED TRENDING (Automated + Ordered Manual) ---
            try {
                // Get organic most viewed stats
                const fb = await getFirebase();
                const q = fb.firestoreModule.query(fb.firestoreModule.collection(fb.db, "anime_stats"), fb.firestoreModule.orderBy("views", "desc"), fb.firestoreModule.limit(10));
                const querySnapshot = await fb.firestoreModule.getDocs(q);
                
                let dynamicTrending = [];
                querySnapshot.forEach((docStats) => {
                    if(docStats.data().title) {
                        const found = data.find(d => d.title && d.title.toLowerCase() === docStats.data().title.toLowerCase());
                        if(found) dynamicTrending.push(found);
                    }
                });

                // Get manual trending from Admin panel
                const manualTrending = data.filter(d => d.Trend === "T");
                
                // Combine and deduplicate
                let combinedTrending = [...dynamicTrending, ...manualTrending].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                
                // Sort items mathematically based on trendingOrder input
                combinedTrending.sort((a, b) => {
                    const orderA = a.trendingOrder ? parseInt(a.trendingOrder) : 9999;
                    const orderB = b.trendingOrder ? parseInt(b.trendingOrder) : 9999;
                    return orderA - orderB;
                });
                
                populateGrid('trending-grid', combinedTrending.slice(0, 15));
            } catch(e) { 
                // Fallback sorting if Firebase stats fail
                let manualTrending = data.filter(d => d.Trend === "T");
                manualTrending.sort((a, b) => {
                    const orderA = a.trendingOrder ? parseInt(a.trendingOrder) : 9999;
                    const orderB = b.trendingOrder ? parseInt(b.trendingOrder) : 9999;
                    return orderA - orderB;
                });
                populateGrid('trending-grid', manualTrending.slice(0, 15)); 
            }

            // --- 3. UNIVERSAL MEDIA GRID MAPPING ---
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
                                sectionData = shuffleArray(data.filter(d => d.status === "Upcoming")).slice(0, 15);
                            } else if (Array.isArray(config.filterType)) {
                                sectionData = shuffleArray(data.filter(d => config.filterType.includes(d.type))).slice(0, 15);
                            } else {
                                sectionData = shuffleArray(data.filter(d => d.type === config.filterType)).slice(0, 15);
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
            
            currentSlides.forEach(slide => {
                const img = slide.querySelector('.slide-bg-image');
                // Uses the src of the slide-bg-image (which handles the PC fallback logic perfectly)
                if (img) slide.style.backgroundImage = `url('${img.src}')`;
            });

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

        // initSlider() is called dynamically once JSON is fetched!
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