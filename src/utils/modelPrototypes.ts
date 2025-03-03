import * as THREE from 'three';
import { getMaterialById, createThreeMaterial } from './materialLibrary';
import { ModelPrototype } from '@/types';

// Helper to create a box geometry with customizable dimensions
const createBox = (width: number, height: number, depth: number, materialId = 'wood-oak'): THREE.Mesh => {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = getMaterialById(materialId);
  const threeMaterial = new THREE.MeshStandardMaterial({
    color: material?.properties.color || '#b2824d',
    roughness: material?.properties.roughness || 0.7,
    metalness: material?.properties.metalness || 0.0
  });
  
  const mesh = new THREE.Mesh(geometry, threeMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
};

// Predefined model prototypes
const modelPrototypes: ModelPrototype[] = [
  {
    id: 'desk-basic',
    name: 'Basic Desk',
    description: 'A simple rectangular desk',
    category: 'Furniture',
    parameters: [
      {
        id: 'width',
        name: 'Width',
        type: 'number',
        default: 1.2,
        min: 0.6,
        max: 2.0,
        step: 0.1
      },
      {
        id: 'depth',
        name: 'Depth',
        type: 'number',
        default: 0.6,
        min: 0.4,
        max: 1.0,
        step: 0.1
      },
      {
        id: 'height',
        name: 'Height',
        type: 'number',
        default: 0.75,
        min: 0.65,
        max: 0.9,
        step: 0.05
      },
      {
        id: 'topMaterial',
        name: 'Top Material',
        type: 'select',
        default: 'wood-oak',
        options: [
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' },
          { label: 'Glass', value: 'glass-clear' }
        ]
      },
      {
        id: 'legMaterial',
        name: 'Leg Material',
        type: 'select',
        default: 'metal-chrome',
        options: [
          { label: 'Chrome Metal', value: 'metal-chrome' },
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' }
        ]
      }
    ],
    createModel: (params) => {
      const { width, depth, height, topMaterial, legMaterial } = params;
      
      // Create the desk as a group
      const deskGroup = new THREE.Group();
      
      // Create tabletop
      const tabletop = createBox(width, 0.03, depth, topMaterial);
      tabletop.position.y = height - 0.015;
      deskGroup.add(tabletop);
      
      // Create legs
      const legThickness = 0.05;
      const legHeight = height - 0.03;
      
      for (let i = 0; i < 4; i++) {
        const leg = createBox(legThickness, legHeight, legThickness, legMaterial);
        const xPos = ((i % 2) * 2 - 1) * (width / 2 - legThickness / 2);
        const zPos = (Math.floor(i / 2) * 2 - 1) * (depth / 2 - legThickness / 2);
        
        leg.position.set(xPos, legHeight / 2, zPos);
        deskGroup.add(leg);
      }
      
      return deskGroup;
    }
  },
  {
    id: 'desk-drawer',
    name: 'Desk with Drawer',
    description: 'A desk with a drawer unit',
    category: 'Furniture',
    parameters: [
      {
        id: 'width',
        name: 'Width',
        type: 'number',
        default: 1.4,
        min: 0.8,
        max: 2.0,
        step: 0.1
      },
      {
        id: 'depth',
        name: 'Depth',
        type: 'number',
        default: 0.7,
        min: 0.5,
        max: 1.0,
        step: 0.1
      },
      {
        id: 'height',
        name: 'Height',
        type: 'number',
        default: 0.75,
        min: 0.65,
        max: 0.9,
        step: 0.05
      },
      {
        id: 'drawerSide',
        name: 'Drawer Side',
        type: 'select',
        default: 'right',
        options: [
          { label: 'Left Side', value: 'left' },
          { label: 'Right Side', value: 'right' }
        ]
      },
      {
        id: 'topMaterial',
        name: 'Top Material',
        type: 'select',
        default: 'wood-oak',
        options: [
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' },
          { label: 'Glass', value: 'glass-clear' }
        ]
      },
      {
        id: 'bodyMaterial',
        name: 'Body Material',
        type: 'select',
        default: 'wood-oak',
        options: [
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' }
        ]
      }
    ],
    createModel: (params) => {
      const { width, depth, height, drawerSide, topMaterial, bodyMaterial } = params;
      
      // Create the desk as a group
      const deskGroup = new THREE.Group();
      
      // Create tabletop
      const tabletop = createBox(width, 0.03, depth, topMaterial);
      tabletop.position.y = height - 0.015;
      deskGroup.add(tabletop);
      
      // Create drawer unit
      const drawerWidth = 0.4;
      const drawerUnitHeight = height - 0.03;
      const drawer = new THREE.Group();
      
      // Main drawer body
      const drawerBody = createBox(drawerWidth, drawerUnitHeight, depth, bodyMaterial);
      drawerBody.position.y = drawerUnitHeight / 2;
      drawer.add(drawerBody);
      
      // Drawer fronts
      const numDrawers = 3;
      const drawerHeight = drawerUnitHeight / numDrawers;
      
      for (let i = 0; i < numDrawers; i++) {
        const drawerFront = createBox(drawerWidth - 0.02, drawerHeight - 0.02, 0.02, bodyMaterial);
        drawerFront.position.set(0, i * drawerHeight + drawerHeight / 2, depth / 2 + 0.01);
        drawer.add(drawerFront);
        
        // Drawer handle
        const handleWidth = 0.1;
        const handle = createBox(handleWidth, 0.02, 0.02, 'metal-chrome');
        handle.position.set(0, 0, 0.02);
        drawerFront.add(handle);
      }
      
      // Position the drawer unit based on the selected side
      drawer.position.x = (drawerSide === 'left' ? -1 : 1) * (width / 2 - drawerWidth / 2);
      deskGroup.add(drawer);
      
      // Create legs
      const legThickness = 0.05;
      const legHeight = height - 0.03;
      
      // Add legs only on the side without drawers
      for (let i = 0; i < 2; i++) {
        const leg = createBox(legThickness, legHeight, legThickness, bodyMaterial);
        const xPos = (drawerSide === 'left' ? 1 : -1) * (width / 2 - legThickness / 2);
        const zPos = (i * 2 - 1) * (depth / 2 - legThickness / 2);
        
        leg.position.set(xPos, legHeight / 2, zPos);
        deskGroup.add(leg);
      }
      
      return deskGroup;
    }
  },
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    description: 'A vertical bookshelf with adjustable shelves',
    category: 'Furniture',
    parameters: [
      {
        id: 'width',
        name: 'Width',
        type: 'number',
        default: 0.8,
        min: 0.4,
        max: 1.5,
        step: 0.1
      },
      {
        id: 'depth',
        name: 'Depth',
        type: 'number',
        default: 0.3,
        min: 0.2,
        max: 0.5,
        step: 0.05
      },
      {
        id: 'height',
        name: 'Height',
        type: 'number',
        default: 1.8,
        min: 0.8,
        max: 2.4,
        step: 0.1
      },
      {
        id: 'shelves',
        name: 'Number of Shelves',
        type: 'number',
        default: 4,
        min: 1,
        max: 8,
        step: 1
      },
      {
        id: 'material',
        name: 'Material',
        type: 'select',
        default: 'wood-oak',
        options: [
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' }
        ]
      }
    ],
    createModel: (params) => {
      const { width, depth, height, shelves, material } = params;
      
      // Create the bookshelf as a group
      const shelfGroup = new THREE.Group();
      
      // Side panels thickness
      const thickness = 0.02;
      
      // Create side panels
      const leftPanel = createBox(thickness, height, depth, material);
      leftPanel.position.set(-width / 2 + thickness / 2, height / 2, 0);
      shelfGroup.add(leftPanel);
      
      const rightPanel = createBox(thickness, height, depth, material);
      rightPanel.position.set(width / 2 - thickness / 2, height / 2, 0);
      shelfGroup.add(rightPanel);
      
      // Create top and bottom
      const bottom = createBox(width - thickness * 2, thickness, depth, material);
      bottom.position.set(0, thickness / 2, 0);
      shelfGroup.add(bottom);
      
      const top = createBox(width - thickness * 2, thickness, depth, material);
      top.position.set(0, height - thickness / 2, 0);
      shelfGroup.add(top);
      
      // Create back panel
      const back = createBox(width - thickness * 2, height - thickness * 2, thickness, material);
      back.position.set(0, height / 2, -depth / 2 + thickness / 2);
      shelfGroup.add(back);
      
      // Create shelves
      if (shelves > 0) {
        const shelfSpacing = (height - thickness * 2) / (shelves + 1);
        
        for (let i = 1; i <= shelves; i++) {
          const shelf = createBox(width - thickness * 2, thickness, depth - thickness, material);
          shelf.position.set(0, i * shelfSpacing + thickness, thickness / 2);
          shelfGroup.add(shelf);
        }
      }
      
      return shelfGroup;
    }
  },
  {
    id: 'elevator-cabin',
    name: 'Elevator Cabin',
    description: 'A customizable elevator cabin with doors',
    category: 'Furniture',
    parameters: [
      {
        id: 'width',
        name: 'Width',
        type: 'number',
        default: 1.6,
        min: 1.0,
        max: 2.5,
        step: 0.1
      },
      {
        id: 'depth',
        name: 'Depth',
        type: 'number',
        default: 1.8,
        min: 1.2,
        max: 3.0,
        step: 0.1
      },
      {
        id: 'height',
        name: 'Height',
        type: 'number',
        default: 2.4,
        min: 2.0,
        max: 3.0,
        step: 0.1
      },
      {
        id: 'doorWidth',
        name: 'Door Width',
        type: 'number',
        default: 0.9,
        min: 0.7,
        max: 1.5,
        step: 0.1
      },
      {
        id: 'wallMaterial',
        name: 'Wall Material',
        type: 'select',
        default: 'metal-brushed',
        options: [
          { label: 'Brushed Metal', value: 'metal-brushed' },
          { label: 'Chrome Metal', value: 'metal-chrome' },
          { label: 'Oak Wood', value: 'wood-oak' }
        ]
      },
      {
        id: 'floorMaterial',
        name: 'Floor Material',
        type: 'select',
        default: 'wood-oak',
        options: [
          { label: 'Oak Wood', value: 'wood-oak' },
          { label: 'Walnut Wood', value: 'wood-walnut' }
        ]
      },
      {
        id: 'doorMaterial',
        name: 'Door Material',
        type: 'select',
        default: 'metal-chrome',
        options: [
          { label: 'Chrome Metal', value: 'metal-chrome' },
          { label: 'Brushed Metal', value: 'metal-brushed' }
        ]
      }
    ],
    createModel: (params) => {
      const { width, depth, height, doorWidth, wallMaterial, floorMaterial, doorMaterial } = params;
      
      // Create the elevator cabin as a group
      const cabinGroup = new THREE.Group();
      
      // Wall thickness
      const wallThickness = 0.05;
      
      // Floor (bottom)
      const floor = createBox(width, wallThickness, depth, floorMaterial);
      floor.position.y = -height/2 + wallThickness/2;
      cabinGroup.add(floor);
      
      // Ceiling (top)
      const ceiling = createBox(width, wallThickness, depth, wallMaterial);
      ceiling.position.y = height/2 - wallThickness/2;
      cabinGroup.add(ceiling);
      
      // Back wall
      const backWall = createBox(width, height, wallThickness, wallMaterial);
      backWall.position.z = -depth/2 + wallThickness/2;
      cabinGroup.add(backWall);
      
      // Left side wall
      const leftWall = createBox(wallThickness, height, depth, wallMaterial);
      leftWall.position.x = -width/2 + wallThickness/2;
      cabinGroup.add(leftWall);
      
      // Right side wall
      const rightWall = createBox(wallThickness, height, depth, wallMaterial);
      rightWall.position.x = width/2 - wallThickness/2;
      cabinGroup.add(rightWall);
      
      // Front wall with door opening
      const doorHeight = height - wallThickness * 2;
      
      // Left side of front wall
      const leftFrontWidth = (width - doorWidth) / 2;
      if (leftFrontWidth > 0) {
        const leftFront = createBox(leftFrontWidth, height, wallThickness, wallMaterial);
        leftFront.position.set(-width/2 + leftFrontWidth/2, 0, depth/2 - wallThickness/2);
        cabinGroup.add(leftFront);
      }
      
      // Right side of front wall
      const rightFrontWidth = (width - doorWidth) / 2;
      if (rightFrontWidth > 0) {
        const rightFront = createBox(rightFrontWidth, height, wallThickness, wallMaterial);
        rightFront.position.set(width/2 - rightFrontWidth/2, 0, depth/2 - wallThickness/2);
        cabinGroup.add(rightFront);
      }
      
      // Top part of front wall above door
      const topFront = createBox(doorWidth, height - doorHeight, wallThickness, wallMaterial);
      topFront.position.set(0, doorHeight/2, depth/2 - wallThickness/2);
      cabinGroup.add(topFront);
      
      // Door (closed position)
      const door = createBox(doorWidth, doorHeight, wallThickness, doorMaterial);
      door.position.set(0, 0, depth/2 - wallThickness/2);
      door.userData.isDoor = true; // Mark as door for animations
      cabinGroup.add(door);
      
      // Add some interior details
      
      // Handrail
      const handrailRadius = 0.02;
      const handrailGeometry = new THREE.TorusGeometry(handrailRadius, handrailRadius/2, 8, 24, Math.PI);
      const handrailMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xd0d0d0, 
        metalness: 0.8, 
        roughness: 0.2 
      });
      
      // Back handrail
      const backHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial);
      backHandrail.position.set(0, height/2 - height/4, -depth/2 + wallThickness + handrailRadius);
      backHandrail.rotation.x = Math.PI / 2;
      cabinGroup.add(backHandrail);
      
      // Side handrails
      const leftHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial);
      leftHandrail.position.set(-width/2 + wallThickness + handrailRadius, height/2 - height/4, 0);
      leftHandrail.rotation.x = Math.PI / 2;
      leftHandrail.rotation.z = Math.PI / 2;
      cabinGroup.add(leftHandrail);
      
      const rightHandrail = new THREE.Mesh(handrailGeometry, handrailMaterial);
      rightHandrail.position.set(width/2 - wallThickness - handrailRadius, height/2 - height/4, 0);
      rightHandrail.rotation.x = Math.PI / 2;
      rightHandrail.rotation.z = Math.PI / 2;
      cabinGroup.add(rightHandrail);
      
      // Control panel
      const panelWidth = 0.2;
      const panelHeight = 0.3;
      const panelDepth = 0.05;
      
      const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
      const panelMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x303030, 
        metalness: 0.5, 
        roughness: 0.8 
      });
      
      const controlPanel = new THREE.Mesh(panelGeometry, panelMaterial);
      controlPanel.position.set(-width/2 + wallThickness*2 + panelWidth/2, height/2 - height/3, -depth/2 + wallThickness*2 + panelDepth/2);
      cabinGroup.add(controlPanel);
      
      // Add buttons to the panel
      const buttonRadius = 0.015;
      const buttonGeometry = new THREE.CircleGeometry(buttonRadius, 16);
      const buttonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        metalness: 0.3, 
        roughness: 0.5 
      });
      
      for (let i = 0; i < 5; i++) {
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(
          -width/2 + wallThickness*2 + panelWidth/2,
          height/2 - height/3 + panelHeight/2 - (i+1) * (buttonRadius*3),
          -depth/2 + wallThickness*2 + panelDepth + 0.001
        );
        button.rotation.y = Math.PI;
        cabinGroup.add(button);
      }
      
      // Center the entire cabin at the origin
      cabinGroup.position.y = height/2;
      
      return cabinGroup;
    }
  }
];

// Get all model prototypes
export const getAllPrototypes = (): ModelPrototype[] => {
  return modelPrototypes;
};

// Get a prototype by ID
export const getPrototypeById = (id: string): ModelPrototype | undefined => {
  return modelPrototypes.find(prototype => prototype.id === id);
};
