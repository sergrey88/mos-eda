export function fairsLayout(contentScale,heroHeight){
 return {contentScale,heroHeight,backdropHeight:1013*contentScale,
  backdropTrackHeight:heroHeight+1013*contentScale,
  contentTop:64+heroHeight+613*contentScale,revealAt:heroHeight*.78};
}
export function fairsFrame(scrollY,layout){
 const progress=Math.max(0,scrollY)/layout.heroHeight*840;
 // The white panel lags slightly during the reveal, then rejoins normal flow.
 let lag=0;
 if(progress>450&&progress<=780)lag=39*(progress-450)/330;
 else if(progress>780&&progress<840)lag=39*(840-progress)/60;
 const contentOffset=lag*layout.contentScale;
 return {heroBottom:64+layout.heroHeight-scrollY,
  backdropTop:64-Math.max(0,scrollY-layout.heroHeight),
  contentTop:layout.contentTop-scrollY+contentOffset,contentOffset};
}
