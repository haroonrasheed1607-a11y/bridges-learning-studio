import { useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
export default function Tracks(){
 const {students,groups,activities,versions,attempts,isCloud}=useStudio();
 const [studentId,setStudentId]=useState(''),[group,setGroup]=useState(''),[added,setAdded]=useState([]),[detail,setDetail]=useState(null);
 const roster=students.filter(s=>group===''||s.group===Number(group));
 const student=roster.find(s=>(s.dbId||s.id)===studentId)||roster[0];
 const names=[...new Set([...versions.flatMap(v=>(v.definition?.questions||[]).map(q=>q.concept).filter(Boolean)),...added])];
 const cols=activities.filter(a=>versions.some(v=>v.activity_id===a.id));
 function records(name,activity){return attempts.filter(a=>a.student_id===student?.dbId&&versions.some(v=>v.id===a.version_id&&v.activity_id===activity.id)).map(a=>{
  const version=versions.find(v=>v.id===a.version_id),qs=(version.definition.questions||[]).filter(q=>q.concept===name);
  const answers=(a.answers||[]).filter(answer=>qs.some(q=>q.id===answer.question_id));
  return {...a,version,answers,possible:qs.reduce((n,q)=>n+Number(q.points||1),0),earned:answers.reduce((n,q)=>n+Number(q.points),0)};
 }).filter(a=>a.possible>0).sort((a,b)=>new Date(b.completed_at)-new Date(a.completed_at));}
 return <section><h2>Student Tracks</h2><p>Each row is a skill. Each column is an activity. Results belong to the selected student.</p>
 <div className="score-filters"><label className="field">Group<select value={group} onChange={e=>{setGroup(e.target.value);setDetail(null);}}><option value="">All groups</option>{groups.map((g,i)=><option key={g.id||i} value={i}>{g.name}</option>)}</select></label>
 <label className="field">Student<select value={student?.dbId||student?.id||''} onChange={e=>{setStudentId(e.target.value);setDetail(null);}}>{!roster.length&&<option value="">No students</option>}{roster.map(s=><option key={s.dbId||s.id} value={s.dbId||s.id}>{s.name} ({s.id})</option>)}</select></label></div>
 {!isCloud&&<p className="small">Demo mode. Real track scores appear after recorded assessments are available in your school workspace.</p>}
 <form onSubmit={e=>{e.preventDefault();const f=e.currentTarget,name=new FormData(f).get('track').trim();if(name&&!names.includes(name))setAdded([...added,name]);f.reset();}}><label className="field">Add a track row<input name="track" placeholder="For example, Talking" required maxLength={160}/></label><button>Add track</button></form><p className="small">New rows are session drafts. Existing tracks come from the concept labels on saved activity questions.</p>
 <div style={{overflowX:'auto',marginTop:20}}><table><caption style={{textAlign:'left',paddingBottom:12}}>{student?student.name+' — individual track record':'Individual track record'}</caption><thead><tr><th scope="col">Track / Skill</th>{cols.map(a=><th scope="col" key={a.id}>{a.title}</th>)}</tr></thead><tbody>{names.map(name=><tr key={name}><th scope="row">{name}</th>{cols.map(a=>{const rows=records(name,a),latest=rows[0];const evaluated=versions.some(v=>v.activity_id===a.id&&v.definition?.questions?.some(q=>q.concept===name));return <td key={a.id}>{latest&&latest.answers.length?<button onClick={()=>setDetail({name,activity:a.title,rows})}>{latest.earned} / {latest.possible}</button>:evaluated?'No recorded result':'—'}</td>;})}</tr>)}</tbody></table></div>
 {!names.length&&<p>No tracks yet. Add a row or save an assessment with concept labels.</p>}{!cols.length&&<p>No saved activities yet. Activity columns will appear here when assessments are saved.</p>}
 <p className="small">Cells show the latest recorded attempt for this track. — means the track was not evaluated. Scores are not combined into an overall rating.</p>
 {detail&&<section aria-label="Track attempt history"><h3>{detail.name} · {detail.activity}</h3><button onClick={()=>setDetail(null)}>Close history</button>{detail.rows.map(r=><article key={r.id} style={{marginTop:16}}><p>{new Date(r.completed_at).toLocaleString()} · Version {r.version.version_number} · {r.earned} / {r.possible}</p><ul>{r.answers.map(a=><li key={a.question_id}>{r.version.definition.questions.find(q=>q.id===a.question_id)?.prompt} — Response: {typeof a.response==='string'?a.response:JSON.stringify(a.response)} · {a.correct?'Correct':'Incorrect'}</li>)}</ul></article>)}</section>}
 </section>;
}
