"use client";
import {JobsMapClient} from '@/cmi/app/dashboard/jobs/map/jobs-map-client';
import {SourceScreen} from './source-screen';
// Jobs list, detail and stages live in components/operations/jobs.tsx; only the CMI map screen remains here.
export function JobsMapPage(){return <SourceScreen><JobsMapClient rows={[]}/></SourceScreen>;}
