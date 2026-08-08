export interface ThemeColor {
  name: string;
  value: string;
  isGradient: boolean;
}

// --- Lightness helpers -----------------------------------------------
function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function averageGradientLuminance(gradientValue: string): number {
  const hexes = gradientValue.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return 0;
  const total = hexes.reduce((sum, hex) => sum + hexLuminance(hex), 0);
  return total / hexes.length;
}

// Generate Solid Colors
const generateSolidColors = (): ThemeColor[] => {
  const actualColors: ThemeColor[] = [];
  const baseHues = [
    ['#fee2e2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'], // Reds
    ['#ffedd5', '#fdba74', '#f97316', '#c2410c', '#7c2d12'], // Oranges
    ['#fef3c7', '#fcd34d', '#f59e0b', '#b45309', '#78350f'], // Ambers
    ['#fef9c3', '#fde047', '#eab308', '#a16207', '#713f12'], // Yellows
    ['#ecfccb', '#bef264', '#84cc16', '#4d7c0f', '#3f6212'], // Limes
    ['#dcfce7', '#86efac', '#22c55e', '#15803d', '#14532d'], // Greens
    ['#d1fae5', '#6ee7b7', '#10b981', '#047857', '#064e3b'], // Emeralds
    ['#ccfbf1', '#5eead4', '#14b8a6', '#0f766e', '#134e4a'], // Teals
    ['#cffafe', '#67e8f9', '#06b6d4', '#0e7490', '#164e63'], // Cyans
    ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1', '#0c4a6e'], // Sky
    ['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'], // Blues
    ['#e0e7ff', '#a5b4fc', '#6366f1', '#4338ca', '#312e81'], // Indigos
    ['#ede9fe', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'], // Violets
    ['#f3e8ff', '#d8b4fe', '#a855f7', '#7e22ce', '#581c87'], // Purples
    ['#fae8ff', '#f0abfc', '#d946ef', '#a21caf', '#701a75'], // Fuchsias
    ['#fce7f3', '#f9a8d4', '#ec4899', '#be185d', '#831843'], // Pinks
    ['#ffe4e6', '#fda4af', '#f43f5e', '#be123c', '#881337'], // Roses
    ['#f1f5f9', '#cbd5e1', '#64748b', '#334155', '#0f172a'], // Slates
    ['#f3f4f6', '#d1d5db', '#6b7280', '#374151', '#111827'], // Grays
    ['#fafafa', '#e5e5e5', '#737373', '#404040', '#171717']  // Neutrals
  ];

  baseHues.forEach((hueGroup, i) => {
    hueGroup.forEach((hex, j) => {
      actualColors.push({
        name: `Color ${i + 1}-${j + 1}`,
        value: hex,
        isGradient: false
      });
    });
  });

  return actualColors;
};

// Generate Gradient Colors
const GRADIENT_COLORS_RAW: ThemeColor[] = [
  { name: 'Cyber Neon 1', value: 'linear-gradient(324deg, #bd1284, #d039ee)', isGradient: true },
  { name: 'Cyber Grid 2', value: 'linear-gradient(278deg, #ed2cbe, #c227f7)', isGradient: true },
  { name: 'Cyber Synth 3', value: 'linear-gradient(263deg, #f216db, #f13d84)', isGradient: true },
  { name: 'Cyber Pulse 4', value: 'linear-gradient(246deg, #dd18c2, #ac23fa)', isGradient: true },
  { name: 'Cyber Void 5', value: 'linear-gradient(208deg, #9e0aea, #fa2ad8)', isGradient: true },
  { name: 'Cyber Neon 6', value: 'linear-gradient(294deg, #9e15cf, #e506b1)', isGradient: true },
  { name: 'Cyber Void 7', value: 'linear-gradient(150deg, #f12ce4, #e60d6b)', isGradient: true },
  { name: 'Cyber Pulse 8', value: 'linear-gradient(161deg, #dd07b6, #0fcf31)', isGradient: true },
  { name: 'Cyber Pulse 9', value: 'linear-gradient(287deg, #812fef, #d608e7)', isGradient: true },
  { name: 'Cyber Void 10', value: 'linear-gradient(104deg, #d010fb, #fa27b7)', isGradient: true },
  { name: 'Cyber Neon 11', value: 'linear-gradient(59deg, #db0cae, #f00a4b)', isGradient: true },
  { name: 'Cyber Neon 12', value: 'linear-gradient(251deg, #f80fd1, #00d924)', isGradient: true },
  { name: 'Cyber Neon 13', value: 'linear-gradient(183deg, #790eed, #de18e2)', isGradient: true },
  { name: 'Cyber Void 14', value: 'linear-gradient(160deg, #d834f9, #590cf5)', isGradient: true },
  { name: 'Cyber Neon 15', value: 'linear-gradient(73deg, #e81fd3, #9514e9)', isGradient: true },
  { name: 'Cyber Neon 16', value: 'linear-gradient(184deg, #ae15dd, #6231ea)', isGradient: true },
  { name: 'Cyber Pulse 17', value: 'linear-gradient(51deg, #781afe, #b114c0)', isGradient: true },
  { name: 'Cyber Synth 18', value: 'linear-gradient(127deg, #be14a1, #d70f52)', isGradient: true },
  { name: 'Cyber Synth 19', value: 'linear-gradient(255deg, #6e0ec5, #0801f6)', isGradient: true },
  { name: 'Cyber Void 20', value: 'linear-gradient(109deg, #e710b5, #8f0fbe)', isGradient: true },
  { name: 'Cyber Neon 21', value: 'linear-gradient(341deg, #d524fb, #5bf63a)', isGradient: true },
  { name: 'Cyber Void 22', value: 'linear-gradient(310deg, #a715cd, #cd0e95)', isGradient: true },
  { name: 'Cyber Void 23', value: 'linear-gradient(64deg, #d207ea, #5507cc)', isGradient: true },
  { name: 'Cyber Pulse 24', value: 'linear-gradient(43deg, #ae09da, #59ee31)', isGradient: true },
  { name: 'Cyber Synth 25', value: 'linear-gradient(74deg, #e817be, #b123ed)', isGradient: true },
  { name: 'Cyber Synth 26', value: 'linear-gradient(355deg, #f61ebd, #eb0038)', isGradient: true },
  { name: 'Cyber Grid 27', value: 'linear-gradient(139deg, #f72be8, #27f937)', isGradient: true },
  { name: 'Cyber Neon 28', value: 'linear-gradient(50deg, #f004d2, #db155e)', isGradient: true },
  { name: 'Cyber Synth 29', value: 'linear-gradient(305deg, #600dd5, #79c015)', isGradient: true },
  { name: 'Cyber Pulse 30', value: 'linear-gradient(214deg, #9311fa, #ec32e2)', isGradient: true },
  { name: 'Cyber Grid 31', value: 'linear-gradient(90deg, #a50be7, #5731f5)', isGradient: true },
  { name: 'Cyber Pulse 32', value: 'linear-gradient(329deg, #9612cd, #5329f6)', isGradient: true },
  { name: 'Cyber Neon 33', value: 'linear-gradient(322deg, #bd43ee, #f737ce)', isGradient: true },
  { name: 'Cyber Synth 34', value: 'linear-gradient(89deg, #e630ec, #8731e9)', isGradient: true },
  { name: 'Cyber Synth 35', value: 'linear-gradient(91deg, #e80de3, #38eb3d)', isGradient: true },
  { name: 'Cyber Void 36', value: 'linear-gradient(19deg, #ce0bb5, #14bd29)', isGradient: true },
  { name: 'Cyber Grid 37', value: 'linear-gradient(250deg, #da0ade, #7902fa)', isGradient: true },
  { name: 'Cyber Void 38', value: 'linear-gradient(69deg, #f333df, #f60a67)', isGradient: true },
  { name: 'Cyber Void 39', value: 'linear-gradient(175deg, #c410ad, #cb1659)', isGradient: true },
  { name: 'Cyber Void 40', value: 'linear-gradient(313deg, #b20def, #3cd603)', isGradient: true },
  { name: 'Sunset Flare 41', value: 'linear-gradient(349deg, #e73305, #ec094b)', isGradient: true },
  { name: 'Sunset Glow 42', value: 'linear-gradient(174deg, #f2cd55, #eb5721)', isGradient: true },
  { name: 'Sunset Horizon 43', value: 'linear-gradient(68deg, #e3e212, #7ff10a)', isGradient: true },
  { name: 'Sunset Dawn 44', value: 'linear-gradient(100deg, #fcb14c, #e7f901)', isGradient: true },
  { name: 'Sunset Blaze 45', value: 'linear-gradient(305deg, #faec37, #96ef20)', isGradient: true },
  { name: 'Sunset Dawn 46', value: 'linear-gradient(268deg, #f7b20e, #c7ee2f)', isGradient: true },
  { name: 'Sunset Horizon 47', value: 'linear-gradient(223deg, #f94120, #f5a206)', isGradient: true },
  { name: 'Sunset Glow 48', value: 'linear-gradient(130deg, #ea4710, #0ab8f3)', isGradient: true },
  { name: 'Sunset Blaze 49', value: 'linear-gradient(96deg, #e7ba15, #c2f83b)', isGradient: true },
  { name: 'Sunset Blaze 50', value: 'linear-gradient(233deg, #f4ae0a, #d5fd37)', isGradient: true },
  { name: 'Sunset Flare 51', value: 'linear-gradient(258deg, #fb702f, #ebcd47)', isGradient: true },
  { name: 'Sunset Glow 52', value: 'linear-gradient(316deg, #fc1713, #eda456)', isGradient: true },
  { name: 'Sunset Horizon 53', value: 'linear-gradient(251deg, #e6480c, #ec2955)', isGradient: true },
  { name: 'Sunset Glow 54', value: 'linear-gradient(333deg, #efd15b, #b6ff08)', isGradient: true },
  { name: 'Sunset Flare 55', value: 'linear-gradient(227deg, #f56a09, #209cf3)', isGradient: true },
  { name: 'Sunset Glow 56', value: 'linear-gradient(172deg, #eeb81e, #fe4a12)', isGradient: true },
  { name: 'Sunset Horizon 57', value: 'linear-gradient(321deg, #f73f2e, #50e7f5)', isGradient: true },
  { name: 'Sunset Blaze 58', value: 'linear-gradient(155deg, #fdbd1e, #c5f60b)', isGradient: true },
  { name: 'Sunset Horizon 59', value: 'linear-gradient(83deg, #fa9a40, #f95153)', isGradient: true },
  { name: 'Sunset Blaze 60', value: 'linear-gradient(289deg, #f0913b, #ede93a)', isGradient: true },
  { name: 'Sunset Flare 61', value: 'linear-gradient(172deg, #ff4b47, #f1338d)', isGradient: true },
  { name: 'Sunset Horizon 62', value: 'linear-gradient(42deg, #e45c0a, #31a8f0)', isGradient: true },
  { name: 'Sunset Horizon 63', value: 'linear-gradient(248deg, #f3811e, #1b89e8)', isGradient: true },
  { name: 'Sunset Dawn 64', value: 'linear-gradient(292deg, #e5a811, #1758fa)', isGradient: true },
  { name: 'Sunset Flare 65', value: 'linear-gradient(286deg, #f77d4e, #32c1f8)', isGradient: true },
  { name: 'Sunset Blaze 66', value: 'linear-gradient(215deg, #f69644, #ef484e)', isGradient: true },
  { name: 'Sunset Glow 67', value: 'linear-gradient(339deg, #fac433, #e93e0a)', isGradient: true },
  { name: 'Sunset Blaze 68', value: 'linear-gradient(134deg, #e63b19, #f73173)', isGradient: true },
  { name: 'Sunset Dawn 69', value: 'linear-gradient(148deg, #de5812, #22abf3)', isGradient: true },
  { name: 'Sunset Glow 70', value: 'linear-gradient(33deg, #fb5716, #ee2651)', isGradient: true },
  { name: 'Sunset Dawn 71', value: 'linear-gradient(271deg, #f7c51e, #ff703c)', isGradient: true },
  { name: 'Sunset Dawn 72', value: 'linear-gradient(23deg, #f5bb06, #fa5116)', isGradient: true },
  { name: 'Sunset Flare 73', value: 'linear-gradient(124deg, #f8a519, #f9624c)', isGradient: true },
  { name: 'Sunset Horizon 74', value: 'linear-gradient(73deg, #d46616, #eb3b49)', isGradient: true },
  { name: 'Sunset Blaze 75', value: 'linear-gradient(180deg, #e69308, #0f5ddf)', isGradient: true },
  { name: 'Sunset Glow 76', value: 'linear-gradient(188deg, #f18403, #2781ec)', isGradient: true },
  { name: 'Sunset Glow 77', value: 'linear-gradient(262deg, #ea7606, #f72123)', isGradient: true },
  { name: 'Sunset Flare 78', value: 'linear-gradient(325deg, #fc8a22, #d81519)', isGradient: true },
  { name: 'Sunset Glow 79', value: 'linear-gradient(272deg, #f7c03e, #1a5aef)', isGradient: true },
  { name: 'Sunset Blaze 80', value: 'linear-gradient(191deg, #e8791d, #fcf11a)', isGradient: true },
  { name: 'Ocean Wave 81', value: 'linear-gradient(201deg, #1d8abd, #bc4006)', isGradient: true },
  { name: 'Ocean Deep 82', value: 'linear-gradient(194deg, #3060fd, #1babdf)', isGradient: true },
  { name: 'Ocean Abyss 83', value: 'linear-gradient(47deg, #4d73e4, #5923fd)', isGradient: true },
  { name: 'Ocean Tide 84', value: 'linear-gradient(5deg, #2d43f9, #1f78b1)', isGradient: true },
  { name: 'Ocean Deep 85', value: 'linear-gradient(101deg, #0d81ce, #06e4ce)', isGradient: true },
  { name: 'Ocean Tide 86', value: 'linear-gradient(129deg, #0244b1, #2b1c9d)', isGradient: true },
  { name: 'Ocean Tide 87', value: 'linear-gradient(204deg, #2e46e7, #207db4)', isGradient: true },
  { name: 'Ocean Tide 88', value: 'linear-gradient(332deg, #42e2ea, #1074ef)', isGradient: true },
  { name: 'Ocean Wave 89', value: 'linear-gradient(261deg, #0569cb, #2527f1)', isGradient: true },
  { name: 'Ocean Wave 90', value: 'linear-gradient(135deg, #1f85b5, #0626b9)', isGradient: true },
  { name: 'Ocean Tide 91', value: 'linear-gradient(270deg, #1ed9df, #0e6ad4)', isGradient: true },
  { name: 'Ocean Tide 92', value: 'linear-gradient(133deg, #0a24fd, #4b07b2)', isGradient: true },
  { name: 'Ocean Breeze 93', value: 'linear-gradient(46deg, #02bdd6, #2cfcac)', isGradient: true },
  { name: 'Ocean Tide 94', value: 'linear-gradient(155deg, #0307c3, #f1ee2f)', isGradient: true },
  { name: 'Ocean Tide 95', value: 'linear-gradient(313deg, #05bbec, #39f2bd)', isGradient: true },
  { name: 'Ocean Breeze 96', value: 'linear-gradient(252deg, #3f4eef, #7b27f4)', isGradient: true },
  { name: 'Ocean Abyss 97', value: 'linear-gradient(229deg, #3eade0, #0fc4a3)', isGradient: true },
  { name: 'Ocean Tide 98', value: 'linear-gradient(186deg, #30b5e0, #14b48b)', isGradient: true },
  { name: 'Ocean Tide 99', value: 'linear-gradient(215deg, #0223ff, #0182cd)', isGradient: true },
  { name: 'Ocean Wave 100', value: 'linear-gradient(274deg, #1c37ed, #4302b1)', isGradient: true },
  { name: 'Ocean Tide 101', value: 'linear-gradient(295deg, #0a26f8, #0192eb)', isGradient: true },
  { name: 'Ocean Tide 102', value: 'linear-gradient(100deg, #19a8c7, #175ff5)', isGradient: true },
  { name: 'Ocean Tide 103', value: 'linear-gradient(96deg, #11bcf3, #b8350b)', isGradient: true },
  { name: 'Ocean Abyss 104', value: 'linear-gradient(230deg, #273efb, #8348e0)', isGradient: true },
  { name: 'Ocean Wave 105', value: 'linear-gradient(29deg, #1233c9, #0aabf7)', isGradient: true },
  { name: 'Ocean Abyss 106', value: 'linear-gradient(275deg, #4244e8, #0e69c2)', isGradient: true },
  { name: 'Ocean Deep 107', value: 'linear-gradient(136deg, #029ddb, #11d8ae)', isGradient: true },
  { name: 'Ocean Breeze 108', value: 'linear-gradient(263deg, #2393e9, #13ffef)', isGradient: true },
  { name: 'Ocean Breeze 109', value: 'linear-gradient(0deg, #1042c1, #deaf36)', isGradient: true },
  { name: 'Ocean Deep 110', value: 'linear-gradient(351deg, #12bec6, #287ee4)', isGradient: true },
  { name: 'Ocean Breeze 111', value: 'linear-gradient(109deg, #2634da, #cbbc0f)', isGradient: true },
  { name: 'Ocean Tide 112', value: 'linear-gradient(129deg, #0694c1, #22fdc5)', isGradient: true },
  { name: 'Ocean Tide 113', value: 'linear-gradient(151deg, #0cdfef, #d82e20)', isGradient: true },
  { name: 'Ocean Breeze 114', value: 'linear-gradient(65deg, #1367d3, #1708f5)', isGradient: true },
  { name: 'Ocean Abyss 115', value: 'linear-gradient(346deg, #08bec8, #1bcb7c)', isGradient: true },
  { name: 'Ocean Tide 116', value: 'linear-gradient(238deg, #0a7cb8, #0c29bf)', isGradient: true },
  { name: 'Ocean Breeze 117', value: 'linear-gradient(163deg, #0651c9, #3014fb)', isGradient: true },
  { name: 'Ocean Breeze 118', value: 'linear-gradient(189deg, #2559d9, #431ecb)', isGradient: true },
  { name: 'Ocean Tide 119', value: 'linear-gradient(240deg, #3681ee, #32e9fc)', isGradient: true },
  { name: 'Ocean Abyss 120', value: 'linear-gradient(47deg, #1251f6, #11a4cf)', isGradient: true },
  { name: 'Nature Pine 121', value: 'linear-gradient(250deg, #7ed913, #d1ca2c)', isGradient: true },
  { name: 'Nature Pine 122', value: 'linear-gradient(25deg, #1bdd5c, #c11687)', isGradient: true },
  { name: 'Nature Mint 123', value: 'linear-gradient(32deg, #2bb924, #6aa622)', isGradient: true },
  { name: 'Nature Mint 124', value: 'linear-gradient(355deg, #60a814, #159712)', isGradient: true },
  { name: 'Nature Mint 125', value: 'linear-gradient(159deg, #3ca612, #1ca539)', isGradient: true },
  { name: 'Nature Pine 126', value: 'linear-gradient(183deg, #56ed0e, #11e837)', isGradient: true },
  { name: 'Nature Grove 127', value: 'linear-gradient(172deg, #0ed066, #96145b)', isGradient: true },
  { name: 'Nature Leaf 128', value: 'linear-gradient(293deg, #19a238, #bd2b9d)', isGradient: true },
  { name: 'Nature Pine 129', value: 'linear-gradient(290deg, #2dd117, #1ad360)', isGradient: true },
  { name: 'Nature Leaf 130', value: 'linear-gradient(230deg, #5eb40c, #6610b9)', isGradient: true },
  { name: 'Nature Grove 131', value: 'linear-gradient(201deg, #89be2c, #ceb411)', isGradient: true },
  { name: 'Nature Leaf 132', value: 'linear-gradient(206deg, #11e612, #13e87e)', isGradient: true },
  { name: 'Nature Moss 133', value: 'linear-gradient(335deg, #10d269, #910a53)', isGradient: true },
  { name: 'Nature Pine 134', value: 'linear-gradient(12deg, #26ab0a, #7c1492)', isGradient: true },
  { name: 'Nature Leaf 135', value: 'linear-gradient(208deg, #2b8119, #7fa928)', isGradient: true },
  { name: 'Nature Grove 136', value: 'linear-gradient(86deg, #2eb616, #7aa923)', isGradient: true },
  { name: 'Nature Leaf 137', value: 'linear-gradient(12deg, #2abc33, #12ce7b)', isGradient: true },
  { name: 'Nature Mint 138', value: 'linear-gradient(343deg, #0db94f, #c01e82)', isGradient: true },
  { name: 'Nature Mint 139', value: 'linear-gradient(73deg, #27ae46, #0a9e76)', isGradient: true },
  { name: 'Nature Mint 140', value: 'linear-gradient(330deg, #14c263, #249c97)', isGradient: true },
  { name: 'Nature Moss 141', value: 'linear-gradient(347deg, #34941f, #618417)', isGradient: true },
  { name: 'Nature Mint 142', value: 'linear-gradient(251deg, #279220, #21c76a)', isGradient: true },
  { name: 'Nature Mint 143', value: 'linear-gradient(94deg, #20d170, #16dbd2)', isGradient: true },
  { name: 'Nature Moss 144', value: 'linear-gradient(162deg, #27c649, #148866)', isGradient: true },
  { name: 'Nature Leaf 145', value: 'linear-gradient(212deg, #1c9542, #2dbf0b)', isGradient: true },
  { name: 'Nature Moss 146', value: 'linear-gradient(241deg, #10be5a, #2bd0c4)', isGradient: true },
  { name: 'Nature Grove 147', value: 'linear-gradient(251deg, #0bc25d, #1eb616)', isGradient: true },
  { name: 'Nature Grove 148', value: 'linear-gradient(347deg, #6ec213, #99970f)', isGradient: true },
  { name: 'Nature Leaf 149', value: 'linear-gradient(210deg, #0b952b, #42c114)', isGradient: true },
  { name: 'Nature Pine 150', value: 'linear-gradient(283deg, #5ba80f, #571797)', isGradient: true },
  { name: 'Nature Pine 151', value: 'linear-gradient(228deg, #20b82e, #2cb37b)', isGradient: true },
  { name: 'Nature Mint 152', value: 'linear-gradient(295deg, #3b831e, #a5cd14)', isGradient: true },
  { name: 'Nature Mint 153', value: 'linear-gradient(239deg, #48c62f, #188d3f)', isGradient: true },
  { name: 'Nature Grove 154', value: 'linear-gradient(101deg, #2da911, #0ca23b)', isGradient: true },
  { name: 'Nature Pine 155', value: 'linear-gradient(278deg, #209a42, #910b6d)', isGradient: true },
  { name: 'Nature Leaf 156', value: 'linear-gradient(92deg, #4bb41f, #80991d)', isGradient: true },
  { name: 'Nature Leaf 157', value: 'linear-gradient(202deg, #36ca1d, #6a9717)', isGradient: true },
  { name: 'Nature Grove 158', value: 'linear-gradient(199deg, #0db248, #b41f7e)', isGradient: true },
  { name: 'Nature Leaf 159', value: 'linear-gradient(325deg, #5de913, #952bcd)', isGradient: true },
  { name: 'Nature Leaf 160', value: 'linear-gradient(202deg, #0a9143, #24c416)', isGradient: true },
  { name: 'Pastel Soft 161', value: 'linear-gradient(267deg, #ecd4be, #e5a3a5)', isGradient: true },
  { name: 'Pastel Candy 162', value: 'linear-gradient(67deg, #d0f3cd, #a0e0bb)', isGradient: true },
  { name: 'Pastel Mist 163', value: 'linear-gradient(315deg, #ebe3c8, #eab8a4)', isGradient: true },
  { name: 'Pastel Soft 164', value: 'linear-gradient(163deg, #e6aae7, #f2d0e2)', isGradient: true },
  { name: 'Pastel Cloud 165', value: 'linear-gradient(356deg, #d8eaab, #b3a0e1)', isGradient: true },
  { name: 'Pastel Candy 166', value: 'linear-gradient(134deg, #d5bfef, #c5c7f0)', isGradient: true },
  { name: 'Pastel Soft 167', value: 'linear-gradient(265deg, #e8c0dd, #eca8b8)', isGradient: true },
  { name: 'Pastel Dream 168', value: 'linear-gradient(90deg, #c6eee2, #d3eaf0)', isGradient: true },
  { name: 'Pastel Dream 169', value: 'linear-gradient(130deg, #e499e7, #c4efc2)', isGradient: true },
  { name: 'Pastel Candy 170', value: 'linear-gradient(21deg, #eda5c5, #e7a0e2)', isGradient: true },
  { name: 'Pastel Mist 171', value: 'linear-gradient(268deg, #e2afd9, #dcbbec)', isGradient: true },
  { name: 'Pastel Soft 172', value: 'linear-gradient(319deg, #b0dae0, #aaebd2)', isGradient: true },
  { name: 'Pastel Dream 173', value: 'linear-gradient(294deg, #a8e2e7, #c2e7d7)', isGradient: true },
  { name: 'Pastel Cloud 174', value: 'linear-gradient(133deg, #b0dcab, #d8f0e1)', isGradient: true },
  { name: 'Pastel Candy 175', value: 'linear-gradient(340deg, #c8cae9, #b0d0ec)', isGradient: true },
  { name: 'Pastel Dream 176', value: 'linear-gradient(279deg, #cdf6f6, #c1f1d9)', isGradient: true },
  { name: 'Pastel Soft 177', value: 'linear-gradient(125deg, #caf5df, #d5f1d5)', isGradient: true },
  { name: 'Pastel Soft 178', value: 'linear-gradient(337deg, #b6ceeb, #9ee7eb)', isGradient: true },
  { name: 'Pastel Candy 179', value: 'linear-gradient(299deg, #bfa5de, #c5dca9)', isGradient: true },
  { name: 'Pastel Soft 180', value: 'linear-gradient(334deg, #c3dce7, #c5eee6)', isGradient: true },
  { name: 'Pastel Dream 181', value: 'linear-gradient(259deg, #d1b1e0, #c5ecb1)', isGradient: true },
  { name: 'Pastel Candy 182', value: 'linear-gradient(206deg, #ecc5d6, #ebb9b6)', isGradient: true },
  { name: 'Pastel Soft 183', value: 'linear-gradient(37deg, #cfe0b5, #c0a9e2)', isGradient: true },
  { name: 'Pastel Soft 184', value: 'linear-gradient(288deg, #abddb6, #e8b4dd)', isGradient: true },
  { name: 'Pastel Candy 185', value: 'linear-gradient(291deg, #d5deaa, #c7ecb5)', isGradient: true },
  { name: 'Pastel Candy 186', value: 'linear-gradient(114deg, #e9e2c8, #e4b29c)', isGradient: true },
  { name: 'Pastel Soft 187', value: 'linear-gradient(14deg, #d5d9f5, #cfe2ed)', isGradient: true },
  { name: 'Pastel Mist 188', value: 'linear-gradient(288deg, #a7ead4, #cfeef5)', isGradient: true },
  { name: 'Pastel Soft 189', value: 'linear-gradient(306deg, #c2f3da, #ecc9db)', isGradient: true },
  { name: 'Pastel Mist 190', value: 'linear-gradient(80deg, #bfeaa4, #dce2b1)', isGradient: true },
  { name: 'Pastel Dream 191', value: 'linear-gradient(262deg, #f5dec6, #eaebbc)', isGradient: true },
  { name: 'Pastel Dream 192', value: 'linear-gradient(12deg, #c8efbc, #ccefd5)', isGradient: true },
  { name: 'Pastel Candy 193', value: 'linear-gradient(246deg, #c3e7c9, #afe3d1)', isGradient: true },
  { name: 'Pastel Dream 194', value: 'linear-gradient(165deg, #ecb1aa, #f6d0df)', isGradient: true },
  { name: 'Pastel Candy 195', value: 'linear-gradient(78deg, #d3e8f2, #a8b2e0)', isGradient: true },
  { name: 'Pastel Candy 196', value: 'linear-gradient(50deg, #d4eee1, #c0eeef)', isGradient: true },
  { name: 'Pastel Soft 197', value: 'linear-gradient(83deg, #f4d5f4, #f1bed6)', isGradient: true },
  { name: 'Pastel Soft 198', value: 'linear-gradient(324deg, #94aceb, #afdbe7)', isGradient: true },
  { name: 'Pastel Cloud 199', value: 'linear-gradient(169deg, #b8b6ef, #e1d2ef)', isGradient: true },
  { name: 'Pastel Cloud 200', value: 'linear-gradient(205deg, #efcdd6, #ebcde4)', isGradient: true },
  { name: 'Dark Shadow 201', value: 'linear-gradient(87deg, #3f2b29, #3e2c33)', isGradient: true },
  { name: 'Dark Onyx 202', value: 'linear-gradient(203deg, #21202f, #3c3243)', isGradient: true },
  { name: 'Dark Midnight 203', value: 'linear-gradient(299deg, #45284f, #1b152f)', isGradient: true },
  { name: 'Dark Onyx 204', value: 'linear-gradient(32deg, #34251f, #4d2f36)', isGradient: true },
  { name: 'Dark Shadow 205', value: 'linear-gradient(16deg, #482f2f, #36312c)', isGradient: true },
  { name: 'Dark Night 206', value: 'linear-gradient(179deg, #352734, #1c181f)', isGradient: true },
  { name: 'Dark Shadow 207', value: 'linear-gradient(83deg, #4d2c4e, #261f2d)', isGradient: true },
  { name: 'Dark Shadow 208', value: 'linear-gradient(14deg, #171323, #3f3243)', isGradient: true },
  { name: 'Dark Shadow 209', value: 'linear-gradient(310deg, #272a19, #1c1634)', isGradient: true },
  { name: 'Dark Onyx 210', value: 'linear-gradient(194deg, #273957, #26494f)', isGradient: true },
  { name: 'Dark Onyx 211', value: 'linear-gradient(130deg, #3d2c2c, #291b22)', isGradient: true },
  { name: 'Dark Obsidian 212', value: 'linear-gradient(147deg, #484d26, #241d10)', isGradient: true },
  { name: 'Dark Midnight 213', value: 'linear-gradient(312deg, #464220, #21251c)', isGradient: true },
  { name: 'Dark Night 214', value: 'linear-gradient(122deg, #31242e, #381e41)', isGradient: true },
  { name: 'Dark Night 215', value: 'linear-gradient(204deg, #204346, #492e2b)', isGradient: true },
  { name: 'Dark Shadow 216', value: 'linear-gradient(208deg, #241c10, #253855)', isGradient: true },
  { name: 'Dark Night 217', value: 'linear-gradient(197deg, #1c2822, #173318)', isGradient: true },
  { name: 'Dark Night 218', value: 'linear-gradient(256deg, #4f2c2a, #392d1e)', isGradient: true },
  { name: 'Dark Onyx 219', value: 'linear-gradient(38deg, #372347, #261225)', isGradient: true },
  { name: 'Dark Obsidian 220', value: 'linear-gradient(318deg, #372c2d, #4a3441)', isGradient: true },
  { name: 'Dark Shadow 221', value: 'linear-gradient(290deg, #27243b, #303a4b)', isGradient: true },
  { name: 'Dark Night 222', value: 'linear-gradient(217deg, #442d37, #483547)', isGradient: true },
  { name: 'Dark Obsidian 223', value: 'linear-gradient(128deg, #303b21, #211630)', isGradient: true },
  { name: 'Dark Shadow 224', value: 'linear-gradient(10deg, #351b31, #3b252d)', isGradient: true },
  { name: 'Dark Night 225', value: 'linear-gradient(102deg, #302b36, #2f1c30)', isGradient: true },
  { name: 'Dark Night 226', value: 'linear-gradient(137deg, #1b2b23, #152121)', isGradient: true },
  { name: 'Dark Midnight 227', value: 'linear-gradient(300deg, #1d2125, #242335)', isGradient: true },
  { name: 'Dark Shadow 228', value: 'linear-gradient(142deg, #2f252b, #3c263e)', isGradient: true },
  { name: 'Dark Obsidian 229', value: 'linear-gradient(183deg, #3b293d, #46303d)', isGradient: true },
  { name: 'Dark Shadow 230', value: 'linear-gradient(200deg, #1d1817, #331c22)', isGradient: true },
  { name: 'Dark Onyx 231', value: 'linear-gradient(26deg, #28313e, #161522)', isGradient: true },
  { name: 'Dark Obsidian 232', value: 'linear-gradient(30deg, #281f24, #183224)', isGradient: true },
  { name: 'Dark Shadow 233', value: 'linear-gradient(121deg, #373f46, #31313d)', isGradient: true },
  { name: 'Dark Onyx 234', value: 'linear-gradient(75deg, #302630, #482e3c)', isGradient: true },
  { name: 'Dark Onyx 235', value: 'linear-gradient(34deg, #221c25, #333f2e)', isGradient: true },
  { name: 'Dark Midnight 236', value: 'linear-gradient(118deg, #1b3519, #182f22)', isGradient: true },
  { name: 'Dark Shadow 237', value: 'linear-gradient(260deg, #305223, #1e2212)', isGradient: true },
  { name: 'Dark Shadow 238', value: 'linear-gradient(215deg, #463747, #32272d)', isGradient: true },
  { name: 'Dark Midnight 239', value: 'linear-gradient(331deg, #33253f, #384030)', isGradient: true },
  { name: 'Dark Onyx 240', value: 'linear-gradient(342deg, #472835, #214234)', isGradient: true }
];

export const GRADIENT_COLORS: ThemeColor[] = [...GRADIENT_COLORS_RAW].sort(
  (a, b) => averageGradientLuminance(b.value) - averageGradientLuminance(a.value)
);

export const SOLID_COLORS = generateSolidColors().sort(
  (a, b) => hexLuminance(b.value) - hexLuminance(a.value)
);

// --- Theme Application Logic -------------------------------------------
let currentStyleTag: HTMLStyleElement | null = null;
export const COLOR_STORAGE_KEY = 'velocitype_user_color';

export function getStoredColor(): ThemeColor | null {
  try {
    const raw = localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ThemeColor;
  } catch {
    return null;
  }
}

function saveStoredColor(color: ThemeColor): void {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(color));
  } catch {
    // Storage unavailable
  }
}

export const applyTextColor = (color: ThemeColor, persist: boolean = true) => {
  if (typeof document === 'undefined') return;

  if (!currentStyleTag) {
    currentStyleTag = document.getElementById('velocitype-dynamic-text-color') as HTMLStyleElement;
    if (!currentStyleTag) {
      currentStyleTag = document.createElement('style');
      currentStyleTag.id = 'velocitype-dynamic-text-color';
      document.head.appendChild(currentStyleTag);
    }
  }

  const root = document.documentElement;
  if (color.isGradient) {
    root.style.setProperty('--text-color', 'transparent');
    root.style.setProperty('--text-bg', color.value);
    root.style.setProperty('--text-fill', 'transparent');
  } else {
    root.style.setProperty('--text-color', color.value);
    root.style.setProperty('--text-bg', 'initial');
    root.style.setProperty('--text-fill', 'initial');
  }

  // Safely target text elements and interactive elements without breaking structural block backgrounds like div or body
  const textSelectors = `h1, h2, h3, h4, h5, h6, p, span:not(.exclude-theme), a, label, li, code, strong, em, b, i, button:not(.exclude-theme), input:not(.exclude-theme), select:not(.exclude-theme), textarea:not(.exclude-theme), td, th`;

  // Extracted color for SVG icon strokes and theme variables
  const hexes = color.value.match(/#[0-9a-fA-F]{6}/g) || ['#f59e0b'];
  const primaryHex = hexes[0];
  const secondaryHex = hexes.length > 1 ? hexes[1] : primaryHex;
  
  root.style.setProperty('--hot', primaryHex);
  root.style.setProperty('--ember', secondaryHex);
  root.style.setProperty('--hot-soft', primaryHex + '33'); // 20% opacity hex
  
  const fallbackHex = primaryHex;

  if (color.isGradient) {
    currentStyleTag.innerHTML = `
      ${textSelectors} {
        background-image: ${color.value} !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        color: transparent !important;
      }
      svg:not(.color-picker-check) {
        color: ${fallbackHex} !important;
        stroke: ${fallbackHex} !important;
      }
    `;
  } else {
    currentStyleTag.innerHTML = `
      ${textSelectors} {
        color: ${color.value} !important;
      }
      svg:not(.color-picker-check) {
        color: ${color.value} !important;
        stroke: ${color.value} !important;
      }
    `;
  }

  if (persist) {
    saveStoredColor(color);
  }

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('themeColorChanged', { detail: color }));
};

export function initializeActiveColor(): void {
  const stored = getStoredColor();
  if (stored) {
    applyTextColor(stored, false);
  }
}

const BG_COLOR_STORAGE_KEY = 'velocitype_bg_color_theme';

export function getStoredBgColor(): ThemeColor | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BG_COLOR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveStoredBgColor(color: ThemeColor): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BG_COLOR_STORAGE_KEY, JSON.stringify(color));
  } catch {}
}

let currentBgStyleTag: HTMLStyleElement | null = null;

export const applyBgColor = (color: ThemeColor, persist: boolean = true) => {
  if (typeof document === 'undefined') return;

  if (!currentBgStyleTag) {
    currentBgStyleTag = document.getElementById('velocitype-dynamic-bg-color') as HTMLStyleElement;
    if (!currentBgStyleTag) {
      currentBgStyleTag = document.createElement('style');
      currentBgStyleTag.id = 'velocitype-dynamic-bg-color';
      document.head.appendChild(currentBgStyleTag);
    }
  }

  const root = document.documentElement;
  
  if (color.isGradient) {
    currentBgStyleTag.innerHTML = `
      :root, html, body, #root, .bg-background {
        background: ${color.value} !important;
        background-attachment: fixed !important;
      }
    `;
  } else {
    currentBgStyleTag.innerHTML = `
      :root, html, body, #root, .bg-background {
        background: ${color.value} !important;
      }
    `;
  }

  if (persist) {
    saveStoredBgColor(color);
  }

  window.dispatchEvent(new Event('storage'));
};

export function initializeActiveBgColor(): void {
  const stored = getStoredBgColor();
  if (stored) {
    applyBgColor(stored, false);
  }
}