// מפתחות API (ודא שהם מעודכנים ופעילים)
const GEMINI_API_KEY = "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug"; // המפתח שלך ל-Gemini
// שים לב: לחיפוש תמונות תצטרך להזין בסטודיו גם את ה-CX (מזהה מנוע חיפוש) ואת מפתח גוגל הרגיל

/**
 * 1. המוח הטכני: מייצר נתונים לקטלוג
 */
export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    // הפרומפט הזה מלמד את המוח איך לפרק מוצר לגורמים
    const prompt = `
    תפקידך: מנהל מוצר טכני בחברת "סבן חומרי בניין".
    משימה: נתח את המוצר "${productName}" והחזר אובייקט JSON מדויק (ללא Markdown).
    
    המבנה הנדרש:
    {
        "name": "שם המוצר המלא והרשמי בעברית/אנגלית",
        "brand": "שם היצרן (למשל: Sika, Thermokir, Mister Fix)",
        "marketingDesc": "תיאור מכירתי קצר (עד 25 מילים) שמסביר למה המוצר הזה מצוין לקבלן.",
        "category": "בחר אחד בלבד באנגלית: sealing, glues, flooring, concrete, paint",
        "tech": {
            "coverage": "כמות צריכה למ''ר (למשל: 1.5 ק''ג למ''ר)",
            "drying": "זמן ייבוש לדריכה/כיסוי (למשל: 24 שעות)",
            "thickness": "עובי יישום מומלץ (למשל: 2-5 מ''מ)"
        }
    }`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        // ניקוי הקוד למקרה שה-AI מוסיף סימנים מיותרים
        text = text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

/**
 * 2. העיניים: חיפוש תמונות בגוגל
 */
export async function searchGoogleImages(query, googleKey, cx) {
    if (!googleKey || !cx) {
        alert("חסרים מפתחות גוגל (API + CX) בהגדרות הסטודיו!");
        return [];
    }

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${googleKey}&searchType=image&num=4&imgSize=large`;

    try {
        const response = await fetch(url);
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

/**
 * 3. הקול: המענה של Sika-Ai בצ'אט המומחה
 */
export async function askProductExpert(product, userQuestion) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    // כאן אנחנו "מזריקים" למוח את הנתונים שאספנו בקטלוג
    const context = `
    אתה "Sika-Ai", המומחה הווירטואלי של ח. סבן.
    
    המידע שיש לך על המוצר הנוכחי שהלקוח שואל עליו:
    - שם: ${product.name}
    - מותג: ${product.brand}
    - נתונים טכניים: ${JSON.stringify(product.tech)}
    - תיאור: ${product.marketingDesc}
    
    השאלה של הלקוח: "${userQuestion}"
    
    הנחיות: ענה בעברית, קצר ולעניין (מקסימום 2 משפטים). תהיה מקצועי אבל חברי.
    `;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        return "יש לי קצת עומס בשרתים כרגע, נסה שוב עוד רגע.";
    }
}
