// === Sika Key Pool ===
// רשימת המפתחות המעודכנת שלך
const API_KEYS_POOL = [
    "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// === Model Discovery List ===
// הרשימה שהמערכת תבדוק אוטומטית עבור כל מפתח
const MODELS_TO_TRY = [
    "gemini-1.5-flash",       // המהיר והמומלץ כרגע
    "gemini-1.5-pro",         // החכם ביותר
    "gemini-1.0-pro",         // היציב והישן (בדרך כלל עובד כגיבוי)
    "gemini-2.0-flash-exp"    // החדש ביותר (לפעמים לא יציב)
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
 * המוח החכם: מגלה לבד איזה מודל עובד
 */
export async function askGeminiAdmin(productName) {
    
    // נסה עד 3 מפתחות שונים לפני שאתה מוותר
    for (let i = 0; i < 3; i++) {
        const currentKey = getRandomItem(API_KEYS_POOL);
        
        // עבור כל מפתח, נסה למצוא מודל שעובד
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

                // אם קיבלנו שגיאה (404 = מודל לא קיים, 429 = עומס) - מדלגים למודל הבא
                if (!response.ok) {
                    // console.log(`Model ${model} failed on key ...${currentKey.slice(-4)} (${response.status})`);
                    continue; 
                }

                const data = await response.json();
                if (!data.candidates || !data.candidates[0]) continue;

                let text = data.candidates[0].content.parts[0].text;
                text = text.replace(/```json|```/g, '').trim();
                return JSON.parse(text); // הצלחה! מצאנו שילוב עובד.

            } catch (error) {
                // שגיאת רשת - ממשיכים לנסות
            }
        }
    }
    
    alert("כל המפתחות עמוסים כרגע. נסה שוב בעוד דקה.");
    return null;
}

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

export async function askProductExpert(product, userQuestion) {
    const currentKey = getRandomItem(API_KEYS_POOL);
    // לשיחה נשתמש במודל הכי יציב ברשימה באופן ישיר
    const stableModel = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${stableModel}:generateContent?key=${currentKey}`;
    
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
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        return "יש הפרעה בקליטה, נסה שוב.";
    }
}
