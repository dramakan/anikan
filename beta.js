// beta.js - Anykan Beta UI & Feedback Engine
// Automatically injects HTML, CSS, and Firebase logic for the beta phase.

(async function initBetaEngine() {
    // Determine if the user is on the homepage and if testing locally
    const path = window.location.pathname;
    const isHomePage = path === '/' || path.endsWith('index.html') || path === '';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. INJECT CUTE & MATURE GLASSMORPHISM CSS
    const betaStyles = document.createElement('style');
    betaStyles.innerHTML = `
        /* --- GLOBAL BUG FAB (Cute Animated Button) --- */
        .anykan-bug-fab {
            position: fixed; bottom: 30px; left: 30px; width: 55px; height: 55px;
            border-radius: 50%; background: linear-gradient(135deg, #8A2BE2 0%, #6a1b9a 100%);
            border: 2px solid rgba(255, 255, 255, 0.2); color: #fff;
            font-size: 1.4rem; display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9990; box-shadow: 0 10px 25px rgba(138, 43, 226, 0.5);
            transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            font-family: 'Poppins', sans-serif;
            animation: bounceIn 1s cubic-bezier(0.28, 0.84, 0.42, 1);
        }
        .anykan-bug-fab:hover { 
            transform: translateY(-5px) scale(1.05); 
            box-shadow: 0 15px 35px rgba(138, 43, 226, 0.7); 
        }
        @media (max-width: 992px) { 
            .anykan-bug-fab { bottom: 85px; left: 15px; width: 50px; height: 50px; font-size: 1.2rem; } 
        }

        /* --- FULL SCREEN OVERLAY --- */
        .anykan-overlay {
            position: fixed; inset: 0; background: rgba(5, 5, 7, 0.85);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            z-index: 10000; display: flex; align-items: center; justify-content: center;
            padding: 20px; opacity: 1; transition: opacity 0.4s ease;
            font-family: 'Poppins', sans-serif;
        }
        .anykan-overlay.hidden { opacity: 0; pointer-events: none; }

        /* --- WELCOME PERMISSION CARD --- */
        .anykan-welcome-card {
            background: rgba(20, 20, 28, 0.95); border: 1px solid rgba(138, 43, 226, 0.4);
            border-radius: 24px; width: 100%; max-width: 500px; padding: 40px 30px;
            position: relative; box-shadow: 0 25px 50px rgba(0,0,0,0.8), inset 0 0 80px rgba(138, 43, 226, 0.1);
            transform: translateY(0) scale(1); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            text-align: center;
        }
        .anykan-overlay.hidden .anykan-welcome-card { transform: translateY(30px) scale(0.95); }

        .anykan-emoji-header { font-size: 3.5rem; margin-bottom: 15px; line-height: 1; text-shadow: 0 10px 20px rgba(138, 43, 226, 0.4); }
        .anykan-welcome-title { font-size: 1.6rem; font-weight: 700; color: #fff; margin: 0 0 15px 0; }
        .anykan-welcome-text { font-size: 0.95rem; color: #D1D5DB; margin: 0 0 20px 0; line-height: 1.6; }
        
        .anykan-permission-box {
            background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 16px; padding: 15px; margin-bottom: 25px; text-align: left;
        }
        .anykan-permission-box p { margin: 0; font-size: 0.85rem; color: #A7F3D0; line-height: 1.5; }
        .anykan-permission-box i { color: #10B981; margin-right: 5px; }

        .anykan-agree-btn {
            width: 100%; background: linear-gradient(135deg, #8A2BE2 0%, #6a1b9a 100%); border: none; padding: 14px;
            border-radius: 14px; color: #fff; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s;
        }
        .anykan-agree-btn:hover { box-shadow: 0 8px 25px rgba(138, 43, 226, 0.5); transform: translateY(-2px); }

        /* --- CUTE BUG REPORT CARD --- */
        .anykan-report-card {
            background: rgba(20, 20, 28, 0.95); border: 1px solid rgba(255, 71, 87, 0.4);
            border-radius: 24px; width: 100%; max-width: 450px; padding: 35px 30px;
            position: relative; box-shadow: 0 25px 50px rgba(0,0,0,0.8), inset 0 0 80px rgba(255, 71, 87, 0.1);
            transform: translateY(0) scale(1); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .anykan-overlay.hidden .anykan-report-card { transform: translateY(30px) scale(0.95); }

        .anykan-close-btn {
            position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.8rem;
            color: #9CA3AF; cursor: pointer; transition: 0.3s;
        }
        .anykan-close-btn:hover { color: #fff; transform: rotate(90deg); }

        .anykan-report-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .anykan-report-icon { font-size: 2.5rem; text-shadow: 0 5px 15px rgba(255, 71, 87, 0.4); }
        .anykan-report-titles h3 { margin: 0 0 5px 0; color: #fff; font-size: 1.3rem; }
        .anykan-report-titles p { margin: 0; color: #9CA3AF; font-size: 0.85rem; }

        .anykan-textarea {
            width: 100%; height: 100px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; padding: 15px; color: #fff; font-family: inherit; font-size: 0.9rem; 
            resize: none; outline: none; margin-bottom: 15px; transition: 0.3s; box-sizing: border-box;
        }
        .anykan-textarea:focus { border-color: #ff4757; background: rgba(0,0,0,0.5); box-shadow: inset 0 2px 5px rgba(0,0,0,0.2); }

        .anykan-send-btn {
            width: 100%; background: #ff4757; border: none; padding: 14px;
            border-radius: 14px; color: #fff; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s;
        }
        .anykan-send-btn:hover { box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4); transform: translateY(-2px); }
        .anykan-send-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .anykan-status { margin-top: 15px; font-size: 0.85rem; text-align: center; display: none; font-weight: 500;}
        
        @keyframes bounceIn {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(betaStyles);

    // 2. INJECT HTML INTO DOM
    const betaContainer = document.createElement('div');
    
    // Base HTML that goes on ALL pages
    let htmlContent = `
        <button id="anykanBugBtn" class="anykan-bug-fab" title="Report a Bug">
            <i class="fas fa-bug"></i>
        </button>

        <div id="anykanReportOverlay" class="anykan-overlay hidden">
            <div class="anykan-report-card">
                <button class="anykan-close-btn" id="anykanCloseReport">&times;</button>
                
                <div class="anykan-report-header">
                    <div class="anykan-report-icon">🐛</div>
                    <div class="anykan-report-titles">
                        <h3>Spotted a Bug?</h3>
                        <p>Help us squash it! Tell us what's broken.</p>
                    </div>
                </div>

                <textarea id="anykanFeedbackInput" class="anykan-textarea" placeholder="E.g., Episode 4 of this show is playing the wrong video..."></textarea>
                <button id="anykanSubmitBtn" class="anykan-send-btn">Send Report 🛠️</button>
                <div id="anykanStatus" class="anykan-status"></div>
            </div>
        </div>
    `;

    // Only append the Welcome Popup if the user is on the Homepage
    if (isHomePage) {
        htmlContent += `
            <div id="anykanWelcomeOverlay" class="anykan-overlay hidden">
                <div class="anykan-welcome-card">
                    <div class="anykan-emoji-header">🍿✨</div>
                    <h2 class="anykan-welcome-title">Welcome to Anykan!</h2>
                    <p class="anykan-welcome-text">
                        We're thrilled to have you here! <br><br>
                        <strong style="color: #fff;">Worried about your history? Don't be! 😌</strong><br>
                        Simply log in with your Dramakan account, and you can continue watching exactly where you left off. We've magically synced your watchlists, history, and VIP status into this one place.
                    </p>
                    
                    <div class="anykan-permission-box">
                        <p><i class="fas fa-user-shield"></i> <strong>Testing Permission:</strong> Please explore the site and share your feedback! We <strong>DO NOT</strong> collect any personal data. We only collect the bug reports you send us to help improve the site.</p>
                    </div>
                    
                    <p style="font-size: 0.85rem; color: #9CA3AF; margin-bottom: 20px;">If you see any irregular shows or mismatched details, just click the cute bug button on the bottom left!</p>
                    
                    <button id="anykanAgreeBtn" class="anykan-agree-btn">I'm in! Let's Explore 🚀</button>
                </div>
            </div>
        `;
    }

    betaContainer.innerHTML = htmlContent;
    document.body.appendChild(betaContainer);

    // 3. JAVASCRIPT LOGIC

    const reportOverlay = document.getElementById("anykanReportOverlay");
    const closeReportBtn = document.getElementById("anykanCloseReport");
    const bugBtn = document.getElementById("anykanBugBtn");
    
    const submitBtn = document.getElementById("anykanSubmitBtn");
    const statusMsg = document.getElementById("anykanStatus");
    const input = document.getElementById("anykanFeedbackInput");

    const closeReport = () => {
        reportOverlay.classList.add("hidden");
        setTimeout(() => { statusMsg.style.display = "none"; input.value = ""; }, 400); 
    };

    bugBtn.addEventListener("click", () => reportOverlay.classList.remove("hidden"));
    closeReportBtn.addEventListener("click", closeReport);
    reportOverlay.addEventListener("click", (e) => { if (e.target === reportOverlay) closeReport(); });

    // --- PRE-LOAD FIREBASE SECURELY ---
    let auth, db, fsAddDoc, fsCollection, fsServerTimestamp;
    
    try {
        const [appModule, authModule, fsModule] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js")
        ]);

        const firebaseConfig = {
            apiKey: "AIzaSyB7i67_T7fs87BHIY2Pxs6KRAknhXrowIA",
            authDomain: "dramakan007.firebaseapp.com",
            projectId: "dramakan007"
        };

        const app = !appModule.getApps().length ? appModule.initializeApp(firebaseConfig) : appModule.getApp();
        auth = authModule.getAuth(app);
        db = fsModule.getFirestore(app);
        
        fsAddDoc = fsModule.addDoc;
        fsCollection = fsModule.collection;
        fsServerTimestamp = fsModule.serverTimestamp;
    } catch (e) {
        console.error("Firebase module failed to load in Beta Engine", e);
    }

    // --- SUBMISSION LOGIC ---
    submitBtn.addEventListener("click", async () => {
        const feedback = input.value.trim();
        if (!feedback) {
            input.style.borderColor = "#ff4757";
            setTimeout(() => input.style.borderColor = "rgba(255,255,255,0.1)", 1000);
            return;
        }

        // Verify Firebase loaded correctly
        if (!auth || !db) {
            statusMsg.style.display = "block";
            statusMsg.style.color = "#ef4444";
            statusMsg.innerHTML = "<i class='fas fa-exclamation-circle'></i> System offline. Please refresh the page.";
            return;
        }

        // Must be logged in to bypass Firestore security rules
        const user = auth.currentUser;
        if (!user) {
            statusMsg.style.display = "block";
            statusMsg.style.color = "#ef4444";
            statusMsg.innerHTML = "<i class='fas fa-exclamation-circle'></i> Please log in to send a report.";
            return;
        }

        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Squashing...';
        submitBtn.disabled = true;

        try {
            await fsAddDoc(fsCollection(db, "reports"), {
                userId: user.uid,
                userEmail: user.email || "No email",
                username: user.displayName || "User",
                dramaId: "Global",
                dramaName: "Anykan Beta Platform",
                season: 0,
                episode: 0,
                issue: "Beta Phase Bug Report",
                details: feedback,
                server: "N/A",
                timestamp: fsServerTimestamp(),
                status: "Pending"
            });

            statusMsg.style.display = "block";
            statusMsg.style.color = "#10b981";
            statusMsg.innerHTML = "<i class='fas fa-check-circle'></i> Got it! Thanks for helping us improve.";
            input.value = "";
            
            setTimeout(() => { 
                closeReport(); 
                submitBtn.innerHTML = "Send Report 🛠️";
                submitBtn.disabled = false;
            }, 2500);

        } catch (err) {
            console.error("Beta Report Error:", err);
            statusMsg.style.display = "block";
            statusMsg.style.color = "#ef4444";
            // Shows exact Firebase error so you know if it's a rule block
            statusMsg.innerHTML = `<i class='fas fa-exclamation-circle'></i> Error: ${err.message}`;
            submitBtn.innerHTML = "Send Report 🛠️";
            submitBtn.disabled = false;
        }
    });

    // --- Welcome Permission Logic (Homepage Only) ---
    if (isHomePage) {
        const welcomeOverlay = document.getElementById("anykanWelcomeOverlay");
        const agreeBtn = document.getElementById("anykanAgreeBtn");
        
        const todayStr = new Date().toDateString();
        const lastAgreed = localStorage.getItem("anykan_beta_agreed_date");
        
        // If testing on localhost, OR if they haven't agreed today, show the popup
        if (isLocalhost || lastAgreed !== todayStr) {
            setTimeout(() => {
                welcomeOverlay.classList.remove("hidden");
            }, 1000);
        }

        agreeBtn.addEventListener("click", () => {
            localStorage.setItem("anykan_beta_agreed_date", todayStr);
            welcomeOverlay.classList.add("hidden");
        });
    }

})();