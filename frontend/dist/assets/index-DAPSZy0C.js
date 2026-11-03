var pt=Object.defineProperty;var mt=(t,a,e)=>a in t?pt(t,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):t[a]=e;var be=(t,a,e)=>mt(t,typeof a!="symbol"?a+"":a,e);(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const u of r)if(u.type==="childList")for(const l of u.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&s(l)}).observe(document,{childList:!0,subtree:!0});function e(r){const u={};return r.integrity&&(u.integrity=r.integrity),r.referrerPolicy&&(u.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?u.credentials="include":r.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function s(r){if(r.ep)return;r.ep=!0;const u=e(r);fetch(r.href,u)}})();const Pe="holter_token",le=()=>sessionStorage.getItem(Pe),bt=t=>sessionStorage.setItem(Pe,t),Xe=()=>sessionStorage.removeItem(Pe);class k extends Error{constructor(a,e){super(e),this.status=a}}function qe(t){return typeof t=="string"?t:Array.isArray(t)?t.map(a=>`${(a.loc??[]).slice(1).join(".")}: ${a.msg}`).join(" | "):"Datos inválidos"}async function q(t,a={}){const e=new Headers(a.headers),s=le();s&&e.set("Authorization",`Bearer ${s}`),a.body&&!(a.body instanceof URLSearchParams)&&!(a.body instanceof FormData)&&e.set("Content-Type","application/json");const r=await fetch(`/api${t}`,{...a,headers:e});if(r.status===401&&s&&(Xe(),window.dispatchEvent(new Event("auth-changed"))),!r.ok){let u=r.statusText;try{u=qe((await r.json()).detail)}catch{}throw new k(r.status,u)}return r.status===204?void 0:r.json()}async function vt(t,a){const e=await q("/auth/login",{method:"POST",body:new URLSearchParams({username:t,password:a})});bt(e.access_token)}const Ze=()=>q("/auth/me");async function me(t){const a=await fetch(`/api/actas/${t}/pdf`,{headers:{Authorization:`Bearer ${le()}`}});if(!a.ok){let s=a.statusText;try{s=qe((await a.json()).detail)}catch{}throw new k(a.status,s)}const e=URL.createObjectURL(await a.blob());window.open(e,"_blank")}async function xt(t){const a=await fetch(`/api/actas/${t}/pdf`,{headers:{Authorization:`Bearer ${le()}`}});if(!a.ok){let e=a.statusText;try{e=qe((await a.json()).detail)}catch{}throw new k(a.status,e)}return URL.createObjectURL(await a.blob())}const Ee=new Map;function Ce(t){return Ee.has(t)||Ee.set(t,fetch(`/api/equipos/${t}/foto`,{headers:{Authorization:`Bearer ${le()}`}}).then(async a=>a.ok?URL.createObjectURL(await a.blob()):null).catch(()=>null)),Ee.get(t)}function _e(t){Ee.delete(t)}async function Oe(t,a){const e=await fetch(`/api${t}`,{headers:{Authorization:`Bearer ${le()}`}});if(!e.ok){let u=e.statusText;try{u=qe((await e.json()).detail)}catch{}throw new k(e.status,u)}const s=URL.createObjectURL(await e.blob()),r=document.createElement("a");r.href=s,r.download=a,r.click(),setTimeout(()=>URL.revokeObjectURL(s),5e3)}async function et(t){const a=await fetch(`/api${t}`,{headers:{Authorization:`Bearer ${le()}`}});if(!a.ok)throw new k(a.status,"No se pudo cargar la imagen");return URL.createObjectURL(await a.blob())}function c(t){return String(t??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}const F=t=>t.toLocaleString("es-CO",{dateStyle:"medium",timeStyle:"short"}),N="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)]",S="block text-xs font-medium text-slate-600 mb-1.5",ae="rounded-lg px-4 py-2 text-sm font-medium",J=`${ae} bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white shadow-xs disabled:opacity-50 disabled:hover:bg-blue-700`,H=`${ae} bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs disabled:opacity-50`,ft=`${ae} bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50`;function K(t,a="max-w-lg"){const e=document.createElement("div");e.className="modal-fondo fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4 z-50",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`<div class="modal-caja bg-white rounded-2xl shadow-2xl border border-slate-200 w-full ${a} max-h-[92vh] overflow-auto">${t}</div>`,document.body.appendChild(e);const s=()=>{document.removeEventListener("keydown",r),e.remove()},r=u=>{u.key==="Escape"&&e.isConnected&&[...document.querySelectorAll(".modal-fondo")].pop()===e&&s()};return document.addEventListener("keydown",r),{overlay:e,cerrar:s,q:u=>e.querySelector(u)}}function V(t,a="ok",e=3800){let s=document.getElementById("toasts");s||(s=document.createElement("div"),s.id="toasts",s.className="fixed top-4 right-4 z-[70] space-y-2 w-[min(92vw,22rem)]",s.setAttribute("role","status"),s.setAttribute("aria-live","polite"),document.body.appendChild(s));const r={ok:"border-green-500",error:"border-red-500",info:"border-blue-600"},u={ok:"✔",error:"✖",info:"ℹ"},l=document.createElement("div");l.className=`toast bg-white border border-slate-200 border-l-4 ${r[a]} shadow-xl rounded-xl px-4 py-3 text-sm flex gap-2 items-start`,l.innerHTML=`<span class="font-bold">${u[a]}</span><span class="text-slate-700">${t.replace(/[&<>]/g,p=>({"&":"&amp;","<":"&lt;",">":"&gt;"})[p])}</span>`,s.appendChild(l),setTimeout(()=>{l.classList.add("saliendo"),setTimeout(()=>l.remove(),260)},e)}function ht(t){t.querySelectorAll("[data-contar]").forEach(a=>{const e=Number(a.dataset.contar);if(!Number.isFinite(e)||e===0)return void(a.textContent=String(e||0));const s=performance.now(),r=u=>{const l=Math.min(1,(u-s)/700);a.textContent=String(Math.round(e*(1-Math.pow(1-l,3)))),l<1&&requestAnimationFrame(r)};requestAnimationFrame(r)})}const I=t=>`<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${t}"/></svg>`,A={inicio:I("M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"),nueva:I("M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M12 11v6M9 14h6"),equipos:I("M3 12h4l2-5 4 10 2-5h6"),pacientes:I("M3 5h18v14H3zM7 10h4M7 14h6M15 10h2"),usuarios:I("M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8M21 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"),auditoria:I("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4"),reportes:I("M4 20V10M10 20V4M16 20v-7M22 20H2"),cuenta:I("M6 11V8a6 6 0 1112 0v3M5 11h14v10H5z"),salir:I("M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"),reloj:I("M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),documento:I("M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6"),sobre:I("M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM3 7l9 6 9-6"),retorno:I("M9 14l-5-5 5-5M4 9h10a6 6 0 010 12h-3"),chevron:I("M9 6l6 6-6 6"),buscar:I("M21 21l-4.3-4.3M17 11a6 6 0 11-12 0 6 6 0 0112 0z"),enviar:I("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"),calendario:I("M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z"),check:I("M20 6L9 17l-5-5"),ban:I("M12 21a9 9 0 100-18 9 9 0 000 18zM5.6 5.6l12.8 12.8"),mas:I("M12 5v14M5 12h14"),atras:I("M19 12H5M12 19l-7-7 7-7"),firma:I("M3 17c3-6 5-9 7-9s1 7 4 7 3-4 7-6M3 21h18"),camara:I("M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 100-8 4 4 0 000 8")},ge={DISPONIBLE:{nombre:"Disponible",clase:"bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"},PRESTADO:{nombre:"Prestado",clase:"bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/20"},MANTENIMIENTO:{nombre:"En mantenimiento",clase:"bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"},BAJA:{nombre:"De baja",clase:"bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/25"}},je={BORRADOR:{nombre:"Borrador",clase:"bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-400/25"},FIRMADA:{nombre:"Firmada",clase:"bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"},ENVIADA:{nombre:"Enviada",clase:"bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"},DEVUELTA:{nombre:"Devuelta",clase:"bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"},ANULADA:{nombre:"Anulada",clase:"bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"}},gt={blue:"bg-blue-50 text-blue-700",green:"bg-emerald-50 text-emerald-600",violet:"bg-indigo-50 text-indigo-600",amber:"bg-amber-50 text-amber-500",red:"bg-red-50 text-red-600",slate:"bg-slate-100 text-slate-500"},ie=(t,a="blue",e="w-11 h-11")=>`<span class="${e} rounded-full ${gt[a]} inline-flex items-center justify-center shrink-0">${t}</span>`;function de(t,a,e,s="",r="text-slate-500"){return`<header class="flex items-end justify-between gap-4 flex-wrap">
    <div class="min-w-0">
      <p class="text-[11px] font-semibold uppercase tracking-[.22em] ${r}">${t}</p>
      <h2 class="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight text-slate-900">${a}</h2>
      <p class="mt-1 text-sm text-slate-500">${e}</p>
    </div>
    ${s?`<div class="flex items-center gap-2 flex-wrap">${s}</div>`:""}
  </header>`}const Ie=(t,a,e="",s="blue")=>`<div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-3">${ie(t,s,"w-9 h-9")}<h3 class="font-semibold text-slate-900">${a}</h3></div>${e}
  </div>`,He=(t,a,e,s="blue")=>`<div class="py-12 flex flex-col items-center text-center">
    ${ie(t,s,"w-20 h-20 [&>svg]:w-9 [&>svg]:h-9")}
    <p class="mt-5 font-semibold text-slate-900">${a}</p>
    <p class="mt-1 text-sm text-slate-500 max-w-sm">${e}</p>
  </div>`;function tt(t){const a=[...document.body.children].filter(s=>s!==t&&s.id!=="toasts"),e=document.body.style.overflow;return a.forEach(s=>s.setAttribute("inert","")),document.body.style.overflow="hidden",()=>{a.forEach(s=>s.removeAttribute("inert")),document.body.style.overflow=e}}function $e(t,a=2.6){const e=t.getContext("2d");let s=[],r=null,u=0,l=0;const p=()=>{e.lineWidth=a,e.lineCap="round",e.lineJoin="round",e.strokeStyle="#0b1b40"},n=h=>{if(p(),e.beginPath(),e.moveTo(h[0].x,h[0].y),h.length===1)e.lineTo(h[0].x+.01,h[0].y+.01);else{for(let d=1;d<h.length-1;d++){const m=(h[d].x+h[d+1].x)/2,$=(h[d].y+h[d+1].y)/2;e.quadraticCurveTo(h[d].x,h[d].y,m,$)}const g=h[h.length-1];e.lineTo(g.x,g.y)}e.stroke()},o=()=>{e.clearRect(0,0,u,l),s.forEach(n)},i=()=>{const h=t.getBoundingClientRect();if(!h.width||!h.height)return;const g=Math.max(window.devicePixelRatio||1,1);u=h.width,l=h.height,t.width=Math.round(h.width*g),t.height=Math.round(h.height*g),e.setTransform(t.width/u,0,0,t.height/l,0,0),o()},v=h=>{const g=t.getBoundingClientRect(),d=Math.min(Math.max(h.clientX-g.left,0),g.width),m=Math.min(Math.max(h.clientY-g.top,0),g.height);return{x:d,y:m}},w=h=>{h&&t.hasPointerCapture(h.pointerId)&&t.releasePointerCapture(h.pointerId),r=null};return t.style.touchAction="none",t.addEventListener("pointerdown",h=>{if(u||i(),!(h.button!==0&&h.pointerType==="mouse")){h.preventDefault();try{t.setPointerCapture(h.pointerId)}catch{}r=[v(h)],s.push(r),n(r)}}),t.addEventListener("pointermove",h=>{var d;if(!r)return;if(h.pointerType!=="touch"&&h.buttons===0)return w(h);(((d=h.getCoalescedEvents)==null?void 0:d.call(h))??[h]).forEach(m=>r.push(v(m))),o()}),t.addEventListener("pointerup",h=>w(h)),t.addEventListener("pointercancel",h=>w(h)),t.addEventListener("lostpointercapture",()=>w()),window.addEventListener("pointerup",()=>w()),window.addEventListener("pointercancel",()=>w()),window.addEventListener("resize",()=>{t.isConnected&&i()}),i(),{ajustar:i,limpiar(){s=[],r=null,o()},vacio:()=>s.length===0,aPng(){const{x:h,y:g,w:d,h:m}=$t(t),$=document.createElement("canvas");return $.width=600,$.height=Math.max(1,Math.round(600*m/d)),$.getContext("2d").drawImage(t,h,g,d,m,0,0,$.width,$.height),$.toDataURL("image/png")}}}function $t(t){const{data:a}=t.getContext("2d").getImageData(0,0,t.width,t.height);let e=t.width,s=t.height,r=-1,u=-1;for(let o=0;o<t.height;o++)for(let i=0;i<t.width;i++)a[(o*t.width+i)*4+3]>0&&(i<e&&(e=i),i>r&&(r=i),o<s&&(s=o),o>u&&(u=o));if(r<0)return{x:0,y:0,w:t.width,h:t.height};const l=Math.round(Math.max(t.width,t.height)*.02)+2,p=Math.max(0,e-l),n=Math.max(0,s-l);return{x:p,y:n,w:Math.max(1,Math.min(t.width,r+l)-p),h:Math.max(1,Math.min(t.height,u+l)-n)}}function yt(t){return new Promise(a=>{const e=document.createElement("div");e.className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",e.innerHTML=`
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-3">
        <h3 class="font-semibold text-lg">${c(t.titulo)}</h3>
        ${`<div class="grid grid-cols-2 gap-2">
                <input id="f-nombre" placeholder="Nombre" value="${c(t.nombre)}" class="border border-slate-300 rounded-lg px-3 py-2" />
                <input id="f-doc" placeholder="Documento" value="${c(t.documento)}" class="border border-slate-300 rounded-lg px-3 py-2" />
              </div>`}
        <canvas id="lienzo" style="height:11rem"
          class="w-full border-2 border-dashed border-slate-300 rounded-lg bg-white touch-none cursor-crosshair"></canvas>
        <p id="f-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-between">
          <button id="f-limpiar" class="text-sm text-slate-600 hover:underline">Borrar</button>
          <div class="flex gap-2">
            <button id="f-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="f-ok" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2">Aceptar firma</button>
          </div>
        </div>
      </div>`,document.body.appendChild(e);const s=tt(e),r=p=>e.querySelector(`#${p}`),u=$e(r("lienzo")),l=p=>{s(),e.remove(),a(p)};r("f-limpiar").addEventListener("click",()=>{u.limpiar()}),r("f-cancelar").addEventListener("click",()=>l(null)),r("f-ok").addEventListener("click",()=>{const p=r("f-error"),n=r("f-nombre").value.trim(),o=r("f-doc").value.trim();if(u.vacio()){p.textContent="Dibuja la firma antes de aceptar.",p.classList.remove("hidden");return}if(!n||!o){p.textContent="Escribe nombre y documento.",p.classList.remove("hidden");return}l({nombre:n,documento:o,imagen:u.aPng()})})})}const wt=["Adulto mayor con limitación motriz en las manos","Discapacidad visual","Discapacidad física que le impide firmar","Paciente menor de edad (firma su acudiente)","No sabe firmar","Se encuentra en un estado de salud que se lo impide"];function Et(t){return new Promise(a=>{let e="firmar";const s=K(`<div class="p-6 space-y-4">
        <div><h3 class="text-lg font-semibold text-slate-900">Firma del paciente</h3>
          <p class="text-sm text-slate-500">${c(t.paciente.nombre_completo)} · ${c(t.paciente.tipo_documento)} ${c(t.paciente.numero_documento)}</p></div>
        <div class="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 text-sm font-medium">
          <button type="button" data-tab="firmar" class="rounded-lg py-2">✍️ Firma</button>
          <button type="button" data-tab="no" class="rounded-lg py-2">🚫 No puede firmar</button>
        </div>

        <div id="panel-firmar" class="space-y-2">
          <canvas id="lienzo" class="w-full h-44 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
          <button type="button" id="borrar" class="text-sm text-slate-500 underline">Borrar</button>
        </div>

        <div id="panel-no" class="hidden space-y-3">
          <p class="text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-3">Se dejará constancia en el acta de que el paciente no puede firmar y el motivo.</p>
          <div><label class="${S}">Motivo frecuente</label>
            <select id="m-tipo" class="${N}"><option value="">— Elegir (opcional) —</option>${wt.map(o=>`<option>${c(o)}</option>`).join("")}</select></div>
          <div><label class="${S}">Motivo por el que no puede firmar *</label>
            <textarea id="m-motivo" rows="2" maxlength="500" class="${N}" placeholder="Escribe el motivo"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="${S}">Responsable / acompañante</label><input id="m-resp" class="${N}" placeholder="Nombre (opcional)" /></div>
            <div><label class="${S}">Documento</label><input id="m-resp-doc" class="${N}" placeholder="Cédula (opcional)" /></div>
          </div>
          <details class="text-sm"><summary class="cursor-pointer text-blue-700">El responsable firma a ruego (opcional)</summary>
            <canvas id="lienzo-resp" class="mt-2 w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
            <button type="button" id="borrar-resp" class="text-sm text-slate-500 underline">Borrar</button></details>
        </div>

        <p id="error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="cancelar" class="rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200">Cancelar</button>
          <button type="button" id="guardar" class="rounded-lg px-5 py-2 text-sm font-medium bg-blue-700 hover:bg-blue-800 text-white">Guardar</button>
        </div>
      </div>`,"max-w-lg"),r=tt(s.overlay),u=$e(s.q("#lienzo")),l=$e(s.q("#lienzo-resp"));s.overlay.querySelector("details").addEventListener("toggle",()=>l.ajustar());const p=()=>{s.overlay.querySelectorAll("[data-tab]").forEach(o=>{const i=o.dataset.tab===e;o.className=`rounded-lg py-2 ${i?"bg-white shadow text-blue-800":"text-slate-500"}`}),s.q("#panel-firmar").classList.toggle("hidden",e!=="firmar"),s.q("#panel-no").classList.toggle("hidden",e!=="no"),e==="firmar"&&u.ajustar()};p(),s.overlay.querySelectorAll("[data-tab]").forEach(o=>o.addEventListener("click",()=>{e=o.dataset.tab,p()})),s.q("#borrar").addEventListener("click",()=>u.limpiar()),s.q("#borrar-resp").addEventListener("click",()=>l.limpiar()),s.q("#m-tipo").addEventListener("change",o=>{const i=o.target.value,v=s.q("#m-motivo");i&&(v.value=i)});const n=o=>{r(),s.cerrar(),a(o)};s.q("#cancelar").addEventListener("click",()=>n(null)),s.overlay.addEventListener("click",o=>o.target===s.overlay&&n(null)),s.q("#guardar").addEventListener("click",()=>{const o=s.q("#error"),i=m=>{o.textContent=m,o.classList.remove("hidden")};o.classList.add("hidden");const v={rol:"PACIENTE",firmante_nombre:t.paciente.nombre_completo,firmante_documento:t.paciente.numero_documento};if(e==="firmar")return u.vacio()?i("Dibuja la firma antes de guardar."):n({...v,imagen:u.aPng()});const w=s.q("#m-motivo").value.trim();if(w.length<5)return i("Escribe el motivo por el que no puede firmar.");const h=s.q("#m-resp").value.trim(),g=s.q("#m-resp-doc").value.trim(),d=!l.vacio();if(d&&!h)return i("Escribe el nombre del responsable que firma a ruego.");n({...v,no_puede_firmar:!0,motivo_no_firma:w,responsable_nombre:h||null,responsable_documento:g||null,...d?{imagen:l.aPng()}:{}})})})}const Fe=[{hasta:22,texto:"Preparando el documento…"},{hasta:48,texto:"Conectando con Gmail…"},{hasta:86,texto:"Enviando el correo…"},{hasta:100,texto:"Confirmando la entrega…"}],ze=["#2554bf","#5b8aee","#22c55e","#f59e0b","#ef4444","#8b5cf6"];class at{constructor(a,e=""){be(this,"el",document.createElement("div"));be(this,"pct",0);be(this,"raf",0);be(this,"cerrado");be(this,"alCerrar",new Promise(a=>this.cerrado=a));this.el.className="modal-fondo fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-[60]",this.el.innerHTML=`
      <div class="modal-caja relative overflow-hidden bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-4">
        <div id="p-confeti" class="absolute inset-x-0 top-0 h-0 pointer-events-none"></div>
        <div id="p-visual" class="relative w-40 h-40 mx-auto">
          <svg viewBox="0 0 120 120" class="w-40 h-40 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#e3eaf5" stroke-width="9" />
            <circle id="p-aro" cx="60" cy="60" r="52" fill="none" stroke="#2554bf" stroke-width="9" stroke-linecap="round"
              stroke-dasharray="326.7" stroke-dashoffset="326.7" style="transition: stroke .3s" />
          </svg>
          <div id="p-centro" class="absolute inset-0 flex items-center justify-center"><span id="p-num" class="text-4xl font-bold text-blue-900">0%</span></div>
        </div>
        <div><h3 id="p-titulo" class="text-lg font-semibold text-slate-900">${c(a)}</h3>
          <p id="p-etapa" class="text-sm text-blue-700 font-medium mt-1" style="animation:pulseSoft 1.4s infinite">Preparando el documento…</p>
          <p id="p-detalle" class="text-xs text-slate-500 mt-1 truncate">${c(e)}</p></div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div id="p-barra" class="h-2 rounded-full bg-blue-600" style="width:0%"></div></div>
        <div id="p-res" class="text-left text-sm space-y-1 max-h-36 overflow-auto"></div>
        <button id="p-cerrar" class="hidden bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 py-2.5 font-medium">Listo</button>
      </div>`,document.body.appendChild(this.el),this.q("#p-cerrar").addEventListener("click",()=>this.cerrar())}q(a){return this.el.querySelector(a)}poner(a,e){this.pct=Math.max(0,Math.min(100,a));const s=Math.round(this.pct);this.q("#p-aro").style.strokeDashoffset=String(326.7*(1-this.pct/100)),this.q("#p-barra").style.width=`${this.pct}%`;const r=this.q("#p-num");r&&(r.textContent=`${s}%`),this.q("#p-etapa").textContent=e??(Fe.find(u=>this.pct<=u.hasta)??Fe[3]).texto}avanzarHacia(a,e,s=2600,r){cancelAnimationFrame(this.raf);const u=performance.now(),l=p=>{const n=a+(e-a)*(1-Math.exp(-(p-u)/s));this.poner(n,r==null?void 0:r(n)),this.raf=requestAnimationFrame(l)};this.raf=requestAnimationFrame(l)}completarHasta(a,e=450){cancelAnimationFrame(this.raf);const s=this.pct;return new Promise(r=>{const u=performance.now(),l=p=>{const n=Math.min(1,(p-u)/e);this.poner(s+(a-s)*(1-Math.pow(1-n,3))),n<1?this.raf=requestAnimationFrame(l):r()};this.raf=requestAnimationFrame(l)})}detalle(a){this.q("#p-detalle").textContent=a}async exito(a,e="",s=!1){cancelAnimationFrame(this.raf),await this.completarHasta(100,350),this.q("#p-visual").innerHTML=`
      <div class="anillo-exito w-40 h-40 rounded-full ${s?"bg-amber-100":"bg-green-100"} flex items-center justify-center">
        <svg viewBox="0 0 52 52" class="w-20 h-20"><path class="check-trazo" fill="none" stroke="${s?"#d97706":"#16a34a"}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M14 27l8 8 16-17"/></svg>
      </div>`,this.q("#p-barra").className=`h-2 rounded-full ${s?"bg-amber-500":"bg-green-500"}`,this.q("#p-titulo").textContent=a;const r=this.q("#p-etapa");r.style.animation="none",r.className=`text-sm font-medium mt-1 ${s?"text-amber-700":"text-green-700"}`,r.textContent=s?"Revisa los detalles":"Entregado a Gmail",this.q("#p-detalle").textContent=e,s||this.confeti(),this.q("#p-cerrar").classList.remove("hidden")}fallo(a,e){cancelAnimationFrame(this.raf),this.q("#p-visual").innerHTML=`
      <div class="anillo-exito w-40 h-40 rounded-full bg-red-100 flex items-center justify-center">
        <svg viewBox="0 0 52 52" class="w-20 h-20"><path class="check-trazo" fill="none" stroke="#dc2626" stroke-width="5" stroke-linecap="round" d="M16 16l20 20M36 16L16 36"/></svg>
      </div>`,this.q("#p-barra").className="h-2 rounded-full bg-red-500",this.q("#p-titulo").textContent=a;const s=this.q("#p-etapa");s.style.animation="none",s.className="text-sm text-red-600 font-medium mt-1",s.textContent=e,this.q("#p-detalle").textContent="",this.q("#p-cerrar").textContent="Cerrar",this.q("#p-cerrar").classList.remove("hidden")}lineas(a){this.q("#p-res").innerHTML=a}confeti(){const a=this.q("#p-confeti");a.innerHTML=Array.from({length:26},()=>{const e=Math.random()*100,s=Math.random()*.5;return`<span class="confeti" style="left:${e}%;background:${ze[Math.floor(Math.random()*ze.length)]};animation-delay:${s}s;transform:rotate(${Math.random()*90}deg)"></span>`}).join("")}cerrar(){cancelAnimationFrame(this.raf),this.el.remove(),this.cerrado()}}async function qt(t){const a=new at(t.titulo,t.detalle);a.poner(0),a.avanzarHacia(0,92);try{const e=await t.tarea();await a.exito(t.textoOk,t.detalle);const s=window.setTimeout(()=>a.cerrar(),3500);return await a.alCerrar,clearTimeout(s),{ok:!0,valor:e}}catch(e){const s=e instanceof Error?e.message:String(e);return a.fallo(t.textoError??"No se pudo enviar",s),await a.alCerrar,{ok:!1,error:s}}}async function Lt(t){const a=t.items.length,e=new at(t.titulo,"");e.poner(0);const s=[];let r=0;for(let l=0;l<a;l++){const p=t.items[l],n=l/a*100,o=(l+1)/a*100;e.detalle(`${t.nombre(p)} · ${l+1} de ${a}`),e.avanzarHacia(n,n+(o-n)*.92,2200);try{await t.tarea(p),r++}catch(i){s.push({item:p,motivo:i instanceof Error?i.message:"Error de conexión"})}await e.completarHasta(o,300)}const u=s.length===0;return e.lineas(s.map(l=>`<p class="text-red-600">• ${c(t.nombre(l.item))}: ${c(l.motivo)}</p>`).join("")),await e.exito(u?a===1?"¡Enviado correctamente!":`¡${r} actas enviadas correctamente!`:`${r} enviada(s), ${s.length} con error`,u?"":"Las que fallaron siguen en «Por enviar»",!u),await e.alCerrar,{ok:r,fallos:s}}const Ue=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,ee="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm",te="block text-xs font-medium mb-0.5 text-slate-600",_t=t=>{const a=new Date(t);return a.setMinutes(a.getMinutes()-a.getTimezoneOffset()),a.toISOString().slice(0,16)};function st(t){return new Promise(a=>{let e=t,s=null,r=!1,u=null,l="revisar",p="",n=!1;const o=document.createElement("div");o.className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50",document.body.appendChild(o);const i=()=>e.estado!=="ENVIADA"&&e.estado!=="DEVUELTA"&&e.estado!=="ANULADA",v=()=>e.paciente.correo??"",w=()=>Ue.test(v()),h=()=>{s&&URL.revokeObjectURL(s),o.remove(),a({enviada:r,acta:e})},g=async()=>{s&&URL.revokeObjectURL(s),s=null,$();try{s=await xt(e.id)}catch(b){p=b instanceof k?b.message:"No se pudo generar la vista previa",n=!0}$()},d=()=>`
      <div class="space-y-3 text-sm">
        <div class="bg-slate-50 rounded-lg p-3 space-y-1">
          <p><span class="text-slate-500">Paciente:</span> <b>${c(e.paciente.nombre_completo)}</b></p>
          <p><span class="text-slate-500">Documento:</span> ${c(e.paciente.tipo_documento)} ${c(e.paciente.numero_documento)}</p>
          <p><span class="text-slate-500">Equipo:</span> ${c(e.equipo.tipo.nombre)} serie ${c(e.equipo.serie)}</p>
          <p><span class="text-slate-500">Se enviará a:</span>
            <b class="${w()?"text-blue-800":"text-red-600"}">${c(v())||"sin correo"}</b></p>
        </div>
        ${w()?"":'<p class="text-red-600 text-xs">El correo no es válido. Usa «Corregir datos» para arreglarlo.</p>'}
        <p class="text-slate-600 text-xs">Revisa el documento de la izquierda: nombre, cédula, equipo, fechas y firmas. Si hay un error, corrígelo antes de enviar.</p>
        ${i()?'<button id="r-corregir" class="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg px-3 py-2 font-medium">✏️ Corregir datos</button>':'<p class="text-xs text-slate-500">Esta acta ya fue enviada, por eso no se puede corregir.</p>'}
      </div>`,m=()=>{const b=e.paciente,f=(y,D)=>'<option value="">—</option>'+y.map(z=>`<option value="${z.id}" ${z.id===D?"selected":""}>${c(z.nombre)}</option>`).join("");return`
      <div class="space-y-2">
        <div class="grid grid-cols-3 gap-2">
          <div><label class="${te}">Tipo</label>
            <select id="c-tipo" class="${ee}">${["CC","TI","CE","PA"].map(y=>`<option ${y===b.tipo_documento?"selected":""}>${y}</option>`).join("")}</select></div>
          <div class="col-span-2"><label class="${te}">Documento</label><input id="c-doc" class="${ee}" value="${c(b.numero_documento)}" /></div>
        </div>
        <div><label class="${te}">Nombre completo</label><input id="c-nombre" class="${ee}" value="${c(b.nombre_completo)}" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${te}">Expedida en</label><input id="c-exp" class="${ee}" value="${c(b.ciudad_expedicion)}" /></div>
          <div><label class="${te}">Vecino de</label><input id="c-vecino" class="${ee}" value="${c(b.vecino_de)}" /></div>
        </div>
        <div><label class="${te}">Correo</label><input id="c-correo" type="email" class="${ee}" value="${c(b.correo)}" /></div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${te}">Entrega</label><input id="c-fecha" type="datetime-local" class="${ee}" value="${_t(e.fecha_entrega)}" /></div>
          <div><label class="${te}">Duración</label>
            <select id="c-horas" class="${ee}"><option value="24" ${e.duracion_horas===24?"selected":""}>24 h</option><option value="48" ${e.duracion_horas===48?"selected":""}>48 h</option></select></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div><label class="${te}">Aseguradora</label><select id="c-aseg" class="${ee}">${f(u.aseguradoras,e.aseguradora_id??null)}</select></div>
          <div><label class="${te}">Régimen</label><select id="c-reg" class="${ee}">${f(u.regimenes,e.regimen_id??null)}</select></div>
        </div>
        <div><label class="${te}">Observaciones</label><textarea id="c-obs" rows="2" class="${ee}">${c(e.observaciones)}</textarea></div>
        <div class="flex gap-2 pt-1">
          <button id="c-cancelar" class="flex-1 bg-slate-200 hover:bg-slate-300 rounded-lg px-3 py-2">Descartar</button>
          <button id="c-guardar" class="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-3 py-2 font-medium">Guardar cambios</button>
        </div>
      </div>`},$=()=>{var D,z,R,O,U,X;if(l==="listo"){o.innerHTML=`
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-4">
            <div class="text-5xl">✅</div>
            <h3 class="text-lg font-semibold">¡Acta enviada correctamente!</h3>
            <p class="text-sm text-slate-600">Se envió a <b>${c(v())}</b>.</p>
            <button id="r-cerrar" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-6 py-2">Cerrar</button>
          </div>`,o.querySelector("#r-cerrar").addEventListener("click",h);return}const b=l==="enviando",f=!s||!w()||l==="corregir"||b;o.innerHTML=`
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[92vh] flex flex-col">
          <div class="px-5 py-3 border-b flex items-center justify-between">
            <h3 class="font-semibold">Revisa el acta N° ${String(e.numero).padStart(6,"0")} antes de enviarla</h3>
            <button id="r-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none" ${b?"disabled":""}>✕</button>
          </div>
          <div class="flex-1 min-h-0 grid md:grid-cols-[1fr_330px]">
            <div class="bg-slate-100 min-h-0 relative">
              ${s?`<iframe src="${s}" class="w-full h-full" title="Vista previa del acta"></iframe>`:`<div class="h-full flex items-center justify-center text-slate-500 text-sm p-6 text-center">${n?"":"Generando vista previa..."}</div>`}
            </div>
            <div class="p-4 overflow-auto border-t md:border-t-0 md:border-l">
              ${l==="corregir"?m():d()}
            </div>
          </div>
          <div class="px-5 py-3 border-t space-y-2">
            ${p?`<p class="text-sm ${n?"text-red-600":"text-green-700"}">${c(p)}</p>`:""}
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <p class="text-sm font-medium text-slate-700">¿Está seguro de enviar el acta a <span class="text-blue-800">${c(v())||"—"}</span>?</p>
              <div class="flex gap-2">
                <button id="r-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2" ${b?"disabled":""}>Cancelar</button>
                <button id="r-enviar" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2 font-medium disabled:opacity-40 disabled:cursor-not-allowed" ${f?"disabled":""}>
                  ${b?"Enviando...":"Sí, enviar acta"}
                </button>
              </div>
            </div>
          </div>
        </div>`;const y=P=>o.querySelector(`#${P}`);(D=y("r-x"))==null||D.addEventListener("click",h),(z=y("r-cancelar"))==null||z.addEventListener("click",h),(R=y("r-corregir"))==null||R.addEventListener("click",async()=>{if(!u)try{const[P,G]=await Promise.all([q("/catalogos/aseguradoras"),q("/catalogos/regimenes")]);u={aseguradoras:P,regimenes:G}}catch{return p="No se pudieron cargar los catálogos",n=!0,$()}p="",l="corregir",$()}),(O=y("c-cancelar"))==null||O.addEventListener("click",()=>{l="revisar",p="",$()}),(U=y("c-guardar"))==null||U.addEventListener("click",async()=>{const P=Q=>y(Q).value.trim(),G=Q=>P(Q)?Number(P(Q)):null;if(!P("c-nombre")||!P("c-doc"))return p="El nombre y el documento son obligatorios.",n=!0,$();if(P("c-correo")&&!Ue.test(P("c-correo")))return p="El correo no es válido.",n=!0,$();y("c-guardar").disabled=!0;try{e=await q(`/actas/${e.id}/corregir`,{method:"PUT",body:JSON.stringify({tipo_documento:P("c-tipo"),numero_documento:P("c-doc"),nombre_completo:P("c-nombre"),ciudad_expedicion:P("c-exp")||null,vecino_de:P("c-vecino")||null,correo:P("c-correo")||null,fecha_entrega:P("c-fecha"),duracion_horas:Number(P("c-horas")),aseguradora_id:G("c-aseg"),regimen_id:G("c-reg"),observaciones:P("c-obs")||null})}),l="revisar",p="Cambios guardados. Revisa la nueva vista previa.",n=!1,await g()}catch(Q){p=Q instanceof k?Q.message:"No se pudieron guardar los cambios",n=!0,$()}}),(X=y("r-enviar"))==null||X.addEventListener("click",async()=>{const P=await qt({titulo:"Enviando acta por Gmail",detalle:`${e.paciente.nombre_completo} · ${v()}`,textoOk:"¡Acta enviada correctamente!",tarea:()=>q(`/actas/${e.id}/enviar`,{method:"POST",body:JSON.stringify({})})});P.ok?(r=!0,e={...e,estado:"ENVIADA"},h()):(p=P.error,n=!0,$())})};$(),g()})}function Ae(t,a,e){var u,l,p;if((u=document.getElementById("prestamo-activo"))==null||u.remove(),!a)return;const s=a.estado==="FIRMADA"||a.estado==="ENVIADA",r=document.createElement("div");r.id="prestamo-activo",r.className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3",r.innerHTML=`
    <div>
      <p class="font-semibold text-amber-900">Acta #${a.numero} abierta · ${c(a.equipo.tipo.nombre)} serie ${c(a.equipo.serie)}</p>
      <p class="text-sm text-amber-800">Estado: ${c(a.estado)}. Mientras el acta esté abierta, el paciente no puede tener un nuevo préstamo.</p>
    </div>
    <div class="flex flex-wrap gap-2">
      ${s?`<button type="button" data-accion="devolver" class="${J}">Registrar devolución</button>`:""}
      <button type="button" data-accion="anular" class="${H} text-red-700 border-red-200 hover:bg-red-50">Cancelar acta y liberar equipo</button>
    </div>`,t.insertAdjacentElement("afterend",r),(l=r.querySelector('[data-accion="devolver"]'))==null||l.addEventListener("click",()=>At(a,e)),(p=r.querySelector('[data-accion="anular"]'))==null||p.addEventListener("click",()=>Mt(a,e))}function At(t,a){const e=K(`
    <div class="p-6 space-y-4">
      <h3 class="text-lg font-semibold text-slate-900">Registrar devolución · acta #${t.numero}</h3>
      <p class="text-sm text-slate-600">${c(t.equipo.tipo.nombre)} serie ${c(t.equipo.serie)}</p>
      <div><label class="block text-sm font-medium mb-1">Estado en que se recibe el equipo</label>
        <select id="pd-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2">
          <option value="DISPONIBLE">Bueno · queda disponible</option>
          <option value="MANTENIMIENTO">Con novedad · pasa a mantenimiento</option>
        </select></div>
      <div><label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
        <textarea id="pd-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea></div>
      <p id="pd-error" class="text-sm text-red-600 hidden"></p>
      <div class="flex justify-end gap-2">
        <button type="button" id="pd-no" class="${H}">Volver</button>
        <button type="button" id="pd-si" class="${J}">Registrar devolución</button>
      </div>
    </div>`,"max-w-md");e.q("#pd-no").addEventListener("click",()=>e.cerrar()),e.q("#pd-si").addEventListener("click",async()=>{const s=e.q("#pd-estado").value,r=e.q("#pd-obs").value.trim();try{await q(`/actas/${t.id}/devolver`,{method:"POST",body:JSON.stringify({estado_equipo:s,observaciones:r||null})}),e.cerrar(),V(`Devolución registrada. El equipo ${t.equipo.serie} quedó ${s==="DISPONIBLE"?"disponible":"en mantenimiento"}.`,"ok"),a()}catch(u){const l=e.q("#pd-error");l.textContent=u instanceof k?u.message:"No se pudo registrar la devolución",l.classList.remove("hidden")}})}function Mt(t,a){const e=K(`
    <div class="p-6 space-y-4">
      <h3 class="text-lg font-semibold text-red-700">Cancelar acta #${t.numero}</h3>
      <p class="text-sm text-slate-600">El equipo <b>${c(t.equipo.serie)}</b> quedará disponible y el paciente podrá tener un nuevo préstamo. Esta acción no se puede deshacer.</p>
      <div><label class="block text-sm font-medium mb-1">Motivo *</label>
        <textarea id="pa-motivo" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ej: El acta se creó por error"></textarea>
        <p id="pa-error" class="text-xs text-red-600 hidden mt-1">Escribe un motivo de al menos 5 letras.</p></div>
      <div class="flex justify-end gap-2">
        <button type="button" id="pa-no" class="${H}">Volver</button>
        <button type="button" id="pa-si" class="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Cancelar acta</button>
      </div>
    </div>`,"max-w-md");e.q("#pa-no").addEventListener("click",()=>e.cerrar()),e.q("#pa-si").addEventListener("click",async()=>{const s=e.q("#pa-motivo").value.trim();if(s.length<5)return e.q("#pa-error").classList.remove("hidden");try{await q(`/actas/${t.id}/anular`,{method:"POST",body:JSON.stringify({motivo:s})}),e.cerrar(),V(`Acta #${t.numero} cancelada. El equipo ${t.equipo.serie} quedó disponible.`,"ok"),a()}catch(r){V(r instanceof k?r.message:"No se pudo cancelar el acta","error")}})}const W="w-full border border-slate-300 rounded-lg px-3 py-2",Y="block text-sm font-medium mb-1",Be=t=>'<option value="">— Seleccionar —</option>'+t.map(a=>`<option value="${a.id}">${c(a.nombre)}</option>`).join("");function Nt(){const t=new Date;return t.setMinutes(t.getMinutes()-t.getTimezoneOffset()),t.toISOString().slice(0,16)}async function ot(t){t.innerHTML='<p class="text-slate-500">Cargando...</p>';const[a,e,s]=await Promise.all([q("/equipos?estado=disponible"),q("/catalogos/aseguradoras"),q("/catalogos/regimenes")]),r=new URLSearchParams(location.hash.split("?")[1]??"").get("equipo");t.innerHTML=`
    <form id="form" class="space-y-6">
      ${de("Préstamos","Nueva acta de préstamo","Registra la entrega del equipo, la firma y el envío del acta.",`<a href="#/" class="${H} inline-flex items-center gap-2 !rounded-xl">${A.atras}Volver</a>`)}

      <section class="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 class="font-semibold text-blue-800">1. Paciente</h3>
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="${Y}" for="tipo_documento">Tipo de documento</label>
            <select id="tipo_documento" class="${W}">
              <option>CC</option><option>TI</option><option>CE</option><option>PA</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="${Y}" for="numero_documento">Número de documento *</label>
            <div class="flex gap-2">
              <input id="numero_documento" required class="${W}" placeholder="Ej: 1061234567" />
              <button type="button" id="buscar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 whitespace-nowrap">Buscar</button>
            </div>
            <p id="estado-paciente" class="text-xs mt-1 text-slate-500">Escribe la cédula para autocompletar los datos si ya prestó antes.</p>
          </div>
          <div class="md:col-span-3">
            <label class="${Y}" for="nombre_completo">Nombre completo *</label>
            <input id="nombre_completo" required class="${W}" />
          </div>
          <div>
            <label class="${Y}" for="ciudad_expedicion">Cédula expedida en</label>
            <input id="ciudad_expedicion" class="${W}" />
          </div>
          <div>
            <label class="${Y}" for="vecino_de">Vecino de</label>
            <input id="vecino_de" class="${W}" />
          </div>
          <div>
            <label class="${Y}" for="telefono">Teléfono</label>
            <input id="telefono" class="${W}" />
          </div>
          <div class="md:col-span-3">
            <label class="${Y}" for="correo">Correo electrónico * <span class="text-slate-400 font-normal">(aquí se enviará el acta)</span></label>
            <input id="correo" type="email" required class="${W}" />
          </div>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow p-6 space-y-4">
        <h3 class="font-semibold text-blue-800">2. Equipo y préstamo</h3>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="${Y}" for="equipo_id">Equipo disponible *</label>
            <select id="equipo_id" required class="${W}">
              <option value="">— Seleccionar —</option>
              ${a.map(m=>`<option value="${m.id}" ${m.id===r?"selected":""}>${c(m.tipo.nombre)}${m.marca?" "+c(m.marca):""} — serie ${c(m.serie)}</option>`).join("")}
            </select>
            ${a.length===0?'<p class="text-xs mt-1 text-red-600">No hay equipos disponibles. Un administrador debe registrarlos en el menú «Equipos».</p>':""}
          </div>
          <div>
            <label class="${Y}" for="fecha_entrega">Fecha y hora de entrega *</label>
            <input id="fecha_entrega" type="datetime-local" required value="${Nt()}" class="${W}" />
          </div>
          <div>
            <label class="${Y}" for="duracion_horas">Duración *</label>
            <select id="duracion_horas" class="${W}">
              <option value="24">24 horas</option><option value="48">48 horas</option>
            </select>
          </div>
          <p class="md:col-span-2 text-sm text-slate-600">
            Devolución prevista: <strong id="devolucion">—</strong>
          </p>
          <div>
            <label class="${Y}" for="aseguradora_id">Aseguradora</label>
            <select id="aseguradora_id" class="${W}">${Be(e)}</select>
          </div>
          <div>
            <label class="${Y}" for="regimen_id">Régimen</label>
            <select id="regimen_id" class="${W}">${Be(s)}</select>
          </div>
          <div class="md:col-span-2">
            <label class="${Y}" for="observaciones">Observaciones</label>
            <textarea id="observaciones" rows="2" class="${W}"></textarea>
          </div>
        </div>
      </section>

      <p id="error" class="text-sm text-red-600 hidden"></p>
      <div class="flex justify-end">
        <button id="guardar" class="bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg px-6 py-2">
          Guardar acta
        </button>
      </div>
    </form>`;const u=m=>t.querySelector(`#${m}`),l=m=>u(m).value.trim(),p=m=>l(m)||null;let n=null;const o=()=>{const m=new Date(l("fecha_entrega"));if(isNaN(m.getTime()))return u("devolucion").textContent="—";m.setHours(m.getHours()+Number(l("duracion_horas"))),u("devolucion").textContent=F(m)};u("fecha_entrega").addEventListener("input",o),u("duracion_horas").addEventListener("change",o),o();const i=u("estado-paciente"),v=async()=>{const m=l("numero_documento");if(!m)return;const b=(await q(`/pacientes?q=${encodeURIComponent(m)}`)).find(f=>f.numero_documento===m);if(b){n=b.id,u("tipo_documento").value=b.tipo_documento,u("nombre_completo").value=b.nombre_completo,u("ciudad_expedicion").value=b.ciudad_expedicion??"",u("vecino_de").value=b.vecino_de??"",u("telefono").value=b.telefono??"",u("correo").value=b.correo??"";let f=null;try{f=await q(`/actas/paciente/${b.id}/abierta`)}catch{f=null}f?(i.innerHTML=`⚠ <b>Paciente con préstamo activo</b> (acta #${f.numero} · ${c(f.equipo.tipo.nombre)} serie ${c(f.equipo.serie)} · estado: ${f.estado}). Puedes registrar la devolución o cancelar esa acta para liberar el equipo.`,i.className="text-xs mt-1 text-amber-700 bg-amber-50 rounded p-2",Ae(i,f,()=>w())):(i.textContent="Paciente encontrado: revisa y actualiza los datos si cambiaron.",i.className="text-xs mt-1 text-green-700",Ae(i,null,()=>{}))}else n=null,Ae(i,null,()=>{}),i.textContent="Paciente nuevo: se registrará al guardar el acta.",i.className="text-xs mt-1 text-amber-700"},w=async()=>{const m=await q("/equipos?estado=disponible").catch(()=>null);if(m){const $=u("equipo_id"),b=$.value;$.innerHTML='<option value="">— Seleccionar —</option>'+m.map(f=>`<option value="${f.id}" ${f.id===b?"selected":""}>${c(f.tipo.nombre)}${f.marca?" "+c(f.marca):""} — serie ${c(f.serie)}</option>`).join("")}await v().catch(()=>{})};u("buscar").addEventListener("click",()=>v().catch(()=>{})),u("numero_documento").addEventListener("keydown",m=>{m.key==="Enter"&&(m.preventDefault(),v().catch(()=>{}))});let h;u("numero_documento").addEventListener("input",()=>{n=null,i.textContent="Buscando...",i.className="text-xs mt-1 text-slate-500",clearTimeout(h),l("numero_documento").length>=5?h=window.setTimeout(()=>v().catch(()=>{}),600):i.textContent="Escribe la cédula para autocompletar los datos si ya prestó antes."}),u("numero_documento").addEventListener("blur",()=>{clearTimeout(h),!n&&l("numero_documento").length>=3&&v().catch(()=>{})});const g=u("error"),d=u("guardar");u("form").addEventListener("submit",async m=>{m.preventDefault(),g.classList.add("hidden"),d.disabled=!0,d.textContent="Guardando...";try{const $=JSON.stringify({tipo_documento:l("tipo_documento"),numero_documento:l("numero_documento"),nombre_completo:l("nombre_completo"),ciudad_expedicion:p("ciudad_expedicion"),vecino_de:p("vecino_de"),telefono:p("telefono"),correo:l("correo")}),b=n?await q(`/pacientes/${n}`,{method:"PUT",body:$}):await q("/pacientes",{method:"POST",body:$}),f=await q("/actas",{method:"POST",body:JSON.stringify({paciente_id:b.id,equipo_id:l("equipo_id"),aseguradora_id:l("aseguradora_id")?Number(l("aseguradora_id")):null,regimen_id:l("regimen_id")?Number(l("regimen_id")):null,fecha_entrega:l("fecha_entrega")+":00",duracion_horas:Number(l("duracion_horas")),observaciones:p("observaciones")})});kt(t,f)}catch($){g.textContent=$ instanceof k?$.message:"No se pudo conectar con el servidor",g.classList.remove("hidden"),d.disabled=!1,d.textContent="Guardar acta"}})}async function kt(t,a){const e=new Set;let s=a.estado,r=null,u=!1,l=null;try{l=await Ze();for(const n of await q(`/actas/${a.id}/firmas`))e.add(n.rol),n.rol==="PACIENTE"&&n.motivo_no_firma&&(r=n.motivo_no_firma),n.rol==="ENFERMERA"&&l.tiene_firma&&(u=!0)}catch{}const p=(n="",o=!1)=>{var $,b,f;const i=e.has("PACIENTE")&&e.has("ENFERMERA"),v=(y,D,z,R)=>`
      <div class="rounded-xl border ${z?"border-green-300 bg-green-50":"border-slate-200 bg-white"} p-4 text-left space-y-3 transition">
        <div class="flex items-center gap-2"><span class="text-xl">${z?"✅":"⬜"}</span><p class="font-semibold text-slate-900">${y}</p></div>
        <p class="text-sm ${z?"text-green-800":"text-slate-500"}">${D}</p>
        <div class="flex gap-2 flex-wrap">${R}</div>
      </div>`,w="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-3 py-1.5 text-sm font-medium",h="bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg px-3 py-1.5 text-sm font-medium",g=v("Paciente",e.has("PACIENTE")?r?`🚫 No puede firmar: ${c(r)}`:"Firmó el acta":"Pendiente de firma",e.has("PACIENTE"),`<button id="firma-paciente" class="${w}">${e.has("PACIENTE")?"Cambiar":"Firmar / no puede firmar"}</button>
       ${e.has("PACIENTE")?"":`<button id="firma-celular" class="${h}">📱 Que firme en su celular</button>`}`),d=v("Enfermera",e.has("ENFERMERA")?u?"Firma cargada automáticamente desde tu perfil":"Firmó el acta":l!=null&&l.tiene_firma?"Pendiente de firma":'Pendiente. <a href="#/cuenta" class="underline text-blue-700">Guarda tu firma en «Mi cuenta»</a> y se cargará sola en cada acta.',e.has("ENFERMERA"),`<button id="firma-enfermera" class="${e.has("ENFERMERA")?h:w}">${e.has("ENFERMERA")?"Volver a firmar":"Firmar"}</button>`);t.innerHTML=`
      <div class="bg-white rounded-2xl shadow p-8 text-center space-y-5 max-w-3xl mx-auto">
        <div><div class="text-4xl mb-1">📄</div><h2 class="text-xl font-semibold text-slate-900">Acta #${a.numero} guardada</h2></div>
        <p class="text-slate-600">
          ${c(a.paciente.nombre_completo)} — ${c(a.equipo.tipo.nombre)} serie ${c(a.equipo.serie)}<br />
          Devolución prevista: ${a.fecha_devolucion_prevista?F(new Date(a.fecha_devolucion_prevista)):"—"}<br />
          Correo: ${c(a.paciente.correo)||"<span class='text-red-600'>sin correo</span>"}
        </p>
        <div class="grid sm:grid-cols-2 gap-4 escalonado">${g}${d}</div>
        ${i?`<div class="flex justify-center gap-3 flex-wrap">
                <button id="ver-pdf" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Ver PDF</button>
                <button id="enviar" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2 font-medium"
                  ${s==="ENVIADA"?"disabled":""}>${s==="ENVIADA"?"Enviada ✔":"Revisar y enviar por correo"}</button>
              </div>
              <p class="text-xs text-slate-500">Si no la envías ahora, queda en «Por enviar» en el inicio.</p>`:'<p class="text-sm text-slate-400">Cuando estén las dos firmas podrás revisar y enviar el acta.</p>'}
        <p class="text-sm ${o?"text-red-600":"text-green-700"}">${c(n)}</p>
        <div class="pt-2 flex justify-center gap-3">
          <button id="otra" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2">Nueva acta</button>
          <a href="#/" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Inicio</a>
        </div>
      </div>`;const m=async(y,D,z)=>{try{const R=await q(`/actas/${a.id}/firmas`,{method:"POST",body:JSON.stringify(y)});e.add(D),s=R.estado,r=D==="PACIENTE"?y.no_puede_firmar?String(y.motivo_no_firma):null:r,D==="ENFERMERA"&&(u=!1),V(z,"ok"),p()}catch(R){p(R instanceof k?R.message:"No se pudo guardar la firma",!0)}};t.querySelector("#firma-paciente").addEventListener("click",async()=>{const y=await Et(a);y&&await m(y,"PACIENTE",y.no_puede_firmar?"Quedó constancia de que el paciente no puede firmar.":"Firma del paciente guardada.")}),t.querySelector("#firma-enfermera").addEventListener("click",async()=>{const y=await yt({titulo:"Firma de la enfermera",nombre:l==null?void 0:l.nombre,documento:(l==null?void 0:l.documento)??""});y&&await m({rol:"ENFERMERA",firmante_nombre:y.nombre,firmante_documento:y.documento,imagen:y.imagen},"ENFERMERA","Firma de la enfermera guardada.")}),($=t.querySelector("#firma-celular"))==null||$.addEventListener("click",async()=>{try{const y=await q(`/actas/${a.id}/enlace-firma`,{method:"POST"}),D=K(`<div class="p-6 space-y-4 text-center">
            <h3 class="text-lg font-semibold text-slate-900">Firma desde el celular del paciente</h3>
            <p class="text-sm text-slate-600">Pídele que escanee este código con la cámara de su celular. <b>Debe estar conectado al mismo Wi‑Fi de la IPS.</b></p>
            <img src="data:image/png;base64,${y.qr_png_base64}" alt="Código QR" class="w-56 h-56 mx-auto border rounded-xl p-2" />
            <p class="text-xs text-slate-400 break-all select-all">${c(y.url)}</p>
            <p class="text-sm text-blue-800 font-medium animate-pulse">Esperando la firma del paciente...</p>
            <p class="text-xs text-slate-400">El enlace sirve una sola vez y vence en ${Math.round((new Date(y.expira_en).getTime()-Date.now())/6e4)} minutos.</p>
            <button id="f-cancelar" class="bg-slate-100 hover:bg-slate-200 rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>`,"max-w-sm"),z=()=>{clearInterval(R),D.cerrar()},R=window.setInterval(async()=>{if(!D.overlay.isConnected)return clearInterval(R);try{(await q(`/actas/${a.id}/firmas`)).some(U=>U.rol==="PACIENTE")&&(z(),e.add("PACIENTE"),s=(await q(`/actas/${a.id}`)).estado,V("El paciente firmó desde su celular.","ok"),p())}catch{}},3e3);D.q("#f-cancelar").addEventListener("click",z)}catch(y){p(y instanceof k?y.message:"No se pudo crear el enlace de firma",!0)}}),(b=t.querySelector("#ver-pdf"))==null||b.addEventListener("click",()=>me(a.id).catch(y=>p(y.message,!0))),(f=t.querySelector("#enviar"))==null||f.addEventListener("click",async()=>{const y=await st({...a,estado:s});a=y.acta,y.enviada&&(s="ENVIADA"),p(y.enviada?"Correo enviado.":"")}),t.querySelector("#otra").addEventListener("click",()=>ot(t))};p()}const Ct={LOGIN:"Inicio de sesión",LOGIN_FALLIDO:"Intento de sesión fallido",CAMBIAR_PASSWORD:"Cambio de contraseña",CREAR_ACTA:"Acta creada",FIRMAR_ACTA:"Acta firmada",CORREGIR_ACTA:"Acta corregida",ANULAR_ACTA:"Acta anulada",DEVOLVER_ACTA:"Equipo devuelto",ENVIAR_CORREO:"Acta enviada por correo",ENVIAR_CORREO_ERROR:"Error al enviar correo",CREAR_PACIENTE:"Paciente creado",EDITAR_PACIENTE:"Paciente editado",CREAR_EQUIPO:"Equipo creado",EDITAR_EQUIPO:"Equipo editado",ELIMINAR_EQUIPO:"Equipo eliminado",FOTO_EQUIPO:"Foto de equipo cambiada",QUITAR_FOTO_EQUIPO:"Foto de equipo quitada",ENLACE_FIRMA:"Enlace de firma creado",FIRMA_REMOTA:"Firma desde el celular",ENVIAR_COMPROBANTE:"Comprobante de devolución enviado",RECORDATORIO_DEVOLUCION:"Recordatorio de devolución enviado",ALERTA_VENCIDAS:"Alerta de vencidas enviada",CREAR_RESPALDO:"Copia de seguridad creada",CREAR_USUARIO:"Usuario creado",EDITAR_USUARIO:"Usuario editado",RESET_PASSWORD:"Contraseña restablecida"},Ve=t=>Ct[t]??t,Ge=50;function St(t){if(!t)return"";const a=[],e=t.cambios;for(const[s,r]of Object.entries(t))s!=="cambios"&&a.push(`${s}: ${typeof r=="object"?JSON.stringify(r):r}`);if(e)for(const[s,r]of Object.entries(e))a.push(`${s}: ${(r==null?void 0:r[0])??"—"} → ${(r==null?void 0:r[1])??"—"}`);return a.join(" · ")}async function Tt(t,a){if(a.rol!=="ADMIN"){t.innerHTML='<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden ver la auditoría.</div>';return}let e=[],s=!1;t.innerHTML=`
    <div class="space-y-6">
      ${de("Administración","Auditoría","Quién hizo qué y cuándo: actas, envíos, devoluciones, equipos y usuarios.")}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <form id="filtros" class="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div><label class="${S}">Acción</label><select id="f-accion" class="${N}"><option value="">Todas</option></select></div>
          <div><label class="${S}">Usuario</label><input id="f-usuario" class="${N}" placeholder="Nombre o usuario" /></div>
          <div><label class="${S}">Desde</label><input id="f-desde" type="date" class="${N}" /></div>
          <div><label class="${S}">Hasta</label><input id="f-hasta" type="date" class="${N}" /></div>
          <div class="flex gap-2"><button class="${J} flex-1">Filtrar</button><button type="button" id="limpiar" class="${H}">Limpiar</button></div>
        </form>
        <p id="msg" class="text-sm text-slate-500"></p>
        <div class="overflow-auto"><table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-slate-400 border-b"><tr><th class="py-2 pr-3">Fecha</th><th class="pr-3">Usuario</th><th class="pr-3">Acción</th><th class="pr-3">Detalle</th><th>IP</th></tr></thead>
          <tbody id="filas" class="divide-y"></tbody></table></div>
        <div class="text-center"><button id="mas" class="${H} hidden">Cargar más</button></div>
      </section>
    </div>`;const r=o=>t.querySelector(`#${o}`),u=o=>r(o).value.trim(),l=()=>{r("filas").innerHTML=e.map(o=>{const i=o.accion.includes("FALLIDO")||o.accion.includes("ERROR");return`<tr><td class="py-2 pr-3 whitespace-nowrap text-slate-600">${F(new Date(o.fecha))}</td>
          <td class="pr-3">${c(o.usuario??"—")}<br /><span class="text-xs text-slate-400">${c(o.username)}</span></td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${i?"bg-red-100 text-red-700":"bg-blue-50 text-blue-800"}">${c(Ve(o.accion))}</span></td>
          <td class="pr-3 text-slate-600 max-w-md break-words">${c(St(o.detalle))}</td>
          <td class="text-slate-400 whitespace-nowrap">${c(o.ip)}</td></tr>`}).join(""),r("msg").textContent=e.length?`${e.length} registro(s) mostrados.`:"No hay registros con esos filtros.",r("mas").classList.toggle("hidden",!s)},p=o=>{const i=new URLSearchParams({limit:String(Ge),offset:String(o)});for(const[v,w]of[["accion","f-accion"],["usuario","f-usuario"],["desde","f-desde"],["hasta","f-hasta"]])u(w)&&i.set(v,u(w));return q(`/auditoria?${i}`)},n=async(o=!1)=>{try{const i=await p(o?e.length:0);e=o?[...e,...i]:i,s=i.length===Ge,l()}catch(i){r("msg").textContent=i instanceof k?i.message:"No se pudo cargar la auditoría."}};r("filtros").addEventListener("submit",o=>{o.preventDefault(),n()}),r("limpiar").addEventListener("click",()=>{r("filtros").reset(),n()}),r("mas").addEventListener("click",()=>n(!0));try{const o=await q("/auditoria/acciones");r("f-accion").insertAdjacentHTML("beforeend",o.map(i=>`<option value="${c(i)}">${c(Ve(i))}</option>`).join(""))}catch{}await n()}function Je(t,a,e,s=!1){t.innerHTML=`
    <div class="${s?"max-w-md":"max-w-3xl"} mx-auto space-y-6 escalonado">
      ${s?"":Pt(a)}
      <form id="form" class="bg-white rounded-2xl shadow p-7 space-y-4 ${s?"":"max-w-xl"}">
        <div>
          <h2 class="text-xl font-semibold text-slate-900">${s?"Crea tu contraseña":"Cambiar contraseña"}</h2>
          <p class="text-sm text-slate-500">${s?"Por seguridad debes cambiar la contraseña temporal antes de continuar.":`Usuario: <b>${c(a.username)}</b> · ${c(a.nombre)}`}</p>
        </div>
        <div><label class="${S}">Contraseña actual</label><input id="actual" type="password" required autocomplete="current-password" class="${N}" /></div>
        <div><label class="${S}">Nueva contraseña (mínimo 8 caracteres)</label><input id="nueva" type="password" required minlength="8" autocomplete="new-password" class="${N}" /></div>
        <div><label class="${S}">Repite la nueva contraseña</label><input id="repite" type="password" required autocomplete="new-password" class="${N}" /></div>
        <p id="msg" class="text-sm hidden"></p>
        <button id="guardar" class="${J} w-full">Cambiar contraseña</button>
      </form>
    </div>`;const r=l=>t.querySelector(`#${l}`),u=(l,p=!1)=>{r("msg").textContent=l,r("msg").className=`text-sm ${p?"text-green-700":"text-red-600"}`};r("form").addEventListener("submit",async l=>{l.preventDefault();const p=r("actual").value,n=r("nueva").value;if(n.length<8)return u("La nueva contraseña debe tener al menos 8 caracteres.");if(n!==r("repite").value)return u("Las contraseñas nuevas no coinciden.");if(n===p)return u("La nueva contraseña debe ser distinta de la actual.");r("guardar").disabled=!0;try{await q("/auth/cambiar-password",{method:"POST",body:JSON.stringify({password_actual:p,password_nueva:n})}),u("Contraseña actualizada.",!0),V("Contraseña actualizada.","ok"),r("form").reset(),setTimeout(e,s?600:1200)}catch(o){u(o instanceof k?o.message:"No se pudo cambiar la contraseña")}r("guardar").disabled=!1}),s||jt(t,a)}function Pt(t){return`
    <section class="bg-white rounded-2xl shadow p-7 space-y-5">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">${A.firma}</div>
        <div><h2 class="text-xl font-semibold text-slate-900">Mi firma digital</h2>
          <p class="text-sm text-slate-500">Guárdala una vez y se cargará sola en cada acta que diligencies.</p></div>
      </div>

      <div class="grid md:grid-cols-[1fr_auto] gap-4 items-end">
        <div><label class="${S}">Mi cédula (sale bajo la firma en el acta)</label>
          <input id="f-doc" class="${N}" value="${c(t.documento)}" placeholder="Ej: 25555111" maxlength="30" /></div>
        <button id="f-doc-guardar" class="${H}">Guardar cédula</button>
      </div>

      <div>
        <p class="${S}">Firma guardada</p>
        <div id="f-actual" class="h-28 rounded-xl border border-slate-200 flex items-center justify-center text-sm text-slate-400"
          style="background-image:linear-gradient(45deg,#f1f5f9 25%,transparent 25%,transparent 75%,#f1f5f9 75%),linear-gradient(45deg,#f1f5f9 25%,transparent 25%,transparent 75%,#f1f5f9 75%);background-size:16px 16px;background-position:0 0,8px 8px">
          Cargando...</div>
      </div>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1 text-sm font-medium max-w-sm">
          <button type="button" data-ftab="dibujar" class="rounded-lg py-2">✍️ Dibujarla</button>
          <button type="button" data-ftab="subir" class="rounded-lg py-2">🖼️ Subir imagen</button>
        </div>

        <div id="f-dibujar" class="space-y-2">
          <canvas id="f-lienzo" class="w-full max-w-xl h-40 border-2 border-dashed border-slate-300 rounded-xl bg-white cursor-crosshair"></canvas>
          <button type="button" id="f-borrar" class="text-sm text-slate-500 underline">Borrar</button>
        </div>

        <div id="f-subir" class="hidden space-y-2">
          <label class="block max-w-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 rounded-xl p-6 text-center cursor-pointer transition">
            <input id="f-archivo" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" />
            <span id="f-archivo-texto" class="text-sm text-slate-500">Haz clic para elegir una foto o escaneo de tu firma (PNG, JPG o WEBP, máx. 6 MB)</span>
            <img id="f-vista" class="hidden mx-auto mt-3 max-h-28" alt="Vista previa" />
          </label>
          <p class="text-xs text-slate-400">Consejo: firma con lapicero negro o azul sobre papel blanco y toma la foto con buena luz. El fondo se quita solo.</p>
        </div>

        <p id="f-msg" class="text-sm hidden"></p>
        <div class="flex gap-2 flex-wrap">
          <button id="f-guardar" class="${J}">Guardar mi firma</button>
          <button id="f-quitar" class="${ae} bg-red-50 hover:bg-red-100 text-red-700 hidden">Eliminar firma guardada</button>
        </div>
      </div>
    </section>`}function jt(t,a){const e=o=>t.querySelector(`#${o}`);let s="dibujar",r=null;const u=$e(e("f-lienzo"),2.8),l=(o,i=!1)=>{e("f-msg").textContent=o,e("f-msg").className=`text-sm ${i?"text-green-700":"text-red-600"}`},p=()=>{t.querySelectorAll("[data-ftab]").forEach(o=>{o.className=`rounded-lg py-2 ${o.dataset.ftab===s?"bg-white shadow text-blue-800":"text-slate-500"}`}),e("f-dibujar").classList.toggle("hidden",s!=="dibujar"),e("f-subir").classList.toggle("hidden",s!=="subir"),s==="dibujar"&&u.ajustar()};p(),t.querySelectorAll("[data-ftab]").forEach(o=>o.addEventListener("click",()=>{s=o.dataset.ftab,p()}));const n=async()=>{const o=e("f-actual");try{const i=await et("/perfil/firma.png");o.innerHTML=`<img src="${i}?t=${Date.now()}" class="max-h-24 anillo-exito" alt="Mi firma" />`,e("f-quitar").classList.remove("hidden")}catch{o.textContent="Aún no has guardado tu firma.",e("f-quitar").classList.add("hidden")}};n(),e("f-borrar").addEventListener("click",()=>u.limpiar()),e("f-archivo").addEventListener("change",o=>{var w;const i=(w=o.target.files)==null?void 0:w[0];if(!i)return;if(!/^image\/(png|jpeg|webp)$/.test(i.type))return l("El archivo debe ser PNG, JPG o WEBP.");if(i.size>6*1024*1024)return l("La imagen pesa más de 6 MB.");const v=new FileReader;v.onload=()=>{r=String(v.result),e("f-vista").src=r,e("f-vista").classList.remove("hidden"),e("f-archivo-texto").textContent=i.name,l("")},v.readAsDataURL(i)}),e("f-doc-guardar").addEventListener("click",async()=>{const o=e("f-doc").value.trim();if(o.length<3)return l("Escribe tu número de cédula.");try{await q("/perfil/documento",{method:"PUT",body:JSON.stringify({documento:o})}),a.documento=o,l(""),V("Cédula guardada.","ok")}catch(i){l(i instanceof k?i.message:"No se pudo guardar la cédula")}}),e("f-guardar").addEventListener("click",async()=>{let o;if(s==="dibujar"){if(u.vacio())return l("Dibuja tu firma en el recuadro.");o=u.aPng()}else{if(!r)return l("Elige primero una imagen de tu firma.");o=r}const i=e("f-guardar");i.disabled=!0,i.textContent="Guardando...";try{await q("/perfil/firma",{method:"PUT",body:JSON.stringify({imagen:o})});const v=e("f-doc").value.trim();v.length>=3&&v!==a.documento&&(await q("/perfil/documento",{method:"PUT",body:JSON.stringify({documento:v})}),a.documento=v),a.tiene_firma=!0,l(""),V("Firma guardada. Se cargará sola en tus próximas actas.","ok"),u.limpiar(),await n()}catch(v){l(v instanceof k?v.message:"No se pudo guardar la firma")}i.disabled=!1,i.textContent="Guardar mi firma"}),e("f-quitar").addEventListener("click",async()=>{if(confirm("¿Eliminar tu firma guardada? Tendrás que firmar manualmente cada acta."))try{await q("/perfil/firma",{method:"DELETE"}),a.tiene_firma=!1,V("Firma eliminada.","info"),await n()}catch(o){l(o instanceof k?o.message:"No se pudo eliminar la firma")}})}async function Dt(t,a){t.innerHTML='<p class="text-slate-500">Cargando equipo...</p>';let e,s;try{[e,s]=await Promise.all([q("/equipos").then(l=>{const p=l.find(n=>n.id===a);if(!p)throw new k(404,"Equipo no encontrado");return p}),q(`/equipos/${a}/historial`)])}catch(l){t.innerHTML=`<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">${c(l instanceof k?l.message:"No se pudo cargar el equipo")}. <a class="text-blue-700 underline" href="#/">Volver</a></div>`;return}const r=ge[e.estado]??{nombre:e.estado,clase:"bg-slate-100"},u=s.find(l=>["FIRMADA","ENVIADA","BORRADOR"].includes(l.estado));t.innerHTML=`
    <div class="space-y-6">
      <div class="bg-white rounded-2xl shadow overflow-hidden md:flex">
        <div class="md:w-72 aspect-[4/3] md:aspect-auto bg-blue-50/60 flex items-center justify-center text-blue-300 shrink-0">
          ${e.tiene_foto?'<img id="foto" class="w-full h-full object-cover" alt="" />':`<div class="scale-[3]">${A.equipos}</div>`}
        </div>
        <div class="p-6 space-y-2 flex-1">
          <p class="text-xs uppercase tracking-wide text-slate-400">${c(e.tipo.nombre)}${e.marca?" · "+c(e.marca):""}</p>
          <h2 class="text-2xl font-semibold text-slate-900">Serie ${c(e.serie)}</h2>
          <p><span class="text-xs px-2.5 py-1 rounded-full font-medium ${r.clase}">${r.nombre}</span></p>
          ${e.modelo?`<p class="text-sm text-slate-600">Modelo ${c(e.modelo)}</p>`:""}
          ${e.notas?`<p class="text-sm text-slate-500">${c(e.notas)}</p>`:""}
          ${u?`<p class="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">En préstamo: <b>${c(u.paciente_nombre)}</b> (acta #${u.numero}).</p>`:""}
          <div class="pt-2 flex gap-2 flex-wrap">
            ${e.estado==="DISPONIBLE"?`<a href="#/nueva?equipo=${e.id}" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium">+ Nueva acta con este equipo</a>`:""}
            <a href="#/" class="bg-slate-100 hover:bg-slate-200 rounded-lg px-4 py-2 text-sm">Inicio</a>
          </div>
        </div>
      </div>
      <section class="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 class="font-semibold text-slate-900">Historial de préstamos (${s.length})</h3>
        ${s.length?`<div class="overflow-auto"><table class="w-full text-left text-sm"><thead class="text-xs uppercase text-slate-400 border-b"><tr>
                <th class="py-2 pr-3">Acta</th><th class="pr-3">Paciente</th><th class="pr-3">Entrega</th><th class="pr-3">Devolución</th><th class="pr-3">Estado</th><th></th></tr></thead>
              <tbody class="divide-y">${s.map(l=>{const p=je[l.estado]??{nombre:l.estado,clase:"bg-slate-100"},n=l.fecha_devolucion_real?F(new Date(l.fecha_devolucion_real)):l.fecha_devolucion_prevista?`<span class="text-slate-400">prevista ${F(new Date(l.fecha_devolucion_prevista))}</span>`:"—";return`<tr data-acta="${l.acta_id}"><td class="py-2 pr-3 font-medium">#${l.numero}</td><td class="pr-3">${c(l.paciente_nombre)}</td>
                    <td class="pr-3 whitespace-nowrap">${F(new Date(l.fecha_entrega))}</td><td class="pr-3 whitespace-nowrap">${n}</td>
                    <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${p.clase}">${p.nombre}</span></td>
                    <td>${["FIRMADA","ENVIADA","DEVUELTA"].includes(l.estado)?'<button data-pdf class="text-blue-700 hover:underline">PDF</button>':""}</td></tr>`}).join("")}</tbody></table></div>`:'<p class="text-slate-400 text-sm py-4 text-center">Este equipo todavía no se ha prestado.</p>'}
      </section>
    </div>`,e.tiene_foto&&Ce(e.id).then(l=>l&&(t.querySelector("#foto").src=l)),t.addEventListener("click",l=>{var o;const p=l.target.closest("[data-pdf]"),n=(o=p==null?void 0:p.closest("[data-acta]"))==null?void 0:o.dataset.acta;n&&me(n).catch(()=>{})})}const Rt=8*1024*1024;async function Ot(t,a){if(a.rol!=="ADMIN"){t.innerHTML='<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden gestionar equipos. <a href="#/" class="text-blue-700 underline">Volver</a></div>';return}let e=[],s=[],r="",u="",l=!0;t.innerHTML=`
    <div class="space-y-6">
      ${de("Administración","Equipos","Holter y MAPA: foto, estado e historial de préstamos.",`<button id="nuevo" class="${J} inline-flex items-center gap-2 !rounded-xl !px-5 !py-2.5">${A.mas}Nuevo equipo</button>`)}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex gap-3 flex-wrap items-center justify-between">
          <div id="conteo" class="flex gap-2 flex-wrap text-xs"></div>
          <div class="flex gap-2 flex-wrap">
            <input id="buscar" placeholder="Buscar por serie, marca o modelo..." class="${N} !w-64" />
            <select id="filtro" class="${N} !w-auto">
              <option value="">Todos los estados</option>
              ${Object.entries(ge).map(([d,m])=>`<option value="${d}">${m.nombre}</option>`).join("")}
            </select>
          </div>
        </div>
        <p id="msg" class="text-sm"></p>
        <div id="lista" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"></div>
      </section>
    </div>`;const p=d=>t.querySelector(`#${d}`),n=(d,m=!1)=>{d&&V(d,m?"error":"ok"),p("msg").textContent=d,p("msg").className=`text-sm ${m?"text-red-600":"text-green-700 font-medium"}`},o=async()=>{[e,s]=await Promise.all([q("/equipos"),q("/equipos/tipos")]),i()},i=()=>{const d=b=>e.filter(f=>f.estado===b).length;p("conteo").innerHTML=Object.entries(ge).map(([b,f])=>`<span class="px-2.5 py-1 rounded-full font-medium ${f.clase}">${f.nombre}: ${d(b)}</span>`).join("");const m=u.trim().toLowerCase(),$=e.filter(b=>(!r||b.estado===r)&&(!m||`${b.serie} ${b.marca??""} ${b.modelo??""} ${b.tipo.nombre}`.toLowerCase().includes(m)));if(!$.length){p("lista").innerHTML=`<p class="col-span-full py-10 text-center text-slate-400">${e.length?"No hay equipos que coincidan.":"Aún no hay equipos. Crea el primero con «+ Nuevo equipo»."}</p>`;return}p("lista").classList.toggle("escalonado",l),l=!1,p("lista").innerHTML=$.map(b=>{const f=ge[b.estado]??{nombre:b.estado,clase:"bg-slate-100"};return`
        <article class="elevar rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col" data-id="${b.id}">
          <div class="relative aspect-[4/3] bg-blue-50/60 flex items-center justify-center text-blue-300">
            ${b.tiene_foto?'<img data-foto class="w-full h-full object-cover" alt="Foto del equipo" />':`<div class="scale-[2.5]">${A.equipos}</div>`}
            <span class="absolute top-2 left-2 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${f.clase}">${f.nombre}</span>
          </div>
          <div class="p-4 flex-1 flex flex-col gap-1">
            <p class="text-xs uppercase tracking-wide text-slate-400">${c(b.tipo.nombre)}${b.marca?" · "+c(b.marca):""}</p>
            <a href="#/equipo/${b.id}" class="font-semibold text-slate-900 text-lg leading-tight hover:underline">Serie ${c(b.serie)}</a>
            <p class="text-sm text-slate-500">${b.modelo?"Modelo "+c(b.modelo):"&nbsp;"}</p>
            ${b.notas?`<p class="text-xs text-slate-500 line-clamp-2">${c(b.notas)}</p>`:""}
            <div class="mt-auto pt-3 flex gap-2 flex-wrap">
              <button data-historial class="${ae} !px-3 !py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800">Historial</button>
              <button data-qr class="${ae} !px-3 !py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800">QR</button>
              <button data-editar class="${ae} !px-3 !py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700">Editar</button>
              <button data-eliminar class="${ae} !px-3 !py-1.5 bg-red-50 hover:bg-red-100 text-red-700">Eliminar</button>
            </div>
          </div>
        </article>`}).join(""),p("lista").querySelectorAll("article").forEach(async b=>{const f=b.querySelector("[data-foto]");if(!f)return;const y=await Ce(b.dataset.id);y&&(f.src=y)})},v=d=>{const m=(d==null?void 0:d.estado)==="PRESTADO";let $=null,b=!1;const f=K(`<form class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">${d?"Editar equipo":"Nuevo equipo"}</h3>
        <div class="flex gap-4 items-start">
          <div id="e-preview" class="w-32 h-32 shrink-0 rounded-xl bg-slate-100 border border-dashed border-slate-300 overflow-hidden flex items-center justify-center text-slate-300"></div>
          <div class="space-y-2 text-sm">
            <label class="${H} inline-flex items-center gap-2 cursor-pointer">${A.camara}<span id="e-foto-texto">${d!=null&&d.tiene_foto?"Cambiar foto":"Subir foto"}</span>
              <input id="e-foto" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" /></label>
            <button type="button" id="e-quitar" class="block text-red-600 hover:underline text-xs ${d!=null&&d.tiene_foto?"":"hidden"}">Quitar foto</button>
            <p class="text-xs text-slate-400">JPG, PNG o WEBP. Máximo 8 MB.</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="${S}">Tipo *</label>
            <select id="e-tipo" required class="${N}">${s.map(O=>`<option value="${O.id}" ${(d==null?void 0:d.tipo.id)===O.id?"selected":""}>${c(O.nombre)}</option>`).join("")}</select></div>
          <div class="col-span-2"><label class="${S}">Serie *</label>
            <input id="e-serie" required maxlength="80" class="${N}" value="${c(d==null?void 0:d.serie)}" placeholder="Ej: EVO-2231" /></div>
          <div><label class="${S}">Marca</label><input id="e-marca" maxlength="100" class="${N}" value="${c(d==null?void 0:d.marca)}" /></div>
          <div><label class="${S}">Modelo</label><input id="e-modelo" maxlength="100" class="${N}" value="${c(d==null?void 0:d.modelo)}" /></div>
          ${d?`<div class="col-span-2"><label class="${S}">Estado</label>
                  <select id="e-estado" class="${N}" ${m?"disabled":""}>
                    ${(m?["PRESTADO"]:["DISPONIBLE","MANTENIMIENTO","BAJA"]).map(O=>`<option value="${O}" ${d.estado===O?"selected":""}>${ge[O].nombre}</option>`).join("")}
                  </select>
                  ${m?'<p class="text-xs text-slate-500 mt-1">Está prestado: se libera al registrar la devolución del acta en el inicio.</p>':""}
                </div>`:""}
          <div class="col-span-2"><label class="${S}">Notas</label><textarea id="e-notas" rows="2" class="${N}">${c(d==null?void 0:d.notas)}</textarea></div>
        </div>
        <p id="e-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="e-cancelar" class="${H}">Cancelar</button>
          <button id="e-guardar" class="${J}">Guardar</button>
        </div>
      </form>`,"max-w-xl"),y=f.q("#e-preview"),D=()=>y.innerHTML=`<div class="scale-[2]">${A.camara}</div>`,z=O=>y.innerHTML=`<img src="${O}" class="w-full h-full object-cover" alt="" />`;d!=null&&d.tiene_foto?(D(),Ce(d.id).then(O=>O&&!$&&!b&&z(O))):D();const R=O=>{f.q("#e-error").textContent=O,f.q("#e-error").classList.remove("hidden")};f.q("#e-foto").addEventListener("change",O=>{var X;const U=(X=O.target.files)==null?void 0:X[0];if(U){if(!/^image\/(jpeg|png|webp)$/.test(U.type))return R("La foto debe ser JPG, PNG o WEBP.");if(U.size>Rt)return R("La foto pesa más de 8 MB.");f.q("#e-error").classList.add("hidden"),$=U,b=!1,z(URL.createObjectURL(U)),f.q("#e-quitar").classList.remove("hidden")}}),f.q("#e-quitar").addEventListener("click",()=>{$=null,b=!!(d!=null&&d.tiene_foto),f.q("#e-foto").value="",D(),f.q("#e-quitar").classList.add("hidden")}),f.q("#e-cancelar").addEventListener("click",f.cerrar),f.q("form").addEventListener("submit",async O=>{O.preventDefault();const U=G=>f.q(G).value.trim();if(!U("#e-serie"))return R("La serie es obligatoria.");const X={tipo_equipo_id:Number(U("#e-tipo")),serie:U("#e-serie"),marca:U("#e-marca")||null,modelo:U("#e-modelo")||null,notas:U("#e-notas")||null},P=f.q("#e-guardar");P.disabled=!0,P.textContent="Guardando...";try{let G;if(d?(X.estado=m?"PRESTADO":U("#e-estado"),G=await q(`/equipos/${d.id}`,{method:"PUT",body:JSON.stringify(X)})):G=await q("/equipos",{method:"POST",body:JSON.stringify(X)}),$){const Q=new FormData;Q.append("archivo",$),await q(`/equipos/${G.id}/foto`,{method:"POST",body:Q}),_e(G.id)}else b&&(await q(`/equipos/${G.id}/foto`,{method:"DELETE"}),_e(G.id));f.cerrar(),await o(),n(d?"Equipo actualizado.":"Equipo creado.")}catch(G){R(G instanceof k?G.message:"No se pudo guardar"),P.disabled=!1,P.textContent="Guardar"}})},w=d=>{const m=K(`<div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-red-700">Eliminar equipo</h3>
        <p class="text-sm text-slate-600">¿Seguro que quieres eliminar el ${c(d.tipo.nombre)} serie <b>${c(d.serie)}</b>? Esta acción no se puede deshacer.</p>
        <p id="x-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2 flex-wrap">
          <button id="x-no" class="${H}">Cancelar</button>
          <button id="x-baja" class="${ae} bg-amber-100 hover:bg-amber-200 text-amber-900 hidden">Dar de baja en su lugar</button>
          <button id="x-si" class="${ft}">Sí, eliminar</button>
        </div>
      </div>`);m.q("#x-no").addEventListener("click",m.cerrar),m.q("#x-si").addEventListener("click",async()=>{try{await q(`/equipos/${d.id}`,{method:"DELETE"}),_e(d.id),m.cerrar(),await o(),n(`Equipo ${d.serie} eliminado.`)}catch($){m.q("#x-error").textContent=$ instanceof k?$.message:"No se pudo eliminar",m.q("#x-error").classList.remove("hidden"),$ instanceof k&&$.status===409&&d.estado!=="PRESTADO"&&m.q("#x-baja").classList.remove("hidden"),m.q("#x-si").classList.add("hidden")}}),m.q("#x-baja").addEventListener("click",async()=>{try{await q(`/equipos/${d.id}`,{method:"PUT",body:JSON.stringify({tipo_equipo_id:d.tipo.id,serie:d.serie,marca:d.marca,modelo:d.modelo,notas:d.notas??null,estado:"BAJA"})}),m.cerrar(),await o(),n(`Equipo ${d.serie} dado de baja.`)}catch($){m.q("#x-error").textContent=$ instanceof k?$.message:"No se pudo dar de baja"}})},h=async d=>{const m=K(`<div class="p-6 space-y-4 text-center">
        <div class="flex items-start justify-between"><h3 class="text-lg font-semibold text-slate-900">Código QR del equipo</h3>
          <button id="q-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button></div>
        <div id="q-img" class="w-56 h-56 mx-auto flex items-center justify-center text-slate-400 text-sm">Generando...</div>
        <p class="font-semibold text-slate-900">${c(d.tipo.nombre)} · serie ${c(d.serie)}</p>
        <p class="text-xs text-slate-500">Pega esta etiqueta en el equipo. Al escanearla se abre su ficha con el historial y se puede iniciar un acta.</p>
        <div class="flex justify-center gap-2"><button id="q-print" class="${J}" disabled>Imprimir etiqueta</button>
          <a href="#/equipo/${d.id}" id="q-ficha" class="${H}">Abrir ficha</a></div>
      </div>`,"max-w-sm");m.q("#q-x").addEventListener("click",m.cerrar),m.q("#q-ficha").addEventListener("click",m.cerrar);try{const $=await et(`/equipos/${d.id}/qr.png`);m.q("#q-img").innerHTML=`<img src="${$}" alt="QR" class="w-56 h-56" />`;const b=m.q("#q-print");b.disabled=!1,b.addEventListener("click",()=>{const f=window.open("","_blank","width=420,height=520");f&&(f.document.write(`<html><head><title>Etiqueta ${c(d.serie)}</title><style>
          body{font-family:Segoe UI,Arial,sans-serif;text-align:center;margin:0;padding:18px}
          .e{display:inline-block;border:2px solid #132b5f;border-radius:12px;padding:14px 18px}
          img{width:230px;height:230px}h2{margin:6px 0 0;color:#132b5f;font-size:20px}p{margin:2px 0;color:#475569;font-size:13px}
          </style></head><body><div class="e"><p style="font-weight:700;color:#132b5f">IPS NUEVA POPAYÁN · REHABILITAR</p>
          <img src="${$}"/><h2>${c(d.tipo.nombre)}</h2><p>Serie ${c(d.serie)}</p><p>Escanea para ver el historial</p></div>
          <script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`),f.document.close())})}catch{m.q("#q-img").textContent="No se pudo generar el QR."}},g=async d=>{const m=K(`<div class="p-6 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div><h3 class="text-lg font-semibold text-slate-900">Historial de préstamos</h3>
            <p class="text-sm text-slate-500">${c(d.tipo.nombre)} serie ${c(d.serie)}</p></div>
          <button id="h-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div id="h-cuerpo" class="text-sm text-slate-500">Cargando...</div>
      </div>`,"max-w-3xl");m.q("#h-x").addEventListener("click",m.cerrar);try{const $=await q(`/equipos/${d.id}/historial`);m.q("#h-cuerpo").innerHTML=$.length?`<div class="overflow-auto"><table class="w-full text-left">
            <thead class="text-xs uppercase text-slate-400 border-b"><tr>
              <th class="py-2 pr-3">Acta</th><th class="pr-3">Paciente</th><th class="pr-3">Entrega</th><th class="pr-3">Devolución</th><th class="pr-3">Estado</th><th></th></tr></thead>
            <tbody class="divide-y text-slate-700">${$.map(b=>{const f=je[b.estado]??{nombre:b.estado,clase:"bg-slate-100"},y=b.fecha_devolucion_real?F(new Date(b.fecha_devolucion_real)):b.fecha_devolucion_prevista?`<span class="text-slate-400">prevista ${F(new Date(b.fecha_devolucion_prevista))}</span>`:"—",D=["FIRMADA","ENVIADA","DEVUELTA"].includes(b.estado);return`<tr data-acta="${b.acta_id}"><td class="py-2 pr-3 font-medium">#${b.numero}</td>
                  <td class="pr-3">${c(b.paciente_nombre)}<br /><span class="text-xs text-slate-400">${c(b.paciente_documento)}</span></td>
                  <td class="pr-3 whitespace-nowrap">${F(new Date(b.fecha_entrega))}</td>
                  <td class="pr-3 whitespace-nowrap">${y}</td>
                  <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${f.clase}">${f.nombre}</span></td>
                  <td>${D?'<button data-pdf class="text-blue-700 hover:underline">PDF</button>':""}</td></tr>`}).join("")}</tbody></table></div>`:'<p class="py-6 text-center text-slate-400">Este equipo todavía no se ha prestado.</p>',m.q("#h-cuerpo").addEventListener("click",b=>{var D;const f=b.target.closest("[data-pdf]"),y=(D=f==null?void 0:f.closest("[data-acta]"))==null?void 0:D.dataset.acta;y&&me(y).catch(()=>{})})}catch{m.q("#h-cuerpo").textContent="No se pudo cargar el historial."}};p("nuevo").addEventListener("click",()=>v()),p("buscar").addEventListener("input",d=>{u=d.target.value,i()}),p("filtro").addEventListener("change",d=>{r=d.target.value,i()}),p("lista").addEventListener("click",d=>{const m=d.target,$=m.closest("[data-id]"),b=e.find(f=>f.id===($==null?void 0:$.dataset.id));b&&(m.closest("[data-editar]")?v(b):m.closest("[data-eliminar]")?w(b):m.closest("[data-historial]")?g(b):m.closest("[data-qr]")&&h(b))}),await o().catch(()=>n("No se pudo cargar los equipos.",!0))}const Se=t=>`
  <div class="min-h-screen bg-slate-50 p-4 flex items-start justify-center">
    <div class="w-full max-w-md space-y-4 py-4">
      <div class="bg-white rounded-xl p-3 w-48 mx-auto shadow-lg"><img src="/favicon.png" alt="IPS Nueva Popayán" /></div>
      ${t}
    </div>
  </div>`,Me=(t,a,e)=>Se(`<div class="bg-white rounded-2xl shadow-xl p-8 text-center space-y-3">
    <div class="text-5xl">${t}</div><h2 class="text-xl font-semibold text-slate-900">${a}</h2><p class="text-slate-600">${e}</p></div>`);async function It(t,a){t.innerHTML=Se('<p class="text-center text-blue-100">Cargando...</p>');let e;try{const u=await fetch(`/api/publico/firma/${encodeURIComponent(a)}`);if(!u.ok){const l=(await u.json().catch(()=>({}))).detail??"Este enlace no es válido";t.innerHTML=Me("⚠️","No se puede firmar",c(l));return}e=await u.json()}catch{t.innerHTML=Me("📶","Sin conexión","No se pudo conectar. Revisa que estés en el Wi‑Fi de la IPS e inténtalo de nuevo.");return}t.innerHTML=Se(`
    <form id="form" class="bg-white rounded-2xl shadow-xl p-6 space-y-4">
      <div><p class="text-xs uppercase tracking-widest text-slate-400">Acta de préstamo N° ${String(e.numero).padStart(6,"0")}</p>
        <h2 class="text-xl font-semibold text-slate-900">Hola, ${c(e.paciente_nombre.split(" ")[0])}</h2>
        <p class="text-sm text-slate-600">Revisa los datos y firma para recibir el equipo.</p></div>
      <div class="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
        <p><span class="text-slate-500">Nombre:</span> <b>${c(e.paciente_nombre)}</b></p>
        <p><span class="text-slate-500">Documento:</span> ${c(e.paciente_documento)}</p>
        <p><span class="text-slate-500">Equipo:</span> ${c(e.equipo)} · serie ${c(e.serie)}</p>
        <p><span class="text-slate-500">Entrega:</span> ${F(new Date(e.fecha_entrega))}</p>
        <p><span class="text-slate-500">Devolver antes de:</span> <b>${e.fecha_devolucion_prevista?F(new Date(e.fecha_devolucion_prevista)):"—"}</b></p>
      </div>
      <a href="/api/publico/firma/${encodeURIComponent(a)}/pdf" target="_blank" rel="noopener"
        class="block text-center bg-slate-100 hover:bg-slate-200 text-blue-800 font-medium rounded-lg py-2.5">📄 Leer el documento completo</a>
      <label class="flex items-start gap-2 text-sm text-slate-700"><input id="acepto" type="checkbox" class="w-5 h-5 mt-0.5" />
        <span>Leí el documento, los datos son correctos y acepto las condiciones del préstamo.</span></label>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Firma con el dedo</p>
        <canvas id="lienzo" class="w-full h-44 border-2 border-dashed border-slate-300 rounded-xl bg-white touch-none"></canvas>
        <button type="button" id="borrar" class="text-sm text-slate-500 underline mt-1">Borrar firma</button>
      </div>
      <p id="error" class="text-sm text-red-600 hidden"></p>
      <button id="enviar" class="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl py-3 text-lg disabled:opacity-50">Firmar acta</button>
    </form>`);const s=u=>t.querySelector(`#${u}`),r=$e(s("lienzo"));s("borrar").addEventListener("click",()=>r.limpiar()),s("form").addEventListener("submit",async u=>{u.preventDefault();const l=s("error");l.classList.add("hidden");const p=i=>{l.textContent=i,l.classList.remove("hidden")};if(!s("acepto").checked)return p("Marca la casilla para confirmar que leíste el documento.");if(r.vacio())return p("Dibuja tu firma en el recuadro.");const n=r.aPng(),o=s("enviar");o.disabled=!0,o.textContent="Enviando...";try{const i=await fetch(`/api/publico/firma/${encodeURIComponent(a)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imagen:n})});if(!i.ok)throw new Error((await i.json().catch(()=>({}))).detail??"No se pudo registrar la firma");t.innerHTML=Me("✅","¡Listo!","Tu firma quedó registrada. Devuelve el celular a la enfermera, que continuará con el proceso.")}catch(i){p(i instanceof Error?i.message:"No se pudo registrar la firma"),o.disabled=!1,o.textContent="Firmar acta"}})}const Ht=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,we=20,Qe=t=>t.split(" ").filter(Boolean).slice(0,2).map(a=>a[0]).join("").toUpperCase(),We=["bg-blue-100 text-blue-700","bg-indigo-100 text-indigo-700","bg-sky-100 text-sky-700","bg-cyan-100 text-cyan-700","bg-violet-100 text-violet-700"],Ye=t=>We[[...t].reduce((a,e)=>a+e.charCodeAt(0),0)%We.length];async function Ft(t){let a=[],e=0,s=0,r="",u="nombre",l=!1,p=!0;t.innerHTML=`
    <div class="space-y-6">
      ${de("Registro","Pacientes","Todos los pacientes registrados, con su historial de préstamos.",'<p id="total" class="text-sm text-slate-500"></p>')}
      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex gap-3 flex-wrap items-center">
          <input id="buscar" placeholder="Buscar por nombre, cédula o correo..." class="${N} md:max-w-sm" />
          <select id="orden" class="${N} !w-auto">
            <option value="nombre">Ordenar: nombre (A-Z)</option>
            <option value="reciente">Ordenar: préstamo más reciente</option>
            <option value="prestamos">Ordenar: más préstamos</option>
          </select>
          <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><input id="solo" type="checkbox" class="w-4 h-4" /> Solo con equipo en préstamo</label>
        </div>
        <p id="msg" class="text-sm text-red-600"></p>
        <div id="lista" class="divide-y"></div>
        <div id="paginacion" class="flex items-center justify-between gap-3 flex-wrap text-sm text-slate-500"></div>
      </section>
    </div>`;const n=g=>t.querySelector(`#${g}`),o=()=>n("lista").innerHTML='<div class="py-3 flex gap-3 items-center"><div class="skeleton w-10 h-10 !rounded-full"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-1/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(5),i=async()=>{n("msg").textContent="",a.length||o();try{const g=new URLSearchParams({limit:String(we),offset:String(s*we),orden:u});r&&g.set("q",r),l&&g.set("solo_en_prestamo","true");const d=await q(`/pacientes/listado?${g}`);a=d.items,e=d.total,v()}catch(g){n("msg").textContent=g instanceof k?g.message:"No se pudo cargar la lista de pacientes."}},v=()=>{n("total").textContent=`${e} paciente${e===1?"":"s"}${r||l?" con este filtro":" registrados"}`,n("lista").className=`divide-y ${p?"escalonado":""}`,p=!1,n("lista").innerHTML=a.length?a.map(m=>`<div class="py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 rounded-lg px-2 -mx-2 transition" data-id="${m.id}">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${Ye(m.nombre_completo)}">${c(Qe(m.nombre_completo))}</div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">${c(m.nombre_completo)}</p>
                <p class="text-sm text-slate-500 truncate">${c(m.tipo_documento)} ${c(m.numero_documento)} · ${c(m.correo)||"sin correo"}${m.telefono?" · "+c(m.telefono):""}</p>
              </div>
              <div class="hidden sm:block text-right text-xs text-slate-500 shrink-0">
                <p><b class="text-blue-800 text-sm">${m.total_prestamos}</b> préstamo${m.total_prestamos===1?"":"s"}</p>
                <p>${m.ultimo_prestamo?"Último: "+F(new Date(m.ultimo_prestamo)):"Sin préstamos"}</p>
              </div>
              ${m.en_prestamo?'<span class="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">Con equipo</span>':""}
              <span class="text-slate-300 shrink-0">›</span>
            </div>`).join(""):`<p class="py-10 text-center text-slate-400">${r||l?"No hay pacientes con ese filtro.":"Aún no hay pacientes registrados."}</p>`;const g=e?s*we+1:0,d=Math.min(e,(s+1)*we);n("paginacion").innerHTML=e?`<span>Mostrando ${g}–${d} de ${e}</span>
         <div class="flex gap-2"><button id="ant" class="${H} !py-1.5" ${s===0?"disabled":""}>← Anterior</button>
         <button id="sig" class="${H} !py-1.5" ${d>=e?"disabled":""}>Siguiente →</button></div>`:""};let w;n("buscar").addEventListener("input",g=>{clearTimeout(w),w=window.setTimeout(()=>{r=g.target.value.trim(),s=0,p=!0,i()},300)}),n("orden").addEventListener("change",g=>{u=g.target.value,s=0,p=!0,i()}),n("solo").addEventListener("change",g=>{l=g.target.checked,s=0,p=!0,i()}),n("paginacion").addEventListener("click",g=>{const d=g.target.closest("button");!d||d.disabled||(s+=d.id==="sig"?1:-1,p=!0,i(),window.scrollTo({top:0,behavior:"smooth"}))}),n("lista").addEventListener("click",g=>{const d=a.find(m=>{var $;return m.id===(($=g.target.closest("[data-id]"))==null?void 0:$.dataset.id)});d&&h(d)});const h=async g=>{const d=K(`<div class="p-6 space-y-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-12 h-12 rounded-full flex items-center justify-center font-semibold shrink-0 ${Ye(g.nombre_completo)}">${c(Qe(g.nombre_completo))}</div>
            <div class="min-w-0"><h3 class="text-lg font-semibold text-slate-900 truncate">${c(g.nombre_completo)}</h3>
              <p class="text-sm text-slate-500">${c(g.tipo_documento)} ${c(g.numero_documento)}</p></div>
          </div>
          <button id="p-x" class="text-slate-400 hover:text-slate-700 text-xl leading-none">✕</button>
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-blue-50 rounded-xl p-3"><p class="text-2xl font-bold text-blue-800">${g.total_prestamos}</p><p class="text-xs text-slate-500">Préstamos</p></div>
          <div class="bg-blue-50 rounded-xl p-3"><p class="text-sm font-semibold text-blue-800 mt-1.5">${g.ultimo_prestamo?F(new Date(g.ultimo_prestamo)):"—"}</p><p class="text-xs text-slate-500">Último préstamo</p></div>
          <div class="${g.en_prestamo?"bg-amber-50":"bg-green-50"} rounded-xl p-3"><p class="text-sm font-semibold ${g.en_prestamo?"text-amber-700":"text-green-700"} mt-1.5">${g.en_prestamo?"Tiene un equipo":"Sin equipos"}</p><p class="text-xs text-slate-500">Estado actual</p></div>
        </div>
        <details class="rounded-xl border border-slate-200 p-4">
          <summary class="cursor-pointer font-medium text-blue-900">✏️ Editar datos del paciente</summary>
          <form id="p-form" class="grid grid-cols-2 gap-3 mt-4">
            <div><label class="${S}">Tipo</label><select id="p-tipo" class="${N}">${["CC","TI","CE","PA"].map($=>`<option ${$===g.tipo_documento?"selected":""}>${$}</option>`).join("")}</select></div>
            <div><label class="${S}">Documento</label><input id="p-doc" class="${N}" value="${c(g.numero_documento)}" /></div>
            <div class="col-span-2"><label class="${S}">Nombre completo</label><input id="p-nombre" class="${N}" value="${c(g.nombre_completo)}" /></div>
            <div><label class="${S}">Expedida en</label><input id="p-exp" class="${N}" value="${c(g.ciudad_expedicion)}" /></div>
            <div><label class="${S}">Vecino de</label><input id="p-vecino" class="${N}" value="${c(g.vecino_de)}" /></div>
            <div><label class="${S}">Correo</label><input id="p-correo" type="email" class="${N}" value="${c(g.correo)}" /></div>
            <div><label class="${S}">Teléfono</label><input id="p-tel" class="${N}" value="${c(g.telefono)}" /></div>
            <p id="p-msg" class="col-span-2 text-sm hidden"></p>
            <div class="col-span-2 flex justify-end"><button class="${J}">Guardar cambios</button></div>
          </form>
        </details>
        <div><h4 class="font-semibold text-slate-900 mb-2">Historial de préstamos</h4><div id="p-hist" class="text-sm text-slate-500">Cargando...</div></div>
      </div>`,"max-w-2xl");d.q("#p-x").addEventListener("click",d.cerrar);const m=$=>{d.q("#p-msg").textContent=$,d.q("#p-msg").className="col-span-2 text-sm text-red-600"};d.q("#p-form").addEventListener("submit",async $=>{$.preventDefault();const b=f=>d.q(f).value.trim();if(!b("#p-nombre")||!b("#p-doc"))return m("Nombre y documento son obligatorios.");if(b("#p-correo")&&!Ht.test(b("#p-correo")))return m("El correo no es válido.");try{const f=await q(`/pacientes/${g.id}`,{method:"PUT",body:JSON.stringify({tipo_documento:b("#p-tipo"),numero_documento:b("#p-doc"),nombre_completo:b("#p-nombre"),ciudad_expedicion:b("#p-exp")||null,vecino_de:b("#p-vecino")||null,correo:b("#p-correo")||null,telefono:b("#p-tel")||null})});a=a.map(y=>y.id===f.id?{...y,...f}:y),v(),d.cerrar(),V("Datos del paciente actualizados. Las actas ya firmadas conservan los datos originales.","ok")}catch(f){m(f instanceof k?f.message:"No se pudo guardar")}});try{const $=await q(`/pacientes/${g.id}/historial`);d.q("#p-hist").innerHTML=$.length?`<div class="overflow-auto"><table class="w-full text-left"><tbody class="divide-y escalonado">${$.map(b=>{const f=je[b.estado]??{nombre:b.estado,clase:"bg-slate-100"},y=b.fecha_devolucion_real?`Devuelto ${F(new Date(b.fecha_devolucion_real))}`:b.fecha_devolucion_prevista?`Devolver ${F(new Date(b.fecha_devolucion_prevista))}`:"";return`<tr data-acta="${b.acta_id}"><td class="py-2.5 pr-3 font-medium text-slate-700">#${b.numero}</td>
                <td class="pr-3 text-slate-700">${c(b.equipo)}<br /><span class="text-xs text-slate-400">${F(new Date(b.fecha_entrega))} · ${y}</span></td>
                <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${f.clase}">${f.nombre}</span></td>
                <td>${["FIRMADA","ENVIADA","DEVUELTA"].includes(b.estado)?'<button data-pdf class="text-blue-700 hover:underline">PDF</button>':""}</td></tr>`}).join("")}</tbody></table></div>`:"Este paciente no tiene préstamos.",d.q("#p-hist").addEventListener("click",b=>{var y,D;const f=(D=(y=b.target.closest("[data-pdf]"))==null?void 0:y.closest("[data-acta]"))==null?void 0:D.dataset.acta;f&&me(f).catch(()=>{})})}catch{d.q("#p-hist").textContent="No se pudo cargar el historial."}};await i()}const zt=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,pe="rounded-lg px-3 py-1.5 text-sm font-medium transition",Ut="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300";async function Bt(t){let a="pendientes",e=[],s=[],r=[],u=[],l=null,p=!1,n=!0,o="";const i=new Set;let v=!1;const w=()=>[...e,...s].sort((x,L)=>L.numero-x.numero),h=()=>[...r,...u].sort((x,L)=>L.numero-x.numero),g=x=>!!x.fecha_devolucion_prevista&&new Date(x.fecha_devolucion_prevista)<new Date;t.innerHTML=`
    <div class="space-y-6">
      ${de("Bienvenido","Panel de control","Gestiona el préstamo de equipos de cardiología de forma rápida y segura.",`<a href="#/nueva" class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white font-medium rounded-xl px-5 py-2.5 text-sm shadow-xs">${A.mas}Nueva acta</a>`)}

      <div id="resumen" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"></div>
      <div id="panel" class="grid lg:grid-cols-3 gap-4"></div>

      <section class="bg-white rounded-2xl shadow p-5 md:p-6 space-y-4">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div id="tabs" class="inline-flex bg-slate-100/80 rounded-full p-1 text-sm font-medium flex-wrap gap-0.5"></div>
          <div class="relative w-full sm:w-72">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:w-[18px] [&>svg]:h-[18px]">${A.buscar}</span>
            <input id="buscar" placeholder="Buscar por nombre o documento…" aria-label="Buscar por nombre o documento"
              class="w-full border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm bg-white" />
          </div>
        </div>
        <div id="barra" class="flex items-center justify-between gap-3 flex-wrap"></div>
        <p id="msg" class="text-sm"></p>
        <div id="lista" class="divide-y">${'<div class="py-4 flex gap-3"><div class="skeleton w-9 h-9 rounded-full"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(3)}</div>
      </section>
    </div>`;const d=x=>t.querySelector(`#${x}`),m=async()=>{const[x,L,E,M]=await Promise.allSettled([q("/actas?estado=firmada&limit=200"),q("/actas?estado=enviada&limit=200"),q("/actas?estado=devuelta&limit=200"),q("/actas?estado=anulada&limit=200")]);e=x.status==="fulfilled"?x.value:e,s=L.status==="fulfilled"?L.value:s,r=E.status==="fulfilled"?E.value:r,u=M.status==="fulfilled"?M.value:u,[x,L,E,M].some(_=>_.status==="rejected")&&V("Algunas pestañas no pudieron cargar. Revisa la conexión con el servidor.","error"),l=await q("/dashboard").catch(()=>null);const C=new Set(e.map(_=>_.id));for(const _ of[...i])C.has(_)||i.delete(_);y()},$=()=>({pendientes:e,enviadas:s,historial:h(),prestamo:w()})[a],b=()=>{const x=o.trim().toLowerCase();return x?$().filter(L=>L.paciente.nombre_completo.toLowerCase().includes(x)||L.paciente.numero_documento.includes(x)):$()},f=x=>x.paciente.correo?zt.test(x.paciente.correo)?null:"Correo inválido":"Sin correo",y=()=>{const x=w().filter(g).length,L=(_,T,B,Z,ce,ne,Le="")=>`
      <button data-tab="${_}" class="metrica bg-white rounded-2xl shadow p-5 flex flex-col gap-3 w-full">
        <div class="flex items-start justify-between w-full">${ie(ce,ne,"w-12 h-12")}<span class="flecha text-slate-400 [&>svg]:w-[18px] [&>svg]:h-[18px] mt-1">${A.chevron}</span></div>
        <p class="text-[15px] text-slate-600 font-medium">${B}</p>
        <p class="text-3xl font-bold text-slate-900 leading-none" ${p?"":`data-contar="${T}"`}>${p?T:0}</p>
        <p class="text-xs text-slate-500">${Z}${Le}</p>
      </button>`;d("resumen").innerHTML=L("pendientes",e.length,"Por enviar","Actas pendientes de envío",A.documento,"blue")+L("enviadas",s.length,"Enviadas","Actas enviadas al paciente",A.sobre,"green")+L("prestamo",w().length,"En préstamo","Equipos en uso actualmente",A.reloj,"violet",x?` · <b class="text-red-600">${x} vencida${x>1?"s":""}</b>`:"")+L("historial",r.length,"Devueltas","Equipos retornados",A.retorno,"amber"),p||ht(d("resumen")),D();const E=(_,T,B)=>`<button data-tab="${_}" class="px-4 py-2 rounded-full transition ${a===_?"bg-blue-700 text-white shadow-sm":"text-slate-600 hover:text-slate-900 hover:bg-white/70"}" aria-pressed="${a===_}">${T} (${B})</button>`;d("tabs").innerHTML=E("pendientes","Por enviar",e.length)+E("enviadas","Enviadas",s.length)+E("prestamo","En préstamo",w().length)+E("historial","Historial",r.length+u.length);const M=b(),C=M.filter(_=>!f(_));if(a==="pendientes"){const _=C.length>0&&C.every(T=>i.has(T.id));d("barra").innerHTML=`
        <label class="flex items-center gap-2.5 text-sm text-slate-600 ${C.length?"":"opacity-40"}">
          <input id="sel-todas" type="checkbox" class="login-check" ${_?"checked":""} ${C.length?"":"disabled"} />
          Seleccionar todas
        </label>
        <button id="enviar-sel" class="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white rounded-full px-5 py-2 text-sm font-medium disabled:bg-blue-200 disabled:text-white disabled:cursor-not-allowed" ${i.size&&!v?"":"disabled"}>
          ${A.enviar.replace("w-5 h-5","w-4 h-4")}Enviar seleccionadas (${i.size})
        </button>`}else d("barra").innerHTML=`<p class="text-sm text-slate-500">${{enviadas:"Actas ya enviadas al correo del paciente.",prestamo:"Equipos que siguen con el paciente. Marca la devolución cuando lo entreguen.",historial:"Equipos ya devueltos y actas anuladas.",pendientes:""}[a]}</p>`;if(!M.length){const _={pendientes:[A.documento,"No hay documentos pendientes de envío.","Cuando generes una nueva acta, aparecerá aquí para que la envíes."],enviadas:[A.sobre,"Todavía no se ha enviado ningún acta.","Las actas enviadas al correo del paciente aparecerán aquí."],prestamo:[A.reloj,"No hay equipos en préstamo.","Cuando entregues un equipo, podrás seguir su devolución desde aquí."],historial:[A.retorno,"Aún no hay devoluciones ni anulaciones.","Los equipos devueltos y las actas anuladas se guardan aquí."]}[a];d("lista").className="",d("lista").innerHTML=o?He(A.buscar,"Sin resultados para esa búsqueda.","Prueba con otro nombre o número de documento.","slate"):He(_[0],_[1],_[2]);return}d("lista").className=`divide-y ${n?"escalonado":""}`,d("lista").innerHTML=M.map(_=>z(_)).join(""),n=!1,p=!0},D=()=>{if(!l){d("panel").innerHTML="";return}const x=l.equipos,L=Object.values(x).reduce((j,se)=>j+se,0),E=l.prestamos_14_dias,M=Math.max(1,...E.map(j=>j.total)),C=M<=5?1:Math.ceil(M/4/5)*5,_=Math.max(C*(M<=5?5:3),Math.ceil(M/C)*C),T=700,B=230,Z=34,ce=12,ne=12,Le=30,he=j=>Z+j*(T-Z-ce)/Math.max(1,E.length-1),ue=j=>ne+(B-ne-Le)*(1-j/_),De=[];for(let j=0;j<=_;j+=C)De.push(j);const rt=De.map(j=>`<line x1="${Z}" x2="${T-ce}" y1="${ue(j)}" y2="${ue(j)}" stroke="#eef1f7" /><text x="${Z-10}" y="${ue(j)+4}" text-anchor="end" font-size="11" fill="#98a2b3">${j}</text>`).join(""),ye=j=>new Date(j.fecha+"T12:00:00"),it=E.map((j,se)=>`<text x="${he(se)}" y="${B-8}" text-anchor="middle" font-size="11" fill="#667085">${ye(j).getDate()}</text>`).join(""),Re=E.map((j,se)=>`${se?"L":"M"}${he(se).toFixed(1)} ${ue(j.total).toFixed(1)}`).join(" "),nt=`${Re} L${he(E.length-1).toFixed(1)} ${ue(0)} L${he(0).toFixed(1)} ${ue(0)} Z`,lt=E.map((j,se)=>`<circle class="${p?"":"linea-punto"}" cx="${he(se).toFixed(1)}" cy="${ue(j.total).toFixed(1)}" r="3.6" fill="#fff" stroke="#1746c8" stroke-width="2"><title>${j.total} préstamo(s) el ${ye(j).toLocaleDateString("es-CO",{day:"numeric",month:"short"})}</title></circle>`).join(""),dt=E.length?`${ye(E[0]).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})} – ${ye(E[E.length-1]).toLocaleDateString("es-CO",{day:"numeric",month:"short",year:"numeric"})}`:"",ct=`<svg viewBox="0 0 ${T} ${B}" class="w-full h-auto mt-3" role="img" aria-label="Préstamos por día en los últimos 14 días">
      <defs><linearGradient id="g-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#285ff4" stop-opacity=".16"/><stop offset="1" stop-color="#285ff4" stop-opacity="0"/></linearGradient></defs>
      ${rt}${it}
      <path class="${p?"":"linea-area"}" d="${nt}" fill="url(#g-area)" />
      <path class="${p?"":"linea-trazo"}" pathLength="1" d="${Re}" fill="none" stroke="#1746c8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${lt}</svg>`,ut=l.top_equipos.length?`<ul class="mt-1 text-sm text-slate-700 space-y-1.5">${l.top_equipos.map((j,se)=>`<li class="flex justify-between gap-3"><span class="truncate">${se+1}. ${c(j.nombre)}</span><b class="text-blue-800">${j.total}</b></li>`).join("")}</ul>`:'<p class="mt-0.5 font-semibold text-slate-900">Sin préstamos recientes</p>';d("panel").innerHTML=`
      <div class="bg-white rounded-2xl shadow p-5 md:p-6 lg:col-span-2">
        ${Ie(A.reportes,"Préstamos de los últimos 14 días",`<span class="inline-flex items-center gap-2 text-xs text-slate-500 [&>svg]:w-4 [&>svg]:h-4">${A.calendario}${dt}</span>`)}
        ${ct}
      </div>
      <div class="bg-white rounded-2xl shadow p-5 md:p-6 space-y-5">
        ${Ie(A.reportes,"Resumen")}
        <div class="flex items-center gap-4">${ie(A.equipos,"green","w-12 h-12")}
          <div><p class="text-xs text-slate-500">Equipos disponibles</p>
            <p class="text-2xl font-bold text-slate-900 leading-tight">${x.DISPONIBLE??0}</p>
            <p class="text-xs text-slate-500">de ${L} equipos${x.MANTENIMIENTO?` · <span class="text-amber-600">${x.MANTENIMIENTO} en mantenimiento</span>`:""}</p></div></div>
        <div class="flex items-start gap-4">${ie(A.reloj,"blue","w-12 h-12")}
          <div class="min-w-0 flex-1"><p class="text-xs text-slate-500">Más prestados (90 días)</p>${ut}</div></div>
        ${l.por_vencer_24h?`<p class="text-sm bg-amber-50 text-amber-800 rounded-xl px-3 py-2">${l.por_vencer_24h} por vencer en las próximas 24 h</p>`:""}
      </div>`},z=x=>{var ce;const L=f(x),E=`#${x.numero} · ${c(x.paciente.nombre_completo)}`,M=`${c(x.equipo.tipo.nombre)} serie ${c(x.equipo.serie)} · ${F(new Date(x.fecha_entrega))}`,C=`<button data-pdf class="${Ut} ${pe}">Ver PDF</button>`,_="disabled:opacity-40 disabled:cursor-not-allowed";let T="",B="",Z=C;if(a==="pendientes")T=`<input type="checkbox" data-sel class="login-check mt-2" ${i.has(x.id)?"checked":""} ${L?"disabled":""} />`,B=`<p class="text-sm ${L?"text-red-600 font-medium":"text-slate-500"}">${L?"Aviso: "+L:c(x.paciente.correo)}</p>`,Z+=`<button data-enviar class="bg-blue-700 hover:bg-blue-600 text-white ${pe} ${_}" ${L||v?"disabled":""}>Revisar y enviar</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${pe}">Anular</button>`;else if(a==="enviadas")T=ie(A.check,"green","w-9 h-9"),B=`<p class="text-sm text-slate-500">${c(x.paciente.correo)}</p>`,Z+=`<button data-enviar class="bg-blue-50 hover:bg-blue-100 text-blue-800 ${pe} ${_}" ${L||v?"disabled":""}>Reenviar</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${pe}">Anular</button>`;else if(a==="prestamo"){const ne=g(x);T=ie(A.reloj,ne?"red":"violet","w-9 h-9"),B=`<p class="text-sm ${ne?"text-red-600 font-medium":"text-slate-500"}">
        Devolución prevista: ${x.fecha_devolucion_prevista?F(new Date(x.fecha_devolucion_prevista)):"—"}${ne?" · VENCIDA":""}
        <span class="ml-2 text-xs px-2 py-0.5 rounded-full ${x.estado==="ENVIADA"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}">${x.estado==="ENVIADA"?"Enviada":"Sin enviar"}</span></p>`,Z+=`<button data-devolver class="bg-blue-700 hover:bg-blue-600 text-white ${pe}">Marcar devuelta</button>
        <button data-anular class="bg-red-50 hover:bg-red-100 text-red-700 ${pe}">Anular</button>`}else x.estado==="ANULADA"?(T=ie(A.ban,"red","w-9 h-9"),B=`<p class="text-sm text-red-600">Anulada. ${c((ce=(x.observaciones??"").split("ANULADA:").pop())==null?void 0:ce.trim())}</p>`):(T=ie(A.retorno,"slate","w-9 h-9"),B=`<p class="text-sm text-slate-500">Devuelto: ${x.fecha_devolucion_real?F(new Date(x.fecha_devolucion_real)):"—"}</p>`);return`
      <div class="py-3.5 flex items-start gap-3.5" data-id="${x.id}">
        ${T}
        <div class="flex-1 min-w-0">
          <p class="font-medium truncate">${E}</p>
          <p class="text-sm text-slate-500">${M}</p>
          ${B}
        </div>
        <div class="flex gap-2 shrink-0 flex-wrap justify-end">${Z}</div>
      </div>`},R=(x,L="info")=>{x&&L!=="info"&&V(x,L),d("msg").textContent=x,d("msg").className=`text-sm ${L==="error"?"text-red-600":L==="ok"?"text-green-700 font-medium":"text-slate-500"}`},O=async x=>{const L=await new Promise(E=>{const M=document.createElement("div");M.className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",M.innerHTML=`
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-lg font-semibold text-red-700">Anular acta #${x.numero}</h3>
          <p class="text-sm text-slate-600">${c(x.paciente.nombre_completo)} · ${c(x.equipo.tipo.nombre)} serie ${c(x.equipo.serie)}.
            El equipo quedará disponible. Esta acción no se puede deshacer.</p>
          <div>
            <label class="block text-sm font-medium mb-1">Motivo de la anulación *</label>
            <textarea id="a-motivo" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Ej: Se registró al paciente equivocado"></textarea>
            <p id="a-error" class="text-xs text-red-600 hidden mt-1">Escribe un motivo de al menos 5 letras.</p>
          </div>
          <div class="flex justify-end gap-2">
            <button id="a-no" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="a-si" class="bg-red-600 hover:bg-red-700 text-white rounded-lg px-5 py-2">Anular acta</button>
          </div>
        </div>`,document.body.appendChild(M);const C=_=>{M.remove(),E(_)};M.querySelector("#a-no").addEventListener("click",()=>C(null)),M.querySelector("#a-si").addEventListener("click",()=>{const _=M.querySelector("#a-motivo").value.trim();if(_.length<5)return M.querySelector("#a-error").classList.remove("hidden");C(_)})});if(L)try{await q(`/actas/${x.id}/anular`,{method:"POST",body:JSON.stringify({motivo:L})}),await m(),R(`Acta #${x.numero} anulada. El equipo ${x.equipo.serie} quedó disponible.`,"ok")}catch(E){R(E instanceof k?E.message:"No se pudo anular el acta","error")}},U=x=>new Promise(L=>{const E=document.createElement("div");E.className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",E.innerHTML=`
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
          <h3 class="text-lg font-semibold">¿Está seguro de enviar ${x.length} actas?</h3>
          <p class="text-sm text-slate-600">Revisa cada documento antes de enviarlo. Cada acta va al correo de su paciente.</p>
          <div class="max-h-64 overflow-auto divide-y border rounded-lg">
            ${x.map(C=>`<div class="p-3 flex items-center justify-between gap-2 text-sm" data-id="${C.id}">
                  <div class="min-w-0"><p class="font-medium truncate">#${C.numero} · ${c(C.paciente.nombre_completo)}</p>
                  <p class="text-slate-500 truncate">${c(C.paciente.correo)}</p></div>
                  <button data-ver class="bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1 shrink-0">Ver PDF</button></div>`).join("")}
          </div>
          <div class="flex justify-end gap-2">
            <button id="l-no" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="l-si" class="bg-blue-700 hover:bg-blue-600 text-white rounded-lg px-5 py-2">Sí, enviar ${x.length}</button>
          </div>
        </div>`,document.body.appendChild(E);const M=C=>{E.remove(),L(C)};E.querySelector("#l-no").addEventListener("click",()=>M(!1)),E.querySelector("#l-si").addEventListener("click",()=>M(!0)),E.addEventListener("click",C=>{var B;const _=C.target.closest("[data-ver]"),T=(B=_==null?void 0:_.closest("[data-id]"))==null?void 0:B.dataset.id;T&&me(T).catch(()=>{})})}),X=x=>new Promise(L=>{const E=document.createElement("div");E.className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50",E.innerHTML=`
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
          <h3 class="text-lg font-semibold">Registrar devolución</h3>
          <p class="text-sm text-slate-600">
            ${c(x.paciente.nombre_completo)} devuelve el ${c(x.equipo.tipo.nombre)} serie <b>${c(x.equipo.serie)}</b>.
          </p>
          <div>
            <label class="block text-sm font-medium mb-1">¿En qué estado queda el equipo?</label>
            <select id="d-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="DISPONIBLE">Disponible (listo para prestar)</option>
              <option value="MANTENIMIENTO">En mantenimiento (tiene algún daño)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
            <textarea id="d-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
          </div>
          <label class="flex items-start gap-2 text-sm text-slate-700 ${f(x)?"opacity-50":""}">
            <input id="d-comprobante" type="checkbox" class="w-4 h-4 mt-0.5" ${f(x)?"disabled":"checked"} />
            <span>Enviar comprobante de devolución al correo del paciente${f(x)?" (no tiene correo válido)":""}</span></label>
          <div class="flex justify-end gap-2">
            <button id="d-cancelar" class="bg-slate-200 hover:bg-slate-300 rounded-lg px-4 py-2">Cancelar</button>
            <button id="d-ok" class="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-5 py-2">Confirmar devolución</button>
          </div>
        </div>`,document.body.appendChild(E);const M=C=>{E.remove(),L(C)};E.querySelector("#d-cancelar").addEventListener("click",()=>M(null)),E.querySelector("#d-ok").addEventListener("click",()=>M({estado_equipo:E.querySelector("#d-estado").value,observaciones:E.querySelector("#d-obs").value.trim(),comprobante:E.querySelector("#d-comprobante").checked}))}),P=async x=>{const L=await X(x);if(L)try{await q(`/actas/${x.id}/devolver`,{method:"POST",body:JSON.stringify({estado_equipo:L.estado_equipo,observaciones:L.observaciones||null})});let E="",M=!1;if(L.comprobante)try{await q(`/actas/${x.id}/comprobante`,{method:"POST"}),E=" Se envió el comprobante al paciente."}catch(C){E=` No se pudo enviar el comprobante: ${C instanceof k?C.message:"error de conexión"}.`,M=!0}await m(),R((L.estado_equipo==="DISPONIBLE"?`Devolución registrada: el equipo ${x.equipo.serie} quedó disponible.`:`Devolución registrada: el equipo ${x.equipo.serie} quedó en mantenimiento.`)+E,M?"error":"ok")}catch(E){R(E instanceof k?E.message:"No se pudo registrar la devolución","error")}},G=async x=>{if(v||!x.length)return;v=!0,y();const L=await Lt({titulo:x.length===1?"Enviando acta por Gmail":`Enviando ${x.length} actas por Gmail`,items:x,nombre:E=>`#${E.numero} ${E.paciente.nombre_completo}`,tarea:E=>q(`/actas/${E.id}/enviar`,{method:"POST",body:JSON.stringify({})})});v=!1,i.clear(),await m().catch(()=>R("No se pudo actualizar la lista.","error")),L.ok&&V(L.ok===1?"Acta enviada correctamente.":`${L.ok} actas enviadas correctamente.`,"ok")},Q=async x=>{if(v)return;const L=await st(x);await m().catch(()=>{}),L.enviada&&R(`Acta #${x.numero} enviada correctamente a ${L.acta.paciente.correo}.`,"ok")};t.addEventListener("click",async x=>{const L=x.target,E=L.closest("[data-tab]");if(E)return a=E.dataset.tab,n=!0,i.clear(),R(""),y();if(L.closest("#enviar-sel")){const T=e.filter(B=>i.has(B.id)&&!f(B));return T.length===1?void Q(T[0]):await U(T)?void G(T):void 0}const M=L.closest("[data-id]"),C=L.closest("button");if(!M||!C)return;const _=[...e,...s,...r,...u].find(T=>T.id===M.dataset.id);if(C.hasAttribute("data-pdf"))try{await me(_.id)}catch(T){R(T instanceof k?T.message:"No se pudo abrir el PDF","error")}else C.hasAttribute("data-enviar")?Q(_):C.hasAttribute("data-devolver")?P(_):C.hasAttribute("data-anular")&&O(_)}),t.addEventListener("change",x=>{const L=x.target;if(L.id==="sel-todas")return b().filter(M=>!f(M)).forEach(M=>L.checked?i.add(M.id):i.delete(M.id)),y();if(L.hasAttribute("data-sel")){const E=L.closest("[data-id]").dataset.id;L.checked?i.add(E):i.delete(E),y()}}),d("buscar").addEventListener("input",x=>{o=x.target.value,y()}),await m().catch(()=>R("No se pudo cargar la lista. Revisa que el backend esté encendido.","error"))}const re=(t,a="w-5 h-5")=>`<svg xmlns="http://www.w3.org/2000/svg" class="${a}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${t}"/></svg>`,oe={usuario:re("M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8"),candado:re("M7 11V8a5 5 0 0110 0v3M5 11h14v10H5zM12 15v2"),ojo:re("M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6"),ojoOff:re("M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6C3.9 8.4 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 004.2 4.2"),escudo:re("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4","w-6 h-6"),rayo:re("M13 2L4 14h7l-1 8 9-12h-7l1-8z","w-6 h-6"),nube:re("M7 18a4.5 4.5 0 01-.6-8.96A6 6 0 0118 10a4 4 0 010 8H7z","w-6 h-6"),entrar:re("M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3","w-[18px] h-[18px]"),escudoMini:re("M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4","w-3.5 h-3.5")},Te="login-usuario",Vt=()=>{try{return localStorage.getItem(Te)??""}catch{return""}},Ne=(t,a,e)=>`
  <div class="flex items-start gap-3 min-w-0">
    <div class="w-12 h-12 xl:w-14 xl:h-14 rounded-xl bg-white/10 ring-1 ring-inset ring-white/15 text-white flex items-center justify-center shrink-0">${t}</div>
    <div><p class="font-medium text-white leading-tight">${a}</p><p class="text-xs text-blue-100/80 mt-1 leading-snug">${e}</p></div>
  </div>`;function Gt(t,a){const e=Vt();t.innerHTML=`
    <div class="login min-h-screen lg:grid lg:grid-cols-[54fr_46fr]">
      <section class="login-izq hidden lg:flex relative overflow-hidden text-white flex-col justify-between px-[8%] py-12">
        <div class="login-foto" aria-hidden="true"></div>
        <img src="/logo-blanco.png" alt="IPS Nueva Popayán · Rehabilitar" class="relative w-60 h-auto" />
        <div class="relative login-entrada">
          <p class="text-xs font-medium tracking-[.28em] uppercase text-blue-300">Bienvenido al sistema</p>
          <h1 class="mt-4 text-[2.6rem] xl:text-5xl font-bold leading-[1.12] tracking-tight">Préstamo de equipos<br />de <span class="text-blue-300">cardiología</span></h1>
          <p class="mt-5 max-w-md text-[15px] leading-relaxed text-blue-50/90">Registro de entrega de Holter y MAPA con firma digital, envío del acta por correo y control de devoluciones.</p>
          <div class="mt-10 flex flex-wrap 2xl:flex-nowrap gap-x-6 gap-y-6 2xl:gap-x-9 max-w-sm 2xl:max-w-none">
            ${Ne(oe.escudo,"Seguro","Tu información<br />protegida")}
            ${Ne(oe.rayo,"Rápido","Procesos más<br />ágiles")}
            ${Ne(oe.nube,"Digital","Sin papeles,<br />sin complicaciones")}
          </div>
        </div>
        <p class="relative flex items-center gap-3 text-xs text-blue-100/90"><span class="h-px w-12 bg-blue-400"></span>IPS Nueva Popayán - Rehabilitar</p>
      </section>

      <section class="login-der relative overflow-hidden min-h-screen flex items-center justify-center p-5 sm:p-8">
        <div class="absolute -right-40 top-[42%] w-[30rem] h-[30rem] rounded-full bg-blue-100/50" aria-hidden="true"></div>
        <div class="absolute -right-32 -bottom-40 w-[26rem] h-[26rem] rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-95 hidden sm:block" aria-hidden="true"></div>
        <p class="login-tag absolute top-12 right-12 text-right text-[11px] font-medium tracking-[.22em] uppercase text-slate-500 leading-relaxed">Tecnología al servicio<br />de tu salud<span class="block h-0.5 w-20 bg-blue-600 mt-2 ml-auto"></span></p>

        <form id="form" class="login-tarjeta relative w-full max-w-[500px] bg-white rounded-[20px] border border-slate-100 px-6 py-8 sm:px-10 sm:py-10" novalidate>
          <img src="/logo.png" alt="IPS Nueva Popayán" class="h-24 w-auto mx-auto" />
          <h2 class="mt-5 text-[1.7rem] font-bold tracking-tight text-slate-900">Iniciar sesión</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-500">Ingresa con tu usuario y contraseña para acceder al sistema de préstamo de equipos de cardiología.</p>

          <div class="mt-6">
            <label class="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-2" for="username"><span class="text-blue-600">${oe.usuario.replace("w-5 h-5","w-4 h-4")}</span>Usuario</label>
            <input id="username" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Ingresa tu usuario" value="${e.replace(/"/g,"&quot;")}"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white text-slate-900" />
          </div>
          <div class="mt-5">
            <label class="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-2" for="password"><span class="text-blue-600">${oe.candado.replace("w-5 h-5","w-4 h-4")}</span>Contraseña</label>
            <div class="relative">
              <input id="password" type="password" required autocomplete="current-password" placeholder="Ingresa tu contraseña"
                class="w-full border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm bg-white text-slate-900" />
              <button type="button" id="ver" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-50" aria-label="Mostrar contraseña" aria-pressed="false">${oe.ojo}</button>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <label class="flex items-center gap-2.5 text-[13px] font-medium text-slate-700 cursor-pointer select-none"><input id="recordar" type="checkbox" class="login-check" ${e?"checked":""} />Recordar mi usuario</label>
            <button type="button" id="olvido" class="text-[13px] font-medium text-blue-700 hover:text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button>
          </div>

          <p id="error" role="alert" class="mt-5 text-sm text-red-700 bg-red-50 ring-1 ring-inset ring-red-600/20 rounded-xl px-4 py-2.5 hidden"></p>
          <button id="btn" class="login-btn mt-6 w-full flex items-center justify-center gap-2.5 text-white font-medium rounded-xl py-3.5 text-[15px]">${oe.entrar}<span id="btn-texto">Ingresar</span></button>

          <p class="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">${oe.escudoMini}Sistema seguro y confidencial</p>
        </form>
      </section>
    </div>`;const s=t.querySelector("#form"),r=t.querySelector("#error"),u=t.querySelector("#btn"),l=t.querySelector("#btn-texto"),p=t.querySelector("#username"),n=t.querySelector("#password"),o=t.querySelector("#ver"),i=v=>{r.textContent=v,r.classList.remove("hidden")};o.addEventListener("click",()=>{const v=n.type==="text";n.type=v?"password":"text",o.innerHTML=v?oe.ojo:oe.ojoOff,o.setAttribute("aria-label",v?"Mostrar contraseña":"Ocultar contraseña"),o.setAttribute("aria-pressed",String(!v))}),t.querySelector("#olvido").addEventListener("click",()=>V("Para restablecer tu contraseña, solicítalo a un administrador del sistema.","info",6e3)),s.addEventListener("submit",async v=>{v.preventDefault(),r.classList.add("hidden");const w=p.value.trim(),h=n.value;if(!w||!h)return i("Ingresa tu usuario y tu contraseña.");u.disabled=!0,l.textContent="Ingresando…";try{await vt(w,h);try{t.querySelector("#recordar").checked?localStorage.setItem(Te,w):localStorage.removeItem(Te)}catch{}a()}catch(g){i(g instanceof k?g.message:"No se pudo conectar con el servidor"),u.disabled=!1,l.textContent="Ingresar"}})}const ve=t=>new Date(t.getTime()-t.getTimezoneOffset()*6e4).toISOString().slice(0,10);async function Jt(t,a){if(a.rol!=="ADMIN"){t.innerHTML='<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden generar reportes.</div>';return}const e=new Date;t.innerHTML=`
    <div class="space-y-6 max-w-2xl">
      ${de("Administración","Reportes","Descarga en Excel los préstamos de un periodo, con vencidos y uso de cada equipo.")}
      <section class="bg-white rounded-2xl shadow p-6 space-y-5">
        <div class="flex gap-2 flex-wrap text-sm">
          <button data-rango="mes" class="${H}">Este mes</button>
          <button data-rango="30" class="${H}">Últimos 30 días</button>
          <button data-rango="anio" class="${H}">Este año</button>
          <button data-rango="todo" class="${H}">Todo</button>
        </div>
        <div class="grid sm:grid-cols-3 gap-4">
          <div><label class="${S}">Desde</label><input id="desde" type="date" class="${N}" value="${ve(new Date(e.getFullYear(),e.getMonth(),1))}" /></div>
          <div><label class="${S}">Hasta</label><input id="hasta" type="date" class="${N}" value="${ve(e)}" /></div>
          <div><label class="${S}">Estado</label><select id="estado" class="${N}">
            <option value="">Todos</option><option value="firmada">Firmadas (sin enviar)</option><option value="enviada">Enviadas</option>
            <option value="devuelta">Devueltas</option><option value="anulada">Anuladas</option></select></div>
        </div>
        <p id="msg" class="text-sm hidden"></p>
        <button id="descargar" class="${J} inline-flex items-center gap-2">${A.reportes}<span>Descargar Excel</span></button>
        <p class="text-xs text-slate-400">Incluye tres hojas: Préstamos (detalle), Resumen (por estado y equipos más usados) y Equipos.</p>
      </section>
      <section class="bg-white rounded-2xl shadow p-6 space-y-4">
        <div><h3 class="font-semibold text-slate-900">Copias de seguridad</h3>
          <p class="text-sm text-slate-500">Guardan la base de datos, los PDF y las fotos en un .zip. El sistema hace una copia automática cada día; aquí puedes crear una ahora y descargarla.</p></div>
        <button id="respaldar" class="${J}">Crear copia ahora</button>
        <p id="r-msg" class="text-sm hidden"></p>
        <div id="r-lista" class="divide-y text-sm"></div>
        <p class="text-xs text-slate-400">Guarda una copia reciente en otro lugar (USB o nube): si el computador falla, las copias que están en él se pierden.</p>
      </section>
    </div>`;const s=n=>t.querySelector(`#${n}`),r=(n,o)=>{s("desde").value=n,s("hasta").value=o};t.querySelectorAll("[data-rango]").forEach(n=>n.addEventListener("click",()=>{const o=n.dataset.rango,i=ve(e);o==="mes"?r(ve(new Date(e.getFullYear(),e.getMonth(),1)),i):o==="30"?r(ve(new Date(e.getTime()-30*864e5)),i):o==="anio"?r(`${e.getFullYear()}-01-01`,i):r("","")})),s("descargar").addEventListener("click",async()=>{const n=s("desde").value,o=s("hasta").value,i=s("msg");if(n&&o&&n>o){i.textContent="La fecha «Desde» no puede ser posterior a «Hasta».",i.className="text-sm text-red-600";return}const v=new URLSearchParams;n&&v.set("desde",n),o&&v.set("hasta",o),s("estado").value&&v.set("estado",s("estado").value);const w=s("descargar");w.disabled=!0;try{await Oe(`/reportes/prestamos.xlsx?${v}`,`prestamos-${ve(e)}.xlsx`),i.textContent="Reporte generado. Revisa tu carpeta de descargas.",i.className="text-sm text-green-700"}catch(h){i.textContent=h instanceof k?h.message:"No se pudo generar el reporte",i.className="text-sm text-red-600"}w.disabled=!1});const u=n=>(n/1048576).toFixed(n>1048576*10?0:1)+" MB",l=async()=>{try{const n=await q("/respaldos");s("r-lista").innerHTML=n.length?n.map(o=>`<div class="py-2 flex items-center justify-between gap-3" data-n="${c(o.nombre)}">
            <div><p class="font-medium text-slate-700">${c(o.nombre)}</p><p class="text-xs text-slate-400">${F(new Date(o.fecha))} · ${u(o.tamano)}</p></div>
            <button data-bajar class="${H} !py-1.5">Descargar</button></div>`).join(""):'<p class="py-3 text-slate-400">Todavía no hay copias.</p>'}catch{s("r-lista").textContent="No se pudo cargar la lista de copias."}},p=(n,o)=>{s("r-msg").textContent=n,s("r-msg").className=`text-sm ${o?"text-green-700":"text-red-600"}`};s("respaldar").addEventListener("click",async()=>{const n=s("respaldar");n.disabled=!0,n.textContent="Creando copia...";try{const o=await q("/respaldos",{method:"POST"});p(`Copia creada: ${o.nombre}.`,!0),await l()}catch(o){p(o instanceof k?o.message:"No se pudo crear la copia",!1)}n.disabled=!1,n.textContent="Crear copia ahora"}),s("r-lista").addEventListener("click",n=>{var i,v;const o=(v=(i=n.target.closest("[data-bajar]"))==null?void 0:i.closest("[data-n]"))==null?void 0:v.dataset.n;o&&Oe(`/respaldos/${o}`,o).catch(()=>p("No se pudo descargar la copia",!1))}),await l()}const Qt=[{hash:"#/",texto:"Inicio",icono:A.inicio},{hash:"#/nueva",texto:"Nueva acta",icono:A.nueva},{hash:"#/vencidas",texto:"Vencidas",icono:A.reloj},{hash:"#/pacientes",texto:"Pacientes",icono:A.pacientes},{hash:"#/equipos",texto:"Equipos",icono:A.equipos,admin:!0},{hash:"#/usuarios",texto:"Usuarios",icono:A.usuarios,admin:!0},{hash:"#/reportes",texto:"Reportes",icono:A.reportes,admin:!0},{hash:"#/auditoria",texto:"Auditoría",icono:A.auditoria,admin:!0}];function Wt(t,a,e){const s=location.hash||"#/",r=a.nombre.split(" ").filter(Boolean).slice(0,2).map(o=>o[0]).join("").toUpperCase(),u=Qt.filter(o=>!o.admin||a.rol==="ADMIN").map(o=>{const i=o.hash==="#/"?s==="#/"||s==="":o.hash==="#/equipos"?s.startsWith("#/equipo"):s.startsWith(o.hash),v="nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium",w=o.hash==="#/vencidas"?'<span id="badge-vencidas" class="hidden ml-auto text-[11px] font-semibold bg-red-500 text-white rounded-full px-2 py-0.5"></span>':"";return`<a href="${o.hash}" ${i?'aria-current="page"':""} class="${v} ${i?"nav-activo text-white":"text-blue-50/90 hover:bg-white/10 hover:text-white"}">${o.icono}<span>${o.texto}</span>${w}</a>`}).join("");t.innerHTML=`
    <div class="md:hidden lateral text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
      <span class="font-semibold tracking-tight">Préstamo de equipos</span>
      <button id="menu" class="p-2 -mr-2 rounded-lg text-white hover:bg-white/10" aria-label="Abrir menú" aria-expanded="false" aria-controls="lateral">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
    <div id="fondo" class="hidden fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] z-30 md:hidden"></div>
    <aside id="lateral" class="lateral hidden md:flex fixed inset-y-0 left-0 w-64 z-40 flex-col text-white">
      <div class="px-5 pt-6 pb-4">
        <img src="/logo-blanco.png" alt="IPS Nueva Popayán" class="w-full h-auto max-w-[170px]" />
        <p class="mt-5 text-[11px] font-medium uppercase tracking-[.2em] text-blue-200/90 leading-relaxed">Préstamo de equipos de cardiología</p>
      </div>
      <nav class="flex-1 px-4 pt-3 space-y-1 overflow-auto" aria-label="Principal">${u}</nav>
      <div class="p-4">
        <div class="flex items-center gap-3 px-2 py-2">
          <div class="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">${c(r)}</div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">${c(a.nombre)}</p>
            <p class="text-xs text-blue-200">${a.rol==="ADMIN"?"Administrador":"Operador"}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-2">
          <a href="#/cuenta" class="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap border border-white/25 hover:bg-white/10 rounded-xl px-2 py-2 text-xs font-medium text-white">${A.cuenta}Mi cuenta</a>
          <button id="logout" class="flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap border border-white/25 hover:bg-white/10 rounded-xl px-2 py-2 text-xs font-medium text-white">${A.salir}Salir</button>
        </div>
      </div>
    </aside>
    <main id="main" class="md:pl-64"><div id="contenido" class="max-w-7xl mx-auto p-4 md:p-8"></div></main>`;const l=t.querySelector("#lateral"),p=t.querySelector("#fondo"),n=()=>{l.classList.toggle("hidden"),p.classList.toggle("hidden"),t.querySelector("#menu").setAttribute("aria-expanded",String(!l.classList.contains("hidden")))};return t.querySelector("#menu").addEventListener("click",n),p.addEventListener("click",n),l.querySelectorAll("nav a, a[href='#/cuenta']").forEach(o=>o.addEventListener("click",()=>{p.classList.contains("hidden")||n()})),q("/dashboard").then(o=>{const i=t.querySelector("#badge-vencidas");i&&o.vencidas>0&&(i.textContent=`${o.vencidas} vencida${o.vencidas>1?"s":""}`,i.classList.remove("hidden"))}).catch(()=>{}),t.querySelector("#logout").addEventListener("click",()=>{Xe(),e()}),t.querySelector("#contenido")}const Ke=()=>{const t="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",a=crypto.getRandomValues(new Uint32Array(10));return Array.from(a,e=>t[e%t.length]).join("")};async function Yt(t,a){if(a.rol!=="ADMIN"){t.innerHTML='<div class="bg-white rounded-2xl shadow p-8 text-center text-slate-600">Solo los administradores pueden gestionar usuarios.</div>';return}let e=[];t.innerHTML=`
    <div class="space-y-6">
      ${de("Administración","Usuarios","Crea cuentas para el personal y controla quién puede entrar.",`<button id="nuevo" class="${J} inline-flex items-center gap-2 !rounded-xl !px-5 !py-2.5">${A.mas}Nuevo usuario</button>`)}
      <section class="bg-white rounded-2xl shadow p-5 space-y-3">
        <p id="msg" class="text-sm"></p>
        <div class="overflow-auto"><table class="w-full text-left text-sm">
          <thead class="text-xs uppercase text-slate-400 border-b"><tr>
            <th class="py-2 pr-3">Nombre</th><th class="pr-3">Usuario</th><th class="pr-3">Rol</th><th class="pr-3">Estado</th><th class="pr-3">Último acceso</th><th></th></tr></thead>
          <tbody id="filas" class="divide-y"></tbody></table></div>
      </section>
    </div>`;const s=n=>t.querySelector(`#${n}`),r=(n,o=!1)=>{n&&V(n,o?"error":"ok"),s("msg").textContent=n,s("msg").className=`text-sm ${o?"text-red-600":"text-green-700 font-medium"}`},u=async()=>{e=await q("/usuarios"),s("filas").innerHTML=e.map(n=>`<tr data-id="${n.id}" class="${n.activo?"":"opacity-50"}">
          <td class="py-3 pr-3"><p class="font-medium text-slate-800">${c(n.nombre)}</p><p class="text-xs text-slate-400">${c(n.email)}</p></td>
          <td class="pr-3">${c(n.username)}</td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${n.rol==="ADMIN"?"bg-blue-100 text-blue-700":"bg-slate-100 text-slate-600"}">${n.rol==="ADMIN"?"Administrador":"Operador"}</span></td>
          <td class="pr-3"><span class="text-xs px-2 py-0.5 rounded-full ${n.activo?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}">${n.activo?"Activo":"Inactivo"}</span>
            ${n.debe_cambiar_password?'<span class="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Contraseña temporal</span>':""}</td>
          <td class="pr-3 text-slate-500 whitespace-nowrap">${n.ultimo_login?F(new Date(n.ultimo_login)):"Nunca"}</td>
          <td class="text-right whitespace-nowrap">
            <button data-editar class="${ae} !px-3 !py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700">Editar</button>
            <button data-reset class="${ae} !px-3 !py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800">Restablecer clave</button></td></tr>`).join("")},l=n=>{var i;const o=K(`<form class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">${n?"Editar usuario":"Nuevo usuario"}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2"><label class="${S}">Nombre completo *</label><input id="u-nombre" required class="${N}" value="${c(n==null?void 0:n.nombre)}" /></div>
          <div><label class="${S}">Usuario *</label><input id="u-user" required ${n?"disabled":""} pattern="[A-Za-z0-9._-]{3,50}" class="${N}" value="${c(n==null?void 0:n.username)}" placeholder="ej: laura.perez" /></div>
          <div><label class="${S}">Rol</label><select id="u-rol" class="${N}">
            <option value="OPERADOR" ${(n==null?void 0:n.rol)==="OPERADOR"?"selected":""}>Operador (enfermería)</option>
            <option value="ADMIN" ${(n==null?void 0:n.rol)==="ADMIN"?"selected":""}>Administrador</option></select></div>
          <div class="col-span-2"><label class="${S}">Correo</label><input id="u-email" type="email" class="${N}" value="${c(n==null?void 0:n.email)}" /></div>
          ${n?`<label class="col-span-2 flex items-center gap-2 text-sm"><input id="u-activo" type="checkbox" class="w-4 h-4" ${n.activo?"checked":""} /> Usuario activo (puede iniciar sesión)</label>`:`<div class="col-span-2"><label class="${S}">Contraseña inicial *</label>
                  <div class="flex gap-2"><input id="u-pass" required minlength="8" class="${N} font-mono" value="${Ke()}" />
                  <button type="button" id="u-gen" class="${H} whitespace-nowrap">Generar otra</button></div>
                  <p class="text-xs text-slate-500 mt-1">Anótala y entrégala al usuario: al ingresar deberá crear la suya.</p></div>`}
        </div>
        <p id="u-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button type="button" id="u-cancelar" class="${H}">Cancelar</button>
          <button id="u-guardar" class="${J}">Guardar</button></div>
      </form>`);o.q("#u-cancelar").addEventListener("click",o.cerrar),(i=o.q("#u-gen"))==null||i.addEventListener("click",()=>o.q("#u-pass").value=Ke()),o.q("form").addEventListener("submit",async v=>{v.preventDefault();const w=g=>o.q(g).value.trim(),h=o.q("#u-guardar");h.disabled=!0;try{n?await q(`/usuarios/${n.id}`,{method:"PUT",body:JSON.stringify({nombre:w("#u-nombre"),email:w("#u-email")||null,rol:w("#u-rol"),activo:o.q("#u-activo").checked})}):await q("/usuarios",{method:"POST",body:JSON.stringify({nombre:w("#u-nombre"),username:w("#u-user"),email:w("#u-email")||null,rol:w("#u-rol"),password:w("#u-pass")})}),o.cerrar(),await u(),r(n?"Usuario actualizado.":"Usuario creado. Entrégale su contraseña inicial.")}catch(g){o.q("#u-error").textContent=g instanceof k?g.message:"No se pudo guardar",o.q("#u-error").classList.remove("hidden"),h.disabled=!1}})},p=n=>{const o=K(`<div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-slate-900">Restablecer contraseña</h3>
        <p id="r-texto" class="text-sm text-slate-600">Se generará una contraseña temporal para <b>${c(n.nombre)}</b>. La actual dejará de funcionar y deberá crear una nueva al ingresar.</p>
        <div id="r-clave" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p class="text-xs text-slate-500 mb-1">Contraseña temporal (se muestra una sola vez)</p>
          <p id="r-valor" class="font-mono text-xl font-semibold text-blue-900 select-all"></p>
          <button id="r-copiar" class="mt-2 text-sm text-blue-700 hover:underline">Copiar</button>
        </div>
        <p id="r-error" class="text-sm text-red-600 hidden"></p>
        <div class="flex justify-end gap-2">
          <button id="r-no" class="${H}">Cerrar</button>
          <button id="r-si" class="${J}">Generar contraseña</button>
        </div>
      </div>`);o.q("#r-no").addEventListener("click",o.cerrar),o.q("#r-si").addEventListener("click",async()=>{try{const i=await q(`/usuarios/${n.id}/reset-password`,{method:"POST"});o.q("#r-valor").textContent=i.password_temporal,o.q("#r-clave").classList.remove("hidden"),o.q("#r-si").classList.add("hidden"),await u()}catch(i){o.q("#r-error").textContent=i instanceof k?i.message:"No se pudo restablecer",o.q("#r-error").classList.remove("hidden")}}),o.q("#r-copiar").addEventListener("click",()=>{var i;(i=navigator.clipboard)==null||i.writeText(o.q("#r-valor").textContent??""),o.q("#r-copiar").textContent="Copiada ✔"})};s("nuevo").addEventListener("click",()=>l()),s("filas").addEventListener("click",n=>{const o=n.target,i=e.find(v=>{var w;return v.id===((w=o.closest("[data-id]"))==null?void 0:w.dataset.id)});i&&(o.closest("[data-editar]")?l(i):o.closest("[data-reset]")&&p(i))}),await u().catch(()=>r("No se pudo cargar los usuarios.",!0))}const ke="rounded-lg px-3 py-1.5 text-sm font-medium transition";async function Kt(t){let a=[],e="";t.innerHTML=`
    <div class="space-y-5">
      ${de("Atención","Equipos vencidos","Actas cuya fecha de devolución ya pasó y el equipo no ha sido devuelto.",`<a href="#/" class="${H} inline-flex items-center gap-2 !rounded-xl">${A.atras}Volver al inicio</a>`,"text-red-600")}

      <section class="bg-white rounded-2xl shadow p-5 space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <input id="buscar" placeholder="Buscar por nombre, documento, serie..."
            class="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-red-500" />
          <button id="recargar" class="bg-slate-100 hover:bg-slate-200 text-slate-700 ${ke}">↺ Actualizar</button>
        </div>
        <p id="conteo" class="text-sm text-slate-500"></p>
        <div id="lista" class="divide-y"></div>
      </section>
    </div>`;const s=i=>t.querySelector(`#${i}`),r=async()=>{s("lista").innerHTML=`
      ${'<div class="py-4 flex gap-3"><div class="skeleton w-5 h-5"></div><div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/3"></div><div class="skeleton h-3 w-1/2"></div></div></div>'.repeat(4)}`;try{a=await q("/dashboard/vencidas?limit=200"),p()}catch(i){s("lista").innerHTML='<p class="py-8 text-center text-red-600">No se pudieron cargar las actas vencidas.</p>',V(i instanceof k?i.message:"Error al cargar vencidas","error")}},u=()=>{if(!e.trim())return a;const i=e.toLowerCase();return a.filter(v=>v.paciente_nombre.toLowerCase().includes(i)||v.paciente_documento.includes(i)||v.equipo_serie.toLowerCase().includes(i))},l=i=>i===null?"":`<span class="text-xs px-2 py-0.5 rounded-full font-semibold ${i===0?"bg-amber-100 text-amber-800":i<=1?"bg-orange-100 text-orange-800":"bg-red-100 text-red-800"}">${i===0?"Hoy":i===1?"1 día":`${i} días`}</span>`,p=()=>{const i=u();if(s("conteo").textContent=a.length?`${i.length} de ${a.length} equipo(s) vencido(s)${e?" (filtrado)":""}`:"No hay equipos vencidos. ✔",!i.length){s("lista").innerHTML=`<p class="py-10 text-center text-slate-400">${e?"Sin resultados para esa búsqueda.":"🎉 No hay equipos vencidos."}</p>`;return}s("lista").innerHTML=i.map(v=>`
      <div class="py-4 flex items-start gap-3 flex-wrap" data-id="${v.acta_id}">
        <span class="text-red-500 text-xl leading-none pt-0.5">⏰</span>
        <div class="flex-1 min-w-0 space-y-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold">#${v.numero} · ${c(v.paciente_nombre)}</p>
            ${l(v.dias_vencida)}
            <span class="text-xs px-2 py-0.5 rounded-full ${v.estado==="ENVIADA"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700"}">${v.estado==="ENVIADA"?"Enviada":"Sin enviar"}</span>
          </div>
          <p class="text-sm text-slate-600">
            ${c(v.equipo_tipo)} · serie <b>${c(v.equipo_serie)}</b>
            · Doc: ${c(v.paciente_documento)}
          </p>
          <div class="flex gap-4 flex-wrap text-sm">
            ${v.paciente_telefono?`<a href="tel:${c(v.paciente_telefono)}" class="text-blue-700 hover:underline font-medium">📞 ${c(v.paciente_telefono)}</a>`:'<span class="text-slate-400">Sin teléfono</span>'}
            ${v.paciente_correo?`<a href="mailto:${c(v.paciente_correo)}" class="text-blue-700 hover:underline text-xs truncate max-w-xs">${c(v.paciente_correo)}</a>`:'<span class="text-slate-400 text-xs">Sin correo</span>'}
          </div>
          <p class="text-xs text-red-600">
            Debía devolver: ${v.fecha_devolucion_prevista?F(new Date(v.fecha_devolucion_prevista)):"—"}
          </p>
        </div>
        <div class="flex gap-2 shrink-0 flex-wrap justify-end">
          <button data-pdf class="${ke} bg-slate-100 hover:bg-slate-200">Ver PDF</button>
          <button data-devolver class="${ke} bg-blue-700 hover:bg-blue-800 text-white">Marcar devuelta</button>
        </div>
      </div>`).join("")},n=i=>new Promise(v=>{const{cerrar:w,q:h}=K(`
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">Registrar devolución tardía</h3>
          <p class="text-sm text-slate-600">
            <b>${c(i.paciente_nombre)}</b> devuelve el ${c(i.equipo_tipo)}
            serie <b>${c(i.equipo_serie)}</b>.
            ${i.dias_vencida?`<span class="text-red-600 font-medium">Lleva ${i.dias_vencida} día(s) de retraso.</span>`:""}
          </p>
          <div>
            <label class="block text-sm font-medium mb-1">¿En qué estado queda el equipo?</label>
            <select id="d-estado" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="DISPONIBLE">Disponible (listo para prestar)</option>
              <option value="MANTENIMIENTO">En mantenimiento (tiene algún daño)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Observaciones (opcional)</label>
            <textarea id="d-obs" rows="2" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: El paciente lo trajo con el cable doblado"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button id="d-cancelar" class="${H}">Cancelar</button>
            <button id="d-ok" class="${J}">Confirmar devolución</button>
          </div>
        </div>`);h("#d-cancelar").addEventListener("click",()=>{w(),v(null)}),h("#d-ok").addEventListener("click",()=>{const g=h("#d-estado").value,d=h("#d-obs").value.trim();w(),v({estado_equipo:g,observaciones:d})})}),o=async i=>{const v=await n(i);if(v)try{await q(`/actas/${i.acta_id}/devolver`,{method:"POST",body:JSON.stringify({estado_equipo:v.estado_equipo,observaciones:v.observaciones||null})}),V(v.estado_equipo==="DISPONIBLE"?`Devolución registrada. El equipo ${i.equipo_serie} quedó disponible.`:`Devolución registrada. El equipo ${i.equipo_serie} quedó en mantenimiento.`,"ok"),await r()}catch(w){V(w instanceof k?w.message:"No se pudo registrar la devolución","error")}};t.addEventListener("click",async i=>{const v=i.target,w=v.closest("[data-id]"),h=v.closest("button");if(v.id==="recargar"||v.closest("#recargar")){await r();return}if(!w||!h)return;const g=a.find(d=>d.acta_id===w.dataset.id);if(g)if(h.hasAttribute("data-pdf"))try{await me(g.acta_id)}catch(d){V(d instanceof k?d.message:"No se pudo abrir el PDF","error")}else h.hasAttribute("data-devolver")&&await o(g)}),s("buscar").addEventListener("input",i=>{e=i.target.value,p()}),await r()}const xe=document.getElementById("app");async function fe(){const a=(location.hash||"#/").split("?")[0];if(a.startsWith("#/firmar/"))return It(xe,a.slice(9));if(!le())return Gt(xe,fe);try{const e=await Ze();if(e.debe_cambiar_password)return xe.innerHTML='<div class="min-h-screen flex items-center p-4"><div id="forzado" class="w-full"></div></div>',Je(xe.querySelector("#forzado"),e,fe,!0);const s=Wt(xe,e,fe);a==="#/nueva"?await ot(s):a==="#/pacientes"?await Ft(s):a==="#/equipos"?await Ot(s,e):a.startsWith("#/equipo/")?await Dt(s,a.slice(9)):a==="#/usuarios"?await Yt(s,e):a==="#/reportes"?await Jt(s,e):a==="#/auditoria"?await Tt(s,e):a==="#/cuenta"?Je(s,e,()=>{}):a==="#/vencidas"?await Kt(s):await Bt(s)}catch{le()&&(xe.innerHTML='<p class="p-6 text-red-600">No se pudo cargar. Revisa que el backend esté encendido y recarga la página.</p>')}}window.addEventListener("auth-changed",fe);window.addEventListener("hashchange",fe);fe();
