(() => {
  const KEY = 'garciaDigitalCRM_v1';
  const statuses = ['Novo','Contatado','Em negociação','Ganho','Perdido'];
  const quoteStatuses = ['Rascunho','Enviado','Aprovado','Recusado'];
  let state = loadState();
  let toastTimer;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => new Date().toISOString().slice(0,10);
  const fmtDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const money = value => Number(value || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
  const initials = name => String(name||'?').trim().split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase();
  const slug = s => String(s||'').replaceAll(' ','-').replace('ç','c').replace('ã','a').replace('á','a').replace('é','e');
  function loadState(){try{return JSON.parse(localStorage.getItem(KEY)) || {leads:[],quotes:[],seq:1};}catch{return {leads:[],quotes:[],seq:1};}}
  function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
  function id(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);}
  function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}
  function openModal(id){$(id).classList.add('open');$(id).setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
  function closeModal(id){$(id).classList.remove('open');$(id).setAttribute('aria-hidden','true');document.body.style.overflow='';}
  function go(view){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));$(view+'Page').classList.add('active');document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('crumb').textContent=({dashboard:'Visão geral',leads:'Leads',quotes:'Orçamentos'})[view];window.scrollTo({top:0,behavior:'smooth'});render();}
  function statusBadge(s){return `<span class="status s-${slug(s)}">${esc(s)}</span>`;}
  function empty(showId,show){$(showId).classList.toggle('show',show);}
  function render(){
    $('leadNavCount').textContent=state.leads.length;
    $('metricLeads').textContent=state.leads.length;
    $('metricNegotiation').textContent=state.leads.filter(l=>['Contatado','Em negociação'].includes(l.status)).length;
    $('metricQuotes').textContent=state.quotes.filter(q=>['Enviado','Aprovado'].includes(q.status)).length;
    $('metricValue').textContent=money(state.quotes.reduce((sum,q)=>sum+Number(q.value||0),0));
    renderRecent();renderPipeline();renderFollowups();renderLeads();renderQuotes();populateQuoteLeads();
  }
  function renderRecent(){
    const list=[...state.leads].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);
    $('recentLeads').innerHTML=list.map(l=>`<tr><td><div class="contact-cell"><span class="contact-avatar">${esc(initials(l.name))}</span><span><b>${esc(l.name)}</b><small>${esc(l.email||l.phone||'Sem contato informado')}</small></span></div></td><td>${esc(l.service)}</td><td>${statusBadge(l.status)}</td><td>${fmtDate(l.createdAt)}</td></tr>`).join('');
    empty('recentEmpty',list.length===0);
  }
  function renderPipeline(){
    const groups=[['Novo','#1681f7'],['Contatado','#8b5ae4'],['Em negociação','#e0ac22'],['Ganho','#18ad7d'],['Perdido','#d84b5b']];
    $('pipeline').innerHTML=groups.map(([name])=>{const count=state.leads.filter(l=>l.status===name).length;const pct=state.leads.length?count/state.leads.length*100:0;return `<div class="pipeline-row"><div class="pipeline-label"><span>${name}</span><b>${count} <small>(${Math.round(pct)}%)</small></b></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></div>`}).join('');
  }
  function renderFollowups(){
    const list=state.leads.filter(l=>l.followDate && !['Ganho','Perdido'].includes(l.status) && l.followDate<=today()).sort((a,b)=>a.followDate.localeCompare(b.followDate)).slice(0,5);
    $('followUps').innerHTML=list.length?list.map(l=>{const late=l.followDate<today();return `<div class="follow-item"><div class="follow-date ${late?'late':''}">${late?'ATRASO': 'HOJE'}<br>${fmtDate(l.followDate).slice(0,5)}</div><div class="follow-info"><b>${esc(l.name)}</b><small>${esc(l.company||l.service)} · ${late?'Retorno pendente':'Agendado para hoje'}</small></div><button class="icon-btn" title="Editar lead" data-edit-lead="${esc(l.id)}">✎</button></div>`}).join(''):'<div class="empty-state show"><b>Nenhum acompanhamento pendente</b><p>Quando houver retorno para hoje ou atrasado, ele aparecerá aqui.</p></div>';
  }
  function renderLeads(){
    const search=$('leadSearch').value.toLowerCase(),status=$('statusFilter').value,service=$('serviceFilter').value;
    const list=[...state.leads].filter(l=>(!search||[l.name,l.company,l.email,l.phone].some(v=>String(v||'').toLowerCase().includes(search)))&&(!status||l.status===status)&&(!service||l.service===service)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    $('leadsTable').innerHTML=list.map(l=>`<tr><td><div class="contact-cell"><span class="contact-avatar">${esc(initials(l.name))}</span><span><b>${esc(l.name)}</b><small>${esc(l.email||l.phone||'Sem contato')}</small></span></div></td><td>${esc(l.company||'—')}</td><td>${esc(l.service)}</td><td>${statusBadge(l.status)}</td><td>${fmtDate(l.followDate)}</td><td><div class="row-actions"><button class="icon-btn" title="Editar" data-edit-lead="${esc(l.id)}">✎</button><button class="icon-btn" title="Criar orçamento" data-new-quote-for="${esc(l.id)}">▤</button><button class="icon-btn" title="Excluir" data-delete-lead="${esc(l.id)}">×</button></div></td></tr>`).join('');
    empty('leadsEmpty',list.length===0);
  }
  function renderQuotes(){
    const search=$('quoteSearch').value.toLowerCase(),status=$('quoteStatusFilter').value;
    const list=[...state.quotes].filter(q=>{const lead=state.leads.find(l=>l.id===q.leadId);return (!search||[lead?.name,q.service].some(v=>String(v||'').toLowerCase().includes(search)))&&(!status||q.status===status)}).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    $('quotesTable').innerHTML=list.map(q=>{const lead=state.leads.find(l=>l.id===q.leadId);return `<tr><td><b>${esc(q.number)}</b></td><td>${esc(lead?.name||'Lead removido')}</td><td>${esc(q.service)}</td><td><b>${money(q.value)}</b></td><td>${statusBadge(q.status)}</td><td>${fmtDate(q.createdAt)}</td><td><div class="row-actions"><button class="icon-btn" title="Editar" data-edit-quote="${esc(q.id)}">✎</button><button class="icon-btn" title="Ver / imprimir" data-print-quote="${esc(q.id)}">↗</button><button class="icon-btn" title="Excluir" data-delete-quote="${esc(q.id)}">×</button></div></td></tr>`}).join('');
    empty('quotesEmpty',list.length===0);
  }
  function populateQuoteLeads(selected=''){
    const eligible=state.leads.filter(l=>!['Perdido'].includes(l.status));
    $('quoteLead').innerHTML='<option value="">Selecione um lead</option>'+eligible.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}${l.company?' — '+esc(l.company):''}</option>`).join('');
    if(selected)$('quoteLead').value=selected;
  }
  function resetLeadForm(){ $('leadForm').reset();$('leadId').value='';$('leadStatus').value='Novo';$('leadModalTitle').textContent='Cadastrar lead'; }
  function editLead(idVal=''){
    resetLeadForm();const l=state.leads.find(x=>x.id===idVal);
    if(l){$('leadId').value=l.id;$('leadName').value=l.name;$('leadCompany').value=l.company||'';$('leadPhone').value=l.phone||'';$('leadEmail').value=l.email||'';$('leadService').value=l.service;$('leadStatus').value=l.status;$('leadFollow').value=l.followDate||'';$('leadSource').value=l.source||'WhatsApp';$('leadNotes').value=l.notes||'';$('leadModalTitle').textContent='Editar lead';}
    openModal('leadModal');setTimeout(()=>$('leadName').focus(),50);
  }
  function editQuote(idVal='',leadId=''){
    $('quoteForm').reset();$('quoteId').value='';$('quoteModalTitle').textContent='Criar orçamento';populateQuoteLeads(leadId);
    const q=state.quotes.find(x=>x.id===idVal);
    if(q){$('quoteId').value=q.id;$('quoteLead').value=q.leadId;$('quoteService').value=q.service;$('quoteValue').value=q.value;$('quoteStatus').value=q.status;$('quoteValid').value=q.validUntil||'';$('quoteDeadline').value=q.deadline||'';$('quoteDescription').value=q.description||'';$('quoteModalTitle').textContent='Editar orçamento';}
    openModal('quoteModal');
  }
  function exportData(){
    const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='garcia-digital-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href);showToast('Backup exportado.');
  }
  function printQuote(idVal){
    const q=state.quotes.find(x=>x.id===idVal);if(!q)return;const l=state.leads.find(x=>x.id===q.leadId)||{};
    const w=window.open('','_blank');if(!w){showToast('Permita pop-ups para visualizar o orçamento.');return;}
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Orçamento ${esc(q.number)}</title><style>body{font:15px Arial,sans-serif;color:#1b2638;max-width:800px;margin:45px auto;padding:0 25px}header{border-bottom:3px solid #1387f7;padding-bottom:20px}h1{margin-bottom:4px}small{color:#64748b}.value{font-size:30px;color:#0866dc;font-weight:bold;margin:25px 0}.box{background:#f4f7fb;padding:20px;border-radius:8px;margin:20px 0}.footer{margin-top:60px;border-top:1px solid #ddd;padding-top:15px;color:#64748b;font-size:12px}@media print{button{display:none}}</style></head><body><header><h1>GARCIA DIGITAL</h1><small>Proposta comercial · ${esc(q.number)}</small></header><h2>Orçamento para ${esc(l.name||'Cliente')}</h2><p>${esc(l.company||'')} ${l.email?'· '+esc(l.email):''} ${l.phone?'· '+esc(l.phone):''}</p><div class="box"><b>Serviço</b><p>${esc(q.service)}</p><b>Descrição e entregáveis</b><p>${esc(q.description||'Conforme alinhado com o cliente.').replaceAll('\\n','<br>')}</p><b>Prazo estimado</b><p>${esc(q.deadline||'A combinar')}</p><b>Validade</b><p>${fmtDate(q.validUntil)}</p></div><div class="value">${money(q.value)}</div><p>Status registrado: ${esc(q.status)}</p><div class="footer">Garcia Digital · 17 99648-1854<br>Obrigado pela oportunidade!</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
  document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop.open').forEach(m=>closeModal(m.id));});
  ['newLeadTop','newLeadBtn','emptyNewLead','leadsEmptyBtn'].forEach(idVal=>$(idVal).addEventListener('click',()=>editLead()));
  ['newQuoteTop','newQuoteBtn','quotesEmptyBtn'].forEach(idVal=>$(idVal).addEventListener('click',()=>{if(!state.leads.length){showToast('Cadastre um lead antes de criar o orçamento.');go('leads');editLead();return;}editQuote();}));
  $('settingsBtn').addEventListener('click',()=>openModal('settingsModal'));
  $('leadForm').addEventListener('submit',e=>{e.preventDefault();const existing=$('leadId').value;const item={id:existing||id('lead'),name:$('leadName').value.trim(),company:$('leadCompany').value.trim(),phone:$('leadPhone').value.trim(),email:$('leadEmail').value.trim(),service:$('leadService').value,status:$('leadStatus').value,followDate:$('leadFollow').value,source:$('leadSource').value,notes:$('leadNotes').value.trim(),createdAt:existing?(state.leads.find(l=>l.id===existing)?.createdAt||today()):today()};if(existing)state.leads=state.leads.map(l=>l.id===existing?item:l);else state.leads.push(item);save();closeModal('leadModal');showToast(existing?'Lead atualizado.':'Lead cadastrado.');});
  $('quoteForm').addEventListener('submit',e=>{e.preventDefault();const existing=$('quoteId').value;const old=state.quotes.find(q=>q.id===existing);const item={id:existing||id('quote'),number:old?.number||'ORC-'+String(Date.now()).slice(-6),leadId:$('quoteLead').value,service:$('quoteService').value,value:Number($('quoteValue').value),status:$('quoteStatus').value,validUntil:$('quoteValid').value,deadline:$('quoteDeadline').value.trim(),description:$('quoteDescription').value.trim(),createdAt:old?.createdAt||today()};if(existing)state.quotes=state.quotes.map(q=>q.id===existing?item:q);else state.quotes.push(item);save();closeModal('quoteModal');showToast(existing?'Orçamento atualizado.':'Orçamento salvo.');});
  document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.editLead)editLead(t.dataset.editLead);if(t.dataset.newQuoteFor){if(!state.leads.some(l=>l.id===t.dataset.newQuoteFor))return;editQuote('',t.dataset.newQuoteFor);}if(t.dataset.deleteLead){const l=state.leads.find(x=>x.id===t.dataset.deleteLead);if(confirm(`Excluir o lead "${l?.name}"? Os orçamentos vinculados permanecerão registrados.`)){state.leads=state.leads.filter(x=>x.id!==t.dataset.deleteLead);save();showToast('Lead excluído.');}}if(t.dataset.editQuote)editQuote(t.dataset.editQuote);if(t.dataset.deleteQuote){if(confirm('Excluir este orçamento?')){state.quotes=state.quotes.filter(q=>q.id!==t.dataset.deleteQuote);save();showToast('Orçamento excluído.');}}if(t.dataset.printQuote)printQuote(t.dataset.printQuote);});
  ['leadSearch','statusFilter','serviceFilter'].forEach(idVal=>$(idVal).addEventListener('input',renderLeads));
  ['quoteSearch','quoteStatusFilter'].forEach(idVal=>$(idVal).addEventListener('input',renderQuotes));
  ['exportBtn','backupBtn'].forEach(idVal=>$(idVal).addEventListener('click',exportData));
  $('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.leads)||!Array.isArray(data.quotes))throw new Error('Formato');if(!confirm('Importar este backup e substituir os dados atuais deste navegador?'))return;state={leads:data.leads,quotes:data.quotes,seq:data.seq||1};save();showToast('Backup importado.');closeModal('settingsModal');}catch{showToast('Arquivo inválido. Selecione um backup Garcia Digital JSON.');}finally{e.target.value='';}});
  $('clearDataBtn').addEventListener('click',()=>{if(confirm('Tem certeza? Isso apagará todos os leads e orçamentos salvos neste navegador. Exporte um backup antes, se precisar.')){state={leads:[],quotes:[],seq:1};save();showToast('Dados locais apagados.');closeModal('settingsModal');}});
  render();
})();