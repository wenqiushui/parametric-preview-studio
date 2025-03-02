
import * as THREE from 'three';
import { MaterialDefinition } from '@/types';

/**
 * Wood materials
 */
export const woodMaterials: MaterialDefinition[] = [
  {
    id: 'oak',
    name: 'Oak',
    category: 'Wood',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#b08968'),
        roughness: 0.7,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#b08968',
      roughness: 0.7,
      metalness: 0
    }
  },
  {
    id: 'walnut',
    name: 'Walnut',
    category: 'Wood',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#5c4033'),
        roughness: 0.65,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#5c4033',
      roughness: 0.65,
      metalness: 0
    }
  },
  {
    id: 'maple',
    name: 'Maple',
    category: 'Wood',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e8d4ad'),
        roughness: 0.6,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#e8d4ad',
      roughness: 0.6,
      metalness: 0
    }
  },
  {
    id: 'cherry',
    name: 'Cherry',
    category: 'Wood',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#9f3b1d'),
        roughness: 0.65,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#9f3b1d',
      roughness: 0.65,
      metalness: 0
    }
  }
];

/**
 * Metal materials
 */
export const metalMaterials: MaterialDefinition[] = [
  {
    id: 'steel',
    name: 'Stainless Steel',
    category: 'Metal',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c0c0c0'),
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#c0c0c0',
      roughness: 0.2,
      metalness: 0.8
    }
  },
  {
    id: 'brass',
    name: 'Brass',
    category: 'Metal',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#d4a017'),
        roughness: 0.25,
        metalness: 0.9,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#d4a017',
      roughness: 0.25,
      metalness: 0.9
    }
  },
  {
    id: 'copper',
    name: 'Copper',
    category: 'Metal',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#b87333'),
        roughness: 0.3,
        metalness: 0.9,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#b87333',
      roughness: 0.3,
      metalness: 0.9
    }
  },
  {
    id: 'chrome',
    name: 'Chrome',
    category: 'Metal',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e8ebf0'),
        roughness: 0.1,
        metalness: 1.0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#e8ebf0',
      roughness: 0.1,
      metalness: 1.0
    }
  }
];

/**
 * Glass materials
 */
export const glassMaterials: MaterialDefinition[] = [
  {
    id: 'clear',
    name: 'Clear Glass',
    category: 'Glass',
    createMaterial: () => {
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        roughness: 0.1,
        metalness: 0,
        transmission: 0.9,
        transparent: true,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#ffffff',
      roughness: 0.1,
      metalness: 0,
      transmission: 0.9,
      transparent: true
    }
  },
  {
    id: 'tinted',
    name: 'Tinted Glass',
    category: 'Glass',
    createMaterial: () => {
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#86a1b8'),
        roughness: 0.1,
        metalness: 0,
        transmission: 0.8,
        transparent: true,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#86a1b8',
      roughness: 0.1,
      metalness: 0,
      transmission: 0.8,
      transparent: true
    }
  },
  {
    id: 'frosted',
    name: 'Frosted Glass',
    category: 'Glass',
    createMaterial: () => {
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#f0f0f0'),
        roughness: 0.5,
        metalness: 0,
        transmission: 0.7,
        transparent: true,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#f0f0f0',
      roughness: 0.5,
      metalness: 0,
      transmission: 0.7,
      transparent: true
    }
  }
];

/**
 * Other materials
 */
export const otherMaterials: MaterialDefinition[] = [
  {
    id: 'white-laminate',
    name: 'White Laminate',
    category: 'Synthetic',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f8f8f8'),
        roughness: 0.4,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#f8f8f8',
      roughness: 0.4,
      metalness: 0
    }
  },
  {
    id: 'black-laminate',
    name: 'Black Laminate',
    category: 'Synthetic',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1a1a1a'),
        roughness: 0.4,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#1a1a1a',
      roughness: 0.4,
      metalness: 0
    }
  },
  {
    id: 'leather',
    name: 'Leather',
    category: 'Organic',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8b4513'),
        roughness: 0.9,
        metalness: 0,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#8b4513',
      roughness: 0.9,
      metalness: 0
    }
  },
  {
    id: 'marble',
    name: 'Marble',
    category: 'Stone',
    createMaterial: () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#f5f5f5'),
        roughness: 0.3,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      return material;
    },
    properties: {
      color: '#f5f5f5',
      roughness: 0.3,
      metalness: 0.1
    }
  }
];

/**
 * Get all materials
 */
export function getAllMaterials(): MaterialDefinition[] {
  return [
    ...woodMaterials,
    ...metalMaterials,
    ...glassMaterials,
    ...otherMaterials
  ];
}

/**
 * Get all material categories
 */
export function getMaterialCategories(): string[] {
  const categories = getAllMaterials().map(material => material.category);
  return [...new Set(categories)];
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: string): MaterialDefinition[] {
  return getAllMaterials().filter(material => material.category === category);
}

/**
 * Get a material by ID
 */
export function getMaterialById(id: string): MaterialDefinition | undefined {
  return getAllMaterials().find(material => material.id === id);
}

/**
 * Create a material from a definition
 */
export function createMaterialFromDefinition(materialDef: MaterialDefinition): THREE.Material {
  return materialDef.createMaterial();
}

/**
 * Apply a material to a mesh or group
 */
export function applyMaterialToObject(object: THREE.Object3D, material: THREE.Material): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = material;
    }
  });
}
