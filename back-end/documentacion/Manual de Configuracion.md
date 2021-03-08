# Práctica 1 - Seminario de Sistemas 1
-----
Grupo #45

- Integrantes

|Nombre|Carnet|
|--|--|
| Asunción Mariana Sic Sor | 201504051|
| Elba María Alvarez Domínguez | 201408549 |
 <div style="text-align: justify">
 
## **UGAM** 
Se desarrolló una aplicación web similar a un aplicación para almacenamiento de fotos, esta permite subir todo tipo de fotos. 

## Arquitectura
* ### Aplicación Web:
    Aplicación creada con Javascript, CSS y HTML
* ### Load Balancer:
    AWS Load Balancing es el balanceador de carga utilizado en esta aplicación, encargado de distribuir o redirigir la carga de stráfico de peticiones dentro de dos servidores, uno creado con Python y otro creado con NodeJs, en caso llegase a ocurrir una desconexión repentina de uno de los servidores.
* ### Servidor Python
* ### Servidor NodeJs:
    Entorno de ejecución multiplataforma de instalado con los paquetes de express, cors, nodemon, mysql y AWS-sdk.
* ### Bucket de Imágenes:
    Se utilizó AWS S3 para el alojamiento de las imágenes tanto las de perfil como la de los diferentes álbumes, así como para alojar la página web.
* ### Base de Datos:
    Para la base de datos de este proyecto se utilizó el servicio de DynamoDB.

## Usuarios IAM
Se crearon usuarios por cada uno de los servicios de AWS utilizados en la arquitectura de la aplicación, usuarios para administrar: S3, EC2 y DynamoDB.

## Capturas de Pantalla de la Arquitectura
* ### Buckets de S3 
* ### EC2
* ### Tablas de DynamoDB
* ### Aplicación Web