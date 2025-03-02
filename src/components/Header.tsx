
import React from 'react';
import { useModelContext } from '@/context/ModelContext';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Layers, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const { state, dispatch } = useModelContext();
  
  const toggleMode = () => {
    dispatch({ 
      type: 'SET_MODE', 
      payload: state.mode === 'admin' ? 'user' : 'admin' 
    });
  };
  
  return (
    <header className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-2">
          <div className="flex items-center mr-4">
            <Layers className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-medium">
              3D Model Parametric Studio
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-secondary rounded-full px-2 py-1">
            <Button 
              variant={state.mode === 'user' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full px-4 py-1 h-8 transition-all duration-300"
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'user' })}
            >
              User Mode
            </Button>
            <Button 
              variant={state.mode === 'admin' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-full px-4 py-1 h-8 transition-all duration-300"
              onClick={() => dispatch({ type: 'SET_MODE', payload: 'admin' })}
            >
              Admin Mode
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Toggle
            aria-label="Toggle all models visibility"
            className="control-button"
            pressed={state.models.some(model => !model.visible)}
            onPressedChange={() => {
              const allVisible = !state.models.some(model => !model.visible);
              state.models.forEach(model => {
                dispatch({ 
                  type: 'SET_MODEL_VISIBILITY', 
                  payload: { id: model.id, visible: !allVisible } 
                });
              });
            }}
          >
            {state.models.some(model => !model.visible) ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Toggle>
          
          <Toggle
            aria-label="Settings"
            className="control-button"
          >
            <Settings className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </header>
  );
};

export default Header;
