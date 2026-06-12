import React from 'react';
import { Save, Plus, CheckCircle2 } from 'lucide-react';

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface PublishSidebarProps {
  completionPercentage: number;
  checklist?: ChecklistItem[];
  onDraft: () => void;
  onPublish: () => void;
}

// Color function: yellow < 30%, green 30-80%, blue > 80%
const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return 'bg-yellow-500';
  if (percentage <= 80) return 'bg-green-500';
  return 'bg-blue-500';
};

const PublishSidebar: React.FC<PublishSidebarProps> = ({ completionPercentage, checklist: externalChecklist, onDraft, onPublish }) => {
  // Use external checklist if provided, otherwise fallback to default
  const checklist = externalChecklist || [
    { label: 'Category', completed: completionPercentage >= 20 },
    { label: 'Media', completed: completionPercentage >= 40 },
    { label: 'Product Name', completed: completionPercentage >= 60 },
    { label: 'Price', completed: completionPercentage >= 80 },
    { label: 'Brand', completed: completionPercentage === 100 },
  ];

  const progressColorClass = getProgressColor(completionPercentage);

  return (
    <div className="sticky to p-6 space-y-4">
      {/* Ready to Publish Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Publish</h3>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Completion</span>
            <span className="text-sm font-semibold text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${progressColorClass} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mb-6">
          {checklist.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.completed ? (
                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0" />
              )}
              <span className={`text-sm ${item.completed ? 'text-gray-700' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onDraft}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 font-medium"
          >
            <Save size={18} />
            Draft
          </button>
          <button
            onClick={onPublish}
            disabled={completionPercentage < 80}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishSidebar;
