import express from 'express';
import { db } from '../db';
import { projects, projectTasks, projectComments } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { log } from '../lib/logger';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json(allProjects);
  } catch (error) {
    log.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    
    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get tasks for this project
    const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
    
    res.json({ ...project[0], tasks });
  } catch (error) {
    log.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    
    const [newProject] = await db.insert(projects).values({
      propertyId: projectData.propertyId ? parseInt(projectData.propertyId) : null,
      name: projectData.name,
      description: projectData.description,
      projectType: projectData.projectType,
      status: projectData.status || 'planning',
      priority: projectData.priority || 'medium',
      startDate: projectData.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData.endDate ? new Date(projectData.endDate) : null,
      estimatedBudget: projectData.estimatedBudget ? parseFloat(projectData.estimatedBudget) : null,
      actualBudget: 0,
      currency: projectData.currency || 'EUR',
      progress: 0,
      createdBy: req.session?.user?.id || null,
    }).returning();
    
    log.info('Project created:', { id: newProject.id, name: newProject.name });
    res.status(201).json(newProject);
  } catch (error) {
    log.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const updates = req.body;
    
    const [updatedProject] = await db.update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();
    
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    log.info('Project updated:', { id: projectId });
    res.json(updatedProject);
  } catch (error) {
    log.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    await db.delete(projects).where(eq(projects.id, projectId));
    
    log.info('Project deleted:', { id: projectId });
    res.json({ success: true });
  } catch (error) {
    log.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get tasks for a project
router.get('/:id/tasks', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const tasks = await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId));
    
    res.json(tasks);
  } catch (error) {
    log.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task for a project
router.post('/:id/tasks', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const taskData = req.body;
    
    const [newTask] = await db.insert(projectTasks).values({
      projectId,
      parentTaskId: taskData.parentTaskId ? parseInt(taskData.parentTaskId) : null,
      title: taskData.title,
      description: taskData.description,
      taskType: taskData.taskType || 'task',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      startDate: taskData.startDate ? new Date(taskData.startDate) : null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      assignedTo: taskData.assignedTo ? parseInt(taskData.assignedTo) : null,
      progress: 0,
      createdBy: req.session?.user?.id || null,
    }).returning();
    
    log.info('Task created:', { id: newTask.id, projectId });
    res.status(201).json(newTask);
  } catch (error) {
    log.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:projectId/tasks/:taskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const updates = req.body;
    
    const [updatedTask] = await db.update(projectTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projectTasks.id, taskId))
      .returning();
    
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (error) {
    log.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Get comments for a project
router.get('/:id/comments', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const comments = await db.select().from(projectComments)
      .where(eq(projectComments.projectId, projectId))
      .orderBy(desc(projectComments.createdAt));
    
    res.json(comments);
  } catch (error) {
    log.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to project
router.post('/:id/comments', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { content, commentType, taskId } = req.body;
    
    const [newComment] = await db.insert(projectComments).values({
      projectId,
      taskId: taskId ? parseInt(taskId) : null,
      content,
      commentType: commentType || 'comment',
      createdBy: req.session?.user?.id || null,
    }).returning();
    
    res.status(201).json(newComment);
  } catch (error) {
    log.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
