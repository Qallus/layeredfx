/** Complement ordered, disjoint segmentation runs to protect everything outside a wall. */
export function invertRuns(runs:number[],width:number,height:number):number[]{
 const result:number[]=[];let i=0;
 for(let y=0;y<height;y++){let x=0;while(i<runs.length&&runs[i]===y){const start=runs[i+1],end=start+runs[i+2];if(start>x)result.push(y,x,start-x);x=end;i+=3;}if(x<width)result.push(y,x,width-x);}
 return result;
}
