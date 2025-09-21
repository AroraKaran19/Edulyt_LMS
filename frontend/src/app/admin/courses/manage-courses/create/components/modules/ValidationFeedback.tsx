import React from "react";

interface ValidationFeedbackProps {
  errors: string[];
}

const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="font-medium mb-2 text-blue-800">
        Please complete the following:
      </div>
      <ul className="list-disc list-inside space-y-1 text-blue-700">
        {errors.map((error, index) => (
          <li key={index} className="text-sm">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationFeedback;
