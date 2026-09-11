/// <reference lib="webworker" />
import {SamModel,SamProcessor,AutoProcessor,RawImage,env} from '@huggingface/transformers';
env.allowLocalModels=false;
if(env.backends.onnx.wasm)env.backends.onnx.wasm.numThreads=1;
let model:SamModel,processor:SamProcessor;
let lastSource='';let image:RawImage;
let embeddings:Awaited<ReturnType<SamModel['get_image_embeddings']>>;
self.onmessage=async(e:MessageEvent<{src:string;x:number;y:number}>)=>{
 try{
  if(!model){self.postMessage({status:'Downloading object selection tools. The first use may take a minute.'});model=await SamModel.from_pretrained('Xenova/slimsam-77-uniform',{device:'wasm',dtype:'q8'}) as SamModel;processor=await AutoProcessor.from_pretrained('Xenova/slimsam-77-uniform') as SamProcessor;}
  self.postMessage({status:'Finding the object edges…'});
  if(lastSource!==e.data.src){image=await RawImage.read(e.data.src);const initial=await processor(image);embeddings=await model.get_image_embeddings(initial);lastSource=e.data.src;}
  const inputs=await processor(image,{input_points:[[[e.data.x*image.width,e.data.y*image.height]]]});
  const outputs=await model({...inputs,...embeddings});
  const masks=await processor.post_process_masks(outputs.pred_masks,inputs.original_sizes,inputs.reshaped_input_sizes);
  const scores=Array.from(outputs.iou_scores.data as Float32Array);const index=scores.indexOf(Math.max(...scores));
  const data=masks[0].data as Uint8Array,w=image.width,h=image.height,offset=index*w*h,runs:number[]=[];
  for(let y=0;y<h;y++){let start=-1;for(let x=0;x<=w;x++){const selected=x<w&&data[offset+y*w+x]>0;if(selected&&start<0)start=x;if(!selected&&start>=0){runs.push(y,start,x-start);start=-1;}}}
  self.postMessage({runs,gridWidth:w,gridHeight:h});
 }catch(error){lastSource='';self.postMessage({error:'Automatic selection could not finish. Check your connection or use Outline an object and the brush tools.',detail:error instanceof Error?error.message:String(error)});}
};
