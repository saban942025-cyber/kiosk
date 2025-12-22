// === מאגר מפתחות API (רק לאימות) ===
const API_KEYS = [
    "AIzaSyCQibBA_sC1St4u8YKit-zCzvPKl6_YE4I",
    "AIzaSyD2PehLHX2olQQavvHo2vjclOq7iSdiagI",
    "AIzaSyAdfGVrmr90Mp9ZhNMItD81iaE8OipKwz0",
    "AIzaSyDn2bU0mnmNpj26UeBZYAirLnXf-FtPgCg",
    "AIzaSyD9plWwyTESFm24c_OTunf4mFAsAmfrgj0",
    "AIzaSyApfM5AjEPanHzafJi6GqbJlIQ_w-0X07U",
    "AIzaSyA10opXSDanliHZtGTXtDfOiC_8VGGTwc0"
];

// === שלושת המזהים שנתת ===
const CX_IDS = [
    "3331a7d5c75e14f26",
    "635bc3eeee0194b16",
    "1340c66f5e73a4076"
];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/**
 * פונקציה לחיפוש 6 תמונות מוצר בגוגל
 */
export async function searchProductImages(query) {
    // ננסה עד 3 שילובים שונים של מפתח ומנוע חיפוש
    for (let i = 0; i < 3; i++) {
        const apiKey = getRandom(API_KEYS);
        const cx = CX_IDS[i % CX_IDS.length]; // רוטציה בין ה-3 שנתת
        
        // num=6 -> מבקש בדיוק 6 תוצאות
        // searchType=image -> מחפש רק תמונות
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=6&imgSize=large`;

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn(`Search failed on CX ${cx.slice(0,5)}... trying next.`);
                continue;
            }

            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                // מחזיר מערך של אובייקטים עם תמונה וכותרת
                return data.items.map(item => ({
                    link: item.link,
                    title: item.title,
                    context: item.image.contextLink
                }));
            }
        } catch (error) {
            console.error("Search Error:", error);
        }
    }
    return []; // אם לא מצא כלום
}

// פונקציות ה-AI הישנות (נשאיר אותן שלא ישבור כלום, אבל לא נשתמש בהן כרגע)
export async function askGeminiAdmin(q) { return null; }
export async function askProductExpert(p, q) { return "השירות אינו זמין כרגע."; }
