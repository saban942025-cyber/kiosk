// gemini-service.js

// הגדרות קבועות
const GEMINI_API_KEY = "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug"; // המפתח שלך ל-Gemini

/**
 * פונקציה ראשית: יצירת תוכן שיווקי וטכני למוצר
 */
export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
    תפקידך: מנהל שיווק ומומחה טכני של חנות חומרי בניין (ח. סבן).
    מוצר: "${productName}"
    
    עליך להחזיר JSON בלבד (ללא טקסט נוסף, ללא Markdown) עם המבנה הבא בעברית:
    {
        "name": "שם מוצר מלא (כולל דגם)",
        "brand": "שם המותג (באנגלית אם זה בינלאומי, או עברית)",
        "marketingDesc": "פסקה שיווקית קצרה ומשכנעת (עד 2 משפטים) שמדגישה למה כדאי לקנות את זה.",
        "category": "קטגוריה מתאימה באנגלית מתוך הרשימה: sealing, glues, flooring, paint, tools",
        "tech": {
            "coverage": "כמות למ''ר (למשל: 5 ק''ג למ''ר) או 'לא רלוונטי'",
            "drying": "זמן ייבוש (למשל: 24 שעות) או 'מיידי'",
            "thickness": "עובי יישום או 'לא רלוונטי'"
        }
    }
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        // ניקוי תווים מיותרים אם הג'ימני מחזיר Markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        alert("שגיאה ביצירת תוכן AI. בדוק את הקונסול.");
        return null;
    }
}

/**
 * פונקציה לחיפוש תמונות בגוגל
 * דורשת מפתח API ו-CX (מזהה מנוע חיפוש) שיוזנו בסטודיו
 */
export async function searchProductImage(query, googleKey, cx) {
    if (!googleKey || !cx) {
        alert("חסרים מפתחות חיפוש (Google API + CX)! הזן אותם בהגדרות בצד.");
        return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${googleKey}&searchType=image&num=4&imgSize=large`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
            return data.items.map(item => item.link); // מחזיר מערך של לינקים לתמונות
        } else {
            console.warn("No images found", data);
            return [];
        }
    } catch (error) {
        console.error("Google Search Error:", error);
        return [];
    }
}
