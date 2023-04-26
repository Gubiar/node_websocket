import WebSocket, { WebSocketServer } from 'ws';
import dotenv from "dotenv";
import express from 'express'
import { Prisma, PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(express.json());
const server = app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

// Lista para armazenar todas as conexões WebSocket ativas
const clients = [];

app.get("/", (req, res) => {
  res.status(200).json({
    success: "true",
    message: "Bem vindo a API!",
  });
});

//REGISTRAR USUARIO
app.post("/auth/register", async (req, res) => {
  console.log(req.body);
  const { name, email, password, confirmPassword } = req.body;

  if (!name || name.toString().length < 6)
    return res.status(422).json({
      success: "false",
      message: "O username precisa ter pelo menos 6 caracteres.",
    });

  if (
    !email ||
    !email.toString().includes("@") ||
    !email.toString().includes(".")
  )
    return res
      .status(422)
      .json({ success: "false", message: "Insira um email válido." });

  if (
    (!password && !confirmPassword) ||
    password != confirmPassword ||
    password.toString().length < 6
  )
    return res.status(422).json({
      success: "false",
      message:
        "Sua senha e confirma senha precisam ser iguais e devem ter pelo menos 6 caracters.",
    });

  //Check if user exists
  const userExists = await prisma.User.findUnique({
    where: {
      email: email,
    },
  });

  if (userExists) {
    return res
      .status(422)
      .json({ success: "false", message: "Email já está sendo utilizado." });
  }

  //create user

  try {
    const user = await prisma.User.create({
      data: {
        name: name,
        email: email,
        password: password,
      },
    });

    if (user) {
      return res.status(201).json({
        sucess: "true",
        message: "Usuário criado com sucesso.",
      });
    } else {
      return res.status(500).json({
        sucess: "false",
        message:
          "Não foi possível cadastrar o usuário. Tente novamente mais tarde.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      sucess: "false",
      message:
        "Não foi possível cadastrar o usuário. Tente novamente mais tarde.",
    });
  }
});

//LOGIN USUARIO
app.post("/auth/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    if (
      !email ||
      !email.toString().includes("@") ||
      !email.toString().includes(".")
    )
      return res
        .status(422)
        .json({ success: "false", message: "Email ou senha inválidos." });
  
    if (!password || password.toString().length < 6)
      return res
        .status(422)
        .json({ success: "false", message: "Email ou senha inválidos." });
  
    //Check if user exists
    const user = await prisma.User.findUnique({
      where: {
        email: email,
      },
    });
  
    if (!user) {
      return res
        .status(404)
        .json({ success: "false", message: "Usuário não encontrado." });
    }

    if(user.password === password){
      return res.status(200).json({
        sucess: "true",
        message: "Login realizado com sucesso.",
        id: user.id,
        user_name: user.name.toString(),
        user_email: user.email.toString(),
      });
    }else {
      return res
        .status(404)
        .json({ success: "false", message: "Usuário não encontrado." });
    }

  } catch (e) {
    console.error(e);
    res.status(500).json({
      sucess: "false",
      message: "Não foi possível fazer o login. Tente novamente mais tarde.",
    });
  }
});


// Endpoint HTTP POST na rota /maquinas
app.post("/maquinas", (req, res) => {
  // Aqui você pode adicionar o código para manipular os dados recebidos pelo endpoint

  // Envia a mensagem para todos os clientes conectados no WebSocket
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // client.send(Buffer.from(req.body).toString());
      client.send(JSON.stringify(req.body));

    }
  });

  return res.status(200).json({
    success: true,
    message: "Dados enviado para o ouvinte"
  });
});

// Canal de comunicação WebSocket
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  // Adiciona o objeto WebSocket correspondente ao array de clientes
  clients.push(ws);

  ws.on("message", (data) => {
    console.log(`Dados recebidos pelo WebSocket: ${data}`);
    // Envia a mensagem para todos os clientes conectados no WebSocket
    clients.forEach((client) => {
      const obj = JSON.parse(JSON.stringify(data));
      if (client.readyState === WebSocket.OPEN) {
        client.send(Buffer.from(obj.data).toString());
      }
    });
  });
});
