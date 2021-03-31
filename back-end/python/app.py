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

rek = boto3.client('rekognition',
        region_name=credenciales.rekognition['region'],
        aws_access_key_id=credenciales.rekognition['accessKeyId'],
        aws_secret_access_key=credenciales.rekognition['secretAccessKey']
    )

translate = boto3.client('translate',
        region_name=credenciales.translate['region'],
        aws_access_key_id=credenciales.translate['accessKeyId'],
        aws_secret_access_key=credenciales.translate['secretAccessKey']
)

BUCKET_NAME='practica2-g45-imagenes'

@app.route('/')
def result():
    return str("Jau")

###############################################################################################################################################
# MANEJO DE USUARIOS 

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

#Comparacion de foto de perfil en Login
@app.route('/ingresarWeb', methods=['POST'])
def ingresarWeb():
    usern = request.json.get('username')
    imagen2 = request.json.get('foto') #Foto nueva solo para ingresar.
    starter = imagen2.find(',')
    image_data = imagen2[starter+1:]
    image_data = bytes(image_data, encoding="ascii")

    if not usern:
        return jsonify({'status': 404,'Item': ''})

    item = usuarioExistente(usern)
    if item:
        respuesta = rek.compare_faces(
            SourceImage={
                'S3Object':{
                    'Bucket':BUCKET_NAME,'Name': 'fotos_perfil/' + item['nFoto']['S']
                    }
                }, 
            TargetImage={
                'Bytes':base64.b64decode(image_data)
                },
            SimilarityThreshold=81)

        if respuesta['FaceMatches'] == []:
            return jsonify({'status': 202,'Item':''})
        else:
            if respuesta['FaceMatches'][0]['Similarity'] >= 85:
                return jsonify({'status': 202,'Item': item})
            else: return jsonify({'status': 202,'Item': ''})

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

    s3.upload_fileobj(
        BytesIO(base64.b64decode(image_data)),
        BUCKET_NAME,
        ubicacion,
        ExtraArgs={'ACL': 'public-read'}
    )
    #res = s3.upload_file("foto","practica2-g45-imagenes",foto)
    
    dynamo.put_item(
        TableName='usuario',
        Item = {
            'username': {'S': usern},
            'nombre': {'S': nombre},
            'contrasena': {'S': passw},
            'nFoto' : {'S': nFoto + '-' + uniqueID + '.' + ext},
            'foto_perfil': {'S': "https://practica2-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion},
            'album':{'L':[{'L': [{'S':'Perfil'},{'L':[{'S': "https://practica2-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion}]}]}]}       
        }
    )

    #status = resp['ResponseMetadata']['HTTPStatusCode']
    return jsonify({'status': 202,'existe': "false"})

#editar datos del perfil de usuario
@app.route('/editarPerfil', methods=['POST'])
def editarPerfil():
    usern = request.json.get('username')
    nombre = request.json.get('nombre')
    passw = request.json.get('contrasena')
    nFoto = request.json.get('nFoto')
    ext = request.json.get('ext')
    b64 = request.json.get('b64')
    uniqueID = str(uuid.uuid1().time_low)

    if not usern or not nombre or not passw or not nFoto:
        return jsonify({'status': 504,'Item': ''})

    if usuarioExistente(usern): 
        if passw == usuarioExistente(usern)['contrasena']['S']:
            starter = b64.find(',')
            image_data = b64[starter+1:]
            image_data = bytes(image_data, encoding="ascii")
            ubicacion = 'fotos_perfil/' + nFoto + '-' + uniqueID + '.' + ext 

            album_perfil = usuarioExistente(usern)['album']
            for alb in album_perfil['L']:
                #aca es cada album
                if alb['L'][0]['S'] == 'Perfil':
                    alb['L'][1]['L'].append({'S': "https://practica2-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion})
                    break

            s3.upload_fileobj(
                BytesIO(base64.b64decode(image_data)),
                BUCKET_NAME,
                ubicacion,
                ExtraArgs={'ACL': 'public-read'}
            )

            dynamo.update_item(
                TableName='usuario',
                Key = {
                    'username': {'S': usern}
                },
                UpdateExpression = 'set nombre=:n, nFoto=:nf, foto_perfil=:fp, album=:prof',
                ExpressionAttributeValues = {
                    ':n': {'S': nombre},
                    ':nf': {'S': nFoto + '.' + ext},
                    ':fp': {'S': "https://practica2-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion},
                    ':prof':album_perfil
                }
            )
            return jsonify({'status': 202,'Item': usuarioExistente(usern)})
        
        else: return jsonify({'status': 303,'Item': usuarioExistente(usern)})

    return jsonify({'status': 202,'Item': ''})


###############################################################################################################################################
# MANEJO DE ALBUM

# Nuevo album
@app.route('/newAlbum', methods=['POST'])
def newAlbum():
    usern = request.json.get('username')
    nombre_album = request.json.get('album')

    if not usern or not nombre_album:
        return jsonify({'status': 504,'existe': ''})

    item = usuarioExistente(usern)
    if item:
        albumes = usuarioExistente(usern)['album']
        albumes['L'].append({'L': [{'S':nombre_album},{'L':[]}]})
        
        dynamo.update_item(
            TableName='usuario',
            Key = {
                'username': {'S': usern}
            },
            UpdateExpression = 'set album=:nal',
            ExpressionAttributeValues = {
                ':nal': albumes
            }
        )
        
        return jsonify({'status': 202,'existe': usuarioExistente(usern)})

    return jsonify({'status': 404,'existe':'true'})

# Eliminar album
@app.route('/deleteAlbum', methods=['POST'])
def deleteAlbum():
    usern = request.json.get('username')
    nombre_album = request.json.get('album')

    if not usern or not nombre_album:
        return jsonify({'status': 504,'existe': ''})

    item = usuarioExistente(usern)
    if item:
        albumes = usuarioExistente(usern)['album']
        pos = 0
        for x in range(0,len(albumes['L'])):
            if albumes['L'][x]['L'][0]['S'] == nombre_album:
                pos = x
                break
        
        albumes['L'].pop(pos)
        
        dynamo.update_item(
            TableName='usuario',
            Key = {
                'username': {'S': usern}
            },
            UpdateExpression = 'set album=:nal',
            ExpressionAttributeValues = {
                ':nal': albumes
            }
        )
        
        return jsonify({'status': 202,'existe': usuarioExistente(usern)})

    return jsonify({'status': 404,'existe':'true'})

# Subir foto nueva en un album
@app.route('/nuevaFoto', methods=['POST'])
def nuevaFoto():
    usern = request.json.get('username')
    nombre_foto = request.json.get('nFoto')
    extension = request.json.get('ext')
    nombre_album = request.json.get('album')
    b64 = request.json.get('b64')
    uniqueID = str(uuid.uuid1().time_low)

    if not usern or not nombre_album:
        return jsonify({'status': 504,'existe': ''})

    item = usuarioExistente(usern)
    if item:
        starter = b64.find(',')
        image_data = b64[starter+1:]
        image_data = bytes(image_data, encoding="ascii")
        ubicacion = 'fotos_publicadas/' + nombre_foto + '-' + uniqueID + '.' + extension

        s3.upload_fileobj(
            BytesIO(base64.b64decode(image_data)),
            BUCKET_NAME,
            ubicacion,
            ExtraArgs={'ACL': 'public-read'}
        )

        albumes = usuarioExistente(usern)['album']
        for x in range(0,len(albumes['L'])):
            if albumes['L'][x]['L'][0]['S'] == nombre_album:
                albumes['L'][x]['L'][1]['L'].append({'S': "https://practica2-g45-imagenes.s3.us-east-2.amazonaws.com/" + ubicacion})
                break
                
        dynamo.update_item(
            TableName='usuario',
            Key = {
                'username': {'S': usern}
            },
            UpdateExpression = 'set album=:nal',
            ExpressionAttributeValues = {
                ':nal': albumes
            }
        )
        
        return jsonify({'status': 202,'existe': usuarioExistente(usern)})

    return jsonify({'status': 404,'existe':'true'})


###############################################################################################################################################

def usuarioExistente(usernam):
    existe = dynamo.get_item(
        TableName='usuario',
        Key = {
            'username': {'S': usernam}
        }
    )

    return existe.get('Item')


#Analisis facial
@app.route('/detectarcara', methods=['POST'])
def detectarcara():
    imagen = request.json.get('imagen')
    nombre = imagen.split(".com/")
    print(nombre[1])

    response = rek.detect_faces(Image={'Bytes':base64.b64decode(imagen)},Attributes=['ALL'])
    #response = rek.detect_faces(Image={'S3Object':{'Bucket':BUCKET_NAME, 'Name': nombre[1]}},Attributes=['ALL'])
    
    return jsonify({'status': 202,'existe': response})


#Detectar Labels
@app.route('/detectarlabels', methods=['POST'])
def detectarlabels():
    imagen = request.json.get('imagen')
    nombre = imagen.split(".com/")

    respuesta = rek.detect_labels(Image={'Bytes':base64.b64decode(imagen)},MaxLabels=10)
    #respuesta = rek.detect_labels(Image={'S3Object':{'Bucket':BUCKET_NAME, 'Name': nombre[1]}},MaxLabels=10)
    etiquetasDetectadas=[]
    for label in respuesta['Labels']:
        etiquetasDetectadas.append(label['Name'])
        print ("Label: " + label['Name'])

    print(etiquetasDetectadas)
    return jsonify({'status': 202,'existe': respuesta})

#Comparacion de foto de perfil en Login
@app.route('/compararfotos', methods=['POST'])
def compararfotos():
    imagen = request.json.get('foto_perfil') #Foto almacenada para usarse en perfil
    imagenOriginal = imagen.split(".com/")
    imagen2 = request.json.get('foto_login') #Foto nueva solo para ingresar.
    imagenAcceso = imagen.split(".com/")
    #Comparar de BucketS3 a BucketS3->
    #respuesta = rek.compare_faces(SourceImage={'S3Object':{'Bucket':BUCKET_NAME,'Name': imagenOriginal[1]}}, TargetImage={'S3Object':{'Bucket':BUCKET_NAME,'Name': imagenAcceso[1]}},SimilarityThreshold=80)
    #Comparar de BucketS3 a ImagenB64
    respuesta = rek.compare_faces(SourceImage={'S3Object':{'Bucket':BUCKET_NAME,'Name': imagenOriginal[1]}}, TargetImage={'Bytes':base64.b64decode(imagen2)},SimilarityThreshold=80)
    return jsonify({'status': 202,'existe': respuesta})

#Extraer texto
@app.route('/detectartexto', methods=['POST'])
def detectartexto():
    imagen = request.json.get('imagen')
    nombre = imagen.split(".com/")

    response = rek.detect_text(Image={'Bytes':base64.b64decode(imagen)})
    textoFinalDetectado=[]
    textDetections=response['TextDetections']
    for text in textDetections:
        textoFinalDetectado.append(text['DetectedText'])
        print()
    #response = rek.detect_faces(Image={'S3Object':{'Bucket':BUCKET_NAME, 'Name': nombre[1]}})
    
    print(textoFinalDetectado)
    return jsonify({'status': 202,'existe': response})


#TRADUCIR TEXTO
#A Ingles:
@app.route('/traduciringles', methods=['POST'])
def traduciringles():
    texto = request.json.get('text')

    response = translate.translate_text(Text=texto,SourceLanguageCode='es',TargetLanguageCode='en')
    respuestaTraducida = response['TranslatedText']
    print(respuestaTraducida)

    return jsonify({'status': 202,'existe': response})


#A Portugues:
@app.route('/traducirportugues', methods=['POST'])
def traducirportugues():
    texto = request.json.get('text')

    response = translate.translate_text(Text=texto,SourceLanguageCode='es',TargetLanguageCode='pt')
    respuestaTraducida = response['TranslatedText']
    print(respuestaTraducida)
    
    return jsonify({'status': 202,'existe': response})


#A Ruso:
@app.route('/traducirruso', methods=['POST'])
def traducirruso():
    texto = request.json.get('text')

    response = translate.translate_text(Text=texto,SourceLanguageCode='es',TargetLanguageCode='ru')
    respuestaTraducida = response['TranslatedText']
    print(respuestaTraducida)
    
    return jsonify({'status': 202,'existe': response})

if __name__ == '__main__':
    app.run(port=7050)
