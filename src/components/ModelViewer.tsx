import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { setupScene, pickObject, getTransformFromObject, highlightObject, clearHighlights, findObjectById, disposeObject } from '@/utils/threeHelpers';
import { useModelContext } from '@/context/ModelContext';
import { ModelInstance } from '@/types';
import { TransformMode } from '@/types';
import { Vector3, Euler } from 'three';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface ModelViewerProps {
  transformMode: TransformMode;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ transformMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneData, setSceneData] = useState<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    controls: any | null;
    transformControls: any | null;
    animate: (() => void) | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    transformControls: null,
    animate: null
  });
  const { models, updateModel, selectedModelId, selectedFaceId, selectModel, deselectModel } = useModelContext();
  const [localTransform, setLocalTransform] = useState({
    position: new Vector3(),
    rotation: new Euler(),
    scale: new Vector3(1, 1, 1)
  });
  const [date, setDate] = useState<Date | undefined>(new Date())

  // Initialize scene
  useEffect(() => {
    if (containerRef.current) {
      const { scene, camera, renderer, controls, transformControls, animate } = setupScene(containerRef.current);
      setSceneData({ scene, camera, renderer, controls, transformControls, animate });
      animate();

      // Initial model load
      models.forEach(model => {
        if (model.object) {
          scene.add(model.object);
        }
      });

      // Transform controls setup
      transformControls.addEventListener('objectChange', () => {
        if (transformControls.object) {
          const newTransform = getTransformFromObject(transformControls.object);
          updateModel(transformControls.object.userData.id, newTransform);
          
          // Update local transform state
          setSceneData(prev => ({
            ...prev,
            scene: sceneData.scene
          }));
          setLocalTransform(newTransform);
        }
      });

      return () => {
        // Dispose of all objects in the scene
        scene.traverse((object) => {
          disposeObject(object);
        });

        // Remove transform controls from the scene
        scene.remove(transformControls as unknown as THREE.Object3D);

        // Dispose of the renderer, scene, and other Three.js objects
        renderer.dispose();
        scene.dispose();

        // Remove event listeners
        window.removeEventListener('resize', renderer.handleResize);

        // Optionally, clear the container
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }
  }, []);

  // Update scene with models from context
  useEffect(() => {
    if (sceneData.scene) {
      // Clear existing models
      sceneData.scene.children = sceneData.scene.children.filter(child => !(child as THREE.Mesh).geometry);

      // Add models from context
      models.forEach(model => {
        if (model.object) {
          sceneData.scene.add(model.object);
        }
      });
    }
  }, [models, sceneData.scene]);

  // Update transform mode
  useEffect(() => {
    if (sceneData.transformControls) {
      sceneData.transformControls.mode = transformMode.mode;
      sceneData.transformControls.space = transformMode.space;
    }
  }, [transformMode, sceneData.transformControls]);

  // Update selected object
  useEffect(() => {
    if (!sceneData.scene || !sceneData.transformControls) return;
    
    // Clear previous highlights
    clearHighlights(sceneData.scene);
    
    if (selectedModelId) {
      const selectedObject = findObjectById(sceneData.scene, selectedModelId);
      
      if (selectedObject) {
        // Detach any existing object
        if (sceneData.transformControls.object) {
          sceneData.transformControls.detach();
        }
        
        // Attach the new object
        sceneData.transformControls.attach(selectedObject);
        
        // Highlight the selected object
        highlightObject(selectedObject, selectedFaceId);
        
        // Update local transform state
        setLocalTransform(getTransformFromObject(selectedObject));
      }
    } else {
      // Detach if no model is selected
      if (sceneData.transformControls.object) {
        sceneData.transformControls.detach();
      }
    }
  }, [selectedModelId, selectedFaceId, sceneData, models]);

  // Handle object picking
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current || !sceneData.camera || !sceneData.scene) return;

    const pickResult = pickObject(
      event.nativeEvent as MouseEvent,
      containerRef.current,
      sceneData.camera,
      sceneData.scene
    );

    if (pickResult) {
      const pickedObject = pickResult.object;
      const modelId = pickedObject.userData.id;
      const faceIndex = pickResult.face;

      if (modelId) {
        selectModel(modelId, faceIndex);
      } else {
        deselectModel();
      }
    } else {
      deselectModel();
    }
  }, [sceneData, selectModel, deselectModel]);

  // Detach transform controls on unmount
  useEffect(() => {
    return () => {
      if (sceneData.transformControls && sceneData.scene) {
        if (sceneData.transformControls.object) {
          sceneData.transformControls.detach();
        }
        sceneData.scene.remove(sceneData.transformControls as unknown as THREE.Object3D);
      }
    };
  }, [sceneData.transformControls, sceneData.scene]);

  return (
    <div className="flex h-full w-full">
      <div 
        className="model-viewer w-4/5 h-full bg-base-200 rounded-xl overflow-hidden"
        ref={containerRef}
        onPointerDown={handlePointerDown}
      >
      </div>
      <div className="w-1/5 p-4">
        <h3 className="text-md font-semibold mb-2">Local Transform</h3>
          <div className="mb-4">
            <Label htmlFor="positionX" className="block text-sm font-medium text-gray-700">Position X</Label>
            <Input
              type="number"
              id="positionX"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.position.x}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="positionY" className="block text-sm font-medium text-gray-700">Position Y</Label>
            <Input
              type="number"
              id="positionY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.position.y}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="positionZ" className="block text-sm font-medium text-gray-700">Position Z</Label>
            <Input
              type="number"
              id="positionZ"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.position.z}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="rotationX" className="block text-sm font-medium text-gray-700">Rotation X</Label>
            <Input
              type="number"
              id="rotationX"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.rotation.x}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="rotationY" className="block text-sm font-medium text-gray-700">Rotation Y</Label>
            <Input
              type="number"
              id="rotationY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.rotation.y}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="rotationZ" className="block text-sm font-medium text-gray-700">Rotation Z</Label>
            <Input
              type="number"
              id="rotationZ"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.rotation.z}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="scaleX" className="block text-sm font-medium text-gray-700">Scale X</Label>
            <Input
              type="number"
              id="scaleX"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.scale.x}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="scaleY" className="block text-sm font-medium text-gray-700">Scale Y</Label>
            <Input
              type="number"
              id="scaleY"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.scale.y}
              disabled
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="scaleZ" className="block text-sm font-medium text-gray-700">Scale Z</Label>
            <Input
              type="number"
              id="scaleZ"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={localTransform.scale.z}
              disabled
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
      </div>
    </div>
  );
};

export default ModelViewer;
