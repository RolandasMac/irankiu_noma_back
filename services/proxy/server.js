// =======================================================
//  IMPORTAI
// =======================================================
import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import {
  createProxyMiddleware,
  responseInterceptor,
  fixRequestBody,
} from "http-proxy-middleware";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import paths from "../../config/paths.js"; // tavo failas su direktorijomis

const { imageUploadsDir, toolManualsDir } = paths;

// =======================================================
//  SSL Sertifikatai
// =======================================================

const pathServ = "/etc/letsencrypt/live/nuoma.macrol.lt/";
const privateKey = fs.readFileSync(`${pathServ}privkey.pem`);
const certificate = fs.readFileSync(`${pathServ}fullchain.pem`);
const credentials = { key: privateKey, cert: certificate };

// =======================================================
//  DIR KONFIGŪRACIJA
// =======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =======================================================
//  EXPRESS & ENV
// =======================================================
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

const PORT = process.env.PROXY_PORT;
const HOST = process.env.HOST;
const BACKHOST = process.env.BACKHOST;
const AUTHPORT = process.env.AUTH_PORT;
const CLIENTPORT = process.env.CLIENT_PORT;
const TOOLPORT = process.env.TOOL_PORT;
const ORDERPORT = process.env.ORDER_PORT;
const DISCOUNTPORT = process.env.DISCOUNT_PORT;
const DOCSPORT = process.env.DOCS_PORT;

// =======================================================
//  MIDDLEWARES
// =======================================================
app.use(cookieParser());
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
    exposedHeaders: ["Set-Cookie"],
  })
);

// =======================================================
//  PASSPORT JWT STRATEGIJA
// =======================================================
const jwtSecret = process.env.JWT_KEY;
const JWT_COOKIE_NAME = "authtoken";

const cookieExtractor = (req) => {
  if (req && req.cookies) {
    return req.cookies[JWT_COOKIE_NAME];
  }
  return null;
};

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
  secretOrKey: jwtSecret,
};

passport.use(
  "jwt-cookie",
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    const user = {
      id: jwtPayload.id,
      email: jwtPayload.email,
      roles: jwtPayload.roles || [],
      name: jwtPayload.name,
    };
    return user.id ? done(null, user) : done(null, false);
  })
);

app.use(passport.initialize());

// =======================================================
//  AUTENTIFIKAVIMO MIDDLEWARE
// =======================================================
const injectAuthUserToHeaders = (req, res, next) => {
  if (req.user) {
    req.headers["X-User-Id"] = req.user.id;
    req.headers["X-User-Email"] = req.user.email;
    req.headers["X-User-Name"] = req.user.name;
    req.headers["X-User-Roles"] = JSON.stringify(req.user.roles);
  } else {
    delete req.headers["X-User-Id"];
    delete req.headers["X-User-Email"];
    delete req.headers["X-User-Roles"];
    delete req.headers["X-User-Name"];
  }
  next();
};

// =======================================================
//  TOKEN REFRESH LOGIKA
// =======================================================
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

function setCookiesFromRefresh(req, res, data) {
  const oneHour = 60 * 60;
  const month = 30 * 24 * oneHour;

  req.cookies["authtoken"] = data.accessToken;
  req.cookies["refreshToken"] = data.refreshToken;

  res.setHeader("Set-Cookie", [
    `authtoken=${data.accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${oneHour}`,
    `refreshToken=${data.refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${month}`,
  ]);
}

async function ensureTokensMiddleware(req, res, next) {
  const accessToken = req.cookies["authtoken"];
  const refreshToken = req.cookies["refreshToken"];

  if (!shouldRefresh(accessToken)) return next();
  if (!refreshToken)
    return res
      .status(401)
      .json({ success: false, message: "Neautentifikuotas vartotojas" });

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
      message: `Authentication required: ${err.message}`,
    });
  }
}

// =======================================================
//  PROXY KONFIGŪRACIJA
// =======================================================
function setupProxy(port, routePrefix, requiresAuth = false) {
  const middlewares = [];

  if (requiresAuth) {
    middlewares.push(ensureTokensMiddleware);
    middlewares.push((req, res, next) => {
      passport.authenticate("jwt-cookie", { session: false }, (err, user) => {
        if (err) return next(err);
        if (!user)
          return res.status(401).json({
            success: false,
            message: "Tokenas negaliojantis arba vartotojas neautorizuotas",
          });
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
      cookieDomainRewrite: false,
      onProxyReq: fixRequestBody, // 🔥 BŪTINA multipart!
    })
  );

  return middlewares;
}

// =======================================================
//  LEIDŽIAMI KELIAI
// =======================================================
const allowlist = [
  /^\/auth-public\/login$/,
  /^\/auth-public\/sendemailcode$/,
  /^\/auth-public\/createuser$/,
  /^\/tools-public\/manuals(\/.*)?$/,
  /^\/tools-public\/thumbnails(\/.*)?$/,
  // /^\/tools-public\/manuals(\/.*)?$/,
  /^\/tools-public\/get-manuals-token(\/.*)?$/,
  /^\/tools-public\/get-manuals(\/.*)?$/,
];

// Tikrinimas prieš public maršrutus
app.use((req, res, next) => {
  if (!req.path.includes("-public")) return next();
  const isAllowed = allowlist.some((rule) => rule.test(req.path));
  if (isAllowed) return next();
  return res.status(403).json({
    success: false,
    message: "Šis veiksmas leidžiamas tik autorizuotam vartotojui!!!",
  });
});

// =======================================================
//  STATIC FILES
// =======================================================
app.use("/imageUploads/", express.static(imageUploadsDir));
app.use("/manuals", express.static(toolManualsDir));
// =======================================================
//  PROXY MARŠRUTAI
// =======================================================
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

// =======================================================
//  SERVER START
// =======================================================
// app.listen(PORT, () => {
//   console.log(`✅ Proxy Started at: ${BACKHOST}:${PORT}`);
// });

// Jei reikėtų HTTPS (kai turėsi sertifikatus)
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(PORT, () => {
  console.log(`✅ Proxy Started at: ${BACKHOST}:${PORT}`);
});
