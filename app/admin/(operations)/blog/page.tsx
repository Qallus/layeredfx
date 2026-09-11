import {AdminBlog} from '@/ctrlp/components/admin/admin-blog';
import {mode} from '@/lib/operations/server';
export default function Page(){return <section className="source-screen"><p className="source-connection-notice">{mode()==='demo'?'Local blog preview: posts are saved on this computer and appear in Inspiration.':'Manage stories published in Inspiration.'}</p><AdminBlog/></section>;}
