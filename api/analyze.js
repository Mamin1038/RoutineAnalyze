// [Senior Developer] Backend Proxy for Groq API
// 이 코드는 서버에서만 실행되므로 키가 밖으로 유출되지 않습니다.

export default async function handler(req, res) {
    // POST 요청만 허용
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // [Critical] 배포 사이트(Vercel/Netlify) 설정에서 넣을 환경 변수 이름
    const API_KEY = process.env.GROQ_API_KEY; 

    try {
        const userData = req.body;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a professional health coach. Output strictly valid JSON." },
                    { role: "user", content: `Analyze: ${JSON.stringify(userData)}` }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        // 프런트엔드로 결과 전송
        res.status(200).json(content);
    } catch (error) {
        res.status(500).json({ error: "Analysis Failed" });
    }
}