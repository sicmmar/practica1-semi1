# Práctica 2 - Seminario de Sistemas 1
-----
Grupo #45

- Integrantes

|Nombre|Carnet|
|--|--|
| Asunción Mariana Sic Sor | 201504051|
| Elba María Alvarez Domínguez | 201408549 |
 <div style="text-align: justify">
 
## **UGRAM PRO** 
Se desarrolló una aplicación web similar a un aplicación para almacenamiento de fotos, esta permite subir todo tipo de fotos. Utilizar servicios de Machine Learning.

## Arquitectura
* ### Aplicación Web
    Aplicación creada con Bootstrap, Javascript, CSS y HTML
* ### Servidor Python
    Para el desarrollo de este servidor, se hizo uso de Flask para poder crear la respectica API RESTFul, así como librerías en la integración de toda la práctica: flask_cors, boto3
* ### Bucket de Imágenes
    Se utilizó AWS S3 para el alojamiento de las imágenes tanto las de perfil como la de los diferentes álbumes, así como para alojar la página web.
* ### Base de Datos
    Para la base de datos de este proyecto se utilizó el servicio de DynamoDB (NoSQL)
* ### Machine Learning
    Se han agregado funciones como reconocimiento facial, características que posee una persona en su foto de perfil y los álbumes de han categorizado según las fotos que se deseen subir.
* ### Traductor
    La descripción de cada fotografía tiene la opción de traducir a tres diferentes idiomas. Estos son: Inglés, Ruso y Portugués. El idioma de origen puede ser cualquiera.

![](docs/img/ugramPro.png)

## Usuarios IAM
Se crearon usuarios por cada uno de los servicios de AWS utilizados en la arquitectura de la aplicación, usuarios para administrar: 
* ### S3
    Vista desde consola de administrador

    ![](docs/img/s3-1.png)

    Vista desde consola de usuario ``` s3-sicmmar ```

    ![](docs/img/s3-2.png)

    Políticas para grupo ```s3-group``` al cual pertenece ``` s3-sicmmar ```

    ![](docs/img/s3-pol.png)


* ### EC2 
    Vista desde consola de administrador

    ![](docs/img/ec2-1.png)

    Vista desde consola de usuario ``` ec2-sicmmar ```

    ![](docs/img/ec2-2.png)

* ### DynamoDB
    Vista desde consola de administrador

    ![](docs/img/dyn-1.png)

    Vista desde consola de usuario ```dynamo-sicmmar``` 

* ### Rekognition
    Vista desde consola de administrador

    ![](docs/img/rek-1.png)

* ### Translate
    Vista desde consola de administrador

    ![](docs/img/translate-1.png)

* ### Lex
    Vista desde consola de administrador

    ![](docs/img/lex-1.png)

## Elementos para Ugram Pro
* ### Buckets de S3 
    Bucket ``` practica2-g45-imagenes ```, este contiene dos carpetas (```fotos_perfil``` y ```fotos_publicadas```) en las cuáles se almacenan todas las imágenes a almacenar en Ugram.

    ![](docs/img/s3-b1.png)

    Bucket ``` practica2-g45-paginaweb ```, este contiene alojado el sitio web estático para la visualización de Ugram.

    ![](docs/img/s3-b2.png)

* ### EC2

    Máquina Virtual con Ubuntu para servidor de Python con IP privada de ```172.31.26.177```

    ![](docs/img/python2.png)
    ![](docs/img/python1.png)

* ### Tablas de DynamoDB
    Para el almacenamiento de los datos de Ugram, se utilizó una tabla llamada ```usuario```, la cual cada registro en ella contiene la siguiente estructua

    ``` json
    {
        "username":"usuario1",
        "nombre":"Nombre Usuario",
        "nFoto":"perfil.png",
        "foto_perfil":"https://url-bucket-img/perfil-47450104.png",
        "contrasena":"contrasenaenMD5",
        "etiquetas": [
            {
                "edad":"21-35 años"
            },
            {

                "barba":"No tiene barba"
            },
            {

                "lentes" :"Usa lentes"
            },
            {

                "ojos":"Ojos Abiertos"
            },
            {

                "genero":"Femenino"
            },
            {

                "sonrisa":"No esta sonriendo"
            },
            {

                "sentimiento":"Feliz"
            }
        ],
        "album": [
            [
                {
                    "nombre_album":"Perfil",
                    [
                        Lista de Fotos
                        ...
                    ]
                },
                {
                    "nombre_album":"Album1",
                    [
                        {
                            "nombre_foto":"Foto1",
                            "descripcion":"Descripcion Foto 1",
                            "enlace_foto":"http://practica2-g45-paginaweb.s3-website.us-east-2.amazonaws.com/fotos_publicadas/foto1-4778914.jpg"
                        },
                        Lista de Foto de cualquier Album
                        ...
                    ]
                }
            ],
            
            Lista de Albumes
            ...   
        ]
    }
    ```

    Por ejemplo, se puede observar la estructura anterior en un registro para el usuario ```sicmmar```

    ![](docs/img/user-json2.png)

* ### Aplicación Web
    [Página de Inicio](http://practica2-g45-paginaweb.s3-website.us-east-2.amazonaws.com/)

    ![](docs/img/login2.png)

    Inicio de sesión con reconocimiento facial

    ![](docs/img/web.png)

    Página de Registro

    ![](docs/img/reg2.png)

    Página principal donde el usuario puede observar y gestionar sus datos

    ![](docs/img/inicio2.png)

    Editar datos de perfil

    ![](docs/img/edit2.png)

    Función de Extraer Texto

    ![](docs/img/extraer.png)

    Cargar una nueva foto

    ![](docs/img/subir2.png)

    ![](docs/img/vis2.png)

    Manejo de Álbum

    ![](docs/img/album2.png)

    ChatBot

    ![](docs/img/chat1.png)

    ![](docs/img/chat2.png)