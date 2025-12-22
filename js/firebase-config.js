import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { askGeminiAdmin, searchProductImages, searchYouTubeVideos, extractTechnicalSpecs } from './gemini-service.js';

// אתחול אייקונים
if (typeof lucide !== 'undefined') lucide.createIcons();

let allProducts = [];
let currentView = 'list';

// --- ניהול תצוגה (Navigation) ---

window.toggleDrawer = () => {
    document.getElementById('drawer').classList.toggle('open');
}

window.showView = (viewName) => {
    document.getElementById('drawer').classList.remove('open'); // סגור תפריט
    
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('editorView').classList.add('hidden');
    document.getElementById('nav-list').classList.remove('active');
    document.getElementById('nav-edit').classList.remove('active');

    if (viewName === 'list') {
        document.getElementById('listView').classList.remove('hidden');
        document.getElementById('nav-list').classList.add('active');
        window.loadInventory(); // רענון
    } else {
        document.getElementById('editorView').classList.remove('hidden');
        document.getElementById('nav-edit').classList.add('active');
    }
    currentView = viewName;
}

window.togglePreviewMode = () => {
    const modal = document.getElementById('previewModal');
    const isHidden = modal.classList.contains('hidden');
    
    if (isHidden) {
        updatePreviewData(); // מלא נתונים לפני הצגה
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

// --- Accordion Logic ---
window.toggleAccordion = (id) => {
    const content = document.getElementById(id);
    const header = content.previousElementSibling;
    
    // Toggle active classes
    header.classList.toggle('active');
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

// --- AI Magic 🪄 ---
window.runMagic = async () => {
    const query = document.getElementById('aiSearch').value;
    if (!query) return alert("כתוב שם מוצר!");

    const btn = document.querySelector('button[onclick="runMagic()"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
    lucide.createIcons();

    try {
        // 1. Text Data
        if(!document.getElementById('pName').value) {
            document.getElementById('pName').value = query;
            askGeminiAdmin(query).then(data => {
                if(data) {
                    document.getElementById('pName').value = data.name; 
                    document.getElementById('pBrand').value = data.brand;
                    document.getElementById('pDesc').value = data.marketingDesc;
                    // פתיחת האקורדיון הראשון
                    const acc1 = document.getElementById('acc1');
                    acc1.style.maxHeight = acc1.scrollHeight + "px";
                    acc1.previousElementSibling.classList.add('active');
                }
            });
        }

        // 2. Media (Images & Video)
        const [images, videos] = await Promise.all([
            searchProductImages(query),
            searchYouTubeVideos(query)
        ]);
        
        renderMediaScroll(images, 'imgScroll', 'img');
        renderMediaScroll(videos, 'vidScroll', 'vid');
        
        // פתיחת אקורדיון מדיה
        const acc2 = document.getElementById('acc2');
        acc2.previousElementSibling.classList.add('active');
        acc2.style.maxHeight = acc2.scrollHeight + "px";
    } catch (e) {
        console.error(e);
        alert("שגיאה בחיפוש AI");
    } finally {
        btn.innerHTML = originalContent; // '<i data-lucide="sparkles"></i>';
        lucide.createIcons();
    }
}

function renderMediaScroll(items, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "media-item";
        div.onclick = () => {
            container.querySelectorAll('.media-item').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            
            if(type === 'img') {
                document.getElementById('pImg').value = item.link;
            } else {
                document.getElementById('pVideo').value = item.embed;
            }
        };
        
        const src = type === 'img' ? item.link : item.thumbnail;
        div.innerHTML = `<img src="${src}">`;
        container.appendChild(div);
    });
}

// --- Auto Tech Specs ---
window.autoTech = async () => {
    const name = document.getElementById('pName').value || document.getElementById('aiSearch').value;
    if(!name) return alert("הכנס שם מוצר");
    
    const btn = event.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = "⏳ חושב...";
    
    const data = await extractTechnicalSpecs(name);
    document.getElementById('tCov').value = data.coverage;
    document.getElementById('tDry').value = data.drying;
    document.getElementById('tThick').value = data.thickness;
    
    btn.innerText = originalText;
}

// --- CRUD & Inventory ---

window.createNew = () => {
    document.getElementById('editId').value = "";
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    document.getElementById('imgScroll').innerHTML = `<div class="text-center text-xs text-gray-500 w-full py-4">לחץ על הקסם 🪄 לחיפוש</div>`;
    document.getElementById('vidScroll').innerHTML = `<div class="text-center text-xs text-gray-500 w-full py-4">לחץ על הקסם 🪄 לחיפוש</div>`;
    
    window.showView('editor');
}

window.saveProduct = async () => {
    const id = document.getElementById('editId').value;
    const data = {
        name: document.getElementById('pName').value,
        brand: document.getElementById('pBrand').value,
        category: document.getElementById('pCat').value,
        marketingDesc: document.getElementById('pDesc').value,
        image: document.getElementById('pImg').value,
        videoUrl: document.getElementById('pVideo').value,
        tech: {
            coverage: document.getElementById('tCov').value,
            drying: document.getElementById('tDry').value,
            thickness: document.getElementById('tThick').value
        },
        updatedAt: Date.now()
    };

    if(!data.name) return alert("חובה למלא שם!");

    try {
        if(id) await updateDoc(doc(db, "products", id), data);
        else {
            data.createdAt = Date.now();
            await addDoc(collection(db, "products"), data);
        }
        alert("נשמר בהצלחה! ✅");
        window.showView('list');
    } catch(e) { alert("שגיאה: " + e.message); }
}

window.loadInventory = async () => {
    const container = document.getElementById('productsContainer');
    // אם האלמנט לא קיים (אולי בדף אחר), צא
    if(!container) return;

    container.innerHTML = '<div class="text-center mt-10"><i data-lucide="loader-2" class="animate-spin inline"></i> טוען...</div>';
    lucide.createIcons();

    try {
        const snap = await getDocs(collection(db, "products"));
        allProducts = [];
        container.innerHTML = "";

        if (snap.empty) {
            container.innerHTML = '<div class="text-center mt-10 text-gray-500">המלאי ריק. הוסף מוצר חדש!</div>';
            return;
        }

        snap.forEach(docSnap => {
            const p = {id: docSnap.id, ...docSnap.data()};
            allProducts.push(p);
            
            container.innerHTML += `
                <div onclick="editProduct('${p.id}')" class="bg-gray-800 p-3 rounded-xl border border-gray-700 flex gap-4 items-center active:bg-gray-700 transition">
                    <img src="${p.image || 'https://placehold.co/100'}" class="w-16 h-16 rounded-lg object-cover bg-white">
                    <div class="flex-1">
                        <div class="text-[10px] text-gray-400 font-bold uppercase">${p.brand || 'SIKA'}</div>
                        <div class="font-bold text-lg leading-tight mb-1 text-white">${p.name}</div>
                        <div class="flex gap-2">
                            ${p.videoUrl ? '<i data-lucide="video" size="14" class="text-red-500"></i>' : ''}
                            ${p.tech?.coverage ? '<i data-lucide="ruler" size="14" class="text-blue-500"></i>' : ''}
                        </div>
                    </div>
                    <i data-lucide="chevron-left" class="text-gray-600"></i>
                </div>
            `;
        });
        lucide.createIcons();
    } catch (e) {
        console.error("Error loading inventory:", e);
        container.innerHTML = '<div class="text-center mt-10 text-red-500">שגיאה בטעינת נתונים</div>';
    }
}

window.editProduct = (id) => {
    const p = allProducts.find(x => x.id === id);
    if(!p) return;

    document.getElementById('editId').value = id;
    document.getElementById('aiSearch').value = p.name;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand;
    document.getElementById('pCat').value = p.category;
    document.getElementById('pDesc').value = p.marketingDesc;
    document.getElementById('pImg').value = p.image;
    document.getElementById('pVideo').value = p.videoUrl || '';
    
    document.getElementById('tCov').value = p.tech?.coverage || '';
    document.getElementById('tDry').value = p.tech?.drying || '';
    document.getElementById('tThick').value = p.tech?.thickness || '';

    // הצגת המדיה שנבחרה
    if(p.image) {
        const imgScroll = document.getElementById('imgScroll');
        imgScroll.innerHTML = `<div class="media-item selected"><img src="${p.image}"></div>`;
    }
    
    window.showView('editor');
}

window.filterList = () => {
    const term = document.getElementById('listSearch').value.toLowerCase();
    const items = document.getElementById('productsContainer').children;
    
    Array.from(items).forEach(item => {
        const text = item.innerText.toLowerCase();
        item.style.display = text.includes(term) ? 'flex' : 'none';
    });
}

function updatePreviewData() {
    document.getElementById('prevName').innerText = document.getElementById('pName').value || 'שם המוצר';
    document.getElementById('prevBrand').innerText = document.getElementById('pBrand').value || 'BRAND';
    document.getElementById('prevDesc').innerText = document.getElementById('pDesc').value || 'אין תיאור';
    document.getElementById('prevImg').src = document.getElementById('pImg').value || 'https://placehold.co/400';
    
    document.getElementById('prevCov').innerText = document.getElementById('tCov').value || '-';
    document.getElementById('prevDry').innerText = document.getElementById('tDry').value || '-';
    document.getElementById('prevThick').innerText = document.getElementById('tThick').value || '-';
    
    const videoUrl = document.getElementById('pVideo').value;
    const vidContainer = document.getElementById('prevVideoContainer');
    if(videoUrl) {
        vidContainer.classList.remove('hidden');
        document.getElementById('prevIframe').src = videoUrl;
        document.getElementById('prevVideoBadge').classList.remove('hidden');
    } else {
        vidContainer.classList.add('hidden');
        document.getElementById('prevVideoBadge').classList.add('hidden');
    }
}

// טעינה ראשונית
window.loadInventory();
