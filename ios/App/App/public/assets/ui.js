import{r as a,j as v,R as z,a as ct,b as wn,c as it}from"./vendor.js";function P(e,t,{checkForDefaultPrevented:n=!0}={}){return function(o){if(e==null||e(o),n===!1||!o.defaultPrevented)return t==null?void 0:t(o)}}function Ke(e,t){if(typeof e=="function")return e(t);e!=null&&(e.current=t)}function lt(...e){return t=>{let n=!1;const r=e.map(o=>{const s=Ke(o,t);return!n&&typeof s=="function"&&(n=!0),s});if(n)return()=>{for(let o=0;o<r.length;o++){const s=r[o];typeof s=="function"?s():Ke(e[o],null)}}}}function L(...e){return a.useCallback(lt(...e),e)}function En(e,t){const n=a.createContext(t),r=s=>{const{children:i,...c}=s,p=a.useMemo(()=>c,Object.values(c));return v.jsx(n.Provider,{value:p,children:i})};r.displayName=e+"Provider";function o(s){const i=a.useContext(n);if(i)return i;if(t!==void 0)return t;throw new Error(`\`${s}\` must be used within \`${e}\``)}return[r,o]}function te(e,t=[]){let n=[];function r(s,i){const c=a.createContext(i),p=n.length;n=[...n,i];const l=y=>{var k;const{scope:m,children:w,...C}=y,d=((k=m==null?void 0:m[e])==null?void 0:k[p])||c,f=a.useMemo(()=>C,Object.values(C));return v.jsx(d.Provider,{value:f,children:w})};l.displayName=s+"Provider";function h(y,m){var d;const w=((d=m==null?void 0:m[e])==null?void 0:d[p])||c,C=a.useContext(w);if(C)return C;if(i!==void 0)return i;throw new Error(`\`${y}\` must be used within \`${s}\``)}return[l,h]}const o=()=>{const s=n.map(i=>a.createContext(i));return function(c){const p=(c==null?void 0:c[e])||s;return a.useMemo(()=>({[`__scope${e}`]:{...c,[e]:p}}),[c,p])}};return o.scopeName=e,[r,Mn(o,...t)]}function Mn(...e){const t=e[0];if(e.length===1)return t;const n=()=>{const r=e.map(o=>({useScope:o(),scopeName:o.scopeName}));return function(s){const i=r.reduce((c,{useScope:p,scopeName:l})=>{const y=p(s)[`__scope${l}`];return{...c,...y}},{});return a.useMemo(()=>({[`__scope${t.scopeName}`]:i}),[i])}};return n.scopeName=t.scopeName,n}function ee(e){const t=Cn(e),n=a.forwardRef((r,o)=>{const{children:s,...i}=r,c=a.Children.toArray(s),p=c.find(Tn);if(p){const l=p.props.children,h=c.map(y=>y===p?a.Children.count(l)>1?a.Children.only(null):a.isValidElement(l)?l.props.children:null:y);return v.jsx(t,{...i,ref:o,children:a.isValidElement(l)?a.cloneElement(l,void 0,h):null})}return v.jsx(t,{...i,ref:o,children:s})});return n.displayName=`${e}.Slot`,n}var Oo=ee("Slot");function Cn(e){const t=a.forwardRef((n,r)=>{const{children:o,...s}=n;if(a.isValidElement(o)){const i=Rn(o),c=Sn(s,o.props);return o.type!==a.Fragment&&(c.ref=r?lt(r,i):i),a.cloneElement(o,c)}return a.Children.count(o)>1?a.Children.only(null):null});return t.displayName=`${e}.SlotClone`,t}var ut=Symbol("radix.slottable");function Fo(e){const t=({children:n})=>v.jsx(v.Fragment,{children:n});return t.displayName=`${e}.Slottable`,t.__radixId=ut,t}function Tn(e){return a.isValidElement(e)&&typeof e.type=="function"&&"__radixId"in e.type&&e.type.__radixId===ut}function Sn(e,t){const n={...t};for(const r in t){const o=e[r],s=t[r];/^on[A-Z]/.test(r)?o&&s?n[r]=(...c)=>{const p=s(...c);return o(...c),p}:o&&(n[r]=o):r==="style"?n[r]={...o,...s}:r==="className"&&(n[r]=[o,s].filter(Boolean).join(" "))}return{...e,...n}}function Rn(e){var r,o;let t=(r=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:r.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}function dt(e){const t=e+"CollectionProvider",[n,r]=te(t),[o,s]=n(t,{collectionRef:{current:null},itemMap:new Map}),i=d=>{const{scope:f,children:k}=d,b=z.useRef(null),g=z.useRef(new Map).current;return v.jsx(o,{scope:f,itemMap:g,collectionRef:b,children:k})};i.displayName=t;const c=e+"CollectionSlot",p=ee(c),l=z.forwardRef((d,f)=>{const{scope:k,children:b}=d,g=s(c,k),x=L(f,g.collectionRef);return v.jsx(p,{ref:x,children:b})});l.displayName=c;const h=e+"CollectionItemSlot",y="data-radix-collection-item",m=ee(h),w=z.forwardRef((d,f)=>{const{scope:k,children:b,...g}=d,x=z.useRef(null),E=L(f,x),S=s(h,k);return z.useEffect(()=>(S.itemMap.set(x,{ref:x,...g}),()=>void S.itemMap.delete(x))),v.jsx(m,{[y]:"",ref:E,children:b})});w.displayName=h;function C(d){const f=s(e+"CollectionConsumer",d);return z.useCallback(()=>{const b=f.collectionRef.current;if(!b)return[];const g=Array.from(b.querySelectorAll(`[${y}]`));return Array.from(f.itemMap.values()).sort((S,M)=>g.indexOf(S.ref.current)-g.indexOf(M.ref.current))},[f.collectionRef,f.itemMap])}return[{Provider:i,Slot:l,ItemSlot:w},C,r]}var Pn=["a","button","div","form","h2","h3","img","input","label","li","nav","ol","p","select","span","svg","ul"],A=Pn.reduce((e,t)=>{const n=ee(`Primitive.${t}`),r=a.forwardRef((o,s)=>{const{asChild:i,...c}=o,p=i?n:t;return typeof window<"u"&&(window[Symbol.for("radix-ui")]=!0),v.jsx(p,{...c,ref:s})});return r.displayName=`Primitive.${t}`,{...e,[t]:r}},{});function ft(e,t){e&&ct.flushSync(()=>e.dispatchEvent(t))}function V(e){const t=a.useRef(e);return a.useEffect(()=>{t.current=e}),a.useMemo(()=>(...n)=>{var r;return(r=t.current)==null?void 0:r.call(t,...n)},[])}function An(e,t=globalThis==null?void 0:globalThis.document){const n=V(e);a.useEffect(()=>{const r=o=>{o.key==="Escape"&&n(o)};return t.addEventListener("keydown",r,{capture:!0}),()=>t.removeEventListener("keydown",r,{capture:!0})},[n,t])}var In="DismissableLayer",Ie="dismissableLayer.update",Nn="dismissableLayer.pointerDownOutside",Dn="dismissableLayer.focusOutside",Ge,ht=a.createContext({layers:new Set,layersWithOutsidePointerEventsDisabled:new Set,branches:new Set}),_e=a.forwardRef((e,t)=>{const{disableOutsidePointerEvents:n=!1,onEscapeKeyDown:r,onPointerDownOutside:o,onFocusOutside:s,onInteractOutside:i,onDismiss:c,...p}=e,l=a.useContext(ht),[h,y]=a.useState(null),m=(h==null?void 0:h.ownerDocument)??(globalThis==null?void 0:globalThis.document),[,w]=a.useState({}),C=L(t,M=>y(M)),d=Array.from(l.layers),[f]=[...l.layersWithOutsidePointerEventsDisabled].slice(-1),k=d.indexOf(f),b=h?d.indexOf(h):-1,g=l.layersWithOutsidePointerEventsDisabled.size>0,x=b>=k,E=On(M=>{const R=M.target,N=[...l.branches].some(F=>F.contains(R));!x||N||(o==null||o(M),i==null||i(M),M.defaultPrevented||c==null||c())},m),S=Fn(M=>{const R=M.target;[...l.branches].some(F=>F.contains(R))||(s==null||s(M),i==null||i(M),M.defaultPrevented||c==null||c())},m);return An(M=>{b===l.layers.size-1&&(r==null||r(M),!M.defaultPrevented&&c&&(M.preventDefault(),c()))},m),a.useEffect(()=>{if(h)return n&&(l.layersWithOutsidePointerEventsDisabled.size===0&&(Ge=m.body.style.pointerEvents,m.body.style.pointerEvents="none"),l.layersWithOutsidePointerEventsDisabled.add(h)),l.layers.add(h),Ze(),()=>{n&&l.layersWithOutsidePointerEventsDisabled.size===1&&(m.body.style.pointerEvents=Ge)}},[h,m,n,l]),a.useEffect(()=>()=>{h&&(l.layers.delete(h),l.layersWithOutsidePointerEventsDisabled.delete(h),Ze())},[h,l]),a.useEffect(()=>{const M=()=>w({});return document.addEventListener(Ie,M),()=>document.removeEventListener(Ie,M)},[]),v.jsx(A.div,{...p,ref:C,style:{pointerEvents:g?x?"auto":"none":void 0,...e.style},onFocusCapture:P(e.onFocusCapture,S.onFocusCapture),onBlurCapture:P(e.onBlurCapture,S.onBlurCapture),onPointerDownCapture:P(e.onPointerDownCapture,E.onPointerDownCapture)})});_e.displayName=In;var Ln="DismissableLayerBranch",pt=a.forwardRef((e,t)=>{const n=a.useContext(ht),r=a.useRef(null),o=L(t,r);return a.useEffect(()=>{const s=r.current;if(s)return n.branches.add(s),()=>{n.branches.delete(s)}},[n.branches]),v.jsx(A.div,{...e,ref:o})});pt.displayName=Ln;function On(e,t=globalThis==null?void 0:globalThis.document){const n=V(e),r=a.useRef(!1),o=a.useRef(()=>{});return a.useEffect(()=>{const s=c=>{if(c.target&&!r.current){let p=function(){yt(Nn,n,l,{discrete:!0})};const l={originalEvent:c};c.pointerType==="touch"?(t.removeEventListener("click",o.current),o.current=p,t.addEventListener("click",o.current,{once:!0})):p()}else t.removeEventListener("click",o.current);r.current=!1},i=window.setTimeout(()=>{t.addEventListener("pointerdown",s)},0);return()=>{window.clearTimeout(i),t.removeEventListener("pointerdown",s),t.removeEventListener("click",o.current)}},[t,n]),{onPointerDownCapture:()=>r.current=!0}}function Fn(e,t=globalThis==null?void 0:globalThis.document){const n=V(e),r=a.useRef(!1);return a.useEffect(()=>{const o=s=>{s.target&&!r.current&&yt(Dn,n,{originalEvent:s},{discrete:!1})};return t.addEventListener("focusin",o),()=>t.removeEventListener("focusin",o)},[t,n]),{onFocusCapture:()=>r.current=!0,onBlurCapture:()=>r.current=!1}}function Ze(){const e=new CustomEvent(Ie);document.dispatchEvent(e)}function yt(e,t,n,{discrete:r}){const o=n.originalEvent.target,s=new CustomEvent(e,{bubbles:!1,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?ft(o,s):o.dispatchEvent(s)}var _n=_e,jn=pt,Z=globalThis!=null&&globalThis.document?a.useLayoutEffect:()=>{},Vn="Portal",je=a.forwardRef((e,t)=>{var c;const{container:n,...r}=e,[o,s]=a.useState(!1);Z(()=>s(!0),[]);const i=n||o&&((c=globalThis==null?void 0:globalThis.document)==null?void 0:c.body);return i?wn.createPortal(v.jsx(A.div,{...r,ref:t}),i):null});je.displayName=Vn;function Hn(e,t){return a.useReducer((n,r)=>t[n][r]??n,e)}var X=e=>{const{present:t,children:n}=e,r=qn(t),o=typeof n=="function"?n({present:r.isPresent}):a.Children.only(n),s=L(r.ref,zn(o));return typeof n=="function"||r.isPresent?a.cloneElement(o,{ref:s}):null};X.displayName="Presence";function qn(e){const[t,n]=a.useState(),r=a.useRef(null),o=a.useRef(e),s=a.useRef("none"),i=e?"mounted":"unmounted",[c,p]=Hn(i,{mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}});return a.useEffect(()=>{const l=se(r.current);s.current=c==="mounted"?l:"none"},[c]),Z(()=>{const l=r.current,h=o.current;if(h!==e){const m=s.current,w=se(l);e?p("MOUNT"):w==="none"||(l==null?void 0:l.display)==="none"?p("UNMOUNT"):p(h&&m!==w?"ANIMATION_OUT":"UNMOUNT"),o.current=e}},[e,p]),Z(()=>{if(t){let l;const h=t.ownerDocument.defaultView??window,y=w=>{const d=se(r.current).includes(w.animationName);if(w.target===t&&d&&(p("ANIMATION_END"),!o.current)){const f=t.style.animationFillMode;t.style.animationFillMode="forwards",l=h.setTimeout(()=>{t.style.animationFillMode==="forwards"&&(t.style.animationFillMode=f)})}},m=w=>{w.target===t&&(s.current=se(r.current))};return t.addEventListener("animationstart",m),t.addEventListener("animationcancel",y),t.addEventListener("animationend",y),()=>{h.clearTimeout(l),t.removeEventListener("animationstart",m),t.removeEventListener("animationcancel",y),t.removeEventListener("animationend",y)}}else p("ANIMATION_END")},[t,p]),{isPresent:["mounted","unmountSuspended"].includes(c),ref:a.useCallback(l=>{r.current=l?getComputedStyle(l):null,n(l)},[])}}function se(e){return(e==null?void 0:e.animationName)||"none"}function zn(e){var r,o;let t=(r=Object.getOwnPropertyDescriptor(e.props,"ref"))==null?void 0:r.get,n=t&&"isReactWarning"in t&&t.isReactWarning;return n?e.ref:(t=(o=Object.getOwnPropertyDescriptor(e,"ref"))==null?void 0:o.get,n=t&&"isReactWarning"in t&&t.isReactWarning,n?e.props.ref:e.props.ref||e.ref)}var Un=it[" useInsertionEffect ".trim().toString()]||Z;function ye({prop:e,defaultProp:t,onChange:n=()=>{},caller:r}){const[o,s,i]=Wn({defaultProp:t,onChange:n}),c=e!==void 0,p=c?e:o;{const h=a.useRef(e!==void 0);a.useEffect(()=>{const y=h.current;y!==c&&console.warn(`${r} is changing from ${y?"controlled":"uncontrolled"} to ${c?"controlled":"uncontrolled"}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`),h.current=c},[c,r])}const l=a.useCallback(h=>{var y;if(c){const m=Bn(h)?h(e):h;m!==e&&((y=i.current)==null||y.call(i,m))}else s(h)},[c,e,s,i]);return[p,l]}function Wn({defaultProp:e,onChange:t}){const[n,r]=a.useState(e),o=a.useRef(n),s=a.useRef(t);return Un(()=>{s.current=t},[t]),a.useEffect(()=>{var i;o.current!==n&&((i=s.current)==null||i.call(s,n),o.current=n)},[n,o]),[n,r,s]}function Bn(e){return typeof e=="function"}var $n=Object.freeze({position:"absolute",border:0,width:1,height:1,padding:0,margin:-1,overflow:"hidden",clip:"rect(0, 0, 0, 0)",whiteSpace:"nowrap",wordWrap:"normal"}),Kn="VisuallyHidden",ve=a.forwardRef((e,t)=>v.jsx(A.span,{...e,ref:t,style:{...$n,...e.style}}));ve.displayName=Kn;var _o=ve,Ve="ToastProvider",[He,Gn,Zn]=dt("Toast"),[vt,jo]=te("Toast",[Zn]),[Xn,me]=vt(Ve),mt=e=>{const{__scopeToast:t,label:n="Notification",duration:r=5e3,swipeDirection:o="right",swipeThreshold:s=50,children:i}=e,[c,p]=a.useState(null),[l,h]=a.useState(0),y=a.useRef(!1),m=a.useRef(!1);return n.trim()||console.error(`Invalid prop \`label\` supplied to \`${Ve}\`. Expected non-empty \`string\`.`),v.jsx(He.Provider,{scope:t,children:v.jsx(Xn,{scope:t,label:n,duration:r,swipeDirection:o,swipeThreshold:s,toastCount:l,viewport:c,onViewportChange:p,onToastAdd:a.useCallback(()=>h(w=>w+1),[]),onToastRemove:a.useCallback(()=>h(w=>w-1),[]),isFocusedToastEscapeKeyDownRef:y,isClosePausedRef:m,children:i})})};mt.displayName=Ve;var gt="ToastViewport",Yn=["F8"],Ne="toast.viewportPause",De="toast.viewportResume",kt=a.forwardRef((e,t)=>{const{__scopeToast:n,hotkey:r=Yn,label:o="Notifications ({hotkey})",...s}=e,i=me(gt,n),c=Gn(n),p=a.useRef(null),l=a.useRef(null),h=a.useRef(null),y=a.useRef(null),m=L(t,y,i.onViewportChange),w=r.join("+").replace(/Key/g,"").replace(/Digit/g,""),C=i.toastCount>0;a.useEffect(()=>{const f=k=>{var g;r.length!==0&&r.every(x=>k[x]||k.code===x)&&((g=y.current)==null||g.focus())};return document.addEventListener("keydown",f),()=>document.removeEventListener("keydown",f)},[r]),a.useEffect(()=>{const f=p.current,k=y.current;if(C&&f&&k){const b=()=>{if(!i.isClosePausedRef.current){const S=new CustomEvent(Ne);k.dispatchEvent(S),i.isClosePausedRef.current=!0}},g=()=>{if(i.isClosePausedRef.current){const S=new CustomEvent(De);k.dispatchEvent(S),i.isClosePausedRef.current=!1}},x=S=>{!f.contains(S.relatedTarget)&&g()},E=()=>{f.contains(document.activeElement)||g()};return f.addEventListener("focusin",b),f.addEventListener("focusout",x),f.addEventListener("pointermove",b),f.addEventListener("pointerleave",E),window.addEventListener("blur",b),window.addEventListener("focus",g),()=>{f.removeEventListener("focusin",b),f.removeEventListener("focusout",x),f.removeEventListener("pointermove",b),f.removeEventListener("pointerleave",E),window.removeEventListener("blur",b),window.removeEventListener("focus",g)}}},[C,i.isClosePausedRef]);const d=a.useCallback(({tabbingDirection:f})=>{const b=c().map(g=>{const x=g.ref.current,E=[x,...ur(x)];return f==="forwards"?E:E.reverse()});return(f==="forwards"?b.reverse():b).flat()},[c]);return a.useEffect(()=>{const f=y.current;if(f){const k=b=>{var E,S,M;const g=b.altKey||b.ctrlKey||b.metaKey;if(b.key==="Tab"&&!g){const R=document.activeElement,N=b.shiftKey;if(b.target===f&&N){(E=l.current)==null||E.focus();return}const H=d({tabbingDirection:N?"backwards":"forwards"}),W=H.findIndex(T=>T===R);we(H.slice(W+1))?b.preventDefault():N?(S=l.current)==null||S.focus():(M=h.current)==null||M.focus()}};return f.addEventListener("keydown",k),()=>f.removeEventListener("keydown",k)}},[c,d]),v.jsxs(jn,{ref:p,role:"region","aria-label":o.replace("{hotkey}",w),tabIndex:-1,style:{pointerEvents:C?void 0:"none"},children:[C&&v.jsx(Le,{ref:l,onFocusFromOutsideViewport:()=>{const f=d({tabbingDirection:"forwards"});we(f)}}),v.jsx(He.Slot,{scope:n,children:v.jsx(A.ol,{tabIndex:-1,...s,ref:m})}),C&&v.jsx(Le,{ref:h,onFocusFromOutsideViewport:()=>{const f=d({tabbingDirection:"backwards"});we(f)}})]})});kt.displayName=gt;var bt="ToastFocusProxy",Le=a.forwardRef((e,t)=>{const{__scopeToast:n,onFocusFromOutsideViewport:r,...o}=e,s=me(bt,n);return v.jsx(ve,{"aria-hidden":!0,tabIndex:0,...o,ref:t,style:{position:"fixed"},onFocus:i=>{var l;const c=i.relatedTarget;!((l=s.viewport)!=null&&l.contains(c))&&r()}})});Le.displayName=bt;var ne="Toast",Qn="toast.swipeStart",Jn="toast.swipeMove",er="toast.swipeCancel",tr="toast.swipeEnd",xt=a.forwardRef((e,t)=>{const{forceMount:n,open:r,defaultOpen:o,onOpenChange:s,...i}=e,[c,p]=ye({prop:r,defaultProp:o??!0,onChange:s,caller:ne});return v.jsx(X,{present:n||c,children:v.jsx(or,{open:c,...i,ref:t,onClose:()=>p(!1),onPause:V(e.onPause),onResume:V(e.onResume),onSwipeStart:P(e.onSwipeStart,l=>{l.currentTarget.setAttribute("data-swipe","start")}),onSwipeMove:P(e.onSwipeMove,l=>{const{x:h,y}=l.detail.delta;l.currentTarget.setAttribute("data-swipe","move"),l.currentTarget.style.setProperty("--radix-toast-swipe-move-x",`${h}px`),l.currentTarget.style.setProperty("--radix-toast-swipe-move-y",`${y}px`)}),onSwipeCancel:P(e.onSwipeCancel,l=>{l.currentTarget.setAttribute("data-swipe","cancel"),l.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),l.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),l.currentTarget.style.removeProperty("--radix-toast-swipe-end-x"),l.currentTarget.style.removeProperty("--radix-toast-swipe-end-y")}),onSwipeEnd:P(e.onSwipeEnd,l=>{const{x:h,y}=l.detail.delta;l.currentTarget.setAttribute("data-swipe","end"),l.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),l.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),l.currentTarget.style.setProperty("--radix-toast-swipe-end-x",`${h}px`),l.currentTarget.style.setProperty("--radix-toast-swipe-end-y",`${y}px`),p(!1)})})})});xt.displayName=ne;var[nr,rr]=vt(ne,{onClose(){}}),or=a.forwardRef((e,t)=>{const{__scopeToast:n,type:r="foreground",duration:o,open:s,onClose:i,onEscapeKeyDown:c,onPause:p,onResume:l,onSwipeStart:h,onSwipeMove:y,onSwipeCancel:m,onSwipeEnd:w,...C}=e,d=me(ne,n),[f,k]=a.useState(null),b=L(t,T=>k(T)),g=a.useRef(null),x=a.useRef(null),E=o||d.duration,S=a.useRef(0),M=a.useRef(E),R=a.useRef(0),{onToastAdd:N,onToastRemove:F}=d,_=V(()=>{var D;(f==null?void 0:f.contains(document.activeElement))&&((D=d.viewport)==null||D.focus()),i()}),H=a.useCallback(T=>{!T||T===1/0||(window.clearTimeout(R.current),S.current=new Date().getTime(),R.current=window.setTimeout(_,T))},[_]);a.useEffect(()=>{const T=d.viewport;if(T){const D=()=>{H(M.current),l==null||l()},I=()=>{const Y=new Date().getTime()-S.current;M.current=M.current-Y,window.clearTimeout(R.current),p==null||p()};return T.addEventListener(Ne,I),T.addEventListener(De,D),()=>{T.removeEventListener(Ne,I),T.removeEventListener(De,D)}}},[d.viewport,E,p,l,H]),a.useEffect(()=>{s&&!d.isClosePausedRef.current&&H(E)},[s,E,d.isClosePausedRef,H]),a.useEffect(()=>(N(),()=>F()),[N,F]);const W=a.useMemo(()=>f?Rt(f):null,[f]);return d.viewport?v.jsxs(v.Fragment,{children:[W&&v.jsx(ar,{__scopeToast:n,role:"status","aria-live":r==="foreground"?"assertive":"polite","aria-atomic":!0,children:W}),v.jsx(nr,{scope:n,onClose:_,children:ct.createPortal(v.jsx(He.ItemSlot,{scope:n,children:v.jsx(_n,{asChild:!0,onEscapeKeyDown:P(c,()=>{d.isFocusedToastEscapeKeyDownRef.current||_(),d.isFocusedToastEscapeKeyDownRef.current=!1}),children:v.jsx(A.li,{role:"status","aria-live":"off","aria-atomic":!0,tabIndex:0,"data-state":s?"open":"closed","data-swipe-direction":d.swipeDirection,...C,ref:b,style:{userSelect:"none",touchAction:"none",...e.style},onKeyDown:P(e.onKeyDown,T=>{T.key==="Escape"&&(c==null||c(T.nativeEvent),T.nativeEvent.defaultPrevented||(d.isFocusedToastEscapeKeyDownRef.current=!0,_()))}),onPointerDown:P(e.onPointerDown,T=>{T.button===0&&(g.current={x:T.clientX,y:T.clientY})}),onPointerMove:P(e.onPointerMove,T=>{if(!g.current)return;const D=T.clientX-g.current.x,I=T.clientY-g.current.y,Y=!!x.current,Q=["left","right"].includes(d.swipeDirection),oe=["left","up"].includes(d.swipeDirection)?Math.min:Math.max,bn=Q?oe(0,D):0,xn=Q?0:oe(0,I),xe=T.pointerType==="touch"?10:2,ae={x:bn,y:xn},$e={originalEvent:T,delta:ae};Y?(x.current=ae,ce(Jn,y,$e,{discrete:!1})):Xe(ae,d.swipeDirection,xe)?(x.current=ae,ce(Qn,h,$e,{discrete:!1}),T.target.setPointerCapture(T.pointerId)):(Math.abs(D)>xe||Math.abs(I)>xe)&&(g.current=null)}),onPointerUp:P(e.onPointerUp,T=>{const D=x.current,I=T.target;if(I.hasPointerCapture(T.pointerId)&&I.releasePointerCapture(T.pointerId),x.current=null,g.current=null,D){const Y=T.currentTarget,Q={originalEvent:T,delta:D};Xe(D,d.swipeDirection,d.swipeThreshold)?ce(tr,w,Q,{discrete:!0}):ce(er,m,Q,{discrete:!0}),Y.addEventListener("click",oe=>oe.preventDefault(),{once:!0})}})})})}),d.viewport)})]}):null}),ar=e=>{const{__scopeToast:t,children:n,...r}=e,o=me(ne,t),[s,i]=a.useState(!1),[c,p]=a.useState(!1);return ir(()=>i(!0)),a.useEffect(()=>{const l=window.setTimeout(()=>p(!0),1e3);return()=>window.clearTimeout(l)},[]),c?null:v.jsx(je,{asChild:!0,children:v.jsx(ve,{...r,children:s&&v.jsxs(v.Fragment,{children:[o.label," ",n]})})})},sr="ToastTitle",wt=a.forwardRef((e,t)=>{const{__scopeToast:n,...r}=e;return v.jsx(A.div,{...r,ref:t})});wt.displayName=sr;var cr="ToastDescription",Et=a.forwardRef((e,t)=>{const{__scopeToast:n,...r}=e;return v.jsx(A.div,{...r,ref:t})});Et.displayName=cr;var Mt="ToastAction",Ct=a.forwardRef((e,t)=>{const{altText:n,...r}=e;return n.trim()?v.jsx(St,{altText:n,asChild:!0,children:v.jsx(qe,{...r,ref:t})}):(console.error(`Invalid prop \`altText\` supplied to \`${Mt}\`. Expected non-empty \`string\`.`),null)});Ct.displayName=Mt;var Tt="ToastClose",qe=a.forwardRef((e,t)=>{const{__scopeToast:n,...r}=e,o=rr(Tt,n);return v.jsx(St,{asChild:!0,children:v.jsx(A.button,{type:"button",...r,ref:t,onClick:P(e.onClick,o.onClose)})})});qe.displayName=Tt;var St=a.forwardRef((e,t)=>{const{__scopeToast:n,altText:r,...o}=e;return v.jsx(A.div,{"data-radix-toast-announce-exclude":"","data-radix-toast-announce-alt":r||void 0,...o,ref:t})});function Rt(e){const t=[];return Array.from(e.childNodes).forEach(r=>{if(r.nodeType===r.TEXT_NODE&&r.textContent&&t.push(r.textContent),lr(r)){const o=r.ariaHidden||r.hidden||r.style.display==="none",s=r.dataset.radixToastAnnounceExclude==="";if(!o)if(s){const i=r.dataset.radixToastAnnounceAlt;i&&t.push(i)}else t.push(...Rt(r))}}),t}function ce(e,t,n,{discrete:r}){const o=n.originalEvent.currentTarget,s=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:n});t&&o.addEventListener(e,t,{once:!0}),r?ft(o,s):o.dispatchEvent(s)}var Xe=(e,t,n=0)=>{const r=Math.abs(e.x),o=Math.abs(e.y),s=r>o;return t==="left"||t==="right"?s&&r>n:!s&&o>n};function ir(e=()=>{}){const t=V(e);Z(()=>{let n=0,r=0;return n=window.requestAnimationFrame(()=>r=window.requestAnimationFrame(t)),()=>{window.cancelAnimationFrame(n),window.cancelAnimationFrame(r)}},[t])}function lr(e){return e.nodeType===e.ELEMENT_NODE}function ur(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function we(e){const t=document.activeElement;return e.some(n=>n===t?!0:(n.focus(),document.activeElement!==t))}var Vo=mt,Ho=kt,qo=xt,zo=wt,Uo=Et,Wo=Ct,Bo=qe;/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var dr={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fr=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),u=(e,t)=>{const n=a.forwardRef(({color:r="currentColor",size:o=24,strokeWidth:s=2,absoluteStrokeWidth:i,className:c="",children:p,...l},h)=>a.createElement("svg",{ref:h,...dr,width:o,height:o,stroke:r,strokeWidth:i?Number(s)*24/Number(o):s,className:["lucide",`lucide-${fr(e)}`,c].join(" "),...l},[...t.map(([y,m])=>a.createElement(y,m)),...Array.isArray(p)?p:[p]]));return n.displayName=`${e}`,n};/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $o=u("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ko=u("AirVent",[["path",{d:"M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"larmp2"}],["path",{d:"M6 8h12",key:"6g4wlu"}],["path",{d:"M18.3 17.7a2.5 2.5 0 0 1-3.16 3.83 2.53 2.53 0 0 1-1.14-2V12",key:"1bo8pg"}],["path",{d:"M6.6 15.6A2 2 0 1 0 10 17v-5",key:"t9h90c"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Go=u("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zo=u("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xo=u("ArrowDownRight",[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yo=u("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qo=u("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jo=u("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ea=u("Award",[["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}],["path",{d:"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11",key:"em7aur"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ta=u("Ban",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m4.9 4.9 14.2 14.2",key:"1m5liu"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const na=u("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ra=u("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oa=u("BookOpen",[["path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",key:"vv98re"}],["path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",key:"1cyq3y"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const aa=u("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sa=u("Briefcase",[["rect",{width:"20",height:"14",x:"2",y:"7",rx:"2",ry:"2",key:"eto64e"}],["path",{d:"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"zwj3tp"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ca=u("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ia=u("Building",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["path",{d:"M9 22v-4h6v4",key:"r93iot"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const la=u("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ua=u("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const da=u("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fa=u("CheckCircle2",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=u("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=u("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ya=u("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const va=u("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ma=u("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ga=u("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ka=u("CircleDollarSign",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 18V6",key:"zqpxq5"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ba=u("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xa=u("ClipboardList",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=u("Clipboard",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=u("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ma=u("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=u("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ta=u("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sa=u("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ra=u("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pa=u("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=u("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=u("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Na=u("FileDown",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Da=u("FilePenLine",[["path",{d:"m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2",key:"h0fsxq"}],["path",{d:"M8 18h1",key:"13wk12"}],["path",{d:"M18.4 9.6a2 2 0 1 1 3 3L17 17l-4 1 1-4Z",key:"dyo8mm"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const La=u("FilePen",[["path",{d:"M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10",key:"x7tsz2"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z",key:"o3xyfb"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oa=u("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fa=u("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=u("Fingerprint",[["path",{d:"M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4",key:"1jc9o5"}],["path",{d:"M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2",key:"1mxgy1"}],["path",{d:"M17.29 21.02c.12-.6.43-2.3.5-3.02",key:"ptglia"}],["path",{d:"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4",key:"1nerag"}],["path",{d:"M8.65 22c.21-.66.45-1.32.57-2",key:"13wd9y"}],["path",{d:"M14 13.12c0 2.38 0 6.38-1 8.88",key:"o46ks0"}],["path",{d:"M2 16h.01",key:"1gqxmh"}],["path",{d:"M21.8 16c.2-2 .131-5.354 0-6",key:"drycrb"}],["path",{d:"M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2",key:"1fgabc"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ja=u("FolderOpen",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Va=u("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ha=u("GraduationCap",[["path",{d:"M22 10v6M2 10l10-5 10 5-10 5z",key:"1ef52a"}],["path",{d:"M6 12v5c3 3 9 3 12 0v-5",key:"1f75yj"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qa=u("Headphones",[["path",{d:"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",key:"1xhozi"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const za=u("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ua=u("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wa=u("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ba=u("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $a=u("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ka=u("Key",[["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["path",{d:"m15.5 7.5 3 3L22 7l-3-3",key:"1rn1fs"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ga=u("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Za=u("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xa=u("ListChecks",[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ya=u("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qa=u("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ja=u("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const es=u("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ts=u("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ns=u("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rs=u("MessageCircle",[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const os=u("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const as=u("MicOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M18.89 13.23A7.12 7.12 0 0 0 19 12v-2",key:"80xlxr"}],["path",{d:"M5 10v2a7 7 0 0 0 12 5",key:"p2k8kg"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ss=u("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cs=u("MinusCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const is=u("MonitorSmartphone",[["path",{d:"M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8",key:"10dyio"}],["path",{d:"M10 19v-3.96 3.15",key:"1irgej"}],["path",{d:"M7 19h5",key:"qswx4l"}],["rect",{width:"6",height:"10",x:"16",y:"12",rx:"2",key:"1egngj"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ls=u("MoreHorizontal",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const us=u("MoreVertical",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ds=u("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",key:"ymcmye"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fs=u("Pencil",[["path",{d:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",key:"5qss01"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hs=u("Percent",[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ps=u("PhoneOff",[["path",{d:"M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91",key:"z86iuo"}],["line",{x1:"22",x2:"2",y1:"2",y2:"22",key:"11kh81"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ys=u("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vs=u("Pill",[["path",{d:"m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z",key:"wa1lgi"}],["path",{d:"m8.5 8.5 7 7",key:"rvfmvr"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ms=u("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gs=u("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ks=u("QrCode",[["rect",{width:"5",height:"5",x:"3",y:"3",rx:"1",key:"1tu5fj"}],["rect",{width:"5",height:"5",x:"16",y:"3",rx:"1",key:"1v8r4q"}],["rect",{width:"5",height:"5",x:"3",y:"16",rx:"1",key:"1x03jg"}],["path",{d:"M21 16h-3a2 2 0 0 0-2 2v3",key:"177gqh"}],["path",{d:"M21 21v.01",key:"ents32"}],["path",{d:"M12 7v3a2 2 0 0 1-2 2H7",key:"8crl2c"}],["path",{d:"M3 12h.01",key:"nlz23k"}],["path",{d:"M12 3h.01",key:"n36tog"}],["path",{d:"M12 16v.01",key:"133mhm"}],["path",{d:"M16 12h1",key:"1slzba"}],["path",{d:"M21 12v.01",key:"1lwtk9"}],["path",{d:"M12 21v-1",key:"1880an"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bs=u("Receipt",[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z",key:"q3az6g"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17.5v-11",key:"1jc1ny"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xs=u("RefreshCcw",[["path",{d:"M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"14sxne"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",key:"1hlbsb"}],["path",{d:"M16 16h5v5",key:"ccwih5"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ws=u("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Es=u("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ms=u("ScanLine",[["path",{d:"M3 7V5a2 2 0 0 1 2-2h2",key:"aa7l1z"}],["path",{d:"M17 3h2a2 2 0 0 1 2 2v2",key:"4qcy5o"}],["path",{d:"M21 17v2a2 2 0 0 1-2 2h-2",key:"6vwrx8"}],["path",{d:"M7 21H5a2 2 0 0 1-2-2v-2",key:"ioqczr"}],["path",{d:"M7 12h10",key:"b7w52i"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cs=u("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ts=u("Send",[["path",{d:"m22 2-7 20-4-9-9-4Z",key:"1q3vgg"}],["path",{d:"M22 2 11 13",key:"nzbqef"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ss=u("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rs=u("ShieldAlert",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ps=u("Shield",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const As=u("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Is=u("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ns=u("Smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ds=u("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ls=u("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z",key:"1lpok0"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Os=u("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fs=u("Stethoscope",[["path",{d:"M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3",key:"1jd90r"}],["path",{d:"M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4",key:"126ukv"}],["circle",{cx:"20",cy:"10",r:"2",key:"ts1r5v"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _s=u("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const js=u("ThumbsDown",[["path",{d:"M17 14V2",key:"8ymqnk"}],["path",{d:"M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z",key:"s6e0r"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vs=u("ThumbsUp",[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z",key:"y3tblf"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hs=u("Timer",[["line",{x1:"10",x2:"14",y1:"2",y2:"2",key:"14vaq8"}],["line",{x1:"12",x2:"15",y1:"14",y2:"11",key:"17fdiu"}],["circle",{cx:"12",cy:"14",r:"8",key:"1e1u0o"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qs=u("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zs=u("Trash",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Us=u("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ws=u("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bs=u("UserCheck",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["polyline",{points:"16 11 18 13 22 9",key:"1pwet4"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $s=u("UserCog",[["circle",{cx:"18",cy:"15",r:"3",key:"gjjjvw"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M10 15H6a4 4 0 0 0-4 4v2",key:"1nfge6"}],["path",{d:"m21.7 16.4-.9-.3",key:"12j9ji"}],["path",{d:"m15.2 13.9-.9-.3",key:"1fdjdi"}],["path",{d:"m16.6 18.7.3-.9",key:"heedtr"}],["path",{d:"m19.1 12.2.3-.9",key:"1af3ki"}],["path",{d:"m19.6 18.7-.4-1",key:"1x9vze"}],["path",{d:"m16.8 12.3-.4-1",key:"vqeiwj"}],["path",{d:"m14.3 16.6 1-.4",key:"1qlj63"}],["path",{d:"m20.7 13.8 1-.4",key:"1v5t8k"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ks=u("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gs=u("UserX",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"17",x2:"22",y1:"8",y2:"13",key:"3nzzx3"}],["line",{x1:"22",x2:"17",y1:"8",y2:"13",key:"1swrse"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zs=u("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xs=u("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ys=u("VideoOff",[["path",{d:"M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8",key:"ubwiq0"}],["path",{d:"M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z",key:"1l10zd"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qs=u("Video",[["path",{d:"m22 8-6 4 6 4V8Z",key:"50v9me"}],["rect",{width:"14",height:"12",x:"2",y:"6",rx:"2",ry:"2",key:"1rqjg6"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Js=u("Wallet",[["path",{d:"M21 12V7H5a2 2 0 0 1 0-4h14v4",key:"195gfw"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h16v-5",key:"195n9w"}],["path",{d:"M18 12a2 2 0 0 0 0 4h4v-4Z",key:"vllfpd"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ec=u("WifiOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M8.5 16.5a5 5 0 0 1 7 0",key:"sej527"}],["path",{d:"M2 8.82a15 15 0 0 1 4.17-2.65",key:"11utq1"}],["path",{d:"M10.66 5c4.01-.36 8.14.9 11.34 3.76",key:"hxefdu"}],["path",{d:"M16.85 11.25a10 10 0 0 1 2.22 1.68",key:"q734kn"}],["path",{d:"M5 13a10 10 0 0 1 5.24-2.76",key:"piq4yl"}],["line",{x1:"12",x2:"12.01",y1:"20",y2:"20",key:"of4bc4"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tc=u("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nc=u("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rc=u("Zap",[["polygon",{points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2",key:"45s27k"}]]);var hr=it[" useId ".trim().toString()]||(()=>{}),pr=0;function J(e){const[t,n]=a.useState(hr());return Z(()=>{n(r=>r??String(pr++))},[e]),t?`radix-${t}`:""}var yr=a.createContext(void 0);function Pt(e){const t=a.useContext(yr);return e||t||"ltr"}var Ee=0;function vr(){a.useEffect(()=>{const e=document.querySelectorAll("[data-radix-focus-guard]");return document.body.insertAdjacentElement("afterbegin",e[0]??Ye()),document.body.insertAdjacentElement("beforeend",e[1]??Ye()),Ee++,()=>{Ee===1&&document.querySelectorAll("[data-radix-focus-guard]").forEach(t=>t.remove()),Ee--}},[])}function Ye(){const e=document.createElement("span");return e.setAttribute("data-radix-focus-guard",""),e.tabIndex=0,e.style.outline="none",e.style.opacity="0",e.style.position="fixed",e.style.pointerEvents="none",e}var Me="focusScope.autoFocusOnMount",Ce="focusScope.autoFocusOnUnmount",Qe={bubbles:!1,cancelable:!0},mr="FocusScope",At=a.forwardRef((e,t)=>{const{loop:n=!1,trapped:r=!1,onMountAutoFocus:o,onUnmountAutoFocus:s,...i}=e,[c,p]=a.useState(null),l=V(o),h=V(s),y=a.useRef(null),m=L(t,d=>p(d)),w=a.useRef({paused:!1,pause(){this.paused=!0},resume(){this.paused=!1}}).current;a.useEffect(()=>{if(r){let d=function(g){if(w.paused||!c)return;const x=g.target;c.contains(x)?y.current=x:q(y.current,{select:!0})},f=function(g){if(w.paused||!c)return;const x=g.relatedTarget;x!==null&&(c.contains(x)||q(y.current,{select:!0}))},k=function(g){if(document.activeElement===document.body)for(const E of g)E.removedNodes.length>0&&q(c)};document.addEventListener("focusin",d),document.addEventListener("focusout",f);const b=new MutationObserver(k);return c&&b.observe(c,{childList:!0,subtree:!0}),()=>{document.removeEventListener("focusin",d),document.removeEventListener("focusout",f),b.disconnect()}}},[r,c,w.paused]),a.useEffect(()=>{if(c){et.add(w);const d=document.activeElement;if(!c.contains(d)){const k=new CustomEvent(Me,Qe);c.addEventListener(Me,l),c.dispatchEvent(k),k.defaultPrevented||(gr(Er(It(c)),{select:!0}),document.activeElement===d&&q(c))}return()=>{c.removeEventListener(Me,l),setTimeout(()=>{const k=new CustomEvent(Ce,Qe);c.addEventListener(Ce,h),c.dispatchEvent(k),k.defaultPrevented||q(d??document.body,{select:!0}),c.removeEventListener(Ce,h),et.remove(w)},0)}}},[c,l,h,w]);const C=a.useCallback(d=>{if(!n&&!r||w.paused)return;const f=d.key==="Tab"&&!d.altKey&&!d.ctrlKey&&!d.metaKey,k=document.activeElement;if(f&&k){const b=d.currentTarget,[g,x]=kr(b);g&&x?!d.shiftKey&&k===x?(d.preventDefault(),n&&q(g,{select:!0})):d.shiftKey&&k===g&&(d.preventDefault(),n&&q(x,{select:!0})):k===b&&d.preventDefault()}},[n,r,w.paused]);return v.jsx(A.div,{tabIndex:-1,...i,ref:m,onKeyDown:C})});At.displayName=mr;function gr(e,{select:t=!1}={}){const n=document.activeElement;for(const r of e)if(q(r,{select:t}),document.activeElement!==n)return}function kr(e){const t=It(e),n=Je(t,e),r=Je(t.reverse(),e);return[n,r]}function It(e){const t=[],n=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT,{acceptNode:r=>{const o=r.tagName==="INPUT"&&r.type==="hidden";return r.disabled||r.hidden||o?NodeFilter.FILTER_SKIP:r.tabIndex>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP}});for(;n.nextNode();)t.push(n.currentNode);return t}function Je(e,t){for(const n of e)if(!br(n,{upTo:t}))return n}function br(e,{upTo:t}){if(getComputedStyle(e).visibility==="hidden")return!0;for(;e;){if(t!==void 0&&e===t)return!1;if(getComputedStyle(e).display==="none")return!0;e=e.parentElement}return!1}function xr(e){return e instanceof HTMLInputElement&&"select"in e}function q(e,{select:t=!1}={}){if(e&&e.focus){const n=document.activeElement;e.focus({preventScroll:!0}),e!==n&&xr(e)&&t&&e.select()}}var et=wr();function wr(){let e=[];return{add(t){const n=e[0];t!==n&&(n==null||n.pause()),e=tt(e,t),e.unshift(t)},remove(t){var n;e=tt(e,t),(n=e[0])==null||n.resume()}}}function tt(e,t){const n=[...e],r=n.indexOf(t);return r!==-1&&n.splice(r,1),n}function Er(e){return e.filter(t=>t.tagName!=="A")}var Mr=function(e){if(typeof document>"u")return null;var t=Array.isArray(e)?e[0]:e;return t.ownerDocument.body},B=new WeakMap,ie=new WeakMap,le={},Te=0,Nt=function(e){return e&&(e.host||Nt(e.parentNode))},Cr=function(e,t){return t.map(function(n){if(e.contains(n))return n;var r=Nt(n);return r&&e.contains(r)?r:(console.error("aria-hidden",n,"in not contained inside",e,". Doing nothing"),null)}).filter(function(n){return!!n})},Tr=function(e,t,n,r){var o=Cr(t,Array.isArray(e)?e:[e]);le[n]||(le[n]=new WeakMap);var s=le[n],i=[],c=new Set,p=new Set(o),l=function(y){!y||c.has(y)||(c.add(y),l(y.parentNode))};o.forEach(l);var h=function(y){!y||p.has(y)||Array.prototype.forEach.call(y.children,function(m){if(c.has(m))h(m);else try{var w=m.getAttribute(r),C=w!==null&&w!=="false",d=(B.get(m)||0)+1,f=(s.get(m)||0)+1;B.set(m,d),s.set(m,f),i.push(m),d===1&&C&&ie.set(m,!0),f===1&&m.setAttribute(n,"true"),C||m.setAttribute(r,"true")}catch(k){console.error("aria-hidden: cannot operate on ",m,k)}})};return h(t),c.clear(),Te++,function(){i.forEach(function(y){var m=B.get(y)-1,w=s.get(y)-1;B.set(y,m),s.set(y,w),m||(ie.has(y)||y.removeAttribute(r),ie.delete(y)),w||y.removeAttribute(n)}),Te--,Te||(B=new WeakMap,B=new WeakMap,ie=new WeakMap,le={})}},Sr=function(e,t,n){n===void 0&&(n="data-aria-hidden");var r=Array.from(Array.isArray(e)?e:[e]),o=Mr(e);return o?(r.push.apply(r,Array.from(o.querySelectorAll("[aria-live], script"))),Tr(r,o,n,"aria-hidden")):function(){return null}},j=function(){return j=Object.assign||function(t){for(var n,r=1,o=arguments.length;r<o;r++){n=arguments[r];for(var s in n)Object.prototype.hasOwnProperty.call(n,s)&&(t[s]=n[s])}return t},j.apply(this,arguments)};function Dt(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols=="function")for(var o=0,r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]]);return n}function Rr(e,t,n){if(n||arguments.length===2)for(var r=0,o=t.length,s;r<o;r++)(s||!(r in t))&&(s||(s=Array.prototype.slice.call(t,0,r)),s[r]=t[r]);return e.concat(s||Array.prototype.slice.call(t))}var fe="right-scroll-bar-position",he="width-before-scroll-bar",Pr="with-scroll-bars-hidden",Ar="--removed-body-scroll-bar-size";function Se(e,t){return typeof e=="function"?e(t):e&&(e.current=t),e}function Ir(e,t){var n=a.useState(function(){return{value:e,callback:t,facade:{get current(){return n.value},set current(r){var o=n.value;o!==r&&(n.value=r,n.callback(r,o))}}}})[0];return n.callback=t,n.facade}var Nr=typeof window<"u"?a.useLayoutEffect:a.useEffect,nt=new WeakMap;function Dr(e,t){var n=Ir(null,function(r){return e.forEach(function(o){return Se(o,r)})});return Nr(function(){var r=nt.get(n);if(r){var o=new Set(r),s=new Set(e),i=n.current;o.forEach(function(c){s.has(c)||Se(c,null)}),s.forEach(function(c){o.has(c)||Se(c,i)})}nt.set(n,e)},[e]),n}function Lr(e){return e}function Or(e,t){t===void 0&&(t=Lr);var n=[],r=!1,o={read:function(){if(r)throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");return n.length?n[n.length-1]:e},useMedium:function(s){var i=t(s,r);return n.push(i),function(){n=n.filter(function(c){return c!==i})}},assignSyncMedium:function(s){for(r=!0;n.length;){var i=n;n=[],i.forEach(s)}n={push:function(c){return s(c)},filter:function(){return n}}},assignMedium:function(s){r=!0;var i=[];if(n.length){var c=n;n=[],c.forEach(s),i=n}var p=function(){var h=i;i=[],h.forEach(s)},l=function(){return Promise.resolve().then(p)};l(),n={push:function(h){i.push(h),l()},filter:function(h){return i=i.filter(h),n}}}};return o}function Fr(e){e===void 0&&(e={});var t=Or(null);return t.options=j({async:!0,ssr:!1},e),t}var Lt=function(e){var t=e.sideCar,n=Dt(e,["sideCar"]);if(!t)throw new Error("Sidecar: please provide `sideCar` property to import the right car");var r=t.read();if(!r)throw new Error("Sidecar medium not found");return a.createElement(r,j({},n))};Lt.isSideCarExport=!0;function _r(e,t){return e.useMedium(t),Lt}var Ot=Fr(),Re=function(){},ge=a.forwardRef(function(e,t){var n=a.useRef(null),r=a.useState({onScrollCapture:Re,onWheelCapture:Re,onTouchMoveCapture:Re}),o=r[0],s=r[1],i=e.forwardProps,c=e.children,p=e.className,l=e.removeScrollBar,h=e.enabled,y=e.shards,m=e.sideCar,w=e.noRelative,C=e.noIsolation,d=e.inert,f=e.allowPinchZoom,k=e.as,b=k===void 0?"div":k,g=e.gapMode,x=Dt(e,["forwardProps","children","className","removeScrollBar","enabled","shards","sideCar","noRelative","noIsolation","inert","allowPinchZoom","as","gapMode"]),E=m,S=Dr([n,t]),M=j(j({},x),o);return a.createElement(a.Fragment,null,h&&a.createElement(E,{sideCar:Ot,removeScrollBar:l,shards:y,noRelative:w,noIsolation:C,inert:d,setCallbacks:s,allowPinchZoom:!!f,lockRef:n,gapMode:g}),i?a.cloneElement(a.Children.only(c),j(j({},M),{ref:S})):a.createElement(b,j({},M,{className:p,ref:S}),c))});ge.defaultProps={enabled:!0,removeScrollBar:!0,inert:!1};ge.classNames={fullWidth:he,zeroRight:fe};var jr=function(){if(typeof __webpack_nonce__<"u")return __webpack_nonce__};function Vr(){if(!document)return null;var e=document.createElement("style");e.type="text/css";var t=jr();return t&&e.setAttribute("nonce",t),e}function Hr(e,t){e.styleSheet?e.styleSheet.cssText=t:e.appendChild(document.createTextNode(t))}function qr(e){var t=document.head||document.getElementsByTagName("head")[0];t.appendChild(e)}var zr=function(){var e=0,t=null;return{add:function(n){e==0&&(t=Vr())&&(Hr(t,n),qr(t)),e++},remove:function(){e--,!e&&t&&(t.parentNode&&t.parentNode.removeChild(t),t=null)}}},Ur=function(){var e=zr();return function(t,n){a.useEffect(function(){return e.add(t),function(){e.remove()}},[t&&n])}},Ft=function(){var e=Ur(),t=function(n){var r=n.styles,o=n.dynamic;return e(r,o),null};return t},Wr={left:0,top:0,right:0,gap:0},Pe=function(e){return parseInt(e||"",10)||0},Br=function(e){var t=window.getComputedStyle(document.body),n=t[e==="padding"?"paddingLeft":"marginLeft"],r=t[e==="padding"?"paddingTop":"marginTop"],o=t[e==="padding"?"paddingRight":"marginRight"];return[Pe(n),Pe(r),Pe(o)]},$r=function(e){if(e===void 0&&(e="margin"),typeof window>"u")return Wr;var t=Br(e),n=document.documentElement.clientWidth,r=window.innerWidth;return{left:t[0],top:t[1],right:t[2],gap:Math.max(0,r-n+t[2]-t[0])}},Kr=Ft(),G="data-scroll-locked",Gr=function(e,t,n,r){var o=e.left,s=e.top,i=e.right,c=e.gap;return n===void 0&&(n="margin"),`
  .`.concat(Pr,` {
   overflow: hidden `).concat(r,`;
   padding-right: `).concat(c,"px ").concat(r,`;
  }
  body[`).concat(G,`] {
    overflow: hidden `).concat(r,`;
    overscroll-behavior: contain;
    `).concat([t&&"position: relative ".concat(r,";"),n==="margin"&&`
    padding-left: `.concat(o,`px;
    padding-top: `).concat(s,`px;
    padding-right: `).concat(i,`px;
    margin-left:0;
    margin-top:0;
    margin-right: `).concat(c,"px ").concat(r,`;
    `),n==="padding"&&"padding-right: ".concat(c,"px ").concat(r,";")].filter(Boolean).join(""),`
  }
  
  .`).concat(fe,` {
    right: `).concat(c,"px ").concat(r,`;
  }
  
  .`).concat(he,` {
    margin-right: `).concat(c,"px ").concat(r,`;
  }
  
  .`).concat(fe," .").concat(fe,` {
    right: 0 `).concat(r,`;
  }
  
  .`).concat(he," .").concat(he,` {
    margin-right: 0 `).concat(r,`;
  }
  
  body[`).concat(G,`] {
    `).concat(Ar,": ").concat(c,`px;
  }
`)},rt=function(){var e=parseInt(document.body.getAttribute(G)||"0",10);return isFinite(e)?e:0},Zr=function(){a.useEffect(function(){return document.body.setAttribute(G,(rt()+1).toString()),function(){var e=rt()-1;e<=0?document.body.removeAttribute(G):document.body.setAttribute(G,e.toString())}},[])},Xr=function(e){var t=e.noRelative,n=e.noImportant,r=e.gapMode,o=r===void 0?"margin":r;Zr();var s=a.useMemo(function(){return $r(o)},[o]);return a.createElement(Kr,{styles:Gr(s,!t,o,n?"":"!important")})},Oe=!1;if(typeof window<"u")try{var ue=Object.defineProperty({},"passive",{get:function(){return Oe=!0,!0}});window.addEventListener("test",ue,ue),window.removeEventListener("test",ue,ue)}catch{Oe=!1}var $=Oe?{passive:!1}:!1,Yr=function(e){return e.tagName==="TEXTAREA"},_t=function(e,t){if(!(e instanceof Element))return!1;var n=window.getComputedStyle(e);return n[t]!=="hidden"&&!(n.overflowY===n.overflowX&&!Yr(e)&&n[t]==="visible")},Qr=function(e){return _t(e,"overflowY")},Jr=function(e){return _t(e,"overflowX")},ot=function(e,t){var n=t.ownerDocument,r=t;do{typeof ShadowRoot<"u"&&r instanceof ShadowRoot&&(r=r.host);var o=jt(e,r);if(o){var s=Vt(e,r),i=s[1],c=s[2];if(i>c)return!0}r=r.parentNode}while(r&&r!==n.body);return!1},eo=function(e){var t=e.scrollTop,n=e.scrollHeight,r=e.clientHeight;return[t,n,r]},to=function(e){var t=e.scrollLeft,n=e.scrollWidth,r=e.clientWidth;return[t,n,r]},jt=function(e,t){return e==="v"?Qr(t):Jr(t)},Vt=function(e,t){return e==="v"?eo(t):to(t)},no=function(e,t){return e==="h"&&t==="rtl"?-1:1},ro=function(e,t,n,r,o){var s=no(e,window.getComputedStyle(t).direction),i=s*r,c=n.target,p=t.contains(c),l=!1,h=i>0,y=0,m=0;do{if(!c)break;var w=Vt(e,c),C=w[0],d=w[1],f=w[2],k=d-f-s*C;(C||k)&&jt(e,c)&&(y+=k,m+=C);var b=c.parentNode;c=b&&b.nodeType===Node.DOCUMENT_FRAGMENT_NODE?b.host:b}while(!p&&c!==document.body||p&&(t.contains(c)||t===c));return(h&&Math.abs(y)<1||!h&&Math.abs(m)<1)&&(l=!0),l},de=function(e){return"changedTouches"in e?[e.changedTouches[0].clientX,e.changedTouches[0].clientY]:[0,0]},at=function(e){return[e.deltaX,e.deltaY]},st=function(e){return e&&"current"in e?e.current:e},oo=function(e,t){return e[0]===t[0]&&e[1]===t[1]},ao=function(e){return`
  .block-interactivity-`.concat(e,` {pointer-events: none;}
  .allow-interactivity-`).concat(e,` {pointer-events: all;}
`)},so=0,K=[];function co(e){var t=a.useRef([]),n=a.useRef([0,0]),r=a.useRef(),o=a.useState(so++)[0],s=a.useState(Ft)[0],i=a.useRef(e);a.useEffect(function(){i.current=e},[e]),a.useEffect(function(){if(e.inert){document.body.classList.add("block-interactivity-".concat(o));var d=Rr([e.lockRef.current],(e.shards||[]).map(st),!0).filter(Boolean);return d.forEach(function(f){return f.classList.add("allow-interactivity-".concat(o))}),function(){document.body.classList.remove("block-interactivity-".concat(o)),d.forEach(function(f){return f.classList.remove("allow-interactivity-".concat(o))})}}},[e.inert,e.lockRef.current,e.shards]);var c=a.useCallback(function(d,f){if("touches"in d&&d.touches.length===2||d.type==="wheel"&&d.ctrlKey)return!i.current.allowPinchZoom;var k=de(d),b=n.current,g="deltaX"in d?d.deltaX:b[0]-k[0],x="deltaY"in d?d.deltaY:b[1]-k[1],E,S=d.target,M=Math.abs(g)>Math.abs(x)?"h":"v";if("touches"in d&&M==="h"&&S.type==="range")return!1;var R=ot(M,S);if(!R)return!0;if(R?E=M:(E=M==="v"?"h":"v",R=ot(M,S)),!R)return!1;if(!r.current&&"changedTouches"in d&&(g||x)&&(r.current=E),!E)return!0;var N=r.current||E;return ro(N,f,d,N==="h"?g:x)},[]),p=a.useCallback(function(d){var f=d;if(!(!K.length||K[K.length-1]!==s)){var k="deltaY"in f?at(f):de(f),b=t.current.filter(function(E){return E.name===f.type&&(E.target===f.target||f.target===E.shadowParent)&&oo(E.delta,k)})[0];if(b&&b.should){f.cancelable&&f.preventDefault();return}if(!b){var g=(i.current.shards||[]).map(st).filter(Boolean).filter(function(E){return E.contains(f.target)}),x=g.length>0?c(f,g[0]):!i.current.noIsolation;x&&f.cancelable&&f.preventDefault()}}},[]),l=a.useCallback(function(d,f,k,b){var g={name:d,delta:f,target:k,should:b,shadowParent:io(k)};t.current.push(g),setTimeout(function(){t.current=t.current.filter(function(x){return x!==g})},1)},[]),h=a.useCallback(function(d){n.current=de(d),r.current=void 0},[]),y=a.useCallback(function(d){l(d.type,at(d),d.target,c(d,e.lockRef.current))},[]),m=a.useCallback(function(d){l(d.type,de(d),d.target,c(d,e.lockRef.current))},[]);a.useEffect(function(){return K.push(s),e.setCallbacks({onScrollCapture:y,onWheelCapture:y,onTouchMoveCapture:m}),document.addEventListener("wheel",p,$),document.addEventListener("touchmove",p,$),document.addEventListener("touchstart",h,$),function(){K=K.filter(function(d){return d!==s}),document.removeEventListener("wheel",p,$),document.removeEventListener("touchmove",p,$),document.removeEventListener("touchstart",h,$)}},[]);var w=e.removeScrollBar,C=e.inert;return a.createElement(a.Fragment,null,C?a.createElement(s,{styles:ao(o)}):null,w?a.createElement(Xr,{noRelative:e.noRelative,gapMode:e.gapMode}):null)}function io(e){for(var t=null;e!==null;)e instanceof ShadowRoot&&(t=e.host,e=e.host),e=e.parentNode;return t}const lo=_r(Ot,co);var Ht=a.forwardRef(function(e,t){return a.createElement(ge,j({},e,{ref:t,sideCar:lo}))});Ht.classNames=ge.classNames;var ke="Dialog",[qt,oc]=te(ke),[uo,O]=qt(ke),zt=e=>{const{__scopeDialog:t,children:n,open:r,defaultOpen:o,onOpenChange:s,modal:i=!0}=e,c=a.useRef(null),p=a.useRef(null),[l,h]=ye({prop:r,defaultProp:o??!1,onChange:s,caller:ke});return v.jsx(uo,{scope:t,triggerRef:c,contentRef:p,contentId:J(),titleId:J(),descriptionId:J(),open:l,onOpenChange:h,onOpenToggle:a.useCallback(()=>h(y=>!y),[h]),modal:i,children:n})};zt.displayName=ke;var Ut="DialogTrigger",Wt=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(Ut,n),s=L(t,o.triggerRef);return v.jsx(A.button,{type:"button","aria-haspopup":"dialog","aria-expanded":o.open,"aria-controls":o.contentId,"data-state":We(o.open),...r,ref:s,onClick:P(e.onClick,o.onOpenToggle)})});Wt.displayName=Ut;var ze="DialogPortal",[fo,Bt]=qt(ze,{forceMount:void 0}),$t=e=>{const{__scopeDialog:t,forceMount:n,children:r,container:o}=e,s=O(ze,t);return v.jsx(fo,{scope:t,forceMount:n,children:a.Children.map(r,i=>v.jsx(X,{present:n||s.open,children:v.jsx(je,{asChild:!0,container:o,children:i})}))})};$t.displayName=ze;var pe="DialogOverlay",Kt=a.forwardRef((e,t)=>{const n=Bt(pe,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,s=O(pe,e.__scopeDialog);return s.modal?v.jsx(X,{present:r||s.open,children:v.jsx(po,{...o,ref:t})}):null});Kt.displayName=pe;var ho=ee("DialogOverlay.RemoveScroll"),po=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(pe,n);return v.jsx(Ht,{as:ho,allowPinchZoom:!0,shards:[o.contentRef],children:v.jsx(A.div,{"data-state":We(o.open),...r,ref:t,style:{pointerEvents:"auto",...r.style}})})}),U="DialogContent",Gt=a.forwardRef((e,t)=>{const n=Bt(U,e.__scopeDialog),{forceMount:r=n.forceMount,...o}=e,s=O(U,e.__scopeDialog);return v.jsx(X,{present:r||s.open,children:s.modal?v.jsx(yo,{...o,ref:t}):v.jsx(vo,{...o,ref:t})})});Gt.displayName=U;var yo=a.forwardRef((e,t)=>{const n=O(U,e.__scopeDialog),r=a.useRef(null),o=L(t,n.contentRef,r);return a.useEffect(()=>{const s=r.current;if(s)return Sr(s)},[]),v.jsx(Zt,{...e,ref:o,trapFocus:n.open,disableOutsidePointerEvents:!0,onCloseAutoFocus:P(e.onCloseAutoFocus,s=>{var i;s.preventDefault(),(i=n.triggerRef.current)==null||i.focus()}),onPointerDownOutside:P(e.onPointerDownOutside,s=>{const i=s.detail.originalEvent,c=i.button===0&&i.ctrlKey===!0;(i.button===2||c)&&s.preventDefault()}),onFocusOutside:P(e.onFocusOutside,s=>s.preventDefault())})}),vo=a.forwardRef((e,t)=>{const n=O(U,e.__scopeDialog),r=a.useRef(!1),o=a.useRef(!1);return v.jsx(Zt,{...e,ref:t,trapFocus:!1,disableOutsidePointerEvents:!1,onCloseAutoFocus:s=>{var i,c;(i=e.onCloseAutoFocus)==null||i.call(e,s),s.defaultPrevented||(r.current||(c=n.triggerRef.current)==null||c.focus(),s.preventDefault()),r.current=!1,o.current=!1},onInteractOutside:s=>{var p,l;(p=e.onInteractOutside)==null||p.call(e,s),s.defaultPrevented||(r.current=!0,s.detail.originalEvent.type==="pointerdown"&&(o.current=!0));const i=s.target;((l=n.triggerRef.current)==null?void 0:l.contains(i))&&s.preventDefault(),s.detail.originalEvent.type==="focusin"&&o.current&&s.preventDefault()}})}),Zt=a.forwardRef((e,t)=>{const{__scopeDialog:n,trapFocus:r,onOpenAutoFocus:o,onCloseAutoFocus:s,...i}=e,c=O(U,n),p=a.useRef(null),l=L(t,p);return vr(),v.jsxs(v.Fragment,{children:[v.jsx(At,{asChild:!0,loop:!0,trapped:r,onMountAutoFocus:o,onUnmountAutoFocus:s,children:v.jsx(_e,{role:"dialog",id:c.contentId,"aria-describedby":c.descriptionId,"aria-labelledby":c.titleId,"data-state":We(c.open),...i,ref:l,onDismiss:()=>c.onOpenChange(!1)})}),v.jsxs(v.Fragment,{children:[v.jsx(mo,{titleId:c.titleId}),v.jsx(ko,{contentRef:p,descriptionId:c.descriptionId})]})]})}),Ue="DialogTitle",Xt=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(Ue,n);return v.jsx(A.h2,{id:o.titleId,...r,ref:t})});Xt.displayName=Ue;var Yt="DialogDescription",Qt=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(Yt,n);return v.jsx(A.p,{id:o.descriptionId,...r,ref:t})});Qt.displayName=Yt;var Jt="DialogClose",en=a.forwardRef((e,t)=>{const{__scopeDialog:n,...r}=e,o=O(Jt,n);return v.jsx(A.button,{type:"button",...r,ref:t,onClick:P(e.onClick,()=>o.onOpenChange(!1))})});en.displayName=Jt;function We(e){return e?"open":"closed"}var tn="DialogTitleWarning",[ac,nn]=En(tn,{contentName:U,titleName:Ue,docsSlug:"dialog"}),mo=({titleId:e})=>{const t=nn(tn),n=`\`${t.contentName}\` requires a \`${t.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${t.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${t.docsSlug}`;return a.useEffect(()=>{e&&(document.getElementById(e)||console.error(n))},[n,e]),null},go="DialogDescriptionWarning",ko=({contentRef:e,descriptionId:t})=>{const r=`Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${nn(go).contentName}}.`;return a.useEffect(()=>{var s;const o=(s=e.current)==null?void 0:s.getAttribute("aria-describedby");t&&o&&(document.getElementById(t)||console.warn(r))},[r,e,t]),null},sc=zt,cc=Wt,ic=$t,lc=Kt,uc=Gt,dc=Xt,fc=Qt,hc=en,Ae="rovingFocusGroup.onEntryFocus",bo={bubbles:!1,cancelable:!0},re="RovingFocusGroup",[Fe,rn,xo]=dt(re),[wo,on]=te(re,[xo]),[Eo,Mo]=wo(re),an=a.forwardRef((e,t)=>v.jsx(Fe.Provider,{scope:e.__scopeRovingFocusGroup,children:v.jsx(Fe.Slot,{scope:e.__scopeRovingFocusGroup,children:v.jsx(Co,{...e,ref:t})})}));an.displayName=re;var Co=a.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:n,orientation:r,loop:o=!1,dir:s,currentTabStopId:i,defaultCurrentTabStopId:c,onCurrentTabStopIdChange:p,onEntryFocus:l,preventScrollOnEntryFocus:h=!1,...y}=e,m=a.useRef(null),w=L(t,m),C=Pt(s),[d,f]=ye({prop:i,defaultProp:c??null,onChange:p,caller:re}),[k,b]=a.useState(!1),g=V(l),x=rn(n),E=a.useRef(!1),[S,M]=a.useState(0);return a.useEffect(()=>{const R=m.current;if(R)return R.addEventListener(Ae,g),()=>R.removeEventListener(Ae,g)},[g]),v.jsx(Eo,{scope:n,orientation:r,dir:C,loop:o,currentTabStopId:d,onItemFocus:a.useCallback(R=>f(R),[f]),onItemShiftTab:a.useCallback(()=>b(!0),[]),onFocusableItemAdd:a.useCallback(()=>M(R=>R+1),[]),onFocusableItemRemove:a.useCallback(()=>M(R=>R-1),[]),children:v.jsx(A.div,{tabIndex:k||S===0?-1:0,"data-orientation":r,...y,ref:w,style:{outline:"none",...e.style},onMouseDown:P(e.onMouseDown,()=>{E.current=!0}),onFocus:P(e.onFocus,R=>{const N=!E.current;if(R.target===R.currentTarget&&N&&!k){const F=new CustomEvent(Ae,bo);if(R.currentTarget.dispatchEvent(F),!F.defaultPrevented){const _=x().filter(I=>I.focusable),H=_.find(I=>I.active),W=_.find(I=>I.id===d),D=[H,W,..._].filter(Boolean).map(I=>I.ref.current);ln(D,h)}}E.current=!1}),onBlur:P(e.onBlur,()=>b(!1))})})}),sn="RovingFocusGroupItem",cn=a.forwardRef((e,t)=>{const{__scopeRovingFocusGroup:n,focusable:r=!0,active:o=!1,tabStopId:s,children:i,...c}=e,p=J(),l=s||p,h=Mo(sn,n),y=h.currentTabStopId===l,m=rn(n),{onFocusableItemAdd:w,onFocusableItemRemove:C,currentTabStopId:d}=h;return a.useEffect(()=>{if(r)return w(),()=>C()},[r,w,C]),v.jsx(Fe.ItemSlot,{scope:n,id:l,focusable:r,active:o,children:v.jsx(A.span,{tabIndex:y?0:-1,"data-orientation":h.orientation,...c,ref:t,onMouseDown:P(e.onMouseDown,f=>{r?h.onItemFocus(l):f.preventDefault()}),onFocus:P(e.onFocus,()=>h.onItemFocus(l)),onKeyDown:P(e.onKeyDown,f=>{if(f.key==="Tab"&&f.shiftKey){h.onItemShiftTab();return}if(f.target!==f.currentTarget)return;const k=Ro(f,h.orientation,h.dir);if(k!==void 0){if(f.metaKey||f.ctrlKey||f.altKey||f.shiftKey)return;f.preventDefault();let g=m().filter(x=>x.focusable).map(x=>x.ref.current);if(k==="last")g.reverse();else if(k==="prev"||k==="next"){k==="prev"&&g.reverse();const x=g.indexOf(f.currentTarget);g=h.loop?Po(g,x+1):g.slice(x+1)}setTimeout(()=>ln(g))}}),children:typeof i=="function"?i({isCurrentTabStop:y,hasTabStop:d!=null}):i})})});cn.displayName=sn;var To={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function So(e,t){return t!=="rtl"?e:e==="ArrowLeft"?"ArrowRight":e==="ArrowRight"?"ArrowLeft":e}function Ro(e,t,n){const r=So(e.key,n);if(!(t==="vertical"&&["ArrowLeft","ArrowRight"].includes(r))&&!(t==="horizontal"&&["ArrowUp","ArrowDown"].includes(r)))return To[r]}function ln(e,t=!1){const n=document.activeElement;for(const r of e)if(r===n||(r.focus({preventScroll:t}),document.activeElement!==n))return}function Po(e,t){return e.map((n,r)=>e[(t+r)%e.length])}var Ao=an,Io=cn,be="Tabs",[No,pc]=te(be,[on]),un=on(),[Do,Be]=No(be),dn=a.forwardRef((e,t)=>{const{__scopeTabs:n,value:r,onValueChange:o,defaultValue:s,orientation:i="horizontal",dir:c,activationMode:p="automatic",...l}=e,h=Pt(c),[y,m]=ye({prop:r,onChange:o,defaultProp:s??"",caller:be});return v.jsx(Do,{scope:n,baseId:J(),value:y,onValueChange:m,orientation:i,dir:h,activationMode:p,children:v.jsx(A.div,{dir:h,"data-orientation":i,...l,ref:t})})});dn.displayName=be;var fn="TabsList",hn=a.forwardRef((e,t)=>{const{__scopeTabs:n,loop:r=!0,...o}=e,s=Be(fn,n),i=un(n);return v.jsx(Ao,{asChild:!0,...i,orientation:s.orientation,dir:s.dir,loop:r,children:v.jsx(A.div,{role:"tablist","aria-orientation":s.orientation,...o,ref:t})})});hn.displayName=fn;var pn="TabsTrigger",yn=a.forwardRef((e,t)=>{const{__scopeTabs:n,value:r,disabled:o=!1,...s}=e,i=Be(pn,n),c=un(n),p=gn(i.baseId,r),l=kn(i.baseId,r),h=r===i.value;return v.jsx(Io,{asChild:!0,...c,focusable:!o,active:h,children:v.jsx(A.button,{type:"button",role:"tab","aria-selected":h,"aria-controls":l,"data-state":h?"active":"inactive","data-disabled":o?"":void 0,disabled:o,id:p,...s,ref:t,onMouseDown:P(e.onMouseDown,y=>{!o&&y.button===0&&y.ctrlKey===!1?i.onValueChange(r):y.preventDefault()}),onKeyDown:P(e.onKeyDown,y=>{[" ","Enter"].includes(y.key)&&i.onValueChange(r)}),onFocus:P(e.onFocus,()=>{const y=i.activationMode!=="manual";!h&&!o&&y&&i.onValueChange(r)})})})});yn.displayName=pn;var vn="TabsContent",mn=a.forwardRef((e,t)=>{const{__scopeTabs:n,value:r,forceMount:o,children:s,...i}=e,c=Be(vn,n),p=gn(c.baseId,r),l=kn(c.baseId,r),h=r===c.value,y=a.useRef(h);return a.useEffect(()=>{const m=requestAnimationFrame(()=>y.current=!1);return()=>cancelAnimationFrame(m)},[]),v.jsx(X,{present:o||h,children:({present:m})=>v.jsx(A.div,{"data-state":h?"active":"inactive","data-orientation":c.orientation,role:"tabpanel","aria-labelledby":p,hidden:!m,id:l,tabIndex:0,...i,ref:t,style:{...e.style,animationDuration:y.current?"0s":void 0},children:m&&s})})});mn.displayName=vn;function gn(e,t){return`${e}-trigger-${t}`}function kn(e,t){return`${e}-content-${t}`}var yc=dn,vc=hn,mc=yn,gc=mn;export{Xs as $,Wo as A,hc as B,Bo as C,Uo as D,dc as E,At as F,fc as G,sc as H,cc as I,vc as J,mc as K,Ya as L,gc as M,yc as N,lc as O,Vo as P,Ja as Q,qo as R,Oo as S,zo as T,Ga as U,Ho as V,Qs as W,nc as X,Fs as Y,xa as Z,$o as _,A as a,ps as a$,ca as a0,Oa as a1,na as a2,Ta as a3,Is as a4,ja as a5,ua as a6,Wa as a7,ks as a8,bs as a9,Io as aA,Ao as aB,ft as aC,ba as aD,ls as aE,va as aF,ra as aG,Cs as aH,Fa as aI,ec as aJ,ws as aK,qa as aL,is as aM,Xa as aN,Zo as aO,xs as aP,ss as aQ,as as aR,ys as aS,Ys as aT,Zs as aU,fa as aV,Rs as aW,oa as aX,$a as aY,tc as aZ,Yo as a_,ns as aa,Sa as ab,Ss as ac,ts as ad,Ua as ae,Qo as af,Js as ag,Ds as ah,sa as ai,ma as aj,za as ak,ia as al,Bs as am,Gs as an,Ea as ao,_s as ap,Us as aq,Hs as ar,ea as as,rc as at,Ps as au,ha as av,Jo as aw,Xo as ax,on as ay,lt as az,L as b,Qa as b0,Os as b1,Ws as b2,rs as b3,da as b4,es as b5,ds as b6,Es as b7,Ha as b8,Va as b9,Ko as bA,Aa as bB,As as bC,hs as bD,us as bE,zs as bF,la as bG,Ms as bH,Na as bI,vs as bJ,gs as bK,Za as bL,aa as bM,Da as bN,_a as ba,Ns as bb,qs as bc,ms as bd,Ca as be,Pa as bf,Ba as bg,oc as bh,ac as bi,os as bj,Ts as bk,Ra as bl,Ks as bm,Ls as bn,Ia as bo,Vs as bp,js as bq,fs as br,cs as bs,ta as bt,Ka as bu,Ma as bv,ka as bw,wa as bx,$s as by,La as bz,te as c,V as d,X as e,_e as f,Fo as g,_o as h,P as i,Go as j,dt as k,je as l,J as m,Sr as n,vr as o,Ht as p,ee as q,Pt as r,ye as s,$n as t,Z as u,ya as v,ga as w,pa as x,ic as y,uc as z};
