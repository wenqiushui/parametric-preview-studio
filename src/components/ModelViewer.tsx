import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { setupScene, pickObject, getTransformFromObject, highlightObject, clearHighlights, findObjectById, disposeObject } from '@/utils/threeHelpers';
import { useModelContext } from '@/context/ModelContext';
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
import { getAllMaterials } from '@/utils/materialLibrary';

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
  
  const { state, dispatch, updateModel, selectModel, selectFace, deselectModel, updateModelTransform, setFaceMaterial } = useModelContext();
  const { models, selectedModelId, selectedFaceId } = state;
  const [localTransform, setLocalTransform] = useState({
    position: new Vector3(),
    rotation: new Euler(),
    scale: new Vector3(1, 1, 1)
  });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isTransformActive, setIsTransformActive] = useState(false);
  const materials = getAllMaterials();

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

      transformControls.addEventListener('mouseDown', () => {
        setIsTransformActive(true);
      });
      
      transformControls.addEventListener('mouseUp', () => {
        setIsTransformActive(false);
      });
      
      transformControls.addEventListener('objectChange', () => {
        if (transformControls.object) {
          const newTransform = getTransformFromObject(transformControls.object);
          const modelId = transformControls.object.userData.id;
          
          if (modelId) {
            updateModelTransform(
              modelId,
              newTransform.position,
              newTransform.rotation,
              newTransform.scale
            );
          }
          
          setLocalTransform(newTransform);
        }
      });

      return () => {
        if (transformControls.object) {
          transformControls.detach();
        }
        
        scene.traverse((object) => {
          disposeObject(object);
        });
        
        renderer.dispose();
        
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (sceneData.scene) {
      sceneData.scene.traverse((object) => {
        if (object.userData && object.userData.id && 
            !models.some(model => model.id === object.userData.id)) {
          if (object.parent) {
            console.log('Removing model from scene:', object.userData.id);
            object.parent.remove(object);
          }
        }
      });
      
      models.forEach(model => {
        if (model.object) {
          const existingObject = findObjectById(sceneData.scene!, model.id);
          
          if (!existingObject) {
            console.log('Adding model to scene:', model.id);
            sceneData.scene?.add(model.object);
          }
          
          model.object.position.copy(model.position);
          model.object.rotation.copy(model.rotation);
          model.object.scale.copy(model.scale);
          model.object.visible = model.visible;
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
        
        const faceIndex = selectedFaceId ? parseInt(selectedFaceId) : undefined;
        highlightObject(selectedObject, faceIndex);
        
        setLocalTransform(getTransformFromObject(selectedObject));
      }
    } else {
      if (sceneData.transformControls.object) {
        sceneData.transformControls.detach();
      }
    }
  }, [selectedModelId, selectedFaceId, sceneData]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (isTransformActive) return;
    
    if (!containerRef.current || !sceneData.camera || !sceneData.scene) return;

    const pickResult = pickObject(
      event.nativeEvent as MouseEvent,
      containerRef.current,
      sceneData.camera,
      sceneData.scene
    );

    if (pickResult) {
      const pickedObject = pickResult.object;
      
      let currentObject: THREE.Object3D | null = pickedObject;
      let modelId = null;
      
      while (currentObject && !modelId) {
        if (currentObject.userData && currentObject.userData.id) {
          modelId = currentObject.userData.id;
          break;
        }
        currentObject = currentObject.parent;
      }
      
      if (modelId) {
        console.log('Selected model:', modelId);
        selectModel(modelId);
        
        if (pickResult.isFace && pickResult.faceIndex !== undefined) {
          console.log('Selected face:', pickResult.faceIndex);
          selectFace(pickResult.faceIndex.toString());
        } else {
          selectFace(null);
        }
      } else {
        deselectModel();
      }
    } else {
      deselectModel();
    }
  }, [sceneData, selectModel, selectFace, deselectModel, isTransformActive]);

  const handleTransformChange = (axis: string, value: number, type: 'position' | 'rotation' | 'scale') => {
    if (!selectedModelId || !sceneData.scene) return;
    
    const selectedObject = findObjectById(sceneData.scene, selectedModelId);
    if (!selectedObject) return;
    
    const newTransform = {
      position: new Vector3().copy(localTransform.position),
      rotation: new Euler().copy(localTransform.rotation),
      scale: new Vector3().copy(localTransform.scale)
    };
    
    if (type === 'position') {
      newTransform.position[axis as 'x' | 'y' | 'z'] = value;
    } else if (type === 'rotation') {
      newTransform.rotation[axis as 'x' | 'y' | 'z'] = value;
    } else if (type === 'scale') {
      newTransform.scale[axis as 'x' | 'y' | 'z'] = value;
    }
    
    updateModelTransform(
      selectedModelId,
      newTransform.position,
      newTransform.rotation,
      newTransform.scale
    );
    setLocalTransform(newTransform);
  };

  const handleMaterialChange = (materialId: string) => {
    if (!selectedModelId || !selectedFaceId) return;
    
    const faceIndex = parseInt(selectedFaceId);
    setFaceMaterial(selectedModelId, faceIndex, materialId);
  };

  return (
    <div className="flex h-full w-full">
      <div 
        className="model-viewer w-4/5 h-full bg-base-200 rounded-xl overflow-hidden"
        ref={containerRef}
        onPointerDown={handlePointerDown}
      >
      </div>
      <div className="w-1/5 p-4 space-y-4 overflow-y-auto max-h-full">
        <h3 className="text-md font-semibold mb-2">Local Transform</h3>
        <div className="mb-4">
          <Label htmlFor="positionX" className="block text-sm font-medium text-gray-700">Position X</Label>
          <Input
            type="number"
            id="positionX"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.position.x}
            onChange={(e) => handleTransformChange('x', parseFloat(e.target.value), 'position')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="positionY" className="block text-sm font-medium text-gray-700">Position Y</Label>
          <Input
            type="number"
            id="positionY"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.position.y}
            onChange={(e) => handleTransformChange('y', parseFloat(e.target.value), 'position')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="positionZ" className="block text-sm font-medium text-gray-700">Position Z</Label>
          <Input
            type="number"
            id="positionZ"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.position.z}
            onChange={(e) => handleTransformChange('z', parseFloat(e.target.value), 'position')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="rotationX" className="block text-sm font-medium text-gray-700">Rotation X</Label>
          <Input
            type="number"
            id="rotationX"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.rotation.x}
            onChange={(e) => handleTransformChange('x', parseFloat(e.target.value), 'rotation')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="rotationY" className="block text-sm font-medium text-gray-700">Rotation Y</Label>
          <Input
            type="number"
            id="rotationY"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.rotation.y}
            onChange={(e) => handleTransformChange('y', parseFloat(e.target.value), 'rotation')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="rotationZ" className="block text-sm font-medium text-gray-700">Rotation Z</Label>
          <Input
            type="number"
            id="rotationZ"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.rotation.z}
            onChange={(e) => handleTransformChange('z', parseFloat(e.target.value), 'rotation')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="scaleX" className="block text-sm font-medium text-gray-700">Scale X</Label>
          <Input
            type="number"
            id="scaleX"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.scale.x}
            onChange={(e) => handleTransformChange('x', parseFloat(e.target.value), 'scale')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="scaleY" className="block text-sm font-medium text-gray-700">Scale Y</Label>
          <Input
            type="number"
            id="scaleY"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.scale.y}
            onChange={(e) => handleTransformChange('y', parseFloat(e.target.value), 'scale')}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="scaleZ" className="block text-sm font-medium text-gray-700">Scale Z</Label>
          <Input
            type="number"
            id="scaleZ"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={localTransform.scale.z}
            onChange={(e) => handleTransformChange('z', parseFloat(e.target.value), 'scale')}
          />
        </div>
        {selectedModelId && selectedFaceId && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">Face Material</h3>
            <Label htmlFor="faceMaterial" className="block text-sm font-medium text-gray-700">Material</Label>
            <Select onValueChange={handleMaterialChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map(material => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
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
