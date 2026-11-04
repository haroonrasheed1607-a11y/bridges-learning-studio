import { useState } from 'react';
import { sampleActivityPrompt } from './sampleActivityPrompt.js';
export default function UploadActivity() {
 const [file,setFile]=useState(null),[error,setError]=useState(''),[preview,setPreview]=useState(false),[reading,setReading]=useState(false),[copyStatus,setCopyStatus]=useState('');
 async function upload(selected){
  setError('');setFile(null);setPreview(false);if(!selected)return;setReading(true);
  try{
   if(!/\.html?$/i.test(selected.name))throw Error('Choose an HTML file (.html).');
   if(selected.size>5*1024*1024)throw Error('Choose a file smaller than 5 MB.');
   const html=await selected.text(),doc=new DOMParser().parseFromString(html,'text/html');
   const blocks=doc.querySelectorAll('script#bridges-activity[type="application/json"]');
   if(blocks.length!==1)throw Error('Include exactly one bridges-activity JSON block. Use the activity creation prompt.');
   const data=JSON.parse(blocks[0].textContent);
   if(data.schemaVersion!=='1.0'||!data.activityId||!data.title||!data.learningObjective||!['assessment','teaching'].includes(data.mode)||!Array.isArray(data.questions))throw Error('Activity details are missing or the format is unsupported.');
   if(data.mode==='assessment'&&!data.questions.length)throw Error('An assessment needs at least one question.');
   const ids=new Set();
   for(const q of data.questions){
    if(!q.id||ids.has(q.id)||!q.prompt||!q.concept||!Number.isFinite(q.points)||q.points<=0)throw Error('Check question IDs, prompts, concepts, and points.');ids.add(q.id);
    if(!['single-choice','multiple-choice','short-text'].includes(q.type))throw Error('Unsupported question type: '+q.type);
    if(q.type==='short-text'){if(!Array.isArray(q.correctAnswer)||!q.correctAnswer.length)throw Error('Text questions need accepted answers.');}
    else {const options=q.options||[], keys=options.map(o=>o.id);if(!keys.length||new Set(keys).size!==keys.length||options.some(o=>!o.id||!o.label))throw Error('Check question options.');const answers=q.type==='single-choice'?[q.correctAnswer]:q.correctAnswer;if(!Array.isArray(answers)||!answers.length||answers.some(a=>!keys.includes(a)))throw Error('An answer references an invalid option.');}
   }
   setFile({name:selected.name,html,data});
  }catch(cause){setError(cause instanceof SyntaxError?'The embedded activity JSON is invalid.':cause.message);}finally{setReading(false);}
 }
 return <section><h2>Upload Activity</h2><p>Upload the self-contained HTML file created with the Bridges activity prompt.</p>
 <details style={{marginBottom:24}}><summary>Need help? Sample activity prompt</summary>
 <p style={{marginTop:12}}>Copy this prompt into your AI chat. Replace the activity brief, download the HTML file, then upload it below.</p>
 <label className="field">Sample prompt<textarea readOnly value={sampleActivityPrompt} rows={15} style={{width:'100%',resize:'vertical'}} /></label>
 <button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(sampleActivityPrompt);setCopyStatus('Prompt copied.');}catch{setCopyStatus('Select the prompt above and copy it manually.');}}}>Copy prompt</button><p role="status">{copyStatus}</p>
 </details>
 <label className="field">Activity HTML file<input type="file" accept=".html,.htm,text/html" disabled={reading} onChange={e=>upload(e.target.files[0])}/></label>
 <p className="small">HTML · Maximum 5 MB · Embedded activity JSON version 1.0</p>
 {reading&&<p role="status">Checking file…</p>}{error&&<p role="alert">{error}</p>}
 {file&&<><p role="status">Format checked: {file.name}</p><h3>{file.data.title}</h3><p>{file.data.learningObjective}</p><p>{file.data.mode==='assessment'?'Assessment':'Teaching'} · {file.data.questions.length} questions</p>
 <div className="actions"><button className="primary" onClick={()=>setPreview(!preview)}>{preview?'Close preview':'Test activity'}</button><button onClick={()=>{setFile(null);setPreview(false);}}>Remove file</button></div>
 {preview&&<><p className="small">Local test only. Responses are not saved. Assignment and result integration will be added next.</p><iframe title="Activity test preview" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={'<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src \'none\'; form-action \'none\';">'+file.html} style={{width:'100%',height:600,border:'1px solid #dce2ed',borderRadius:8}}/></>}
 <p className="small" style={{marginTop:16}}>This screen validates and previews your file. Saving uploaded HTML and assigning it to groups are not connected yet.</p></>}
 </section>;
}
