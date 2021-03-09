var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const cors = require('cors');
var uuid = require('uuid');
const aws_keys = require('./creds');
var corsOptions = { origin: true, optionsSuccessStatus: 200 };
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

//const db_credentials = require('./db_creds');
//app.use(myConnection(mysql, db_credentials, 'single'));


//instanciamos el sdk
var AWS = require('aws-sdk');
//instanciamos los servicios a utilizar con sus respectivos accesos.
const s3 = new AWS.S3({
  region: 'us-east-2',
  accessKeyId: "accessKeyId",
  secretAccessKey: "secretAccessKey"
});
let bucketname = 'practica1-g45-imagenes';
const ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: 'us-east-2',
  accessKeyId: "accessKeyId",
  secretAccessKey: "secretAccessKey"
});


var port = 9000;
app.listen(port);
console.log('Listening on port', port);





//--------------------------------------------------RUTAS---------------------------------------
//Ruta principal
app.get('/', (req, res) => {
    res.send(JSON.stringify({ 'status': 202, 'Item': data }));

});

//Ingreso a la app
app.post('/ingresar', (req, res) => {

  var usu = req.body.username;
  var contra = req.body.contrasena;


  if (!(usu || contra)) {
    res.send(JSON.stringify({ 'status': 404, 'Item': '' }));
  }
  //Encontrar Usuario
  var params = {
    TableName: "usuario",
    Key: {
      "username": usu.toString(),
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      if (data.Items[1].username == usu) {
        if (data.Items[1].contrasena == contra) {
          console.log(contra);
          res.send(JSON.stringify({ 'status': 202, 'Item': data.Items[1] }));
        } else {

          res.send(JSON.stringify({ 'status': 202, 'Item': '' }));
        }
      }
      else {
        res.send(JSON.stringify({ 'status': 303, 'Item': '' }));
      }
    }
  });

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
    res.send(JSON.stringify({ 'status': 504, 'existe': '' }));
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usu }
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      if (data.Items[1].username == usu) {
        res.send(JSON.stringify({ 'status': 404, 'existe': 'true' }));
      }
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

        var params3 = {
          TableName: "usuario",
          Item: {
            'username': usu.toString(),
            'nombre': nombre.toString(),
            'contrasena': contra.toString(),
            'nFoto': nFoto.toString() + '.' + ext.toString(),
            'foto_perfil': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei.toString(),
            'album': { 'L': [{ 'L': [{ 'S': 'Perfil' }, { 'L': [{ 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei }] }] }] }
          }
        }

        ddb.put(params3, function (err, data) {
          if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
          }
        });
        res.send(JSON.stringify({ 'status': 202, 'existe': 'true' }));

      }
    }
  });

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
    res.send(JSON.stringify({ 'status': 504, 'existe': '' }));
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usu }
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      if (data.Items[1].username == usu) {
        if (data.Items[1].contrasena == contra) {

          var nombrei = "fotos_perfil/" + nFoto + "-" + uniqueID + "." + ext;
          //Se convierte la base64 a bytes
          let buff = new Buffer.from(b64, 'base64');

          var album_perfil = data.Items[1].album;
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

          var params2 = {
            TableName: "usuario",
            Key: {
              "username": usu.toString()
            },
            UpdateExpression: 'SET nombre=:n, nFoto=:nf, foto_perfil=:fp, album=:prof',
            ExpressionAttributeValues: {
              ':n': { 'S': nombre },
              ':nf': { 'S': nFoto + '.' + ext },
              ':fp': { 'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + nombrei },
              ':prof': album_perfil
            },
            ReturnValues: "UPDATED_NEW"
          };

          ddb.update(params2, function (err, data) {
            if (err) {
              console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
              console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            }
          });
          console.log('Actualizado');
          res.send(JSON.stringify({ 'status': 202, 'Item': data.Items[1] }));
        } else {
          return JSON.stringify({ 'status': 303, 'Item': data.Items[1] })
        }
      } else {
        return JSON.stringify({ 'status': 202, 'Item': '' })
      }

    }

  });

});

app.post('/newAlbum', (req, res) => {
  var usern = req.body.username;
  var nombre_album = req.body.album;

  if (!(usern || nombre_album)) {
    res.send(JSON.stringify({ 'status': 504, 'Existe': '' }));
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': usern.toString()
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
    else {
      if (data.Items[1].username == usern) {
        var albumes = data.Items[1].album;
        albumes = albumes + "({ 'L': [{ 'S':" + nombre_album.toString() + "}, { 'L': [] }] })";

        var params2 = {
          TableName: "usuario",
          Key: {
            "username": usern.toString()
          },
          UpdateExpression: 'set album=:nal',
          ExpressionAttributeValues: {
            ':nal': albumes
          },
          ReturnValues: "UPDATED_NEW"
        };

        ddb.update(params2, function (err, data) {
          if (err) {
            console.error("Unable to update album. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("UpdateAlbum succeeded:", JSON.stringify(data, null, 2));

            console.log('Album actualizado');

            res.send(JSON.stringify({ 'status': 202, 'existe': data }));
          }
        });
      }

      else {
        console.log('No actualizado');
        res.send(JSON.stringify({ 'status': 404, 'existe': 'true' }));
      }
    }
  });
});


app.post('/deleteAlbum', (req, res) => {
  var usern = req.body.username;
  var nombre_album = req.body.album;

  if (!(usern || nombre_album)) {
    res.send(JSON.stringify({ 'status': 504, 'existe': '' }));
  }

  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': usern.toString()
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
    else {
      if (data.Items[1].username == usern) {
        var albumes = data.Items[1].album;
        var pos = 0;



        var params2 = {
          TableName: "usuario",
          Key: {
            "username": usern.toString()
          },
          UpdateExpression: 'set album=:nal',
          ExpressionAttributeValues: {
            ':nal': "({ 'L': [{ 'S':" + data.Items[1].album['L'].toString + "}, { 'L': [] }] })"
          },
          ReturnValues: "UPDATED_NEW"
        };

        ddb.update(params2, function (err, data) {
          if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));

            res.send(JSON.stringify({ 'status': 202, 'existe': data }));
          }
        });
      }
      else {

        res.send(JSON.stringify({ 'status': 404, 'existe': 'true' }));
      }
    }
  });

});


app.post('/nuevaFoto', (req, res) => {
  var usern = req.body.username;
  var nombre_foto = req.body.nFoto;
  var extension = req.body.ext;
  var nombre_album = req.body.album;
  var b64 = req.body.b64;
  var uniqueID = `${nFoto}-${uuid()}.${ext}`;

  if (!(usern || nombre_album)) {
    res.send(JSON.stringify({ 'status': 504, 'existe': '' }));
  }


  //Encontrar Usuario
  var params = {
    TableName: 'usuario',
    Key: {
      'username': { 'S': usu }
    }
  };

  ddb.scan(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      if (data.Items[1].username == usern) {
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
        res.send(JSON.stringify({ 'status': 202, 'existe':data }));
      }
      else {
        res.send(JSON.stringify({ 'status': 404, 'existe': true }));
      }
    }
  });

});

