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
  | { type: 'ADD_COMPOSITE_MODEL', payload: { parent: ModelInstance, children: ModelInstance[] } }
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

    case 'ADD_COMPOSITE_MODEL': {
      const { parent, children } = action.payload;
      // Add parent with references to children
      const updatedParent = {
        ...parent,
        isComposite: true,
        childrenIds: children.map(child => child.id)
      };
      // Add children with reference to parent
      const updatedChildren = children.map(child => ({
        ...child,
        parentId: parent.id,
        isSubmodel: true
      }));
      
      return {
        ...state,
        models: [...state.models, updatedParent, ...updatedChildren],
        selectedModelId: parent.id
      };
    }
    
    case 'REMOVE_MODEL': {
      const modelToRemove = state.models.find(m => m.id === action.payload);
      if (!modelToRemove) return state;
      
      let modelsToRemove = [action.payload];
      
      // If it's a composite model, also remove all children
      if (modelToRemove.isComposite && modelToRemove.childrenIds) {
        modelsToRemove = [...modelsToRemove, ...modelToRemove.childrenIds];
      }
      
      // If it's a child model, check if we should remove the parent
      if (modelToRemove.parentId) {
        const parent = state.models.find(m => m.id === modelToRemove.parentId);
        if (parent && parent.childrenIds) {
          // Update parent to remove reference to this child
          const updatedChildrenIds = parent.childrenIds.filter(id => id !== action.payload);
          
          // If parent has no children left, remove the parent too
          if (updatedChildrenIds.length === 0) {
            modelsToRemove.push(parent.id);
          } else {
            // Otherwise update the parent's childrenIds
            const updatedModels = state.models.map(model => 
              model.id === parent.id 
                ? { ...model, childrenIds: updatedChildrenIds } 
                : model
            );
            
            return {
              ...state,
              models: updatedModels.filter(model => model.id !== action.payload),
              selectedModelId: state.selectedModelId === action.payload ? null : state.selectedModelId
            };
          }
        }
      }
      
      return {
        ...state,
        models: state.models.filter(model => !modelsToRemove.includes(model.id)),
        selectedModelId: state.selectedModelId && modelsToRemove.includes(state.selectedModelId) 
          ? null 
          : state.selectedModelId
      };
    }
    
    case 'UPDATE_MODEL':
      return {
        ...state,
        models: state.models.map(model => 
          model.id === action.payload.id 
            ? { ...model, ...action.payload.updates } 
            : model
        )
      };
    
    case 'SET_MODEL_VISIBILITY': {
      const modelToUpdate = state.models.find(m => m.id === action.payload.id);
      if (!modelToUpdate) return state;
      
      let modelsToUpdate = [action.payload.id];
      
      // If it's a composite model, also update visibility of all children
      if (modelToUpdate.isComposite && modelToUpdate.childrenIds) {
        modelsToUpdate = [...modelsToUpdate, ...modelToUpdate.childrenIds];
      }
      
      return {
        ...state,
        models: state.models.map(model => 
          modelsToUpdate.includes(model.id)
            ? { ...model, visible: action.payload.visible } 
            : model
        )
      };
    }
    
    case 'SELECT_MODEL': {
      // When selecting a model, make sure to deselect all other models
      const selectedId = action.payload;
      
      return {
        ...state,
        selectedModelId: selectedId,
        selectedFaceId: null,
        models: state.models.map(model => ({
          ...model,
          selected: model.id === selectedId
        }))
      };
    }
    
    case 'SELECT_FACE':
      return {
        ...state,
        selectedFaceId: action.payload
      };
    
    case 'UPDATE_MODEL_TRANSFORM': {
      const { id, position, rotation, scale } = action.payload;
      const modelToUpdate = state.models.find(m => m.id === id);
      if (!modelToUpdate) return state;
      
      // Update parent and all its children, or just the individual model
      const modelsToUpdate = modelToUpdate.isComposite && modelToUpdate.childrenIds
        ? [id, ...modelToUpdate.childrenIds]
        : modelToUpdate.isSubmodel 
          ? [modelToUpdate.parentId as string, ...(state.models.find(m => m.id === modelToUpdate.parentId)?.childrenIds || [])]
          : [id];
      
      // Calculate relative position for children if parent is being moved
      const parentUpdates = {
        position: position || modelToUpdate.position,
        rotation: rotation || modelToUpdate.rotation,
        scale: scale || modelToUpdate.scale
      };
      
      return {
        ...state,
        models: state.models.map(model => {
          if (model.id === id) {
            // Direct update for the selected model
            return { 
              ...model, 
              position: position || model.position,
              rotation: rotation || model.rotation,
              scale: scale || model.scale
            };
          } else if (modelToUpdate.isComposite && modelToUpdate.childrenIds?.includes(model.id)) {
            // For child models, calculate relative transform (for now just copy parent transform)
            return model;
          } else if (modelToUpdate.isSubmodel && model.id === modelToUpdate.parentId) {
            // If child is selected, update parent
            return { 
              ...model, 
              position: position || model.position,
              rotation: rotation || model.rotation,
              scale: scale || model.scale
            };
          }
          return model;
        })
      };
    }
    
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
  addCompositeModel: (prototype: ModelPrototype, name?: string, submodels?: {prototype: ModelPrototype, name: string}[]) => void;
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

  const addCompositeModel = (prototype: ModelPrototype, name?: string, submodels?: {prototype: ModelPrototype, name: string}[]) => {
    // Create the parent model
    const parentModel: ModelInstance = {
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
      object: null,
      isComposite: true,
      childrenIds: []
    };
    
    // Create the Three.js object for parent
    const parentObject = prototype.createModel(parentModel.parameters);
    if (parentObject) {
      parentObject.userData.id = parentModel.id;
      parentModel.object = parentObject;
    }

    // Create child models if provided
    const childModels: ModelInstance[] = [];
    if (submodels && submodels.length > 0) {
      submodels.forEach((submodel, index) => {
        const childId = `${parentModel.id}-child-${index}`;
        const childModel: ModelInstance = {
          id: childId,
          prototypeId: submodel.prototype.id,
          name: submodel.name,
          visible: true,
          selected: false,
          position: new Vector3(0, 0, 0),
          rotation: new Euler(0, 0, 0),
          scale: new Vector3(1, 1, 1),
          parameters: submodel.prototype.parameters.reduce((acc, param) => {
            acc[param.id] = param.default;
            return acc;
          }, {} as Record<string, any>),
          object: null,
          isSubmodel: true,
          parentId: parentModel.id
        };
        
        // Create Three.js object for child
        const childObject = submodel.prototype.createModel(childModel.parameters);
        if (childObject) {
          childObject.userData.id = childModel.id;
          childModel.object = childObject;
          
          // Add child object to parent object
          if (parentModel.object) {
            parentModel.object.add(childObject);
          }
        }
        
        childModels.push(childModel);
      });
    }

    // Dispatch composite model action
    dispatch({ 
      type: 'ADD_COMPOSITE_MODEL', 
      payload: { 
        parent: parentModel, 
        children: childModels
      }
    });
    
    toast({
      title: "Composite model added",
      description: `${parentModel.name} with ${childModels.length} submodels has been added to the scene.`
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
        addCompositeModel,
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
