import { colorQuestions, colorPalette } from "../../data/demoData.js";
export function activityDefinition(activity, mode) {
  const kind =
    activity.kind || (activity.id === "color-recognition" ? "color" : "text");
  return {
    basedOnVersionId: activity.versionId || null,
    title: activity.title,
    grade: activity.grade || "All learners",
    goal: activity.goal || "",
    prompt: activity.prompt || "",
    answer: activity.answer || "",
    kind,
    mode,
    questions:
      mode === "teaching"
        ? []
        : kind === "color"
          ? colorQuestions.map((q, index) => ({
              id: "color-" + (index + 1),
              prompt: q.word,
              answer: q.word,
              options: q.options,
              concept: "Color recognition",
              points: 1,
            }))
          : [
              {
                id: "question-1",
                prompt: activity.prompt,
                answer: activity.answer,
                concept: activity.goal,
                points: 5,
              },
            ],
  };
}
export function generateActivitySource(definition) {
  const data = JSON.stringify(definition, null, 2).replace(/</g, "\\u003c");
  return `import React, { useState } from 'react';
// Immutable activity source. The trusted player supplies onComplete; grades are calculated by the server.
const activity = ${data};
const palette = ${JSON.stringify(colorPalette)};
export default function Activity({ onComplete = () => {} }) {
 const [step,setStep]=useState(0),[responses,setResponses]=useState({}),[complete,setComplete]=useState(false);
 if(activity.mode==='teaching')return <article><h2>{activity.title}</h2><p>{activity.answer}</p><p>{activity.goal}</p></article>;
 if(complete)return <p>Activity complete.</p>;
 const q=activity.questions[step];
 const selected=responses[q.id];
 function choose(value){setResponses({...responses,[q.id]:value});}
 function next(){if(step===activity.questions.length-1){setComplete(true);onComplete(responses);}else setStep(step+1);}
 return <article><h2>{activity.title}</h2><p>{q.prompt}</p>
 {q.options ? <div>{q.options.map((name,index)=><button key={name} aria-label={'Color option '+(index+1)+': '+name} disabled={selected!==undefined} style={{backgroundColor:palette[name],width:90,height:90}} onClick={()=>choose(name)} />)}</div> : <input aria-label="Your answer" value={selected||''} onChange={event=>choose(event.target.value)}/>}
 <button disabled={selected===undefined} onClick={next}>{step===activity.questions.length-1?'Finish activity':'Next question'}</button></article>;
}
`;
}
