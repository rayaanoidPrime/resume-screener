import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface CandidateMetricsProps {
  rankings: {
    resumeId: string;
    candidateId: string;
    filePath: string;
    scores: {
      keywordScore: number;
      totalScore: number;
    };
    structuredData: {
      contact_info: {
        name: string | null;
      };
    };
  }[];
}

const CandidateMetrics: React.FC<CandidateMetricsProps> = ({ rankings }) => {
  if (rankings.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No candidates to display metrics for.</p>
      </div>
    );
  }

  // Format scores for display (convert to percentage)
  const formatScore = (score: number) => Math.round(score * 100);

  // Prepare data for bar chart
  const barChartData = rankings.slice(0, 10).map((candidate, index) => ({
    name: candidate.structuredData?.contact_info?.name || `Candidate ${index + 1}`,
    totalScore: formatScore(candidate.scores.totalScore),
    keywordScore: formatScore(candidate.scores.keywordScore),
  }));

  // Prepare data for pie chart - distribution of top candidates by score range
  const scoreRanges = [
    { name: '90-100%', range: [0.9, 1.0], count: 0, color: '#4CAF50' },
    { name: '80-89%', range: [0.8, 0.9], count: 0, color: '#8BC34A' },
    { name: '70-79%', range: [0.7, 0.8], count: 0, color: '#CDDC39' },
    { name: '60-69%', range: [0.6, 0.7], count: 0, color: '#FFEB3B' },
    { name: '50-59%', range: [0.5, 0.6], count: 0, color: '#FFC107' },
    { name: 'Below 50%', range: [0, 0.5], count: 0, color: '#FF5722' },
  ];

  // Count candidates in each score range
  rankings.forEach(candidate => {
    const score = candidate.scores.totalScore;
    const range = scoreRanges.find(
      r => score >= r.range[0] && score < r.range[1]
    );
    if (range) {
      range.count++;
    }
  });

  // Filter out empty ranges
  const pieChartData = scoreRanges.filter(range => range.count > 0);

  // Calculate average scores
  const averageTotal = rankings.reduce((sum, candidate) => sum + candidate.scores.totalScore, 0) / rankings.length;
  const averageKeyword = rankings.reduce((sum, candidate) => sum + candidate.scores.keywordScore, 0) / rankings.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Candidates</h3>
          <p className="text-3xl font-bold text-blue-600">{rankings.length}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Match Score</h3>
          <p className="text-3xl font-bold text-blue-600">{formatScore(averageTotal)}%</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Keyword Score</h3>
          <p className="text-3xl font-bold text-blue-600">{formatScore(averageKeyword)}%</p>
        </div>
      </div>

      {/* Top Candidates Bar Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Candidates by Score</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                domain={[0, 100]}
              />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="totalScore" name="Overall Match" fill="#8884d8" />
              <Bar dataKey="keywordScore" name="Keyword Match" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Distribution Pie Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Score Distribution</h3>
        <div className="h-80 flex items-center justify-center">
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} candidates`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No data available for distribution chart</p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Pool Insights</h3>
        <div className="space-y-4">
          {rankings.length > 0 && (
            <>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Top Candidate</h4>
                <p className="text-blue-700">
                  {rankings[0].structuredData?.contact_info?.name || 'Unnamed Candidate'} is the top match with a {formatScore(rankings[0].scores.totalScore)}% overall match score.
                </p>
              </div>
              
              {formatScore(averageTotal) < 70 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Low Overall Match</h4>
                  <p className="text-yellow-700">
                    The average match score is {formatScore(averageTotal)}%, which is below the recommended 70% threshold. Consider reviewing your job requirements or expanding your candidate search.
                  </p>
                </div>
              )}
              
              {formatScore(averageTotal) >= 70 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Strong Candidate Pool</h4>
                  <p className="text-green-700">
                    Your candidate pool has a strong average match score of {formatScore(averageTotal)}%. You have {pieChartData.find(d => d.name === '90-100%')?.count || 0} candidates with match scores above 90%.
                  </p>
                </div>
              )}
              
              {rankings.length < 5 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Small Candidate Pool</h4>
                  <p className="text-yellow-700">
                    You have only {rankings.length} candidates in your pool. Consider expanding your search to find more qualified candidates.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateMetrics; 