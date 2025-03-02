import * as THREE from 'three';
import { getMaterialByName } from './materialLibrary';

// Fix the type definitions for prototype update functions
export interface ModelPrototype {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: ParameterDefinition[];
  createModel: (params: Record<string, any>) => Promise<THREE.Object3D>;
  updateModel?: (model: THREE.Object3D, params: Record<string, any>) => Promise<void>;
  defaultParameters: Record<string, any>;
  thumbnailUrl?: string;
}

export interface ParameterDefinition {
  name: string;
  key: string;
  type: 'number' | 'text' | 'select' | 'color' | 'material';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  description?: string;
}

const deskParams: ParameterDefinition[] = [
  {
    name: 'Width',
    key: 'width',
    type: 'number',
    default: 2,
    min: 1,
    max: 4,
    step: 0.1,
    description: 'Width of the desk'
  },
  {
    name: 'Depth',
    key: 'depth',
    type: 'number',
    default: 1,
    min: 0.5,
    max: 2,
    step: 0.1,
    description: 'Depth of the desk'
  },
  {
    name: 'Height',
    key: 'height',
    type: 'number',
    default: 0.75,
    min: 0.5,
    max: 1,
    step: 0.05,
    description: 'Height of the desk'
  },
  {
    name: 'Thickness',
    key: 'thickness',
    type: 'number',
    default: 0.05,
    min: 0.02,
    max: 0.1,
    step: 0.01,
    description: 'Thickness of the desk top'
  },
  {
    name: 'Leg Color',
    key: 'legMaterial',
    type: 'material',
    default: 'BrushedMetal',
    description: 'Material of the desk legs'
  },
  {
    name: 'Top Color',
    key: 'topMaterial',
    type: 'material',
    default: 'WoodCherry',
    description: 'Material of the desk top'
  }
];

const chairParams: ParameterDefinition[] = [
  {
    name: 'Seat Radius',
    key: 'seatRadius',
    type: 'number',
    default: 0.3,
    min: 0.2,
    max: 0.5,
    step: 0.02,
    description: 'Radius of the chair seat'
  },
  {
    name: 'Seat Height',
    key: 'seatHeight',
    type: 'number',
    default: 0.45,
    min: 0.3,
    max: 0.6,
    step: 0.05,
    description: 'Height of the chair seat'
  },
  {
    name: 'Leg Thickness',
    key: 'legThickness',
    type: 'number',
    default: 0.04,
    min: 0.02,
    max: 0.1,
    step: 0.01,
    description: 'Thickness of the chair legs'
  },
  {
    name: 'Leg Color',
    key: 'legMaterial',
    type: 'material',
    default: 'BrushedMetal',
    description: 'Material of the chair legs'
  },
  {
    name: 'Seat Color',
    key: 'seatMaterial',
    type: 'material',
    default: 'FabricBlue',
    description: 'Material of the chair seat'
  }
];

const tableParams: ParameterDefinition[] = [
  {
    name: 'Radius',
    key: 'radius',
    type: 'number',
    default: 0.75,
    min: 0.5,
    max: 1.5,
    step: 0.05,
    description: 'Radius of the table'
  },
  {
    name: 'Height',
    key: 'height',
    type: 'number',
    default: 0.75,
    min: 0.5,
    max: 1,
    step: 0.05,
    description: 'Height of the table'
  },
  {
    name: 'Leg Thickness',
    key: 'legThickness',
    type: 'number',
    default: 0.05,
    min: 0.02,
    max: 0.1,
    step: 0.01,
    description: 'Thickness of the table legs'
  },
  {
    name: 'Leg Color',
    key: 'legMaterial',
    type: 'material',
    default: 'BrushedMetal',
    description: 'Material of the table legs'
  },
  {
    name: 'Top Color',
    key: 'topMaterial',
    type: 'material',
    default: 'WoodOak',
    description: 'Material of the table top'
  }
];

const prototypes: ModelPrototype[] = [
  {
    id: 'desk',
    name: 'Desk',
    category: 'Furniture',
    description: 'A simple desk model with adjustable dimensions and materials.',
    parameters: deskParams,
    defaultParameters: {
      width: 2,
      depth: 1,
      height: 0.75,
      thickness: 0.05,
      legMaterial: 'BrushedMetal',
      topMaterial: 'WoodCherry'
    },
    createModel: async (params: Record<string, any>) => {
      const width = params.width || 2;
      const depth = params.depth || 1;
      const height = params.height || 0.75;
      const thickness = params.thickness || 0.05;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const topMaterialName = params.topMaterial || 'WoodCherry';

      const legMaterial = getMaterialByName(legMaterialName);
      const topMaterial = getMaterialByName(topMaterialName);

      const group = new THREE.Group();

      // Desk top
      const topGeometry = new THREE.BoxGeometry(width, thickness, depth);
      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.position.y = height - thickness / 2;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Desk legs
      const legWidth = 0.05;
      const legHeight = height;
      const legDepth = 0.05;
      const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);

      const createLeg = (x: number, z: number) => {
        const legMesh = new THREE.Mesh(legGeometry, legMaterial);
        legMesh.position.set(x, height / 2, z);
        legMesh.castShadow = true;
        legMesh.receiveShadow = true;
        return legMesh;
      };

      const legOffsetWidth = width / 2 - legWidth / 2;
      const legOffsetDepth = depth / 2 - legDepth / 2;

      const leg1 = createLeg(legOffsetWidth, legOffsetDepth);
      const leg2 = createLeg(-legOffsetWidth, legOffsetDepth);
      const leg3 = createLeg(legOffsetWidth, -legOffsetDepth);
      const leg4 = createLeg(-legOffsetWidth, -legOffsetDepth);

      group.add(leg1, leg2, leg3, leg4);

      return group;
    },
    updateModel: async (model: THREE.Object3D, params: Record<string, any>): Promise<void> => {
      const width = params.width || 2;
      const depth = params.depth || 1;
      const height = params.height || 0.75;
      const thickness = params.thickness || 0.05;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const topMaterialName = params.topMaterial || 'WoodCherry';

      const legMaterial = getMaterialByName(legMaterialName);
      const topMaterial = getMaterialByName(topMaterialName);

      // Update desk top
      const topMesh = model.children[0] as THREE.Mesh;
      topMesh.geometry.dispose();
      topMesh.geometry = new THREE.BoxGeometry(width, thickness, depth);
      topMesh.material = topMaterial;
      topMesh.position.y = height - thickness / 2;

      // Update desk legs
      const legWidth = 0.05;
      const legHeight = height;
      const legDepth = 0.05;

      const updateLeg = (leg: THREE.Object3D, x: number, z: number) => {
        if (leg instanceof THREE.Mesh) {
          leg.geometry.dispose();
          leg.geometry = new THREE.BoxGeometry(legWidth, legHeight, legDepth);
          leg.material = legMaterial;
          leg.position.set(x, height / 2, z);
        }
      };

      const legOffsetWidth = width / 2 - legWidth / 2;
      const legOffsetDepth = depth / 2 - legDepth / 2;

      updateLeg(model.children[1], legOffsetWidth, legOffsetDepth);
      updateLeg(model.children[2], -legOffsetWidth, legOffsetDepth);
      updateLeg(model.children[3], legOffsetWidth, -legOffsetDepth);
      updateLeg(model.children[4], -legOffsetWidth, -legOffsetDepth);
    },
    thumbnailUrl: '/thumbnails/desk.png'
  },
  {
    id: 'chair',
    name: 'Chair',
    category: 'Furniture',
    description: 'A simple chair model with adjustable dimensions and materials.',
    parameters: chairParams,
    defaultParameters: {
      seatRadius: 0.3,
      seatHeight: 0.45,
      legThickness: 0.04,
      legMaterial: 'BrushedMetal',
      seatMaterial: 'FabricBlue'
    },
    createModel: async (params: Record<string, any>) => {
      const seatRadius = params.seatRadius || 0.3;
      const seatHeight = params.seatHeight || 0.45;
      const legThickness = params.legThickness || 0.04;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const seatMaterialName = params.seatMaterial || 'FabricBlue';

      const legMaterial = getMaterialByName(legMaterialName);
      const seatMaterial = getMaterialByName(seatMaterialName);

      const group = new THREE.Group();

      // Chair seat
      const seatGeometry = new THREE.CylinderGeometry(
        seatRadius,
        seatRadius,
        0.1,
        32
      );
      const seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
      seatMesh.position.y = seatHeight;
      seatMesh.castShadow = true;
      seatMesh.receiveShadow = true;
      group.add(seatMesh);

      // Chair legs
      const legHeight = seatHeight;
      const legGeometry = new THREE.BoxGeometry(
        legThickness,
        legHeight,
        legThickness
      );

      const createLeg = (x: number, z: number) => {
        const legMesh = new THREE.Mesh(legGeometry, legMaterial);
        legMesh.position.set(x, legHeight / 2, z);
        legMesh.castShadow = true;
        legMesh.receiveShadow = true;
        return legMesh;
      };

      const legOffset = seatRadius * 0.7;

      const leg1 = createLeg(legOffset, legOffset);
      const leg2 = createLeg(-legOffset, legOffset);
      const leg3 = createLeg(legOffset, -legOffset);
      const leg4 = createLeg(-legOffset, -legOffset);

      group.add(leg1, leg2, leg3, leg4);

      return group;
    },
    updateModel: async (model: THREE.Object3D, params: Record<string, any>): Promise<void> => {
      const seatRadius = params.seatRadius || 0.3;
      const seatHeight = params.seatHeight || 0.45;
      const legThickness = params.legThickness || 0.04;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const seatMaterialName = params.seatMaterial || 'FabricBlue';

      const legMaterial = getMaterialByName(legMaterialName);
      const seatMaterial = getMaterialByName(seatMaterialName);

      // Update chair seat
      const seatMesh = model.children[0] as THREE.Mesh;
      seatMesh.geometry.dispose();
      seatMesh.geometry = new THREE.CylinderGeometry(
        seatRadius,
        seatRadius,
        0.1,
        32
      );
      seatMesh.material = seatMaterial;
      seatMesh.position.y = seatHeight;

      // Update chair legs
      const legHeight = seatHeight;
      const updateLeg = (leg: THREE.Object3D, x: number, z: number) => {
        if (leg instanceof THREE.Mesh) {
          leg.geometry.dispose();
          leg.geometry = new THREE.BoxGeometry(
            legThickness,
            legHeight,
            legThickness
          );
          leg.material = legMaterial;
          leg.position.set(x, legHeight / 2, z);
        }
      };

      const legOffset = seatRadius * 0.7;

      updateLeg(model.children[1], legOffset, legOffset);
      updateLeg(model.children[2], -legOffset, legOffset);
      updateLeg(model.children[3], legOffset, -legOffset);
      updateLeg(model.children[4], -legOffset, -legOffset);
    },
    thumbnailUrl: '/thumbnails/chair.png'
  },
  {
    id: 'table',
    name: 'Table',
    category: 'Furniture',
    description: 'A simple round table model with adjustable dimensions and materials.',
    parameters: tableParams,
    defaultParameters: {
      radius: 0.75,
      height: 0.75,
      legThickness: 0.05,
      legMaterial: 'BrushedMetal',
      topMaterial: 'WoodOak'
    },
    createModel: async (params: Record<string, any>) => {
      const radius = params.radius || 0.75;
      const height = params.height || 0.75;
      const legThickness = params.legThickness || 0.05;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const topMaterialName = params.topMaterial || 'WoodOak';

      const legMaterial = getMaterialByName(legMaterialName);
      const topMaterial = getMaterialByName(topMaterialName);

      const group = new THREE.Group();

      // Table top
      const topGeometry = new THREE.CylinderGeometry(radius, radius, 0.05, 32);
      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.position.y = height;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Table legs
      const legHeight = height;
      const legGeometry = new THREE.BoxGeometry(
        legThickness,
        legHeight,
        legThickness
      );

      const createLeg = (angle: number) => {
        const legMesh = new THREE.Mesh(legGeometry, legMaterial);
        const x = Math.cos(angle) * (radius * 0.8);
        const z = Math.sin(angle) * (radius * 0.8);
        legMesh.position.set(x, legHeight / 2, z);
        legMesh.castShadow = true;
        legMesh.receiveShadow = true;
        return legMesh;
      };

      const leg1 = createLeg(Math.PI / 4);
      const leg2 = createLeg(Math.PI * 3 / 4);
      const leg3 = createLeg(Math.PI * 5 / 4);
      const leg4 = createLeg(Math.PI * 7 / 4);

      group.add(leg1, leg2, leg3, leg4);

      return group;
    },
    updateModel: async (model: THREE.Object3D, params: Record<string, any>): Promise<void> => {
      const radius = params.radius || 0.75;
      const height = params.height || 0.75;
      const legThickness = params.legThickness || 0.05;
      const legMaterialName = params.legMaterial || 'BrushedMetal';
      const topMaterialName = params.topMaterial || 'WoodOak';

      const legMaterial = getMaterialByName(legMaterialName);
      const topMaterial = getMaterialByName(topMaterialName);

      // Update table top
      const topMesh = model.children[0] as THREE.Mesh;
      topMesh.geometry.dispose();
      topMesh.geometry = new THREE.CylinderGeometry(radius, radius, 0.05, 32);
      topMesh.material = topMaterial;
      topMesh.position.y = height;

      // Update table legs
      const legHeight = height;
      const updateLeg = (leg: THREE.Object3D, angle: number) => {
        if (leg instanceof THREE.Mesh) {
          leg.geometry.dispose();
          leg.geometry = new THREE.BoxGeometry(
            legThickness,
            legHeight,
            legThickness
          );
          leg.material = legMaterial;
          const x = Math.cos(angle) * (radius * 0.8);
          const z = Math.sin(angle) * (radius * 0.8);
          leg.position.set(x, legHeight / 2, z);
        }
      };

      updateLeg(model.children[1], Math.PI / 4);
      updateLeg(model.children[2], Math.PI * 3 / 4);
      updateLeg(model.children[3], Math.PI * 5 / 4);
      updateLeg(model.children[4], Math.PI * 7 / 4);
    },
    thumbnailUrl: '/thumbnails/table.png'
  }
];

export function getPrototypeById(id: string): ModelPrototype | undefined {
  return prototypes.find((prototype) => prototype.id === id);
}

export function getAllPrototypes(): ModelPrototype[] {
  return prototypes;
}
