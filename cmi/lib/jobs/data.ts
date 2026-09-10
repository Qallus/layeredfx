// Adapted from CMI 23320abb158e26f0945c2f1ce2f513f02649aa70: lib/jobs/data.ts
import type { Job } from "./types";
export type JobListRow=Job & {type_name:string|null;type_color:string|null;group_name:string|null;clients:{name:string;phone:string|null}[];project_managers:string[]};