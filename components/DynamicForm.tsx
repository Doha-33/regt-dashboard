
import React, { useState, useEffect } from 'react';
import { FieldDef } from '../types';
import { X } from 'lucide-react';

interface DynamicFormProps {
  fields: FieldDef[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  title: string;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ fields, initialData, onSubmit, onCancel, title }) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Initialize with empty strings
      const initial: any = {};
      fields.forEach(f => initial[f.name] = '');
      setFormData(initial);
    }
  }, [initialData, fields]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    let isValid = true;

    fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }
      if (field.type === 'email' && formData[field.name] && !/\S+@\S+\.\S+/.test(formData[field.name])) {
        newErrors[field.name] = 'Invalid email format';
        isValid = false;
      }
    });

    if (isValid) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 border border-gray-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-t-xl">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className={`flex flex-col gap-1.5 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <div className="relative">
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-white ${
                          errors[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-primary'
                        }`}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((opt) => {
                           const label = typeof opt === 'object' ? opt.label : opt;
                           const value = typeof opt === 'object' ? opt.value : opt;
                           return <option key={String(value)} value={String(value)}>{label}</option>
                        })}
                      </select>
                  </div>
                ) : field.type === 'textarea' ? (
                   <textarea
                    rows={3}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-white resize-none ${
                      errors[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-primary'
                    }`}
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={`w-full p-2.5 bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all text-gray-900 dark:text-white ${
                      errors[field.name] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600 focus:border-primary'
                    }`}
                  />
                )}
                
                {errors[field.name] && (
                  <span className="text-xs text-red-500 mt-0.5">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors"
            >
              {initialData ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicForm;
