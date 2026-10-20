import "server-only";
import {libraryStatus} from "./library-management";
import type { User } from "../domain";
import { AcademicError, answerExam, deleteAcademic, getAttempt, reviewSubmission, saveAcademic, startExam, studentLearning, submitAssignment } from "./academic";
function id(value:unknown){if(typeof value!=="string" || !value || value.length>100)throw new AcademicError("المعرّف غير صالح.");return value;}
export function academicRequest(path:string,method:string,data:Record<string,unknown>,user:User):Response|null {
  let result:unknown; const kind=path.split("/")[1];
  if(path==="admin/library/status" && method==="PATCH")result=libraryStatus(data,user);
  else if(path.startsWith("admin/") && ["library","assignments","exams"].includes(kind) && path.split("/").length===2){
    if(method==="POST")result={id:saveAcademic(kind as "library"|"assignments"|"exams",data,user)};
    else if(method==="DELETE"){deleteAcademic(kind as "library"|"assignments"|"exams",id(data.id),user,kind!=="exams"?data.expectedUpdatedAt:undefined);result={deleted:true};}else return null;
  }else if(path==="admin/submissions" && method==="PATCH"){reviewSubmission(user,data);result={reviewed:true};}
  else if(path==="student/learning" && method==="GET")result=studentLearning(user);
  else if(path==="student/submissions" && method==="POST")result={submission:submitAssignment(user,data)};
  else if(path==="student/exams/start" && method==="POST")result={attempt:startExam(user,id(data.examId))};
  else if(path==="student/exams/answer" && method==="PATCH")result={attempt:answerExam(user,data,false)};
  else if(path==="student/exams/submit" && method==="POST")result={attempt:answerExam(user,data,true)};
  else if(path.startsWith("student/exam-attempts/") && path.split("/").length===3 && method==="GET")result={attempt:getAttempt(user,id(path.split("/")[2]))};
  else return null;
  return Response.json(result,{headers:{"Cache-Control":"no-store"}});
}
