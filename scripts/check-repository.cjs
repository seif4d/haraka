const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const names=[...new Set(execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))];
const privatePath=/(^|\/)(?:\.data|node_modules|\.next|test-results|playwright-report|blob-report|coverage|\.vercel)(?:\/|$)|(?:\.sqlite(?:3)?(?:-[^/]*)?|\.db(?:-[^/]*)?|\.pem|\.key|\.tsbuildinfo|\.bak|\.backup)$/i;
const credential=/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b|\bAKIA[A-Z0-9]{16}\b)/;
let bytes=0;const problems=[];
for(const name of names){
  if(privatePath.test(name) || /(^|\/)\.env(?:\.|$)/.test(name) && name!=='.env.example'){problems.push(`${name}: local/private file must stay out of Git.`);continue;}
  const file=path.join(root,name);if(!fs.existsSync(file)){problems.push(`${name}: indexed file is missing.`);continue;}
  const stat=fs.statSync(file);if(!stat.isFile()){problems.push(`${name}: unsupported entry.`);continue;}bytes+=stat.size;
  if(stat.size>5*1024*1024)problems.push(`${name}: unexpectedly large source file.`);
  if(/\.(?:[cm]?js|tsx?|json|md|ya?ml|svg|css|txt)$|(^|\/)\.env\.example$/i.test(name) && credential.test(fs.readFileSync(file,'utf8')))problems.push(`${name}: possible credential detected; review before uploading.`);
}
if(!names.length)problems.push('No source files were found.');
if(problems.length){for(const problem of problems)console.error(problem);process.exitCode=1;}else console.log(`PASS: ${names.length} source files (${(bytes/1024/1024).toFixed(2)} MB); local data, generated files and common credential patterns excluded.`);
