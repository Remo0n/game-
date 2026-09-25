export const colors = {
  cream: "#FFFEF8",
  paper: "#F7F5EC",
  ink: "#293D32",
  inkSoft: "#626B5D",
  wood: "#DDBE91",
  woodDark: "#A78056",
  accent: "#426B4E",
  accentDeep: "#31533B",
  good: "#426B4E",
  bad: "#BA5743",
  card: "#FFFEF8",
  line: "#E2E4D6",
  sage: "#E7EDDD",
  coral: "#E58C72",
  peach: "#FAE8D9",
  gold: "#C59A42",
};

export const fonts = {
  body: "Outfit_400Regular",
  medium: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  display: "Outfit_800ExtraBold",
};

export interface Look {
  id: string;
  name: string;
  colors: [string, string];
  unlock:
    | { type: "free" }
    | { type: "stars"; stars: number }
    | { type: "world"; world: "sushi" | "dessert" }
    | { type: "weekly" };
}

export const BLOCK_SKINS: Look[] = [
  {
    id: "sushi",
    name: "Salmon nigiri",
    colors: ["#FFB497", "#F7D1A3"],
    unlock: { type: "free" },
  },
  {
    id: "sandwich",
    name: "Picnic sandwich",
    colors: ["#F3DCA6", "#D8E8B5"],
    unlock: { type: "free" },
  },
  {
    id: "pizza",
    name: "Pizza party",
    colors: ["#F9D991", "#F7BC9C"],
    unlock: { type: "stars", stars: 5 },
  },
  {
    id: "classic",
    name: "Rice onigiri",
    colors: ["#ECA58C", "#E8C974"],
    unlock: { type: "free" },
  },
  {
    id: "seaweed",
    name: "Garden maki",
    colors: ["#3E8F68", "#246B4A"],
    unlock: { type: "stars", stars: 10 },
  },
  {
    id: "salmon",
    name: "Salmon sashimi",
    colors: ["#F28B74", "#E26A55"],
    unlock: { type: "stars", stars: 20 },
  },
  {
    id: "egg",
    name: "Golden tamago",
    colors: ["#F6E27A", "#E6C84A"],
    unlock: { type: "stars", stars: 30 },
  },
  {
    id: "tuna",
    name: "Tuna nigiri",
    colors: ["#E15B6A", "#C43B4E"],
    unlock: { type: "world", world: "sushi" },
  },
  {
    id: "avocado",
    name: "Avocado halves",
    colors: ["#8FCB6B", "#6AAA48"],
    unlock: { type: "stars", stars: 50 },
  },
  {
    id: "wood",
    name: "Chocolate waffle",
    colors: ["#C4925A", "#A8743E"],
    unlock: { type: "stars", stars: 60 },
  },
  {
    id: "marble",
    name: "Choc-chip cookie",
    colors: ["#E7E2DC", "#CFC8C0"],
    unlock: { type: "stars", stars: 80 },
  },
  {
    id: "sakura",
    name: "Sakura mochi",
    colors: ["#F3B6C6", "#E892A8"],
    unlock: { type: "stars", stars: 120 },
  },
  {
    id: "galaxy",
    name: "Cosmic doughnut",
    colors: ["#6C63C6", "#3E3A86"],
    unlock: { type: "weekly" },
  },
  {
    id: "dessert",
    name: "Berry cupcake",
    colors: ["#F2A3C7", "#E07AAA"],
    unlock: { type: "world", world: "dessert" },
  },
  {
    id: "halloween",
    name: "Pumpkin bites",
    colors: ["#F08A2A", "#3A332C"],
    unlock: { type: "stars", stars: 150 },
  },
];

export const TRAYS: Look[] = [
  {
    id: "picnic",
    name: "Picnic lunchbox",
    colors: ["#D5ECE3", "#439BAA"],
    unlock: { type: "free" },
  },
  {
    id: "bamboo",
    name: "Bamboo basket",
    colors: ["#EBD39A", "#B99151"],
    unlock: { type: "free" },
  },
  {
    id: "wood",
    name: "Wooden bento",
    colors: ["#E8D9BD", "#C3A77B"],
    unlock: { type: "free" },
  },
  {
    id: "sushi",
    name: "Lacquer bento",
    colors: ["#F3D5C4", "#D9896A"],
    unlock: { type: "world", world: "sushi" },
  },
  {
    id: "dessert",
    name: "Patisserie plate",
    colors: ["#F8D5E4", "#E7A3C0"],
    unlock: { type: "world", world: "dessert" },
  },
  {
    id: "marble",
    name: "Jade marble",
    colors: ["#F4F1EC", "#D9D3CB"],
    unlock: { type: "stars", stars: 80 },
  },
  {
    id: "sakura",
    name: "Blossom porcelain",
    colors: ["#F8E0E8", "#E7B7C8"],
    unlock: { type: "stars", stars: 120 },
  },
  {
    id: "galaxy",
    name: "Starlight tray",
    colors: ["#2C2A4A", "#6C63C6"],
    unlock: { type: "weekly" },
  },
];

export const BACKGROUNDS: Look[] = [
  {
    id: "picnic",
    name: "Sunny picnic",
    colors: ["#A4C879", "#EA9C8B"],
    unlock: { type: "free" },
  },
  {
    id: "seaside",
    name: "Seaside lunch",
    colors: ["#94DAE4", "#F2D493"],
    unlock: { type: "free" },
  },
  {
    id: "kitchen",
    name: "Cozy kitchen",
    colors: ["#F6E7D4", "#E7C9A4"],
    unlock: { type: "free" },
  },
  {
    id: "sushi",
    name: "Sushi Street",
    colors: ["#D7E7F2", "#B7D0E4"],
    unlock: { type: "world", world: "sushi" },
  },
  {
    id: "dessert",
    name: "Dessert Land",
    colors: ["#F8E4EF", "#F3C6DA"],
    unlock: { type: "world", world: "dessert" },
  },
  {
    id: "sakura",
    name: "Sakura garden",
    colors: ["#FDE7EE", "#F6C3D4"],
    unlock: { type: "stars", stars: 40 },
  },
  {
    id: "galaxy",
    name: "Among the stars",
    colors: ["#1C1A33", "#3A3570"],
    unlock: { type: "weekly" },
  },
  {
    id: "halloween",
    name: "Pumpkin patch",
    colors: ["#2C241C", "#5A3A22"],
    unlock: { type: "stars", stars: 150 },
  },
];

export const WORLDS = [
  {
    id: "kitchen",
    name: "The Kitchen",
    subtitle: "A warm start to your bento journey",
    start: 1,
    end: 30,
    unlockStars: 0,
  },
  {
    id: "sushi",
    name: "Sushi Street",
    subtitle: "Tighter trays, more turns",
    start: 31,
    end: 60,
    unlockStars: 40,
  },
  {
    id: "dessert",
    name: "Dessert Land",
    subtitle: "Sweet shapes, harder fits",
    start: 61,
    end: 90,
    unlockStars: 100,
  },
] as const;

export function worldForLevel(levelNumber: number) {
  if (levelNumber <= 30) return WORLDS[0];
  if (levelNumber <= 60) return WORLDS[1];
  if (levelNumber <= 90) return WORLDS[2];
  return WORLDS[Math.floor((levelNumber - 1) / 30) % 3];
}

export function isUnlocked(
  look: Look,
  totalStars: number,
  weeklyReward: boolean,
): boolean {
  if (look.unlock.type === "free") return true;
  if (look.unlock.type === "stars") return totalStars >= look.unlock.stars;
  if (look.unlock.type === "weekly") return weeklyReward;
  if (look.unlock.world === "sushi") return totalStars >= 40;
  return totalStars >= 100;
}

export function pieceColor(palette: [string, string], index: number): string {
  return index % 2 === 0 ? palette[0] : palette[1];
}
