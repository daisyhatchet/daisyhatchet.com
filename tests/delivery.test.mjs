import test from 'node:test';
import assert from 'node:assert/strict';
import {deliveryDays, fulfillmentDetails, DELIVERY_WINDOWS} from '../src/lib/delivery.mjs';
import {checkout} from '../src/lib/shopify.mjs';

test('delivery days start the next business day in Pacifica and skip weekends', () => {
  // Friday 11pm in Pacifica is already Saturday in UTC.
  const days = deliveryDays(new Date('2026-10-17T06:00:00Z'), 6);
  assert.deepEqual(days.map(d => d.value), ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-26']);
  assert.equal(days[0].label, 'Monday, October 19');
  assert.equal(deliveryDays(new Date('2026-10-14T17:00:00Z'))[0].value, '2026-10-15');
});

test('delivery requires a valid day and two-hour window within business hours', () => {
  const now = new Date('2026-10-14T17:00:00Z');
  assert.deepEqual(DELIVERY_WINDOWS, ['10am – 12pm', '12pm – 2pm', '2pm – 4pm']);
  assert.throws(() => fulfillmentDetails({}, now), /pickup or local delivery/);
  assert.throws(() => fulfillmentDetails({method: 'delivery', day: '2026-10-17', window: DELIVERY_WINDOWS[0]}, now), /delivery day/);
  assert.throws(() => fulfillmentDetails({method: 'delivery', day: '2026-10-15', window: '4pm – 6pm'}, now), /delivery window/);
  const delivery = fulfillmentDetails({method: 'delivery', day: '2026-10-15', window: '12pm – 2pm', note: '  Gate code 1234  '}, now);
  assert.deepEqual(delivery, {
    deliveryMethod: 'SHIPPING',
    attributes: [{key: 'Fulfillment', value: 'Local delivery'}, {key: 'Delivery date', value: 'Thursday, October 15'}, {key: 'Delivery window', value: '12pm – 2pm'}],
    note: 'Gate code 1234',
  });
  assert.deepEqual(fulfillmentDetails({method: 'pickup', note: 'x'.repeat(600)}, now).note.length, 500);
});

test('checkout carries the delivery details and pickup/delivery choice to Shopify', async () => {
  const details = fulfillmentDetails({method: 'pickup', note: 'Running late'});
  await checkout('variant', async (_, options) => {
    const {cartAttributes, note, buyerIdentity} = JSON.parse(options.body).variables;
    assert.deepEqual(cartAttributes, [{key: 'Fulfillment', value: 'Porch pickup'}]);
    assert.equal(note, 'Running late');
    assert.deepEqual(buyerIdentity, {preferences: {delivery: {deliveryMethod: ['PICK_UP']}}});
    return Response.json({data: {cartCreate: {cart: {checkoutUrl: 'https://daisy-hatchet.myshopify.com/checkouts/test', totalQuantity: 1}, userErrors: []}}});
  }, [], details);
});
