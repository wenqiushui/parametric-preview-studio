import React, { useState } from 'react';
import { ModelProvider } from '@/context/ModelContext';
import { Button } from '@/components/ui/button';
import { getAllPrototypes } from '@/utils/modelPrototypes';
import { useModelContext } from '@/context/ModelContext';
import ModelViewer from '@/components/ModelViewer';
import { TransformMode } from '@/types';
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2, MousePointer } from 'lucide-react';

const ModelManager = () => {
  const { addModel } = useModelContext();
  const prototypes = getAllPrototypes();

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-medium mb-4">Add Models</h2>
      <div className="flex flex-wrap gap-2">
        {prototypes.map(prototype => (
          <Button 
            key={prototype.id}
            variant="outline"
            onClick={() => addModel(prototype)}
          >
            {prototype.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

const ModelTreeItem = ({ 
  model, 
  depth = 0,
  onSelect,
  onToggleVisibility,
  onRemove
}) => {
  const { models, selectedModelId } = useModelContext();
  const [expanded, setExpanded] = useState(true);
  const isSelected = model.id === selectedModelId;
  
  // Get all direct children of this model
  const childModels = model.isComposite && model.childrenIds 
    ? models.filter(m => model.childrenIds?.includes(m.id))
    : [];
  
  const hasChildren = childModels.length > 0;
  
  return (
    <div className="w-full">
      <div 
        className={`flex items-center py-1 px-2 rounded ${isSelected ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Expand/Collapse icon for composite models */}
        {hasChildren ? (
          <button 
            className="w-5 h-5 flex items-center justify-center mr-1"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-5 h-5 mr-1"></div>
        )}
        
        {/* Select button */}
        <button
          className={`p-1 ${isSelected ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'} mr-1`}
          onClick={() => onSelect(model.id)}
          title="Select"
        >
          <MousePointer size={16} />
        </button>
        
        {/* Model name */}
        <span 
          className="flex-grow truncate"
          onClick={() => onSelect(model.id)}
        >
          {model.name}
        </span>
        
        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            className={`p-1 ${model.visible ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
            onClick={() => onToggleVisibility(model.id)}
            title={model.visible ? "Hide" : "Show"}
          >
            {model.visible ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          
          <button
            className="p-1 text-gray-500 hover:text-red-500"
            onClick={() => onRemove(model.id)}
            title="Remove"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Render children if expanded */}
      {expanded && hasChildren && (
        <div className="w-full">
          {childModels.map(childModel => (
            <ModelTreeItem
              key={childModel.id}
              model={childModel}
              depth={depth + 1}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ModelDisplayControls = () => {
  const { models, selectModel, removeModel, setModelVisibility } = useModelContext();
  
  // Get only top-level models (not submodels)
  const topLevelModels = models.filter(model => !model.isSubmodel);
  
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-medium mb-4">Scene Models</h2>
      {models.length === 0 ? (
        <p className="text-gray-500">No models in the scene. Add a model to get started.</p>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {topLevelModels.map(model => (
            <ModelTreeItem
              key={model.id}
              model={model}
              onSelect={selectModel}
              onToggleVisibility={setModelVisibility}
              onRemove={removeModel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ModelParameterControls = () => {
  const { state, updateModelParameters } = useModelContext();
  const { selectedModelId, models } = state;
  
  const selectedModel = models.find(model => model.id === selectedModelId);
  const prototype = selectedModel ? getAllPrototypes().find(p => p.id === selectedModel.prototypeId) : null;
  
  if (!selectedModel || !prototype) {
    return (
      <div className="bg-white shadow rounded-lg p-4 mt-4">
        <h2 className="text-lg font-medium mb-4">Parameters</h2>
        <p className="text-gray-500">Select a model to adjust its parameters.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-medium mb-4">Parameters for {selectedModel.name}</h2>
      <div className="space-y-4">
        {prototype.parameters.map(param => (
          <div key={param.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{param.name}</label>
            {param.type === 'number' ? (
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={selectedModel.parameters[param.id]}
                onChange={(e) => {
                  updateModelParameters(selectedModel.id, {
                    [param.id]: parseFloat(e.target.value)
                  });
                }}
                className="w-full"
              />
            ) : param.type === 'select' ? (
              <select
                value={selectedModel.parameters[param.id]}
                onChange={(e) => {
                  updateModelParameters(selectedModel.id, {
                    [param.id]: e.target.value
                  });
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {param.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="text-sm text-gray-500">
              {param.type === 'number' && (
                <span>Value: {selectedModel.parameters[param.id]}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const [transformMode] = useState<TransformMode>({
    mode: 'translate',
    space: 'world'
  });

  return (
    <ModelProvider>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-6">3D Model Viewer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg h-[600px]">
              <ModelViewer transformMode={transformMode} />
            </div>
          </div>
          
          <div className="space-y-4">
            <ModelManager />
            <ModelDisplayControls />
            <ModelParameterControls />
          </div>
        </div>
      </div>
    </ModelProvider>
  );
};

export default Index;
