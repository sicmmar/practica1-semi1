const URL = "127.0.0.1:7050";

// PARA REGISTRO DE NUEVO USUARIO
const registro = async (cuerpo) => {
    const response = await fetch("http://" + URL + "/registrar", {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            Accept : "application/json"
        },
        body : cuerpo
    });

    const respuesta = await response.json();
    return respuesta
}

// PARA INGRESO DE UN USUARIO
const ingresoURL = async (cuerpo) => {
    const response = await fetch("http://" + URL + "/ingresar", {
        method : "POST",
        headers: {
            "Content-Type":"application/json",
            Accept : "application/json"
        },
        body : cuerpo
    });

    const respuesta = await response.json();
    return respuesta;
}

// PARA EDITAR DATOS DE USUARIO
const edicion = async (cuerpo) => {
    const response = await fetch("http://" + URL + "/editarPerfil", {
        method: "POST",
        headers: {
            "Content-Type":"application/json",
            Accept : "application/json"
        },
        body : cuerpo
    });

    const respuesta = await response.json();
    return respuesta
}