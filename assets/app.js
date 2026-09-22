/* AL NOOR LOYALTY — single app controller */
(() => {
  const cfg = window.AL_NOOR_CONFIG || {};
  const SUPABASE_URL = cfg.SUPABASE_URL || "";
  const SUPABASE_KEY = cfg.SUPABASE_PUBLISHABLE_KEY || "";

  // GitHub Pages project-site base. Keep this fixed so /Loyalty-Card/ never drops from URLs.
  const BASE = "/Loyalty-Card/";
  const page = document.body?.dataset?.page || "";

  const KEYS = {
    staffCustomer: "alnoor_staff_customer",
    customerToken: "alnoor_public_token"
  };

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
  const initials = name => (name || "AN").trim().split(/\s+/).slice(0,2).map(x => x[0]).join("").toUpperCase() || "AN";
  const pointsText = n => Number(n || 0).toLocaleString();
  const go = path => { location.href = BASE + path.replace(/^\//, ""); };

  let sb = null;
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase?.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
    });
    window.sb = sb;
  }

  function toast(message, good=true) {
    let el = $("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:99;max-width:90%;padding:12px 16px;border-radius:12px;font-size:12px;font-weight:800;box-shadow:0 12px 30px #0002;text-align:center";
      document.body.appendChild(el);
    }
    el.style.background = good ? "#0b4a36" : "#b94a48";
    el.style.color = "#fff";
    el.textContent = message;
    clearTimeout(window.__alNoorToast);
    window.__alNoorToast = setTimeout(() => el.remove(), 3000);
  }

  function requireConnection() {
    if (!sb) throw new Error("Al Noor connection is not configured. Check assets/config.js.");
    return sb;
  }

  async function getSession() {
    const client = requireConnection();
    const {data,error} = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getProfile() {
    const client = requireConnection();
    const {data,error} = await client.rpc("get_my_profile");
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }

  async function guardRole(allowed) {
    const session = await getSession();
    if (!session) {
      if (allowed.includes("customer")) go("customer/customer-login.html");
      else go("admin/admin-login.html");
      return null;
    }
    const profile = await getProfile();
    if (!profile || !allowed.includes(String(profile.role || "").toLowerCase())) {
      await sb.auth.signOut();
      toast("You do not have access to this portal.", false);
      go("");
      return null;
    }
    return profile;
  }

  async function logout() {
    try { if (sb) await sb.auth.signOut(); } catch (_) {}
    localStorage.removeItem(KEYS.customerToken);
    localStorage.removeItem(KEYS.staffCustomer);
    go("");
  }
  window.logout = logout;

  function saveStaffCustomer(customer) {
    localStorage.setItem(KEYS.staffCustomer, JSON.stringify(customer));
  }
  function getStaffCustomer() {
    try { return JSON.parse(localStorage.getItem(KEYS.staffCustomer) || "null"); }
    catch (_) { return null; }
  }

  function renderProfile(profile) {
    document.querySelectorAll("[data-name]").forEach(e => e.textContent = profile?.full_name || "Customer");
    document.querySelectorAll("[data-email]").forEach(e => e.textContent = profile?.email || "—");
    document.querySelectorAll("[data-phone]").forEach(e => e.textContent = profile?.phone || "—");
    document.querySelectorAll("[data-id]").forEach(e => e.textContent = profile?.member_id || "—");
    document.querySelectorAll("[data-points]").forEach(e => e.textContent = pointsText(profile?.points));
    document.querySelectorAll("[data-role]").forEach(e => e.textContent = profile?.role || "—");
    document.querySelectorAll("[data-location]").forEach(e => e.textContent = profile?.location_name || "Al Noor – Al Bawadi");
    const avatar = $("avatar");
    if (avatar) avatar.textContent = initials(profile?.full_name);
  }

  function tokenFromUrl() {
    return new URLSearchParams(location.search).get("token");
  }

  async function lookupCustomerToken(raw) {
    let token = String(raw || "").trim();
    if (!token) throw new Error("No customer QR token was provided.");
    try {
      const u = new URL(token);
      token = u.searchParams.get("token") || token;
    } catch (_) {}
    const {data,error} = await requireConnection().rpc("get_customer_by_token", {p_token:token});
    if (error) throw error;
    const customer = Array.isArray(data) ? data[0] : data;
    if (!customer) throw new Error("Customer not found.");
    return customer;
  }

  function renderStaffCustomer(customer) {
    document.querySelectorAll("[data-name]").forEach(e => e.textContent = customer?.full_name || "Customer");
    document.querySelectorAll("[data-id]").forEach(e => e.textContent = customer?.member_id || "—");
    document.querySelectorAll("[data-points]").forEach(e => e.textContent = pointsText(customer?.points));
    const avatar = $("avatar");
    if (avatar) avatar.textContent = initials(customer?.full_name);
    const status = $("customerStatus");
    if (status) status.textContent = customer?.is_active === false ? "Inactive" : "Active";
  }

  async function loadCustomerHome() {
    const profile = await guardRole(["customer"]); if (!profile) return;
    renderProfile(profile);
  }

  async function loadCustomerCard() {
    const publicToken = tokenFromUrl();
    let profile;
    if (publicToken) {
      profile = await lookupCustomerToken(publicToken);
    } else {
      profile = await guardRole(["customer"]); if (!profile) return;
    }
    renderProfile(profile);
    const qr = $("qr");
    if (qr && window.QRCode && profile?.loyalty_token) {
      qr.innerHTML = "";
      const cardUrl = location.origin + BASE + "customer/customer-card.html?token=" + encodeURIComponent(profile.loyalty_token);
      new QRCode(qr, {text:cardUrl,width:270,height:270,colorDark:"#073d2b",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.M});
    }
    const copyBtn = $("copyToken");
    if (copyBtn && profile?.loyalty_token) {
      copyBtn.onclick = async () => {
        try { await navigator.clipboard.writeText(String(profile.loyalty_token)); toast("QR token copied."); }
        catch (_) { toast("Copy is not available on this browser.", false); }
      };
    }
  }

  async function loadCustomerProfile() {
    const profile = await guardRole(["customer"]); if (!profile) return;
    renderProfile(profile);
  }

  async function loadCustomerRewards() {
    const profile = await guardRole(["customer"]); if (!profile) return;
    const box = $("rewards"); if (!box) return;
    const {data,error} = await requireConnection().from("rewards").select("id,name,description,points_cost,is_active").eq("is_active",true).order("points_cost",{ascending:true});
    if (error) { box.innerHTML = `<div class="alert">${esc(error.message)}</div>`; return; }
    box.innerHTML = data?.length ? data.map(r => `<div class="reward"><div class="food">★</div><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.description || "Al Noor reward")} • ${pointsText(r.points_cost)} points</small></div><span class="badge">${pointsText(r.points_cost)} pts</span></div>`).join("") : `<div class="empty">No rewards are active yet.</div>`;
  }

  async function loadStaffDashboard() {
    const profile = await guardRole(["staff"]); if (!profile) return;
  }

  async function loadStaffCustomer() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    const customer = getStaffCustomer();
    if (!customer) { go("admin/staff/staff-scan.html"); return; }
    renderStaffCustomer(customer);
  }

  async function loadAddPoints() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    const customer = getStaffCustomer();
    if (!customer) { go("admin/staff/staff-scan.html"); return; }
    renderStaffCustomer(customer);
    const btn = $("addPointsBtn"); if (!btn) return;
    btn.onclick = async () => {
      const points = Number($("pts")?.value || 0);
      const note = $("note")?.value.trim() || null;
      if (!points || points <= 0) { toast("Enter valid points.", false); return; }
      btn.disabled = true; btn.textContent = "Adding…";
      try {
        const {data,error} = await requireConnection().rpc("add_customer_point", {p_customer_id:customer.id,p_points:points,p_location_id:profile.location_id || null,p_note:note});
        if (error) throw error;
        customer.points = data;
        saveStaffCustomer(customer); renderStaffCustomer(customer);
        toast(`${points} points added successfully.`);
        setTimeout(() => go("admin/staff/staff-customer.html"), 500);
      } catch(e) { toast(e.message || "Could not add points.", false); }
      finally { btn.disabled=false; btn.textContent="Add Points →"; }
    };
  }

  async function loadStaffRedeem() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    const customer = getStaffCustomer();
    if (!customer) { go("admin/staff/staff-scan.html"); return; }
    renderStaffCustomer(customer);
    const box = $("rewards"); if (!box) return;
    const {data,error} = await requireConnection().from("rewards").select("id,name,description,points_cost,is_active").eq("is_active",true).order("points_cost",{ascending:true});
    if (error) { box.innerHTML = `<div class="alert">${esc(error.message)}</div>`; return; }
    box.innerHTML = data?.length ? data.map(r => `<div class="reward"><div class="food">★</div><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.description || "Reward")} • ${pointsText(r.points_cost)} points</small></div><button class="btn primary" onclick="window.redeemReward('${r.id}',${Number(r.points_cost)})">Redeem</button></div>`).join("") : `<div class="empty">No rewards are active.</div>`;
  }

  window.redeemReward = async (rewardId,cost) => {
    const customer = getStaffCustomer(); if (!customer) return;
    if (Number(customer.points) < Number(cost)) { toast("Customer does not have enough points.", false); return; }
    try {
      const profile = await getProfile();
      const {data,error} = await requireConnection().rpc("redeem_customer_coupon", {p_customer_id:customer.id,p_reward_id:rewardId,p_location_id:profile?.location_id || null});
      if (error) throw error;
      const result = Array.isArray(data) ? data[0] : data;
      customer.points = result?.remaining_points ?? (customer.points - cost);
      saveStaffCustomer(customer);
      toast(`Reward redeemed. Coupon: ${result?.coupon_code || "created"}`);
      setTimeout(() => go("admin/staff/staff-customer.html"), 700);
    } catch(e) { toast(e.message || "Could not redeem reward.", false); }
  };

  async function loadStaffHistory() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    const customer = getStaffCustomer();
    const box = $("history"); if (!box) return;
    if (!customer) { box.innerHTML = `<div class="empty">Scan a customer first to view their history.</div>`; return; }
    const {data,error} = await requireConnection().rpc("get_customer_transactions", {p_customer_id:customer.id});
    if (error) { box.innerHTML = `<div class="alert">${esc(error.message)}</div>`; return; }
    box.innerHTML = data?.length ? `<table class="table"><thead><tr><th>Type</th><th>Points</th><th>Note</th><th>Date</th></tr></thead><tbody>${data.map(t => `<tr><td>${esc(t.type)}</td><td>${pointsText(t.points)}</td><td>${esc(t.note || "—")}</td><td>${new Date(t.created_at).toLocaleString()}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">No transactions yet.</div>`;
  }

  async function loadStaffProfile() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    renderProfile(profile);
  }

  async function startScanner() {
    const profile = await guardRole(["staff"]); if (!profile) return;
    const result = $("scanResult"), input = $("manualToken"), manualBtn = $("manualBtn");
    manualBtn.onclick = async () => {
      try { const c = await lookupCustomerToken(input.value); saveStaffCustomer(c); result.innerHTML=`<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`; setTimeout(()=>go("admin/staff/staff-customer.html"),400); }
      catch(e) { result.innerHTML=`<div class="alert">${esc(e.message)}</div>`; }
    };
    const reader = $("reader");
    if (!reader || typeof Html5Qrcode === "undefined") return;
    const scanner = new Html5Qrcode("reader");
    const onScan = async decodedText => {
      try { await scanner.stop(); } catch (_) {}
      try { const c = await lookupCustomerToken(decodedText); saveStaffCustomer(c); result.innerHTML=`<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`; setTimeout(()=>go("admin/staff/staff-customer.html"),400); }
      catch(e) { result.innerHTML=`<div class="alert">${esc(e.message)}</div>`; }
    };
    try { await scanner.start({facingMode:"environment"},{fps:10,qrbox:{width:240,height:240}},onScan,()=>{}); }
    catch (_) { result.innerHTML=`<div class="note">Camera could not start. Allow camera permission or use manual token entry below.</div>`; }
  }

  async function loadGmDashboard() {
    const profile = await guardRole(["gm"]); if (!profile) return;
    const {data,error} = await requireConnection().rpc("get_gm_report");
    if (error) { toast(error.message,false); return; }
    const r = data || {};
    const map = {total_members:"members",points_issued:"issued",points_redeemed:"redeemed",active_locations:"locations"};
    Object.entries(map).forEach(([key,id]) => { const el=$(id); if(el) el.textContent=pointsText(r[key]); });
  }

  async function loadGmMembers() {
    const profile = await guardRole(["gm"]); if (!profile) return;
    const box=$("members"), search=$("search"); if(!box||!search)return;
    async function render(){
      const q=search.value.trim();
      let query=requireConnection().from("profiles").select("id,full_name,phone,member_id,points,is_active,created_at").eq("role","customer").order("created_at",{ascending:false});
      if(q) query=query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,member_id.ilike.%${q}%`);
      const {data,error}=await query;
      if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
      box.innerHTML=data?.length?data.map(m=>`<div class="row" style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="avatar">${esc(initials(m.full_name))}</div><div class="grow"><strong>${esc(m.full_name||"Customer")}</strong><small>${esc(m.member_id||"—")} • ${esc(m.phone||"—")}</small></div><span class="badge">${pointsText(m.points)} pts</span></div>`).join(""):`<div class="empty">No members found.</div>`;
    }
    search.oninput=render; await render();
  }

  async function loadGmLocations() {
    const profile=await guardRole(["gm"]); if(!profile)return;
    const box=$("locations"); if(!box)return;
    const {data,error}=await requireConnection().from("locations").select("id,name,city,address,phone,is_active,created_at").order("name");
    if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
    box.innerHTML=data?.length?data.map(l=>`<div class="card" style="margin-bottom:12px"><div class="row"><div class="avatar">AN</div><div class="grow"><strong>${esc(l.name)}</strong><small>${esc(l.city||"")} • ${esc(l.address||"Address not set")}</small></div><span class="badge">${l.is_active?"Active":"Inactive"}</span></div>${l.phone?`<p class="sub" style="margin:12px 0 0">☎ ${esc(l.phone)}</p>`:""}</div>`).join(""):`<div class="empty">No locations found.</div>`;
  }

  async function loadGmReports() {
    const profile=await guardRole(["gm"]); if(!profile)return;
    const {data,error}=await requireConnection().rpc("get_gm_report");
    if(error){toast(error.message,false);return;}
    const r=data||{};
    const values={issued:r.points_issued,redeemed:r.points_redeemed,members:r.total_members,locations:r.active_locations};
    Object.entries(values).forEach(([id,v])=>{const el=$(id);if(el)el.textContent=pointsText(v);});
  }

  function registerServiceWorker(){
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register(BASE + "sw.js", {scope:BASE}).catch(()=>{});
    }
  }

  async function init() {
    registerServiceWorker();
    try {
      if (page === "customer-home") await loadCustomerHome();
      else if (page === "customer-card") await loadCustomerCard();
      else if (page === "customer-profile") await loadCustomerProfile();
      else if (page === "customer-rewards") await loadCustomerRewards();
      else if (page === "staff-dashboard") await loadStaffDashboard();
      else if (page === "staff-scan") await startScanner();
      else if (page === "staff-customer") await loadStaffCustomer();
      else if (page === "staff-add-points") await loadAddPoints();
      else if (page === "staff-redeem") await loadStaffRedeem();
      else if (page === "staff-history") await loadStaffHistory();
      else if (page === "staff-profile") await loadStaffProfile();
      else if (page === "gm-dashboard") await loadGmDashboard();
      else if (page === "gm-members") await loadGmMembers();
      else if (page === "gm-locations") await loadGmLocations();
      else if (page === "gm-reports") await loadGmReports();
      else if (page === "gm-settings") await guardRole(["gm"]);
    } catch (e) {
      console.error("AL NOOR:",e);
      const msg=$("msg");
      if(msg) msg.textContent=e.message||"Something went wrong.";
      else toast(e.message||"Something went wrong.",false);
    }
  }

  document.addEventListener("DOMContentLoaded",init);
})();
