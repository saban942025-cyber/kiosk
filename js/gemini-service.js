// === הגדרת המפתחות ===
// 1. המפתח הראשי (של הפרויקט) - עדיפות ראשונה
const MAIN_KEY = "AIzaSyDTdmqaOHerwTOpfe9qKSCP895CcIErOwo";

// 2. מפתח גיבוי (Golden Key) - למקרה שהראשון נופל
const BACKUP_KEY = "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U";

// מאגר המפתחות המלא (סדר חשיבות: ראשי -> גיבוי)
const API_KEYS_POOL = [MAIN_KEY, BACKUP_KEY];

const CX_IDS = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * 1. מוח AI: יצירת תיאורים
 * המערכת מנסה את המפתח הראשי, ורק אם נכשלת עוברת לגיבוי.
 */
export async function askGeminiAdmin(productName) {
    
    // לולאה שעוברת על המפתחות לפי הסדר (0 = ראשי, 1 = גיבוי)
    for (const key of API_KEYS_POOL) {
        // משתמשים ב-Gemini 1.5 Flash (הכי מהיר ויעיל)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        const prompt = `
        You are a construction marketing expert.
        Product: "${productName}"
        Return JSON ONLY (Hebrew values):
        {
            "name": "Full Name",
            "brand": "Brand",
            "marketingDesc": "Short sales pitch (Hebrew)",
            "category": "sealing/glues/flooring/concrete",
            "tech": { "coverage": "X kg/m2", "drying": "X hours", "thickness": "X mm" }
        }`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            // אם נכשל (למשל 429 או 403), נדלג למפתח הבא בלולאה
            if (!response.ok) {
                console.warn(`Key ...${key.slice(-4)} failed. Switching to backup.`);
                continue; 
            }

            const data = await response.json();
            if (!data.candidates) continue;

            let text = data.candidates[0].content.parts[0].text;
            text = text.replace(/```json|```/g, '').trim();
            return JSON.parse(text); // הצלחה!

        } catch (error) {
            console.error("Connection Error:", error);
        }
    }

    // אם שני המפתחות נכשלו
    return {
        name: productName,
        brand: "",
        marketingDesc: "נא למלא ידנית (תקלה בחיבור ל-AI)",
        category: "sealing",
        tech: { coverage: "", drying: "", thickness: "" }
    };
}

/**
 * 2. חיפוש תמונות
 * גם כאן - מנסים את הראשי, ואם לא עובד עוברים לגיבוי
 */
export async function searchProductImages(query) {
    for (const key of API_KEYS_POOL) {
        // בחיפוש תמונות נבחר CX רנדומלי
        const cx = getRandom(CX_IDS);
        
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${key}&searchType=image&num=6&imgSize=large`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn(`Image Search failed on key ...${key.slice(-4)}. Trying backup.`);
                continue;
            }

            const data = await response.json();
            if (data.items) return data.items.map(item => ({ link: item.link, title: item.title }));
            
        } catch (error) { }
    }
    
    // Fallback אם הכל נכשל
    return [
        { link: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Sika_AG_logo.svg/1200px-Sika_AG_logo.svg.png", title: "Sika Logo" },
        { link: "https://placehold.co/600x400?text=Manual+Upload", title: "No Image" }
    ];
}

/**
 * 3. המומחה (צ'אט)
 */
export async function askProductExpert(product, question) {
    const key = API_KEYS_POOL[0]; // לצ'אט ננסה רק את הראשי כדי לחסוך קריאות
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    const context = `Product: ${product.name}. Tech: ${JSON.stringify(product.tech)}. Q: "${question}". Answer in Hebrew.`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
        });
        if(res.ok) {
            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        }
    } catch (e) {}
    return "המומחה אינו זמין כרגע.";
}
