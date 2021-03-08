var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const cors = require('cors');
const mysql = require('mysql');
const myConnection = require('express-myconnection');
var uuid = require('uuid');
const aws_keys = require('./creds');
var corsOptions = { origin: true, optionsSuccessStatus: 200 };
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

const db_credentials = require('./db_creds');
app.use(myConnection(mysql, db_credentials, 'single'));


//instanciamos el sdk
var AWS = require('aws-sdk');
//instanciamos los servicios a utilizar con sus respectivos accesos.
const s3 = new AWS.S3(aws_keys.s3);
let bucketname = 'practica1-g45-imagenes';

const ddb = new AWS.DynamoDB(aws_keys.dynamodb);


var port = 9000;
app.listen(port);
console.log('Listening on port', port);





//--------------------------------------------------RUTAS---------------------------------------
//Ruta principal
app.get('/', (req, res) => {
  console.log('Hola mundo');
  res.send('Hola mundo');
});

//Ingreso a la app
app.post('/ingresar', (req, res) => {

  var usu = req.body.username;
  var contra = req.body.contrasena;

  if (!(usu || contra)) {
    return JSON.stringify({ 'status': 404, 'Item': '' });
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usu }
    }
  };

  var item = ddb.getItem(params);
  if (item) {
    console.log('Existe usuario');
    if (item.contrasena == contra) {
      console.log("Contrasena correcta");
      return JSON.stringify({ 'status': 202, 'Item': '' });
    } else {

      console.log("Contrasena incorrecta");
      return JSON.stringify({ 'status': 202, 'Item': '' });
    }
  } else {
    console.log('No existe usuario');
    return JSON.stringify({ 'status': 303, 'Item': "" });
  }

});

//Registro de nuevo usuario
app.post('/registrar', (req, res) => {
  var usu = req.body.username;
  var nombre = req.body.nombre;
  var contra = req.body.contrasena;
  var nFoto = req.body.nFoto;
  var ext = req.body.ext;
  var b64 = req.body.b64;
  var uniqueID = `${nFoto}-${uuid()}.${ext}`;;

  if (!(usu || nombre || contra || nFoto)) {
    return JSON.stringify({ 'status': 504, 'existe': '' });
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usu }
    }
  };

  var item = ddb.getItem(params);
  if (item) { console.log('Existe usuario ya'); return JSON.stringify({ 'status': 404, 'existe': 'true' }); }
  else {
    var nombrei = "fotos_perfil/" + nFoto + "-" + uniqueID + "." + ext;
    //Se convierte la base64 a bytes
    let buff = new Buffer.from(b64, 'base64');

    const params = {
      Bucket: bucketname,
      Key: nombrei,
      Body: buff,
      ContentType: "image",
      ACL: 'public-read'
    };

    const putResult = s3.putObject(params).promise();
    res.json({ mensaje: putResult });

    var resp = dynamo.put_item(
      TableName = 'usuario',
      Item = {
        'username': { 'S': usu },
        'nombre': { 'S': nombre },
        'contrasena': { 'S': contra },
        'nFoto': { 'S': nFoto + '.' + ext },
        'foto_perfil': { 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei }
      }
    );
    var status = resp['ResponseMetadata']['HTTPStatusCode'];
    console.log('Registro');
    return JSON.stringify({ 'status': status, 'existe': "false" });

  }
});




