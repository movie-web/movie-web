import { createTheme } from "../types";

const tokens = {
  purple: {
    c50: "#e6f7f7",
    c100: "#cceef0",
    c200: "#99dde0",
    c300: "#66ccd1",
    c400: "#33bbc1",
    c500: "#00a9b2",
    c600: "#008c99",
    c700: "#007380",
    c800: "#005e66",
    c900: "#00444d",
  },
  shade: {
    c50: "#ffebe6",
    c100: "#ffccc0",
    c200: "#ffad99",
    c300: "#ff8c73",
    c400: "#ff6b4d",
    c500: "#ff4a26",
    c600: "#e63d20",
    c700: "#c3311a",
    c800: "#430a03",
    c900: "#80180e",
  },
  ash: {
    c50: "#f2ebff",
    c100: "#e0d6ff",
    c200: "#b3a3ff",
    c300: "#2b344e",
    c400: "#4d3bff",
    c500: "#1c243c",
    c600: "#1606e6",
    c700: "#1205bf",
    c800: "#0e0499",
    c900: "#0a0373",
  },
  blue: {
    c50: "#ffe6f7",
    c100: "#fcb3e0",
    c200: "red",
    c300: "#f64db2",
    c400: "#f31a9b",
    c500: "#e30087",
    c600: "#bf0073",
    c700: "#99005f",
    c800: "#73004b",
    c900: "#4d0037",
  },
};

export default createTheme({
  name: "orange",
  extend: {
    colors: {
      themePreview: {
        primary: tokens.blue.c200,
        secondary: tokens.shade.c50,
      },

      pill: {
        background: tokens.shade.c300,
        backgroundHover: tokens.shade.c200,
        highlight: tokens.blue.c200,
      },

      global: {
        accentA: tokens.blue.c200,
        accentB: tokens.blue.c300,
      },

      lightBar: {
        light: tokens.blue.c400,
      },

      buttons: {
        toggle: tokens.purple.c300,
        toggleDisabled: tokens.ash.c500,

        secondary: tokens.ash.c700,
        secondaryHover: tokens.ash.c700,
        purple: tokens.purple.c500,
        purpleHover: tokens.purple.c400,
        cancel: tokens.ash.c500,
        cancelHover: tokens.ash.c300,
      },

      background: {
        main: tokens.shade.c900,
        secondary: tokens.shade.c600,
        secondaryHover: tokens.shade.c400,
        accentA: tokens.purple.c500,
        accentB: tokens.blue.c500,
      },

      type: {
        logo: tokens.purple.c100,
        text: tokens.shade.c50,
        dimmed: tokens.shade.c50,
        divider: tokens.ash.c500,
        secondary: tokens.ash.c100,
        link: tokens.purple.c100,
        linkHover: tokens.purple.c50,
      },

      search: {
        background: tokens.shade.c500,
        focused: tokens.shade.c400,
        placeholder: tokens.shade.c100,
        icon: tokens.shade.c100,
      },

      mediaCard: {
        hoverBackground: tokens.shade.c600,
        hoverAccent: tokens.shade.c50,
        hoverShadow: tokens.shade.c900,
        shadow: tokens.shade.c700,
        barColor: tokens.ash.c200,
        barFillColor: tokens.purple.c100,
        badge: tokens.shade.c700,
        badgeText: tokens.ash.c100,
      },

      largeCard: {
        background: tokens.shade.c600,
        icon: tokens.purple.c400,
      },

      dropdown: {
        background: tokens.shade.c600,
        altBackground: tokens.shade.c700,
        hoverBackground: tokens.shade.c500,
        text: tokens.shade.c50,
        secondary: tokens.shade.c100,
        border: tokens.shade.c400,
        contentBackground: tokens.shade.c500,
      },

      authentication: {
        border: tokens.shade.c300,
        inputBg: tokens.shade.c600,
        inputBgHover: tokens.shade.c500,
        wordBackground: tokens.shade.c500,
        copyText: tokens.shade.c100,
        copyTextHover: tokens.ash.c50,
      },

      settings: {
        sidebar: {
          activeLink: tokens.shade.c600,
          badge: tokens.shade.c900,

          type: {
            secondary: tokens.shade.c200,
            inactive: tokens.shade.c50,
            icon: tokens.shade.c50,
            iconActivated: tokens.purple.c200,
            activated: tokens.purple.c50,
          },
        },

        card: {
          border: tokens.shade.c400,
          background: tokens.shade.c400,
          altBackground: tokens.shade.c400,
        },

        saveBar: {
          background: tokens.shade.c800,
        },
      },

      utils: {
        divider: tokens.ash.c300,
      },

      errors: {
        card: tokens.shade.c800,
        border: tokens.ash.c500,

        type: {
          secondary: tokens.ash.c100,
        },
      },

      about: {
        circle: tokens.ash.c500,
        circleText: tokens.ash.c50,
      },

      editBadge: {
        bg: tokens.ash.c500,
        bgHover: tokens.ash.c400,
        text: tokens.ash.c50,
      },

      progress: {
        background: tokens.ash.c50,
        preloaded: tokens.ash.c50,
        filled: tokens.purple.c200,
      },

      video: {
        buttonBackground: tokens.ash.c200,

        autoPlay: {
          background: tokens.ash.c700,
          hover: tokens.ash.c500,
        },

        scraping: {
          card: tokens.shade.c700,
          loading: tokens.purple.c200,
          noresult: tokens.ash.c100,
        },

        audio: {
          set: tokens.purple.c200,
        },

        context: {
          background: tokens.ash.c900,
          light: tokens.shade.c50,
          border: tokens.ash.c600,
          hoverColor: tokens.ash.c600,
          buttonFocus: tokens.ash.c500,
          flagBg: tokens.ash.c500,
          inputBg: tokens.ash.c600,
          buttonOverInputHover: tokens.ash.c500,
          inputPlaceholder: tokens.ash.c200,
          cardBorder: tokens.ash.c700,
          slider: tokens.ash.c50,
          sliderFilled: tokens.purple.c200,

          buttons: {
            list: tokens.ash.c700,
            active: tokens.ash.c900,
          },

          closeHover: tokens.ash.c800,

          type: {
            secondary: tokens.ash.c200,
            accent: tokens.purple.c200,
          },
        },
      },
    },
  },
});
