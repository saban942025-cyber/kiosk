// === Sika Power Pool ===
const API_KEYS_POOL = [
    "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// כתובות API שונות לניסוי (אם אחת נופלת, השניה תעבוד)
const BASE_URLS = [
    "https://generativelanguage.googleapis.com/v1beta/models/",
    "https://generativelanguage.googleapis.com/v1/models/" 
];

// מודלים לבדיקה (מהבטוח לחדש)
const MODELS = [
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro"
];

// בריכות חיפוש תמונות
const CX_POOL = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * המוח החכם: מנגנון שרידות אולטימטיבי
 */
export async function askGeminiAdmin(productName) {
    
    // לולאה שמנסה 5 שילובים שונים
    for (let i = 0; i < 5; i++) {
        const currentKey = getRandomItem(API_KEYS_POOL);
        const currentModel = MODELS[i % MODELS.length]; 
        const currentBaseUrl = BASE_URLS[i % BASE_URLS.length]; // מנסה גם v1 וגם v1beta
        
        const url = `${currentBaseUrl}${currentModel}:generateContent?key=${currentKey}`;
        
        const prompt = `
        You are a marketing expert for a construction store.
        Product: "${productName}"
        Return ONLY valid JSON (no markdown):
        {
            "name": "Full product name (Hebrew)",
            "brand": "Brand name",
            "marketingDesc": "Short sales pitch (Hebrew)",
            "category": "sealing OR glues OR flooring OR concrete",
            "tech": { "coverage": "X kg/m2", "drying": "X hours", "thickness": "X mm" }
        }`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                // console.warn(`Failed: ${currentModel} on ${currentBaseUrl} (${response.status})`);
                continue; 
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0]) continue;

            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, '').trim();
            return JSON.parse(text); // הצלחה!

        } catch (error) {
            console.error("Network Error:", error);
        }
    }
    
    alert("שגיאת התחברות ל-AI. נסה שוב (כל המפתחות נכשלו).");
    return null;
}

/**
 * מנוע חיפוש תמונות
 */
export async function searchGoogleImages(query) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const apiKey = getRandomItem(API_KEYS_POOL);
        const cx = getRandomItem(CX_POOL);
        
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=4&imgSize=large`;

        try {
            const response = await fetch(url);
            if (!response.ok) continue;

            const data = await response.json();
            if (data.items) return data.items.map(item => item.link);
            
        } catch (error) { }
    }
    return [];
}

/**
 * מומחה צ'אט
 */
export async function askProductExpert(product, userQuestion) {
    const currentKey = getRandomItem(API_KEYS_POOL);
    // ננסה את המודל הכי בסיסי
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${currentKey}`;
    
    const context = `
    Product: ${product.name}
    Tech: ${JSON.stringify(product.tech)}
    User Question: "${userQuestion}"
    Answer in Hebrew, short and professional.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
        });
        
        if(!response.ok) return "מצטער, יש לי בעיה בתקשורת כרגע.";

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "תקלה זמנית, נסה שוב.";
    }
}
