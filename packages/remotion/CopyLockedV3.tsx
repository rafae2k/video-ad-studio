import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandFontLoader} from './FontLoader';
import transcript from './public/mastercopy-v3-captions.json';
import mapping from './public/mastercopy-v3-map.json';

const C={olive:'#343502',cream:'#F5F2EB',acid:'#D5E500',black:'#161616'};
const title='"Creme Glacee", sans-serif',body='Inter, sans-serif';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease=(f:number,d=0)=>spring({frame:f-d,fps:30,config:{damping:22,stiffness:150}});
const at=(source:number)=>{const k=mapping.keeps.find(k=>source>=k.sourceStart&&source<k.sourceEnd);return k?source-k.sourceStart+k.outputStart:0;};
const video=staticFile('mastercopy-v3.mp4');
const paper=staticFile('generated/editorial-paper-v3.png');
const hero=staticFile('brand/vip/hero-kit-black.webp');
export const NOTION_HOOK='A Black Friday da Nuture esse ano vai ser diferente de tudo que a gente já fez.';
export const NOTION_HEADLINE='CEO DA NUTURE FAZ PRONUNCIAMENTO SOBRE A BLACK FRIDAY 👀';

export const PaperWipe:React.FC<{children:React.ReactNode;duration?:number}>=({children,duration=15})=>{
 const f=useCurrentFrame();const p=interpolate(f,[0,duration],[-12,112],clamp);
 return <AbsoluteFill style={{clipPath:`polygon(0 0,100% 0,100% ${p-5}%,94% ${p-2}%,86% ${p-7}%,79% ${p+2}%,71% ${p-2}%,60% ${p+3}%,51% ${p}%,41% ${p-5}%,32% ${p+2}%,21% ${p-3}%,11% ${p+4}%,0 ${p}%)`}}>{children}</AbsoluteFill>;
};
export const TextReveal:React.FC<{children:React.ReactNode;size?:number;delay?:number;color?:string}>=({children,size=145,delay=0,color=C.cream})=>{
 const f=useCurrentFrame();return <div style={{overflow:'hidden',paddingBottom:12}}><div style={{fontFamily:title,fontSize:size,fontWeight:400,lineHeight:1.03,letterSpacing:-3,color,translate:`0 ${115*(1-ease(f,delay))}%`}}>{children}</div></div>;
};
const Header:React.FC=()=> <div style={{position:'absolute',left:0,right:0,top:0,height:295,zIndex:20,background:C.cream,clipPath:'polygon(0 0,100% 0,100% 93%,91% 95%,80% 92%,67% 96%,50% 94%,38% 97%,24% 94%,11% 97%,0 94%)',padding:'72px 70px 30px',boxSizing:'border-box'}}>
 <div style={{fontFamily:title,fontSize:43,lineHeight:1.1,color:C.black,textAlign:'center',letterSpacing:.3}}>CEO DA NUTURE FAZ<br/>PRONUNCIAMENTO SOBRE<br/>A BLACK FRIDAY 👀</div>
 </div>;

export const RotoPerson:React.FC<{shiftX?:number;scale?:number}>=({shiftX=0,scale=1})=>{
 const f=useCurrentFrame();const mask=staticFile(`mattes/david-intro/frame-${String(45+f).padStart(6,'0')}.png`);
 return <AbsoluteFill style={{zIndex:2,translate:`${shiftX}px 0`,scale,transformOrigin:'50% 75%',maskImage:`url("${mask}")`,maskMode:'luminance',maskSize:'100% 100%',maskRepeat:'no-repeat',WebkitMaskImage:`url("${mask}")`,WebkitMaskSize:'100% 100%'}}><OffthreadVideo src={video} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></AbsoluteFill>;
};

const HookWords:React.FC<{compact?:boolean;dark?:boolean}>=({compact=false,dark=false})=>{
 const f=useCurrentFrame();const phase=f<38?0:f<81?1:2;const local=f-[0,38,81][phase];
 const color=dark?C.olive:C.cream;const big=compact?112:165;
 return <div style={{translate:`0 ${35*(1-ease(local))}px`}}>
 {phase===0?<><div style={{fontSize:compact?31:36,color,marginBottom:18}}>A Black Friday da Nuture</div><div style={{fontFamily:title,fontSize:big+25,color:dark?C.olive:C.acid,lineHeight:1.05}}>BLACK<br/>FRIDAY.</div></>:phase===1?<><div style={{fontSize:compact?34:40,color,marginBottom:15}}>esse ano vai ser</div><div style={{fontFamily:title,fontSize:big-10,color:dark?C.olive:C.acid,lineHeight:1.05}}>DIFERENTE</div></>:<div style={{fontFamily:title,fontSize:compact?82:107,color,lineHeight:1.1}}>de tudo que<br/>a gente já fez.</div>}
 </div>;
};

export const OpeningV3:React.FC<{variant:string}>=({variant})=>{
 const f=useCurrentFrame();const t=f/30;const fade=interpolate(f,[143,158],[1,0],clamp);
 const texture=<Img src={paper} style={{width:'100%',height:'100%',objectFit:'cover',scale:1.02+.025*f/180}}/>;
 if(variant==='split')return <AbsoluteFill style={{opacity:fade}}>
  <AbsoluteFill style={{height:900,overflow:'hidden'}}>{texture}<div style={{position:'absolute',inset:0,background:'#343502cf'}}/><div style={{position:'absolute',left:75,right:65,top:345}}><HookWords compact/></div></AbsoluteFill>
  <div style={{position:'absolute',left:0,right:0,top:900,height:1020,overflow:'hidden',clipPath:'polygon(0 2%,9% 0,20% 2%,34% 0,50% 1%,65% 0,80% 2%,93% 0,100% 1%,100% 100%,0 100%)'}}><OffthreadVideo src={video} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 58%'}}/></div>
 </AbsoluteFill>;
 if(variant==='paper')return <AbsoluteFill style={{opacity:fade}}>
  {texture}<div style={{position:'absolute',inset:0,background:'linear-gradient(#34350288,#34350266 40%,transparent 60%)'}}/>
  <div style={{position:'absolute',left:70,right:60,top:345,zIndex:2}}><HookWords compact/></div>
  <div style={{position:'absolute',left:130,top:850,width:840,height:920,rotate:`${-5+3*ease(f,20)}deg`,scale:.92+.08*ease(f,8),boxShadow:'0 35px 60px #0007',background:C.cream,padding:20,boxSizing:'border-box',clipPath:'polygon(1% 2%,99% 0,98% 98%,2% 100%,0 30%)'}}><div style={{width:'100%',height:'100%',overflow:'hidden'}}><OffthreadVideo src={video} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 57%'}}/></div></div>
 </AbsoluteFill>;
 return <AbsoluteFill style={{opacity:fade}}>
  {texture}<div style={{position:'absolute',inset:0,background:'linear-gradient(#343502aa,#34350255 60%,transparent)'}}/>
  <div style={{position:'absolute',left:55,right:45,top:f<81?345:1370,zIndex:f<81?1:3,textShadow:f<81?'none':'0 5px 25px #0008'}}><HookWords/></div>
  {f<90?<RotoPerson/>:<div style={{position:'absolute',inset:0,clipPath:`circle(${interpolate(f,[90,105],[20,85],clamp)}% at 50% 55%)`}}><OffthreadVideo src={video} muted style={{width:'100%',height:'100%',objectFit:'cover'}}/></div>}
 </AbsoluteFill>;
};

export const PhysicalPhoto:React.FC<{src?:string;startScale?:number;endScale?:number;rotation?:number}>=({src=hero,startScale=1,endScale=1.06,rotation=-3})=>{
 const f=useCurrentFrame();return <div style={{position:'relative',padding:22,background:C.cream,boxShadow:'24px 38px 65px #0007',rotate:`${rotation}deg`,scale:interpolate(f,[0,180],[startScale,endScale],clamp),clipPath:'polygon(0 2%,20% 0,41% 1%,70% 0,99% 2%,100% 96%,82% 99%,55% 98%,30% 100%,1% 97%)'}}><Img src={src} style={{display:'block',width:'100%'}}/></div>;
};

export const NutritionCollage:React.FC=()=>{
 const f=useCurrentFrame();const t=f/30;const reveal=interpolate(f,[160,180],[0,1],clamp);
 return <PaperWipe><AbsoluteFill style={{background:C.olive}}>
  <Img src={paper} style={{width:'100%',height:'100%',objectFit:'cover',scale:1.06,translate:`0 ${180-f*.06}px`}}/>
  <div style={{position:'absolute',left:70,right:65,top:365}}><TextReveal size={120} color={C.cream}>{t<5.3?'Vários potes.':'59'}</TextReveal><TextReveal size={t<5.3?100:62} delay={4} color={C.acid}>{t<5.3?'Várias cápsulas.':'vitaminas, minerais,'}</TextReveal>{t>=5.3&&<div style={{fontSize:53,color:C.cream,lineHeight:1.2}}>bioativos e vegetais</div>}</div>
  <Img src={staticFile('generated/many-jars-v3.png')} style={{position:'absolute',left:30,top:765,width:1020,height:1020,objectFit:'contain',scale:1-.45*reveal,translate:`${-900*reveal}px ${-40*ease(f,10)}px`,rotate:`${-8*reveal}deg`,filter:'drop-shadow(20px 35px 20px #0005)'}}/>
  <div style={{position:'absolute',left:70,top:915,width:940,opacity:reveal,translate:`${400*(1-reveal)}px 0`}}><PhysicalPhoto/></div>
  {t>9.3&&<div style={{position:'absolute',left:75,right:60,top:1420,color:C.olive,fontFamily:title,fontSize:80,lineHeight:1.05}}>Uma única<br/>dose por dia.</div>}
 </AbsoluteFill></PaperWipe>;
};

export const OfferCollage:React.FC=()=>{
 const f=useCurrentFrame();return <PaperWipe><AbsoluteFill style={{background:C.olive}}>
  <Img src={paper} style={{width:'100%',height:'100%',objectFit:'cover',scale:1.04}}/>
  <div style={{position:'absolute',left:65,right:50,top:350}}><TextReveal size={125}>A melhor</TextReveal><TextReveal size={210} color={C.acid} delay={4}>oferta.</TextReveal></div>
  <div style={{position:'absolute',left:65,top:940,width:950,translate:`0 ${70*(1-ease(f,9))}px`}}><PhysicalPhoto startScale={.94} endScale={1.08}/></div>
  <div style={{position:'absolute',left:75,right:65,top:1505,color:C.olive,fontFamily:title,fontSize:64,opacity:interpolate(f,[56,62],[0,1],clamp)}}>Da nossa história.</div>
  <svg width="1080" height="1920" style={{position:'absolute',inset:0}}><path d="M70 810 Q550 850 985 786" fill="none" stroke={C.acid} strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-interpolate(f,[12,30],[0,1],clamp)}/></svg>
 </AbsoluteFill></PaperWipe>;
};

export const BenefitsCollage:React.FC=()=>{
 const f=useCurrentFrame();const phase=f<32?0:f<66?1:2;const names=['DESCONTOS','BRINDES','BÔNUS'];
 return <PaperWipe duration={9}><AbsoluteFill style={{background:C.black}}>
  <Img src={paper} style={{width:'100%',height:'100%',objectFit:'cover',scale:1.2,rotate:'180deg'}}/>
  <div style={{position:'absolute',left:60,right:45,top:390,fontFamily:title,fontSize:phase===0?136:175,color:C.olive,lineHeight:1.1,rotate:'-3deg'}}>{names[phase]}</div>
  <div style={{position:'absolute',left:70,top:775,width:940,translate:`${phase===1?-35:0}px ${phase===2?-30:0}px`}}><PhysicalPhoto rotation={phase===1?4:-3} startScale={phase===1?1.05:.96}/></div>
  <svg width="1080" height="1920" style={{position:'absolute',inset:0}}><path d="M118 1470 C260 1370 855 1380 948 1490 C1060 1630 170 1680 115 1530" fill="none" stroke={C.cream} strokeWidth="8" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-interpolate(f,[70,105],[0,1],clamp)}/></svg>
  <div style={{position:'absolute',left:140,right:70,top:1440,fontFamily:title,fontSize:phase===2?68:0,color:C.cream,lineHeight:1.1}}>realmente<br/>insanos.</div>
 </AbsoluteFill></PaperWipe>;
};

const CaptionsV3:React.FC=()=>{
 const f=useCurrentFrame();const t=f/30;
 if(t<5.3)return null;
 const groups:typeof transcript.words[]=[];let pending:typeof transcript.words=[];
 for(const word of transcript.words){pending.push(word);if(pending.length===4||/[.!?]$/.test(word.text)){groups.push(pending);pending=[];}}if(pending.length)groups.push(pending);
 const chunk=groups.find(g=>t>=g[0].start&&t<g[g.length-1].end+.12);if(!chunk)return null;
 return <div style={{position:'absolute',left:75,right:90,bottom:170,textAlign:'center',fontFamily:body,fontWeight:700,fontSize:51,lineHeight:1.15,color:C.cream,textShadow:'0 3px 8px #000,0 0 22px #000b',zIndex:12}}>{chunk.map(w=><span key={w.sourceWordIndex} style={{color:t>=w.start&&t<w.end+.06?C.acid:C.cream}}>{w.text}{' '}</span>)}</div>;
};

export const CopyLockedV3:React.FC<{variant:'depth'|'split'|'paper'}>=({variant})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();const t=f/fps;
 const nutrition=at(14.009),offer=at(30.925),benefits=at(39.054),vip=at(54.155),cta=at(62.343);
 return <AbsoluteFill style={{background:C.olive,fontFamily:body,fontSynthesis:'none',overflow:'hidden'}}>
  <BrandFontLoader/>
  <OffthreadVideo src={video} style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover'}}/>
  <Sequence name={`Hook Notion — ${variant}`} durationInFrames={180}><OpeningV3 variant={variant}/></Sequence>
  <Sequence name="Vários potes → dose única" from={Math.round(nutrition*fps)} durationInFrames={Math.round((at(25.6)-nutrition)*fps)}><NutritionCollage/></Sequence>
  <Sequence name="Oferta — copy preservado" from={Math.round(offer*fps)} durationInFrames={Math.round((at(34.346)-offer)*fps)}><OfferCollage/></Sequence>
  <Sequence name="Benefícios — foto física" from={Math.round(benefits*fps)} durationInFrames={Math.round((at(43.5)-benefits)*fps)}><BenefitsCollage/></Sequence>
  {t>=vip&&t<at(56)&&<div style={{position:'absolute',left:70,right:50,top:350,fontFamily:title,fontSize:115,color:C.acid,textShadow:'0 4px 25px #000b',translate:`0 ${60*(1-ease(f-vip*fps))}px`}}>GRUPO VIP<br/><span style={{fontSize:66,color:C.cream}}>no WhatsApp.</span></div>}
  {t>=cta&&<div style={{position:'absolute',left:70,right:70,top:350,color:C.cream,textShadow:'0 4px 25px #000b'}}><div style={{fontFamily:title,fontSize:86,lineHeight:1.1}}>Clica aqui e<br/><span style={{color:C.acid}}>entra no grupo.</span></div></div>}
  <CaptionsV3/>
  <Header/>
  {[nutrition,offer,benefits].map((s,i)=><Sequence key={i} from={Math.round(s*fps)} durationInFrames={30}><Audio src={staticFile('sfx/whoosh.wav')} volume={.065}/></Sequence>)}
 </AbsoluteFill>;
};
