const {DatabaseSync,backup}=require('node:sqlite');
const {mkdirSync}=require('node:fs');
const {resolve,dirname,join}=require('node:path');
(async()=>{
  const file=resolve(process.env.HARKA_DATABASE_PATH || '.data/harka.sqlite');
  const folder=join(dirname(file),'backups');mkdirSync(folder,{recursive:true});
  const destination=join(folder,`harka-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
  const database=new DatabaseSync(file,{readOnly:true});
  try{await backup(database,destination);console.log(destination);}finally{database.close();}
})().catch(error=>{console.error(`Backup failed: ${error.message}`);process.exitCode=1;});
