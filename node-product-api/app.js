var https = require('https');
fs = require('fs');

const express = require('express') 
var RateLimit = require('express-rate-limit');
const app = express()

// Mitigar Broken Access Control
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
const checkScopes = requiredScopes('read:products');

// Mitigar Broken Authentication
const checkJwt = auth({
    audience: 'https://localhost:3001/',
    issuerBaseURL: 'https://dev-1wyfyis7mkrrje6i.us.auth0.com/',
    tokenSigningAlg: 'RS256'
  });

 app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
 });

 app.use(checkJwt);

//implementação de comunicação via HTTPS
var privateKey  = fs.readFileSync('./sslcert/selfsigned.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/selfsigned.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(3001);

// RateLimit na API
var limiter = new RateLimit({
    windowMs: 15*60*1000,
    max: 50,
    delayMs: 0,
    message: "Muitos acessos feitos pelo IP, favor testar novamente outra hora."
});

app.use(limiter);


const db = require("./db");

var cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(cookieParser()); 

app.get('/products', checkJwt, checkScopes, async (req, res, next) => { 
    var resp = await db.getAllProducts();
    res.status(200).json(resp);
});

app.post('/products', checkJwt, checkScopes, async (req, res, next) => { 

    try{
        var name = req.body.name;
        var description = req.body.description
        var value = req.body.value
        
        await db.insertProduct(name, description, value);
        return res.status(200).json({message: 'Produto cadastrado com sucesso!'});

    }catch(err){
        return res.status(err.code).json(err);
    }
});


app.get('/products/:id', checkJwt, checkScopes, async (req, res, next) => { 

    try{
        var id = req.params.id;

        // Validação de campos de entrada
        if (!id.match(/[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/))
        {
            res.status(400).json({ message: 'Produto inválido!'}).send();
        } else {
            const [rows] = await db.getProductById(id);
            if(rows){
                return res.status(200).send(rows);
            }
            return res.status(404).send(`Produto ${id} não encontrado!`);
        }

        
        
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.put('/products/:id', checkJwt, checkScopes, async (req, res, next) => { 
    try{
        var id = req.params.id;

        // Validação de campos de entrada
        if (!id.match(/[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/))
        {
            res.status(400).json({ message: 'Produto inválido!'}).send();
        } else {
            var name = req.body.name;
            var description = req.body.description
            var value = req.body.value
        
            const rows = await db.updateProductById(id, name, description, value);
            if(rows){
                return res.status(200).send({message: "Produto atualizado com sucesso!"});
            }
            return res.status(404).send(`Produto ${id} atualizado com sucesso!`);
        }

        
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.delete('/products/:id', checkJwt, checkScopes, async (req, res, next) => {

    try{
        var id = req.params.id;

        // Validação de campos de entrada
        if (!id.match(/[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/))
        {
            res.status(400).json({ message: 'Produto inválido!'}).send();
        } else {
            await db.deleteProductById(id);
            return res.status(200).send({message: `Produto ${id} deletado com sucesso!`}); 
        }
    }catch(err){
        return res.status(err.code).json(err);
    }
});



