"use client";
import type {ReactNode} from 'react';
export function SourceScreen({children}:{children:ReactNode}){
 return <section className="source-screen"><div className="source-connection-notice" role="status">Local screen review · Database writes, uploads and external services are awaiting LayeredFX integration. No messages or payments will be sent.</div>{children}</section>;
}
