import { useStudio } from "../../state/StudioContext.jsx";
export default function VersionHistory() {
  const { isCloud, versions, activeActivity, openActivity, busy } = useStudio();
  if (!isCloud) return null;
  const history = versions.filter(
    (version) => version.activity_id === activeActivity.id,
  );
  if (!history.length) return null;
  return (
    <label className="field">
      Saved versions
      <select
        value={activeActivity.versionId || ""}
        disabled={busy}
        onChange={(event) => {
          const version = history.find((v) => v.id === event.target.value);
          openActivity({
            ...version.definition,
            id: version.activity_id,
            type:
              version.definition.mode === "teaching"
                ? "Teaching"
                : "Assessment",
            status: "Saved",
            versionId: version.id,
            versionNumber: version.version_number,
            sourcePath: version.source_path,
          });
        }}
      >
        {history.map((v) => (
          <option key={v.id} value={v.id}>
            Version {v.version_number} ·{" "}
            {new Date(v.created_at).toLocaleString()}
          </option>
        ))}
      </select>
    </label>
  );
}
