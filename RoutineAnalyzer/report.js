// [Senior Final Fix] report.js: Resolved button disappearance and centralized auth logic
import { 
    auth, db, collection, query, orderBy, limit, getDocs, doc, setDoc, onAuthStateChanged, signOut 
} from './js/firebase-config.js'; 

let currentUserUid = null;

const elements = {
    userDisplay: document.getElementById('user-display'),
    authArea: document.getElementById('auth-area'),
    logsList: document.getElementById('logs-list'),
    chartArea: document.getElementById('chart-area'),
    avgDisplay: document.getElementById('weekly-avg'),
    testBtn: document.getElementById('test-data-btn')
};

// 1. Centralized Authentication & UI Control
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        const userName = user.displayName || user.email.split('@')[0];
        
        // [Fixed] Navbar UI 업데이트 (VSC 에러 방지 문법)
        elements.authArea.innerHTML = '<span class="auth-status-text">Hi, ' + userName + '</span><button id="logout-btn" class="btn-logout">Logout</button>';
        
        // 로그아웃 이벤트 연결
        document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => location.reload());

        // [Added] Admin Check: 이메일이 admin@admin.com일 때만 시뮬레이션 버튼 노출
        if (user.email === 'admin@admin.com') {
            elements.testBtn.style.display = 'inline-block';
            initAdminButton(); // 버튼 이벤트 연결
        }

        await fetchWeeklyStats(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

// 2. Fetch & Render Data
async function fetchWeeklyStats(uid) {
    try {
        const q = query(collection(db, "users", uid, "daily_logs"), orderBy("date", "desc"), limit(7));
        const snapshot = await getDocs(q);
        
        let totalScore = 0;
        const chartData = []; 
        let listHtml = '';

        if (snapshot.empty) {
            renderEmpty();
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            totalScore += Number(data.score);
            
            listHtml += `
                <div class="log-item" style="border: 1px solid #eee; padding: 20px; border-radius: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; background: white;">
                    <div>
                        <h4 style="margin:0; font-size:1.1rem;">${data.date}</h4>
                        <div style="margin-top:8px;">
                            ${(data.tags || []).map(tag => `<span style="background:#E3F2FD; color:#1565C0; padding:2px 8px; border-radius:4px; font-size:0.7rem; font-weight:600; margin-right:4px;">${tag}</span>`).join('')}
                        </div>
                    </div>
                    <div style="font-size:1.4rem; font-weight:800; color:#4A90E2;">${data.score} <span style="font-size:0.8rem; color:#888;">pts</span></div>
                </div>
            `;
            chartData.unshift(data);
        });

        elements.avgDisplay.innerText = (totalScore / chartData.length).toFixed(1);
        elements.logsList.innerHTML = listHtml;
        renderChart(chartData);

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

function renderChart(data) {
    elements.chartArea.innerHTML = data.map(d => {
        const height = Math.max(d.score, 15);
        const color = d.score >= 80 ? '#4CAF50' : (d.score >= 60 ? '#FFC107' : '#F44336');
        return `
            <div class="bar-wrapper">
                <span style="font-size:0.75rem; font-weight:bold; color:${color}">${d.score}</span>
                <div class="bar" style="height:${height}%; background-color:${color}; width:100%; border-radius:6px 6px 0 0;"></div>
                <span style="font-size:0.7rem; color:#9CA3AF; margin-top:8px; font-weight:600;">${d.date.slice(5)}</span>
            </div>
        `;
    }).join('');
}

function renderEmpty() {
    elements.avgDisplay.innerText = "0";
    elements.chartArea.innerHTML = "<p class='empty-msg'>No data found.</p>";
    elements.logsList.innerHTML = "<p style='text-align:center; padding:40px; color:#999;'>No history.</p>";
}

// [Bug Fix] 3. Admin Button Logic: 버튼이 사라지지 않게 보호
function initAdminButton() {
    if (!elements.testBtn) return;

    elements.testBtn.onclick = async () => {
        if (!currentUserUid) return;

        // [Performance] 버튼 사라짐 방지: 텍스트만 바꾸고 비활성화
        elements.testBtn.disabled = true;
        elements.testBtn.innerText = "Processing...";

        try {
            const promises = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString('sv-SE');
                const score = Math.floor(Math.random() * 35) + 60;

                promises.push(setDoc(doc(db, "users", currentUserUid, "daily_logs", dateStr), {
                    date: dateStr, score, tags: ["#Admin", "#Test"],
                    routine_feedback: "Auto-generated", diet_feedback: "Auto-generated",
                    timestamp: d
                }));
            }
            await Promise.all(promises);
            location.reload(); // 성공 후 리로드하여 버튼 상태 복구
        } catch (err) {
            console.error("Generation Failed:", err);
            elements.testBtn.disabled = false;
            elements.testBtn.innerText = "Retry Generate";
        }
    };
}