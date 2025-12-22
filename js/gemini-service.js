// === Sika Key Pool ===
const API_KEYS_POOL = [
    "AIzaSyCQibBA_sC1St4u8YKit-zCzvPKl6_YE4I",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// רשימת מודלים מורחבת - מנסה את כולם עד שאחד עובד
const MODELS_TO_TRY = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-pro",
    "gemini-2.0-flash-exp"
];

const CX_POOL = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * המוח המרכזי: יצירת תוכן
 */
export async function askGeminiAdmin(productName) {
    
    // מנסה עד 3 מפתחות שונים
    for (let k = 0; k < 3; k++) {
        const currentKey = getRandomItem(API_KEYS_POOL);
        
        // עבור כל מפתח, מנסה את כל המודלים האפשריים
        for (const model of MODELS_TO_TRY) {
            
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
            
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
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!response.ok) {
                    // אם נכשל, מדלג למודל הבא בשקט
                    continue; 
                }

                const data = await response.json();
                if (!data.candidates || !data.candidates[0]) continue;

                let text = data.candidates[0].content.parts[0].text;
                text = text.replace(/```json|```/g, '').trim();
                return JSON.parse(text); // הצלחה!

            } catch (error) {
                // שגיאת רשת - נסה את הבא
            }
        }
    }
    
    alert("כל המפתחות עמוסים כרגע. נסה שוב בעוד דקה.");
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
            
        } catch (error) { console.error(error); }
    }
    return [];
}

/**
 * המומחה בצ'אט
 */
export async function askProductExpert(product, userQuestion) {
    // בשיחה עם המומחה ננסה גם כמה מודלים
    const chatModels = ["gemini-1.5-flash", "gemini-pro"];
    
    for (const model of chatModels) {
        const currentKey = getRandomItem(API_KEYS_POOL);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        
        const context = `
        אתה "Sika-Ai".
        מוצר: ${product.name}
        תיאור: ${product.marketingDesc}
        טכני: ${JSON.stringify(product.tech)}
        שאלה: "${userQuestion}"
        ענה בעברית, קצר ולעניין.`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
            });
            
            if(!response.ok) continue;
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (e) { }
    }
    return "יש הפרעה בקליטה, נסה שוב.";
}
