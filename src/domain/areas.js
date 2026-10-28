/** True if the area with this code is in the list of marked areas. */
export const isMarked = (areas, code) => areas.some(a => a.code === code);
