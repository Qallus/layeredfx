import {redirect} from 'next/navigation';
import {LoginScreen} from '@/components/operations/login';
import {mode} from '@/lib/operations/server';
export const metadata={title:'Sign in'};
export default function Page(){if(mode()==='demo')redirect('/admin');return <LoginScreen/>;}
