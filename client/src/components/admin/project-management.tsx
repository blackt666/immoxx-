import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Filter,
  Download,
  Settings,
  Trash2,
  Edit,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: string;
  projectId: string;
  tags: string[];
  progress: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "on-hold" | "completed";
  startDate: string;
  endDate?: string;
  team: string[];
  progress: number;
  budget?: number;
  color: string;
}

// Mock data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Moderne Neugestaltung der Immobilien-Website",
    status: "active",
    startDate: "2025-10-01",
    endDate: "2025-12-31",
    team: ["Alice", "Bob", "Charlie"],
    progress: 45,
    budget: 15000,
    color: "#3b82f6",
  },
  {
    id: "2",
    name: "CRM Integration",
    description: "Integration des neuen CRM-Systems",
    status: "active",
    startDate: "2025-09-15",
    endDate: "2025-11-30",
    team: ["David", "Eve"],
    progress: 70,
    budget: 8000,
    color: "#10b981",
  },
  {
    id: "3",
    name: "Marketing Kampagne Q4",
    description: "Bodensee Immobilien Marketing Initiative",
    status: "active",
    startDate: "2025-10-08",
    endDate: "2025-12-31",
    team: ["Frank", "Grace", "Helen"],
    progress: 20,
    budget: 12000,
    color: "#f59e0b",
  },
];

const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Design Mockups erstellen",
    description: "Wireframes und High-Fidelity Designs für Homepage",
    status: "in-progress",
    priority: "high",
    assignee: "Alice",
    dueDate: "2025-10-15",
    projectId: "1",
    tags: ["design", "frontend"],
    progress: 60,
  },
  {
    id: "t2",
    title: "API Endpoints definieren",
    description: "REST API Spezifikation dokumentieren",
    status: "done",
    priority: "high",
    assignee: "David",
    dueDate: "2025-10-10",
    projectId: "2",
    tags: ["backend", "api"],
    progress: 100,
  },
  {
    id: "t3",
    title: "Social Media Content Plan",
    description: "Contentkalender für Q4 erstellen",
    status: "todo",
    priority: "medium",
    assignee: "Grace",
    dueDate: "2025-10-20",
    projectId: "3",
    tags: ["marketing", "social-media"],
    progress: 0,
  },
  {
    id: "t4",
    title: "Datenbank Migration",
    description: "Bestehende Daten ins neue CRM migrieren",
    status: "in-progress",
    priority: "urgent",
    assignee: "Eve",
    dueDate: "2025-10-12",
    projectId: "2",
    tags: ["backend", "database"],
    progress: 75,
  },
  {
    id: "t5",
    title: "SEO Optimierung",
    description: "Meta-Tags und Ladezeiten optimieren",
    status: "review",
    priority: "medium",
    assignee: "Bob",
    dueDate: "2025-10-18",
    projectId: "1",
    tags: ["seo", "performance"],
    progress: 90,
  },
];

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <Play className="w-4 h-4" />;
      case "review":
        return <AlertCircle className="w-4 h-4" />;
      case "done":
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "urgent":
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "done":
        return "bg-green-100 text-green-800";
    }
  };

  const filteredTasks = selectedProject
    ? tasks.filter((task) => task.projectId === selectedProject)
    : tasks;

  const tasksByStatus = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
    review: filteredTasks.filter((t) => t.status === "review"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--bodensee-deep)]">
            Projekt Management
          </h1>
          <p className="text-gray-600 mt-1">
            OptimAizeFlow - Verwalten Sie Ihre Projekte und Aufgaben effizient
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--bodensee-water)] hover:bg-[var(--bodensee-deep)]">
                <Plus className="w-4 h-4 mr-2" />
                Neues Projekt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Projekt erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie ein neues Projekt für Ihr Team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Projektname</Label>
                  <Input id="project-name" placeholder="z.B. Website Redesign" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-desc">Beschreibung</Label>
                  <Textarea
                    id="project-desc"
                    placeholder="Projektbeschreibung..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Startdatum</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Enddatum</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewProjectOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  className="bg-[var(--bodensee-water)]"
                  onClick={() => setIsNewProjectOpen(false)}
                >
                  Projekt erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktive Projekte</p>
                <p className="text-2xl font-bold text-[var(--bodensee-deep)]">
                  {projects.filter((p) => p.status === "active").length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-[var(--bodensee-water)]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offene Aufgaben</p>
                <p className="text-2xl font-bold text-[var(--bodensee-deep)]">
                  {tasks.filter((t) => t.status !== "done").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-[var(--bodensee-deep)]">
                  {tasks.filter((t) => t.status === "done").length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Mitglieder</p>
                <p className="text-2xl font-bold text-[var(--bodensee-deep)]">
                  {new Set(projects.flatMap((p) => p.team)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-[var(--bodensee-water)]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="projects">Projekte</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Kanban Board */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select
              value={selectedProject || "all"}
              onValueChange={(val) =>
                setSelectedProject(val === "all" ? null : val)
              }
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Projekt auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Projekte</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Aufgabe
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
                  <DialogDescription>
                    Fügen Sie eine neue Aufgabe zu einem Projekt hinzu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Titel</Label>
                    <Input id="task-title" placeholder="Aufgabentitel..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-desc">Beschreibung</Label>
                    <Textarea
                      id="task-desc"
                      placeholder="Aufgabenbeschreibung..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-project">Projekt</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-priority">Priorität</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
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
                  <div className="space-y-2">
                    <Label htmlFor="task-due">Fälligkeitsdatum</Label>
                    <Input id="task-due" type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsNewTaskOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    className="bg-[var(--bodensee-water)]"
                    onClick={() => setIsNewTaskOpen(false)}
                  >
                    Aufgabe erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <Card key={status} className="bg-gray-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status as Task["status"])}
                      <span className="capitalize">
                        {status === "in-progress"
                          ? "In Bearbeitung"
                          : status === "todo"
                            ? "Zu erledigen"
                            : status === "review"
                              ? "Review"
                              : "Erledigt"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {statusTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{task.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Löschen
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority === "low"
                              ? "Niedrig"
                              : task.priority === "medium"
                                ? "Mittel"
                                : task.priority === "high"
                                  ? "Hoch"
                                  : "Dringend"}
                          </Badge>
                          {task.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Users className="w-3 h-3" />
                            {task.assignee}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString("de-DE")}
                          </div>
                        )}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Fortschritt</span>
                            <span className="font-medium">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-[var(--bodensee-water)] h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Keine Aufgaben
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projects View */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <div
                  className="h-2"
                  style={{ backgroundColor: project.color }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {project.description}
                      </p>
                    </div>
                    <Badge
                      className={
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "on-hold"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }
                    >
                      {project.status === "active"
                        ? "Aktiv"
                        : project.status === "on-hold"
                          ? "Pausiert"
                          : "Abgeschlossen"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fortschritt</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: project.color,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.startDate).toLocaleDateString("de-DE")}
                    </div>
                    {project.endDate && (
                      <>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.endDate).toLocaleDateString("de-DE")}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-full bg-[var(--bodensee-water)] text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                        >
                          {member.charAt(0)}
                        </div>
                      ))}
                      {project.team.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-medium border-2 border-white">
                          +{project.team.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  {project.budget && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Budget</span>
                        <span className="font-medium">
                          {project.budget.toLocaleString("de-DE")} €
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    Projekt öffnen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projekt Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project, idx) => (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">
                      {new Date(project.startDate).toLocaleDateString("de-DE")}
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="font-medium">{project.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {project.progress}%
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${project.progress}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-32 text-sm text-gray-600 text-right">
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString("de-DE")
                        : "Offen"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics View */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Aufgabenverteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">
                          {status === "in-progress"
                            ? "In Bearbeitung"
                            : status === "todo"
                              ? "Zu erledigen"
                              : status === "review"
                                ? "Review"
                                : "Erledigt"}
                        </span>
                        <span className="font-medium">{statusTasks.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(status as Task["status"])}`}
                          style={{
                            width: `${(statusTasks.length / tasks.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projekt Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{project.name}</span>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color,
                          }}
                        >
                          {project.progress}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prioritätsverteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["urgent", "high", "medium", "low"].map((priority) => {
                    const count = tasks.filter((t) => t.priority === priority).length;
                    return (
                      <div key={priority} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">
                            {priority === "urgent"
                              ? "Dringend"
                              : priority === "high"
                                ? "Hoch"
                                : priority === "medium"
                                  ? "Mittel"
                                  : "Niedrig"}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getPriorityColor(priority as Task["priority"]).split(" ")[0]}`}
                            style={{
                              width: `${(count / tasks.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))).map(
                    (assignee) => {
                      const assigneeTasks = tasks.filter((t) => t.assignee === assignee);
                      const completedTasks = assigneeTasks.filter(
                        (t) => t.status === "done"
                      ).length;
                      return (
                        <div key={assignee} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--bodensee-water)] text-white flex items-center justify-center text-xs">
                                {assignee?.charAt(0)}
                              </div>
                              <span>{assignee}</span>
                            </div>
                            <span className="text-gray-600">
                              {completedTasks}/{assigneeTasks.length}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[var(--bodensee-water)] h-2 rounded-full"
                              style={{
                                width: `${(completedTasks / assigneeTasks.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
