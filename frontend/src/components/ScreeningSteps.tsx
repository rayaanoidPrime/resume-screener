import React from 'react';

interface ScreeningStepsProps {
  currentStep: number;
  totalResumes: number;
  processedResumes: number;
  evaluatedResumes: number;
  onStepClick: (step: number) => void;
}

const ScreeningSteps: React.FC<ScreeningStepsProps> = ({
  currentStep,
  totalResumes,
  processedResumes,
  evaluatedResumes,
  onStepClick
}) => {
  const steps = [
    {
      id: 1,
      name: 'Upload Resumes',
      description: 'Upload candidate resumes in PDF or DOCX format',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      status: totalResumes > 0 ? 'complete' : 'current',
      progress: totalResumes > 0 ? 100 : 0
    },
    {
      id: 2,
      name: 'Process Resumes',
      description: 'Extract and review text from uploaded resumes',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      status: totalResumes === 0 ? 'upcoming' : processedResumes === totalResumes ? 'complete' : 'current',
      progress: totalResumes === 0 ? 0 : Math.round((processedResumes / totalResumes) * 100)
    },
    {
      id: 3,
      name: 'Evaluate Candidates',
      description: 'Score and rank candidates based on job requirements',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      status: processedResumes === 0 ? 'upcoming' : evaluatedResumes === processedResumes ? 'complete' : 'current',
      progress: processedResumes === 0 ? 0 : Math.round((evaluatedResumes / processedResumes) * 100)
    },
    {
      id: 4,
      name: 'Compare & Analyze',
      description: 'Compare top candidates and analyze their qualifications',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      status: evaluatedResumes === 0 ? 'upcoming' : currentStep === 4 ? 'current' : currentStep > 4 ? 'complete' : 'upcoming',
      progress: evaluatedResumes === 0 ? 0 : currentStep === 4 ? 50 : currentStep > 4 ? 100 : 0
    },
    {
      id: 5,
      name: 'Shortlist & Export',
      description: 'Create a shortlist of top candidates and export results',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      ),
      status: currentStep === 5 ? 'current' : currentStep > 5 ? 'complete' : 'upcoming',
      progress: currentStep === 5 ? 50 : currentStep > 5 ? 100 : 0
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Resume Screening Process</h3>
      
      <div className="space-y-8">
        {steps.map((step) => (
          <div key={step.id} className="relative">
            {step.id !== steps.length && (
              <div 
                className="absolute top-6 left-6 ml-px h-full w-0.5 bg-gray-200"
                aria-hidden="true"
              />
            )}
            
            <div className="relative flex items-start group">
              <span 
                className="flex h-12 w-12 items-center justify-center rounded-full"
                onClick={() => {
                  if (step.status !== 'upcoming') {
                    onStepClick(step.id);
                  }
                }}
              >
                <span 
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    step.status === 'complete' ? 'bg-green-100' : 
                    step.status === 'current' ? 'bg-blue-100' : 'bg-gray-100'
                  } ${step.status !== 'upcoming' ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
                >
                  <span 
                    className={`${
                      step.status === 'complete' ? 'text-green-600' : 
                      step.status === 'current' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </span>
                </span>
              </span>
              
              <div className="ml-4 min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 
                    className={`text-sm font-medium ${
                      step.status === 'complete' ? 'text-green-800' : 
                      step.status === 'current' ? 'text-blue-800' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </h4>
                  
                  {step.status !== 'upcoming' && (
                    <span 
                      className={`text-xs font-medium ${
                        step.status === 'complete' ? 'text-green-700' : 'text-blue-700'
                      }`}
                    >
                      {step.progress}%
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">{step.description}</p>
                
                {step.status !== 'upcoming' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        step.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                      }`} 
                      style={{ width: `${step.progress}%` }}
                    ></div>
                  </div>
                )}
                
                {step.id === 1 && step.status === 'current' && (
                  <div className="mt-3">
                    <span className="text-xs text-blue-600">
                      Start by uploading candidate resumes
                    </span>
                  </div>
                )}
                
                {step.id === 2 && step.status === 'current' && (
                  <div className="mt-3">
                    <span className="text-xs text-blue-600">
                      {processedResumes} of {totalResumes} resumes processed
                    </span>
                  </div>
                )}
                
                {step.id === 3 && step.status === 'current' && (
                  <div className="mt-3">
                    <span className="text-xs text-blue-600">
                      {evaluatedResumes} of {processedResumes} resumes evaluated
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScreeningSteps; 