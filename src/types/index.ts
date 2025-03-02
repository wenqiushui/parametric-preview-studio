
import * as THREE from 'three';

export interface Model {
  id: string;
  name: string;
  prototypeId: string;
  parameters: Record<string, any>;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  visible: boolean;
  selected?: boolean;
  object?: THREE.Object3D | null;
  materialAssignments?: Record<string, string>;
}

export interface ModelInstance extends Model {
  selected: boolean;
}

export interface ModelPrototype {
  id: string;
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  createModel: (params: Record<string, any>) => Promise<THREE.Object3D> | THREE.Object3D;
  updateModel?: (object: THREE.Object3D, params: Record<string, any>) => Promise<void> | void;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: 'number' | 'select' | 'color' | 'boolean';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

export interface MaterialDefinition {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  preview?: string;
}

export interface AppState {
  mode: 'admin' | 'user';
  models: ModelInstance[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
}

export interface ModelState {
  models: Model[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
  availableMaterials: MaterialDefinition[];
}

export interface ModelAction {
  type: string;
  payload?: any;
}

export interface TransformMode {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'world' | 'local';
  axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
}

export interface PickResult {
  object: THREE.Object3D;
  face?: number;
  point: THREE.Vector3;
  distance: number;
  isFace: boolean;
}
