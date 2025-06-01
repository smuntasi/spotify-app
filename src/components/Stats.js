import React, { useEffect, useState } from "react";

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/stats/all")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-gray-300">Loading stats...</div>;
  if (!stats) return <div className="p-6 text-red-500">Failed to load stats.</div>;

  // Group top song by year
  const topByYear = [];
  const seenYears = new Set();
  for (const row of stats.top_yearly) {
    if (!seenYears.has(row.year)) {
      seenYears.add(row.year);
      topByYear.push(row);
    }
  }

  // Group top song by month (show most recent 6)
  const topMonthlyMap = new Map();
  for (const row of stats.top_monthly) {
    const month = row.month;
    if (!topMonthlyMap.has(month)) {
      topMonthlyMap.set(month, row);
    }
  }

  const sortedTopMonths = Array.from(topMonthlyMap.values())
    .sort((a, b) => (b.month > a.month ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Listening Stats</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Top Songs</h2>
        <ul className="list-disc pl-6">
          {stats.scores?.slice(0, 10).map((s, i) => (
            <li key={i}>{s.track} by {s.artist}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Top Songs by Year</h2>
        <ul className="list-disc pl-6">
          {topByYear.map((s, i) => (
            <li key={i}>
              {s.master_metadata_track_name} ({s.year}) — {s.playCount} plays
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Top Songs by Month</h2>
        <ul className="list-disc pl-6">
          {sortedTopMonths.map((s, i) => (
            <li key={i}>
              {s.master_metadata_track_name} ({s.month}) — {s.playCount} plays
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Most Consistent Songs</h2>
        <ul className="list-disc pl-6">
          {stats.most_consistent?.slice(0, 10).map((s, i) => (
            <li key={i}>
              {s.master_metadata_track_name} — {s.monthsActive} active months
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Top Artists</h2>
        <ul className="list-disc pl-6">
          {stats.top_artists?.slice(0, 10).map((a, i) => (
            <li key={i}>
              {a.master_metadata_album_artist_name} — {parseFloat(a.totalMinutes).toFixed(0)} mins
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Stats;
