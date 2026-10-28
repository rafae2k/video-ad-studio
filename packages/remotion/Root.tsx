import React from 'react';
import {Composition, Folder} from 'remotion';
import {CopyLockedV3} from './CopyLockedV3';
import {AdComposition, OfferReveal, BenefitTickets, VipPass} from './AdComposition';
import {BrandFontLoader} from './FontLoader';
import edit from './public/edit.json';

const BrandOfferReveal: React.FC = () => <><BrandFontLoader/><OfferReveal/></>;
const BrandBenefitTickets: React.FC<{compact: boolean}> = (props) => <><BrandFontLoader/><BenefitTickets {...props}/></>;
const BrandVipPass: React.FC<{endCard: boolean}> = (props) => <><BrandFontLoader/><VipPass {...props}/></>;

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="CopyLockedV3">
      <Composition id="DavidV3Depth" component={CopyLockedV3} width={1080} height={1920} fps={30} durationInFrames={1833} defaultProps={{variant: "depth" as const}}/>
      <Composition id="DavidV3Split" component={CopyLockedV3} width={1080} height={1920} fps={30} durationInFrames={1833} defaultProps={{variant: "split" as const}}/>
      <Composition id="DavidV3Paper" component={CopyLockedV3} width={1080} height={1920} fps={30} durationInFrames={1833} defaultProps={{variant: "paper" as const}}/>
    </Folder>
    <Composition id="DavidBlackV2" component={AdComposition} width={1080} height={1920} fps={30} durationInFrames={918} defaultProps={{edit: {...edit, variant: "split"}}}/>
    <Composition id="HookType" component={AdComposition} width={1080} height={1920} fps={30} durationInFrames={918} defaultProps={{edit: {...edit, variant: "type"}}}/>
    <Composition id="HookBenefits" component={AdComposition} width={1080} height={1920} fps={30} durationInFrames={918} defaultProps={{edit: {...edit, variant: "benefits"}}}/>
    <Folder name="MotionLibrary">
      <Composition id="OfferReveal" component={BrandOfferReveal} width={1080} height={1920} fps={30} durationInFrames={108}/>
      <Composition id="BenefitTickets" component={BrandBenefitTickets} width={1080} height={1920} fps={30} durationInFrames={159} defaultProps={{compact: false}}/>
      <Composition id="VipPass" component={BrandVipPass} width={1080} height={1920} fps={30} durationInFrames={153} defaultProps={{endCard: false}}/>
    </Folder>
  </>
);
