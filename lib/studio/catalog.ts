export const applications=['Interior residential & commercial','Exterior walls & doors','Cabinet wraps','Appliance wraps','Countertops','Window films'] as const;
const wraps=['Vinyl wraps - standard','Vinyl wraps - custom graphics'];
const laminates=['Woodgrains','Metals','Thinscape composite tops','Quartz','Natural materials','Solid surface','Wetwall'].map(v=>'Laminates - '+v);
export const categories:Record<string,string[]>={
 [applications[0]]:[...wraps,'Wallpaper','Roman clay','Cladding',...laminates,'Faux concrete','Wainscoting','Single color paint','Paint & trim'],
 [applications[1]]:wraps,[applications[2]]:[...wraps,...laminates],[applications[3]]:wraps,[applications[4]]:[...wraps,...laminates],[applications[5]]:['Graphics','Ceramic','Solar tint','Frosted privacy','Decorative film','Safety & security','UV protection']};
export const tones=[{name:'Linen',color:'#e4ddcd'},{name:'Sand',color:'#c6ae8e'},{name:'Sage',color:'#87947c'},{name:'Graphite',color:'#414945'},{name:'Terracotta',color:'#ad735c'},{name:'Ivory',color:'#f0ece1'}];
export function finishFor(category:string){return /Woodgrain|Cladding|Wainscot/.test(category)?'oak':/Wallpaper|Graphics|graphics/.test(category)?'palm':/concrete|Quartz|Natural|Thinscape/.test(category)?'concrete':/film|tint|Ceramic|privacy|protection|security/i.test(category)?'film':'clay';}
