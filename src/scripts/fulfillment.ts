import {deliveryDays, fulfillmentDetails} from '@/lib/delivery.mjs';

type Fulfillment = ReturnType<typeof fulfillmentDetails>;

// Asks for pickup or delivery (with a day and window) before checkout.
// Resolves to the order details, or null if the visitor closes the step.
export function askFulfillment(): Promise<Fulfillment | null> {
  const dialog = document.querySelector<HTMLDialogElement>('#fulfillment-dialog')!;
  const form = dialog.querySelector('form')!;
  const daySelect = form.querySelector<HTMLSelectElement>('[name=day]')!;
  const deliveryFields = form.querySelector<HTMLElement>('.delivery-fields')!;
  const error = form.querySelector<HTMLParagraphElement>('.fulfillment-error')!;
  const choice = () => {
    const data = new FormData(form);
    return {method: String(data.get('method') ?? ''), day: daySelect.value, window: String(data.get('window') ?? ''), note: String(data.get('note') ?? '')};
  };
  const sync = () => { deliveryFields.hidden = choice().method !== 'delivery'; error.textContent = ''; };

  // Refresh the days each time so a page left open overnight stays accurate.
  const previous = daySelect.value;
  daySelect.replaceChildren(...deliveryDays().map(day => new Option(day.label, day.value, false, day.value === previous)));
  form.onchange = sync;
  form.onsubmit = event => {
    if ((event.submitter as HTMLButtonElement | null)?.value !== 'continue') return;
    try { fulfillmentDetails(choice()); }
    catch (e) { event.preventDefault(); error.textContent = e instanceof Error ? e.message : 'Please check your choices.'; }
  };
  sync();
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => {
    resolve(dialog.returnValue === 'continue' ? fulfillmentDetails(choice()) : null);
  }, {once: true}));
}
