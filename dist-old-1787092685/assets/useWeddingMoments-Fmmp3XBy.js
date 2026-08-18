import{c as o,E as c,r as f,s}from"./index-D2vCAULv.js";import{u as p,a as d}from"./useMutation-DnnjFgcw.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=o("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=o("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=o("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=o("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=o("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=o("Music2",[["circle",{cx:"8",cy:"18",r:"4",key:"1fc0mg"}],["path",{d:"M12 18V2l7 4",key:"g04rme"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=o("UtensilsCrossed",[["path",{d:"m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8",key:"n7qcjb"}],["path",{d:"M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7",key:"d0u48b"}],["path",{d:"m2.1 21.8 6.4-6.3",key:"yn04lh"}],["path",{d:"m19 5-7 7",key:"194lzd"}]]);function U(e,r){const t=c(),n=p({queryKey:["wedding_moments",e,"all"],queryFn:async()=>{let a=s.from("wedding_moments").select("*").eq("hall_id",e);const{data:u,error:i}=await a.order("created_at",{ascending:!1});if(i)throw i;return u},enabled:!!e});return f.useEffect(()=>{if(!e)return;const a=s.channel(`moments-${e}-all`).on("postgres_changes",{event:"*",schema:"public",table:"wedding_moments",filter:`hall_id=eq.${e}`},()=>t.invalidateQueries({queryKey:["wedding_moments",e]})).subscribe();return()=>{s.removeChannel(a)}},[e,t,r]),n}function $(e,r){const t=c();return d({mutationFn:async({file:n,guestName:a,tableNumber:u,caption:i})=>{const y=n.name.split(".").pop()||"jpg",l=`weddings/${e}/current/${crypto.randomUUID()}.${y}`,{error:m}=await s.storage.from("hall-assets").upload(l,n,{cacheControl:"3600",upsert:!1});if(m)throw m;const{data:h}=s.storage.from("hall-assets").getPublicUrl(l),{error:g}=await s.from("wedding_moments").insert({hall_id:e,wedding_id:null,image_url:h.publicUrl,storage_path:l,guest_name:a||null,table_number:u||null,caption:i||null});if(g)throw g},onSuccess:()=>t.invalidateQueries({queryKey:["wedding_moments",e]})})}function F(e){const r=c();return d({mutationFn:async t=>{t.storage_path&&await s.storage.from("hall-assets").remove([t.storage_path]);const{error:n}=await s.from("wedding_moments").delete().eq("id",t.id);if(n)throw n},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function K(e){const r=c();return d({mutationFn:async({id:t,approved:n})=>{const{error:a}=await s.from("wedding_moments").update({approved:n}).eq("id",t);if(a)throw a},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function Q(e,r){return p({queryKey:["rsvps",e,"all"],queryFn:async()=>{let t=s.from("rsvps").select("*").eq("hall_id",e);const{data:n,error:a}=await t.order("created_at",{ascending:!1});if(a)throw a;return n},enabled:!!e})}function x(e,r){return d({mutationFn:async t=>{const{error:n}=await s.from("rsvps").insert({...t,hall_id:e,wedding_id:null});if(n)throw n}})}export{q as C,k as H,C as L,M,L as U,v as a,b,Q as c,F as d,K as e,$ as f,x as g,U as u};
