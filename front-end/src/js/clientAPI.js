const URL = "127.0.0.1:7050";

const connectAPI = async (cuerpo, endpoint) => {
    const response = await fetch("http://" + URL + "/" + endpoint, {
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