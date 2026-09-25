import { StyleSheet, View } from "react-native";
import { FoodArt } from "./FoodArt";
import { BackgroundArt, TraySurface } from "./SceneArt";

export type LookKind = "Blocks" | "Trays" | "Backgrounds";
export function LookPreview({
  id,
  kind,
  large = false,
}: {
  id: string;
  kind: LookKind;
  large?: boolean;
}) {
  if (kind === "Backgrounds")
    return (
      <View style={StyleSheet.absoluteFill}>
        <BackgroundArt id={id} />
      </View>
    );
  if (kind === "Trays")
    return (
      <View style={{ width: large ? 270 : 142, height: large ? 184 : 104 }}>
        <TraySurface id={id} />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          {["sushi", "seaweed", "egg"].map((food) => (
            <FoodArt key={food} id={food} size={large ? 70 : 35} />
          ))}
        </View>
      </View>
    );
  return (
    <>
      <View
        style={[
          styles.plate,
          { width: large ? 220 : 120, height: large ? 118 : 60 },
        ]}
      />
      <View style={{ zIndex: 1 }}>
        <FoodArt id={id} size={large ? 200 : 120} />
      </View>
    </>
  );
}
const descriptions: Record<string, string> = {
  sushi: "Buttery salmon over fluffy rice, tied with a little nori ribbon.",
  sandwich: "Golden bread, crisp lettuce, juicy tomato, and a slice of cheese.",
  pizza: "A cheesy little slice with pepperoni and fresh herbs.",
  classic: "Soft rice triangles with a crisp seaweed wrap.",
  seaweed: "Rice, avocado, salmon, and egg rolled in dark green nori.",
  salmon: "Bright salmon slices with delicate ribbons of marbling.",
  egg: "Golden layers of Japanese omelette, finished with a sprinkle of herbs.",
  tuna: "Ruby-red tuna over a pillow of sushi rice.",
  avocado: "Fresh avocado halves with a golden-brown stone.",
  wood: "A warm waffle with chocolate drizzle, butter, and a berry.",
  marble: "A golden cookie with generous chunks of chocolate.",
  sakura: "A soft pink mochi with a delicate green leaf.",
  galaxy: "Purple icing, pastel sprinkles, and a doughnut from another galaxy.",
  dessert: "Pink buttercream, a berry on top, and a striped cupcake wrapper.",
  halloween: "Little pumpkin faces for a playful autumn bento.",
};
export function lookDescription(id: string, kind: LookKind) {
  if (kind === "Blocks")
    return descriptions[id] ?? "A delicious little addition to your bento.";
  if (kind === "Trays")
    return (
      {
        wood: "Warm wood grain and a carved rim, straight from the kitchen.",
        picnic:
          "A turquoise lunchbox with a gingham lining and a golden clasp.",
        bamboo: "Woven bamboo with a toasted golden edge.",
        sushi: "Deep lacquer, a red rim, and delicate gold corner details.",
        dessert: "A pink patisserie plate finished with little sugar pearls.",
        marble: "Pale jade marble with flowing green and gold veins.",
        sakura: "Cream porcelain decorated with pink cherry blossoms.",
        galaxy: "A violet serving tray scattered with tiny golden stars.",
      } as Record<string, string>
    )[id];
  return (
    {
      kitchen:
        "Sunlight through the window, a herb plant, and a warm wooden counter.",
      picnic: "A checked picnic blanket, little daisies, and a woven basket.",
      seaside:
        "Turquoise waves, a striped parasol, and a sunny stretch of sand.",
      sushi: "A lantern-lit street with glowing windows under the moon.",
      dessert:
        "Candy-colored hills, giant lollipops, and a cupcake waiting for you.",
      sakura: "Cherry blossoms drifting over a mountain garden.",
      galaxy: "Ringed planets, a blue moon, and a sky full of stars.",
      halloween: "A glowing moon and a patch of grinning pumpkins.",
    } as Record<string, string>
  )[id];
}
const styles = StyleSheet.create({
  plate: {
    position: "absolute",
    bottom: 10,
    backgroundColor: "#FFFDF0",
    borderWidth: 3,
    borderColor: "#E7DCC5",
    borderRadius: 100,
    transform: [{ rotate: "-8deg" }],
  },
});
