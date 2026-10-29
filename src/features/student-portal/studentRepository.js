import { supabase } from "../../lib/supabaseClient.js";
async function call(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
export const loadStudentWorkspace = token => call("student_workspace", { p_token: token });
export const submitStudentAnswers = (token, assignmentId, attemptId, answers) =>
  call("student_submit", { p_token: token, p_assignment_id: assignmentId, p_attempt_id: attemptId, p_answers: answers });
