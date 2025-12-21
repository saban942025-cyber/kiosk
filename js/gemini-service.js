// המפתח החדש שלך
const API_KEY = "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U"; 

// 1. יצירת תוכן שיווקי וטכני (Gemini)
export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
    
    const prompt = `
    תפקידך: מנהל שיווק של חנות חומרי בניין "סבן".
    מוצר: "${productName}"
    
    החזר JSON בלבד (ללא Markdown) עם המבנה הבא בעברית:
    {
        "name": "שם מלא ומתוקן של המוצר",
        "brand": "שם המותג (באנגלית או עברית)",
        "category": "אחד מאלה: sealing, glues, flooring, concrete, paint, tools",
        "marketingDesc": "תיאור שיווקי קצר (עד 2 משפטים) שמוכר את המוצר לקבלן.",
        "tech": {
            "coverage": "כיסוי (למשל: 5 ק''ג למ''ר) או ריק",
            "drying": "זמן ייבוש או ריק",
            "thickness": "עובי יישום או ריק"
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
        text = text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

// 2. חיפוש תמונות בגוגל (Custom Search)
export async function searchGoogleImages(query, cx) {
    if (!cx) {
        alert("חסר מזהה מנוע חיפוש (CX). הזן אותו בהגדרות הסטודיו.");
        return [];
    }
    
    // שימוש במפתח החדש גם לחיפוש תמונות
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${API_KEY}&searchType=image&num=4&imgSize=large`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items) {
            return data.items.map(item => item.link);
        }
        return [];
    } catch (error) {
        console.error("Google Search Error:", error);
        return [];
    }
}
