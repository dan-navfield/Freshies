/**
 * Routines Module
 *
 * Handles skincare routine building, scheduling, execution, and tracking.
 * Manages custom routines, templates, completion history, and notifications.
 *
 * @module routines
 */

// Core routine CRUD operations
export * from './routineService';

// Routine templates and suggestions
export * from './templateService';

// Completion tracking and history
export * from './completionService';

// Notification scheduling
export * from './schedulerService';
