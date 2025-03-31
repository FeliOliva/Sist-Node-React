import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = async (endpoint, method = "GET", body = null) => {
    const token = localStorage.getItem("token"); // Obtener el token del localStorage

    try {
        const response = await axios({
            url: `${API_URL}/${endpoint}`,
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "", // Enviar token si existe
            },
            data: body, // `axios` ya maneja la serialización del body
        });

        return response.data; // Devolvemos solo la data limpia
    } catch (error) {
        console.error("API Error:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Error en la petición");
    }
};
