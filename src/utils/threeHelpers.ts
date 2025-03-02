
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { PickResult } from '@/types';

/**
 * Sets up a basic Three.js scene with lighting and controls
 */
export function setupScene(container: HTMLElement): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  transformControls: TransformControls;
  animate: () => void;
} {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f9fa);

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Add a soft fill light from the opposite direction
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 8, -10);
  scene.add(fillLight);

  // Add a subtle blue backlight
  const backLight = new THREE.DirectionalLight(0xb0c4de, 0.4);
  backLight.position.set(0, 0, -10);
  scene.add(backLight);

  // Add grid helper
  const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
  scene.add(gridHelper);

  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add transform controls
  const transformControls = new TransformControls(camera, renderer.domElement);
  scene.add(transformControls);

  // Transform controls override orbit controls when active
  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
  });

  // Handle window resize
  const handleResize = () => {
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener('resize', handleResize);

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  return { scene, camera, renderer, controls, transformControls, animate };
}

/**
 * Performs raycasting to select objects in the scene
 */
export function pickObject(
  event: MouseEvent,
  container: HTMLElement,
  camera: THREE.Camera,
  scene: THREE.Scene
): PickResult | null {
  const rect = container.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x, y }, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    return {
      object: intersect.object,
      face: intersect.faceIndex,
      point: intersect.point,
      distance: intersect.distance,
      isFace: intersect.faceIndex !== undefined
    };
  }

  return null;
}

/**
 * Updates an object's transform properties based on a TransformControls change
 */
export function getTransformFromObject(object: THREE.Object3D) {
  return {
    position: new THREE.Vector3().copy(object.position),
    rotation: new THREE.Euler().copy(object.rotation),
    scale: new THREE.Vector3().copy(object.scale)
  };
}

/**
 * Helper to create a standard material
 */
export function createStandardMaterial(
  color: string = '#ffffff',
  roughness: number = 0.5,
  metalness: number = 0.0
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    side: THREE.DoubleSide
  });
}

/**
 * Helper to highlight a selected object or face
 */
export function highlightObject(
  object: THREE.Object3D,
  faceIndex?: number
): void {
  // Reset all materials
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.userData.originalMaterial) {
        child.material = child.userData.originalMaterial;
      }
    }
  });

  // If object is a mesh, highlight it
  if (object instanceof THREE.Mesh) {
    // Store original material if not already stored
    if (!object.userData.originalMaterial) {
      object.userData.originalMaterial = object.material;
    }

    // Create emissive variant for highlighting
    const originalMaterial = object.userData.originalMaterial as THREE.Material;
    
    if (faceIndex !== undefined && originalMaterial instanceof THREE.MeshStandardMaterial) {
      // Clone the material for face-specific highlighting
      const materials = Array.isArray(object.material) 
        ? [...object.material] 
        : [object.material];
        
      const highlightMaterial = originalMaterial.clone();
      highlightMaterial.emissive = new THREE.Color(0x2a6dd5);
      highlightMaterial.emissiveIntensity = 0.5;
      
      // Replace just the material for the selected face
      if (Array.isArray(object.material)) {
        materials[faceIndex] = highlightMaterial;
        object.material = materials;
      } else {
        object.material = highlightMaterial;
      }
    } else {
      // Full object highlighting
      const highlightMaterial = new THREE.MeshStandardMaterial({
        color: originalMaterial instanceof THREE.MeshStandardMaterial 
          ? originalMaterial.color 
          : new THREE.Color(0xffffff),
        emissive: new THREE.Color(0x0066ff),
        emissiveIntensity: 0.2,
        roughness: originalMaterial instanceof THREE.MeshStandardMaterial 
          ? originalMaterial.roughness 
          : 0.5,
        metalness: originalMaterial instanceof THREE.MeshStandardMaterial 
          ? originalMaterial.metalness 
          : 0.0
      });
      object.material = highlightMaterial;
    }
  }
}

/**
 * Helper to clear highlighting
 */
export function clearHighlights(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.userData.originalMaterial) {
      object.material = object.userData.originalMaterial;
    }
  });
}

/**
 * Helper to find an object by its user-defined ID
 */
export function findObjectById(
  scene: THREE.Scene,
  id: string
): THREE.Object3D | null {
  let foundObject: THREE.Object3D | null = null;
  
  scene.traverse((object) => {
    if (object.userData.id === id) {
      foundObject = object;
    }
  });
  
  return foundObject;
}

/**
 * Helper to dispose of Three.js objects properly
 */
export function disposeObject(object: THREE.Object3D): void {
  if (!object) return;
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => disposeMaterial(material));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

/**
 * Helper to dispose of material and its textures
 */
function disposeMaterial(material: THREE.Material): void {
  // Dispose textures
  Object.keys(material).forEach((prop) => {
    if (material[prop] instanceof THREE.Texture) {
      material[prop].dispose();
    }
  });
  
  material.dispose();
}
