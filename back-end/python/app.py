from credenciales import credenciales
from flask import Flask, request, jsonify
from flask_dynamo import Dynamo
from flask_cors import CORS
from boto3.session import Session
import boto3

app = Flask(__name__)
CORS(app) 

dynamo = boto3.client('dynamodb',
        region_name=credenciales.dynamodb['region'],
        aws_access_key_id=credenciales.dynamodb['accessKeyId'],
        aws_secret_access_key=credenciales.dynamodb['secretAccessKey']
    )

@app.route('/')
def result():
    return str("Jau")
    
@app.route('/registrar', methods=['POST'])
def registrar():
    usern = request.json.get('username')
    nombre = request.json.get('nombre')
    passw = request.json.get('contrasena')
    foto = request.json.get('foto')

    if not usern or not nombre or not passw or not foto:
        return jsonify({'status': 404,'existe': ''})

    existe = dynamo.get_item(
        TableName='usuario',
        Key = {
            'username': {'S': usern}
        }
    )

    if existe.get('Item'):
        return jsonify({'status': 404,'existe':'true'})

    resp = dynamo.put_item(
        TableName='usuario',
        Item={
            'username': {'S': usern},
            'nombre': {'S': nombre},
            'contrasena': {'S': passw},
            'foto_perfil': {'S': foto}
        }
    )

    status = resp['ResponseMetadata']['HTTPStatusCode']
    return jsonify({'status': status,'existe': "false"})

if __name__ == '__main__':
    app.run(port=7050)
