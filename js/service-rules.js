export const SERVICE_RULES = {
  sink_base: [
    'water_supply',
    'waste_pipe',
  ],

  hob_base: [
    'electrical_point',
    'exhaust_point',
  ],

  wc: [
    'water_supply',
    'waste_pipe',
  ],

  vanity: [
    'water_supply',
    'waste_pipe',
    'lighting_point',
  ],
};

export function applyServiceRules(object) {
  const requirements = SERVICE_RULES[object.cabinetType];

  if (!requirements) return object;

  object.serviceRequirement = [...requirements];

  return object;
}
