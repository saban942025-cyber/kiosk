// === Sika Power Pool ===
const API_KEYS_POOL = [
    "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// רשימת מודלים לפי סדר עדיפות (מהיציב לחדשני)
const MODELS_PRIORITY = [
    "gemini-1.5-flash",          // הכי מהיר ויציב
    "gemini-1.5-flash-latest",   // גרסה עדכנית
    "gemini-1.5-flash-001",      // גרסה ספציפית
    "gemini-pro",                // המודל הקלאסי (תמיד עובד)
    "gemini-2.0-flash-exp"       // הניסיוני (רק אם כל השאר נכשלו)
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
 * המוח החכם: מנסה שילובים של מפתחות ומודלים עד להצלחה
 */
export async function askGeminiAdmin(productName) {
    
    // נסה 3 שילובים שונים לפני שאתה מוותר
    for (let attempt = 0; attempt < 3; attempt++) {
        const currentKey = getRandomItem(API_KEYS_POOL);
        
        // נסה לעבור על המודלים לפי הסדר עד שמישהו עונה
        for (const model of MODELS_PRIORITY) {
            
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
                // console.log(`Attempting: ${model} with key ...${currentKey.slice(-4)}`); // לדיבאג
                
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });

                if (!response.ok) {
                    // אם זה 429 (עומס) או 404 (מודל לא קיים) - נסה את המודל הבא ברשימה
                    if (response.status === 429 || response.status === 404) {
                        continue; 
                    }
                    throw new Error(response.statusText);
                }

                const data = await response.json();
                if (!data.candidates || !data.candidates[0]) continue;

                let text = data.candidates[0].content.parts[0].text;
                text = text.replace(/```json|```/g, '').trim();
                return JSON.parse(text); // הצלחה!

            } catch (error) {
                console.warn(`Failed on ${model}:`, error);
                // ממשיך למודל הבא בלולאה
            }
        }
        // אם סיימנו את כל המודלים עם המפתח הזה ולא הצליח - נחליף מפתח בלולאה החיצונית (attempt)
    }
    
    alert("כל המפתחות והמודלים עמוסים כרגע. נסה שוב בעוד דקה.");
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
    // בשיחה עם המומחה נשתמש במודל הכי יציב (gemini-pro)
    const currentKey = getRandomItem(API_KEYS_POOL);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentKey}`;
    
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
