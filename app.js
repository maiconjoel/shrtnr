const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const dbUrl = process.env.DB_URL;

const app = express();

const spec = YAML.load("./swagger.yml");

app.use("/docs", swaggerUI.serve, swaggerUI.setup(spec));

// URL de conexão com o banco de dados MongoDB
//const MONGO_URI = 'mongodb://127.0.0.1:27017/';

// Opções de conexão com o banco de dados
const mongooseOptions = {
  dbName: 'shrtnr',
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Conecta ao banco de dados MongoDB
mongoose.connect(dbUrl, mongooseOptions)
  .then(() => {
    console.log('Conexão com o MongoDB estabelecida com sucesso!');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Define o schema para as URLs encurtadas
const urlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  createdAt: { type: Date, default: Date.now },
});

// Cria modelo para as URLs encurtadas
const Url = mongoose.model('Url', urlSchema);

// Rota para encurtar uma URL
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
app.get('/:shortUrl', async (req, res) => {
  const url = await Url.findOne({ shortUrl: req.params.shortUrl });
  if (url) {
    res.redirect(url.longUrl);
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Rota para listar todas as URLs encurtadas em uma data específica
app.get('/listar/:data', async (req, res) => {
  const urls = await Url.find({ createdAt: { $gte: new Date(req.params.data) } });
  res.json(urls);
});

// Rota para obter a URL curta a partir da URL longa
app.get('/encurtado/:longUrl', async (req, res) => {
  let url = await Url.findOne({ longUrl : req.params.longUrl });
  if (url) {
    res.json({ shortUrl: url.shortUrl });
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Rota para obter a URL curta a partir do seu id no banco
app.get('/url/:id', async (req, res) => {
  let url = await Url.findById( req.params.id );
  if (url) {
    res.json({ longUrl: url.longUrl });
  } else {
    res.status(404).json({ error: 'URL não encontrada' });
  }
});

// Iniciar servidor
app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor iniciado na porta' + process.env.PORT);
});