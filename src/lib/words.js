
export const WORD_LEVELS = [
  // Nivel 1: Palabras cortas y simples
  [
    { word: "CAT", hint: "A furry pet" },
    { word: "DOG", hint: "Man's best friend" },
    { word: "SUN", hint: "Shines in the sky" },
  ],
  // Nivel 2: Palabras de 4 letras
  [
    { word: "BIRD", hint: "Flies in the sky" },
    { word: "FISH", hint: "Lives in water" },
    { word: "TREE", hint: "Grows in forests" },
  ],
  // Nivel 3: Palabras de 5 letras
  [
    { word: "APPLE", hint: "A fruit" },
    { word: "HOUSE", hint: "A place to live" },
    { word: "WATER", hint: "Essential for life" },
  ],
  // Nivel 4: Palabras más complejas
  [
    { word: "MONKEY", hint: "A playful primate" },
    { word: "DRAGON", hint: "Mythical creature" },
    { word: "PLANET", hint: "Celestial body" },
  ],
  // Nivel 5: Palabras desafiantes
  [
    { word: "ELEPHANT", hint: "Large gray animal" },
    { word: "COMPUTER", hint: "Electronic device" },
    { word: "DINOSAUR", hint: "Extinct creature" },
  ]
];

export const getRandomWord = (level) => {
  const levelWords = WORD_LEVELS[Math.min(level, WORD_LEVELS.length - 1)];
  return levelWords[Math.floor(Math.random() * levelWords.length)];
};
