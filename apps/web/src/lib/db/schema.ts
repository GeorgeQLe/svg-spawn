import { pgTable, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  creditsRemaining: integer('credits_remaining').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: text('name').notNull(),
  originalSvg: text('original_svg').notNull(),
  processedSvgDocumentId: text('processed_svg_document_id'),
  pipelineResult: jsonb('pipeline_result'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const generationNodes = pgTable('generation_nodes', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  parentNodeId: text('parent_node_id'),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('pending'),
  animationPlanId: text('animation_plan_id'),
  animatedSvg: text('animated_svg'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  nodeId: text('node_id')
    .notNull()
    .references(() => generationNodes.id),
  status: text('status').notNull().default('queued'),
  progress: integer('progress').notNull().default(0),
  result: text('result'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
