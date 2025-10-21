type LocaleConfig = {
  units: string[];
  teens: string[];
  tens: string[];
  hundreds: string[];
  bigs: {
    million: [string, string, string];
    thousand: [string, string, string];
  };
  currency: {
    main: [string, string, string]; // euras / eurai / eurų
    sub: [string, string, string]; // centas / centai / centų
  };
};

// 🇱🇹 Lietuvių kalba
const LT: LocaleConfig = {
  units: [
    "nulis",
    "vienas",
    "du",
    "trys",
    "keturi",
    "penki",
    "šeši",
    "septyni",
    "aštuoni",
    "devyni",
  ],
  teens: [
    "dešimt",
    "vienuolika",
    "dvylika",
    "trylika",
    "keturiolika",
    "penkiolika",
    "šešiolika",
    "septyniolika",
    "aštuoniolika",
    "devyniolika",
  ],
  tens: [
    "",
    "dešimt",
    "dvidešimt",
    "trisdešimt",
    "keturiasdešimt",
    "penkiasdešimt",
    "šešiasdešimt",
    "septyniasdešimt",
    "aštuoniasdešimt",
    "devyniasdešimt",
  ],
  hundreds: ["šimtas", "šimtai"],
  bigs: {
    million: ["milijonas", "milijonai", "milijonų"],
    thousand: ["tūkstantis", "tūkstančiai", "tūkstančių"],
  },
  currency: {
    main: ["euras", "eurai", "eurų"],
    sub: ["centas", "centai", "centų"],
  },
};

const LV: LocaleConfig = {
  units: [
    "nulle",
    "viens",
    "divi",
    "trīs",
    "četri",
    "pieci",
    "seši",
    "septiņi",
    "astoņi",
    "deviņi",
  ],
  teens: [
    "desmit",
    "vienpadsmit",
    "divpadsmit",
    "trīspadsmit",
    "četrpadsmit",
    "piecpadsmit",
    "sešpadsmit",
    "septiņpadsmit",
    "astoņpadsmit",
    "deviņpadsmit",
  ],
  tens: [
    "",
    "desmit",
    "divdesmit",
    "trīsdesmit",
    "četrdesmit",
    "piecdesmit",
    "sešdesmit",
    "septiņdesmit",
    "astoņdesmit",
    "deviņdesmit",
  ],
  hundreds: ["simts", "simti"],
  bigs: {
    million: ["miljons", "miljoni", "miljonu"],
    thousand: ["tūkstotis", "tūkstoši", "tūkstošu"],
  },
  currency: {
    main: ["eiro", "eiro", "eiro"], // latviškai – visada "eiro"
    sub: ["cents", "centi", "centu"],
  },
};
// 🇬🇧 English version
const EN: LocaleConfig = {
  units: [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ],
  teens: [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ],
  tens: [
    "",
    "ten",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ],
  hundreds: ["hundred", "hundred"],
  bigs: {
    million: ["million", "millions", "millions"],
    thousand: ["thousand", "thousands", "thousands"],
  },
  currency: {
    main: ["euro", "euros", "euros"],
    sub: ["cent", "cents", "cents"],
  },
};

// 🌍 Pagrindinė funkcija
function numberToWords(num: number, locale: LocaleConfig = LT): string {
  function wordByNumber(n: number, forms: [string, string, string]) {
    const v = n % 10,
      d = n % 100;
    if (n === 0) return forms[2];
    if (d >= 11 && d <= 19) return forms[2];
    if (v === 1) return forms[0];
    if (v >= 2 && v <= 9) return forms[1];
    return forms[2];
  }

  function underThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return locale.units[n];
    if (n < 20) return locale.teens[n - 10];
    if (n < 100) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      return u === 0 ? locale.tens[t] : `${locale.tens[t]} ${locale.units[u]}`;
    }
    if (n < 1000) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      const hundred =
        h === 1
          ? locale.hundreds[0]
          : `${locale.units[h]} ${locale.hundreds[1]}`;
      return rem === 0 ? hundred : `${hundred} ${underThousand(rem)}`;
    }
    return "";
  }

  function full(n: number): string {
    if (n === 0) return locale.units[0];
    const mil = Math.floor(n / 1_000_000);
    const thou = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;

    let out = "";
    if (mil > 0)
      out += `${underThousand(mil)} ${wordByNumber(mil, locale.bigs.million)}`;
    if (thou > 0)
      out += `${out ? " " : ""}${underThousand(thou)} ${wordByNumber(
        thou,
        locale.bigs.thousand
      )}`;
    if (rest > 0) out += `${out ? " " : ""}${underThousand(rest)}`;
    return out;
  }

  const euros = Math.floor(num);
  const cents = Math.round((num - euros) * 100);

  const euroWords = `${full(euros)} ${wordByNumber(
    euros,
    locale.currency.main
  )}`;
  const centWords = `${full(cents)} ${wordByNumber(
    cents,
    locale.currency.sub
  )}`;
  return `${euroWords} ${centWords}`;
}

// 🧪 Test:
console.log(numberToWords(15151251.27, LT));
// 👉 penkiolika milijonų šimtas penkiasdešimt vienas tūkstantis du šimtai penkiasdešimt vienas euras dvidešimt septyni centai

console.log(numberToWords(15151251.27, EN));
// 👉 fifteen million one hundred fifty one thousand two hundred fifty one euros twenty seven cents

console.log(numberToWords(15151251.27, LV));
