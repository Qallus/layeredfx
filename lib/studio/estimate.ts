export type WallMeasure={name:string;width:number;height:number;openings:number};
export function estimate(walls:WallMeasure[],waste:number,material:number,installation:number){
 const positive=(n:number)=>Number.isFinite(n)?Math.max(0,n):0;
 const area=walls.reduce((sum,w)=>sum+Math.max(0,positive(w.width)*positive(w.height)-positive(w.openings)),0);
 const orderArea=area*(1+Math.min(100,positive(waste))/100);
 return {area,orderArea,materialCost:orderArea*positive(material),installationCost:area*positive(installation),total:orderArea*positive(material)+area*positive(installation)};
}
