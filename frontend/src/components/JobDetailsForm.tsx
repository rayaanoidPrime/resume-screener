import { useState, FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";

interface JobFormData {
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  minExperience: number;
  maxExperience: number;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequired: string;
  educationPreferred: string;
  responsibilities: string[];
}

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Customer Support",
  "Human Resources",
  "Finance",
  "Operations",
  "Legal",
  "Other",
];

const EDUCATION_LEVELS = [
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Ph.D.",
  "Other",
];

export default function JobDetailsForm() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<JobFormData>({
    jobTitle: "",
    department: DEPARTMENTS[0],
    location: "",
    employmentType: EMPLOYMENT_TYPES[0],
    minExperience: 0,
    maxExperience: 0,
    jobDescription: "",
    requiredSkills: [],
    preferredSkills: [],
    educationRequired: EDUCATION_LEVELS[0],
    educationPreferred: "",
    responsibilities: [""],
  });

  const handleSkillsChange = (
    type: "requiredSkills" | "preferredSkills",
    value: string
  ) => {
    const skills = value.split(",").map((skill) => skill.trim());
    setFormData((prev) => ({
      ...prev,
      [type]: skills,
    }));
  };

  const handleResponsibilitiesChange = (value: string) => {
    const responsibilities = value
      .split("\n")
      .map((resp) => resp.trim())
      .filter((resp) => resp !== "");
    setFormData((prev) => ({
      ...prev,
      responsibilities,
    }));
  };

  const handleExperienceChange = (
    type: "minExperience" | "maxExperience",
    value: string
  ) => {
    const experience = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [type]: isNaN(experience) ? 0 : experience,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Authentication required");
      return;
    }

    setLoading(true);
    try {
      const session = await sessionApi.createSession(formData, token);
      navigate(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Job Title */}
        <div>
          <label
            htmlFor="jobTitle"
            className="block text-sm font-medium text-gray-700"
          >
            Job Title
          </label>
          <input
            type="text"
            id="jobTitle"
            required
            value={formData.jobTitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700"
          >
            Department
          </label>
          <select
            id="department"
            required
            value={formData.department}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, department: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            required
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Employment Type */}
        <div>
          <label
            htmlFor="employmentType"
            className="block text-sm font-medium text-gray-700"
          >
            Employment Type
          </label>
          <select
            id="employmentType"
            required
            value={formData.employmentType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                employmentType: e.target.value,
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label
            htmlFor="minExperience"
            className="block text-sm font-medium text-gray-700"
          >
            Minimum Experience (years)
          </label>
          <input
            type="number"
            id="minExperience"
            required
            value={formData.minExperience}
            onChange={(e) =>
              handleExperienceChange("minExperience", e.target.value)
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="maxExperience"
            className="block text-sm font-medium text-gray-700"
          >
            Maximum Experience (years)
          </label>
          <input
            type="number"
            id="maxExperience"
            required
            value={formData.maxExperience}
            onChange={(e) =>
              handleExperienceChange("maxExperience", e.target.value)
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Required Education */}
        <div>
          <label
            htmlFor="educationRequired"
            className="block text-sm font-medium text-gray-700"
          >
            Required Education
          </label>
          <select
            id="educationRequired"
            required
            value={formData.educationRequired}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                educationRequired: e.target.value,
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Education */}
        <div>
          <label
            htmlFor="educationPreferred"
            className="block text-sm font-medium text-gray-700"
          >
            Preferred Education (Optional)
          </label>
          <select
            id="educationPreferred"
            value={formData.educationPreferred}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                educationPreferred: e.target.value,
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">None</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label
          htmlFor="jobDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Job Description
        </label>
        <textarea
          id="jobDescription"
          required
          rows={4}
          value={formData.jobDescription}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              jobDescription: e.target.value,
            }))
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe the role, its impact, and key objectives related to investment analysis, private equity, and real estate research..."
        />
      </div>

      {/* Required Skills */}
      <div>
        <label
          htmlFor="requiredSkills"
          className="block text-sm font-medium text-gray-700"
        >
          Required Skills (comma-separated)
        </label>
        <input
          type="text"
          id="requiredSkills"
          required
          value={formData.requiredSkills.join(", ")}
          onChange={(e) => handleSkillsChange("requiredSkills", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Financial modeling, market analysis, investment strategies, etc."
        />
      </div>

      {/* Preferred Skills */}
      <div>
        <label
          htmlFor="preferredSkills"
          className="block text-sm font-medium text-gray-700"
        >
          Preferred Skills (comma-separated)
        </label>
        <input
          type="text"
          id="preferredSkills"
          value={formData.preferredSkills.join(", ")}
          onChange={(e) =>
            handleSkillsChange("preferredSkills", e.target.value)
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Portfolio management, due diligence, market research, etc."
        />
      </div>

      {/* Responsibilities */}
      <div>
        <label
          htmlFor="responsibilities"
          className="block text-sm font-medium text-gray-700"
        >
          Key Responsibilities (one per line)
        </label>
        <textarea
          id="responsibilities"
          required
          rows={4}
          value={formData.responsibilities.join("\n")}
          onChange={(e) => handleResponsibilitiesChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Portfolio management, due diligence, market research, etc."
        />
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-on-dark shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Job"}
        </button>
      </div>
    </form>
  );
}
