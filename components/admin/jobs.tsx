"use client";
import {JobsListClient} from '@/cmi/app/dashboard/jobs/jobs-list-client';
import {NewJobClient} from '@/cmi/app/dashboard/jobs/new/new-job-client';
import {JobsMapClient} from '@/cmi/app/dashboard/jobs/map/jobs-map-client';
import {computeJobReport} from '@/cmi/lib/jobs/reporting';
import type {JobType} from '@/cmi/lib/jobs/types';
import {SourceScreen} from './source-screen';
const types:JobType[]=['Residential','Commercial'].map((name,index)=>({id:`review-type-${index}`,name,description:null,color:null,sort_order:index,is_active:true}));
export function JobsPage(){return <SourceScreen><JobsListClient initialRows={[]} types={types} groups={[]} report={computeJobReport([],new Date().toISOString().slice(0,10))}/></SourceScreen>;}
export function NewJobPage(){return <SourceScreen><NewJobClient types={types} groups={[]}/></SourceScreen>;}
export function JobsMapPage(){return <SourceScreen><JobsMapClient rows={[]}/></SourceScreen>;}
