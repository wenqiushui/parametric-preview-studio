
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
  object?: THREE.Object3D;
  materialAssignments?: Record<string, string>;
}

export interface ModelState {
  models: Model[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
  availableMaterials: Material[];
}

export interface ModelAction {
  type: string;
  payload?: any;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
  thumbnailUrl?: string;
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
