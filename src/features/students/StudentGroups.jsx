import { useStudio } from "../../state/StudioContext.jsx";
export default function StudentGroups() {
  const { groups, groupSize, navigate } = useStudio();
  return (
    <>
      <h2>Student Groups</h2>
      <p className="small">
        Sample class sizes include students added during this session.
      </p>
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
            <tr key={group.name}>
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
