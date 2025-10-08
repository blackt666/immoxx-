import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Plane, Text } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Save,
  Trash2,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Layers,
  Home,
  DoorOpen,
  Maximize,
  Square,
  Circle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Wall {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  height: number;
  thickness: number;
}

interface Room {
  id: string;
  name: string;
  corners: [number, number][];
  color: string;
}

interface FloorPlanData {
  walls: Wall[];
  rooms: Room[];
  dimensions: { width: number; length: number; height: number };
}

// 3D Wall Component
function Wall3D({ wall }: { wall: Wall }) {
  const midpoint = [
    (wall.start[0] + wall.end[0]) / 2,
    wall.height / 2,
    (wall.start[2] + wall.end[2]) / 2,
  ];
  const length = Math.sqrt(
    Math.pow(wall.end[0] - wall.start[0], 2) +
    Math.pow(wall.end[2] - wall.start[2], 2)
  );
  const angle = Math.atan2(wall.end[2] - wall.start[2], wall.end[0] - wall.start[0]);

  return (
    <Box
      position={midpoint as [number, number, number]}
      rotation={[0, angle, 0]}
      args={[length, wall.height, wall.thickness]}
    >
      <meshStandardMaterial color="#566B73" />
    </Box>
  );
}

// 3D Room Floor Component
function RoomFloor({ room }: { room: Room }) {
  // Calculate center and size of room for simple rectangular representation
  const minX = Math.min(...room.corners.map(c => c[0]));
  const maxX = Math.max(...room.corners.map(c => c[0]));
  const minZ = Math.min(...room.corners.map(c => c[1]));
  const maxZ = Math.max(...room.corners.map(c => c[1]));
  
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const width = maxX - minX;
  const depth = maxZ - minZ;

  return (
    <group>
      <Plane
        position={[centerX, 0.01, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        args={[width, depth]}
      >
        <meshStandardMaterial color={room.color} opacity={0.5} transparent />
      </Plane>
      <Text
        position={[centerX, 0.1, centerZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.5}
        color="#000"
      >
        {room.name}
      </Text>
    </group>
  );
}

// 3D Scene Component
function Scene({ planData }: { planData: FloorPlanData }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, 10, -5]} intensity={0.5} />
      
      {/* Grid */}
      <Grid args={[20, 20]} cellSize={1} cellColor="#D9CDBF" sectionColor="#6585BC" />
      
      {/* Walls */}
      {planData.walls.map(wall => (
        <Wall3D key={wall.id} wall={wall} />
      ))}
      
      {/* Room Floors */}
      {planData.rooms.map(room => (
        <RoomFloor key={room.id} room={room} />
      ))}
      
      {/* Ground Plane */}
      <Plane
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        args={[20, 20]}
      >
        <meshStandardMaterial color="#F5F5F5" />
      </Plane>
      
      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={50}
      />
    </>
  );
}

export default function FloorPlanner3D() {
  const { toast } = useToast();
  const [planName, setPlanName] = useState('Neuer Grundriss');
  const [floorLevel, setFloorLevel] = useState('ground');
  const [selectedTool, setSelectedTool] = useState<'wall' | 'room' | 'door' | null>(null);
  
  // Sample floor plan data
  const [planData, setPlanData] = useState<FloorPlanData>({
    walls: [
      {
        id: '1',
        start: [-5, 0, -5],
        end: [5, 0, -5],
        height: 3,
        thickness: 0.2
      },
      {
        id: '2',
        start: [5, 0, -5],
        end: [5, 0, 5],
        height: 3,
        thickness: 0.2
      },
      {
        id: '3',
        start: [5, 0, 5],
        end: [-5, 0, 5],
        height: 3,
        thickness: 0.2
      },
      {
        id: '4',
        start: [-5, 0, 5],
        end: [-5, 0, -5],
        height: 3,
        thickness: 0.2
      },
      {
        id: '5',
        start: [0, 0, -5],
        end: [0, 0, 5],
        height: 3,
        thickness: 0.2
      }
    ],
    rooms: [
      {
        id: 'r1',
        name: 'Wohnzimmer',
        corners: [[-5, -5], [0, -5], [0, 5], [-5, 5]],
        color: '#D9CDBF'
      },
      {
        id: 'r2',
        name: 'Küche',
        corners: [[0, -5], [5, -5], [5, 5], [0, 5]],
        color: '#6585BC'
      }
    ],
    dimensions: { width: 10, length: 10, height: 3 }
  });

  const handleSave = async () => {
    try {
      toast({
        title: 'Grundriss gespeichert',
        description: `"${planName}" wurde erfolgreich gespeichert.`,
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Grundriss konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleAddWall = () => {
    setSelectedTool('wall');
    toast({
      title: 'Wand-Werkzeug aktiviert',
      description: 'Klicken Sie in der 3D-Ansicht, um eine Wand zu platzieren.',
    });
  };

  const handleAddRoom = () => {
    setSelectedTool('room');
    toast({
      title: 'Raum-Werkzeug aktiviert',
      description: 'Zeichnen Sie einen Raum in der 2D-Ansicht.',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>
            3D Grundriss-Planer
          </h2>
          <p className="text-gray-600">
            Erstellen und visualisieren Sie Grundrisse in 3D
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        {/* Sidebar - Tools and Properties */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Grundriss-Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Name</Label>
                <Input
                  id="plan-name"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="z.B. Erdgeschoss"
                />
              </div>
              <div>
                <Label htmlFor="floor-level">Etage</Label>
                <Select value={floorLevel} onValueChange={setFloorLevel}>
                  <SelectTrigger id="floor-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basement">Keller</SelectItem>
                    <SelectItem value="ground">Erdgeschoss</SelectItem>
                    <SelectItem value="first">1. Obergeschoss</SelectItem>
                    <SelectItem value="second">2. Obergeschoss</SelectItem>
                    <SelectItem value="attic">Dachgeschoss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 border-t">
                <Label>Gesamtfläche</Label>
                <p className="text-2xl font-bold text-[var(--bodensee-water)]">
                  {planData.dimensions.width * planData.dimensions.length} m²
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Werkzeuge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedTool === 'wall' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={handleAddWall}
              >
                <Square className="w-4 h-4 mr-2" />
                Wand hinzufügen
              </Button>
              <Button
                variant={selectedTool === 'room' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={handleAddRoom}
              >
                <Home className="w-4 h-4 mr-2" />
                Raum hinzufügen
              </Button>
              <Button
                variant={selectedTool === 'door' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedTool('door')}
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                Tür hinzufügen
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Circle className="w-4 h-4 mr-2" />
                Fenster hinzufügen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Räume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {planData.rooms.map(room => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: room.color }}
                    />
                    <span className="text-sm font-medium">{room.name}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={handleAddRoom}>
                <Plus className="w-4 h-4 mr-2" />
                Raum hinzufügen
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas Area */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-12rem)]">
            <CardContent className="p-0 h-full">
              <Tabs defaultValue="3d" className="h-full flex flex-col">
                <div className="px-4 pt-4 border-b">
                  <TabsList>
                    <TabsTrigger value="3d">3D Ansicht</TabsTrigger>
                    <TabsTrigger value="2d">2D Ansicht</TabsTrigger>
                    <TabsTrigger value="settings">Einstellungen</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="3d" className="flex-1 m-0 p-4">
                  <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                    <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                      <Suspense fallback={null}>
                        <Scene planData={planData} />
                      </Suspense>
                    </Canvas>
                  </div>
                  
                  {/* 3D View Controls */}
                  <div className="absolute bottom-6 right-6 flex gap-2">
                    <Button size="sm" variant="secondary">
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="2d" className="flex-1 m-0 p-4">
                  <div className="w-full h-full bg-white border-2 border-dashed rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Grid3x3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">2D Ansicht</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Zeichnen Sie Grundrisse in der 2D-Ansicht
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="flex-1 m-0 p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ansichtseinstellungen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Maßeinheit</Label>
                        <Select defaultValue="metric">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="metric">Metrisch (m)</SelectItem>
                            <SelectItem value="imperial">Imperial (ft)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Gitterauflösung</Label>
                        <Input type="number" defaultValue="1" step="0.1" />
                      </div>
                      <div>
                        <Label>Wandhöhe (Standard)</Label>
                        <Input type="number" defaultValue="3" step="0.1" />
                      </div>
                      <div>
                        <Label>Wandstärke (Standard)</Label>
                        <Input type="number" defaultValue="0.2" step="0.01" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
