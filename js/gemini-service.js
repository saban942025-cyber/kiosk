// === מאגר מפתחות API ===
const API_KEYS = [
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

const CX_IDS = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * פונקציה לחיפוש 6 תמונות מוצר בגוגל (עם מנגנון גיבוי)
 */
export async function searchProductImages(query) {
    // ננסה עד 3 שילובים שונים
    for (let i = 0; i < 3; i++) {
        const apiKey = getRandom(API_KEYS);
        const cx = CX_IDS[i % CX_IDS.length]; 
        
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=6&imgSize=large`;

        try {
            const response = await fetch(url);
            
            // אם קיבלנו 403 (Forbidden) - המפתח לא מאושר לחיפוש
            if (response.status === 403) {
                console.warn(`Key blocked for Search API (403). Ensure 'Custom Search API' is ENABLED in Google Cloud Console.`);
                continue; 
            }

            if (!response.ok) continue;

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                return data.items.map(item => ({
                    link: item.link,
                    title: item.title
                }));
            }
        } catch (error) {
            console.error("Search Error:", error);
        }
    }

    // === מנגנון גיבוי (Fallback) ===
    // אם הכל נכשל (בגלל 403), נחזיר תמונות דמו כדי שהממשק יעבוד
    console.warn("Using Fallback Images due to API Error");
    return [
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+1`, title: "Demo 1" },
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+2`, title: "Demo 2" },
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+3`, title: "Demo 3" },
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+4`, title: "Demo 4" },
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+5`, title: "Demo 5" },
        { link: `https://placehold.co/600x400?text=${encodeURIComponent(query)}+6`, title: "Demo 6" }
    ];
}

// פונקציות ישנות (ריקות כדי למנוע שגיאות)
export async function askGeminiAdmin(q) { return null; }
export async function askProductExpert(p, q) { return "השירות אינו זמין כרגע."; }
