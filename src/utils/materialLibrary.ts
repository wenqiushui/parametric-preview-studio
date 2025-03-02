
import * as THREE from 'three';
import { MaterialDefinition } from '@/types';

// Predefined materials library
const materialLibrary: MaterialDefinition[] = [
  {
    id: 'wood-oak',
    name: 'Oak Wood',
    type: 'standard',
    properties: {
      color: '#b2824d',
      roughness: 0.7,
      metalness: 0.0,
      map: '/textures/wood-oak.jpg'
    },
    preview: '/previews/wood-oak.jpg'
  },
  {
    id: 'wood-walnut',
    name: 'Walnut Wood',
    type: 'standard',
    properties: {
      color: '#5d4037',
      roughness: 0.7,
      metalness: 0.0,
      map: '/textures/wood-walnut.jpg'
    },
    preview: '/previews/wood-walnut.jpg'
  },
  {
    id: 'metal-chrome',
    name: 'Chrome Metal',
    type: 'standard',
    properties: {
      color: '#e0e0e0',
      roughness: 0.1,
      metalness: 0.9
    },
    preview: '/previews/metal-chrome.jpg'
  },
  {
    id: 'metal-brushed',
    name: 'Brushed Metal',
    type: 'standard',
    properties: {
      color: '#b0b0b0',
      roughness: 0.3,
      metalness: 0.8
    },
    preview: '/previews/metal-brushed.jpg'
  },
  {
    id: 'glass-clear',
    name: 'Clear Glass',
    type: 'standard',
    properties: {
      color: '#ffffff',
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.3
    },
    preview: '/previews/glass-clear.jpg'
  },
  {
    id: 'glass-tinted',
    name: 'Tinted Glass',
    type: 'standard',
    properties: {
      color: '#88ccff',
      roughness: 0.1,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5
    },
    preview: '/previews/glass-tinted.jpg'
  }
];

// Get all materials
export const getAllMaterials = (): MaterialDefinition[] => {
  return materialLibrary;
};

// Get a material by ID
export const getMaterialById = (id: string): MaterialDefinition | undefined => {
  return materialLibrary.find(material => material.id === id);
};

// Create a Three.js material from a material definition
export const createThreeMaterial = (materialDef: MaterialDefinition): THREE.Material => {
  if (materialDef.type === 'standard') {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(materialDef.properties.color),
      roughness: materialDef.properties.roughness,
      metalness: materialDef.properties.metalness,
      transparent: materialDef.properties.transparent,
      opacity: materialDef.properties.opacity
    });
    
    // If there's a texture map defined, load it
    if (materialDef.properties.map) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(materialDef.properties.map, (texture) => {
        material.map = texture;
        material.needsUpdate = true;
      });
    }
    
    return material;
  }
  
  // Fallback to basic material
  return new THREE.MeshBasicMaterial({ color: materialDef.properties.color });
};
