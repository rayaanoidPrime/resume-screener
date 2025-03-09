import React from 'react';

interface SkillsMatchVisualizerProps {
  requiredSkills: string[];
  preferredSkills: string[];
  candidateSkills: {
    programming_languages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    [key: string]: string[] | undefined;
  };
}

const SkillsMatchVisualizer: React.FC<SkillsMatchVisualizerProps> = ({
  requiredSkills,
  preferredSkills,
  candidateSkills
}) => {
  // Flatten candidate skills into a single array
  const flattenedCandidateSkills = Object.values(candidateSkills)
    .filter((skillArray): skillArray is string[] => skillArray !== undefined)
    .flat()
    .map(skill => skill.toLowerCase());

  // Check which required skills are matched
  const matchedRequiredSkills = requiredSkills.filter(skill => 
    flattenedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(skill.toLowerCase())
    )
  );

  // Check which preferred skills are matched
  const matchedPreferredSkills = preferredSkills.filter(skill => 
    flattenedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(skill.toLowerCase())
    )
  );

  // Calculate match percentages
  const requiredMatchPercentage = requiredSkills.length > 0 
    ? Math.round((matchedRequiredSkills.length / requiredSkills.length) * 100) 
    : 0;
  
  const preferredMatchPercentage = preferredSkills.length > 0 
    ? Math.round((matchedPreferredSkills.length / preferredSkills.length) * 100) 
    : 0;

  // Missing required skills
  const missingRequiredSkills = requiredSkills.filter(skill => 
    !flattenedCandidateSkills.some(candidateSkill => 
      candidateSkill.includes(skill.toLowerCase())
    )
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Match Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">Required Skills</h4>
            <span className="text-sm font-semibold text-gray-700">
              {matchedRequiredSkills.length}/{requiredSkills.length} ({requiredMatchPercentage}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className={`h-2.5 rounded-full ${
                requiredMatchPercentage >= 80 ? 'bg-green-600' : 
                requiredMatchPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} 
              style={{ width: `${requiredMatchPercentage}%` }}
            ></div>
          </div>
          
          <div className="space-y-3">
            {requiredSkills.map((skill, index) => {
              const isMatched = matchedRequiredSkills.includes(skill);
              return (
                <div key={index} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-2 flex-shrink-0 ${isMatched ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm ${isMatched ? 'text-gray-800' : 'text-red-700'}`}>
                    {skill}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Preferred Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-800">Preferred Skills</h4>
            <span className="text-sm font-semibold text-gray-700">
              {matchedPreferredSkills.length}/{preferredSkills.length} ({preferredMatchPercentage}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${preferredMatchPercentage}%` }}
            ></div>
          </div>
          
          <div className="space-y-3">
            {preferredSkills.map((skill, index) => {
              const isMatched = matchedPreferredSkills.includes(skill);
              return (
                <div key={index} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-2 flex-shrink-0 ${isMatched ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm ${isMatched ? 'text-gray-800' : 'text-gray-500'}`}>
                    {skill}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Skill Gap Analysis */}
      {missingRequiredSkills.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-3">Skill Gap Analysis</h4>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              <strong>Missing Required Skills:</strong> This candidate is missing {missingRequiredSkills.length} required skills.
            </p>
            <div className="flex flex-wrap gap-2">
              {missingRequiredSkills.map((skill, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Candidate's Additional Skills */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-800 mb-3">Candidate's Skills</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(candidateSkills).map(([category, skills]) => {
            if (!skills || skills.length === 0) return null;
            
            return (
              <div key={category} className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                  {category.replace('_', ' ')}
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, index) => (
                    <span 
                      key={index}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        requiredSkills.some(req => skill.toLowerCase().includes(req.toLowerCase()))
                          ? 'bg-green-100 text-green-800'
                          : preferredSkills.some(pref => skill.toLowerCase().includes(pref.toLowerCase()))
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillsMatchVisualizer; 