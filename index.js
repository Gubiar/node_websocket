import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import cors from 'cors';

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(cors());
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

  

  const { nomeUsuario, usernameUsuario, senhaUsuario, roleUsuario, unidadeUsuario} = req.body;

  console.log(req.body);

  try {
    const user = await prisma.usuario.create({
      data: {
        username: usernameUsuario,
        nome: nomeUsuario,
        role: roleUsuario, 
        senha: senhaUsuario,
        unidadeId: unidadeUsuario,
      },
    });

    if (user) {
      return res.status(201).json({
        status: "true",
        message: "Usuário criado com sucesso.",
      });
    } else {
      return res.status(500).json({
        status: "false",
        message:
          "Não foi possível cadastrar o usuário. Tente novamente mais tarde.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "false",
      message:
        "Não foi possível cadastrar o usuário. Tente novamente mais tarde.",
    });
  }
});

//LOGIN USUARIO
app.post("/auth/login", async (req, res) => {

  try {
    const { usuario, senha } = req.body;
    
    const user = await prisma.usuario.findUnique({
      where: {
        username: usuario
      }
    });

    if (!user || !user.senha) {
      return res.status(500).json({
        status: "Invalido",
        message: "Não foi possível fazer o login. Usuario Nao encotrado.",
      });
    }

    function comparePasswords(password1, password2) {
      return password1 === password2;
    }

    if (!(comparePasswords(user.senha, senha))) {
      return res.status(500).json({
        status: "Invalido",
        message: "Não foi possível fazer o login senha invalida.",
      });
    }

    res.json(user);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível fazer o login. Tente novamente mais tarde.",
    });
  }
});

//ADD IOT
app.post("/create/iot", async (req, res) => {

  try {

    const { nomeIOT, uuidIOT } = req.body;

    console.log(req.body)
    
    const novaIOT = await prisma.iOT.create({
      data: {
        nome: nomeIOT,
        uuid: uuidIOT,
        ip: '',
      },
    });

    res.json({
      status: "Sucesso",
      message: "Iot Criada com Sucesso.",
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível fazer criar iot. Tente novamente mais tarde.",
    });
  }
});

//CONSULTA IOT
app.post("/consulta/iot", async (req, res) => {

  try {

    const iots = await prisma.iOT.findMany();;

    return res.status(200).json(iots);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Tente novamente mais tarde.",
    });
  }
});

//ADD Maq
app.post("/create/maq", async (req, res) => {

  try {

    const { nomeMaq, uuidIOT } = req.body;

    console.log(req.body)
    
    const novaMaq = await prisma.maquina.create({
      data: {
        nome: nomeMaq,
        iotUUID: uuidIOT,
      },
    });

    res.json({
      status: "Sucesso",
      message: "Maq Criada com Sucesso.",
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível cria maq. Tente novamente mais tarde.",
    });
  }
});

//CONSULTA Maq
app.post("/consulta/maq", async (req, res) => {

  try {

    const maquinas = await prisma.maquina.findMany();;
    return res.status(200).json(maquinas);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Tente novamente mais tarde.",
    });
  }
});

//ADD Linha
app.post("/create/linha", async (req, res) => {

  try {

    const { nomeDaLinha, unidadeId, Maquinas } = req.body;
    console.log(req.body)
    
    const novaLinha = await prisma.linha.create({
      data: {
        nome: nomeDaLinha,
        unidadeId: unidadeId,
        maquinas: {
          connect: Maquinas.map(maquinaId => ({ id: maquinaId })),
        },
      },
    });

    return res.status(200).json({ status: 'Linha criada' });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível criar linha. Tente novamente mais tarde.",
    });
  }
});

//ADD Unidade
app.post("/create/unidade", async (req, res) => {

  try {

    const { nomeUnidade, endereco } = req.body;

    console.log(req.body)
    
    const novaUnidade = await prisma.unidade.create({
      data: {
        nome: nomeUnidade,
        endereco: endereco,
      }
    });

    return res.status(200).json({ status: 'CRIADA' });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível criar linha. Tente novamente mais tarde.",
    });
  }
});

//CONSULTA Maq
app.post("/consulta/unidade", async (req, res) => {

  try {

    const unidades = await prisma.unidade.findMany();

    return res.status(200).json(unidades);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Tente novamente mais tarde.",
    });
  }
});

// Endpoint HTTP POST na rota /maquinas
// app.post("/maquinas", (req, res) => {
//   // Aqui você pode adicionar o código para manipular os dados recebidos pelo endpoint
//   // Envia a mensagem para todos os clientes conectados no WebSocket
//   clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       // client.send(Buffer.from(req.body).toString());
//       client.send(JSON.stringify(req.body));
//     }
//   });

//   return res.status(200).json({
//     success: true,
//     message: "Dados enviado para o ouvinte",
//   });
// });


app.post("/changeStatusMaquina", async (req, res) => {
  try {
    const { codigo, status } = req.body;

    const updateMaq = await prisma.maquina.update({
      where: {
        iotUUID: codigo,
      },
      data: {
        status: status,
      },
    });

    const maquinasObj1 = await criaJsonMaquinas();

    console.log(maquinasObj1)

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(maquinasObj1));
      }
    });

    res.status(200).json({ status: "ok" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível alterar status da máquina. Tente novamente mais tarde.",
    });
  }
});




app.post("/changeStatusLinha", async (req, res) => {
  try {
    const { nome, status } = req.body;

    const updateMaq = await prisma.linha.update({
      where: {
        nomeDaLinha: nome,
      },
      data: {
        status: status,
      },
    });

    const linhasObj = await criaJsonLinhas();


    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(linhasObj));
      }
    });

    res.status(200).json({ status: "ok" });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      status: "false",
      message: "Não foi possível alterar status da máquina. Tente novamente mais tarde.",
    });
  }

});

async function criaJsonLinhas() {

  const linhas = await prisma.linha.findMany({
    include: {
      maquinas: {
        include: {
          iot: true,
        },
      },
    },
  });

  const linhasObj = {
    linhas: linhas.map((linha) => ({
      id: linha.id,
      nomeLinha: linha.nome,
      maquinas: linha.maquinas.map((maquina) => ({
        nome: maquina.nome,
        id: maquina.id,
        iotUUID: maquina.iot.uuid,
        status: maquina.status,
      })),
    })),
  };

  return linhasObj;
}

async function criaJsonMaquinas() {
  const maquinas = await prisma.maquina.findMany({
    include: {
      iot: true,
      linha: true,
    },
  });

  const maquinasObj = {
    maquinas: maquinas.map((maquina) => ({
      nome: maquina.nome,
      id: maquina.id,
      iotUUID: maquina.iot.uuid,
      status: maquina.status,
      linha: maquina.linha
        ? {
            id: maquina.linha.id,
            nomeLinha: maquina.linha.nome,
          }
        : null,
    })),
  };

  return maquinasObj;
}



app.get("/criarJson", (req, res) => {
  criaJson();
  res.status(200).json({
    success: "true",
    message: "Bem vindo a API!",
  });
});



// Canal de comunicação WebSocket
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", async (ws) => {

  console.log("Cliente conectado");

  clients.push(ws);

  const maquinasObj = await criaJsonMaquinas();

  console.log(maquinasObj);

  ws.send(JSON.stringify(maquinasObj));

  ws.on("message", (data) => {
    console.log(`Dados recebidos pelo WebSocket: ${data}`);
    clients.forEach((client) => {
      const obj = JSON.parse(JSON.stringify(data));
      if (client.readyState === WebSocket.OPEN) {
        client.send(Buffer.from(obj.data).toString());
      }
    });
  });
});
