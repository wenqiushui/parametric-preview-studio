
import React, { useState } from 'react';
import { ModelProvider } from '@/context/ModelContext';
import { Button } from '@/components/ui/button';
import { getAllPrototypes } from '@/utils/modelPrototypes';
import { useModelContext } from '@/context/ModelContext';
import ModelViewer from '@/components/ModelViewer';
import { TransformMode } from '@/types';

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

const ModelDisplayControls = () => {
  const { state, removeModel, setModelVisibility } = useModelContext();
  
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-medium mb-4">Scene Models</h2>
      {state.models.length === 0 ? (
        <p className="text-gray-500">No models in the scene. Add a model to get started.</p>
      ) : (
        <div className="space-y-2">
          {state.models.map(model => (
            <div 
              key={model.id} 
              className={`p-2 border rounded flex justify-between items-center ${model.selected ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <span>{model.name}</span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModelVisibility(model.id, !model.visible)}
                >
                  {model.visible ? 'Hide' : 'Show'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeModel(model.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
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
