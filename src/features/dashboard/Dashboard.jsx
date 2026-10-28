import "./dashboard.css";
import { useStudio } from "../../state/StudioContext.jsx";
export default function Dashboard() {
  const { activities, groups, groupSize, navigate, isCloud } = useStudio();
  const metrics = [
    ["Activities", activities.length],
    ["Student groups", groups.length],
    ["Students", groups.reduce((sum, _, index) => sum + groupSize(index), 0)],
  ];
  return (
    <>
      <h2>Dashboard</h2>
      <p className="small">
        {isCloud
          ? "Your school workspace overview."
          : "Demo overview · Includes sample student group sizes."}
      </p>
      <div className="dashboard-metrics">
        {metrics.map(([label, count]) => (
          <div className="dashboard-metric" key={label}>
            <span>{label}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <h3>Activity overview</h3>
      <table>
        <thead>
          <tr>
            <th>Activity</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>{activity.title}</td>
              <td>{activity.type}</td>
              <td>{activity.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="actions" style={{ marginTop: 24 }}>
        <button onClick={() => navigate("previous")}>View activities</button>
        <button onClick={() => navigate("groups")}>View groups</button>
        <button onClick={() => navigate("scores")}>View scorecards</button>
      </div>
    </>
  );
}
