import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Vector3, Euler, Object3D, Mesh } from 'three';
import { AppState, ModelInstance, ModelPrototype } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { getPrototypeById } from '@/utils/modelPrototypes';
import { disposeObject } from '@/utils/threeHelpers';
import { getMaterialById, createThreeMaterial } from '@/utils/materialLibrary';

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
  | { type: 'SET_FACE_MATERIAL', payload: { modelId: string, faceIndex: number, materialId: string } }
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
            ? { 
                ...model, 
                parameters: { ...model.parameters, ...action.payload.parameters } 
              } 
            : model
        )
      };
    
    case 'SET_FACE_MATERIAL':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.modelId 
            ? { 
                ...model, 
                faceMaterials: { 
                  ...(model.faceMaterials || {}), 
                  [action.payload.faceIndex]: action.payload.materialId 
                } 
              } 
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
  selectFace: (id: string | null) => void;
  updateModelParameters: (id: string, parameters: Record<string, any>) => void;
  updateModelTransform: (id: string, position?: Vector3, rotation?: Euler, scale?: Vector3) => void;
  setModelVisibility: (id: string, visible: boolean) => void;
  setFaceMaterial: (modelId: string, faceIndex: number, materialId: string) => void;
  deselectModel: () => void;
  updateModel: (id: string, updates: Partial<ModelInstance>) => void;
  models: ModelInstance[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
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
    
    // Create the Three.js object
    const object = prototype.createModel(newModel.parameters);
    if (object) {
      object.userData.id = newModel.id;
      newModel.object = object;
    }
    
    dispatch({ type: 'ADD_MODEL', payload: newModel });
    toast({
      title: "Model added",
      description: `${newModel.name} has been added to the scene.`
    });
  };

  const removeModel = (id: string) => {
    const modelToRemove = state.models.find(m => m.id === id);
    
    if (modelToRemove && modelToRemove.object) {
      // Make sure to remove the object from its parent (the scene)
      if (modelToRemove.object.parent) {
        modelToRemove.object.parent.remove(modelToRemove.object);
      }
      
      // Properly dispose of the resources
      disposeObject(modelToRemove.object);
    }
    
    dispatch({ type: 'REMOVE_MODEL', payload: id });
    toast({
      title: "Model removed",
      description: "The selected model has been removed from the scene."
    });
  };

  const selectModel = (id: string | null) => {
    dispatch({ type: 'SELECT_MODEL', payload: id });
  };

  const selectFace = (id: string | null) => {
    dispatch({ type: 'SELECT_FACE', payload: id });
  };

  const updateModelParameters = (id: string, parameters: Record<string, any>) => {
    const model = state.models.find(m => m.id === id);
    if (!model) return;
    
    dispatch({ type: 'UPDATE_MODEL_PARAMETERS', payload: { id, parameters } });
    
    // Update the 3D object based on new parameters
    const prototype = getPrototypeById(model.prototypeId);
    if (prototype) {
      const updatedParams = { ...model.parameters, ...parameters };
      const newObject = prototype.createModel(updatedParams);
      
      if (newObject) {
        // Transfer properties from the old object to the new one
        newObject.userData.id = id;
        
        // Copy transform from the existing model
        newObject.position.copy(model.position);
        newObject.rotation.copy(model.rotation);
        newObject.scale.copy(model.scale);
        
        // If the old object exists in a scene, replace it
        if (model.object && model.object.parent) {
          const parent = model.object.parent;
          parent.remove(model.object);
          parent.add(newObject);
          
          // Dispose old object resources
          disposeObject(model.object);
        }
        
        // Update the model with the new object
        updateModel(id, {
          parameters: updatedParams,
          object: newObject
        });
      }
    }
  };

  const updateModelTransform = (id: string, position?: Vector3, rotation?: Euler, scale?: Vector3) => {
    dispatch({ type: 'UPDATE_MODEL_TRANSFORM', payload: { id, position, rotation, scale } });
    
    // Also update the actual 3D object
    const model = state.models.find(m => m.id === id);
    if (model && model.object) {
      if (position) model.object.position.copy(position);
      if (rotation) model.object.rotation.copy(rotation);
      if (scale) model.object.scale.copy(scale);
    }
  };

  const setModelVisibility = (id: string, visible: boolean) => {
    dispatch({ type: 'SET_MODEL_VISIBILITY', payload: { id, visible } });
    
    // Also update the object's visibility
    const model = state.models.find(m => m.id === id);
    if (model && model.object) {
      model.object.visible = visible;
    }
  };

  const setFaceMaterial = (modelId: string, faceIndex: number, materialId: string) => {
    dispatch({ 
      type: 'SET_FACE_MATERIAL', 
      payload: { modelId, faceIndex, materialId } 
    });
    
    // Find the model and update its 3D object's material
    const model = state.models.find(m => m.id === modelId);
    if (model && model.object) {
      // Traverse to find mesh with this face
      model.object.traverse((child) => {
        if (child instanceof Mesh) {
          // If the mesh has a material array, update the specific face material
          if (Array.isArray(child.material)) {
            if (faceIndex < child.material.length) {
              const material = getMaterialById(materialId);
              if (material) {
                child.material[faceIndex] = createThreeMaterial(material);
              }
            }
          } 
          // If this is the object with the selected face, update its material
          else if (child.geometry && child.geometry.groups) {
            const groupIndex = child.geometry.groups.findIndex((group, index) => index === faceIndex);
            if (groupIndex !== -1) {
              const material = getMaterialById(materialId);
              if (material) {
                // Convert to material array if not already
                if (!Array.isArray(child.material)) {
                  const originalMaterial = child.material;
                  const materialArray = child.geometry.groups.map(() => originalMaterial.clone());
                  child.material = materialArray;
                }
                
                // Now update the specific face material
                child.material[groupIndex] = createThreeMaterial(material);
              }
            }
          }
        }
      });
    }
    
    toast({
      title: "Material applied",
      description: `New material has been applied to the selected face.`
    });
  };

  const updateModel = (id: string, updates: Partial<ModelInstance>) => {
    dispatch({ type: 'UPDATE_MODEL', payload: { id, updates } });
  };

  const deselectModel = () => {
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  // Ensure model objects match their data state
  useEffect(() => {
    state.models.forEach(model => {
      if (model.object) {
        // Ensure object transforms match model data
        model.object.position.copy(model.position);
        model.object.rotation.copy(model.rotation);
        model.object.scale.copy(model.scale);
        model.object.visible = model.visible;
      }
    });
  }, [state.models]);

  return (
    <ModelContext.Provider 
      value={{ 
        state, 
        dispatch, 
        addModel, 
        removeModel, 
        selectModel,
        selectFace,
        updateModelParameters,
        updateModelTransform,
        setModelVisibility,
        setFaceMaterial,
        deselectModel,
        updateModel,
        models: state.models,
        selectedModelId: state.selectedModelId,
        selectedFaceId: state.selectedFaceId
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
