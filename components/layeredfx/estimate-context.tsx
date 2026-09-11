"use client";
import {createContext,useContext,type ReactNode} from 'react';
import type {Service} from '@/lib/layeredfx/content';
import {Button,type ButtonProps} from './ui/button';
type Context={openEstimate:(service?:Service,finish?:string)=>void};
const EstimateContext=createContext<Context|null>(null);
export function useEstimate(){const value=useContext(EstimateContext);if(!value)throw new Error('Estimate components must be inside EstimateProvider.');return value;}
export function EstimateProvider({children}:{children:ReactNode}){
 function openEstimate(service?:Service,finish?:string){const query=new URLSearchParams();if(service)query.set('service',service);if(finish)query.set('finish',finish);window.location.assign('/studio'+(query.size?'?'+query.toString():''));}
 return <EstimateContext.Provider value={{openEstimate}}>{children}</EstimateContext.Provider>;
}
export function EstimateTrigger({service,children,...props}:ButtonProps&{service?:Service}){const {openEstimate}=useEstimate();return <Button {...props} onClick={()=>openEstimate(service)}>{children}</Button>;}
