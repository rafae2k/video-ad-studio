import React from 'react';
import {BrandFontLoader} from './FontLoader';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const ink='#343502',paper='#F5F2EB',lime='#D5E500';
const font='Inter, Arial, sans-serif';
const display='"Creme Glacee", "Avenir Next Condensed", sans-serif';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease=(f:number,d=0,fps=30)=>spring({frame:f-d,fps,config:{damping:19,stiffness:150,mass:.85}});
const Brand:React.FC<{light?:boolean}>=({light=false})=><Img src={staticFile('brand/vip/logo-branco.svg')} style={{position:'absolute',left:80,top:125,width:185,height:60,objectFit:'contain',filter:light?'none':'brightness(0)'}}/>;

export const RevealLine:React.FC<{children:React.ReactNode;delay?:number;size?:number;color?:string}>=({children,delay=0,size=160,color=ink})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();
 return <div style={{overflow:'hidden',paddingBottom:15}}><div style={{fontFamily:display,fontSize:size,letterSpacing:-4,lineHeight:1.02,color,translate:`0 ${115*(1-ease(f,delay,fps))}%`}}>{children}</div></div>;
};

export const BlackOpening:React.FC<{variant:string;timing?:any}>=({variant,timing={beyondStart:2.398,offerStart:4.65,historyStart:6.578}})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();const t=f/fps;
 if(variant==='split'){
  const stage=t<timing.beyondStart?'black':t<timing.offerStart?'beyond':'offer';
  const local=f-(stage==='black'?0:stage==='beyond'?timing.beyondStart*fps:timing.offerStart*fps);
  return <AbsoluteFill style={{height:820,background:paper,color:ink,overflow:'hidden'}}>
   <Brand/><div style={{position:'absolute',left:72,top:230,right:55}}>
    <div style={{fontSize:34,letterSpacing:3,marginBottom:25}}>{stage==='black'?'A NOSSA BLACK':stage==='beyond'?'A GENTE DECIDIU':t<timing.historyStart?'BLACK NUTURE':'DA NOSSA HISTÓRIA'}</div>
    {stage==='black'?<><div style={{fontFamily:display,fontSize:210,lineHeight:1.05,letterSpacing:-5,translate:`${-20*ease(f,25,fps)}px 0`}}>Black.</div><div style={{height:12,width:850*ease(f,20,fps),background:lime,marginTop:30}}/></>:stage==='beyond'?<div style={{position:'relative',marginTop:15}}><div style={{position:'absolute',left:560,top:-15,width:8,height:310,background:ink,opacity:interpolate(local,[7,16],[1,0],clamp),rotate:`${-65*ease(local,7,fps)}deg`,transformOrigin:'50% 100%'}}/><div style={{fontFamily:display,fontSize:205,lineHeight:1.1,translate:`${-230+230*ease(local,0,fps)}px 0`}}>Ir além.</div></div>:<div style={{fontFamily:display,fontSize:151,lineHeight:1.04,letterSpacing:-5,translate:`0 ${70*(1-ease(local,0,fps))}px`}}>A melhor<br/><span style={{background:lime}}>oferta.</span></div>}
   </div><div style={{position:'absolute',bottom:0,left:0,height:10,width:1080*interpolate(f,[0,3*fps],[.08,1],clamp),background:lime}}/>
  </AbsoluteFill>;
 }
 if(variant==='benefits')return <AbsoluteFill style={{background:t<2.5?ink:undefined}}>
  {t<2.5?<><Brand light/><div style={{position:'absolute',left:80,top:440,right:70,color:paper}}>
   {['Desconto.','Brinde.','Bônus.'].map((txt,i)=><div key={txt} style={{fontFamily:display,fontSize:155,lineHeight:1.16,color:i===2?lime:paper,opacity:i===0?1:interpolate(f,[i*18,i*18+5],[0,1],clamp),translate:`${i===0?0:80*(1-ease(f,i*18,fps))}px 0`}}>{txt}</div>)}
   <div style={{fontSize:34,marginTop:60,letterSpacing:4}}>A BLACK VEM AÍ.</div>
  </div></>:<div style={{position:'absolute',left:80,top:170,color:lime,fontFamily:display,fontSize:140,textShadow:'0 3px 20px #0008'}}>Vai além.</div>}
 </AbsoluteFill>;
 const opening=interpolate(f,[20,60],[0,1],clamp);
 return <AbsoluteFill>
  <div style={{position:'absolute',left:0,right:0,top:0,height:720*(1-opening),background:paper,overflow:'hidden'}}>
   <Brand/><div style={{position:'absolute',left:65,top:220,color:ink,fontFamily:display,fontSize:255,lineHeight:1,letterSpacing:-5,translate:`0 ${-250*opening}px`}}>Black.</div>
   <div style={{position:'absolute',left:80,top:560,fontSize:39,letterSpacing:2,color:ink}}>UM RECADO DO FUNDADOR.</div>
  </div>
  <div style={{position:'absolute',left:0,right:0,bottom:0,height:900*(1-opening),background:ink,overflow:'hidden'}}>
   <div style={{position:'absolute',left:80,top:180,right:80,color:paper,fontFamily:display,fontSize:130,lineHeight:1.1}}><span style={{color:lime}}>Ir além.</span></div>
  </div>
  {t>timing.beyondStart&&<div style={{position:'absolute',left:80,top:190,color:lime,fontFamily:display,fontSize:168,textShadow:'0 3px 25px #0008',translate:`${80*(1-ease(f,timing.beyondStart*fps,fps))}px 0`}}>Ir além.</div>}
 </AbsoluteFill>;
};

export const OfferReveal:React.FC<{historyDelay?:number}>=({historyDelay=52})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();
 return <AbsoluteFill style={{background:paper,color:ink,clipPath:`inset(${100*(1-ease(f,0,fps))}% 0 0 0)`}}>
  <Brand/><div style={{position:'absolute',left:80,top:270,fontSize:28,letterSpacing:5}}>BLACK NUTURE</div>
  <div style={{position:'absolute',left:72,top:395,right:55}}>
   <RevealLine delay={3} size={156}>A melhor</RevealLine><RevealLine delay={8} size={230}>oferta.</RevealLine>
   <div style={{height:20,background:lime,width:880*ease(f,15,fps),rotate:'-2deg'}}/>
   <div style={{marginTop:42,opacity:interpolate(f,[historyDelay,historyDelay+12],[0,1],clamp),translate:`0 ${40*(1-ease(f,historyDelay,fps))}px`,fontSize:65,lineHeight:1.1,letterSpacing:-3}}>da nossa <b>história.</b></div>
  </div>
  <Img src={staticFile('brand/vip/hero-kit-black.webp')} style={{position:'absolute',left:55,top:1080,width:970,height:546,objectFit:'contain',translate:`0 ${60*(1-ease(f,18,fps))}px`,opacity:interpolate(f,[14,23],[0,1],clamp)}}/>
  <div style={{position:'absolute',bottom:190,left:80,right:80,borderTop:`2px solid ${ink}`,paddingTop:28,fontSize:28,letterSpacing:3}}>O FUNDADOR TEM UM RECADO.</div>
 </AbsoluteFill>;
};

export const FounderSignature:React.FC=()=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();
 return <AbsoluteFill>
  <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#051811aa,transparent 55%)'}}/>
  <div style={{position:'absolute',left:85,top:1270,color:paper,translate:`0 ${40*(1-ease(f,0,fps))}px`,opacity:interpolate(f,[0,7],[0,1],clamp)}}>
   <div style={{fontFamily:display,fontSize:112,lineHeight:1.1}}>David</div>
   <svg width="405" height="30" viewBox="0 0 405 30"><path d="M3 22 Q180 0 397 14" fill="none" stroke={lime} strokeWidth="6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-interpolate(f,[8,24],[0,1],clamp)}/></svg>
   <div style={{fontSize:36,marginTop:12}}>Fundador da Nuture</div>
  </div>
 </AbsoluteFill>;
};
const BenefitSymbol:React.FC<{kind:number}>=({kind})=><svg width="135" height="135" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
 {kind===0?<><path d="M25 75 75 25"/><circle cx="29" cy="29" r="13"/><circle cx="71" cy="71" r="13"/></>:kind===1?<><path d="M18 42H82V80H18Z M14 29H86V42H14Z M50 29V80"/><path d="M50 29C13 29 27 0 42 17L50 29C87 29 73 0 58 17Z"/></>:<path d="M50 8 59 36 88 26 69 50 88 74 59 64 50 92 41 64 12 74 31 50 12 26 41 36Z"/>}
</svg>;

export const BenefitTickets:React.FC<{compact?:boolean}>=({compact=false})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();const beats=[0,1.048,2.192];const titles=['Desconto','Brinde','Bônus'];const colors=[paper,lime,'#EFEDCB'];
 const active=f<beats[1]*fps?0:f<beats[2]*fps?1:2;
 return <AbsoluteFill style={{background:ink,color:paper,height:compact?820:1920,overflow:'hidden'}}>
  {!compact&&<Brand light/>}
  <div style={{position:'absolute',left:80,top:compact?100:315,fontSize:compact?42:52,letterSpacing:-2}}>O que vem por aí.</div>
  <div style={{position:'absolute',top:compact?170:0,left:compact?92:0,scale:compact?.68:1,transformOrigin:'top left',width:1080,height:1920}}>
  {titles.map((title,i)=>{
   const local=f-beats[i]*fps;const p=ease(local,0,fps);if(local<0)return null;
   const y=(compact?0:480)+i*(compact?250:315)+(i<active?-22*ease(f-beats[active]*fps,0,fps):0);
   return <div key={title} style={{position:'absolute',left:105,top:y,width:850,height:345,borderRadius:14,background:colors[i],color:ink,boxShadow:'0 28px 55px #0005',translate:`${(1-p)*(i%2?-1100:1100)}px ${90*(1-p)}px`,rotate:`${[-4,3,-2][i]+18*(1-p)}deg`,padding:'40px 48px',boxSizing:'border-box'}}>
    <div style={{position:'absolute',right:182,top:0,height:'100%',borderLeft:'2px dashed #112c2350'}}/>
    <div style={{fontSize:25,letterSpacing:3,marginBottom:28}}>BLACK / NUTURE</div>
    <div style={{fontFamily:display,fontSize:i===0?104:132,lineHeight:1.1,letterSpacing:-3}}>{title}</div>
    <div style={{position:'absolute',right:24,top:108}}><BenefitSymbol kind={i}/></div>
    <div style={{position:'absolute',width:30,height:30,borderRadius:'50%',background:ink,right:168,top:-15}}/>
    <div style={{position:'absolute',width:30,height:30,borderRadius:'50%',background:ink,right:168,bottom:-15}}/>
   </div>;
  })}</div>
  {!compact&&<div style={{position:'absolute',left:80,bottom:230,fontSize:56,fontWeight:700,letterSpacing:-2,opacity:interpolate(f,[3.062*fps,3.3*fps],[0,1],clamp)}}>Realmente <span style={{color:lime}}>insanos.</span></div>}
 </AbsoluteFill>;
};

export const VipPass:React.FC<{endCard?:boolean}>=({endCard=false})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();const p=ease(f,4,fps);const reveal=ease(f,34,fps);
 if(endCard)return <AbsoluteFill style={{background:'#0F0F0F',color:paper}}>
  <Brand light/><div style={{position:'absolute',left:80,top:330,right:70}}><RevealLine size={128} color={paper} delay={2}>Acesso</RevealLine><RevealLine size={128} color={lime} delay={6}>antecipado.</RevealLine><div style={{fontSize:40,marginTop:35}}>Entre no Grupo VIP da Black.</div></div>
  <Img src={staticFile('brand/vip/hero-kit-black.webp')} style={{position:'absolute',left:0,top:850,width:1080,height:608,objectFit:'contain',scale:1+.05*(1-p)}}/>
  <div style={{position:'absolute',left:80,right:80,top:1500,height:125,borderRadius:14,background:lime,color:'#161616',display:'flex',alignItems:'center',padding:'0 35px',fontSize:42,fontWeight:700,boxSizing:'border-box',translate:`0 ${45*(1-ease(f,12,fps))}px`}}>Quero acesso antecipado <span style={{marginLeft:'auto',background:ink,color:lime,width:70,height:70,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>↗</span></div>
 </AbsoluteFill>;
 return <AbsoluteFill style={{background:ink,color:paper,clipPath:`inset(0 ${100*(1-ease(f,0,fps))}% 0 0)`}}>
  <Brand light/>
  <div style={{position:'absolute',left:80,top:335,right:65}}>
   <RevealLine size={endCard?128:117} color={paper} delay={4}>{endCard?'Entre no':'Revelada'}</RevealLine>
   <RevealLine size={endCard?163:157} color={lime} delay={8}>{endCard?'grupo VIP.':'primeiro.'}</RevealLine>
  </div>
  <div style={{position:'absolute',left:135,top:870,width:810,height:660,rotate:`${-4+4*reveal}deg`,translate:`0 ${200*(1-p)}px`}}>
   <div style={{position:'absolute',inset:'0 0 80px',background:'#4A4B13',borderRadius:20,boxShadow:'0 50px 90px #0006'}}/>
   <div style={{position:'absolute',left:30,right:30,top:100-150*reveal,height:495,background:paper,color:ink,borderRadius:18,padding:45,boxSizing:'border-box',boxShadow:'0 0 30px #0002'}}>
    <div style={{fontSize:26,letterSpacing:4}}>SEU ACESSO ANTECIPADO</div>
    <div style={{fontFamily:display,fontSize:220,lineHeight:1.2,letterSpacing:-7}}>VIP<span style={{fontSize:105,verticalAlign:'top',color:'#73742B'}}>↗</span></div>
    <div style={{fontSize:32,borderTop:'2px dashed #112c2355',paddingTop:22}}>BLACK NUTURE</div>
   </div>
   <div style={{position:'absolute',left:0,right:0,top:345,height:275,background:lime,color:ink,borderRadius:'0 0 18px 18px',clipPath:'polygon(0 0,50% 12%,100% 0,100% 100%,0 100%)'}}>
    <div style={{position:'absolute',left:48,bottom:48,fontSize:42,fontWeight:700,letterSpacing:-1}}>Grupo no WhatsApp <span style={{marginLeft:35,fontSize:64}}>↗</span></div>
   </div>
  </div>
  <div style={{position:'absolute',bottom:228,left:80,right:80,fontSize:38,lineHeight:1.3,opacity:interpolate(f,[24,34],[0,1],clamp)}}>{endCard?'Clique e entre para não ficar de fora.':'A condição especial chega antes no grupo.'}</div>
 </AbsoluteFill>;
};

type Word={text:string;startMs:number;endMs:number};
const Captions:React.FC<{edit:Record<string,any>;split:boolean}>=({edit,split})=>{
 const f=useCurrentFrame();const{fps}=useVideoConfig();const t=f/fps;const tm=edit.timing;
 if(edit.variant==='type'&&t<2.05)return null;
 if((!split&&t>=tm.offerStart&&t<tm.hookEnd)||(t>=tm.hookEnd&&t<tm.founderEnd)||(!split&&t>=tm.ticketsStart&&t<tm.ticketsEnd)||(t>=tm.vipStart&&t<tm.vipEnd)||t>=tm.ctaStart||(edit.variant==='benefits'&&t<2.5))return null;
 const cue=edit.captions.find((c:any)=>t>=c.start&&t<c.end);if(!cue)return null;
 const words:Word[]=edit.words.filter((w:Word)=>w.startMs>=cue.start*1000-80&&w.startMs<cue.end*1000-120);if(!words.length)return null;
 const chunks:Word[][]=[];for(let i=0;i<words.length;i+=4)chunks.push(words.slice(i,i+4));
 const chunk=chunks.find((c,i)=>t*1000>=c[0].startMs-80&&(i===chunks.length-1||t*1000<chunks[i+1][0].startMs-80))??chunks[0];
 return <div style={{position:'absolute',left:80,right:105,top:split?1630:1420,textAlign:'center',fontWeight:700,fontSize:64,lineHeight:1.14,letterSpacing:-2,textShadow:'0 3px 8px #000,0 0 28px #000a',color:paper}}>{chunk.map((w,i)=><span key={i} style={{color:t*1000>=w.startMs&&t*1000<w.endMs+80?lime:paper}}>{w.text}{' '}</span>)}</div>;
};

export const AdComposition:React.FC<{edit:Record<string,any>}>=({edit})=>{
 const{fps}=useVideoConfig();const t=useCurrentFrame()/fps;const variant=edit.variant??'type';const tm=edit.timing;const split=variant==='split'&&(t<tm.hookEnd||(t>=tm.ticketsStart&&t<tm.ticketsEnd));
 return <AbsoluteFill style={{background:ink,fontFamily:font,overflow:'hidden',fontSynthesis:'none'}}>
  <BrandFontLoader/>
  {edit.cuts.map((c:any,i:number)=><Sequence key={i} name={c.reason} from={Math.round(c.outputStart*fps)} durationInFrames={Math.round((c.sourceEnd-c.sourceStart)*fps)}>
   <OffthreadVideo src={staticFile(c.sourceFile??'source.mp4')} trimBefore={Math.round(c.sourceStart*fps)} style={{position:'absolute',top:split?820:0,width:'100%',height:split?1100:1920,objectFit:'cover',objectPosition:split?'center 56%':'center'}}/>
  </Sequence>)}
  <Sequence name="Black opening" durationInFrames={Math.round((variant==='split'?tm.hookEnd:tm.offerStart)*fps)}><BlackOpening variant={variant} timing={tm}/></Sequence>
  {variant!=='split'&&<Sequence name="Offer reveal" from={Math.round(tm.offerStart*fps)} durationInFrames={Math.round(tm.hookEnd*fps)-Math.round(tm.offerStart*fps)}><OfferReveal historyDelay={(tm.historyStart-tm.offerStart)*fps}/></Sequence>}
  <Sequence name="Founder signature" from={Math.round(tm.hookEnd*fps)} durationInFrames={66}><FounderSignature/></Sequence>
  <Sequence name="Benefit tickets" from={Math.round(tm.ticketsStart*fps)} durationInFrames={Math.round(tm.ticketsEnd*fps)-Math.round(tm.ticketsStart*fps)}><BenefitTickets compact={variant==='split'}/></Sequence>
  <Sequence name="VIP reveal" from={Math.round(tm.vipStart*fps)} durationInFrames={Math.round(tm.vipEnd*fps)-Math.round(tm.vipStart*fps)}><VipPass/></Sequence>
  <Sequence name="VIP CTA" from={Math.round(tm.ctaStart*fps)} durationInFrames={Math.round(2.9*fps)}><VipPass endCard/></Sequence>
  <Captions edit={edit} split={split}/>
  {edit.sfx.map((s:any,i:number)=><Sequence key={`sfx-${i}`} name={`SFX ${s.file}`} from={Math.round(s.start*fps)} durationInFrames={Math.min(2*fps,Math.round((edit.duration-s.start)*fps))}><Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.gain}/></Sequence>)}
 </AbsoluteFill>;
};
