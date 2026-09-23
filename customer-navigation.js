/* AL NOOR CUSTOMER NAVIGATION */
(function(){
  "use strict";
  const base=location.pathname.includes("/customer/")?"":"customer/";
  const link=p=>base+p;

  function addHomeLinks(){
    const main=document.querySelector("main");
    if(!main||document.querySelector("[data-alnoor-extra-links]"))return;
    const quick=document.querySelector(".quick,.quick-grid");
    if(!quick)return;
    const box=document.createElement("div");
    box.setAttribute("data-alnoor-extra-links","1");
    box.style.cssText="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:14px";
    box.innerHTML=`<a href="${link("offers.html")}" style="text-decoration:none"><span style="display:block;padding:18px;border-radius:22px;background:#fffdf8;border:1px solid #e4dfd3;text-align:center;font-weight:800;color:#214f3d">★<br><span style="font-size:15px">Offers</span></span></a><a href="${link("menu.html")}" style="text-decoration:none"><span style="display:block;padding:18px;border-radius:22px;background:#fffdf8;border:1px solid #e4dfd3;text-align:center;font-weight:800;color:#214f3d">☰<br><span style="font-size:15px">Menu</span></span></a>`;
    main.appendChild(box);
  }

  function addMenuNav(){
    const nav=document.querySelector(".navin");
    if(!nav||nav.querySelector("[data-alnoor-menu-link]"))return;
    const profile=[...nav.querySelectorAll("a")].find(a=>/profile/i.test(a.textContent||""));
    const a=document.createElement("a");
    a.href=link("menu.html");
    a.setAttribute("data-alnoor-menu-link","1");
    a.innerHTML="<b>☰</b>Menu";
    if(profile)nav.insertBefore(a,profile);else nav.appendChild(a);
  }

  function init(){addHomeLinks();addMenuNav()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
