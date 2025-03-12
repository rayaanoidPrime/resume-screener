import React from "react";
import { type Resume } from "../services/api";

interface CandidateComparisonProps {
  candidates: {
    resumeId: string;
    candidateId: string;
    name: string;
    scores: {
      keywordScore: number;
      totalScore: number;
    };
    structuredData: Resume["structuredData"];
  }[];
  requiredSkills: string[];
  onClose: () => void;
}

const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  candidates,
  requiredSkills,
  onClose,
}) => {
  if (candidates.length === 0) {
    return null;
  }

  // Calculate skill match percentages
  const getSkillMatchPercentage = (
    candidate: CandidateComparisonProps["candidates"][0]
  ) => {
    const candidateSkills = Object.values(candidate.structuredData.skills)
      .filter((skills): skills is string[] => Array.isArray(skills))
      .flat()
      .map((skill) => skill.toLowerCase());

    const matchedSkills = requiredSkills.filter((skill) =>
      candidateSkills.some(
        (candidateSkill) =>
          candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(candidateSkill.toLowerCase())
      )
    );

    return requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            Candidate Comparison ({candidates.length} selected)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto py-4 space-y-6">
          {/* Skills Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Skills Match
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skills Match
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Missing Skills
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map((candidate, index) => {
                    const candidateSkills = Object.values(
                      candidate.structuredData.skills
                    )
                      .filter((skills): skills is string[] =>
                        Array.isArray(skills)
                      )
                      .flat()
                      .map((skill) => skill.toLowerCase());

                    const matchedSkills = requiredSkills.filter((skill) =>
                      candidateSkills.some((candidateSkill) =>
                        candidateSkill.includes(skill.toLowerCase())
                      )
                    );

                    const missingSkills = requiredSkills.filter(
                      (skill) =>
                        !candidateSkills.some((candidateSkill) =>
                          candidateSkill.includes(skill.toLowerCase())
                        )
                    );

                    return (
                      <tr key={candidate.resumeId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {candidate.structuredData.contact_info.name ||
                            `Candidate ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${getSkillMatchPercentage(
                                    candidate
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm text-gray-700">
                              {getSkillMatchPercentage(candidate)}%
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {matchedSkills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {missingSkills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Education Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Education Comparison
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Degree & Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GPA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map((candidate, index) => (
                    <React.Fragment key={candidate.resumeId}>
                      {(candidate.structuredData.education || []).map(
                        (edu, eduIndex) => (
                          <tr key={`${candidate.resumeId}-${eduIndex}`}>
                            {eduIndex === 0 && (
                              <td
                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                rowSpan={
                                  (candidate.structuredData.education || [])
                                    .length
                                }
                              >
                                {candidate.structuredData.contact_info.name ||
                                  `Candidate ${index + 1}`}
                              </td>
                            )}
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {edu?.degree} in {edu?.field}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {edu?.institution}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {edu?.gpa || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {edu?.dates}
                            </td>
                          </tr>
                        )
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Experience Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Experience Timeline
            </h4>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {candidates.map((candidate, index) => (
                  <div key={candidate.resumeId} className="mb-6 last:mb-0">
                    <div className="flex items-start">
                      <div className="w-48 shrink-0 pt-2">
                        <span className="font-medium text-gray-900">
                          {candidate.structuredData.contact_info.name ||
                            `Candidate ${index + 1}`}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2">
                          {candidate.structuredData.experience.map((exp, i) => (
                            <div
                              key={i}
                              className="flex-shrink-0 w-64 bg-blue-50 rounded-lg p-3 border border-blue-100"
                            >
                              <div className="font-medium text-blue-900">
                                {exp.title}
                              </div>
                              <div className="text-sm text-blue-700 mt-1">
                                {exp.company}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                {exp.dates}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateComparison;
