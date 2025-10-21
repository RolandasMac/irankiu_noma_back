function skaiciusZodziais(num: number): string {
  const vienetai = [
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
  ];
  const paaugliai = [
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
  ];
  const desimtys = [
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
  ];

  function ikiTukstancio(n: number): string {
    if (n === 0) return "";
    if (n < 10) return vienetai[n];
    if (n < 20) return paaugliai[n - 10];
    if (n < 100) {
      const d = Math.floor(n / 10);
      const v = n % 10;
      return v === 0 ? desimtys[d] : `${desimtys[d]} ${vienetai[v]}`;
    }
    if (n < 1000) {
      const s = Math.floor(n / 100);
      const lik = n % 100;
      const simtas = s === 1 ? "šimtas" : `${vienetai[s]} šimtai`;
      return lik === 0 ? simtas : `${simtas} ${ikiTukstancio(lik)}`;
    }
    return "";
  }

  // Pasirinkti teisingą galūnę (vienaskaita / daugiskaita)
  function zodisPagalSkaiciu(
    skaicius: number,
    zodziai: [string, string, string]
  ) {
    // zodziai: [vienaskaita, daugiskaita, daugiskaita_kilmininkas]
    const v = skaicius % 10;
    const d = skaicius % 100;
    if (skaicius === 0) return zodziai[2];
    if (d >= 11 && d <= 19) return zodziai[2];
    if (v === 1) return zodziai[0];
    if (v >= 2 && v <= 9) return zodziai[1];
    return zodziai[2];
  }

  function ikiMilijardu(n: number): string {
    if (n === 0) return vienetai[0];

    const milijonai = Math.floor(n / 1_000_000);
    const tukstanciai = Math.floor((n % 1_000_000) / 1000);
    const likutis = n % 1000;

    let result = "";

    if (milijonai > 0) {
      result += `${ikiTukstancio(milijonai)} ${zodisPagalSkaiciu(milijonai, [
        "milijonas",
        "milijonai",
        "milijonų",
      ])}`;
    }

    if (tukstanciai > 0) {
      if (result) result += " ";
      result += `${ikiTukstancio(tukstanciai)} ${zodisPagalSkaiciu(
        tukstanciai,
        ["tūkstantis", "tūkstančiai", "tūkstančių"]
      )}`;
    }

    if (likutis > 0) {
      if (result) result += " ";
      result += ikiTukstancio(likutis);
    }

    return result.trim();
  }

  const skaicius = Math.floor(num);
  const centai = Math.round((num - skaicius) * 100);

  const euraiZodziais = ikiMilijardu(skaicius);
  const centaiZodziais = centai === 0 ? "nulis" : ikiTukstancio(centai);

  const euraiGalune = zodisPagalSkaiciu(skaicius, ["euras", "eurai", "eurų"]);
  const centaiGalune = zodisPagalSkaiciu(centai, ["centas", "centai", "centų"]);

  return `${euraiZodziais} ${euraiGalune} ${centaiZodziais} ${centaiGalune}`;
}

// 🧪 Testai:
console.log(skaiciusZodziais(15_151_251.27));
// 👉 penkiolika milijonų šimtas penkiasdešimt vienas tūkstantis du šimtai penkiasdešimt vienas euras dvidešimt septyni centai

console.log(skaiciusZodziais(1));
// 👉 vienas euras nulis centų

console.log(skaiciusZodziais(2));
// 👉 du eurai nulis centų

console.log(skaiciusZodziais(1000));
// 👉 vienas tūkstantis eurų nulis centų

// 🔹 Naudojimas:
console.log(skaiciusZodziais(125.45));
// 👉 "vienas šimtas dvidešimt penki eurai keturiasdešimt penki centai"

console.log(skaiciusZodziais(1));
// 👉 "vienas euras nulis centų"

console.log(skaiciusZodziais(1001.01));
// 👉 "vienas tūkstantis vienas euras vienas centas"

console.log(skaiciusZodziais(151251.01));

console.log(skaiciusZodziais(15151251.27));
