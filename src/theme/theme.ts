export const colors = {
  cream: "#FFF8EF",
  paper: "#F6E7D4",
  ink: "#3C2A22",
  inkSoft: "#7A6558",
  wood: "#E0B07A",
  woodDark: "#C48A4A",
  accent: "#F2A03D",
  accentDeep: "#E08A22",
  good: "#3E9A62",
  bad: "#D4544A",
  card: "#FFF8EF",
  line: "#E7D3BC",
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
  { id: "classic", name: "Classic", colors: ["#F4E1C1", "#E7C99A"], unlock: { type: "free" } },
  { id: "seaweed", name: "Seaweed", colors: ["#3E8F68", "#246B4A"], unlock: { type: "stars", stars: 10 } },
  { id: "salmon", name: "Salmon", colors: ["#F28B74", "#E26A55"], unlock: { type: "stars", stars: 20 } },
  { id: "egg", name: "Egg", colors: ["#F6E27A", "#E6C84A"], unlock: { type: "stars", stars: 30 } },
  { id: "tuna", name: "Tuna", colors: ["#E15B6A", "#C43B4E"], unlock: { type: "world", world: "sushi" } },
  { id: "avocado", name: "Avocado", colors: ["#8FCB6B", "#6AAA48"], unlock: { type: "stars", stars: 50 } },
  { id: "wood", name: "Wood", colors: ["#C4925A", "#A8743E"], unlock: { type: "stars", stars: 60 } },
  { id: "marble", name: "Marble", colors: ["#E7E2DC", "#CFC8C0"], unlock: { type: "stars", stars: 80 } },
  { id: "sakura", name: "Sakura", colors: ["#F3B6C6", "#E892A8"], unlock: { type: "stars", stars: 120 } },
  { id: "galaxy", name: "Galaxy", colors: ["#6C63C6", "#3E3A86"], unlock: { type: "weekly" } },
  { id: "dessert", name: "Dessert", colors: ["#F2A3C7", "#E07AAA"], unlock: { type: "world", world: "dessert" } },
  { id: "halloween", name: "Halloween", colors: ["#F08A2A", "#3A332C"], unlock: { type: "stars", stars: 150 } },
];

export const TRAYS: Look[] = [
  { id: "wood", name: "Wood", colors: ["#E7C29A", "#C48A4A"], unlock: { type: "free" } },
  { id: "sushi", name: "Sushi", colors: ["#F3D5C4", "#D9896A"], unlock: { type: "world", world: "sushi" } },
  { id: "dessert", name: "Dessert", colors: ["#F8D5E4", "#E7A3C0"], unlock: { type: "world", world: "dessert" } },
  { id: "marble", name: "Marble", colors: ["#F4F1EC", "#D9D3CB"], unlock: { type: "stars", stars: 80 } },
  { id: "sakura", name: "Sakura", colors: ["#F8E0E8", "#E7B7C8"], unlock: { type: "stars", stars: 120 } },
  { id: "galaxy", name: "Galaxy", colors: ["#2C2A4A", "#6C63C6"], unlock: { type: "weekly" } },
];

export const BACKGROUNDS: Look[] = [
  { id: "kitchen", name: "Kitchen", colors: ["#F6E7D4", "#E7C9A4"], unlock: { type: "free" } },
  { id: "sushi", name: "Sushi Street", colors: ["#D7E7F2", "#B7D0E4"], unlock: { type: "world", world: "sushi" } },
  { id: "dessert", name: "Dessert Land", colors: ["#F8E4EF", "#F3C6DA"], unlock: { type: "world", world: "dessert" } },
  { id: "sakura", name: "Sakura", colors: ["#FDE7EE", "#F6C3D4"], unlock: { type: "stars", stars: 40 } },
  { id: "galaxy", name: "Galaxy", colors: ["#1C1A33", "#3A3570"], unlock: { type: "weekly" } },
  { id: "halloween", name: "Halloween", colors: ["#2C241C", "#5A3A22"], unlock: { type: "stars", stars: 150 } },
];

export const WORLDS = [
  { id: "kitchen", name: "The Kitchen", subtitle: "A warm start to your bento journey", start: 1, end: 30, unlockStars: 0 },
  { id: "sushi", name: "Sushi Street", subtitle: "Tighter trays, more turns", start: 31, end: 60, unlockStars: 40 },
  { id: "dessert", name: "Dessert Land", subtitle: "Sweet shapes, harder fits", start: 61, end: 90, unlockStars: 100 },
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
