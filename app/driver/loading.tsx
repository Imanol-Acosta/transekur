import { Icon } from "../components/icons";

export default function DriverLoading() {
  return (
    <main className="workspace driver-workspace">
      <div className="page-intro driver-intro">
        <div>
          <span className="eyebrow">Driver</span>
          <h1>Today’s pickups</h1>
        </div>
      </div>
      <div className="empty-state" role="status">
        <Icon name="clock" />
        <p>Loading your pickups…</p>
      </div>
    </main>
  );
}
