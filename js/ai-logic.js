const AI_CONFIG = {
    API_KEY: "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",
    URL: "https://api.groq.com/openai/v1/chat/completions",
    MODEL: "llama-3.3-70b-versatile"
};

export async function fetchAIDailyAnalysis(userData) {
    console.log("1. AI 분석 시작", userData);

    // [Performance Optimization] 시스템 프롬프트를 세분화하여 모델이 '8점' 같은 극단적 점수를 남발하지 않게 가이드라인 설정
    const systemRole = `You are an encouraging and professional Student Life Coach. 
    Your goal is to evaluate a student's day fairly based on South Korean cultural standards.
    
    [SCORING PHILOSOPHY]
    - Be balanced. Do not punish severely for a single unhealthy snack (e.g., Ramen/Snacks).
    - Study time is highly valued: 8-10 hours is 'Master Class', 4-6 hours is 'Good'.
    - Exercise time > 1 hour is a major positive factor.
    - Sleep < 5 hours should be flagged but not crash the entire score unless other factors are also poor.
    - Consistency is key. Give a score between 0-100.
    - NEVER give extremely low scores (like 0-20) unless the data is almost empty or harmful.`;

    const promptText = `
    Analyze this data (Input in Korean, Output in English):
    - Diet: Breakfast(${userData.breakfast}), Lunch(${userData.lunch}), Dinner(${userData.dinner}), Snacks(${userData.snacks})
    - Routine: Sleep ${userData.sleep}h, Study ${userData.study}h, Exercise ${userData.exercise}h, Screen Time ${userData.screen}h

    [OUTPUT RULES]
    1. Output strictly in JSON format.
    2. 'score': integer (0-100).
    3. 'tags': Array of 2-3 short hashtags (English).
    4. 'routine_feedback': 2 sentences about routines (English).
    5. 'diet_feedback': 2 sentences about nutrition (English).`;

    try {
        const response = await fetch(AI_CONFIG.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: "system", content: systemRole }, // [Modified] 페르소나와 채점 가이드 분리
                    { role: "user", content: promptText }
                ],
                response_format: { type: "json_object" },
                temperature: 0.6 // [Performance] 창의성과 일관성의 균형
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        
        const data = await response.json();
        const parsedContent = JSON.parse(data.choices[0].message.content);
        
        // [Refactored] 점수 안정화 장치 (비정상적인 점수 폭락 방지 로직 보강)
        if (parsedContent.score < 15 && userData.study > 3) parsedContent.score += 20; 

        return parsedContent;
    } catch (error) {
        console.error("🚨 AI 분석 에러:", error);
        throw error; 
    }
}
