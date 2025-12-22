import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { askGeminiAdmin, searchProductImages, searchYouTubeVideos, extractTechnicalSpecs } from './gemini-service.js';

if (typeof lucide !== 'undefined') lucide.createIcons();

let allProducts = [];
let currentView = 'list';

// --- Navigation ---
window.toggleDrawer = () => document.getElementById('drawer').classList.toggle('open');

window.showView = (viewName) => {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('editorView').classList.add('hidden');
    document.getElementById('nav-list').classList.remove('active');
    document.getElementById('nav-edit').classList.remove('active');

    if (viewName === 'list') {
        document.getElementById('listView').classList.remove('hidden');
        document.getElementById('nav-list').classList.add('active');
        window.loadInventory();
    } else {
        document.getElementById('editorView').classList.remove('hidden');
        document.getElementById('nav-edit').classList.add('active');
    }
    currentView = viewName;
}

window.togglePreviewMode = () => {
    const modal = document.getElementById('previewModal');
    if (modal.classList.contains('hidden')) {
        updatePreviewData();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

window.toggleAccordion = (id) => {
    const content = document.getElementById(id);
    const header = content.previousElementSibling;
    header.classList.toggle('active');
    content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
}

// --- AI & Logic ---
window.runMagic = async () => {
    const query = document.getElementById('aiSearch').value;
    if (!query) return alert("כתוב שם מוצר!");
    
    const btn = document.querySelector('button[onclick="runMagic()"]');
    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
    lucide.createIcons();

    try {
        if(!document.getElementById('pName').value) {
            document.getElementById('pName').value = query;
            askGeminiAdmin(query).then(data => {
                if(data) {
                    document.getElementById('pName').value = data.name; 
                    document.getElementById('pBrand').value = data.brand;
                    document.getElementById('pDesc').value = data.marketingDesc;
                }
            });
        }
        
        // Auto Tech Specs
        const techData = await extractTechnicalSpecs(query);
        document.getElementById('tCov').value = techData.coverage;
        document.getElementById('tDry').value = techData.drying;
        document.getElementById('tThick').value = techData.thickness;

        // Media
        const [images, videos] = await Promise.all([
            searchProductImages(query),
            searchYouTubeVideos(query)
        ]);
        
        renderMediaScroll(images, 'imgScroll', 'img');
        renderMediaScroll(videos, 'vidScroll', 'vid');
        
        // Open Accordions
        ['acc1', 'acc2', 'acc3'].forEach(id => {
            const el = document.getElementById(id);
            el.style.maxHeight = el.scrollHeight + "px";
            el.previousElementSibling.classList.add('active');
        });

    } catch (e) { console.error(e); } 
    finally { 
        btn.innerHTML = '<i data-lucide="sparkles"></i>';
        lucide.createIcons();
    }
}

window.autoTech = async () => {
    const name = document.getElementById('pName').value || document.getElementById('aiSearch').value;
    if(!name) return;
    const btn = event.currentTarget;
    btn.innerText = "⏳ מעבד נתונים...";
    const data = await extractTechnicalSpecs(name);
    document.getElementById('tCov').value = data.coverage;
    document.getElementById('tDry').value = data.drying;
    document.getElementById('tThick').value = data.thickness;
    btn.innerHTML = `<i data-lucide="cpu" size="12"></i> נתונים חולצו!`;
    lucide.createIcons();
}

function renderMediaScroll(items, containerId, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "media-item bg-black";
        div.onclick = () => {
            container.querySelectorAll('.media-item').forEach(c => c.classList.remove('selected'));
            div.classList.add('selected');
            if(type === 'img') document.getElementById('pImg').value = item.link;
            else document.getElementById('pVideo').value = item.embed;
        };
        const src = type === 'img' ? item.link : item.thumbnail;
        div.innerHTML = `<img src="${src}" class="opacity-80 hover:opacity-100">`;
        if(type==='vid') div.innerHTML += '<div class="absolute inset-0 flex items-center justify-center"><i data-lucide="play-circle" class="text-white"></i></div>';
        container.appendChild(div);
    });
}

// --- Firebase ---
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
        else { data.createdAt = Date.now(); await addDoc(collection(db, "products"), data); }
        window.showView('list');
    } catch(e) { alert("שגיאה: " + e.message); }
}

window.loadInventory = async () => {
    const container = document.getElementById('productsContainer');
    if(!container) return;
    container.innerHTML = '<div class="text-center mt-10"><i data-lucide="loader-2" class="animate-spin inline"></i> טוען קטלוג...</div>';
    lucide.createIcons();

    try {
        const snap = await getDocs(collection(db, "products"));
        allProducts = [];
        container.innerHTML = "";
        
        snap.forEach(docSnap => {
            const p = {id: docSnap.id, ...docSnap.data()};
            allProducts.push(p);
            
            // --- כרטיס המוצר המעודכן עם נתונים טכניים ---
            container.innerHTML += `
                <div onclick="openProductPage('${p.id}')" class="bg-[#1e293b] rounded-2xl p-3 flex gap-4 border border-gray-700 shadow-lg active:scale-[0.98] transition cursor-pointer relative overflow-hidden">
                    <div class="w-24 h-24 bg-white rounded-xl flex-shrink-0 p-1">
                        <img src="${p.image || 'https://placehold.co/100'}" class="w-full h-full object-contain">
                    </div>
                    
                    <div class="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">${p.brand || 'SIKA'}</div>
                            <h3 class="font-bold text-lg text-white leading-tight mb-2">${p.name}</h3>
                        </div>
                        
                        <div class="flex flex-wrap gap-2 mt-auto">
                            ${p.tech?.drying ? `<span class="spec-badge"><i data-lucide="clock" size="10" class="text-orange-400"></i> ${p.tech.drying}</span>` : ''}
                            ${p.tech?.thickness ? `<span class="spec-badge"><i data-lucide="ruler" size="10" class="text-blue-400"></i> ${p.tech.thickness}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="absolute bottom-3 left-3 text-[#E3000F]">
                        <i data-lucide="arrow-left" size="20"></i>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } catch (e) { console.error(e); }
}

window.createNew = () => {
    document.getElementById('editId').value = "";
    document.querySelectorAll('input, textarea').forEach(i => i.value = "");
    document.getElementById('imgScroll').innerHTML = ""; 
    document.getElementById('vidScroll').innerHTML = "";
    window.showView('editor');
}

// פונקציה לפתיחת דף מוצר (מודל) לקריאה בלבד/עריכה
window.openProductPage = (id) => {
    const p = allProducts.find(x => x.id === id);
    if(!p) return;

    // מילוי הנתונים לעריכה (מאחורי הקלעים)
    document.getElementById('editId').value = id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pBrand').value = p.brand;
    document.getElementById('pCat').value = p.category;
    document.getElementById('pDesc').value = p.marketingDesc;
    document.getElementById('pImg').value = p.image;
    document.getElementById('pVideo').value = p.videoUrl || '';
    document.getElementById('tCov').value = p.tech?.coverage || '';
    document.getElementById('tDry').value = p.tech?.drying || '';
    document.getElementById('tThick').value = p.tech?.thickness || '';

    // הצגה במודל תצוגה
    updatePreviewData(); 
    document.getElementById('previewModal').classList.remove('hidden');
}

window.filterList = () => {
    const term = document.getElementById('listSearch').value.toLowerCase();
    const items = document.getElementById('productsContainer').children;
    Array.from(items).forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
    });
}

function updatePreviewData() {
    document.getElementById('prevName').innerText = document.getElementById('pName').value || 'שם המוצר';
    document.getElementById('prevBrand').innerText = document.getElementById('pBrand').value || 'BRAND';
    document.getElementById('prevDesc').innerText = document.getElementById('pDesc').value || 'אין תיאור זמין.';
    
    // Tech
    document.getElementById('prevCov').innerText = document.getElementById('tCov').value || '-';
    document.getElementById('prevDry').innerText = document.getElementById('tDry').value || '-';
    document.getElementById('prevThick').innerText = document.getElementById('tThick').value || '-';
    
    // Media Gallery Logic
    const imgUrl = document.getElementById('pImg').value || 'https://placehold.co/400';
    document.getElementById('prevImg').src = imgUrl;
    
    const videoUrl = document.getElementById('pVideo').value;
    const vidSlide = document.getElementById('videoSlide');
    
    if(videoUrl) {
        vidSlide.classList.remove('hidden'); // הצג את הסלייד של הוידאו
        document.getElementById('prevIframe').src = videoUrl;
    } else {
        vidSlide.classList.add('hidden'); // הסתר אם אין וידאו
    }
}

window.loadInventory();
