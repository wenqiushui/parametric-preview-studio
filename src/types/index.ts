
import { Material, Texture, Vector3, Euler, Object3D, Mesh } from 'three';

export interface ModelParameter {
  id: string;
  name: string;
  type: 'number' | 'select' | 'color' | 'boolean';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  unit?: string;
  description?: string;
}

export interface ModelPrototype {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail?: string;
  parameters: ModelParameter[];
  createModel: (params: Record<string, any>) => Promise<Object3D>;
  updateModel?: (model: Object3D, params: Record<string, any>) => Promise<void>;
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

export interface MaterialDefinition {
  id: string;
  name: string;
  category: string;
  preview?: string;
  createMaterial: () => Material;
  properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
    emissive?: string;
    map?: Texture | null;
    normalMap?: Texture | null;
    aoMap?: Texture | null;
    roughnessMap?: Texture | null;
    metalnessMap?: Texture | null;
    [key: string]: any;
  };
}

export interface AppState {
  mode: 'admin' | 'user';
  models: ModelInstance[];
  selectedModelId: string | null;
  selectedFaceId: string | null;
}

export interface PickResult {
  object: Object3D;
  face?: number;
  point: Vector3;
  distance: number;
  modelId?: string;
  isFace?: boolean;
}

export interface TransformMode {
  mode: 'translate' | 'rotate' | 'scale';
  space: 'world' | 'local';
  axis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';
}
