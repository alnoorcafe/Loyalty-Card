
const AL_NOOR_RUNTIME_CONFIG = window.AL_NOOR_CONFIG || {};
const SUPABASE_URL = AL_NOOR_RUNTIME_CONFIG.SUPABASE_URL || "https://hlzmnbmngsbvnlnaaoau.supabase.co";
const SUPABASE_KEY = AL_NOOR_RUNTIME_CONFIG.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_U6m9qKom9eie1n9Q1SSQRA_A3k3vImH";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.sb = sb;

const KEYS = {
  staffCustomer: "alnoor_staff_customer",
  customerToken: "alnoor_public_token"
};

const $ = (id) => document.getElementById(id);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function initials(name) {
  return (name || "AN").trim().split(/\s+/).slice(0,2)
    .map(x => x[0]).join("").toUpperCase() || "AN";
}

function moneyPoints(n) {
  return Number(n || 0).toLocaleString();
}

async function getOwnAvatarUrl() {
  try {
    const { data: userData } = await sb.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return null;
    const { data, error } = await sb.from("profiles").select("avatar_url").eq("id", uid).maybeSingle();
    if (error) return null;
    return data?.avatar_url || null;
  } catch { return null; }
}

function renderAvatar(el, name, url) {
  if (!el) return;
  if (url) {
    el.innerHTML = `<img src="${esc(url)}" alt="Profile photo" loading="eager">`;
    el.classList.add("avatar-photo");
  } else {
    el.textContent = initials(name);
  }
}

function bindCustomerNav(page) {
  const map = {
    "customer-home":"home", "customer-card":"card", "customer-rewards":"rewards",
    "customer-offers":"offers", "customer-menu":"menu", "customer-locations":"locations"
  };
  document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === map[page]));
}

async function saveCustomerPhoto(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be 5 MB or smaller.");
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader(); fr.onload=()=>resolve(fr.result); fr.onerror=()=>reject(new Error("Could not read the photo.")); fr.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => { const i=new Image(); i.onload=()=>resolve(i); i.onerror=()=>reject(new Error("Invalid image.")); i.src=dataUrl; });
  const max=512, scale=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale));
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  const compressed=c.toDataURL("image/jpeg",0.78);
  const { data:userData } = await sb.auth.getUser();
  const uid=userData?.user?.id; if(!uid) throw new Error("Please sign in again.");
  const { error } = await sb.from("profiles").update({avatar_url:compressed}).eq("id",uid);
  if(error) throw error;
  return compressed;
}

function toast(message, good = true) {
  let el = $("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText =
      "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);" +
      "z-index:99;max-width:90%;padding:12px 16px;border-radius:12px;" +
      "font-size:12px;font-weight:800;box-shadow:0 12px 30px #0002;" +
      "text-align:center;";
    document.body.appendChild(el);
  }
  el.style.background = good ? "#0b4a36" : "#b94a48";
  el.style.color = "#fff";
  el.textContent = message;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.remove(), 3000);
}

async function getSession() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function getProfile() {
  const { data, error } = await sb.rpc("get_my_profile");
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function getStaffProfile() {
  const { data, error } = await sb.rpc("get_my_staff_profile");
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

async function guardRole(allowedRoles) {
  const session = await getSession();
  if (!session) {
    const role = allowedRoles[0];
    location.href = role === "customer" ? "customer-login.html" : role === "gm" ? "gm-login.html" : role === "admin" ? "admin-login.html" : "staff-login.html";
    return null;
  }

  const profile = await getProfile();
  if (!profile || !allowedRoles.includes(profile.role)) {
    toast("You do not have access to this portal.", false);
    await sb.auth.signOut();
    location.href = "../index.html";
    return null;
  }
  return profile;
}

function routeForRole(role) {
  if (role === "admin") return "admin-dashboard.html";
  if (role === "gm") return "gm-dashboard.html";
  if (role === "staff") return "staff-scan.html";
  return "customer-home.html";
}

async function login(role) {
  const email = $("email")?.value.trim().toLowerCase();
  const password = $("password")?.value;
  const msg = $("msg");

  if (!email || !password) {
    if (msg) msg.textContent = "Enter your email and password.";
    return;
  }

  if (msg) msg.textContent = "Signing in…";

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    if (msg) msg.textContent = error.message;
    else toast(error.message, false);
    return;
  }

  try {
    const profile = await getProfile();

    if (!profile) throw new Error("Your profile is not ready yet. Please try again.");

    if (profile.role !== role) {
      await sb.auth.signOut();
      throw new Error(`This account is not registered as ${role}.`);
    }

    location.href = routeForRole(profile.role);
  } catch (e) {
    if (msg) msg.textContent = e.message || "Login failed.";
  }
}

async function registerCustomer() {
  const name = $("name")?.value.trim();
  const phone = $("phone")?.value.trim();
  const email = $("email")?.value.trim().toLowerCase();
  const password = $("password")?.value;
  const confirm = $("confirm")?.value;
  const birthday = $("birthday")?.value;
  const msg = $("msg");

  if (!name || !phone || !email || !birthday || !password) {
    msg.textContent = "Please complete all required fields.";
    return;
  }

  if (password.length < 6) {
    msg.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirm) {
    msg.textContent = "Passwords do not match.";
    return;
  }

  msg.textContent = "Creating your Al Noor account…";

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone,
        birthday: birthday,
        birthday_contact: false
      }
    }
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  if (!data.session) {
    msg.textContent = "Account created. Email confirmation is enabled in the current Supabase project; confirm the email, then sign in.";
    return;
  }

  msg.textContent = "Account created. Opening your loyalty card…";
  setTimeout(() => location.href = "customer-home.html", 500);
}

async function logout() {
  await sb.auth.signOut();
  localStorage.removeItem(KEYS.customerToken);
  localStorage.removeItem(KEYS.staffCustomer);
  location.href = "../index.html";
}

async function loadCustomerHome() {
  const profile = await guardRole(["customer"]);
  if (!profile) return;

  document.querySelectorAll("[data-name]").forEach(e => e.textContent = profile.full_name || "Customer");
  document.querySelectorAll("[data-points]").forEach(e => e.textContent = moneyPoints(profile.points));
  document.querySelectorAll("[data-id]").forEach(e => e.textContent = profile.member_id || "—");

  const avatar = $("avatar");
  const homeAvatar = $("homeAvatar");
  const avatarUrl = await getOwnAvatarUrl();
  renderAvatar(avatar, profile.full_name, avatarUrl);
  renderAvatar(homeAvatar, profile.full_name, avatarUrl);
}

async function loadCustomerCard() {
  const profile = await guardRole(["customer"]);
  if (!profile) return;

  document.querySelectorAll("[data-name]").forEach(e => e.textContent = profile.full_name || "Customer");
  document.querySelectorAll("[data-id]").forEach(e => e.textContent = profile.member_id || "—");
  document.querySelectorAll("[data-points]").forEach(e => e.textContent = moneyPoints(profile.points));

  const qr = $("qr");
  if (qr && typeof QRCode !== "undefined") {
    qr.innerHTML = "";
    new QRCode(qr, {
      text: String(profile.loyalty_token),
      width: 270,
      height: 270,
      colorDark: "#073d2b",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  const copyBtn = $("copyToken");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      await navigator.clipboard?.writeText(String(profile.loyalty_token));
      toast("Customer QR token copied.");
    };
  }
}

async function loadCustomerProfile() {
  const profile = await guardRole(["customer"]);
  if (!profile) return;

  const { data: userData } = await sb.auth.getUser();
  const meta = userData?.user?.user_metadata || {};
  const birthday = profile.birthday || meta.birthday || "—";
  document.querySelectorAll("[data-name]").forEach(e => e.textContent = profile.full_name || meta.full_name || "Customer");
  document.querySelectorAll("[data-email]").forEach(e => e.textContent = profile.email || userData?.user?.email || "—");
  document.querySelectorAll("[data-phone]").forEach(e => e.textContent = profile.phone || meta.phone || "—");
  document.querySelectorAll("[data-birthday]").forEach(e => e.textContent = birthday === "—" ? "—" : new Date(birthday + "T00:00:00").toLocaleDateString());
  document.querySelectorAll("[data-id]").forEach(e => e.textContent = profile.member_id || "—");
  document.querySelectorAll("[data-points]").forEach(e => e.textContent = moneyPoints(profile.points));

  const avatar = $("avatar");
  const avatarUrl = await getOwnAvatarUrl();
  renderAvatar(avatar, profile.full_name, avatarUrl);
  const avatarBtn=$("avatarBtn"), avatarInput=$("avatarInput");
  if (avatarBtn && avatarInput) {
    avatarBtn.onclick=()=>avatarInput.click();
    avatarInput.onchange=async()=>{
      const file=avatarInput.files?.[0]; if(!file)return;
      avatarBtn.disabled=true; avatarBtn.textContent="UPLOADING…";
      try { const url=await saveCustomerPhoto(file); renderAvatar(avatar, profile.full_name, url); toast("Profile photo updated."); }
      catch(e){ toast(e?.message||"Could not update photo.",false); }
      finally { avatarBtn.disabled=false; avatarBtn.textContent="ADD / CHANGE MY PHOTO"; avatarInput.value=""; }
    };
  }

  const btn = $("changePasswordBtn");
  if (btn) btn.onclick = async () => {
    const next = $("newPassword")?.value || "";
    const confirm = $("confirmNewPassword")?.value || "";
    const msg = $("passwordMsg");
    if (next.length < 6) { msg.textContent = "Password must be at least 6 characters."; return; }
    if (next !== confirm) { msg.textContent = "Passwords do not match."; return; }
    btn.disabled = true; btn.textContent = "Updating…"; msg.textContent = "";
    const { error } = await sb.auth.updateUser({ password: next });
    if (error) { msg.textContent = error.message; btn.disabled = false; btn.textContent = "CHANGE PASSWORD"; return; }
    msg.textContent = "Password changed successfully.";
    $("newPassword").value = ""; $("confirmNewPassword").value = "";
    btn.disabled = false; btn.textContent = "CHANGE PASSWORD";
  };
}

async function loadCustomerLocations() {
  const profile = await guardRole(["customer"]);
  if (!profile) return;
  const box=$("customerLocations"); if(!box)return;
  const {data,error}=await sb.from("locations").select("id,name,city,address,phone,is_active").eq("is_active",true).order("name");
  if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
  box.innerHTML=data?.length ? data.map(l=>`<div class="card"><strong>${esc(l.name)}</strong><small>${esc(l.city||"")}
${esc(l.address||"")}</small></div>`).join("") : `<div class="empty">No active locations found.</div>`;
}

async function loadCustomerRewards() {
  const profile = await guardRole(["customer"]);
  if (!profile) return;

  const box = $("rewards");
  if (!box) return;

  const { data, error } = await sb
    .from("rewards")
    .select("id,name,description,points_cost,is_active,image_url")
    .eq("is_active", true)
    .eq("points_cost", 10)
    .order("points_cost", { ascending: true });

  if (error) {
    box.innerHTML = `<div class="alert">${esc(error.message)}</div>`;
    return;
  }

  box.innerHTML = data?.length ? data.map(r => `
    <div class="reward">
      <img class="reward-product-image" src="${esc(r.image_url || "../assets/free-drink.svg")}" alt="${esc(r.name)}">
      <div class="grow">
        <strong>${esc(r.name)}</strong>
        <small>${esc(r.description || "Free Drink • 10 visits")}</small>
      </div>
      <span class="badge">10 visits</span>
    </div>
  `).join("") : `<div class="empty">No rewards are active yet.</div>`;
}

function saveStaffCustomer(customer) {
  localStorage.setItem(KEYS.staffCustomer, JSON.stringify(customer));
}

function getStaffCustomer() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.staffCustomer) || "null");
  } catch {
    return null;
  }
}

async function lookupCustomerToken(token) {
  token = String(token || "").trim();

  if (!token) throw new Error("No QR token was provided.");

  // QR may contain a full URL.
  try {
    const u = new URL(token);
    const fromUrl = u.searchParams.get("token");
    if (fromUrl) token = fromUrl;
  } catch {}

  const { data, error } = await sb.rpc("get_customer_by_token", {
    p_token: token
  });

  if (error) throw error;

  const customer = Array.isArray(data) ? data[0] : data;

  if (!customer) throw new Error("Customer not found.");

  saveStaffCustomer(customer);
  return customer;
}

function renderStaffCustomer(customer) {
  if (!customer) return;

  document.querySelectorAll("[data-name]").forEach(e => e.textContent = customer.full_name || "Customer");
  document.querySelectorAll("[data-id]").forEach(e => e.textContent = customer.member_id || "—");
  document.querySelectorAll("[data-points]").forEach(e => e.textContent = moneyPoints(customer.points));

  const avatar = $("avatar");
  if (avatar) avatar.textContent = initials(customer.full_name);

  const status = $("customerStatus");
  if (status) status.textContent = customer.is_active ? "Active" : "Inactive";
}

async function loadStaffCustomer() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const customer = getStaffCustomer();
  if (!customer) {
    location.href = "staff-scan.html";
    return;
  }

  renderStaffCustomer(customer);
}

async function loadAddPoints() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const customer = getStaffCustomer();
  if (!customer) {
    location.href = "staff-scan.html";
    return;
  }

  renderStaffCustomer(customer);

  const btn = $("addPointsBtn");
  if (!btn) return;

  btn.onclick = async () => {
    const points = 1;
    const note = null;

    btn.disabled = true;
    btn.textContent = "Adding…";

    try {
      const staff = await getStaffProfile();
      const { data, error } = await sb.rpc("add_customer_point", {
        p_customer_id: customer.id,
        p_points: points,
        p_location_id: staff?.location_id || null,
        p_note: note
      });

      if (error) throw error;

      customer.points = data;
      saveStaffCustomer(customer);
      renderStaffCustomer(customer);
      toast("1 visit point added successfully.");
      setTimeout(() => location.href = "staff-customer.html", 500);
    } catch (e) {
      toast(e.message || "Could not add points.", false);
    } finally {
      btn.disabled = false;
      btn.textContent = "Add Points →";
    }
  };
}

async function loadStaffRedeem() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const customer = getStaffCustomer();
  if (!customer) {
    location.href = "staff-scan.html";
    return;
  }

  renderStaffCustomer(customer);

  const box = $("rewards");
  const { data, error } = await sb
    .from("rewards")
    .select("id,name,description,points_cost,is_active,image_url")
    .eq("is_active", true)
    .eq("points_cost", 10)
    .order("points_cost", { ascending: true });

  if (error) {
    box.innerHTML = `<div class="alert">${esc(error.message)}</div>`;
    return;
  }

  box.innerHTML = data?.length ? data.map(r => `
    <div class="reward">
      ${r.image_url ? `<img class="reward-product-image" src="${esc(r.image_url)}" alt="${esc(r.name)}">` : `<div class="food">★</div>`}
      <div class="grow">
        <strong>${esc(r.name)}</strong>
        <small>Free Drink • 10 visits</small>
      </div>
      <button class="btn primary" onclick="redeemReward('${r.id}',10)">Redeem</button>
    </div>
  `).join("") : `<div class="empty">No rewards are active.</div>`;
}

async function redeemReward(rewardId, cost) {
  const customer = getStaffCustomer();
  if (!customer) return;

  if (Number(customer.points) < Number(cost)) {
    toast("Customer does not have enough points.", false);
    return;
  }

  try {
    const staff = await getStaffProfile();

    const { data, error } = await sb.rpc("redeem_customer_coupon", {
      p_customer_id: customer.id,
      p_reward_id: rewardId,
      p_location_id: staff?.location_id || null
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    customer.points = result?.remaining_points ?? (customer.points - cost);
    saveStaffCustomer(customer);

    toast(`Reward redeemed. Coupon: ${result?.coupon_code || "created"}`);
    setTimeout(() => location.href = "staff-customer.html", 700);
  } catch (e) {
    toast(e.message || "Could not redeem reward.", false);
  }
}

async function loadStaffHistory() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const customer = getStaffCustomer();
  const box = $("history");
  if (!box) return;

  if (!customer) {
    box.innerHTML = `<div class="empty">Scan a customer first to view their history.</div>`;
    return;
  }

  const staffProfile = await getStaffProfile();
  const currentStaffName = staffProfile?.full_name || "Staff";

  const { data, error } = await sb.rpc("get_customer_transactions", {
    p_customer_id: customer.id
  });

  if (error) {
    box.innerHTML = `<div class="alert">${esc(error.message)}</div>`;
    return;
  }

  if (!data?.length) {
    box.innerHTML = `<div class="empty">No transactions yet.</div>`;
    return;
  }

  // Some older transaction RPC versions return a staff/user id but not the
  // staff display name. Resolve those ids from profiles so the history always
  // shows the actual staff member when the RPC provides the id.
  const staffIds = [...new Set(data
    .map(t => t.staff_id || t.staff_user_id || t.created_by || t.user_id)
    .filter(Boolean))];

  let staffMap = {};
  if (staffIds.length) {
    const { data: staffRows } = await sb
      .from("profiles")
      .select("id,full_name,email")
      .in("id", staffIds);
    (staffRows || []).forEach(s => { staffMap[s.id] = s.full_name || s.email || "Staff"; });
  }

  box.innerHTML = `
    <table class="table">
      <thead><tr><th>Type</th><th>Points</th><th>Staff Member</th><th>Date</th></tr></thead>
      <tbody>
      ${data.map(t => {
        const staffId = t.staff_id || t.staff_user_id || t.created_by || t.user_id;
        const staffName = t.staff_member_name || t.staff_name || t.staff_member ||
          t.staff_email || (staffId ? staffMap[staffId] : "") || currentStaffName;
        return `
        <tr>
          <td>${esc(t.type)}</td>
          <td>${moneyPoints(t.points)}</td>
          <td>${esc(staffName)}</td>
          <td>${new Date(t.created_at).toLocaleString()}</td>
        </tr>`;
      }).join("")}
      </tbody>
    </table>`;
}

async function loadStaffProfile() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const staff = await getStaffProfile();

  document.querySelectorAll("[data-name]").forEach(e => e.textContent = staff?.full_name || "Staff");
  document.querySelectorAll("[data-email]").forEach(e => e.textContent = staff?.email || "—");
  document.querySelectorAll("[data-role]").forEach(e => e.textContent = staff?.role || "—");
  document.querySelectorAll("[data-location]").forEach(e => e.textContent = staff?.location_name || "Not assigned");
}

async function startScanner() {
  const profile = await guardRole(["staff","gm"]);
  if (!profile) return;

  const result = $("scanResult");
  const input = $("manualToken");
  const manualBtn = $("manualBtn");

  manualBtn.onclick = async () => {
    try {
      const c = await lookupCustomerToken(input.value);
      result.innerHTML = `<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`;
      setTimeout(() => location.href = "staff-customer.html", 400);
    } catch (e) {
      result.innerHTML = `<div class="alert">${esc(e.message)}</div>`;
    }
  };

  const reader = $("reader");
  if (!reader || typeof Html5Qrcode === "undefined") return;

  const scanner = new Html5Qrcode("reader");

  const onScan = async (decodedText) => {
    try {
      await scanner.stop();
    } catch {}

    try {
      const c = await lookupCustomerToken(decodedText);
      result.innerHTML = `<div class="alert ok">Customer found: <b>${esc(c.full_name)}</b></div>`;
      setTimeout(() => location.href = "staff-customer.html", 400);
    } catch (e) {
      result.innerHTML = `<div class="alert">${esc(e.message)}</div>`;
    }
  };

  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      onScan,
      () => {}
    );
  } catch (e) {
    result.innerHTML =
      `<div class="note">Camera could not start. Allow camera permission or use manual token entry below.</div>`;
  }
}

async function loadGmDashboard() {
  const profile = await guardRole(["gm"]);
  if (!profile) return;

  const { data, error } = await sb.rpc("get_gm_report");
  if (error) {
    toast(error.message, false);
    return;
  }

  const r = data || {};
  const map = {
    total_members: "members",
    total_points: "points",
    points_issued: "issued",
    points_redeemed: "redeemed",
    active_locations: "locations"
  };

  Object.entries(map).forEach(([key,id]) => {
    const el = $(id);
    if (el) el.textContent = moneyPoints(r[key]);
  });
}

async function loadGmMembers() {
  const profile = await guardRole(["gm"]);
  if (!profile) return;

  const box = $("members");
  const search = $("search");

  async function render() {
    const q = search.value.trim();

    let query = sb
      .from("profiles")
      .select("id,full_name,phone,member_id,points,is_active,created_at")
      .eq("role","customer")
      .order("created_at",{ascending:false});

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,phone.ilike.%${q}%,member_id.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      box.innerHTML = `<div class="alert">${esc(error.message)}</div>`;
      return;
    }

    box.innerHTML = data?.length ? data.map(m => `
      <div class="row" style="padding:13px 0;border-bottom:1px solid var(--line)">
        <div class="avatar">${esc(initials(m.full_name))}</div>
        <div class="grow">
          <strong>${esc(m.full_name || "Customer")}</strong>
          <small>${esc(m.member_id || "—")} • ${esc(m.phone || "—")}</small>
        </div>
        <span class="badge">${moneyPoints(m.points)} pts</span>
      </div>
    `).join("") : `<div class="empty">No members found.</div>`;
  }

  search.oninput = render;
  await render();
}

async function loadGmLocations() {
  const profile = await guardRole(["gm"]);
  if (!profile) return;

  const box = $("locations");
  const { data, error } = await sb
    .from("locations")
    .select("id,name,city,address,phone,is_active,created_at")
    .order("name");

  if (error) {
    box.innerHTML = `<div class="alert">${esc(error.message)}</div>`;
    return;
  }

  box.innerHTML = data?.length ? data.map(l => `
    <div class="card" style="margin-bottom:12px">
      <div class="row">
        <div class="avatar">AN</div>
        <div class="grow">
          <strong>${esc(l.name)}</strong>
          <small>${esc(l.city || "")} • ${esc(l.address || "Address not set")}</small>
        </div>
        <span class="badge">${l.is_active ? "Active" : "Inactive"}</span>
      </div>
      ${l.phone ? `<p class="sub" style="margin:12px 0 0">☎ ${esc(l.phone)}</p>` : ""}
    </div>
  `).join("") : `<div class="empty">No locations found.</div>`;
}

async function loadGmReports() {
  const profile = await guardRole(["gm"]);
  if (!profile) return;

  const { data, error } = await sb.rpc("get_gm_report");
  if (error) {
    toast(error.message, false);
    return;
  }

  const r = data || {};
  ["issued","redeemed","members","locations"].forEach(k => {
    const el = $(k);
    if (el) {
      const source = {
        issued: r.points_issued,
        redeemed: r.points_redeemed,
        members: r.total_members,
        locations: r.active_locations
      }[k];
      el.textContent = moneyPoints(source);
    }
  });
}

async function loadAdminDashboard() {
  const profile = await guardRole(["admin"]);
  if (!profile) return;
  const counts = { customer: "adminCustomers", staff: "adminStaff", gm: "adminGm" };
  for (const [role,id] of Object.entries(counts)) {
    const el = $(id);
    if (!el) continue;
    const { count, error } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", role);
    el.textContent = error ? "—" : moneyPoints(count);
  }
  const loc = $("adminLocations");
  if (loc) { const { count, error } = await sb.from("locations").select("id", { count: "exact", head: true }).eq("is_active", true); loc.textContent = error ? "—" : moneyPoints(count); }
}

async function loadAdminUsers() {
  const profile = await guardRole(["admin"]); if (!profile) return;
  const box=$("adminUsers"), search=$("adminSearch");
  async function render(){
    const q=search.value.trim();
    let query=sb.from("profiles").select("id,full_name,phone,member_id,role,points,is_active,created_at").order("created_at",{ascending:false}).limit(200);
    if(q) query=query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,member_id.ilike.%${q}%,role.ilike.%${q}%`);
    const {data,error}=await query; if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
    box.innerHTML=data?.length?data.map(u=>`<div class="row" style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="avatar">${esc(initials(u.full_name))}</div><div class="grow"><strong>${esc(u.full_name||"User")}</strong><small>${esc(u.member_id||"—")} • ${esc(u.phone||"—")}</small></div><span class="badge">${esc(u.role||"—")}</span></div>`).join(""):`<div class="empty">No users found.</div>`;
  }
  search.oninput=render; await render();
}

async function loadAdminRoleList(role, target) {
  const profile=await guardRole(["admin"]); if(!profile) return;
  const box=$(target); const {data,error}=await sb.from("profiles").select("id,full_name,phone,member_id,role,is_active,created_at").eq("role",role).order("created_at",{ascending:false});
  if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
  box.innerHTML=data?.length?data.map(u=>`<div class="row" style="padding:13px 0;border-bottom:1px solid var(--line)"><div class="avatar">${esc(initials(u.full_name))}</div><div class="grow"><strong>${esc(u.full_name||role.toUpperCase())}</strong><small>${esc(u.phone||"—")} • ${esc(u.member_id||"—")}</small></div><span class="badge">${u.is_active?"Active":"Inactive"}</span></div>`).join(""):`<div class="empty">No ${role} accounts found.</div>`;
}

async function loadAdminLocations() {
  const profile=await guardRole(["admin"]); if(!profile) return; const box=$("adminLocationsList");
  const {data,error}=await sb.from("locations").select("id,name,city,address,phone,is_active").order("name");
  if(error){box.innerHTML=`<div class="alert">${esc(error.message)}</div>`;return;}
  box.innerHTML=data?.length?data.map(l=>`<div class="card" style="margin-bottom:12px"><div class="row"><div class="avatar">AN</div><div class="grow"><strong>${esc(l.name)}</strong><small>${esc(l.city||"")} • ${esc(l.address||"Address not set")}</small></div><span class="badge">${l.is_active?"Active":"Inactive"}</span></div></div>`).join(""):`<div class="empty">No locations found.</div>`;
}

async function init() {
  const page = document.body.dataset.page;
  bindCustomerNav(page);
  try {
    if (page === "admin-login") {
      $("loginBtn").onclick = () => login("admin");
    } else if (page === "admin-dashboard") {
      await loadAdminDashboard();
    } else if (page === "admin-users") {
      await loadAdminUsers();
    } else if (page === "admin-gm") {
      await loadAdminRoleList("gm", "adminGmList");
    } else if (page === "admin-staff") {
      await loadAdminRoleList("staff", "adminStaffList");
    } else if (page === "admin-locations") {
      await loadAdminLocations();
    } else if (page === "admin-settings") {
      await guardRole(["admin"]);
    } else if (page === "customer-login") {
      $("loginBtn").onclick = () => login("customer");
    } else if (page === "customer-register") {
      $("registerBtn").onclick = registerCustomer;
    } else if (page === "customer-home") {
      await loadCustomerHome();
    } else if (page === "customer-card") {
      await loadCustomerCard();
    } else if (page === "customer-profile") {
      await loadCustomerProfile();
    } else if (page === "customer-rewards") {
      await loadCustomerRewards();
    } else if (page === "customer-menu") {
      await guardRole(["customer"]);
    } else if (page === "customer-offers") {
      await guardRole(["customer"]);
    } else if (page === "customer-locations") {
      await loadCustomerLocations();
    } else if (page === "staff-login") {
      $("loginBtn").onclick = () => login("staff");
    } else if (page === "staff-scan") {
      await startScanner();
    } else if (page === "staff-customer") {
      await loadStaffCustomer();
    } else if (page === "staff-add-points") {
      await loadAddPoints();
    } else if (page === "staff-redeem") {
      await loadStaffRedeem();
    } else if (page === "staff-history") {
      await loadStaffHistory();
    } else if (page === "staff-profile") {
      await loadStaffProfile();
    } else if (page === "gm-login") {
      $("loginBtn").onclick = () => login("gm");
    } else if (page === "gm-dashboard") {
      await loadGmDashboard();
    } else if (page === "gm-members") {
      await loadGmMembers();
    } else if (page === "gm-locations") {
      await loadGmLocations();
    } else if (page === "gm-reports") {
      await loadGmReports();
    } else if (page === "gm-settings") {
      await guardRole(["gm"]);
    } else if (page === "gm-menu") {
      await guardRole(["gm"]);
    } else if (page === "gm-offers") {
      await guardRole(["gm"]);
    }
  } catch (e) {
    console.error(e);
    const msg = $("msg");
    if (msg) msg.textContent = e.message || "Something went wrong.";
    else toast(e.message || "Something went wrong.", false);
  }
}

document.addEventListener("DOMContentLoaded", init);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register(location.pathname.includes("/customer/") || location.pathname.includes("/gm/") || location.pathname.includes("/staff/") || location.pathname.includes("/admin/") ? "../sw.js" : "./sw.js").catch(() => {}));
}
