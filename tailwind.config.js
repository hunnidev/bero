/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./**/*.liquid"],
  plugins: [],
  theme: {
    extend: {
      fontFamily: {
        body: "ABCWhyteRegular, sans-serif",
        "body-bold": "ABCWhyte, sans-serif",
        arizona: "ABCArizonaFlare, sans-serif",
      },
      colors: {
        smoke: "#E6E8E7",
        cloud: "#F7F7F8",
        cream: "#FAF2E8",
        slate: "#231F20",
        gold: "#A05E11",
        "burnt-orange": "#E7AA63",
      },
      backgroundSize: {
        auto: "auto",
        cover: "cover",
        contain: "contain",
        arrow: "13px",
      },
    },
  },
};
