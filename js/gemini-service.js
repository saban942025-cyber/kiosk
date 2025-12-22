// === רשימת המפתחות (ראשי + גיבויים) ===
const API_KEYS_POOL = [
    "AIzaSyDTdmqaOHerwTOpfe9qKSCP895CcIErOwo", // מפתח ראשי
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U", // מפתח גיבוי 1
    "AIzaSyCQibBA_sC1St4u8YKit-zCzvPKl6_YE4I",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

const CX_IDS = ["3331a7d5c75e14f26", "635bc3eeee0194b16", "1340c66f5e73a4076"];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * 1. AI: יצירת תיאורים
 */
export async function askGeminiAdmin(productName) {
    for (const key of API_KEYS_POOL) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const prompt = `Product: "${productName}". Return JSON (Hebrew): { "name": "${productName}", "brand": "Brand", "marketingDesc": "Desc", "category": "sealing", "tech": { "coverage": "", "drying": "", "thickness": "" } }`;
        try {
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            if (res.ok) {
                const data = await res.json();
                let text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
                return JSON.parse(text);
            }
        } catch (e) {}
    }
    return { name: productName, brand: "", marketingDesc: "מילוי ידני (AI לא זמין)", category: "sealing", tech: {} };
}

/**
 * 2. תמונות: Google Custom Search
 */
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
    // תמונות דמו במקרה של כשל
    return [
        { link: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Sika_AG_logo.svg/1200px-Sika_AG_logo.svg.png", title: "Sika Logo" },
        { link: "https://placehold.co/600x400?text=No+Image", title: "Placeholder" }
    ];
}

/**
 * 3. וידאו: YouTube Search (חדש!) 🎥
 */
export async function searchYouTubeVideos(query) {
    const q = query + " application tutorial"; // מוסיף מילות מפתח כדי למצוא סרטוני יישום
    
    for (const key of API_KEYS_POOL) {
        // maxResults=4 -> חוסך מכסה (YouTube API יקר)
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(q)}&key=${key}&maxResults=4`;
        
        try {
            const res = await fetch(url);
            
            if (res.status === 403) {
                console.warn(`YouTube API not enabled for key ...${key.slice(-4)}`);
                continue;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    return data.items.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.high.url,
                        link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                        embed: `https://www.youtube.com/embed/${item.id.videoId}`
                    }));
                }
            }
        } catch (e) { console.error("YouTube Error", e); }
    }
    return []; // החזר רשימה ריקה אם נכשל
}

export async function askProductExpert(product, question) { return "המומחה נח כרגע."; }
