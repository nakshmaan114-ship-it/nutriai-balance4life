/* =========================
   NutriAI — Green Galaxy Final JS
   All features embedded:
   - auto-report update
   - downloads screen
   - feedback modal (one-way)
   - hidden admin (mascot tap x5)
   - bottom navigation for mobile
   - preview functionality for downloads
   ========================= */

(() => {
  // Shortcuts
  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const qAll = sel => Array.from(document.querySelectorAll(sel));

  // Screens & nav
  const screens = qAll('.screen');
  const navItems = qAll('.nav-item');
  const bottomNavItems = qAll('.bottom-nav-item');
  const screenTitle = $('screen-title');
  const screenSub = $('screen-sub');

  function showScreen(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
    navItems.forEach(n => n.classList.toggle('active', n.dataset.target === id));
    bottomNavItems.forEach(n => n.classList.toggle('active', n.dataset.target === id));
    const map = {
      home: ['Home','Smart protein calculator'],
      calculator: ['Calculator','Calculate BMR, TDEE & protein'],
      diet: ['Diet Plan','Generate daily meals'],
      report: ['Report','Saved analysis & download'],
      certificate: ['Certificate','Download your certificate'],
      downloads: ['Downloads','Your exported files']
    };
    if(map[id]) { screenTitle.textContent = map[id][0]; screenSub.textContent = map[id][1]; }
    // scroll to top content
    document.querySelector('.content').scrollTop = 0;
  }

  navItems.forEach(n => n.addEventListener('click', () => showScreen(n.dataset.target)));
  bottomNavItems.forEach(n => n.addEventListener('click', () => showScreen(n.dataset.target)));
  qAll('[data-nav]').forEach(b => b.addEventListener('click', () => showScreen(b.getAttribute('data-nav') || b.dataset.nav)));

  // Splash hide
  setTimeout(() => {
    const s = $('splash'); if(!s) return;
    s.style.opacity='0'; s.style.transform='translateY(-10px)';
    setTimeout(()=> s.remove(), 700);
  }, 900);

  // LocalStorage keys
  const KEY_REPORT = 'nutria_report_final';
  const KEY_PLAN = 'nutria_plan_final';
  const KEY_DOWNLOADS = 'nutria_downloads_final';
  const KEY_FEEDBACKS = 'nutria_feedbacks_final';

  // State
  let currentResult = null;
  let lastPlan = null;
  let downloads = JSON.parse(localStorage.getItem(KEY_DOWNLOADS) || '[]');
  let currentPreviewItem = null;

  // Utility
  function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function nowISO(){ return new Date().toISOString(); }

  // Calculation functions
  function calcBMR(w,h,a,gender){
    let v = 10*w + 6.25*h - 5*a;
    v += (gender === 'male') ? 5 : (gender === 'female') ? -161 : -78;
    return Math.round(v);
  }
  function calcTDEE(bmr,activity){ return Math.round(bmr * activity); }

  // Update stats UI
  function updateStatsUI(profile){
    if(!profile){
      $('bmr').textContent = '— kcal';
      $('tdee').textContent = '— kcal';
      $('protein').textContent = '— g';
      $('saved-summary').textContent = 'No saved report';
      return;
    }
    $('bmr').textContent = profile.bmr + ' kcal';
    $('tdee').textContent = profile.tdee + ' kcal';
    $('protein').textContent = profile.protein + ' g';
    $('saved-summary').textContent = profile.name ? `Saved • ${profile.name.split(' ')[0]}` : 'Saved';
  }

  // Render report
  function renderReport(){
    const data = JSON.parse(localStorage.getItem(KEY_REPORT) || 'null');
    const wrap = $('report-area');
    if(!data){ wrap.innerHTML = '<div class="stat-small muted">No saved report yet.</div>'; updateStatsUI(null); return; }
    let html = '';
    html += `<div style="display:flex;gap:16px;align-items:center"><div style="width:80px;height:80px;border-radius:12px;background:linear-gradient(135deg,var(--primary-200),var(--accent));display:flex;align-items:center;justify-content:center"><span class="material-icons" style="color:var(--primary-700);font-size:36px">person</span></div><div><div style="font-weight:800;font-size:18px">${escapeHtml(data.name || '—')}</div><div class="stat-small muted">Saved: ${new Date(data.savedAt).toLocaleString()}</div></div></div>`;
    html += '<div style="height:16px"></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:12px">';
    html += `<div class="card"><div class="stat-small">Age</div><div style="font-weight:700">${data.age}</div></div>`;
    html += `<div class="card"><div class="stat-small">Height</div><div style="font-weight:700">${data.height} cm</div></div>`;
    html += `<div class="card"><div class="stat-small">Weight</div><div style="font-weight:700">${data.weight} kg</div></div>`;
    html += '</div>';
    html += '<div style="height:16px"></div>';
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap"><div class="card" style="flex:1;min-width:150px"><div class="stat-small">BMR</div><div style="font-weight:700">${data.bmr} kcal</div></div><div class="card" style="flex:1;min-width:150px"><div class="stat-small">TDEE</div><div style="font-weight:700">${data.tdee} kcal</div></div></div>`;
    html += '<div style="height:16px"></div>';
    html += `<div class="card"><div class="stat-small">Protein goal</div><div style="font-weight:700">${data.protein} g/day</div></div>`;

    // include saved plan if any
    const plan = JSON.parse(localStorage.getItem(KEY_PLAN) || 'null');
    if(plan){
      html += '<div style="height:16px"></div>';
      html += `<div class="card"><div style="font-weight:800">Saved Diet Plan (${escapeHtml(plan.type)})</div><div class="stat-small muted">Saved: ${new Date(plan.time).toLocaleString()}</div><div style="height:12px"></div>`;
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px">';
      plan.plan.meals.forEach((m,i) => {
        html += `<div style="padding:12px;border-radius:10px;background:#fbfff9;border:1px solid rgba(0,0,0,0.03)"><div style="font-weight:700">${escapeHtml(m.name)}</div><div class="stat-small">${m.protein} g protein</div></div>`;
      });
      html += '</div></div>';
    }

    wrap.innerHTML = html;
    // update certificate preview text
    if(data.name){
      $('certName').textContent = `${data.name} — NutriAI Certified`;
      $('certDesc').textContent = `${data.protein} g/day target • Generated ${new Date(data.savedAt).toLocaleDateString()}`;
      $('certFooter').textContent = `Made with ♥ by Balance 4 Life — ${new Date(data.savedAt).toLocaleDateString()}`;
    }
    updateStatsUI(data);
  }

  // Calculate button handler (auto-update report)
  $('calc').addEventListener('click', () => {
    const name = $('name').value.trim();
    const age = Number($('age').value);
    const gender = $('gender').value;
    const height = Number($('height').value);
    const weight = Number($('weight').value);
    const activity = Number($('activity').value);
    const gamma = Number($('gamma').value);
    if(!age || !height || !weight){ alert('Please enter age, height and weight.'); return; }
    const bmr = calcBMR(weight, height, age, gender);
    const tdee = calcTDEE(bmr, activity);
    const protein = +(gamma * weight).toFixed(1);
    currentResult = { name, age, gender, height, weight, activity, gamma, bmr, tdee, protein, savedAt: nowISO() };
    // Write to storage automatically (auto update)
    localStorage.setItem(KEY_REPORT, JSON.stringify(currentResult));
    renderReport();
    // prefill diet target
    $('target').value = protein;
    // switch to report
    showScreen('report');
  });

  // Save button (optional) — behaves same as auto-save but gives feedback
  $('save').addEventListener('click', () => {
    if(!currentResult){
      alert('Calculate first.');
      return;
    }
    currentResult.savedAt = nowISO();
    localStorage.setItem(KEY_REPORT, JSON.stringify(currentResult));
    renderReport();
    alert('Profile saved to local storage and included in Report.');
  });

  // Quick estimate
  $('quick-run').addEventListener('click', () => {
    const w = Number($('quick-weight').value);
    if(!w || w <= 0){ $('quick-out').textContent = 'Enter weight'; return; }
    const est = Math.round(w * 1.2);
    $('quick-out').textContent = `~${est} g/day (1.2 g/kg)`;
  });

  // Diet generator
  const mealsDB = {
    veg: [
      {name:'Greek yogurt + oats', protein:18},
      {name:'Paneer curry + roti', protein:30},
      {name:'Lentil dal + rice', protein:20},
      {name:'Chickpea salad', protein:12},
      {name:'Peanut butter toast', protein:10},
      {name:'Scrambled eggs (2)', protein:12},
      {name:'Protein smoothie (milk + banana)', protein:18},
      {name:'Tofu stir-fry', protein:22},
      {name:'Soya chunks curry', protein:28},
      {name:'Quinoa bowl with beans', protein:16}
    ],
    nonveg: [
      {name:'Grilled chicken breast', protein:33},
      {name:'Fish (salmon) + veggies', protein:28},
      {name:'Turkey sandwich', protein:22},
      {name:'Egg omelette (3)', protein:18},
      {name:'Tuna salad', protein:25},
      {name:'Shrimp stir-fry', protein:24},
      {name:'Greek yogurt + oats', protein:18},
      {name:'Chicken & chickpea bowl', protein:30}
    ],
    vegan: [
      {name:'Tofu scramble', protein:20},
      {name:'Lentil stew + quinoa', protein:22},
      {name:'Chickpea curry + rice', protein:20},
      {name:'Peanut butter shake', protein:12},
      {name:'Black bean tacos', protein:18},
      {name:'Edamame salad', protein:16},
      {name:'Seitan stir-fry', protein:25},
      {name:'Quinoa bowl with nuts', protein:14}
    ]
  };

  function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }

  function generatePlan(type, target){
    const pool = shuffle(mealsDB[type].slice());
    const mealSlots = 4 + Math.floor(Math.random()*2);
    const per = Math.max(8, Math.round(target/mealSlots));
    const meals = [];
    let total = 0;
    for(let i=0;i<mealSlots && pool.length;i++){
      let bestIndex = 0, bestDiff = Infinity;
      for(let j=0;j<pool.length;j++){
        const diff = Math.abs(pool[j].protein - per);
        if(diff < bestDiff){ bestDiff = diff; bestIndex = j; }
      }
      const picked = pool.splice(bestIndex,1)[0];
      meals.push(picked); total += picked.protein;
    }
    if(total < target){
      const smalls = [].concat(...Object.values(mealsDB)).sort((a,b)=>a.protein-b.protein);
      let idx=0;
      while(total < target && idx < smalls.length){
        meals.push(smalls[idx]); total += smalls[idx].protein; idx++;
        if(meals.length>12) break;
      }
    }
    return { meals, total, remaining: Math.max(0, target - total) };
  }

  function renderDietPlan(plan){
    const wrap = $('diet-wrap'); wrap.innerHTML = '';
    if(!plan){ wrap.innerHTML = '<div class="stat-small muted">No plan yet.</div>'; return; }
    const info = document.createElement('div'); info.className = 'card';
    info.innerHTML = `<div style="display:flex;justify-content:space-between"><div><div class="stat-small">Plan total</div><div style="font-weight:800">${plan.total} g</div></div><div class="stat-small">Remaining: ${plan.remaining} g</div></div>`;
    wrap.appendChild(info);
    const grid = document.createElement('div'); grid.className = 'meals-grid';
    plan.meals.forEach(m => {
      const el = document.createElement('div'); el.className='meal';
      el.innerHTML = `<h4>${escapeHtml(m.name)}</h4><p>${m.protein} g protein (approx.)</p>`;
      grid.appendChild(el);
    });
    wrap.appendChild(grid);
  }

  $('gen').addEventListener('click', () => {
    const type = $('diet-type').value;
    const target = Number($('target').value) || (currentResult ? currentResult.protein : 60);
    if(!target || target <= 0){ alert('Enter a valid target'); return; }
    lastPlan = generatePlan(type, target);
    renderDietPlan(lastPlan);
  });

  $('regen').addEventListener('click', () => { if(!lastPlan) $('gen').click(); else $('gen').click(); });

  $('savePlan').addEventListener('click', () => {
    if(!lastPlan){ alert('Generate a plan first'); return; }
    const entry = { plan: lastPlan, type: $('diet-type').value, target: Number($('target').value) || (currentResult ? currentResult.protein : 60), time: nowISO() };
    localStorage.setItem(KEY_PLAN, JSON.stringify(entry));
    // include in report automatically
    renderReport();
    // add a download metadata entry (so user sees that plan saved)
    addDownloadItem('Diet Plan', `Plan • ${entry.type}`, JSON.stringify(entry));
    alert('Diet plan saved and will appear in Report.');
  });

  // Downloads management
  function addDownloadItem(type, title, payload){
    const id = 'dl_' + Math.random().toString(36).slice(2,9);
    downloads.unshift({ id, type, title, payload, time: nowISO() });
    if(downloads.length > 60) downloads.pop();
    localStorage.setItem(KEY_DOWNLOADS, JSON.stringify(downloads));
    renderDownloadsList();
  }

  function renderDownloadsList(){
    const list = $('downloadsList'); list.innerHTML = '';
    if(!downloads.length){ list.innerHTML = '<div class="stat-small muted">No downloads yet. Export a report or certificate to see items here.</div>'; return; }
    downloads.forEach(it => {
      const row = document.createElement('div'); row.className = 'download-item';
      row.innerHTML = `<div><div style="font-weight:700">${escapeHtml(it.title)}</div><div class="stat-small muted">${new Date(it.time).toLocaleString()}</div></div>
        <div style="display:flex;gap:8px"><button class="glass-btn small" data-id="${it.id}" data-action="preview">Preview</button><button class="glass-btn small" data-id="${it.id}" data-action="del">Delete</button></div>`;
      list.appendChild(row);
    });
    // wiring
    list.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.id; const act = b.dataset.action;
      const it = downloads.find(x => x.id === id);
      if(!it) return;
      if(act === 'preview'){
        previewFile(it);
      } else if(act === 'del') {
        downloads = downloads.filter(x => x.id !== id);
        localStorage.setItem(KEY_DOWNLOADS, JSON.stringify(downloads));
        renderDownloadsList();
      }
    }));
  }

  // Preview file functionality
  function previewFile(item) {
    currentPreviewItem = item;
    const modal = $('previewModal');
    const title = $('previewTitle');
    const content = $('previewContent');
    
    title.textContent = item.title;
    
    if(item.type === 'Report') {
      const data = JSON.parse(localStorage.getItem(KEY_REPORT) || 'null');
      if(!data) {
        content.innerHTML = '<div class="stat-small muted">Report data not found.</div>';
      } else {
        let html = `<div style="display:flex;gap:16px;align-items:center"><div style="width:60px;height:60px;border-radius:10px;background:linear-gradient(135deg,var(--primary-200),var(--accent));display:flex;align-items:center;justify-content:center"><span class="material-icons" style="color:var(--primary-700);font-size:30px">person</span></div><div><div style="font-weight:700">${escapeHtml(data.name || '—')}</div><div class="stat-small muted">Saved: ${new Date(data.savedAt).toLocaleString()}</div></div></div>`;
        html += '<div style="height:16px"></div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:12px">';
        html += `<div><div class="stat-small">Age</div><div style="font-weight:700">${data.age}</div></div>`;
        html += `<div><div class="stat-small">Height</div><div style="font-weight:700">${data.height} cm</div></div>`;
        html += `<div><div class="stat-small">Weight</div><div style="font-weight:700">${data.weight} kg</div></div>`;
        html += '</div>';
        html += '<div style="height:16px"></div>';
        html += `<div style="display:flex;gap:12px;flex-wrap:wrap"><div style="flex:1;min-width:120px"><div class="stat-small">BMR</div><div style="font-weight:700">${data.bmr} kcal</div></div><div style="flex:1;min-width:120px"><div class="stat-small">TDEE</div><div style="font-weight:700">${data.tdee} kcal</div></div></div>`;
        html += '<div style="height:16px"></div>';
        html += `<div><div class="stat-small">Protein goal</div><div style="font-weight:700">${data.protein} g/day</div></div>`;
        content.innerHTML = html;
      }
    } else if(item.type === 'Certificate') {
      const certContent = $('certArea').innerHTML;
      content.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:20px">${certContent}</div>`;
    } else if(item.type === 'Diet Plan') {
      const plan = JSON.parse(item.payload);
      if(!plan) {
        content.innerHTML = '<div class="stat-small muted">Plan data not found.</div>';
      } else {
        let html = `<h3>Diet Plan (${escapeHtml(plan.type)})</h3><p class="stat-small">Saved: ${new Date(plan.time).toLocaleString()}</p>`;
        html += `<div class="stat-small">Total: ${plan.plan.total}g protein | Remaining: ${plan.plan.remaining}g</div>`;
        html += '<div style="height:16px"></div>';
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:12px">';
        plan.plan.meals.forEach((m,i) => {
          html += `<div style="padding:12px;border-radius:10px;background:#fbfff9;border:1px solid rgba(0,0,0,0.03)"><div style="font-weight:700">${escapeHtml(m.name)}</div><div class="stat-small">${m.protein} g protein</div></div>`;
        });
        html += '</div>';
        content.innerHTML = html;
      }
    } else {
      content.innerHTML = '<div class="stat-small muted">Preview not available for this file type.</div>';
    }
    
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }

  // Close preview modal
  $('closePreview').addEventListener('click', () => {
    $('previewModal').style.display = 'none';
    $('previewModal').setAttribute('aria-hidden', 'true');
  });

  // PDF generation functions (report / certificate / plan)
  async function downloadReportPDF(){
    const node = $('report-area');
    if(!node || !node.innerHTML.trim()){ alert('No report to export.'); return; }
    try{
      // Temporarily replace gradient backgrounds with solid colors
      const originalStyles = [];
      const elementsWithGradients = node.querySelectorAll('*');
      elementsWithGradients.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.backgroundImage && computedStyle.backgroundImage.includes('gradient')) {
          originalStyles.push({
            element: el,
            backgroundImage: el.style.backgroundImage,
            backgroundColor: el.style.backgroundColor
          });
          // Replace gradient with solid color
          el.style.backgroundImage = 'none';
          el.style.backgroundColor = 'var(--surface)';
        }
      });
      
      const canvas = await html2canvas(node, { 
        scale: 2, 
        useCORS:true,
        backgroundColor: '#ffffff'
      });
      
      // Restore original styles
      originalStyles.forEach(item => {
        item.element.style.backgroundImage = item.backgroundImage;
        item.element.style.backgroundColor = item.backgroundColor;
      });
      
      const img = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit:'px', format:[canvas.width, canvas.height] });
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height);
      const filename = `NutriAI_Report_${(currentResult && currentResult.name) ? currentResult.name.replace(/\s+/g,'_') : 'report'}_${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(filename);
      addDownloadItem('Report', filename, 'report');
      alert('Report exported and saved to Downloads list.');
    } catch(e){ alert('Export failed: ' + e.message); }
  }

  async function downloadCertificatePDF(){
    const node = $('certArea');
    try{
      // Temporarily replace gradient backgrounds with solid colors
      const originalStyles = [];
      const elementsWithGradients = node.querySelectorAll('*');
      elementsWithGradients.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.backgroundImage && computedStyle.backgroundImage.includes('gradient')) {
          originalStyles.push({
            element: el,
            backgroundImage: el.style.backgroundImage,
            backgroundColor: el.style.backgroundColor
          });
          // Replace gradient with solid color
          el.style.backgroundImage = 'none';
          el.style.backgroundColor = 'var(--surface)';
        }
      });
      
      const canvas = await html2canvas(node, { 
        scale: 2, 
        useCORS:true,
        backgroundColor: '#ffffff'
      });
      
      // Restore original styles
      originalStyles.forEach(item => {
        item.element.style.backgroundImage = item.backgroundImage;
        item.element.style.backgroundColor = item.backgroundColor;
      });
      
      const img = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:'landscape', unit:'px', format:[canvas.width, canvas.height] });
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height);
      const filename = `NutriAI_Certificate_${(currentResult && currentResult.name) ? currentResult.name.replace(/\s+/g,'_') : 'cert'}_${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(filename);
      addDownloadItem('Certificate', filename, 'certificate');
      alert('Certificate exported and saved to Downloads list.');
    } catch(e){ alert('Certificate export failed: ' + e.message); }
  }

  async function downloadPlanPDF(planObj){
    if(!planObj) planObj = JSON.parse(localStorage.getItem(KEY_PLAN) || 'null');
    if(!planObj){ alert('No plan available.'); return; }
    // create temporary element for clean rendering
    const wrap = document.createElement('div'); wrap.style.padding='18px'; wrap.style.background='#fff';
    let html = `<h2>Diet Plan (${escapeHtml(planObj.type)})</h2><p>Saved: ${new Date(planObj.time).toLocaleString()}</p>`;
    html += '<table style="width:100%;border-collapse:collapse"><thead><tr style="font-weight:700"><th style="padding:6px">Meal</th><th style="padding:6px">Item</th><th style="padding:6px">Protein</th></tr></thead><tbody>';
    planObj.plan.meals.forEach((m,i) => html += `<tr><td style="padding:6px">${i+1}</td><td style="padding:6px">${escapeHtml(m.name)}</td><td style="padding:6px">${m.protein}</td></tr>`);
    html += `</tbody></table><p>Total: ${planObj.plan.total} g • Remaining: ${planObj.plan.remaining} g</p>`;
    wrap.innerHTML = html; document.body.appendChild(wrap);
    try{
      const canvas = await html2canvas(wrap, { 
        scale: 2, 
        useCORS:true,
        backgroundColor: '#ffffff'
      });
      const img = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit:'px', format:[canvas.width, canvas.height] });
      pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height);
      const filename = `NutriAI_Plan_${planObj.type}_${new Date().toISOString().slice(0,10)}.pdf`;
      pdf.save(filename);
      addDownloadItem('Diet Plan', filename, JSON.stringify(planObj));
      alert('Plan exported and saved to Downloads list.');
    } catch(e){ alert('Plan export failed: ' + e.message); }
    document.body.removeChild(wrap);
  }

  // Wire download buttons on report screen
  $('downloadReport').addEventListener('click', downloadReportPDF);
  $('downloadCert').addEventListener('click', downloadCertificatePDF);
  $('downloadCertBtn').addEventListener('click', downloadCertificatePDF);

  // clear saved report
  $('clear').addEventListener('click', () => {
    if(!confirm('Clear saved report and saved plan?')) return;
    localStorage.removeItem(KEY_REPORT); localStorage.removeItem(KEY_PLAN);
    currentResult = null; lastPlan = null;
    updateStatsUI(null);
    renderReport();
    alert('Cleared saved profile and plan.');
  });

  // certificate print
  $('printCert').addEventListener('click', () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Certificate</title></head><body>${$('certArea').outerHTML}</body></html>`);
    w.document.close(); setTimeout(()=> w.print(), 600);
  });

  // init loads
  function init(){
    // load saved report into UI
    const saved = JSON.parse(localStorage.getItem(KEY_REPORT) || 'null');
    if(saved){
      currentResult = saved;
      // prefill inputs
      $('name').value = saved.name || '';
      $('age').value = saved.age || '';
      $('gender').value = saved.gender || 'male';
      $('height').value = saved.height || '';
      $('weight').value = saved.weight || '';
      $('activity').value = saved.activity || 1.55;
      $('gamma').value = saved.gamma || 1.6;
      updateStatsUI(saved);
      renderReport();
      $('target').value = saved.protein || '';
    }
    const savedPlan = JSON.parse(localStorage.getItem(KEY_PLAN) || 'null');
    if(savedPlan){
      lastPlan = savedPlan.plan;
      renderDietPlan(lastPlan);
    }
    downloads = JSON.parse(localStorage.getItem(KEY_DOWNLOADS) || '[]');
    renderDownloadsList();
  }
  init();

  // small ripple effect (visual)
  function attachRipple(){
    qAll('.ripple').forEach(el => {
      el.addEventListener('pointerdown', e => {
        const rect = el.getBoundingClientRect();
        const circle = document.createElement('span');
        circle.style.position='absolute';
        circle.style.left=(e.clientX-rect.left-30)+'px';
        circle.style.top=(e.clientY-rect.top-30)+'px';
        circle.style.width='60px'; circle.style.height='60px'; circle.style.borderRadius='50%';
        circle.style.background='rgba(0,0,0,0.06)'; circle.style.pointerEvents='none'; circle.style.transform='scale(0)';
        circle.style.transition='transform .6s ease, opacity .6s ease';
        el.appendChild(circle);
        requestAnimationFrame(()=> circle.style.transform='scale(1)');
        setTimeout(()=> { circle.style.opacity='0'; setTimeout(()=> circle.remove(),600); }, 450);
      });
    });
  }
  attachRipple();

  // Feedback modal logic (one-way)
  const fbModal = $('feedbackModal');
  const fbName = $('fbName');
  const fbRating = $('fbRating');
  const fbText = $('fbText');
  const fbStatus = $('fbStatus');

  function openFeedbackModal(){
    fbName.value=''; fbRating.value='5'; fbText.value='';
    fbStatus.textContent='';
    fbModal.style.display='flex'; fbModal.setAttribute('aria-hidden','false');
  }
  function closeFeedbackModal(){ fbModal.style.display='none'; fbModal.setAttribute('aria-hidden','true'); }

  $('fab').addEventListener('click', openFeedbackModal);
  $('closeFeedback').addEventListener('click', closeFeedbackModal);

  $('sendFeedbackBtn').addEventListener('click', () => {
    const name = fbName.value.trim();
    const rating = Number(fbRating.value);
    const text = fbText.value.trim();
    if(!text){ fbStatus.textContent = 'Please write a short message.'; return; }
    // store feedback (one-way)
    const entry = { name: name || 'Anonymous', rating, text, time: nowISO() };
    const arr = JSON.parse(localStorage.getItem(KEY_FEEDBACKS) || '[]');
    arr.unshift(entry);
    localStorage.setItem(KEY_FEEDBACKS, JSON.stringify(arr));
    // show thank you
    fbStatus.style.color = 'var(--primary)';
    fbStatus.textContent = 'Thanks — your feedback was recorded.';
    // small pulse animation
    fbStatus.animate([{opacity:0},{opacity:1}], {duration:500});
    setTimeout(() => closeFeedbackModal(), 1000);
  });

  // Hidden admin view (mascot / logo tap 5x to open)
  let tapCount = 0;
  let lastTapTime = 0;
  const ADMIN_TAP_THRESHOLD_MS = 1500;

  function openAdmin(){
    const arr = JSON.parse(localStorage.getItem(KEY_FEEDBACKS) || '[]');
    const list = $('adminList'); list.innerHTML = '';
    if(!arr.length){ list.innerHTML = '<div class="stat-small muted">No feedbacks yet.</div>'; }
    else {
      arr.forEach((f, idx) => {
        const el = document.createElement('div'); el.style.padding='12px'; el.style.borderBottom='1px solid rgba(0,0,0,0.04)';
        el.innerHTML = `<div style="font-weight:700">${escapeHtml(f.name)} <span class="stat-small muted">• ${new Date(f.time).toLocaleString()}</span></div><div class="stat-small">Rating: ${f.rating}/5</div><div style="height:8px"></div><div>${escapeHtml(f.text)}</div>`;
        list.appendChild(el);
      });
    }
    $('adminModal').style.display='flex'; $('adminModal').setAttribute('aria-hidden','false');
  }

  function closeAdmin(){ $('adminModal').style.display='none'; $('adminModal').setAttribute('aria-hidden','true'); }

  // tap hooks
  const mascotEl = $('mascot');
  const logoBtn = $('logoBtn');
  function handleTap(){
    const now = Date.now();
    if(now - lastTapTime > ADMIN_TAP_THRESHOLD_MS) tapCount = 0;
    tapCount++; lastTapTime = now;
    if(tapCount >= 5){
      tapCount = 0;
      openAdmin();
    }
  }
  if(mascotEl) mascotEl.addEventListener('click', handleTap);
  if(logoBtn) logoBtn.addEventListener('click', handleTap);

  $('closeAdmin').addEventListener('click', closeAdmin);

  // admin export & clear
  $('exportFeedbacks').addEventListener('click', () => {
    const arr = JSON.parse(localStorage.getItem(KEY_FEEDBACKS) || '[]');
    if(!arr.length){ alert('No feedbacks to export'); return; }
    const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nutria_feedbacks_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click();
    setTimeout(()=> { URL.revokeObjectURL(url); a.remove(); }, 500);
  });

  $('clearFeedbacks').addEventListener('click', () => {
    if(!confirm('Clear all saved feedbacks?')) return;
    localStorage.removeItem(KEY_FEEDBACKS);
    $('adminList').innerHTML = '<div class="stat-small muted">No feedbacks yet.</div>';
    alert('Feedbacks cleared.');
  });

  // Theme toggle small playful tint
  $('theme-toggle').addEventListener('click', () => {
    document.body.style.background = document.body.style.background && document.body.style.background.includes('#fff7f3') ? 'linear-gradient(180deg,#f4fff7,#e8f5e9)' : 'linear-gradient(180deg,#fff7f3,#f0fff3)';
    $('theme-toggle').animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:700});
  });

  // Downloads list initial render
  renderDownloadsList();
})();