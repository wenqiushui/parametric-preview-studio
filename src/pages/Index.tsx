
import React from 'react';
import { ModelProvider } from '@/context/ModelContext';
import { Button } from '@/components/ui/button';
import { getAllPrototypes } from '@/utils/modelPrototypes';
import { useModelContext } from '@/context/ModelContext';

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
  // This component would handle parameter adjustments for the selected model
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-4">
      <h2 className="text-lg font-medium mb-4">Parameters</h2>
      <p className="text-gray-500">Select a model to adjust its parameters.</p>
    </div>
  );
};

const Index = () => {
  return (
    <ModelProvider>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-6">3D Model Viewer</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg h-[600px]">
              {/* This would be where the ModelViewer component would go */}
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">ModelViewer component will be rendered here</p>
              </div>
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
