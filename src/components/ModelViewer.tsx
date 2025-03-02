
import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { setupScene, pickObject, getTransformFromObject, highlightObject, clearHighlights, findObjectById, disposeObject } from '@/utils/threeHelpers';
import { useModelContext } from '@/context/ModelContext';
import { ModelInstance } from '@/types';
import { TransformMode } from '@/types';
import { Vector3, Euler, Object3D } from 'three';
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
  const { state, dispatch, updateModel, selectModel, deselectModel } = useModelContext();
  const { models, selectedModelId, selectedFaceId } = state;
  const [localTransform, setLocalTransform] = useState({
    position: new Vector3(),
    rotation: new Euler(),
    scale: new Vector3(1, 1, 1)
  });
  const [date, setDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (containerRef.current) {
      const { scene, camera, renderer, controls, transformControls, animate } = setupScene(containerRef.current);
      setSceneData({ scene, camera, renderer, controls, transformControls, animate });
      animate();

      models.forEach(model => {
        if (model.object) {
          scene.add(model.object);
        }
      });

      transformControls.addEventListener('objectChange', () => {
        if (transformControls.object) {
          const newTransform = getTransformFromObject(transformControls.object);
          updateModel(transformControls.object.userData.id, newTransform);
          
          setSceneData(prev => ({
            ...prev,
            scene: sceneData.scene
          }));
          setLocalTransform(newTransform);
        }
      });

      return () => {
        scene.traverse((object) => {
          disposeObject(object);
        });

        if (transformControls.object) {
          transformControls.detach();
        }
        scene.remove(transformControls as unknown as Object3D);

        renderer.dispose();
        
        while(scene.children.length > 0) {
          const child = scene.children[0];
          scene.remove(child);
          if ('geometry' in child) {
            (child as THREE.Mesh).geometry?.dispose();
          }
          if ('material' in child) {
            const material = (child as THREE.Mesh).material;
            if (Array.isArray(material)) {
              material.forEach(mat => mat.dispose());
            } else if (material) {
              material.dispose();
            }
          }
        }

        window.removeEventListener('resize', () => {
          if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          }
        });

        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (sceneData.scene) {
      sceneData.scene.children = sceneData.scene.children.filter(child => !(child as THREE.Mesh).geometry);
      models.forEach(model => {
        if (model.object) {
          sceneData.scene.add(model.object);
        }
      });
    }
  }, [models, sceneData.scene]);

  useEffect(() => {
    if (sceneData.transformControls) {
      sceneData.transformControls.mode = transformMode.mode;
      sceneData.transformControls.space = transformMode.space;
    }
  }, [transformMode, sceneData.transformControls]);

  useEffect(() => {
    if (!sceneData.scene || !sceneData.transformControls) return;
    
    clearHighlights(sceneData.scene);
    
    if (selectedModelId) {
      const selectedObject = findObjectById(sceneData.scene, selectedModelId);
      
      if (selectedObject) {
        if (sceneData.transformControls.object) {
          sceneData.transformControls.detach();
        }
        
        sceneData.transformControls.attach(selectedObject);
        
        highlightObject(selectedObject, selectedFaceId);
        
        setLocalTransform(getTransformFromObject(selectedObject));
      }
    } else {
      if (sceneData.transformControls.object) {
        sceneData.transformControls.detach();
      }
    }
  }, [selectedModelId, selectedFaceId, sceneData, models]);

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

      if (modelId) {
        selectModel(modelId);
      } else {
        deselectModel();
      }
    } else {
      deselectModel();
    }
  }, [sceneData, selectModel, deselectModel]);

  useEffect(() => {
    return () => {
      if (sceneData.transformControls && sceneData.scene) {
        if (sceneData.transformControls.object) {
          sceneData.transformControls.detach();
        }
        sceneData.scene.remove(sceneData.transformControls as unknown as Object3D);
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
