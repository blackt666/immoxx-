# 🎨 3D Architecture Generator - Implementation Guide

## 📋 Übersicht

Der 3D Architecture Generator ermöglicht die automatische Erstellung und Visualisierung von 3D-Modellen für Immobilien:

- 🏗️ **Grundriss-zu-3D** - Automatische Konvertierung von 2D Grundrissen
- 🎨 **AI-Generierung** - Text-zu-3D mit KI
- 📐 **Parametrische Modelle** - Anpassbare Vorlagen
- 🌐 **Web-Viewer** - Interactive 3D-Ansicht im Browser

## 🚀 Features

### 1. Input-Methoden

#### Grundriss-Upload
```typescript
// Unterstützte Formate: PDF, PNG, JPG
POST /api/3d/upload
- Upload Grundriss-Datei
- Automatische Raum-Erkennung (OpenCV)
- 3D-Modell-Generierung
```

#### Parametrische Eingabe
```typescript
// Manuelle Raum-Definition
POST /api/3d/generate
{
  "method": "parametric",
  "rooms": [
    { "type": "living_room", "width": 5.5, "height": 3.0, "length": 7.2 },
    { "type": "kitchen", "width": 3.5, "height": 3.0, "length": 4.0 }
  ]
}
```

#### AI-Generierung
```typescript
// Text-Beschreibung zu 3D
POST /api/3d/generate
{
  "method": "ai",
  "prompt": "Moderne 3-Zimmer-Wohnung mit offener Küche, großem Wohnzimmer und Balkon",
  "style": "modern"
}
```

### 2. 3D-Viewer Integration

```typescript
// Three.js Integration
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const viewer = new ThreeDViewer({
  container: document.getElementById('viewer'),
  model: '/uploads/models/property-123.glb',
  controls: true,
  lighting: 'realistic'
});
```

### 3. Export-Formate

- **GLTF/GLB** - Web-optimiert
- **FBX** - AutoCAD, Maya, Blender
- **OBJ** - Universal
- **STL** - 3D-Druck

## 📦 Installation

### Dependencies

```bash
npm install three @types/three
npm install opencv4nodejs  # Für Grundriss-Erkennung
npm install sharp           # Für Bild-Processing
```

### Blender Python API (Server-side)

```bash
# Blender installieren
apt-get install blender

# Python Dependencies
pip install bpy  # Blender als Python-Modul
```

## 🛠️ Implementierung

### Client-Side Components

```typescript
// client/src/modules/3d-architecture/components/ThreeDViewer.tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export function ThreeDViewer({ modelUrl }: { modelUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Load Model
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      scene.add(gltf.scene);
    });

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelUrl]);

  return <div ref={containerRef} className="w-full h-[600px]" />;
}
```

### Server-Side Service

```typescript
// server/services/3d-generation/ThreeDGeneratorService.ts
import { nanoid } from 'nanoid';
import { db } from '../../db.js';
import { threeDModels } from '../../../shared/schema.modules.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ThreeDGeneratorService {
  /**
   * Generate 3D model from floor plan image
   */
  async generateFromFloorPlan(imagePath: string, userId: string, propertyId?: string) {
    const modelId = nanoid();
    
    // 1. Process floor plan with OpenCV
    const rooms = await this.detectRooms(imagePath);
    
    // 2. Generate 3D model with Blender
    const modelPath = await this.generateBlenderModel(rooms, modelId);
    
    // 3. Save to database
    await db.insert(threeDModels).values({
      id: modelId,
      userId,
      propertyId,
      name: 'Generated from floor plan',
      modelType: 'floor_plan',
      sourceFile: imagePath,
      modelUrl: modelPath,
      generationMethod: 'upload',
      status: 'completed',
    });
    
    return { success: true, modelId, modelUrl: modelPath };
  }

  /**
   * Detect rooms from floor plan using OpenCV
   */
  private async detectRooms(imagePath: string) {
    // OpenCV processing
    // 1. Load image
    // 2. Edge detection
    // 3. Contour finding
    // 4. Room classification
    
    return [
      { type: 'living_room', bounds: { x: 0, y: 0, width: 5, height: 7 } },
      { type: 'kitchen', bounds: { x: 5, y: 0, width: 3, height: 4 } },
      // ... mehr Räume
    ];
  }

  /**
   * Generate 3D model using Blender Python API
   */
  private async generateBlenderModel(rooms: any[], modelId: string) {
    const blenderScript = `
import bpy
import json

# Clear scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Load room data
rooms = json.loads('${JSON.stringify(rooms)}')

# Generate 3D geometry
for room in rooms:
    # Create floor
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(room['bounds']['x'], room['bounds']['y'], 0)
    )
    cube = bpy.context.active_object
    cube.scale = (
        room['bounds']['width'],
        room['bounds']['height'],
        3.0  # Standard room height
    )

# Export as GLTF
bpy.ops.export_scene.gltf(
    filepath='/tmp/model-${modelId}.glb',
    export_format='GLB'
)
    `;

    // Execute Blender script
    await execAsync(`blender --background --python -c "${blenderScript}"`);
    
    return `/uploads/models/model-${modelId}.glb`;
  }

  /**
   * Generate from AI prompt
   */
  async generateFromPrompt(prompt: string, userId: string, propertyId?: string) {
    // TODO: Integrate with AI 3D generation service
    // Options: OpenAI Point-E, Stability AI, Custom models
    
    return {
      success: false,
      error: 'AI generation not yet implemented'
    };
  }

  /**
   * Generate from template
   */
  async generateFromTemplate(templateId: string, params: any, userId: string) {
    // Load template and customize with params
    
    return {
      success: false,
      error: 'Template generation not yet implemented'
    };
  }
}

export const threeDGeneratorService = new ThreeDGeneratorService();
```

### API Routes

```typescript
// server/routes/3d-generation.ts
import { Router } from 'express';
import multer from 'multer';
import { threeDGeneratorService } from '../services/3d-generation/ThreeDGeneratorService.js';

const router = Router();

const upload = multer({ dest: '/tmp/uploads' });

/**
 * POST /api/3d/upload
 * Upload and process floor plan
 */
router.post('/upload', upload.single('floorPlan'), async (req, res) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { propertyId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await threeDGeneratorService.generateFromFloorPlan(
      req.file.path,
      userId,
      propertyId
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process floor plan' });
  }
});

/**
 * POST /api/3d/generate
 * Generate 3D model from various inputs
 */
router.post('/generate', async (req, res) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { method, prompt, template, params, propertyId } = req.body;

    let result;
    
    if (method === 'ai' && prompt) {
      result = await threeDGeneratorService.generateFromPrompt(prompt, userId, propertyId);
    } else if (method === 'template' && template) {
      result = await threeDGeneratorService.generateFromTemplate(template, params, userId);
    } else {
      return res.status(400).json({ error: 'Invalid generation method' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate model' });
  }
});

/**
 * GET /api/3d/models
 * List user's 3D models
 */
router.get('/models', async (req, res) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    
    const models = await db
      .select()
      .from(threeDModels)
      .where(eq(threeDModels.userId, userId));

    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

/**
 * GET /api/3d/models/:id
 * Get specific model
 */
router.get('/models/:id', async (req, res) => {
  try {
    const userId = req.session?.user?.id || 'demo-user';
    const { id } = req.params;

    const [model] = await db
      .select()
      .from(threeDModels)
      .where(and(
        eq(threeDModels.id, id),
        eq(threeDModels.userId, userId)
      ));

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

/**
 * POST /api/3d/models/:id/export
 * Export model in different format
 */
router.post('/models/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body; // 'fbx', 'obj', 'stl'

    // TODO: Implement format conversion
    res.json({
      success: false,
      error: 'Export not yet implemented'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export model' });
  }
});

export default router;
```

## 🎯 Use Cases

### 1. Property Listing Enhancement

```typescript
// Add 3D model to property page
<PropertyDetails property={property}>
  {property.threeDModelId && (
    <ThreeDViewer modelUrl={property.threeDModelUrl} />
  )}
</PropertyDetails>
```

### 2. Virtual Tours

```typescript
// Combine with 360° images
<VirtualTour property={property}>
  <ThreeDViewer modelUrl={property.threeDModelUrl} />
  <PannellumViewer images={property.images360} />
</VirtualTour>
```

### 3. Renovation Planning

```typescript
// Before/After comparison
<ComparisonView>
  <ThreeDViewer modelUrl={currentModel} label="Vorher" />
  <ThreeDViewer modelUrl={renovatedModel} label="Nachher" />
</ComparisonView>
```

## 📊 Performance Optimization

### Model Optimization

```typescript
// Reduce polygon count for web
const optimizedModel = await optimizeModel(originalModel, {
  targetPolyCount: 50000,
  textureSize: 1024,
  compression: 'draco'
});
```

### Progressive Loading

```typescript
// Load low-poly version first, then high-quality
const viewer = new ThreeDViewer({
  modelUrl: property.threeDModelUrl,
  lowPolyUrl: property.threeDModelUrlLowPoly,
  progressive: true
});
```

## 🔒 Security

### File Upload Validation

```typescript
const allowedFormats = ['image/png', 'image/jpeg', 'application/pdf'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

if (!allowedFormats.includes(file.mimetype)) {
  throw new Error('Invalid file format');
}
if (file.size > maxFileSize) {
  throw new Error('File too large');
}
```

## 🧪 Testing

```typescript
describe('3D Generation', () => {
  test('generates model from floor plan', async () => {
    const result = await threeDGeneratorService.generateFromFloorPlan(
      '/test/fixtures/floor-plan.png',
      'test-user'
    );
    
    expect(result.success).toBe(true);
    expect(result.modelUrl).toBeDefined();
  });
});
```

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Blender Python API](https://docs.blender.org/api/current/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [GLTF Specification](https://github.com/KhronosGroup/glTF)

---

**Status**: 🚧 In Entwicklung  
**Version**: 0.1.0  
**Letzte Aktualisierung**: 2025-10-07
