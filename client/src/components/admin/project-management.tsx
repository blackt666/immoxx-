import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Users,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Play,
  Pause,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Project {
  id: number;
  name: string;
  description: string;
  projectType: string;
  status: string;
  progress: number;
  priority: string;
  startDate: string;
  endDate: string;
  estimatedBudget: number;
  actualBudget: number;
  currency: string;
  projectManager: number;
  assignedTo: number;
  createdAt: string;
  updatedAt: string;
}

interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  assignedTo: number;
  estimatedHours: number;
  actualHours: number;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusIcons = {
  planning: Clock,
  in_progress: Play,
  on_hold: Pause,
  completed: CheckCircle2,
  cancelled: AlertCircle,
};

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: (project: Project) => void; onDelete: (id: number) => void }) {
  const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge className={priorityColors[project.priority as keyof typeof priorityColors]}>
                {project.priority}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Fortschritt</span>
              <span className="font-semibold text-[var(--bodensee-water)]">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Start
              </p>
              <p className="font-medium">{new Date(project.startDate).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <p className="text-gray-600 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Ende
              </p>
              <p className="font-medium">{new Date(project.endDate).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <p className="text-gray-600">Budget</p>
              <p className="font-semibold text-[var(--bodensee-water)]">
                {project.estimatedBudget?.toLocaleString('de-DE')} {project.currency}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Ausgaben</p>
              <p className="font-semibold">
                {project.actualBudget?.toLocaleString('de-DE')} {project.currency}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(project)}>
              <Edit className="w-3 h-3 mr-1" />
              Bearbeiten
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(project.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewProjectDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'construction',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      projectType: 'construction',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      estimatedBudget: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Projekt erstellen</DialogTitle>
          <DialogDescription>
            Erstellen Sie ein neues Bau- oder Renovierungsprojekt
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Projektname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Renovierung Villa Konstanz"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Projektbeschreibung..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectType">Projekttyp</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                >
                  <SelectTrigger id="projectType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Neubau</SelectItem>
                    <SelectItem value="renovation">Renovierung</SelectItem>
                    <SelectItem value="development">Entwicklung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priorität</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="urgent">Dringend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Enddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="estimatedBudget">Budget (EUR)</Label>
              <Input
                id="estimatedBudget"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="z.B. 250000"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">Projekt erstellen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest<Project[]>('/api/projects'),
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: (data: any) => apiRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Projekt erstellt',
        description: 'Das Projekt wurde erfolgreich erstellt.',
      });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Das Projekt konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    },
  });

  // Delete project mutation
  const deleteProject = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: 'Projekt gelöscht',
        description: 'Das Projekt wurde erfolgreich gelöscht.',
      });
    },
  });

  // Filter projects
  const filteredProjects = projects.filter((project: Project) => {
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: projects.length,
    inProgress: projects.filter((p: Project) => p.status === 'in_progress').length,
    completed: projects.filter((p: Project) => p.status === 'completed').length,
    onHold: projects.filter((p: Project) => p.status === 'on_hold').length,
    totalBudget: projects.reduce((sum: number, p: Project) => sum + (p.estimatedBudget || 0), 0),
    totalSpent: projects.reduce((sum: number, p: Project) => sum + (p.actualBudget || 0), 0),
  };

  const handleEdit = (project: Project) => {
    toast({
      title: 'Bearbeiten',
      description: `Bearbeiten Sie "${project.name}" (wird noch implementiert)`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>
            Projektmanagement
          </h2>
          <p className="text-gray-600">
            Verwalten Sie Ihre Bau- und Entwicklungsprojekte
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Projekt
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--bodensee-deep)' }}>
                  {stats.total}
                </p>
              </div>
              <FolderKanban className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Arbeit</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.inProgress}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget gesamt</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--bodensee-water)' }}>
                  {stats.totalBudget.toLocaleString('de-DE')}€
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Projekte durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="planning">Planung</SelectItem>
                <SelectItem value="in_progress">In Arbeit</SelectItem>
                <SelectItem value="on_hold">Pausiert</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgebrochen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[var(--bodensee-water)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Lade Projekte...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Projekte gefunden
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'Keine Projekte entsprechen den aktuellen Filtern.'
                  : 'Erstellen Sie Ihr erstes Projekt, um loszulegen.'}
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Neues Projekt
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={(id) => deleteProject.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* New Project Dialog */}
      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(data) => createProject.mutate(data)}
      />
    </div>
  );
}
