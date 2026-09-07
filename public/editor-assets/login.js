export {};
const form=document.querySelector('#login'),statusEl=document.querySelector('#status');
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');button.disabled=true;statusEl.textContent='Signing in…';
  try{
    const response=await fetch('/api/editor/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:document.querySelector('#password').value})});
    if(response.status===429)throw new Error('Too many attempts. Wait three minutes before trying again.');
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not sign in.');
    document.querySelector('#password').value='';location.reload();
  }catch(error){statusEl.textContent=error.message;}finally{button.disabled=false;}
});
