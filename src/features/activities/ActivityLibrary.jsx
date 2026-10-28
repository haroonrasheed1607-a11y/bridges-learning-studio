import { useStudio } from "../../state/StudioContext.jsx";
const pageSize = 4;
export default function ActivityLibrary() {
  const {
    activities,
    createActivity,
    openActivity,
    showActivityScores,
    activityPage,
    setActivityPage,
  } = useStudio();
  const pages = Math.max(1, Math.ceil(activities.length / pageSize));
  const page = Math.min(activityPage, pages - 1);
  return (
    <>
      <div className="activity-table">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Type / class</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="4">
                <button
                  type="button"
                  className="add-activity"
                  onClick={createActivity}
                >
                  + Add New Activity
                </button>
              </td>
            </tr>
            {[...activities]
              .reverse()
              .slice(page * pageSize, (page + 1) * pageSize)
              .map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <strong>{activity.title}</strong>
                  </td>
                  <td>
                    {activity.type}
                    <br />
                    <span className="small">{activity.grade}</span>
                  </td>
                  <td>{activity.status}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => openActivity(activity)}>
                        {activity.kind === "color" ||
                        activity.id === "color-recognition"
                          ? "Play demo"
                          : "Open"}
                      </button>
                      {activity.type === "Assessment" && (
                        <button onClick={() => showActivityScores(activity.id)}>
                          Scores
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <nav
        className="activity-pagination"
        aria-label="Activity list pagination"
      >
        <button disabled={page === 0} onClick={() => setActivityPage(page - 1)}>
          Previous
        </button>
        {Array.from({ length: pages }, (_, index) => (
          <button
            key={index}
            aria-label={"Page " + (index + 1)}
            aria-current={index === page ? "page" : undefined}
            aria-pressed={index === page}
            onClick={() => setActivityPage(index)}
          >
            {index + 1}
          </button>
        ))}
        <button
          disabled={page === pages - 1}
          onClick={() => setActivityPage(page + 1)}
        >
          Next
        </button>
      </nav>
    </>
  );
}
