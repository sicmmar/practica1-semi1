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
  return JSON.stringify({ 'status': 200, 'Item': '' });
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
  var uniqueID = `${nFoto}-${uuid()}.${ext}`;

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

    dynamo.put_item(
      TableName = 'usuario',
      Item = {
        'username': { 'S': usu },
        'nombre': { 'S': nombre },
        'contrasena': { 'S': contra },
        'nFoto': { 'S': nFoto + '.' + ext },
        'foto_perfil': { 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei },
        'album': { 'L': [{ 'L': [{ 'S': 'Perfil' }, { 'L': [{ 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei }] }] }] }
      }
    );
    console.log('Registro');
    return JSON.stringify({ 'status': 202, 'existe': "false" });

  }
});


//Editar Perfil
app.post('/editarPerfil', (req, res) => {
  var usu = req.body.username;
  var nombre = req.body.nombre;
  var contra = req.body.contrasena;
  var nFoto = req.body.nFoto;
  var ext = req.body.ext;
  var b64 = req.body.b64;
  var uniqueID = `${nFoto}-${uuid()}.${ext}`;

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
  if (item) {
    console.log('Existe usuario ya');
    if (item.contrasena == contra) {
      console.log("Contrasena correcta");
      var nombrei = "fotos_perfil/" + nFoto + "-" + uniqueID + "." + ext;
      //Se convierte la base64 a bytes
      let buff = new Buffer.from(b64, 'base64');

      var album_perfil = item.album;
      for (var alb in album_perfil['L']) {
        if (alb['L'][0]['S'] == 'Perfil') {
          alb['L'][1]['L'].append({ 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei });
          break;
        }
      }
      const params = {
        Bucket: bucketname,
        Key: nombrei,
        Body: buff,
        ContentType: "image",
        ACL: 'public-read'
      };

      const putResult = s3.putObject(params).promise();
      res.json({ mensaje: putResult });

      dynamo.update_item(
        TableName = 'usuario',
        Item = {
          'username': { 'S': usu },
          'nombre': { 'S': nombre },
          'contrasena': { 'S': contra },
          'nFoto': { 'S': nFoto + '.' + ext },
          'foto_perfil': { 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei },
          'album': { 'L': [{ 'L': [{ 'S': 'Perfil' }, { 'L': [{ 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei }] }] }] }
        },
        UpdateExpression = 'set nombre=:n, nFoto=:nf, foto_perfil=:fp, album=:prof',
        ExpressionAttributeValues = {
          ':n': { 'S': nombre },
          ':nf': { 'S': nFoto + '.' + ext },
          ':fp': { 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei },
          ':prof': album_perfil
        }
      );
      console.log('Actualizado');
      return JSON.stringify({ 'status': 202, 'Item': "" })
    }
    else {
      return JSON.stringify({ 'status': 303, 'Item': ""})
    }
  }

  return JSON.stringify({ 'status': 202, 'Item': '' })

});

app.post('/newAlbum', (req, res) => {
  var usern = req.body.username;
  var nombre_album = req.body.album;

  if (!(usern || nombre_album)) {
    return JSON.stringify({ 'status': 504, 'existe': '' });
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usern }
    }
  };

  var item = ddb.getItem(params);
  if (item) {
    console.log('Existe usuario ya');
    var albumes = item.album;
    albumes['L'].append({ 'L': [{ 'S': nombre_album }, { 'L': [] }] });

    dynamo.update_item(
      TableName = 'usuario',
      Key = {
        'username': { 'S': usern }
      },
      UpdateExpression = 'set album=:nal',
      ExpressionAttributeValues = {
        ':nal': albumes
      }
    );
    console.log('Actualizado');
    return JSON.stringify({ 'status': 202, 'existe': usuarioExistente(usern) });
  }
  else {
    console.log('No actualizado');
    return jsonify({'status': 404,'existe':'true'});
  }
});

