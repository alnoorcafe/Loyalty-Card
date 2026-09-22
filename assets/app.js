/* Static GitHub-first build. Supabase will be connected later. */
(function(){
 const customer=JSON.parse(localStorage.getItem("alnoor_demo_customer")||"null");
 window.AlNoor={
   demo:{customer},
   getPoints(){return Number(localStorage.getItem("alnoor_demo_points")||1250)},
   setPoints(p){localStorage.setItem("alnoor_demo_points",String(p))},
   saveCustomer(c){localStorage.setItem("alnoor_demo_customer",JSON.stringify(c))}
 };
})();
