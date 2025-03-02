
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { AppState, ModelInstance, ModelPrototype } from '@/types';
import { toast } from '@/components/ui/use-toast';

// Action types
type ActionType = 
  | { type: 'SET_MODE', payload: 'admin' | 'user' }
  | { type: 'ADD_MODEL', payload: ModelInstance }
  | { type: 'REMOVE_MODEL', payload: string }
  | { type: 'UPDATE_MODEL', payload: { id: string, updates: Partial<ModelInstance> } }
  | { type: 'SET_MODEL_VISIBILITY', payload: { id: string, visible: boolean } }
  | { type: 'SELECT_MODEL', payload: string | null }
  | { type: 'SELECT_FACE', payload: string | null }
  | { type: 'UPDATE_MODEL_TRANSFORM', payload: { id: string, position?: Vector3, rotation?: Euler, scale?: Vector3 } }
  | { type: 'UPDATE_MODEL_PARAMETERS', payload: { id: string, parameters: Record<string, any> } }
  | { type: 'CLEAR_SELECTION' };

// Initial state
const initialState: AppState = {
  mode: 'user',
  models: [],
  selectedModelId: null,
  selectedFaceId: null
};

// Reducer
function reducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'ADD_MODEL':
      return {
        ...state,
        models: [...state.models, action.payload],
        selectedModelId: action.payload.id
      };
    
    case 'REMOVE_MODEL':
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload),
        selectedModelId: state.selectedModelId === action.payload ? null : state.selectedModelId
      };
    
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.id 
            ? { ...model, ...action.payload.updates } 
            : model
        )
      };
    
    case 'SET_MODEL_VISIBILITY':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.id 
            ? { ...model, visible: action.payload.visible } 
            : model
        )
      };
    
    case 'SELECT_MODEL':
      return {
        ...state,
        selectedModelId: action.payload,
        selectedFaceId: null,
        models: state.models.map(model => ({
          ...model,
          selected: model.id === action.payload
        }))
      };
    
    case 'SELECT_FACE':
      return {
        ...state,
        selectedFaceId: action.payload
      };
    
    case 'UPDATE_MODEL_TRANSFORM':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.id 
            ? { 
                ...model, 
                position: action.payload.position || model.position,
                rotation: action.payload.rotation || model.rotation,
                scale: action.payload.scale || model.scale
              } 
            : model
        )
      };
    
    case 'UPDATE_MODEL_PARAMETERS':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.id 
            ? { ...model, parameters: { ...model.parameters, ...action.payload.parameters } } 
            : model
        )
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedModelId: null,
        selectedFaceId: null,
        models: state.models.map(model => ({
          ...model,
          selected: false
        }))
      };
    
    default:
      return state;
  }
}

// Context
interface ModelContextType {
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
  addModel: (prototype: ModelPrototype, name?: string) => void;
  removeModel: (id: string) => void;
  selectModel: (id: string | null) => void;
  updateModelParameters: (id: string, parameters: Record<string, any>) => void;
  updateModelTransform: (id: string, position?: Vector3, rotation?: Euler, scale?: Vector3) => void;
  setModelVisibility: (id: string, visible: boolean) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Provider component
export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addModel = (prototype: ModelPrototype, name?: string) => {
    const newModel: ModelInstance = {
      id: `model-${Date.now()}`,
      prototypeId: prototype.id,
      name: name || `${prototype.name} ${state.models.length + 1}`,
      visible: true,
      selected: false,
      position: new Vector3(0, 0, 0),
      rotation: new Euler(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      parameters: prototype.parameters.reduce((acc, param) => {
        acc[param.id] = param.default;
        return acc;
      }, {} as Record<string, any>),
      object: null
    };
    
    dispatch({ type: 'ADD_MODEL', payload: newModel });
    toast({
      title: "Model added",
      description: `${newModel.name} has been added to the scene.`
    });
  };

  const removeModel = (id: string) => {
    dispatch({ type: 'REMOVE_MODEL', payload: id });
    toast({
      title: "Model removed",
      description: "The selected model has been removed from the scene."
    });
  };

  const selectModel = (id: string | null) => {
    dispatch({ type: 'SELECT_MODEL', payload: id });
  };

  const updateModelParameters = (id: string, parameters: Record<string, any>) => {
    dispatch({ type: 'UPDATE_MODEL_PARAMETERS', payload: { id, parameters } });
  };

  const updateModelTransform = (id: string, position?: Vector3, rotation?: Euler, scale?: Vector3) => {
    dispatch({ type: 'UPDATE_MODEL_TRANSFORM', payload: { id, position, rotation, scale } });
  };

  const setModelVisibility = (id: string, visible: boolean) => {
    dispatch({ type: 'SET_MODEL_VISIBILITY', payload: { id, visible } });
  };

  return (
    <ModelContext.Provider 
      value={{ 
        state, 
        dispatch, 
        addModel, 
        removeModel, 
        selectModel,
        updateModelParameters,
        updateModelTransform,
        setModelVisibility
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

// Custom hook to use the model context
export const useModelContext = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
};
