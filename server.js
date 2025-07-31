// Testes
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";


// Rotas
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";


dotenv.config();
const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];


app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);



//Rotas
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

//Inicializando servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
