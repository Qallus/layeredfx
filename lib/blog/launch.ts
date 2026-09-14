import posts from './launch-posts.json';
import type {ContentItem} from '@/ctrlp/lib/admin/types';
export function launchContent():ContentItem[]{
 const origin=(process.env.NEXT_PUBLIC_SITE_URL||'https://layeredfx.com').replace(/\/$/,'');
 const articles=posts as ContentItem[];
 return [...articles,...articles.map((post,index)=>({...post,id:`6ea7bba1-5735-4fa9-8e24-${String(index+1).padStart(12,'0')}`,content_type:'email_template' as const,status:'draft' as const,slug:`email-${post.slug}`,source_id:post.id,title:`Journal: ${post.title}`,subject:post.title,preheader:post.excerpt,published_at:null,content:`<div><p>LAYEREDFX / ${post.categories[0]}</p><h1>${post.title}</h1><img src="${origin}${post.featured_image_url}" alt="${post.title}" width="600"/><p>${post.excerpt}</p>${post.content.replace(/href="\//g,`href="${origin}/`)}<p><a href="${origin}/inspiration/${post.slug}">Read this story online</a></p></div>`}))];
}
