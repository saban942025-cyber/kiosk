// מפתח ה-AI הנוכחי (אם הוא חסום, נסה להחליף לאחר)
const GEMINI_API_KEY = "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U"; 

export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
    תפקידך: מנהל שיווק ומומחה טכני של "Sika-Ai" (חנות חומרי בניין).
    מוצר: "${productName}"
    
    החזר JSON בלבד (ללא Markdown) עם המבנה הבא בעברית:
    {
        "name": "שם מוצר מלא",
        "brand": "שם המותג (SIKA, THERMOKIR, ETC)",
        "marketingDesc": "תיאור שיווקי משכנע לקבלן (עד 25 מילים)",
        "category": "קטגוריה (אנגלית: sealing, glues, flooring, paint)",
        "tech": {
            "coverage": "כיסוי (למשל: 1.5 ק''ג למ''ר)",
            "drying": "זמן ייבוש",
            "thickness": "עובי יישום"
        }
    }`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        // בדיקת שגיאות מהשרת (כמו 429)
        if (!response.ok) {
            console.error("Gemini API Error:", response.status, response.statusText);
            if (response.status === 429) {
                alert("⚠️ הגעת למגבלת הבקשות של המפתח (Error 429).\nהמתן קצת או החלף למפתח חדש בקובץ gemini-service.js.");
                return null;
            }
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        
        // בדיקה שהתשובה תקינה לפני שמנסים לקרוא אותה
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error("Invalid Data Structure:", data);
            alert("ה-AI לא הצליח לייצר תשובה למוצר הזה. נסה שנית.");
            return null;
        }

        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("General Error:", error);
        alert("שגיאה בתקשורת עם ה-AI. בדוק את הקונסול לפרטים.");
        return null;
    }
}

// פונקציית חיפוש תמונות (נשארת ללא שינוי, רק מוודאים שהיא קיימת)
export async function searchGoogleImages(query, googleKey, cx) {
    if (!googleKey || !cx) {
        alert("חסרים מפתחות גוגל (API + CX) בהגדרות הסטודיו!");
        return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${googleKey}&searchType=image&num=4&imgSize=large`;

    try {
        const response = await fetch(url);
        if(!response.ok) {
             if (response.status === 429) alert("⚠️ מכסת חיפוש התמונות נגמרה להיום.");
             return [];
        }
        const data = await response.json();
        if (data.items) {
            return data.items.map(item => item.link);
        }
        return [];
    } catch (error) {
        console.error("Google Image Error:", error);
        return [];
    }
}
