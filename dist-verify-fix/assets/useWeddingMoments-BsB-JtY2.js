import{c as i,f as c,r as w,s as a}from"./index-DfZFgu31.js";import{u as p,a as m}from"./useMutation-Bz78G0j8.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=i("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=i("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=i("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=i("ImagePlus",[["path",{d:"M16 5h6",key:"1vod17"}],["path",{d:"M19 2v6",key:"4bpg5p"}],["path",{d:"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5",key:"1ue2ih"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=i("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=i("Music2",[["circle",{cx:"8",cy:"18",r:"4",key:"1fc0mg"}],["path",{d:"M12 18V2l7 4",key:"g04rme"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=i("UtensilsCrossed",[["path",{d:"m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8",key:"n7qcjb"}],["path",{d:"M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7",key:"d0u48b"}],["path",{d:"m2.1 21.8 6.4-6.3",key:"yn04lh"}],["path",{d:"m19 5-7 7",key:"194lzd"}]]),d=new Map,_=(e,r)=>`${e}|all`;function q(e,r,t){const s=_(e);let n=d.get(s);return n?n.refs+=1:(n={channel:a.channel(`moments-${e}-all`).on("postgres_changes",{event:"*",schema:"public",table:"wedding_moments",filter:`hall_id=eq.${e}`},()=>t.invalidateQueries({queryKey:["wedding_moments",e]})).subscribe(),refs:1},d.set(s,n)),()=>{const o=d.get(s);o&&(o.refs-=1,o.refs<=0&&(a.removeChannel(o.channel),d.delete(s)))}}function x(e,r){const t=c(),s=p({queryKey:["wedding_moments",e,"all"],queryFn:async()=>{let n=a.from("wedding_moments").select("*").eq("hall_id",e);const{data:o,error:u}=await n.order("created_at",{ascending:!1});if(u)throw u;return o},enabled:!!e});return w.useEffect(()=>{if(e)return q(e,r,t)},[e,t,r]),s}function Q(e,r){const t=c();return m({mutationFn:async({file:s,guestName:n,tableNumber:o,caption:u})=>{const g=s.name.split(".").pop()||"jpg",l=`weddings/${e}/current/${crypto.randomUUID()}.${g}`,{error:y}=await a.storage.from("hall-assets").upload(l,s,{cacheControl:"3600",upsert:!1});if(y)throw y;const{data:h}=a.storage.from("hall-assets").getPublicUrl(l),{error:f}=await a.from("wedding_moments").insert({hall_id:e,wedding_id:null,image_url:h.publicUrl,storage_path:l,guest_name:n||null,table_number:o||null,caption:u||null});if(f)throw f},onSuccess:()=>t.invalidateQueries({queryKey:["wedding_moments",e]})})}function F(e){const r=c();return m({mutationFn:async t=>{t.storage_path&&await a.storage.from("hall-assets").remove([t.storage_path]);const{error:s}=await a.from("wedding_moments").delete().eq("id",t.id);if(s)throw s},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function R(e){const r=c();return m({mutationFn:async({id:t,approved:s})=>{const{error:n}=await a.from("wedding_moments").update({approved:s}).eq("id",t);if(n)throw n},onSuccess:()=>r.invalidateQueries({queryKey:["wedding_moments",e]})})}function S(e,r){return p({queryKey:["rsvps",e,r??"all"],queryFn:async()=>{let t=a.from("rsvps").select("*").eq("hall_id",e);r&&(t=t.eq("wedding_id",r));const{data:s,error:n}=await t.order("created_at",{ascending:!1});if(n)throw n;return s},enabled:!!e})}function V(e,r){const t=c();return m({mutationFn:async s=>{const{error:n}=await a.from("rsvps").insert({...s,hall_id:e,wedding_id:null});if(n)throw n},onSuccess:()=>t.invalidateQueries({queryKey:["rsvps",e]})})}export{k as C,L as I,$ as L,K as M,U,x as a,M as b,C as c,F as d,R as e,Q as f,V as g,S as u};
