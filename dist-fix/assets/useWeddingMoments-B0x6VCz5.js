import{c as i,f as c,r as w,s as a}from"./index-C-nJU4ju.js";import{u as g,a as m}from"./useMutation-zCoqdaK7.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=i("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=i("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=i("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=i("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=i("Music2",[["circle",{cx:"8",cy:"18",r:"4",key:"1fc0mg"}],["path",{d:"M12 18V2l7 4",key:"g04rme"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=i("UtensilsCrossed",[["path",{d:"m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8",key:"n7qcjb"}],["path",{d:"M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7",key:"d0u48b"}],["path",{d:"m2.1 21.8 6.4-6.3",key:"yn04lh"}],["path",{d:"m19 5-7 7",key:"194lzd"}]]),d=new Map,_=(e,r)=>`${e}|all`;function q(e,r,t){const n=_(e);let s=d.get(n);return s?s.refs+=1:(s={channel:a.channel(`moments-${e}-all`).on("postgres_changes",{event:"*",schema:"public",table:"wedding_moments",filter:`hall_id=eq.${e}`},()=>t.invalidateQueries({queryKey:["wedding_moments",e]})).subscribe(),refs:1},d.set(n,s)),()=>{const o=d.get(n);o&&(o.refs-=1,o.refs<=0&&(a.removeChannel(o.channel),d.delete(n)))}}function U(e,r){const t=c(),n=g({queryKey:["wedding_moments",e,"all"],queryFn:async()=>{let s=a.from("wedding_moments").select("*").eq("hall_id",e);const{data:o,error:u}=await s.order("created_at",{ascending:!1});if(u)throw u;return o},enabled:!!e});return w.useEffect(()=>{if(e)return q(e,r,t)},[e,t,r]),n}function Q(e,r){const t=c();return m({mutationFn:async({file:n,guestName:s,tableNumber:o,caption:u})=>{const p=n.name.split(".").pop()||"jpg",l=`weddings/${e}/current/${crypto.randomUUID()}.${p}`,{error:f}=await a.storage.from("hall-assets").upload(l,n,{cacheControl:"3600",upsert:!1});if(f)throw f;const{data:h}=a.storage.from("hall-assets").getPublicUrl(l),{error:y}=await a.from("wedding_moments").insert({hall_id:e,wedding_id:null,image_url:h.publicUrl,storage_path:l,guest_name:s||null,table_number:o||null,caption:u||null});if(y)throw y},onSuccess:()=>t.invalidateQueries({queryKey:["wedding_moments",e]})})}function F(e){const r=c();return m({mutationFn:async t=>{t.storage_path&&await a.storage.from("hall-assets").remove([t.storage_path]);const{error:n}=await a.from("wedding_moments").delete().eq("id",t.id);if(n)throw n},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function x(e){const r=c();return m({mutationFn:async({id:t,approved:n})=>{const{error:s}=await a.from("wedding_moments").update({approved:n}).eq("id",t);if(s)throw s},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function R(e,r){return g({queryKey:["rsvps",e,r??"all"],queryFn:async()=>{let t=a.from("rsvps").select("*").eq("hall_id",e);r&&(t=t.eq("wedding_id",r));const{data:n,error:s}=await t.order("created_at",{ascending:!1});if(s)throw s;return n},enabled:!!e})}function S(e,r){const t=c();return m({mutationFn:async n=>{const{error:s}=await a.from("rsvps").insert({...n,hall_id:e,wedding_id:null});if(s)throw s},onSuccess:()=>t.invalidateQueries({queryKey:["rsvps",e]})})}export{C,L,$ as M,K as U,U as a,M as b,k as c,F as d,x as e,Q as f,S as g,R as u};
