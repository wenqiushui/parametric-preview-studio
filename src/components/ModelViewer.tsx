
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { useModelContext } from '@/context/ModelContext';
import { getPrototypeById } from '@/utils/modelPrototypes';
import { 
  setupScene, 
  pickObject, 
  highlightObject, 
  clearHighlights,
  getTransformFromObject,
  findObjectById
} from '@/utils/threeHelpers';
import { TransformMode } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  MoveHorizontal, 
  RotateCcw, 
  Maximize, 
  Minimize,
  AlignHorizontalJustifyCenter as XIcon, 
  AlignVerticalJustifyCenter as YIcon, 
  Box as ZIcon,
  Boxes as CubeIcon 
} from 'lucide-react';

const ModelViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  
  const [transformMode, setTransformMode] = useState<TransformMode>({
    mode: 'translate',
    space: 'world',
    axis: 'xyz'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  const { state, dispatch, updateModelTransform } = useModelContext();
  
  // Initialize the scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    
    // Setup the scene
    const { 
      scene, 
      camera, 
      renderer, 
      controls, 
      transformControls, 
      animate 
    } = setupScene(containerRef.current);
    
    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    transformControlsRef.current = transformControls;
    
    // Create a group to hold all the models
    const modelGroup = new THREE.Group();
    modelGroup.name = 'Models';
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;
    
    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    ground.name = 'Ground';
    scene.add(ground);
    
    // Set transform controls to selected object when it changes
    transformControls.addEventListener('objectChange', () => {
      if (!transformControls.object) return;
      
      const object = transformControls.object;
      if (!object.userData.id) return;
      
      const transform = getTransformFromObject(object);
      updateModelTransform(
        object.userData.id,
        transform.position,
        transform.rotation,
        transform.scale
      );
    });
    
    // Start animation loop
    animate();
    
    setIsLoading(false);
    
    // Cleanup on unmount
    return () => {
      // Stop animation loop
      cancelAnimationFrame(0);
      
      // Dispose of all objects
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      // Remove event listeners
      transformControls.removeFromParent();
      transformControls.dispose();
      
      // Dispose of renderer
      renderer.dispose();
      
      // Remove canvas
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  // Update object selection when selected model changes
  useEffect(() => {
    if (!sceneRef.current || !transformControlsRef.current) return;
    
    // Clear all highlights
    clearHighlights(sceneRef.current);
    
    // If there's a selected model, highlight it and attach transform controls
    if (state.selectedModelId) {
      const selectedObject = findObjectById(sceneRef.current, state.selectedModelId);
      
      if (selectedObject) {
        highlightObject(selectedObject);
        transformControlsRef.current.attach(selectedObject);
      } else {
        transformControlsRef.current.detach();
      }
    } else {
      transformControlsRef.current.detach();
    }
  }, [state.selectedModelId]);
  
  // Update transform controls mode
  useEffect(() => {
    if (!transformControlsRef.current) return;
    
    transformControlsRef.current.setMode(transformMode.mode);
    transformControlsRef.current.setSpace(transformMode.space);
    
    // Set axis constraints
    transformControlsRef.current.showX = transformMode.axis.includes('x');
    transformControlsRef.current.showY = transformMode.axis.includes('y');
    transformControlsRef.current.showZ = transformMode.axis.includes('z');
  }, [transformMode]);
  
  // Update model visibility
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;
    
    state.models.forEach(model => {
      const object = findObjectById(sceneRef.current!, model.id);
      if (object) {
        object.visible = model.visible;
      }
    });
  }, [state.models]);
  
  // Load or update models when they change
  useEffect(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;
    
    const loadModels = async () => {
      setIsLoading(true);
      
      // Process each model
      for (const model of state.models) {
        // Check if the model already exists in the scene
        let object = findObjectById(sceneRef.current!, model.id);
        
        // If the model doesn't exist, create it
        if (!object) {
          const prototype = getPrototypeById(model.prototypeId);
          if (!prototype) continue;
          
          const newObject = await prototype.createModel(model.parameters);
          newObject.userData.id = model.id;
          newObject.name = model.name;
          newObject.position.copy(model.position);
          newObject.rotation.copy(model.rotation);
          newObject.scale.copy(model.scale);
          newObject.visible = model.visible;
          
          modelGroupRef.current!.add(newObject);
        }
        // If the model exists but needs updating
        else if (model.object !== object) {
          const prototype = getPrototypeById(model.prototypeId);
          if (!prototype || !prototype.updateModel) continue;
          
          await prototype.updateModel(object, model.parameters);
          object.position.copy(model.position);
          object.rotation.copy(model.rotation);
          object.scale.copy(model.scale);
          object.visible = model.visible;
        }
      }
      
      // Remove models that no longer exist in the state
      const objectsToRemove: THREE.Object3D[] = [];
      modelGroupRef.current!.traverse((object) => {
        if (object.userData.id && !state.models.find(m => m.id === object.userData.id)) {
          objectsToRemove.push(object);
        }
      });
      
      objectsToRemove.forEach(object => {
        object.removeFromParent();
      });
      
      setIsLoading(false);
    };
    
    loadModels();
  }, [state.models]);
  
  // Handle mouse selection
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!sceneRef.current || !cameraRef.current || !containerRef.current) return;
    
    // Skip if transform controls are active
    if (transformControlsRef.current?.dragging) return;
    
    const result = pickObject(
      event.nativeEvent, 
      containerRef.current, 
      cameraRef.current, 
      sceneRef.current
    );
    
    if (result) {
      // Skip if ground or model group was picked
      if (result.object.name === 'Ground' || result.object.name === 'Models') {
        dispatch({ type: 'CLEAR_SELECTION' });
        return;
      }
      
      // Find the model or parent with an ID
      let current: THREE.Object3D | null = result.object;
      while (current && !current.userData.id) {
        current = current.parent;
      }
      
      if (current && current.userData.id) {
        // If a model was clicked, select it
        dispatch({ type: 'SELECT_MODEL', payload: current.userData.id });
        
        // If a face was clicked, select it
        if (result.isFace) {
          const faceId = `${current.userData.id}_face_${result.face}`;
          dispatch({ type: 'SELECT_FACE', payload: faceId });
        }
      } else {
        // If nothing was clicked, clear selection
        dispatch({ type: 'CLEAR_SELECTION' });
      }
    } else {
      // If nothing was clicked, clear selection
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };
  
  // Toggle transform mode between translate, rotate, and scale
  const toggleTransformMode = (mode: 'translate' | 'rotate' | 'scale') => {
    setTransformMode(prev => ({
      ...prev,
      mode
    }));
  };
  
  // Toggle transform space between world and local
  const toggleTransformSpace = () => {
    setTransformMode(prev => ({
      ...prev,
      space: prev.space === 'world' ? 'local' : 'world'
    }));
  };
  
  // Set transform axis
  const setTransformAxis = (axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz') => {
    setTransformMode(prev => ({
      ...prev,
      axis
    }));
  };
  
  return (
    <div className="relative flex-1 min-h-[500px] overflow-hidden rounded-lg border">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="animate-pulse-subtle">
            <CubeIcon className="h-10 w-10 text-primary animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Loading models...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="model-viewer-container"
        onMouseDown={handleMouseDown}
      />
      
      {/* Transform controls */}
      {state.selectedModelId && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full p-1 shadow-md border space-x-1">
          <div className="flex items-center rounded-full bg-secondary/50 p-1">
            <Button
              size="icon"
              variant={transformMode.mode === 'translate' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full"
              onClick={() => toggleTransformMode('translate')}
              title="Translate (Move)"
            >
              <MoveHorizontal className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={transformMode.mode === 'rotate' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full"
              onClick={() => toggleTransformMode('rotate')}
              title="Rotate"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={transformMode.mode === 'scale' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full"
              onClick={() => toggleTransformMode('scale')}
              title="Scale"
            >
              {transformMode.mode === 'scale' ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center rounded-full bg-secondary/50 p-1">
            <Button
              size="icon"
              variant={transformMode.axis === 'x' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full text-red-500"
              onClick={() => setTransformAxis('x')}
              title="X Axis"
            >
              <XIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={transformMode.axis === 'y' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full text-green-500"
              onClick={() => setTransformAxis('y')}
              title="Y Axis"
            >
              <YIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={transformMode.axis === 'z' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full text-blue-500"
              onClick={() => setTransformAxis('z')}
              title="Z Axis"
            >
              <ZIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant={transformMode.axis === 'xyz' ? 'default' : 'ghost'}
              className="h-8 w-8 rounded-full"
              onClick={() => setTransformAxis('xyz')}
              title="All Axes"
            >
              <CubeIcon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center rounded-full bg-secondary/50 p-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 rounded-full text-xs"
              onClick={toggleTransformSpace}
              title="Toggle Space"
            >
              {transformMode.space === 'world' ? 'World' : 'Local'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelViewer;
