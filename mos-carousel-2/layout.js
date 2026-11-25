// Uniformly fit the original composition below the unscaled 64px header.
export function screenLayout(width,viewportHeight){
  const pageHeight=Math.max(800,viewportHeight);
  const available=pageHeight-64;
  const scale=Math.min(width/1600,available/840);
  return {scale,height:available/scale,left:(width-1600*scale)/2,pageHeight};
}
