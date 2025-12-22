// === Sika API Keys Pool ===
const API_KEYS_POOL = [
    "AIzaSyDTdmqaOHerwTOpfe9qKSCP895CcIErOwo", // ראשי
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U", 
    "AIzaSyCQibBA_sC1St4u8YKit-zCzvPKl6_YE4I",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

const CX_IDS = ["3331a7d5c75e14f26", "635bc3eeee0194b16", "1340c66f5e73a4076"];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// --- 1. AI שיווקי: יצירת תיאור כללי ---
export async function askGeminiAdmin(productName) {
    // שינוי קריטי: שימוש ב-gemini-pro היציב
    const MODEL = "gemini-pro"; 
    
    for (const key of API_KEYS_POOL) {
        // שינוי קריטי: כתובת v1beta שהיא הכי סלחנית
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
        
        const prompt = `
        Product: "${productName}". 
        Return JSON ONLY (Hebrew values): 
        { 
            "name": "${productName}", 
            "brand": "Sika", 
            "marketingDesc": "Short persuasive description (Hebrew)", 
            "category": "sealing" 
        }`;

        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            
            if (res.status === 404) {
                console.warn(`Model not found with key ending in ...${key.slice(-4)}. Trying next.`);
                continue;
            }

            if (res.ok) {
                const data = await res.json();
                let text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                return JSON.parse(text);
            }
        } catch (e) { console.warn("AI Marketing Error", e); }
    }
    return null;
}

// --- 2. שכתוב תוכן (AI Copywriter) ---
export async function improveText(currentText, style) {
    const MODEL = "gemini-pro";

    for (const key of API_KEYS_POOL) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
        
        let instruction = "";
        if (style === 'sales') instruction = "Make it persuasive and marketing-oriented (Hebrew).";
        if (style === 'pro') instruction = "Make it professional and technical (Hebrew).";
        if (style === 'short') instruction = "Summarize it (Hebrew).";

        const prompt = `Original: "${currentText}". Instruction: ${instruction}. Return ONLY new text.`;

        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            if (res.ok) {
                const data = await res.json();
                return data.candidates[0].content.parts[0].text.trim();
            }
        } catch (e) {}
    }
    return currentText;
}

// --- 3. חילוץ טכני ---
export async function extractTechnicalSpecs(productName) {
    const MODEL = "gemini-pro";

    for (const key of API_KEYS_POOL) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
        
        const prompt = `
        Act as engineer. Product: "${productName}".
        Extract technical data. Return JSON (Hebrew values):
        { "coverage": "Consumption", "drying": "Curing time", "thickness": "Layer thickness" }`;

        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            if (res.ok) {
                const data = await res.json();
                let text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                return JSON.parse(text);
            }
        } catch (e) {}
    }
    return { coverage: "", drying: "", thickness: "" };
}

// --- 4. מדיה (תמונות + וידאו) ---
export async function searchProductImages(query) {
    for (const key of API_KEYS_POOL) {
        const cx = getRandom(CX_IDS);
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${key}&searchType=image&num=6&imgSize=large`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.items) return data.items.map(item => ({ link: item.link, title: item.title }));
            }
        } catch (e) {}
    }
    return [{ link: "https://placehold.co/600x400?text=No+Image", title: "Placeholder" }];
}

export async function searchYouTubeVideos(query) {
    const q = query + " application sika tutorial";
    for (const key of API_KEYS_POOL) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&key=${key}&maxResults=4`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.items) return data.items.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high.url,
                    embed: `https://www.youtube.com/embed/${item.id.videoId}`
                }));
            }
        } catch (e) {}
    }
    return [];
}

export async function askProductExpert(p, q) { return ""; }
