const port=process.env.PORT || '3000';
fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(4000)}).then(async response=>{
  if(!response.ok || (await response.json()).status!=='ok')throw new Error('Application is not ready.');
}).catch(error=>{console.error(error.message);process.exitCode=1;});
