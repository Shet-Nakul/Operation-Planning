import phaseResourceDefaults from '../data/store/phaseResourceDefaults.json';
import type { PhaseConfig } from '../types';
import type { GlobalSettings, DefaultResourceSetting } from '../types/settings';

export type MainPhase = 'preOp' | 'operative' | 'postOp' | 'sterilization' | 'recovery';

export type DefaultResource = {
  name: string;
  count: number;
  icon: string;
};

/**
 * Get all available default resources for a given phase
 */
export function getPhaseDefaults(phase: MainPhase, settings?: GlobalSettings): DefaultResource[] {
  if (settings?.phaseResources?.[phase]) {
    return settings.phaseResources[phase];
  }
  return (phaseResourceDefaults as any)[phase] || [];
}

/**
 * Get a specific default resource by phase and index
 */
export function getDefaultResource(phase: MainPhase, index: number, settings?: GlobalSettings): DefaultResource | null {
  const defaults = getPhaseDefaults(phase, settings);
  return defaults[index] || null;
}

/**
 * Add a default resource to a phase configuration
 * If index is provided, adds that specific default resource
 * If index is not provided, adds the next available default
 */
export function addDefaultResource(
  phaseConfig: PhaseConfig,
  phase: MainPhase,
  index?: number,
  settings?: GlobalSettings
): PhaseConfig {
  const defaults = getPhaseDefaults(phase, settings);
  
  // If no defaults available, return current config
  if (defaults.length === 0) {
    return {
      ...phaseConfig,
      resources: [...phaseConfig.resources, { name: 'Additional Resource', count: 1, icon: 'user' }],
    };
  }

  // If index provided, use that specific default
  if (index !== undefined && defaults[index]) {
    return {
      ...phaseConfig,
      resources: [...phaseConfig.resources, defaults[index]],
    };
  }

  // Otherwise, add the next available default that isn't already in the phase
  const existingNames = new Set(phaseConfig.resources.map((r) => r.name));
  const nextDefault = defaults.find((d) => !existingNames.has(d.name));

  if (nextDefault) {
    return {
      ...phaseConfig,
      resources: [...phaseConfig.resources, nextDefault],
    };
  }

  // If all defaults are already added, add a duplicate of the first available one
  return {
    ...phaseConfig,
    resources: [...phaseConfig.resources, { ...defaults[0] }],
  };
}

/**
 * Get the next available default resources for a phase
 * Useful for populating UI suggestions
 */
export function getAvailableDefaults(
  phaseConfig: PhaseConfig,
  phase: MainPhase,
  settings?: GlobalSettings
): DefaultResource[] {
  const defaults = getPhaseDefaults(phase, settings);
  const existingNames = new Set(phaseConfig.resources.map((r) => r.name));
  return defaults.filter((d) => !existingNames.has(d.name));
}
