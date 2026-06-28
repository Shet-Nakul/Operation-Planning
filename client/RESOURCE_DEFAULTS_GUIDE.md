# Resource Defaults Usage Guide

## Overview
The resource defaults system allows you to:
1. Maintain a centralized list of default resources for each surgical phase
2. Automatically add pre-configured resources when users click the "+" button
3. Keep consistent resource options across all components

## Files Created

### 1. `src/data/store/phaseResourceDefaults.json`
Contains all default resources organized by phase:
- `preOp` - Pre-operative phase defaults
- `operative` - Operative phase defaults
- `postOp` - Post-operative phase defaults
- `sterilization` - Sterilization phase defaults
- `recovery` - Recovery phase defaults

Each resource has:
- `name` - Resource name
- `count` - Default count
- `icon` - Icon identifier

### 2. `src/lib/resourceDefaults.ts`
Utility functions for working with resource defaults:

- **`getPhaseDefaults(phase: MainPhase)`**
  - Returns all default resources for a given phase
  - Usage: Get all available defaults to display in UI

- **`getDefaultResource(phase: MainPhase, index: number)`**
  - Returns a specific default resource by index
  - Usage: Access a particular resource from the defaults

- **`addDefaultResource(phaseConfig, phase, index?)`**
  - Adds a default resource to a phase configuration
  - If `index` provided: adds that specific default
  - If not provided: adds the next unused default
  - Usage: Main function for the "+" button

- **`getAvailableDefaults(phaseConfig, phase)`**
  - Returns defaults that haven't been added to the phase yet
  - Usage: Populate dropdown or suggestion UI

## Usage Examples

### Example 1: Using in Step2PhaseResources (Already Implemented)
```typescript
import { addDefaultResource } from '../../../lib/resourceDefaults';

// In the "+" button click handler
onClick={() => {
  const p = data.phases[phase.id];
  const updated = addDefaultResource(p, phase.id);
  updateData({
    phases: {
      ...data.phases,
      [phase.id]: updated,
    },
  });
}}
```

### Example 2: Using in Another Component with Selection UI
```typescript
import { getAvailableDefaults, getDefaultResource } from '../../../lib/resourceDefaults';

function ResourceSelector({ phaseConfig, phaseId, onAdd }) {
  const available = getAvailableDefaults(phaseConfig, phaseId);
  
  return (
    <select onChange={(e) => {
      const index = parseInt(e.target.value);
      const resource = getDefaultResource(phaseId, index);
      if (resource) onAdd(resource);
    }}>
      <option value="">Select a resource to add...</option>
      {available.map((res, idx) => (
        <option key={idx} value={idx}>{res.name}</option>
      ))}
    </select>
  );
}
```

### Example 3: Displaying Available Resources in a Modal
```typescript
import { getPhaseDefaults } from '../../../lib/resourceDefaults';

function ResourceLibrary({ selectedPhase }) {
  const defaults = getPhaseDefaults(selectedPhase);
  
  return (
    <div>
      {defaults.map((resource, idx) => (
        <div key={idx}>
          <span>{resource.name}</span>
          <span>{resource.count}</span>
        </div>
      ))}
    </div>
  );
}
```

## Behavior

### Adding Resources
- When user clicks "+", the system checks defaults for that phase
- It adds the next default that hasn't been added yet
- If all defaults are added, it duplicates the first one
- If no defaults exist, it adds a generic "Additional Resource"

### Smart Tracking
- The system tracks which resources are already in the phase
- Prevents duplicate resource names (unless all are already used)
- Ensures consistent resource suggestions across the app

## Editing Defaults
To add, remove, or modify default resources:
1. Edit `src/data/store/phaseResourceDefaults.json`
2. Changes automatically reflect across all components using the utility
3. No code changes needed for most use cases

## Type Safety
All functions are fully typed for TypeScript:
- `MainPhase` type ensures valid phase names
- `DefaultResource` type defines the structure
- `PhaseConfig` type ensures compatibility with existing types
