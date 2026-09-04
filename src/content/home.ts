export const homeSections = [
  { type: 'hero', kicker: 'Pacifica, California', title: 'Wild by nature.', body: 'Seasonal cut flowers, grown steps from the fog and arranged with a little bite.' },
  { type: 'marquee', items: ['Field grown', 'Woman owned', 'Seasonal only', 'Cut by hand'] },
  { type: 'season', title: "What’s growin’ on?", current: ['Celosia', 'Dahlias', 'Dianthus', 'Marigolds', 'Snapdragons', 'Sunflowers'], soon: ['Bachelor buttons', 'Chrysanthemum', 'Lisianthus', 'Scabiosa', 'Statice', 'Strawflowers', 'Zinnias'], note: 'The field makes the menu. Varieties shift with weather, harvests, and the beautiful mess of growing things.' },
  { type: 'statement', title: 'Pretty doesn’t have to play nice.', body: 'Daisy Hatchet is a small cut-flower farm growing distinctive stems for people, parties, and places around the Bay Area. Our flowers are local, seasonal, and never boring.', link: { label: 'Our story', href: '/about' } },
  { type: 'contact', title: 'Let’s make something.', body: 'Planning an event, stocking a shop, or just craving a feral armful? Tell us what you have in mind.', email: 'hello@daisyhatchet.com' },
] as const;
