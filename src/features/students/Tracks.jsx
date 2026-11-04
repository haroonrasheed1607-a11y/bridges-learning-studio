import { useState } from 'react';
import { useStudio } from '../../state/StudioContext.jsx';
const seed=[{id:'talking',name:'Talking',goal:'Express needs and communicate clearly in everyday situations.',concepts:['Start a conversation','Express a need','Ask a relevant question','Listen and respond','Close politely'],scenarios:['Ordering in a restaurant','Communicating at a family event'],groups:[]}];
export default function Tracks(){
 const {groups}=useStudio();
 const [tracks,setTracks]=useState(seed),[selected,setSelected]=useState('talking'),[notice,setNotice]=useState('');
 const track=tracks.find(t=>t.id===selected);
 function update(patch){setTracks(all=>all.map(t=>t.id===selected?{...t,...patch}:t));setNotice('Draft updated for this session.');}
 function add(event,key){event.preventDefault();const form=event.currentTarget,value=new FormData(form).get('value').trim();if(value){update({[key]:[...track[key],value]});form.reset();}}
 return <section><h2>Tracks &amp; Scenarios</h2><p>A track develops a skill through consistent concepts. Scenarios change where learners practise it.</p><p className="small">Planning preview · Drafts last until the page reloads. Group assignments here are illustrative and do not send activities.</p>
 <div className="actions">{tracks.map(t=><button key={t.id} aria-pressed={t.id===selected} onClick={()=>setSelected(t.id)}>{t.name}</button>)}</div>
 <form onSubmit={e=>{e.preventDefault();const f=e.currentTarget,name=new FormData(f).get('name').trim();if(!name)return;const id=crypto.randomUUID();setTracks([...tracks,{id,name,goal:'',concepts:[],scenarios:[],groups:[]}]);setSelected(id);f.reset();}}><label className="field">New track<input name="name" required maxLength={160} placeholder="For example, Independent shopping"/></label><button>Add track</button></form>
 <div className="line"/><h3>{track.name}</h3><label className="field">Capacity to develop<textarea value={track.goal} onChange={e=>update({goal:e.target.value})}/></label>
 <h3>Core concepts</h3><p className="small">Keep these concepts consistent across scenarios. Add concepts as the track develops.</p><ol>{track.concepts.map((c,i)=><li key={i}>{c}</li>)}</ol>
 <form onSubmit={e=>add(e,'concepts')}><label className="field">New concept<input name="value" required maxLength={300}/></label><button>Add concept</button></form>
 <div className="line"/><h3>Practice scenarios</h3>{track.scenarios.length?<ul>{track.scenarios.map((s,i)=><li key={i}><strong>{s}</strong><p className="small">Practise the track’s core concepts in this setting.</p></li>)}</ul>:<p>Add a setting where learners can use this skill.</p>}
 <form onSubmit={e=>add(e,'scenarios')}><label className="field">New scenario<input name="value" required maxLength={300} placeholder="For example, Asking for directions"/></label><button>Add scenario</button></form>
 <div className="line"/><h3>Groups practising this track</h3>{groups.length?groups.map((g,i)=><label key={g.id||i} style={{display:'block',marginBottom:10}}><input type="checkbox" checked={track.groups.includes(g.id||g.name)} onChange={e=>{const id=g.id||g.name;update({groups:e.target.checked?[...track.groups,id]:track.groups.filter(x=>x!==id)});}}/> {g.name}</label>):<p>Create a student group to plan its tracks here.</p>}
 <p role="status">{notice}</p></section>;
}
