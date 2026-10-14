// Local delivery runs on weekdays, 10am–4pm, in two-hour windows.
export const DELIVERY_WINDOWS = ['10am – 12pm', '12pm – 2pm', '2pm – 4pm'];
export const DELIVERY_DAYS_OFFERED = 10;
export const NOTE_LIMIT = 500;
const TIME_ZONE = 'America/Los_Angeles';

// Weekdays customers can book, starting the next business day in Pacifica.
export function deliveryDays(now = new Date(), count = DELIVERY_DAYS_OFFERED) {
  const today = new Intl.DateTimeFormat('en-CA', {timeZone: TIME_ZONE}).format(now);
  const day = new Date(`${today}T12:00:00Z`);
  const label = new Intl.DateTimeFormat('en-US', {timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric'});
  const days = [];
  while (days.length < count) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    days.push({value: day.toISOString().slice(0, 10), label: label.format(day)});
  }
  return days;
}

// Turns the visitor's choice into what Shopify stores on the order.
export function fulfillmentDetails({method, day, window, note = ''}, now = new Date()) {
  const cleanNote = note.trim().slice(0, NOTE_LIMIT);
  if (method === 'pickup') return {deliveryMethod: 'PICK_UP', attributes: [{key: 'Fulfillment', value: 'Porch pickup'}], note: cleanNote};
  if (method !== 'delivery') throw new Error('Choose porch pickup or local delivery.');
  const date = deliveryDays(now).find(option => option.value === day);
  if (!date) throw new Error('Choose a delivery day.');
  if (!DELIVERY_WINDOWS.includes(window)) throw new Error('Choose a delivery window.');
  return {
    deliveryMethod: 'SHIPPING',
    attributes: [{key: 'Fulfillment', value: 'Local delivery'}, {key: 'Delivery date', value: date.label}, {key: 'Delivery window', value: window}],
    note: cleanNote,
  };
}
