const fs = require("fs");
const http = require("http");
const https = require("https");
// const privateKey = fs.readFileSync("../cert/private.key", "utf8");
// const certificate = fs.readFileSync("../cert/certificate.crt", "utf8");

// const pathServ = "/etc/letsencrypt/live/kvieciu-22.macrol.lt/";
// const privateKey = fs.readFileSync(`${pathServ}privkey.pem`);
// const certificate = fs.readFileSync(`${pathServ}fullchain.pem`);
// const credentials = { key: privateKey, cert: certificate };
const rateLimit = require("express-rate-limit");
const express = require("express");
const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const {
  createProxyMiddleware,
  responseInterceptor,
  fixRequestBody,
} = require("http-proxy-middleware");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");

// viršuje pridėk importus
const axios = require("axios");

const app = express();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PROXY_PORT;
const HOST = process.env.HOST;
const BACKHOST = process.env.BACKHOST;
const AUTHPORT = process.env.AUTH_PORT;
const CLIENTPORT = process.env.CLIENT_PORT;
const TOOLPORT = process.env.TOOL_PORT;
const ORDERPORT = process.env.ORDER_PORT;
const DISCOUNTPORT = process.env.DISCOUNT_PORT;
const DOCSPORT = process.env.DOCS_PORT;

// const IMAGEPORT = process.env.IMAGE_PORT;
// const DOCSTOREPORT = process.env.DOCSTORE_PORT;
// const VOTEPORT = process.env.VOTE_PORT;
// const MEMBERPORT = process.env.MEMBER_PORT;
// const CHATAIPORT = process.env.CHAT_AI_PORT;
// const PROPOSALPORT = process.env.PROPOSAL_PORT;
// ===============================================
// 1. Bendrieji Middleware
// ===============================================
// app.use(express.json()); // Leidžia apdoroti JSON užklausų kūnus
// app.use(express.urlencoded({ extended: true })); // Leidžia apdoroti URL-encoded užklausų kūnus
app.use(cookieParser()); // Įjungiame cookie-parser middleware, kad galėtume pasiekti slapukus req.cookies
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [HOST];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
    credentials: true,
  })
);

// ===============================================
// 2. Passport.js JWT Strategijos Konfiguracija
// ===============================================
const jwtSecret = process.env.JWT_KEY; // Jūsų JWT paslaptis iš .env failo
const JWT_COOKIE_NAME = "authtoken"; // Slapuko, kuriame saugomas JWT, pavadinimas

// Funkcija, skirta išgauti JWT iš užklausos slapukų
const cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) {
    // console.log("Veikia cookies", req);
    token = req.cookies[JWT_COOKIE_NAME];
    // console.log("token", token);
  }
  // console.log("adresas", req.url);
  // console.log("Bandome išgauti tokeną iš slapukų:", token ? "Rastas" : "Nėra");
  return token;
};

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]), // NAUJAS: Ištraukiame JWT iš slapuko
  secretOrKey: jwtSecret, // Paslaptis, naudojama tokeno patvirtinimui
};

passport.use(
  "jwt-cookie",
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    // Ši funkcija iškviečiama, kai tokenas yra sėkmingai iššifruojamas.
    // console.log("JWT Payload gautas iš slapuko:", jwtPayload);

    const user = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      roles: jwtPayload.roles || [],
      name: jwtPayload.name,
    };

    if (user.id) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  })
);

// Inicijuojame Passport.js (nereikia sesijų REST API)
app.use(passport.initialize());

// ===============================================
// 3. Custom Middleware: Vartotojo duomenų perdavimas į kitus servisus ir kiti middleware
// ===============================================

// Sukuriame rate limiter'į
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: "Per daug užklausų iš vieno IP, pabandykite vėliau.",
});

// Naudojame rate limiter'į tik proxy užklausoms
// app.use("/", limiter);

// Šitas middleware perduoda user per header į servisus
const injectAuthUserToHeaders = (req, res, next) => {
  if (req.user) {
    // console.log("Vartotojas yra autentifikuotas", req.user);
    req.headers["X-User-Id"] = req.user.id;
    req.headers["X-User-Email"] = req.user.email;
    req.headers["X-User-Name"] = req.user.name;
    req.headers["X-User-Roles"] = JSON.stringify(req.user.roles); // Roles perduodamos kaip JSON stringas
    // console.log(
    //   `Prie užklausos pridedami headeriai: X-User-Id=${req.user.id},
    //    X-User-Email=${req.user.email},
    //    X-User-Roles=${req.user.roles},
    //    X-User-Name=${req.user.name}
    //   `
    // );
  } else {
    // Jei vartotojas nėra autentifikuotas (pvz., viešos užklausos),
    // užtikriname, kad šios antraštės nebūtų siunčiamos.
    delete req.headers["X-User-Id"];
    delete req.headers["X-User-Email"];
    delete req.headers["X-User-Roles"];
    delete req.headers["X-User-Name"];
    // console.log(
    //   "Vartotojas neautentifikuotas, vartotojo antraštės nepridedamos."
    // );
  }
  next();
};

// ========== TOKEN REFRESH MIDDLEWARE ==========
let ongoingRefreshPromise = null;

function shouldRefresh(token, thresholdSeconds = 30) {
  if (!token) return true;
  try {
    const payload = jwt.decode(token);
    if (!payload?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now + thresholdSeconds;
  } catch {
    return true;
  }
}

async function callRefresh(refreshToken) {
  const resp = await axios.get(`http://${BACKHOST}:${AUTHPORT}/refresh`, {
    headers: { Cookie: `refreshToken=${refreshToken}` },
    timeout: 5000,
    withCredentials: true,
  });
  return resp.data;
}

async function ensureTokensMiddleware(req, res, next) {
  const accessToken = req.cookies["authtoken"];
  const refreshToken = req.cookies["refreshToken"];
  // console.log("Cookie tkrinimas", accessToken, refreshToken);
  if (!shouldRefresh(accessToken)) return next();

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Neautentifikuotas vartotojas" });
  }

  if (ongoingRefreshPromise) {
    try {
      const data = await ongoingRefreshPromise;
      setCookiesFromRefresh(req, res, data);
      return next();
    } catch {
      return res
        .status(401)
        .json({ success: false, message: "Refresh failed" });
    }
  }

  ongoingRefreshPromise = (async () => {
    try {
      const data = await callRefresh(refreshToken);
      setCookiesFromRefresh(req, res, data);
      return data;
    } finally {
      ongoingRefreshPromise = null;
    }
  })();

  try {
    await ongoingRefreshPromise;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: `Authentication required", ${err.message}`,
    });
  }
}

function setCookiesFromRefresh(req, res, data) {
  const oneHour = 60 * 60; // sekundėmis
  const month = 30 * 24 * oneHour;
  // console.log("setCookiesFromRefresh", data);
  // res.cookie("authtoken", data.accessToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "none",
  //   maxAge: oneHour,
  //   path: "/",
  // });
  // res.cookie("refreshToken", data.refreshToken, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "none",
  //   maxAge: 30 * 24 * oneHour,
  //   path: "/",
  // });

  // 🔹 atnaujinam request cookies (kad šitas req toliau naudotų naują tokeną)
  req.cookies["authtoken"] = data.accessToken;
  req.cookies["refreshToken"] = data.refreshToken;

  // 🔹 atnaujinam Authorization headerį, jei kur nors naudojamas
  // req.headers["authorization"] = `Bearer ${data.accessToken}`;

  // res.setHeader("Set-Cookie", [
  //   `authtoken=${data.accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${oneHour}; Domain=kvieciu-22.macrol.lt`,
  //   `refreshToken=${data.refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${month}; Domain=kvieciu-22.macrol.lt`,
  // ]);
  res.setHeader("Set-Cookie", [
    `authtoken=${data.accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${oneHour}`,
    `refreshToken=${data.refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${month}`,
  ]);
}

const setupProxy = (port, routePrefix, requiresAuth = false) => {
  const middlewares = [];

  if (requiresAuth) {
    middlewares.push(ensureTokensMiddleware);

    middlewares.push((req, res, next) => {
      passport.authenticate("jwt-cookie", { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Tokenas negaliojantis arba vartotojas neautorizuotas",
          });
        }
        req.user = user;
        next();
      })(req, res, next);
    });
  }

  middlewares.push(injectAuthUserToHeaders);

  middlewares.push(
    createProxyMiddleware({
      target: `http://${BACKHOST}:${port}`,
      changeOrigin: true,
      cookieDomainRewrite: "", // pašalina backend domeną, leisim patys nurodyti
      selfHandleResponse: false, // proxy pats tvarko response
      onProxyRes: (proxyRes, req, res) => {
        let cookies = proxyRes.headers["set-cookie"];
        if (cookies) {
          // console.log("Gauti Set-Cookie iš backend:", cookies);

          const fixedCookies = cookies.map((cookie) => {
            // Išmetam neteisingus domain/us
            // cookie = cookie.replace(/Domain=[^;]+/i, "");

            // Užtikrinam, kad būtų teisingi atributai
            if (!/; *HttpOnly/i.test(cookie)) {
              cookie += "; HttpOnly";
            }
            if (!/; *Secure/i.test(cookie)) {
              cookie += "; Secure";
            }
            if (!/; *SameSite=None/i.test(cookie)) {
              cookie += "; SameSite=None";
            }
            // Priededam savo domeną
            // cookie += "; Domain=kvieciu-22.macrol.lt";

            return cookie;
          });

          res.setHeader("Set-Cookie", fixedCookies);
        }
      },

      // ************Keičia atsakymą į frontend************

      // selfHandleResponse: true, // res.end() will be called internally by responseInterceptor()

      // /**
      //  * Intercept response and replace 'Hello' with 'Goodbye'
      //  **/
      // on: {
      //   proxyRes: responseInterceptor(
      //     async (responseBuffer, proxyRes, req, res) => {
      //       try {
      //         // konvertuojam į string
      //         const responseString = responseBuffer.toString("utf8");

      //         // pabandom parse kaip JSON
      //         let data = JSON.parse(responseString);

      //         // prie atsakymo pridėk user info iš req.user (ar kitur)
      //         data.logedUser = req.user || {
      //           id: "123",
      //           roles: [],
      //           name: "Gaidys",
      //         };

      //         // grąžinam atgal kaip JSON string
      //         return JSON.stringify(data);
      //       } catch (err) {
      //         console.error("Proxy response parse error:", err.message);
      //         // jeigu atsakymas ne JSON, grąžinam originalų tekstą
      //         return responseBuffer;
      //       }
      //     }
      //   ),
      // },
      // onError: (err, req, res) => {
      //   res.status(500).json({ success: false, message: err.message });
      // },
    })
  );

  return middlewares;
};

const allowlist = [
  //   /^\/proposal-public\/get-proposals$/,
  /^\/auth-public\/login$/,
  //   /^\/auth-public\/sendemailcode$/,
  //   /^\/auth-public\/createuser$/,
  //   /^\/members-public\/get-employees$/, //gauname bendrijos darbuotojus
  //   /^\/chat-ai-public\/api\/chat\/[^/]+$/,
  //   /^\/docstore-public\/all-docs?[^/]+$/,
  //   // /^\/docstore-public\/upload-multiple-docs$/,
  //   /^\/docstore-public\/doc-store\/[^/]+$/,
  //   /^\/docstore-public\/thumbnails\/[^/]+$/,
  //   /^\/posts-public\/get-posts?[^/]+$/,
  //   /^\/image-public\/uploads\/[^/]+$/,
  //   // /^\/auth-public\/getusers$/,
  //   // /^\/members-public\/get-all-members?[^/]+$/,
  //   /^\/vote-public\/all-votes?[^/]+$/,
  //   /^\/vote-public\/one-vote?[^/]+$/,
];

app.use((req, res, next) => {
  // 1️⃣ Jei kelias neturi "-public" → leidžiam
  if (!req.path.includes("-public")) {
    return next();
  }

  // 2️⃣ Jei kelias turi "-public", tikrinam pagal allowlist
  const isAllowed = allowlist.some((rule) => rule.test(req.path));
  if (isAllowed) {
    return next();
  }

  // 3️⃣ Jei nieko neatitiko → draudžiam
  return res.status(403).json({
    success: false,
    message: "Šis veiksmas leidžiamas tik autorizuotam vartotojui!",
  });
});

app.use("/auth", ...setupProxy(AUTHPORT, "auth", true));
app.use("/auth-public", ...setupProxy(AUTHPORT, "auth", false));

app.use("/clients-public", ...setupProxy(CLIENTPORT, "clients-public", false));
app.use("/clients", ...setupProxy(CLIENTPORT, "clients", true));

app.use("/tools", ...setupProxy(TOOLPORT, "tools", true));
app.use("/tools-public", ...setupProxy(TOOLPORT, "tools-public", false));

app.use("/orders", ...setupProxy(ORDERPORT, "orders", true));
app.use("/orders-public", ...setupProxy(ORDERPORT, "orders-public", false));

app.use("/discounts", ...setupProxy(DISCOUNTPORT, "discounts-ai", true));
app.use(
  "/discounts-public",
  ...setupProxy(DISCOUNTPORT, "discounts-public", false)
);

app.use("/docs", ...setupProxy(DOCSPORT, "docs", true));
app.use("/docs-public", ...setupProxy(DOCSPORT, "docs-public", false));

// app.use("/image-public", ...setupProxy(IMAGEPORT, "image-public", false));
// app.use("/image", ...setupProxy(IMAGEPORT, "image", true));
// // app.use("/image", proxy(IMAGEPORT, "image"));

// // app.use("/email", proxy(EMAILPORT, "email"));

// app.use("/proposal", ...setupProxy(PROPOSALPORT, "proposal", true));
// app.use(
//   "/proposal-public",
//   ...setupProxy(PROPOSALPORT, "proposal-public", false)
// );

// app.use("/error", proxy(ERRORPORT, "error"));
app.listen(PORT, () => {
  console.log(`Proxy Started at: ${BACKHOST}:${PORT}`);
});
// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(PORT);
