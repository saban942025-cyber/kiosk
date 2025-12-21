const GEMINI_API_KEY = "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug";

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

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        text = text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("AI Error:", error);
        return null;
    }
}
