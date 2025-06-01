import React, { useEffect, useState } from "react";

const Recommendations = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/stats/all")
      .then(res => res.json())
      .then(data => {
        if (data.scores) {
          const sorted = [...data.scores].sort(
            (a, b) => parseFloat(b.normalized_score) - parseFloat(a.normalized_score)
          );
          setScores(sorted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading scores:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6 text-gray-300">Loading recommendations...</div>;

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Song Scores</h1>
      <p className="mb-4 text-gray-300">Based on listening behavior, genre, and recentness.</p>
      <table className="w-full text-sm bg-white text-black rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">Track</th>
            <th className="py-2 px-3">Artist</th>
            <th className="py-2 px-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {scores.slice(0, 15).map((s, i) => (
            <tr key={i} className="border-t border-gray-300 hover:bg-gray-100">
              <td className="py-2 px-3">{i + 1}</td>
              <td className="py-2 px-3">{s.track}</td>
              <td className="py-2 px-3">{s.artist}</td>
              <td className="py-2 px-3">{parseFloat(s.normalized_score).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommendations;
