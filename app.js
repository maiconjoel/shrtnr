const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();

// URL de conexão com o banco de dados MongoDB
const MONGO_URI = 'mongodb://127.0.0.1:27017/';

// Opções de conexão com o banco de dados
const mongooseOptions = {
  dbName: 'shrtnr',
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Conecta ao banco de dados MongoDB
mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('Conexão com o MongoDB estabelecida com sucesso!');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Definir schema para as URLs encurtadas
const urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  createdAt: { type: Date, default: Date.now },
});

// Criar modelo para as URLs encurtadas
const Url = mongoose.model('Url', urlSchema);

// Rota para encurtar uma URL
// Chamada: http://localhost:3000/encurtar?url=www.google.com
app.get('/encurtar', async (req, res) => {
  try {
    const longUrl = req.query.url;    
    let existingUrl = await Url.findOne({ longUrl });

    if (existingUrl) {
      res.json(existingUrl);
    } else {
      const shortUrl = shortid.generate();
      const url = new Url({ longUrl, shortUrl });
      let savedUrl = await url.save();
      res.json(savedUrl);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro interno do servidor');
  }
});

// Rota para redirecionar para a URL longa a partir da URL curta
// Chamada: localhost:3000/rGsdUFU2h
app.get('/:shortUrl', async (req, res) => {
  const url = await Url.findOne({ shortUrl: req.params.shortUrl });
  if (url) {
    res.redirect(url.longUrl);
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Rota para listar todas as URLs encurtadas em uma data específica
// Chamada: http://localhost:3000/listar/2023-03-20
app.get('/listar/:data', async (req, res) => {
  const urls = await Url.find({ createdAt: { $gte: new Date(req.params.data) } });
  res.json(urls);
});

// Rota para obter a URL curta a partir da URL longa
// Chamada: http://localhost:3000/encurtado/www.google.com
app.get('/encurtado/:longUrl', async (req, res) => {
  let url = await Url.findOne({ longUrl : req.params.longUrl });
  if (url) {
    res.json({ shortUrl: url.shortUrl });
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Rota para obter a URL curta a partir do seu id no banco
// Chamada: http://localhost:3000/url/6417d3e9477ed461838cb3ab
app.get('/url/:id', async (req, res) => {
  let url = await Url.findById( req.params.id );
  if (url) {
    res.json({ longUrl: url.longUrl });
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
