// beta.js - Anykan Beta UI & Feedback Engine
// Automatically injects HTML, CSS, and Firebase logic for the beta phase.

(async function initBetaEngine() {
    // Determine if the user is on the homepage and if testing locally
    const path = window.location.pathname;
    const isHomePage = path === '/' || path.endsWith('index.html') || path === '';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. INJECT CUTE & MATURE GLASSMORPHISM CSS WITH MOBILE FIXES
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
        }
        .anykan-bug-fab:hover {
            transform: scale(1.1) translateY(-3px);
            box-shadow: 0 15px 30px rgba(138, 43, 226, 0.7);
        }

        /* --- WELCOME OVERLAY / MODAL MOBILE FIXES --- */
        #anykanWelcomeOverlay {
            position: fixed; inset: 0; background: rgba(5, 5, 7, 0.85);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 100000; padding: 20px; box-sizing: border-box;
            transition: opacity 0.5s ease;
        }
        #anykanWelcomeOverlay.hidden {
            opacity: 0; pointer-events: none;
        }
        
        .anykan-welcome-card {
            background: rgba(20, 20, 28, 0.75);
            border: 1px solid rgba(138, 43, 226, 0.25);
            border-radius: 24px;
            padding: 35px 25px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(138, 43, 226, 0.15);
            font-family: 'Poppins', sans-serif;
            color: #fff;
            box-sizing: border-box;
            
            /* CRITICAL MOBILE RESILIENCE FIXES */
            max-height: 90vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            
            /* Smooth custom scrollbar tracking for inside the modal card */
            scrollbar-width: thin;
            scrollbar-color: #8A2BE2 rgba(255,255,255,0.05);
        }
        
        .anykan-welcome-card::-webkit-scrollbar {
            width: 6px;
        }
        .anykan-welcome-card::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .anykan-welcome-card::-webkit-scrollbar-thumb {
            background: #8A2BE2;
            border-radius: 10px;
        }

        .anykan-welcome-title {
            font-size: 1.8rem; font-weight: 700; margin-bottom: 15px;
            background: linear-gradient(135deg, #fff 30%, #d8b4fe 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .anykan-welcome-desc {
            font-size: 0.95rem; color: rgba(255, 255, 255, 0.75);
            line-height: 1.6; margin-bottom: 25px;
        }
        
        #anykanAgreeBtn {
            background: linear-gradient(135deg, #8A2BE2 0%, #7b2cbf 100%);
            color: #fff; border: none; padding: 14px 35px; font-size: 1rem;
            font-weight: 600; border-radius: 12px; cursor: pointer;
            transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(138, 43, 226, 0.3);
            width: 100%; margin-top: auto; flex-shrink: 0;
        }
        #anykanAgreeBtn:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(138, 43, 226, 0.5);
        }

        /* --- BETA REPORT OVERLAY STYLES --- */
        #anykanReportOverlay {
            position: fixed; inset: 0; background: rgba(5, 5, 7, 0.8);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            display: flex; justify-content: center; align-items: center;
            z-index: 100010; padding: 20px; box-sizing: border-box;
            transition: opacity 0.4s ease;
        }
        #anykanReportOverlay.hidden { opacity: 0; pointer-events: none; }
        
        .anykan-report-card {
            background: rgba(20, 20, 28, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px; padding: 30px; max-width: 500px; width: 100%;
            box-shadow: 0 25px 60px rgba(0,0,0,0.6); color: #fff;
            font-family: 'Poppins', sans-serif; box-sizing: border-box;
            position: relative; max-height: 90vh; overflow-y: auto;
        }
        .anykan-report-close {
            position: absolute; top: 20px; right: 20px; background: none;
            border: none; color: rgba(255,255,255,0.4); font-size: 1.2rem;
            cursor: pointer; transition: color 0.2s;
        }
        .anykan-report-close:hover { color: #fff; }
        .anykan-report-title { font-size: 1.4rem; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        .anykan-report-desc { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 20px; line-height: 1.5; }
        
        .anykan-textarea {
            width: 100%; height: 120px; background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
            color: #fff; padding: 12px; font-size: 0.9rem; resize: none;
            box-sizing: border-box; transition: all 0.3s; font-family: inherit;
        }
        .anykan-textarea:focus {
            outline: none; border-color: #8A2BE2; background: rgba(138, 43, 226, 0.05);
            box-shadow: 0 0 15px rgba(138, 43, 226, 0.15);
        }
        
        #btn-submit-report {
            background: #8A2BE2; color: #fff; border: none; padding: 12px 25px;
            font-size: 0.95rem; font-weight: 500; border-radius: 10px;
            cursor: pointer; width: 100%; margin-top: 15px; transition: all 0.2s;
        }
        #btn-submit-report:hover { background: #9d4edd; }
        #btn-submit-report:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: not-allowed; }
        
        #report-status-msg { font-size: 0.85rem; text-align: center; margin-top: 12px; display: none; }
    `;
    document.head.appendChild(betaStyles);

    // 2. INJECT HTML WORKSPACE (Welcome Popup + Bug Reporting Form)
    const betaHTML = document.createElement('div');
    betaHTML.innerHTML = `
        <button class="anykan-bug-fab" id="anykanBugFab" title="Report Platform Issue">
            <i class="fas fa-bug"></i>
        </button>

        <div id="anykanWelcomeOverlay" class="hidden">
            <div class="anykan-welcome-card">
                <div class="anykan-welcome-title">Welcome to Anykan Beta</div>
                <div class="anykan-welcome-desc">
                    Thank you for joining our testing phase! You have premium access to watch your favorite Movies, TV Shows, Anime, and Asian Dramas. Help us perfect the system by submitting layout bugs or functional issues directly via the floating action button.
                </div>
                <button id="anykanAgreeBtn">Let Me In 🚀</button>
            </div>
        </div>

        <div id="anykanReportOverlay" class="hidden">
            <div class="anykan-report-card">
                <button class="anykan-report-close" id="anykanCloseReportBtn"><i class="fas fa-times"></i></button>
                <div class="anykan-report-title"><i class="fas fa-tools" style="color:#8A2BE2;"></i> Beta Diagnostic Form</div>
                <div class="anykan-report-desc">Encountered an obstacle? Broadcast details straight to our technical management interface layer instantly.</div>
                <textarea class="anykan-textarea" id="anykanReportFeedback" placeholder="Describe the behavior or glitch clearly..."></textarea>
                <button id="btn-submit-report">Send Report 🛠️</button>
                <div id="report-status-msg"></div>
            </div>
        </div>
    `;
    document.body.appendChild(betaHTML);

    // 3. CORE UI INTERACTION ENGINE LOGIC
    const bugFab = document.getElementById("anykanBugFab");
    const reportOverlay = document.getElementById("anykanReportOverlay");
    const closeReportBtn = document.getElementById("anykanCloseReportBtn");
    const submitBtn = document.getElementById("btn-submit-report");
    const feedbackInput = document.getElementById("anykanReportFeedback");
    const statusMsg = document.getElementById("report-status-msg");

    const openReport = () => { reportOverlay.classList.remove("hidden"); feedbackInput.focus(); };
    const closeReport = () => { reportOverlay.classList.add("hidden"); feedbackInput.value = ""; statusMsg.style.display = "none"; };

    bugFab.addEventListener("click", openReport);
    closeReportBtn.addEventListener("click", closeReport);
    reportOverlay.addEventListener("click", (e) => { if (e.target === reportOverlay) closeReport(); });

    // --- Firebase Reporting Transaction Module Integration ---
    submitBtn.addEventListener("click", async () => {
        const feedback = feedbackInput.value.trim();
        if (!feedback) return;

        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Dispatching...';
        submitBtn.disabled = true;

        try {
            // Lazy load dependencies explicitly safely
            const auth = window.auth;
            const db = window.db;
            const firestoreModule = window.firestoreModule;

            if (!auth || !db || !firestoreModule) {
                throw new Error("Core environment configuration files missing.");
            }

            const user = auth.currentUser;

            await firestoreModule.addDoc(firestoreModule.collection(db, "reports"), {
                userId: user ? user.uid : "Anonymous",
                userEmail: user ? (user.email || "No email") : "Anonymous",
                username: user ? (user.displayName || "User") : "Beta Tester",
                dramaId: "Global",
                dramaName: "Anykan Beta Platform",
                season: 0,
                episode: 0,
                issue: "Beta Phase Bug Report",
                details: feedback,
                server: "N/A",
                timestamp: firestoreModule.serverTimestamp(),
                status: "Pending"
            });

            statusMsg.style.display = "block";
            statusMsg.style.color = "#10b981";
            statusMsg.innerHTML = "<i class='fas fa-check-circle'></i> Got it! Thanks for helping us improve.";
            feedbackInput.value = "";
            
            setTimeout(() => { 
                closeReport(); 
                submitBtn.innerHTML = "Send Report 🛠️";
                submitBtn.disabled = false;
            }, 2500);

        } catch (err) {
            console.error("Beta Report Error:", err);
            statusMsg.style.display = "block";
            statusMsg.style.color = "#ef4444";
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
        
        // Show modal if testing on local setup environment or if verification hasn't been done today
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