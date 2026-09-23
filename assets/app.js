/* AL NOOR LOYALTY — final application logic */
const cfg = window.AL_NOOR_CONFIG || {};
const SUPABASE_URL = cfg.SUPABASE_URL || "";
const SUPABASE_KEY = cfg.SUPABASE_PUBLISHABLE_KEY || "";
const isConfigured = !!SUPABASE_URL && !!SUPABASE_KEY && !SUPABASE_KEY.includes("PASTE_NEW_");
const sb = isConfigured ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
}) : null;
window.sb = sb;
const KEYS={staffCustomer:"alnoor_staff_customer"};
const $=id=>document.getElementById(id);
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function initials(name){return (name||"AN").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"AN";}
function moneyPoints(n){return Number(n||0).toLocaleString();}
function toast(message,good=true){let el=$("toast");if(!el){el=document.createElement("div");el.id="toast";document.body.appendChild(el);}el.className=good?"toast toast-ok":"toast toast-bad";el.textContent=message;clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.remove(),3200);}
function setupError(){return new Error("Supabase is not configured. Open assets/config.js and make sure the NEW publishable key is present.");}
function cleanError(e){return e?.message||e?.error_description||e?.details||e?.hint||"Something went wrong.";}
async function getSession(){if(!sb)throw setupError();const {data,error}=await sb.auth.getSession();if(error)throw error;return data.session;}
async function getProfile(){
  if(!sb)throw setupError();
  const session=await getSession();
  if(!session?.user?.id)throw new Error("Your Al Noor session is missing. Please sign in again.");
  let rpcError=null;
  try{
    const {data,error}=await sb.rpc("get_my_profile");
    if(!error){
      const p=Array.isArray(data)?data[0]:data;
      if(p)return p;
    }
    rpcError=error;
  }catch(e){rpcError=e;}
  const {data:profile,error:profileError}=await sb.from("profiles").select("id,full_name,phone,email,role,member_id,loyalty_token,points,is_active,birthday,birthday_contact").eq("id",session.user.id).maybeSingle();
  if(profileError)throw new Error((profileError.message||rpcError?.message||"Could not load your Al Noor profile.")+" [profile lookup]");
  if(profile)return profile;
  throw new Error(rpcError?.message||"Al Noor profile was not found for this account.");
}
async function guardRole(roles){const session=await getSession();if(!session){const target=roles.includes("customer")?"/Loyalty-Card/customer/customer-login.html":"/Loyalty-Card/admin/admin-login.html";location.href=target;return null;}const p=await getProfile();if(!p||!roles.includes(String(p.role||"").toLowerCase())){await sb.auth.signOut();location.href=roles.includes("customer")?"/Loyalty-Card/customer/customer-login.html":"/Loyalty-Card/admin/admin-login.html";return null;}return p;}
function roleRoute(role){return role==="gm"?"../admin/gm/gm-dashboard.html":role==="staff"?"../admin/staff/staff-dashboard.html":"customer-home.html";}
function customerRoleRoute(){return "customer-home.html";}

async function sendCustomerMagicLink(){
  const email=$("email")?.value.trim().toLowerCase(), msg=$("msg");
  if(!email){msg.textContent="Enter your email address.";return;}
  if(!sb){msg.textContent=setupError().message;return;}
  msg.textContent="Sending your secure sign-in link…";
  const redirectTo=new URL("customer-login.html",location.href).href;
  const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:redirectTo}});
  if(error){msg.textContent=error.message;return;}
  msg.textContent="Check your email. The secure Al Noor sign-in link has been sent.";
}
async function registerCustomer(){
  const name=$("name")?.value.trim(),phone=$("phone")?.value.trim(),email=$("email")?.value.trim().toLowerCase(),dob=$("dob")?.value||null,consent=$("birthdayConsent")?.checked||false,msg=$("msg");
  if(!name||!phone||!email||!dob){msg.textContent="Please complete your name, mobile number, email and date of birth.";return;}
  if(!sb){msg.textContent=setupError().message;return;}
  msg.textContent="Creating your Al Noor Loyalty account…";
  const redirectTo=new URL("customer-login.html",location.href).href;
  const {data,error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:redirectTo,data:{full_name:name,phone,mobile_number:phone,birthday:dob,birthday_contact:consent}}});
  if(error){msg.textContent=error.message;return;}
  msg.textContent="Your registration is ready. Check your email to open your Al Noor Loyalty account.";
  $("registerBtn").disabled=true;
}
async function finishCustomerSession(){
  const session=await getSession();if(!session)return false;
  const p=await getProfile();if(!p)throw new Error("Customer profile is not ready yet. Please wait a moment and open the email link again.");
  if(p.role!=="customer"){await sb.auth.signOut();throw new Error("This account is not a customer account.");}
  location.href=customerRoleRoute();return true;
}
async function loginStaffGm(){
  const email=$("email")?.value.trim().toLowerCase(),password=$("password")?.value,msg=$("msg");
  if(!email||!password){msg.textContent="Enter your email and password.";return;}
  if(!sb){msg.textContent=setupError().message;return;}
  msg.textContent="Signing in…";
  const {error}=await sb.auth.signInWithPassword({email,password});
  if(error){msg.textContent=error.message;return;}
  try{const p=await getProfile();if(!p||!['staff','gm'].includes(String(p.role||'').toLowerCase()))throw new Error("This account is not authorized for Staff / GM access.");location.href=p.role==='gm'?"gm/gm-dashboard.html":"staff/staff-dashboard.html";}catch(e){await sb.auth.signOut();msg.textContent=e.message;}
}
async function logout(){if(sb)await sb.auth.signOut();localStorage.removeItem(KEYS.staffCustomer);location.href="/Loyalty-Card/index.html";}
async function loadCustomerHome(){const p=await guardRole(["customer"]);if(!p)return;document.querySelectorAll('[data-name]').forEach(e=>e.textContent=p.full_name||'Customer');document.querySelectorAll('[data-points]').forEach(e=>e.textContent=moneyPoints(p.points));document.querySelectorAll('[data-id]').forEach(e=>e.textContent=p.member_id||'—');}
async function loadCustomerCard(){const p=await guardRole(["customer"]);if(!p)return;document.querySelectorAll('[data-name]').forEach(e=>e.textContent=p.full_name||'Customer');document.querySelectorAll('[data-id]').forEach(e=>e.textContent=p.member_id||'—');document.querySelectorAll('[data-points]').forEach(e=>e.textContent=moneyPoints(p.points));const qr=$("qr");if(qr&&typeof QRCode!=="undefined"){qr.innerHTML="";new QRCode(qr,{text:String(p.loyalty_token),width:270,height:270,colorDark:'#073d2b',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});}}
async function loadCustomerProfile(){const p=await guardRole(["customer"]);if(!p)return;document.querySelectorAll('[data-name]').forEach(e=>e.textContent=p.full_name||'Customer');document.querySelectorAll('[data-email]').forEach(e=>e.textContent=p.email||'—');document.querySelectorAll('[data-phone]').forEach(e=>e.textContent=p.phone||'—');document.querySelectorAll('[data-id]').forEach(e=>e.textContent=p.member_id||'—');document.querySelectorAll('[data-points]').forEach(e=>e.textContent=moneyPoints(p.points));}
async function loadCustomerRewards(){const p=await guardRole(["customer"]);if(!p)return;const list=$("rewardHistory");if(!list)return;const {data,error}=await sb.rpc('get_customer_coupons',{p_token:p.loyalty_token});if(error){list.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}const coupons=Array.isArray(data)?data:[];const available=coupons.filter(c=>String(c.status||'').toUpperCase()==='AVAILABLE');const obtained=coupons.filter(c=>['REDEEMED','USED','OBTAINED'].includes(String(c.status||'').toUpperCase()));const total=coupons.length;const a=$("rewardAvailable"),o=$("rewardObtained"),t=$("rewardTotal");if(a)a.textContent=available.length;if(o)o.textContent=obtained.length;if(t)t.textContent=total;if(!coupons.length){list.innerHTML='<div class="empty">No rewards yet. Earn 10 visits to unlock your first reward.</div>';return;}const sorted=[...coupons].sort((x,y)=>new Date(y.created_at||y.issued_at||0)-new Date(x.created_at||x.issued_at||0));list.innerHTML=sorted.map(c=>{const status=String(c.status||'AVAILABLE').toUpperCase();const label=status==='AVAILABLE'?'AVAILABLE':status==='REDEEMED'||status==='USED'?'OBTAINED':status;const code=esc(c.coupon_code||c.coupon_number||'Reward');const date=c.created_at||c.issued_at;return `<div class="reward"><div class="food">☕</div><div class="grow"><strong>Free Drink</strong><small>${code}${date?` • ${new Date(date).toLocaleDateString()}`:''}</small></div><span class="badge">${label}</span></div>`;}).join('');}
function saveStaffCustomer(c){localStorage.setItem(KEYS.staffCustomer,JSON.stringify(c));}
function getStaffCustomer(){try{return JSON.parse(localStorage.getItem(KEYS.staffCustomer)||'null')}catch{return null}}
async function lookupCustomerToken(token){token=String(token||'').trim();if(!token)throw new Error('No customer QR token was provided.');try{const u=new URL(token);token=u.searchParams.get('token')||token;}catch{}const {data,error}=await sb.rpc('get_customer_by_token',{p_token:token});if(error)throw error;const c=Array.isArray(data)?data[0]:data;if(!c)throw new Error('Customer not found.');saveStaffCustomer(c);return c;}
function renderStaffCustomer(c){if(!c)return;document.querySelectorAll('[data-name]').forEach(e=>e.textContent=c.full_name||'Customer');document.querySelectorAll('[data-id]').forEach(e=>e.textContent=c.member_id||c.customer_code||'—');document.querySelectorAll('[data-points]').forEach(e=>e.textContent=moneyPoints(c.points));const a=$("avatar");if(a)a.textContent=initials(c.full_name);const s=$("customerStatus");if(s)s.textContent=c.is_active?'Active':'Inactive';}
async function loadStaffCustomer(){const p=await guardRole(['staff','gm']);if(!p)return;const c=getStaffCustomer();if(!c){location.href='staff-scan.html';return;}renderStaffCustomer(c);}
async function loadAddPoints(){await loadStaffCustomer();const btn=$("addPointsBtn");if(!btn)return;btn.onclick=async()=>{const c=getStaffCustomer();if(!c){toast('Customer not found.',false);return;}btn.disabled=true;btn.textContent='Adding 1 visit…';try{const staff=await getProfile();const {data,error}=await sb.rpc('add_customer_point',{p_customer_id:c.id,p_points:1,p_location_id:staff?.location_id||null,p_note:'Visit'});if(error)throw error;const updated=Array.isArray(data)?data[0]:data;if(updated&&typeof updated==='object'){Object.assign(c,updated);}else if(typeof updated==='number'){c.points=updated;}c.points=Number(c.points||0);saveStaffCustomer(c);const earned=c.points>0&&c.points%10===0;toast(earned?'1 visit added — reward unlocked!':'1 visit added successfully.');setTimeout(()=>location.href='staff-customer.html',650);}catch(e){toast(e.message||'Could not add visit.',false);}finally{btn.disabled=false;btn.textContent='ADD 1 VISIT';}};}
async function loadStaffRedeem(){const p=await guardRole(['staff','gm']);if(!p)return;const c=getStaffCustomer();if(!c){location.href='staff-scan.html';return;}renderStaffCustomer(c);const box=$("rewards");if(!box)return;const {data,error}=await sb.from('rewards').select('id,name,description,points_cost,is_active').eq('is_active',true).eq('points_cost',10).order('name');if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}const rewards=Array.isArray(data)?data:[];box.innerHTML=rewards.length?rewards.map(r=>{const canRedeem=Number(c.points||0)>=10;return `<div class="reward"><div class="food">☕</div><div class="grow"><strong>${esc(r.name||'Free Drink')}</strong><small>${esc(r.description||'Every 10 visits')} • 10 points</small></div><button class="btn primary" ${canRedeem?'':'disabled'} onclick="redeemReward('${esc(r.id)}',10)">${canRedeem?'Redeem':'10 points needed'}</button></div>`;}).join(''):'<div class="empty">Free Drink reward is not configured yet.</div>';}
async function redeemReward(rewardId,cost){const c=getStaffCustomer();if(!c||!rewardId)return;if(Number(c.points||0)<Number(cost)){toast('Customer needs 10 points for a Free Drink.',false);return;}try{const staff=await getProfile();const {data,error}=await sb.rpc('redeem_customer_coupon',{p_customer_id:c.id,p_reward_id:rewardId,p_location_id:staff?.location_id||null});if(error)throw error;const r=Array.isArray(data)?data[0]:data;if(r&&typeof r==='object')Object.assign(c,r);if(r?.remaining_points!=null)c.points=Number(r.remaining_points);else c.points=Math.max(0,Number(c.points||0)-Number(cost));saveStaffCustomer(c);toast(`Free Drink reward redeemed${r?.coupon_code?` • ${r.coupon_code}`:''}.`);setTimeout(()=>location.href='staff-customer.html',700);}catch(e){toast(e.message||'Could not redeem reward.',false);}}
async function loadStaffHistory(){const p=await guardRole(['staff','gm']);if(!p)return;const c=getStaffCustomer(),box=$("history");if(!c){box.innerHTML='<div class="empty">Scan a customer first to view their history.</div>';return;}const {data,error}=await sb.rpc('get_customer_transactions',{p_customer_id:c.id});if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}box.innerHTML=data?.length?`<table class="table"><thead><tr><th>Type</th><th>Points</th><th>Note</th><th>Date</th></tr></thead><tbody>${data.map(t=>`<tr><td>${esc(t.type)}</td><td>${moneyPoints(t.points)}</td><td>${esc(t.note||'—')}</td><td>${new Date(t.created_at).toLocaleString()}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">No transactions yet.</div>';}
async function loadStaffProfile(){const p=await guardRole(['staff','gm']);if(!p)return;document.querySelectorAll('[data-name]').forEach(e=>e.textContent=p.full_name||'Staff');document.querySelectorAll('[data-email]').forEach(e=>e.textContent=p.email||'—');document.querySelectorAll('[data-role]').forEach(e=>e.textContent=p.role||'—');document.querySelectorAll('[data-location]').forEach(e=>e.textContent=p.location_name||'Not assigned');}
async function startScanner(){const p=await guardRole(['staff','gm']);if(!p)return;const result=$("scanResult"),input=$("manualToken"),manual=$("manualBtn");manual.onclick=async()=>{try{const c=await lookupCustomerToken(input.value);result.innerHTML=`<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`;setTimeout(()=>location.href='staff-customer.html',400);}catch(e){result.innerHTML=`<div class="alert">${esc(e.message)}</div>`;}};if(typeof Html5Qrcode==='undefined')return;const reader=$("reader");if(!reader)return;const scanner=new Html5Qrcode('reader');const onScan=async text=>{try{await scanner.stop()}catch{}try{const c=await lookupCustomerToken(text);result.innerHTML=`<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`;setTimeout(()=>location.href='staff-customer.html',400);}catch(e){result.innerHTML=`<div class="alert">${esc(e.message)}</div>`;}};try{await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:240,height:240}},onScan,()=>{});}catch(e){result.innerHTML='<div class="note">Camera could not start. Allow camera access or use the manual token field.</div>';}}
async function loadGmDashboard(){const p=await guardRole(['gm']);if(!p)return;const {data,error}=await sb.rpc('get_gm_report');if(error){toast(error.message,false);return;}const r=Array.isArray(data)?data[0]:data||{};const map={total_members:'members',total_points:'points',points_issued:'issued',points_redeemed:'redeemed',active_locations:'locations'};Object.entries(map).forEach(([k,id])=>{if($(id))$(id).textContent=moneyPoints(r[k]);});}
async function loadGmMembers(){const p=await guardRole(['gm']);if(!p)return;const box=$("members"),search=$("search");async function render(){let q=search.value.trim(),query=sb.from('profiles').select('id,full_name,phone,member_id,points,is_active,created_at').eq('role','customer').order('created_at',{ascending:false});if(q)query=query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,member_id.ilike.%${q}%`);const {data,error}=await query;if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}box.innerHTML=data?.length?data.map(m=>`<div class="row listrow"><div class="avatar">${esc(initials(m.full_name))}</div><div class="grow"><strong>${esc(m.full_name||'Customer')}</strong><small>${esc(m.member_id||'—')} • ${esc(m.phone||'—')}</small></div><span class="badge">${moneyPoints(m.points)} pts</span></div>`).join(''):'<div class="empty">No members found.</div>';};search.oninput=render;await render();}
async function loadGmLocations(){const p=await guardRole(['gm']);if(!p)return;const box=$("locations"),{data,error}=await sb.from('locations').select('id,name,city,address,phone,is_active,created_at').order('name');if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}box.innerHTML=data?.length?data.map(l=>`<div class="card" style="margin-bottom:12px"><div class="row"><div class="avatar">AN</div><div class="grow"><strong>${esc(l.name)}</strong><small>${esc(l.city||'')} • ${esc(l.address||'Address not set')}</small></div><span class="badge">${l.is_active?'Active':'Inactive'}</span></div>${l.phone?`<p class="sub" style="margin:12px 0 0">☎ ${esc(l.phone)}</p>`:''}</div>`).join(''):'<div class="empty">No locations found.</div>';}
async function loadGmReports(){const p=await guardRole(['gm']);if(!p)return;const {data,error}=await sb.rpc('get_gm_report');if(error){toast(error.message,false);return;}const r=Array.isArray(data)?data[0]:data||{};const map={points_issued:'issued',points_redeemed:'redeemed',total_members:'members',active_locations:'locations'};Object.entries(map).forEach(([k,id])=>{if($(id))$(id).textContent=moneyPoints(r[k]);});}
async function init(){const page=document.body.dataset.page;try{if(page==='customer-login'){const session=await getSession();if(session){await finishCustomerSession();return;}$("loginBtn").onclick=sendCustomerMagicLink;}else if(page==='customer-register'){$("registerBtn").onclick=registerCustomer;}else if(page==='customer-home'){await loadCustomerHome();}else if(page==='customer-card'){await loadCustomerCard();}else if(page==='customer-profile'){await loadCustomerProfile();}else if(page==='customer-rewards'){await loadCustomerRewards();}else if(page==='admin-login'){$("loginBtn").onclick=loginStaffGm;}else if(page==='staff-dashboard'){await guardRole(['staff']);}else if(page==='staff-scan'){await startScanner();}else if(page==='staff-customer'){await loadStaffCustomer();}else if(page==='staff-add-points'){await loadAddPoints();}else if(page==='staff-redeem'){await loadStaffRedeem();}else if(page==='staff-history'){await loadStaffHistory();}else if(page==='staff-profile'){await loadStaffProfile();}else if(page==='gm-dashboard'){await loadGmDashboard();}else if(page==='gm-members'){await loadGmMembers();}else if(page==='gm-locations'){await loadGmLocations();}else if(page==='gm-reports'){await loadGmReports();}else if(page==='gm-settings'){await guardRole(['gm']);}}catch(e){console.error(e);const message=cleanError(e);const msg=$("msg");if(msg)msg.textContent=message;else toast(message,false);}}
document.addEventListener('DOMContentLoaded',init);
