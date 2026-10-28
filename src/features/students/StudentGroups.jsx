import { useStudio } from "../../state/StudioContext.jsx";
export default function StudentGroups() {
  const { groups, groupSize, navigate, addGroup, busy, feedback, isCloud } =
    useStudio();
  async function create(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (await addGroup(new FormData(form).get("name").trim())) form.reset();
  }
  return (
    <>
      <h2>Student Groups</h2>
      <p className="small">
        {isCloud
          ? "Manage the groups in your school workspace."
          : "Sample class sizes include students added during this session."}
      </p>
      <form onSubmit={create}>
        <label className="field">
          New group name
          <input
            name="name"
            required
            maxLength={160}
            placeholder="For example, Grade 7 · Section A"
          />
        </label>
        <button className="primary" disabled={busy}>
          Create group
        </button>
      </form>
      <p role="status">{feedback}</p>
      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th>Students</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, index) => (
            <tr key={group.id || group.name}>
              <td>
                <strong>{group.name}</strong>
              </td>
              <td>{groupSize(index)}</td>
              <td>
                <button onClick={() => navigate("students")}>
                  Add students
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
