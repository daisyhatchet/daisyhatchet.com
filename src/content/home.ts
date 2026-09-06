export const homeSections = [
  { type: 'hero', kicker: 'Cut flower farm · Pacifica, CA', title: 'Something’s happening here…', body: 'Bold, seasonal flowers grown by the Pacific and cut by hand.' },
  { type: 'season', title: "What’s growin’ on?", current: ['Celosia', 'Dahlias', 'Dianthus', 'Marigolds', 'Snapdragons', 'Sunflowers'], soon: ['Bachelor Buttons', 'Chrysanthemum', 'Cosmos', 'Lisianthus', 'Scabiosas', 'Statice', 'Strawflowers', 'Zinnias'], note: 'A quick look at what’s flowering now and what’s coming up next.' },
  { type: 'contact', title: 'Let’s Work Together', body: 'Looking for a custom order, run a local business that could use fresh flowers each week, or just want to say hi? Drop me a note.', email: 'hello@daisyhatchet.com' },
  { type: 'marquee', items: ['Flowers with an edge', 'Flowers with an edge'] },
] as const;

export const gardenRadio = {
  title: 'What the flowers are listening to',
  body: 'The songs keeping us company in the garden lately. Press play and grow along.',
  playlistId: '0Scv2njcunjMjeiL0gFAcn',
} as const;
