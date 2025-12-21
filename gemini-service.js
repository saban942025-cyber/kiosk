// מפתח ה-AI שלך
const GEMINI_API_KEY = "AIzaSyBL76DNiLPe5fgvNpryrr6_7YNnrFkdMug"; 

export async function askGeminiAdmin(productName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `
    אתה מומחה שיווק של "ח. סבן".
    מוצר: "${productName}"
    
    החזר JSON בלבד (ללא מרכאות מסביב ל-JSON וללא Markdown) עם המבנה הבא בעברית:
    {
        "brand": "שם המותג (באנגלית או עברית)",
        "marketingDesc": "תיאור שיווקי קצר ומשכנע (עד 25 מילים) לקבלן",
        "ctaText": "כפתור הנעה לפעולה (למשל: הוסף להצעת מחיר)",
        "standard": "תקן רלוונטי (או 'לא צוין')",
        "tech": {
            "coverage": "כמות למ''ר (למשל: 1.5 ק''ג למ''ר)",
            "drying": "זמן ייבוש",
            "thickness": "עובי יישום"
        },
        "specs": ["תכונה 1", "תכונה 2", "תכונה 3"]
    }`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        // ניקוי הקוד שהמודל לפעמים מוסיף
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Error:", error);
        return null;
    }
}

export async function askProductExpert(currentProduct, question, history) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    
    const context = `אתה המומחה הטכני של ח. סבן.
    המוצר הנוכחי שהלקוח מסתכל עליו: ${currentProduct ? currentProduct.name : 'כללי'}.
    פרטים טכניים: ${currentProduct ? JSON.stringify(currentProduct.tech) : ''}.
    שאלה: ${question}
    ענה בעברית קצרה ומקצועית.`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: context }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) { return "יש עומס על המערכת, נסה שוב."; }
}
