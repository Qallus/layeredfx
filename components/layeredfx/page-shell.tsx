'use client';
import type {ReactNode} from 'react';
import {Header} from './header';
import {EstimateProvider} from './estimate-context';
export function PageShell({children}:{children:ReactNode}){return <EstimateProvider><div className="lfx"><Header/><main className="lfx-container lfx-editorial">{children}</main><footer className="lfx-container lfx-page-footer"><span>LayeredFX · A new layer of possibility.</span><a href="/contact">Contact</a><a href="/book">Book a Consultation</a></footer></div></EstimateProvider>;}
