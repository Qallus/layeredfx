"use client";
// Resizes phone photos before upload (long edge 2400 px, JPEG) so a daily log with many photos stays quick on mobile data.
const MAX=2400;
export async function compressPhoto(file:File):Promise<File>{
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error(`${file.name}: use a JPEG, PNG or WebP photo.`);
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw new Error(`${file.name} could not be read as a photo.`);}
 const scale=Math.min(1,MAX/Math.max(bitmap.width,bitmap.height));
 if(scale===1&&file.type==='image/jpeg'&&file.size<1_500_000){bitmap.close();return file;}
 const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/jpeg',.85));
 if(!blob)throw new Error(`${file.name} could not be compressed.`);
 return new File([blob],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'});
}
