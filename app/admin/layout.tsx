import type {Metadata} from 'next';
import '@/components/operations/operations.css';
import '@/components/admin/dashboard.css';
import '@/components/operations/contacts.css';
export const metadata:Metadata={title:{default:'LayeredFX Operations',template:'%s · LayeredFX'},robots:{index:false,follow:false},alternates:{canonical:null}};
export default function AdminLayout({children}:{children:React.ReactNode}){return children;}
