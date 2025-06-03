import React, { useEffect, useState } from "react";

const Stats = ({ accessToken }) => {
  const [topGenres, setTopGenres] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [trackSummary, setTrackSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;

      try {
        const [genresRes, artistsRes, summaryRes] = await Promise.all([
          fetch(`http://localhost:8000/stats/top-genres?access_token=${accessToken}`),
          fetch(`http://localhost:8000/stats/top-artists?access_token=${accessToken}`),
          fetch(`http://localhost:8000/stats/track-summary?access_token=${accessToken}`)
        ]);

        const genresData = await genresRes.json();
        const artistsData = await artistsRes.json();
        const summaryData = await summaryRes.json();

        setTopGenres(genresData.top_genres || []);
        setTopArtists(artistsData.top_artists || []);
        setTrackSummary(summaryData || {});
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [accessToken]);

  if (loading) return <p>Loading stats...</p>;

  return (
    <div style={{ padding: "1rem" }}>
      <h2>User Listening Stats</h2>

      <section>
        <h3>🎵 Top Genres</h3>
        <ul>
          {topGenres.map(([genre, count], idx) => (
            <li key={idx}>{genre} ({count})</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>🎤 Top Artists</h3>
        <ul>
          {topArtists.map(([artist, count], idx) => (
            <li key={idx}>{artist} ({count})</li>
          ))}
        </ul>
      </section>

      <section>
        <h3>📊 Track Summary</h3>
        <p>Average popularity: {trackSummary.average_popularity}</p>
        <p>Total unique tracks: {trackSummary.total_unique_tracks}</p>
        <p>Genre diversity score: {trackSummary.genre_diversity}</p>

        <h4>Release Year Distribution:</h4>
        <ul>
          {trackSummary.release_year_distribution &&
            Object.entries(trackSummary.release_year_distribution).map(
              ([year, count]) => (
                <li key={year}>{year}: {count}</li>
              )
            )}
        </ul>
      </section>
    </div>
  );
};

export default Stats;
