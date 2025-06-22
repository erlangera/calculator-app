import React from 'react';
import { Link } from 'react-router-dom';
import type { Calculator } from '../types';

interface CalculatorCardProps {
  calculator: Calculator;
  onDelete: (id: string) => void;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ calculator, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${calculator.title}"?`)) {
      onDelete(calculator.id);
    }
  };

  return (
    <Link 
      to={`/calculator/${calculator.id}`} 
      className="block p-6 bg-white/10 rounded-xl shadow-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-bold mb-2 text-white">{calculator.title}</h3>
        <div className="flex space-x-2">
          <Link 
            to={`/edit/${calculator.id}`} 
            onClick={(e) => e.stopPropagation()} 
            className="text-gray-300 hover:text-white"
            title="Edit"
          >
            {/* SVG for Edit */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </Link>
          <button 
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-400"
            title="Delete"
          >
            {/* SVG for Delete */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-gray-300 mb-4 h-6 truncate">{calculator.description}</p>
      <div className="bg-black/20 p-3 rounded-md mb-4">
        <code className="text-green-300 font-mono break-all">{calculator.formula}</code>
      </div>
      <p className="text-xs text-gray-400">
        Created: {new Date(calculator.createdAt).toLocaleDateString()}
      </p>
    </Link>
  );
};

export default CalculatorCard; 