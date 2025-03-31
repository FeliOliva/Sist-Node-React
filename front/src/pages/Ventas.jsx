import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import { api } from "../services/api";

const Ventas = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                setLoading(true);
                const { ventas } = await api("api/ventas?page=1&limit=3");

                // Obtener detalles de clientes, negocios y cajas
                const clientesPromises = ventas.map((venta) => api(`api/clientes/${venta.clienteId}`));
                const negociosPromises = ventas.map((venta) => api(`api/negocio/${venta.negocioId}`));

                // Ejecutar todas las promesas en paralelo
                const [clientes, negocios] = await Promise.all([
                    Promise.all(clientesPromises),
                    Promise.all(negociosPromises),
                ]);

                // Mapear los datos de ventas con los nombres obtenidos
                const ventasConNombres = ventas.map((venta, index) => ({
                    ...venta,
                    nombre: clientes[index]?.nombre || "Desconocido",
                    apellido: clientes[index]?.apellido || "Desconocido",
                    negocioNombre: negocios[index]?.nombre || "Desconocido",
                }));

                setVentas(ventasConNombres);
            } catch (error) {
                message.error("Error al obtener los datos: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVentas();
    }, []);

    const columns = [
        { title: "Nro. Venta", dataIndex: "nroVenta", key: "nroVenta" },
        { title: "Nombre", dataIndex: "nombre", key: "nombre" },
        { title: "Apellido", dataIndex: "apellido", key: "apellido" },
        { title: "Negocio", dataIndex: "negocioNombre", key: "negocioNombre" },
        { title: "Total", dataIndex: "total", key: "total" },
        { title: "Fecha", dataIndex: "fechaCreacion", key: "fechaCreacion" },
    ];

    return (
        <Table dataSource={ventas} columns={columns} loading={loading} rowKey="id" />
    );
};

export default Ventas;
