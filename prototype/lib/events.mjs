// SPDX-License-Identifier: CC0-1.0

export function buildSparseEventWindow() {
  return {
    schema: "neurofhe.events.v1.demo",
    windowMs: 50,
    timesteps: 8,
    channels: 8,
    encoding: "binary-spike-count",
    values: [
      [0, 1, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0],
    ],
  };
}

export function validateEventWindow(eventWindow) {
  const errors = [];
  if (!eventWindow || typeof eventWindow !== "object") {
    return ["event window must be an object"];
  }

  const { timesteps, channels, values } = eventWindow;
  if (!Number.isInteger(timesteps) || timesteps <= 0) {
    errors.push("timesteps must be a positive integer");
  }
  if (!Number.isInteger(channels) || channels <= 0) {
    errors.push("channels must be a positive integer");
  }
  if (!Array.isArray(values)) {
    errors.push("values must be a matrix");
    return errors;
  }
  if (Number.isInteger(timesteps) && values.length !== timesteps) {
    errors.push(`values length ${values.length} does not match timesteps ${timesteps}`);
  }

  values.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) {
      errors.push(`row ${rowIndex} must be an array`);
      return;
    }
    if (Number.isInteger(channels) && row.length !== channels) {
      errors.push(`row ${rowIndex} length ${row.length} does not match channels ${channels}`);
    }
    row.forEach((value, columnIndex) => {
      if (!Number.isInteger(value) || value < 0) {
        errors.push(`value at row ${rowIndex}, channel ${columnIndex} must be a non-negative integer`);
      }
    });
  });

  return errors;
}

export function flattenEventWindow(eventWindow) {
  const errors = validateEventWindow(eventWindow);
  if (errors.length) throw new Error(`invalid event window: ${errors.join("; ")}`);
  return eventWindow.values.flat();
}

export function activeEvents(eventWindow) {
  const values = flattenEventWindow(eventWindow);
  return values.flatMap((value, index) => {
    if (value === 0) return [];
    const time = Math.floor(index / eventWindow.channels);
    const channel = index % eventWindow.channels;
    return [{ index, time, channel, value }];
  });
}

export function spikeMetrics(eventWindow) {
  const flattened = flattenEventWindow(eventWindow);
  const spikeCount = flattened.reduce((sum, value) => sum + value, 0);
  const featureCount = flattened.length;
  const activeChannelSet = new Set();
  const activeTimestepSet = new Set();

  eventWindow.values.forEach((row, time) => {
    row.forEach((value, channel) => {
      if (value > 0) {
        activeChannelSet.add(channel);
        activeTimestepSet.add(time);
      }
    });
  });

  return {
    featureCount,
    spikeCount,
    density: spikeCount / featureCount,
    activeChannels: activeChannelSet.size,
    activeTimesteps: activeTimestepSet.size,
  };
}
