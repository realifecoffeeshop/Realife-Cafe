import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { TutorialStep } from '../../types';
import Modal from '../shared/Modal';

// Sub-component for the form modal
const TutorialStepForm: React.FC<{
  step: Partial<TutorialStep>;
  onClose: () => void;
  onSave: (step: Partial<TutorialStep>) => void;
}> = ({ step, onClose, onSave }) => {
    const [formState, setFormState] = useState(step);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : false;

        setFormState(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={step.id && step.title ? 'Edit Tutorial Step' : 'Add New Step'}>
            <form onSubmit={handleSubmit} className="space-y-4 text-stone-800 dark:text-zinc-200">
                <div>
                    <label className="block mb-1 font-medium">Title</label>
                    <input name="title" value={formState.title} onChange={handleChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Target CSS Selector</label>
                    <input name="target" value={formState.target} onChange={handleChange} required className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" placeholder="e.g., #cart-button or .first-drink-card" />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Content</label>
                    <textarea name="content" value={formState.content} onChange={handleChange} required rows={4} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white" />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Tooltip Position</label>
                    <select name="position" value={formState.position} onChange={handleChange} className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-stone-300 dark:border-zinc-600 dark:text-white">
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <input id="waitForAction" name="waitForAction" type="checkbox" checked={formState.waitForAction} onChange={handleChange} className="h-4 w-4 text-stone-600 border-stone-300 rounded focus:ring-stone-500" />
                    <label htmlFor="waitForAction" className="ml-2 block text-sm text-stone-900 dark:text-zinc-300">Wait for user action before proceeding</label>
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md">Save Step</button>
                </div>
            </form>
        </Modal>
    );
};


const TutorialManagement: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const { addToast } = useToast();

  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [editingStep, setEditingStep] = useState<Partial<TutorialStep> | null>(null);
  const [draggedItem, setDraggedItem] = useState<TutorialStep | null>(null);

  useEffect(() => {
    setSteps(state.tutorialSteps || []);
  }, [state.tutorialSteps]);
  
  const hasChanges = JSON.stringify(steps) !== JSON.stringify(state.tutorialSteps);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_TUTORIAL_STEPS', payload: steps });
    addToast('Tutorial changes published!', 'success');
  };
  
  const handleReset = () => {
    setSteps(state.tutorialSteps);
    addToast('Changes have been discarded.', 'info');
  };

  const handleEdit = (step: TutorialStep) => {
    setEditingStep(step);
  };
  
  const handleAddNew = () => {
    setEditingStep({
      id: `tut-step-${Date.now()}`,
      title: '',
      content: '',
      target: '',
      position: 'bottom',
      waitForAction: false
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tutorial step?')) {
        setSteps(prev => prev.filter(step => step.id !== id));
    }
  };

  const handleSaveStep = (stepToSave: Partial<TutorialStep>) => {
    if (!stepToSave.title?.trim() || !stepToSave.target?.trim() || !stepToSave.content?.trim()) {
      addToast('Title, Target Selector, and Content are required.', 'error');
      return;
    }

    const isEditing = steps.some(s => s.id === stepToSave.id);
    if (isEditing) {
      setSteps(prev => prev.map(s => s.id === stepToSave.id ? stepToSave as TutorialStep : s));
    } else {
      setSteps(prev => [...prev, stepToSave as TutorialStep]);
    }
    setEditingStep(null);
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent<HTMLLIElement>, item: TutorialStep) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const onDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedOverItem = steps[index];
    if (draggedItem.id === draggedOverItem.id) return;
    
    let items = steps.filter(item => item.id !== draggedItem.id);
    items.splice(index, 0, draggedItem);
    setSteps(items);
  };
  
  const onDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white">Tutorial Customisation</h2>
          <p className="text-stone-600 dark:text-zinc-400 mt-1">Drag and drop to reorder steps. Click to edit.</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button onClick={handleAddNew} className="px-4 py-2 bg-stone-600 text-white rounded-md hover:bg-stone-700">Add New Step</button>
          {hasChanges && <button onClick={handleReset} className="px-4 py-2 bg-stone-200 dark:bg-zinc-600 rounded-md">Discard Changes</button>}
          <button onClick={handleSave} disabled={!hasChanges} className="px-4 py-2 bg-[#A58D79] text-white dark:bg-zinc-100 dark:text-zinc-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
            Publish Changes
          </button>
        </div>
      </div>
      
      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li 
            key={step.id}
            draggable
            onDragStart={(e) => onDragStart(e, step)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={`flex items-center justify-between p-4 rounded-lg shadow-sm cursor-grab bg-white dark:bg-zinc-800 ${draggedItem?.id === step.id ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center">
              <div className="text-stone-400 dark:text-zinc-500 mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </div>
              <div>
                <p className="font-bold text-stone-800 dark:text-white">{index + 1}. {step.title}</p>
                <p className="text-sm text-stone-500 dark:text-zinc-400">Target: <code className="bg-stone-100 dark:bg-zinc-700 rounded px-1 text-xs">{step.target}</code></p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleEdit(step)} className="text-stone-700 dark:text-zinc-300 hover:underline">Edit</button>
              <button onClick={() => handleDelete(step.id)} className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editingStep && (
        <TutorialStepForm
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSave={handleSaveStep}
        />
      )}
    </div>
  );
};

export default TutorialManagement;
