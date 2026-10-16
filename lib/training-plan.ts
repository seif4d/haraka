export type TrainingPlan = {
  title:string; year:number; semester:number; status:string; author:string; edition:string;
  deposit:string; intro:string; prerequisites:string; productionNotes:string; remaining:string;
  units:{order:number;title:string;question:string;sourceUrl:string;lessons:{sourceId:string;position:number;title:string;goal:string;pages:string;needs:string;written:boolean}[]}[];
};
