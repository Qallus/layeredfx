import {estimate,type WallMeasure} from './estimate';
export function rushFee(date:string,now=Date.now()){if(!date)return 0;const days=(Date.parse(date+'-07:00')-now)/86400000;if(!Number.isFinite(days)||days<=0)return 0;return days<=1?1000:days<=2?500:days<=7?200:days<14?150:0;}
export const travelCharge=(miles:number)=>Math.ceil(Math.max(0,miles)/10)*10;
export type ProjectDetails={name:string;email:string;phone:string;address:string;heightFromGround:string;obstacles:string;removePictures:boolean;coverHoles:boolean;repairImperfections:boolean;removeWraps:boolean;location:'Interior'|'Exterior';requestedAt:string};
export const blankProject:ProjectDetails={name:'',email:'',phone:'',address:'',heightFromGround:'0',obstacles:'',removePictures:false,coverHoles:false,repairImperfections:false,removeWraps:false,location:'Interior',requestedAt:''};
export function projectEstimate(walls:WallMeasure[],waste:number,rate:number,labor:number,requestedAt:string,miles:number|null,now=Date.now()){const base=estimate(walls,waste,rate,labor);const rush=rushFee(requestedAt,now),travel=miles===null?null:travelCharge(miles);return{...base,rush,travel,total:base.total+rush+(travel||0)};}
