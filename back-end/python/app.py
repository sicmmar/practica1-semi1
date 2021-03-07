from credenciales import credenciales
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import boto3
import base64
import uuid

app = Flask(__name__)
CORS(app) 

dynamo = boto3.client('dynamodb',
        region_name=credenciales.dynamodb['region'],
        aws_access_key_id=credenciales.dynamodb['accessKeyId'],
        aws_secret_access_key=credenciales.dynamodb['secretAccessKey']
    )

s3 = boto3.client('s3',
        region_name=credenciales.s3['region'],
        aws_access_key_id=credenciales.s3['accessKeyId'],
        aws_secret_access_key=credenciales.s3['secretAccessKey']
    )

BUCKET_NAME='practica1-g45-imagenes'

@app.route('/')
def result():
    return str("Jau")

#ingreso a la app
@app.route('/ingresar', methods=['POST'])
def ingresar():
    usern = request.json.get('username')
    passw = request.json.get('contrasena')

    if not usern or not passw:
        return jsonify({'status': 404,'Item': ''})

    item = usuarioExistente(usern)
    if item:
        if item['contrasena']['S'] == passw:
            return jsonify({'status': 202,'Item':item})
        
        return jsonify({'status': 202,'Item':''})

    return jsonify({'status': 303,'Item': ""})

#registro de nuevo usuario
@app.route('/registrar', methods=['POST'])
def registrar():
    usern = request.json.get('username')
    nombre = request.json.get('nombre')
    passw = request.json.get('contrasena')
    nFoto = request.json.get('nFoto')
    ext = request.json.get('ext')
    b64 = request.json.get('b64')
    uniqueID = str(uuid.uuid1().time_low)

    if not usern or not nombre or not passw or not nFoto:
        return jsonify({'status': 504,'existe': ''})

    if usuarioExistente(usern):
        return jsonify({'status': 404,'existe':'true'})

    starter = b64.find(',')
    image_data = b64[starter+1:]
    image_data = bytes(image_data, encoding="ascii")
    ubicacion = 'fotos_perfil/' + nFoto + '-' + uniqueID + '.' + ext 

    res = s3.upload_fileobj(
        BytesIO(base64.b64decode(image_data)),
        BUCKET_NAME,
        ubicacion,
        ExtraArgs={'ACL': 'public-read'}
    )
    #res = s3.upload_file("foto","practica1-g45-imagenes",foto)
    print(res)


    resp = dynamo.put_item(
        TableName='usuario',
        Item={
            'username': {'S': usern},
            'nombre': {'S': nombre},
            'contrasena': {'S': passw},
            'nFoto' : {'S': nFoto + '.' + ext},
            'foto_perfil': {'S': "https://practica1-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion}
        }
    )
    status = resp['ResponseMetadata']['HTTPStatusCode']
    return jsonify({'status': status,'existe': "false"})

def usuarioExistente(usernam):
    existe = dynamo.get_item(
        TableName='usuario',
        Key = {
            'username': {'S': usernam}
        }
    )

    return existe.get('Item')

if __name__ == '__main__':
    app.run(port=7050)
