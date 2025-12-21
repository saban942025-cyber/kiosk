const GEMINI_API_KEY = "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug";

export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
    אתה מומחה שיווק של חנות חומרי בניין.
    מוצר: "${productName}"
    החזר JSON בלבד (ללא טקסט נוסף) עם המבנה הבא בעברית:
    {
        "brand": "שם המותג (באנגלית או עברית)",
        "marketingDesc": "תיאור שיווקי קצר ומשכנע (עד 20 מילים)",
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

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json|```/g, '').trim(); // ניקוי הקוד
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}
