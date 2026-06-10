// [Senior Developer] js/main.js - Optimized for silent UX and full random data generation
import { auth, db, doc, setDoc, onAuthStateChanged } from './firebase-config.js';
import { fetchAIDailyAnalysis } from './ai-logic.js'; 

onAuthStateChanged(auth, (user) => {
    const greeting = document.getElementById('user-greeting');
    if (user && greeting) {
        greeting.innerText = 'Hello, ' + (user.displayName || user.email.split('@')[0]) + '!';
    }
});

export async function analyzeDay() {
    const routineText = document.getElementById('routine-feedback-text');
    const dietText = document.getElementById('diet-feedback-text');
    const scoreNum = document.querySelector('.score-num');
    const statusBar = document.querySelector('.status-fill');
    const analyzeBtn = document.querySelector('.btn-primary');

    if (!routineText || !dietText) return;

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Analyzing & Saving...";

    const userData = {
        sleep: document.getElementById('sleep-num').value,
        study: document.getElementById('study-num').value,
        exercise: document.getElementById('exercise-num').value,
        screen: document.getElementById('screen-num').value,
        breakfast: document.getElementById('breakfast-input').value || "None",
        lunch: document.getElementById('school-lunch').checked ? "School Lunch" : (document.getElementById('lunch-input').value || "None"),
        dinner: document.getElementById('dinner-input').value || "None",
        snacks: document.getElementById('snacks-input').value || "None"
    };

    try {
        const result = await fetchAIDailyAnalysis(userData);

        // UI Update
        scoreNum.innerText = result.score;
        routineText.innerText = result.routine_feedback;
        dietText.innerText = result.diet_feedback;
        
        if (statusBar) {
            statusBar.style.width = result.score + '%';
            statusBar.style.background = result.score >= 80 ? "#4CAF50" : (result.score >= 60 ? "#FFC107" : "#F44336");
        }

        // Firebase Sync
        if (auth.currentUser) {
            const uid = auth.currentUser.uid;
            const today = new Date().toLocaleDateString('sv-SE'); 
            
            await setDoc(doc(db, "users", uid, "daily_logs", today), {
                date: today, 
                score: Number(result.score), 
                routine_feedback: result.routine_feedback, 
                diet_feedback: result.diet_feedback, 
                tags: result.tags || ["#Daily"], 
                routine_data: userData,
                timestamp: new Date()
            });

            // [Modified] 알람 제거 및 콘솔 로그로 대체 (UX 개선)
            console.log(`✅ Success: Analysis for ${today} saved to Cloud.`);
        }

    } catch (err) {
        console.error("Analysis/Save Error:", err);
        // [Modified] 에러 발생 시에만 사용자에게 알림
        console.error("Critical Error occurred during analysis.");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerText = "Analyze My Day";
    }
}

// [Refactored] 모든 입력 필드를 무작위로 채우는 기능
export function fillRandomData() {
    console.log("🎲 Populating all fields with random data...");
    
    // 1. 루틴 숫자 데이터 채우기 (범위 설정 포함)
    const routineConfigs = [
        { id: 'sleep', min: 4, max: 9 },
        { id: 'study', min: 2, max: 12 },
        { id: 'exercise', min: 0, max: 2 },
        { id: 'screen', min: 1, max: 7 }
    ];

    routineConfigs.forEach(config => {
        const val = (Math.random() * (config.max - config.min) + config.min).toFixed(1);
        const numInput = document.getElementById(`${config.id}-num`);
        const sliderInput = document.getElementById(`${config.id}-slider`);
        if (numInput && sliderInput) {
            numInput.value = val;
            sliderInput.value = val;
        }
    });

    // 2. 식단 텍스트 데이터 채우기
    const mealOptions = [
        'Chicken Breast Salad', 'Kimchi Stew', 'Beef Bowl', 'Sandwich & Coffee', 
        'Protein Shake', 'Pasta', 'Ramen & Gimbap', 'Steak', 'Greek Yogurt', 'None'
    ];
    const getRandomMeal = () => mealOptions[Math.floor(Math.random() * mealOptions.length)];

    // [Performance Optimization] 모든 식단 필드 순회하며 입력
    const mealFields = ['breakfast-input', 'lunch-input', 'dinner-input', 'snacks-input'];
    
    // 급식 체크박스 해제 (랜덤 데이터를 직접 넣기 위해)
    const schoolLunchCheckbox = document.getElementById('school-lunch');
    if (schoolLunchCheckbox) {
        schoolLunchCheckbox.checked = false;
        const lunchInput = document.getElementById('lunch-input');
        if (lunchInput) {
            lunchInput.disabled = false;
            lunchInput.style.backgroundColor = "#FFF";
        }
    }

    mealFields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.value = getRandomMeal();
        }
    });
}

// Global scope mapping for HTML buttons
window.analyzeDay = analyzeDay;
window.fillRandomData = fillRandomData;