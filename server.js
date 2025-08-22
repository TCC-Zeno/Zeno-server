import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./strategies/local.js";

// Rotas 
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import financeRoutes from "./routes/finance.js";
import taskRoutes from "./routes/task.js";
import stockRoutes from "./routes/stock.js";
import reportRoutes from "./routes/report.js";
import calendarRoutes from "./routes/calendar.js"

dotenv.config();
const app = express();

// Configuração de ambiente
const isProduction = process.env.NODE_ENV === 'production' && !process.env.DEVELOPMENT_MODE;
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEVELOPMENT_MODE === 'true';

// Trust proxy - IMPORTANTE para Render 
if (isProduction) {
  app.set('trust proxy', 1);
}

// CORS configurado para produção e desenvolvimento
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      if (isProduction) {
        console.log('Origem bloqueada:', origin);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }

      // Fallback para desenvolvimento
      callback(null, true);
    },
    credentials: true,
    exposedHeaders: ['set-cookie'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do MongoDB Store
let store;
try {
  store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    dbName: 'zeno-db',
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 dias
    autoRemove: 'native',
    touchAfter: 24 * 3600, 
  });

  store.on('error', (error) => {
    console.error('Erro no store de sessão:', error);
  });

  store.on('connect', () => {
    console.log('Store de sessão conectado ao MongoDB');
  });
} catch (error) {
  console.error('Erro ao criar MongoDB store:', error);
  process.exit(1);
}

// Configuração de sessão adaptativa
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  name: "sessionId",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    sameSite: isProduction ? 'none' : 'lax',
  },
  store: store,
  rolling: true,
};

app.use(session(sessionConfig));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Rotas da aplicação
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/finance", financeRoutes);
app.use("/tasks", taskRoutes);
app.use("/stock", stockRoutes);
app.use("/report", reportRoutes);
app.use("/calendar", calendarRoutes);

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: isProduction ? 'Erro interno do servidor' : err.message
  });
});

// 404 
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
  console.log(`Cookies seguros: ${isProduction}`);
});

export default app;