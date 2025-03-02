
import { Vector3, Euler, Object3D } from 'three';

export interface ModelParameter {
  id: string;
  name: string;
  type: 'number' | 'select';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
}

export interface ModelPrototype {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: ModelParameter[];
  createModel: (params: Record<string, any>) => Object3D;
}

export interface ModelInstance {
  id: string;
  prototypeId: string;
  name: string;
  visible: boolean;
  selected: boolean;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  parameters: Record<string, any>;
  object: Object3D | null;
}

export interface AppState {
  mode: 'admin' | 'user';
  models: ModelInstance[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
}

export interface TransformMode {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'world' | 'local';
}
