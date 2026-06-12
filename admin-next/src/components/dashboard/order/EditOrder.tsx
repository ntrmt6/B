import React from 'react';
import { 
  Pencil, 
  Printer, 
  FileText, 
  Copy, 
  ClipboardCheck, 
  Trash2 
} from 'lucide-react';

interface MenuItemProps {
  icon: React.FC<any>;
  label: string;
  color?: string;
  active?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, color = "text-black", active = false }) => {
  return (
    <button 
      className={`flex items-center gap-3 w-full h-12 px-6 transition-colors duration-200 ${
        active ? 'bg-[#f4f4f4]' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-center w-6 h-6">
        <Icon size={18} className={color} strokeWidth={2} />
      </div>
      <span className={`text-base font-semibold font-sans ${color} tracking-tight`}>
        {label}
      </span>
    </button>
  );
};

// Renamed the main component to EditOrder as requested
const EditOrder = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 flex justify-center items-start">
      {/* Dropdown Container */}
      <div className="w-[200px] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden py-2">
        <div className="flex flex-col w-full">
          
          <MenuItem 
            icon={Pencil} 
            label="Edit" 
          />
          
          <MenuItem 
            icon={Printer} 
            label="Print Invoice" 
          />
          
          <MenuItem 
            icon={FileText} 
            label="Details" 
            active={true} 
          />
          
          <MenuItem 
            icon={Copy} 
            label="Duplicate" 
          />
          
          <MenuItem 
            icon={ClipboardCheck} 
            label="Order Status" 
          />
          
          <div className="my-1 border-t border-gray-100" />
          
          <MenuItem 
            icon={Trash2} 
            label="Delete" 
            color="text-[#da0000]" 
          />
          
        </div>
      </div>
    </div>
  );
};

// Default export is mandatory for the App to render in the preview
export default EditOrder;