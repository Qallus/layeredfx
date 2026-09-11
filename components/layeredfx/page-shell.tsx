'use client';
import type {ReactNode} from 'react';
import {Footer} from "./footer";
import {Header} from './header';
import {EstimateProvider} from './estimate-context';
export function PageShell({children}:{children:ReactNode}){return <EstimateProvider><div className="lfx"><Header/><main className="lfx-container lfx-editorial">{children}</main><Footer/></div></EstimateProvider>;}
