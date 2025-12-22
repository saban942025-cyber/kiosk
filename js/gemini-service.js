// === Sika Power Pool ===
// מאגר המפתחות להכפלת כוח
const API_KEYS_POOL = [
    "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// מאגר מנועי החיפוש
const CX_POOL = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

/**
 * פונקציית עזר: בוחרת מפתח אקראי כדי לחלק עומסים
 */
function getRandomKey() {
    return API_KEYS_POOL[Math.floor(Math.random() * API_KEYS_POOL.length)];
}

function getRandomCX() {
    return CX_POOL[Math.floor(Math.random() * CX_POOL.length)];
}

/**
 * 1. המוח: יצירת תוכן (עם מנגנון נסיון חוזר - Retry)
 */
export async function askGeminiAdmin(productName) {
    // ננסה עד 3 פעמים עם מפתחות שונים אם יש שגיאה
    for (let attempt = 0; attempt < 3; attempt++) {
        const currentKey = getRandomKey();
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentKey}`;
        
        const prompt = `
        תפקידך: מנהל שיווק ומומחה טכני של "Sika-Ai".
        מוצר: "${productName}"
        החזר JSON בלבד (ללא Markdown) בעברית:
        {
            "name": "שם מוצר מלא",
            "brand": "שם המותג",
            "marketingDesc": "תיאור שיווקי קצר ומקצועי (עד 25 מילים)",
            "category": "קטגוריה (sealing, glues, flooring, concrete, paint, tools)",
            "tech": { "coverage": "כיסוי", "drying": "ייבוש", "thickness": "עובי" }
        }`;

        try {
            console.log(`Trying Gemini with key ending in...${currentKey.slice(-4)}`);
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn("Quota exceeded for key, switching...");
                    continue; // נסה מפתח אחר בלולאה הבאה
                }
                throw new Error(response.statusText);
            }

            const data = await response.json();
            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, '').trim();
            return JSON.parse(text);

        } catch (error) {
            console.error("Attempt failed:", error);
            if (attempt === 2) return null; // אם נכשלנו 3 פעמים
        }
    }
}

/**
 * 2. העיניים: חיפוש תמונות (עם רוטציה של CX)
 */
export async function searchGoogleImages(query) {
    // כאן אנחנו משתמשים במאגרים הפנימיים, לא צריך להעביר מבחוץ
    
    for (let attempt = 0; attempt < 3; attempt++) {
        const apiKey = getRandomKey();
        const cx = getRandomCX(); // גם את ה-CX אנחנו מגוונים
        
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=4&imgSize=large`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn(`Search failed with key ...${apiKey.slice(-4)}`);
                continue; 
            }

            const data = await response.json();
            if (data.items) {
                return data.items.map(item => item.link);
            }
        } catch (error) {
            console.error("Search error:", error);
        }
    }
    return []; // אם הכל נכשל
}

/**
 * 3. הקול: המומחה בצ'אט
 */
export async function askProductExpert(product, userQuestion) {
    const currentKey = getRandomKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentKey}`;
    
    const context = `
    אתה "Sika-Ai", המומחה של סבן.
    מוצר: ${product.name} (${product.brand})
    תיאור: ${product.marketingDesc}
    טכני: ${JSON.stringify(product.tech)}
    שאלה: "${userQuestion}"
    ענה בעברית, קצר ולעניין.
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "מצטער, יש לי הפרעה בקליטה. נסה שוב.";
    }
}
