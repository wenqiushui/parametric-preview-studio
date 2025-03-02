
import * as THREE from 'three';
import { ModelPrototype } from '@/types';
import { createStandardMaterial } from './threeHelpers';

/**
 * Desk model prototype
 */
export const deskPrototype: ModelPrototype = {
  id: 'desk',
  name: 'Desk',
  category: 'Furniture',
  description: 'A customizable desk for your study room',
  parameters: [
    {
      id: 'length',
      name: 'Length',
      type: 'number',
      default: 1.4,
      min: 0.8,
      max: 2.0,
      step: 0.1,
      unit: 'm'
    },
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      default: 0.7,
      min: 0.5,
      max: 1.0,
      step: 0.05,
      unit: 'm'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      default: 0.75,
      min: 0.6,
      max: 0.9,
      step: 0.05,
      unit: 'm'
    },
    {
      id: 'topThickness',
      name: 'Top Thickness',
      type: 'number',
      default: 0.03,
      min: 0.02,
      max: 0.05,
      step: 0.005,
      unit: 'm'
    },
    {
      id: 'legType',
      name: 'Leg Type',
      type: 'select',
      default: 'square',
      options: [
        { label: 'Square', value: 'square' },
        { label: 'Round', value: 'round' },
        { label: 'A-Frame', value: 'aframe' }
      ]
    },
    {
      id: 'hasDrawer',
      name: 'Has Drawer',
      type: 'boolean',
      default: false
    },
    {
      id: 'drawerSide',
      name: 'Drawer Side',
      type: 'select',
      default: 'right',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' }
      ]
    },
    {
      id: 'topMaterial',
      name: 'Top Material',
      type: 'select',
      default: 'wood',
      options: [
        { label: 'Wood', value: 'wood' },
        { label: 'Glass', value: 'glass' },
        { label: 'Metal', value: 'metal' }
      ]
    },
    {
      id: 'legMaterial',
      name: 'Leg Material',
      type: 'select',
      default: 'wood',
      options: [
        { label: 'Wood', value: 'wood' },
        { label: 'Metal', value: 'metal' }
      ]
    },
    {
      id: 'topColor',
      name: 'Top Color',
      type: 'color',
      default: '#8B4513'
    },
    {
      id: 'legColor',
      name: 'Leg Color',
      type: 'color',
      default: '#8B4513'
    }
  ],
  createModel: async (params) => {
    const desk = new THREE.Group();
    desk.name = 'Desk';
    
    // Create desktop
    const desktopGeometry = new THREE.BoxGeometry(
      params.length,
      params.topThickness,
      params.width
    );
    
    // Choose material based on selected type
    let topMaterial;
    switch (params.topMaterial) {
      case 'glass':
        topMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(params.topColor),
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.7,
          transparent: true,
          opacity: 0.8
        });
        break;
      case 'metal':
        topMaterial = createStandardMaterial(params.topColor, 0.3, 0.8);
        break;
      case 'wood':
      default:
        topMaterial = createStandardMaterial(params.topColor, 0.6, 0.0);
        break;
    }
    
    const desktop = new THREE.Mesh(desktopGeometry, topMaterial);
    desktop.position.y = params.height - params.topThickness / 2;
    desktop.castShadow = true;
    desktop.receiveShadow = true;
    desktop.name = 'Desktop';
    desk.add(desktop);
    
    // Create legs
    const legMaterial = params.legMaterial === 'metal' 
      ? createStandardMaterial(params.legColor, 0.2, 0.8)
      : createStandardMaterial(params.legColor, 0.6, 0.0);
    
    // Leg positions
    const legPositions = [
      { x: params.length / 2 - 0.05, z: params.width / 2 - 0.05 },
      { x: -params.length / 2 + 0.05, z: params.width / 2 - 0.05 },
      { x: -params.length / 2 + 0.05, z: -params.width / 2 + 0.05 },
      { x: params.length / 2 - 0.05, z: -params.width / 2 + 0.05 }
    ];
    
    // Create legs based on type
    switch (params.legType) {
      case 'round':
        legPositions.forEach((pos, index) => {
          const legGeometry = new THREE.CylinderGeometry(0.025, 0.025, params.height, 12);
          const leg = new THREE.Mesh(legGeometry, legMaterial);
          leg.position.set(pos.x, params.height / 2, pos.z);
          leg.castShadow = true;
          leg.name = `Leg_${index}`;
          desk.add(leg);
        });
        break;
        
      case 'aframe':
        // Create A-frame legs
        const aFrameLeft = new THREE.Group();
        aFrameLeft.name = 'AFrame_Left';
        
        const leftLeg1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, params.height, 0.05),
          legMaterial
        );
        leftLeg1.position.set(-params.length / 2 + 0.05, params.height / 2, params.width / 2 - 0.05);
        
        const leftLeg2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, params.height, 0.05),
          legMaterial
        );
        leftLeg2.position.set(-params.length / 2 + 0.05, params.height / 2, -params.width / 2 + 0.05);
        
        const leftCrossbar = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.05, params.width - 0.1),
          legMaterial
        );
        leftCrossbar.position.set(-params.length / 2 + 0.05, params.height / 3, 0);
        
        aFrameLeft.add(leftLeg1, leftLeg2, leftCrossbar);
        
        const aFrameRight = new THREE.Group();
        aFrameRight.name = 'AFrame_Right';
        
        const rightLeg1 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, params.height, 0.05),
          legMaterial
        );
        rightLeg1.position.set(params.length / 2 - 0.05, params.height / 2, params.width / 2 - 0.05);
        
        const rightLeg2 = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, params.height, 0.05),
          legMaterial
        );
        rightLeg2.position.set(params.length / 2 - 0.05, params.height / 2, -params.width / 2 + 0.05);
        
        const rightCrossbar = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.05, params.width - 0.1),
          legMaterial
        );
        rightCrossbar.position.set(params.length / 2 - 0.05, params.height / 3, 0);
        
        aFrameRight.add(rightLeg1, rightLeg2, rightCrossbar);
        
        // Connect the frames with a bar
        const connectingBar = new THREE.Mesh(
          new THREE.BoxGeometry(params.length - 0.1, 0.05, 0.05),
          legMaterial
        );
        connectingBar.position.set(0, params.height / 3, 0);
        
        desk.add(aFrameLeft, aFrameRight, connectingBar);
        break;
        
      case 'square':
      default:
        legPositions.forEach((pos, index) => {
          const legGeometry = new THREE.BoxGeometry(0.05, params.height, 0.05);
          const leg = new THREE.Mesh(legGeometry, legMaterial);
          leg.position.set(pos.x, params.height / 2, pos.z);
          leg.castShadow = true;
          leg.name = `Leg_${index}`;
          desk.add(leg);
        });
        
        // Add crossbars for stability
        const frontBar = new THREE.Mesh(
          new THREE.BoxGeometry(params.length - 0.1, 0.04, 0.04),
          legMaterial
        );
        frontBar.position.set(0, params.height / 4, params.width / 2 - 0.05);
        
        const backBar = new THREE.Mesh(
          new THREE.BoxGeometry(params.length - 0.1, 0.04, 0.04),
          legMaterial
        );
        backBar.position.set(0, params.height / 4, -params.width / 2 + 0.05);
        
        const leftBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.04, params.width - 0.1),
          legMaterial
        );
        leftBar.position.set(-params.length / 2 + 0.05, params.height / 4, 0);
        
        const rightBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.04, params.width - 0.1),
          legMaterial
        );
        rightBar.position.set(params.length / 2 - 0.05, params.height / 4, 0);
        
        desk.add(frontBar, backBar, leftBar, rightBar);
        break;
    }
    
    // Add drawer if needed
    if (params.hasDrawer) {
      const drawerWidth = 0.4;
      const drawerHeight = 0.12;
      const drawerDepth = params.width - 0.1;
      
      const drawerX = params.drawerSide === 'left' 
        ? -params.length / 2 + drawerWidth / 2 + 0.05 
        : params.length / 2 - drawerWidth / 2 - 0.05;
      
      const drawerGroup = new THREE.Group();
      drawerGroup.name = 'Drawer';
      
      // Drawer body
      const drawerBodyGeometry = new THREE.BoxGeometry(
        drawerWidth - 0.02,
        drawerHeight - 0.02,
        drawerDepth - 0.02
      );
      const drawerBodyMaterial = createStandardMaterial(params.topColor, 0.7, 0.0);
      const drawerBody = new THREE.Mesh(drawerBodyGeometry, drawerBodyMaterial);
      drawerBody.position.set(0, 0, 0);
      drawerGroup.add(drawerBody);
      
      // Drawer handle
      const handleGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.02);
      const handleMaterial = createStandardMaterial('#555555', 0.2, 0.7);
      const handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(params.drawerSide === 'left' ? drawerWidth / 2 - 0.03 : -drawerWidth / 2 + 0.03, 0, -drawerDepth / 2);
      drawerGroup.add(handle);
      
      drawerGroup.position.set(
        drawerX,
        params.height - params.topThickness - drawerHeight / 2 - 0.01,
        0
      );
      
      desk.add(drawerGroup);
    }
    
    // Position everything
    desk.position.y = 0;
    
    return desk;
  },
  
  updateModel: async (model, params) => {
    // Implementation would update the existing model with new parameters
    // This is a simplified approach - a full implementation would adjust
    // the geometry and materials without recreating the entire model
    const parent = model.parent;
    const position = model.position.clone();
    const rotation = model.rotation.clone();
    const scale = model.scale.clone();
    
    // Remove old model
    if (parent) parent.remove(model);
    
    // Create new model with updated parameters
    const newModel = await deskPrototype.createModel(params);
    
    // Restore transform
    newModel.position.copy(position);
    newModel.rotation.copy(rotation);
    newModel.scale.copy(scale);
    
    // Add back to parent
    if (parent) parent.add(newModel);
    
    return newModel;
  }
};

/**
 * Bookshelf model prototype
 */
export const bookshelfPrototype: ModelPrototype = {
  id: 'bookshelf',
  name: 'Bookshelf',
  category: 'Furniture',
  description: 'A customizable bookshelf for your study room',
  parameters: [
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      default: 1.0,
      min: 0.6,
      max: 2.0,
      step: 0.1,
      unit: 'm'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      default: 2.0,
      min: 1.0,
      max: 3.0,
      step: 0.1,
      unit: 'm'
    },
    {
      id: 'depth',
      name: 'Depth',
      type: 'number',
      default: 0.35,
      min: 0.2,
      max: 0.5,
      step: 0.05,
      unit: 'm'
    },
    {
      id: 'shelfCount',
      name: 'Shelf Count',
      type: 'number',
      default: 4,
      min: 2,
      max: 8,
      step: 1
    },
    {
      id: 'color',
      name: 'Color',
      type: 'color',
      default: '#5c4033'
    },
    {
      id: 'hasBackPanel',
      name: 'Has Back Panel',
      type: 'boolean',
      default: true
    },
    {
      id: 'hasDoors',
      name: 'Has Doors',
      type: 'boolean',
      default: false
    },
    {
      id: 'doorType',
      name: 'Door Type',
      type: 'select',
      default: 'wood',
      options: [
        { label: 'Wood', value: 'wood' },
        { label: 'Glass', value: 'glass' }
      ]
    }
  ],
  createModel: async (params) => {
    const bookshelf = new THREE.Group();
    bookshelf.name = 'Bookshelf';
    
    const material = createStandardMaterial(params.color, 0.7, 0.0);
    const panelThickness = 0.02;
    const shelfThickness = 0.03;
    
    // Create frame
    const leftPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelThickness, params.height, params.depth),
      material
    );
    leftPanel.position.set(-params.width / 2 + panelThickness / 2, params.height / 2, 0);
    leftPanel.castShadow = true;
    leftPanel.receiveShadow = true;
    leftPanel.name = 'LeftPanel';
    bookshelf.add(leftPanel);
    
    const rightPanel = new THREE.Mesh(
      new THREE.BoxGeometry(panelThickness, params.height, params.depth),
      material
    );
    rightPanel.position.set(params.width / 2 - panelThickness / 2, params.height / 2, 0);
    rightPanel.castShadow = true;
    rightPanel.receiveShadow = true;
    rightPanel.name = 'RightPanel';
    bookshelf.add(rightPanel);
    
    const topPanel = new THREE.Mesh(
      new THREE.BoxGeometry(params.width, panelThickness, params.depth),
      material
    );
    topPanel.position.set(0, params.height - panelThickness / 2, 0);
    topPanel.castShadow = true;
    topPanel.receiveShadow = true;
    topPanel.name = 'TopPanel';
    bookshelf.add(topPanel);
    
    const bottomPanel = new THREE.Mesh(
      new THREE.BoxGeometry(params.width, panelThickness, params.depth),
      material
    );
    bottomPanel.position.set(0, panelThickness / 2, 0);
    bottomPanel.castShadow = true;
    bottomPanel.receiveShadow = true;
    bottomPanel.name = 'BottomPanel';
    bookshelf.add(bottomPanel);
    
    // Create shelves
    const shelfHeight = (params.height - 2 * panelThickness) / (params.shelfCount + 1);
    for (let i = 1; i <= params.shelfCount; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(params.width - 2 * panelThickness, shelfThickness, params.depth - panelThickness),
        material
      );
      shelf.position.set(0, i * shelfHeight, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      shelf.name = `Shelf_${i}`;
      bookshelf.add(shelf);
    }
    
    // Create back panel if needed
    if (params.hasBackPanel) {
      const backPanel = new THREE.Mesh(
        new THREE.BoxGeometry(params.width - 2 * panelThickness, params.height - 2 * panelThickness, panelThickness),
        material
      );
      backPanel.position.set(0, params.height / 2, -params.depth / 2 + panelThickness / 2);
      backPanel.castShadow = true;
      backPanel.receiveShadow = true;
      backPanel.name = 'BackPanel';
      bookshelf.add(backPanel);
    }
    
    // Create doors if needed
    if (params.hasDoors) {
      const doorWidth = (params.width - 2 * panelThickness) / 2;
      const doorHeight = params.height - 2 * panelThickness;
      
      let doorMaterial;
      if (params.doorType === 'glass') {
        doorMaterial = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#ffffff'),
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.7,
          transparent: true,
          opacity: 0.8
        });
      } else {
        doorMaterial = createStandardMaterial(params.color, 0.7, 0.0);
      }
      
      const leftDoor = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, panelThickness),
        doorMaterial
      );
      leftDoor.position.set(-doorWidth / 2, params.height / 2, params.depth / 2 - panelThickness / 2);
      leftDoor.castShadow = true;
      leftDoor.name = 'LeftDoor';
      bookshelf.add(leftDoor);
      
      const rightDoor = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, doorHeight, panelThickness),
        doorMaterial
      );
      rightDoor.position.set(doorWidth / 2, params.height / 2, params.depth / 2 - panelThickness / 2);
      rightDoor.castShadow = true;
      rightDoor.name = 'RightDoor';
      bookshelf.add(rightDoor);
      
      // Door handles
      const handleMaterial = createStandardMaterial('#555555', 0.2, 0.7);
      
      const leftHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
        handleMaterial
      );
      leftHandle.rotation.x = Math.PI / 2;
      leftHandle.position.set(-doorWidth + 0.1, params.height / 2, params.depth / 2);
      leftHandle.name = 'LeftHandle';
      bookshelf.add(leftHandle);
      
      const rightHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8),
        handleMaterial
      );
      rightHandle.rotation.x = Math.PI / 2;
      rightHandle.position.set(doorWidth - 0.1, params.height / 2, params.depth / 2);
      rightHandle.name = 'RightHandle';
      bookshelf.add(rightHandle);
    }
    
    return bookshelf;
  },
  
  updateModel: async (model, params) => {
    // Similar implementation as deskPrototype.updateModel
    const parent = model.parent;
    const position = model.position.clone();
    const rotation = model.rotation.clone();
    const scale = model.scale.clone();
    
    // Remove old model
    if (parent) parent.remove(model);
    
    // Create new model with updated parameters
    const newModel = await bookshelfPrototype.createModel(params);
    
    // Restore transform
    newModel.position.copy(position);
    newModel.rotation.copy(rotation);
    newModel.scale.copy(scale);
    
    // Add back to parent
    if (parent) parent.add(newModel);
    
    return newModel;
  }
};

/**
 * Cabinet model prototype
 */
export const cabinetPrototype: ModelPrototype = {
  id: 'cabinet',
  name: 'Cabinet',
  category: 'Furniture',
  description: 'A customizable cabinet for your study room',
  parameters: [
    {
      id: 'width',
      name: 'Width',
      type: 'number',
      default: 0.8,
      min: 0.4,
      max: 1.5,
      step: 0.1,
      unit: 'm'
    },
    {
      id: 'height',
      name: 'Height',
      type: 'number',
      default: 1.2,
      min: 0.8,
      max: 2.0,
      step: 0.1,
      unit: 'm'
    },
    {
      id: 'depth',
      name: 'Depth',
      type: 'number',
      default: 0.5,
      min: 0.3,
      max: 0.7,
      step: 0.05,
      unit: 'm'
    },
    {
      id: 'drawerCount',
      name: 'Drawer Count',
      type: 'number',
      default: 3,
      min: 1,
      max: 5,
      step: 1
    },
    {
      id: 'color',
      name: 'Color',
      type: 'color',
      default: '#6b5540'
    },
    {
      id: 'handleType',
      name: 'Handle Type',
      type: 'select',
      default: 'modern',
      options: [
        { label: 'Modern', value: 'modern' },
        { label: 'Classic', value: 'classic' },
        { label: 'Minimal', value: 'minimal' }
      ]
    }
  ],
  createModel: async (params) => {
    const cabinet = new THREE.Group();
    cabinet.name = 'Cabinet';
    
    const material = createStandardMaterial(params.color, 0.7, 0.0);
    const panelThickness = 0.02;
    
    // Create cabinet body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(params.width, params.height, params.depth),
      material
    );
    body.position.set(0, params.height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'CabinetBody';
    
    // Create inner cutout
    const innerWidth = params.width - 2 * panelThickness;
    const innerHeight = params.height - 2 * panelThickness;
    const innerDepth = params.depth - panelThickness;
    
    const innerCutout = new THREE.Mesh(
      new THREE.BoxGeometry(innerWidth, innerHeight, innerDepth),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    innerCutout.position.set(0, 0, panelThickness / 2);
    body.add(innerCutout);
    
    cabinet.add(body);
    
    // Create drawers
    const drawerHeight = (params.height - 2 * panelThickness) / params.drawerCount;
    const drawerWidth = params.width - 2 * panelThickness - 0.01;
    const drawerDepth = params.depth - panelThickness - 0.01;
    
    for (let i = 0; i < params.drawerCount; i++) {
      const drawerGroup = new THREE.Group();
      drawerGroup.name = `Drawer_${i + 1}`;
      
      const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(drawerWidth, drawerHeight - 0.01, drawerDepth),
        material
      );
      drawer.position.set(0, 0, 0);
      drawer.castShadow = true;
      drawer.receiveShadow = true;
      drawerGroup.add(drawer);
      
      // Add handle based on type
      const handleMaterial = createStandardMaterial('#555555', 0.2, 0.7);
      let handle;
      
      switch (params.handleType) {
        case 'classic':
          handle = new THREE.Mesh(
            new THREE.TorusGeometry(0.03, 0.01, 8, 16, Math.PI),
            handleMaterial
          );
          handle.rotation.x = Math.PI / 2;
          handle.position.set(0, 0, drawerDepth / 2 + 0.01);
          break;
          
        case 'minimal':
          handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.015, 0.015),
            handleMaterial
          );
          handle.position.set(0, 0, drawerDepth / 2 + 0.01);
          break;
          
        case 'modern':
        default:
          handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8),
            handleMaterial
          );
          handle.rotation.z = Math.PI / 2;
          handle.position.set(0, 0, drawerDepth / 2 + 0.01);
          break;
      }
      
      drawerGroup.add(handle);
      
      drawerGroup.position.set(
        0,
        panelThickness + i * drawerHeight + drawerHeight / 2,
        0
      );
      
      cabinet.add(drawerGroup);
    }
    
    // Add legs
    const legHeight = 0.1;
    const legRadius = 0.02;
    const legMaterial = createStandardMaterial('#333333', 0.2, 0.7);
    
    const legPositions = [
      { x: params.width / 2 - legRadius, z: params.depth / 2 - legRadius },
      { x: -params.width / 2 + legRadius, z: params.depth / 2 - legRadius },
      { x: -params.width / 2 + legRadius, z: -params.depth / 2 + legRadius },
      { x: params.width / 2 - legRadius, z: -params.depth / 2 + legRadius }
    ];
    
    legPositions.forEach((pos, index) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8),
        legMaterial
      );
      leg.position.set(pos.x, -params.height / 2 - legHeight / 2, pos.z);
      leg.castShadow = true;
      leg.name = `Leg_${index}`;
      cabinet.add(leg);
    });
    
    return cabinet;
  },
  
  updateModel: async (model, params) => {
    // Similar implementation as other prototype update methods
    const parent = model.parent;
    const position = model.position.clone();
    const rotation = model.rotation.clone();
    const scale = model.scale.clone();
    
    // Remove old model
    if (parent) parent.remove(model);
    
    // Create new model with updated parameters
    const newModel = await cabinetPrototype.createModel(params);
    
    // Restore transform
    newModel.position.copy(position);
    newModel.rotation.copy(rotation);
    newModel.scale.copy(scale);
    
    // Add back to parent
    if (parent) parent.add(newModel);
    
    return newModel;
  }
};

/**
 * Get all available prototypes
 */
export function getAllPrototypes(): ModelPrototype[] {
  return [deskPrototype, bookshelfPrototype, cabinetPrototype];
}

/**
 * Get a prototype by ID
 */
export function getPrototypeById(id: string): ModelPrototype | undefined {
  return getAllPrototypes().find(prototype => prototype.id === id);
}
