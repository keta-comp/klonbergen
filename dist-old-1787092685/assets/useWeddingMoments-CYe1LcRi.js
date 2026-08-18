import{c as o,f as c,r as h,s as a}from"./index-CVf0dpsl.js";import{u as g,a as u}from"./useMutation-CHOu2UqC.js";/**
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
 */const k=o("UtensilsCrossed",[["path",{d:"m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8",key:"n7qcjb"}],["path",{d:"M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7",key:"d0u48b"}],["path",{d:"m2.1 21.8 6.4-6.3",key:"yn04lh"}],["path",{d:"m19 5-7 7",key:"194lzd"}]]);function L(e,s){const t=c(),n=g({queryKey:["wedding_moments",e,"all"],queryFn:async()=>{let r=a.from("wedding_moments").select("*").eq("hall_id",e);const{data:d,error:i}=await r.order("created_at",{ascending:!1});if(i)throw i;return d},enabled:!!e});return h.useEffect(()=>{if(!e)return;const r=a.channel(`moments-${e}-all`).on("postgres_changes",{event:"*",schema:"public",table:"wedding_moments",filter:`hall_id=eq.${e}`},()=>t.invalidateQueries({queryKey:["wedding_moments",e]})).subscribe();return()=>{a.removeChannel(r)}},[e,t,s]),n}function U(e,s){const t=c();return u({mutationFn:async({file:n,guestName:r,tableNumber:d,caption:i})=>{const f=n.name.split(".").pop()||"jpg",m=`weddings/${e}/current/${crypto.randomUUID()}.${f}`,{error:l}=await a.storage.from("hall-assets").upload(m,n,{cacheControl:"3600",upsert:!1});if(l)throw l;const{data:y}=a.storage.from("hall-assets").getPublicUrl(m),{error:p}=await a.from("wedding_moments").insert({hall_id:e,wedding_id:null,image_url:y.publicUrl,storage_path:m,guest_name:r||null,table_number:d||null,caption:i||null});if(p)throw p},onSuccess:()=>t.invalidateQueries({queryKey:["wedding_moments",e]})})}function $(e){const s=c();return u({mutationFn:async t=>{t.storage_path&&await a.storage.from("hall-assets").remove([t.storage_path]);const{error:n}=await a.from("wedding_moments").delete().eq("id",t.id);if(n)throw n},onSuccess:()=>s.invalidateQueries({queryKey:["wedding_moments",e]})})}function F(e){const s=c();return u({mutationFn:async({id:t,approved:n})=>{const{error:r}=await a.from("wedding_moments").update({approved:n}).eq("id",t);if(r)throw r},onSuccess:()=>s.invalidateQueries({queryKey:["wedding_moments",e]})})}function K(e,s){return g({queryKey:["rsvps",e,s??"all"],queryFn:async()=>{let t=a.from("rsvps").select("*").eq("hall_id",e);s&&(t=t.eq("wedding_id",s));const{data:n,error:r}=await t.order("created_at",{ascending:!1});if(r)throw r;return n},enabled:!!e})}function Q(e,s){return u({mutationFn:async t=>{const{error:n}=await a.from("rsvps").insert({...t,hall_id:e,wedding_id:null});if(n)throw n}})}export{q as C,C as L,M,k as U,L as a,v as b,b as c,$ as d,F as e,U as f,Q as g,K as u};
