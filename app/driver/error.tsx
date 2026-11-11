"use client";

import { Icon } from "../components/icons";

export default function DriverError({ retry }: { retry: () => void }) {
  return (
    <main className="workspace driver-workspace">
      <div className="page-intro driver-intro">
        <div>
          <span className="eyebrow">Driver</span>
          <h1>Today’s pickups</h1>
        </div>
      </div>
      <section className="empty-state" aria-labelledby="driver-error-title">
        <Icon name="list" />
        <h2 id="driver-error-title">Couldn’t load your pickups</h2>
        <p role="alert">Check your connection and try again.</p>
        <button className="button primary" type="button" onClick={retry}>Try again</button>
      </section>
    </main>
  );
}
