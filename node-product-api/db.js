const { randomUUID } = require('crypto');

async function connect(){
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection;
 
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: 3306,
        user: 'test',
        password: 'test',
        database: 'finalProjectSubst',
        multipleStatements: true
      } );
    console.log("Conectou no MySQL!");
    global.connection = connection;
    return connection;
}

async function getAllProducts(){
    try{
        const conn = await connect();
        
    
        const query = `SELECT * FROM products LIMIT 1000;`;
        console.log(`Executando query: ${query}`);

        const [rows, fields] = await connection.execute(query);
        console.log(`Rows: ${JSON.stringify(rows)}`);
        return rows;

    }catch(err){
        console.log("Erro SQL: " + err);
        throw'Erro Inesperado';
    }
}

async function getProductById(id){
    // Validação de campos de entrada
    if (!id.match(/^[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/gm))
    {
      res.status(400).json({ message: 'Produto inválido!'}).send();
    } else {

        try{
            const conn = await connect();
            
            // Prepared Statements nas comunicações com o Banco de Dados
            const query = `SELECT * FROM products WHERE id = ?;`;
            console.log(`Executando query: ${query}`);
    
            const [rows, fields] = await connection.execute(query, [id]);

            return rows;
        } catch(err){
            console.log("Erro SQL: " + err);
            throw'Erro Inesperado';
        }
    }    
}


async function updateProductById(id, name, description, value){
    // Validação de campos de entrada
    if ((!id.match(/^[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/gm)) ||
        (!name.match(/^[A-Za-z]/)) ||
        (!description.match(/^[A-Za-z0-9]/)) || 
        (!value.toString().match(/^[0-9]*$/)))
    {
      res.status(400).json({ message: 'Produto inválido!'}).send();
    } else {

        try{
            const conn = await connect();
            
            // Prepared Statements nas comunicações com o Banco de Dados
            const query = `UPDATE products SET name = ?, description = ?, value = ? WHERE id = ?;`;
            console.log(`Executando query: ${query}`);
        
            const [rows] = await conn.execute(query, [name, description, value, id]);
            return rows;
        }catch(err){
            throw {code: 500, message: 'Erro inesperado ao tentar cadastrar usuário'};
        }    
    }
}

async function deleteProductById(id){
    // Validação de campos de entrada
    if (!id.match(/^[A-Za-z0-9]{8}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{4}\-[A-Za-z0-9]{12}/gm))
    {
      res.status(400).json({ message: 'Produto Inválido!'}).send();
    } else {
        // Prepared Statements nas comunicações com o Banco de Dados
        const query = `DELETE FROM products WHERE id = ?;`;

        try{
            const conn = await connect();
    
        
            console.log(`Executando query: ${query}`);

            await connection.execute(query, [id]);
        }catch(err){
            console.log("Erro SQL: " + err);
            throw'Erro Inesperado';
        }   
    }  
}

async function insertProduct(name, description, value){
    // Validação de campos de entrada
    if ((!name.match(/^[A-Za-z]/)) ||
        (!description.match(/^[A-Za-z0-9]/)) || 
        (!value.toString().match(/^[0-9]*$/)))
    {
      res.status(400).json({ message: 'Produto inválido!'}).send();
    } else {

        const conn = await connect();

        // Prepared Statements nas comunicações com o Banco de Dados
        const query = `INSERT INTO products(id, name, description, value) VALUES (?, ?, ?, ?);`;
        console.log(`Executando query: ${query}`);

        try{
            await connection.execute(query, [randomUUID(), name, description, value]);
        }catch(err){
            if(err.errno === 1062){
                throw {code: 400, message: 'Já existe um producte cadastrado com este usuário!'};
            }else{
                throw {code: 500, message: 'Erro inesperado ao tentar cadastrar usuário'};
            }
        }
    }
}

module.exports = {getProductById, getAllProducts, insertProduct, updateProductById, deleteProductById}
