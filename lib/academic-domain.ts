export type Publication = "draft" | "published";
export type AcademicKind = "library" | "assignments" | "exams";
export type Attachment = {id:string;name:string;size:number;mime:string};
export type AcademicBase = {id:string;courseId:string;sportId:string;title:string;status:Publication;createdAt:string;updatedAt:string};
export type LibraryItem = AcademicBase & {description:string;kind:"book"|"summary"|"reference"|"worksheet";source:string;url:string;file:Attachment|null};
export type Assignment = AcademicBase & {instructions:string;requester:string;dueAt:string;maxScore:number;file:Attachment|null};
export type Submission = {id:string;assignmentId:string;userId:string;studentName:string;text:string;url:string;file:Attachment|null;submittedAt:string;status:"submitted"|"returned"|"graded";score:number|null;feedback:string;reviewedAt:string|null};
export type AdminSubmission=Submission & {reviewVersion:string};
export type StudentAssignment = Assignment & {submission:Submission|null};
export type Question = {id:string;prompt:string;options:string[];correctIndex:number;explanation:string;points:number};
export type Exam = AcademicBase & {instructions:string;durationMinutes:number;attemptLimit:number;passPercent:number;opensAt:string|null;closesAt:string|null;questions:Question[];attemptCount:number};
export type StudentExam = Omit<Exam,"questions"|"attemptCount"> & {questionCount:number;totalPoints:number;attemptsUsed:number;latestAttemptId:string|null;latestStatus:Attempt["status"]|null};
export type Attempt = {id:string;examId:string;title:string;userId:string;studentName:string;startedAt:string;endsAt:string;submittedAt:string|null;status:"in_progress"|"submitted"|"expired";score:number|null;total:number;percent:number|null;passed:boolean|null;answers:Record<string,number>;questions:({id:string;prompt:string;options:string[];points:number;correctIndex?:number;explanation?:string})[]};
export type StudentLearning = {resources:LibraryItem[];assignments:StudentAssignment[];exams:StudentExam[]};
export type AdminLearning = {resources:LibraryItem[];assignments:Assignment[];submissions:AdminSubmission[];exams:Exam[];attempts:Omit<Attempt,"answers"|"questions">[]};
export const RESOURCE_LABELS = {book:"كتاب",summary:"ملخص",reference:"مرجع",worksheet:"ورقة عمل"};

export function fileSize(size:number){return size<1024*1024?`${Math.max(1,Math.ceil(size/1024))} KB`:`${(size/1024/1024).toFixed(1)} MB`;}
