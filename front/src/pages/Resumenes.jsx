// pages/VentasPorCliente.tsx
import React, { useEffect, useState } from "react";
import { Input, Select, DatePicker, Button, Table, message } from "antd";
import dayjs from "dayjs";
import { api } from "../services/api";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Resumenes = () => {
    const [clientes, setClientes] = useState([]);
    const [negocios, setNegocios] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
    const [fechas, setFechas] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [tipoBusqueda, setTipoBusqueda] = useState("cliente"); // 'cliente' o 'negocio'


    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const res = await api("api/getAllClientes");
                setClientes(res.clients || []);
                console.log(res);
            } catch (err) {
                message.error("Error al cargar clientes");
            }
        };
        fetchClientes();
    }, []);

    const handleClienteChange = async (clienteId) => {
        setClienteSeleccionado(clienteId);
        setNegocioSeleccionado(null); // Reinicia negocio
        try {
            const res = await api(`api/getAllNegociosByCliente/${clienteId}`);
            setNegocios(res.negocios || []);
        } catch (err) {
            message.error("Error al cargar negocios");
        }
    };

    const handleBuscarVentas = async () => {
        if (fechas.length !== 2) {
            message.warning("Seleccioná un rango de fechas");
            return;
        }

        const startDate = dayjs(fechas[0]).format("YYYY-MM-DD");
        const endDate = dayjs(fechas[1]).format("YYYY-MM-DD");

        try {
            let res;

            if (tipoBusqueda === "cliente") {
                if (!clienteSeleccionado || !negocioSeleccionado) {
                    message.warning("Seleccioná cliente y negocio");
                    return;
                }

                res = await api(
                    `api/ventas/cliente/${clienteSeleccionado}?page=1&limit=10&startDate=${startDate}&endDate=${endDate}&cajaId=${negocioSeleccionado}`
                );
            } else if (tipoBusqueda === "negocio") {
                if (!negocioSeleccionado) {
                    message.warning("Seleccioná un negocio");
                    return;
                }

                res = await api(
                    `api/ventas/negocio/${negocioSeleccionado}?page=1&limit=10&startDate=${startDate}&endDate=${endDate}`
                );
            }

            setVentas(res.ventas || []);
            console.log(res);
        } catch (err) {
            message.error("Error al cargar ventas");
        }
    };


    const columnas = [
        {
            title: "ID Venta",
            dataIndex: "id",
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
            title: "Total",
            dataIndex: "total",
        },
        // Podés agregar más columnas según la estructura que te devuelva la API
    ];

    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
                <Select
                    style={{ minWidth: 150 }}
                    value={tipoBusqueda}
                    onChange={(value) => {
                        setTipoBusqueda(value);
                        // Resetear filtros al cambiar tipo de búsqueda
                        setClienteSeleccionado(null);
                        setNegocioSeleccionado(null);
                        setVentas([]);
                    }}
                >
                    <Option value="cliente">Buscar por Cliente</Option>
                    <Option value="negocio">Buscar por Negocio</Option>
                </Select>

                {tipoBusqueda === "cliente" && (
                    <>
                        <Select
                            style={{ minWidth: 200 }}
                            placeholder="Selecciona cliente"
                            onChange={handleClienteChange}
                            value={clienteSeleccionado}
                        >
                            {clientes.map((clients) => (
                                <Option key={clients.id} value={clients.id}>
                                    {clients.nombre}
                                </Option>
                            ))}
                        </Select>

                        <Select
                            style={{ minWidth: 200 }}
                            placeholder="Selecciona negocio"
                            onChange={setNegocioSeleccionado}
                            value={negocioSeleccionado}
                            disabled={!clienteSeleccionado}
                        >
                            {negocios.map((n) => (
                                <Option key={n.id} value={n.id}>
                                    {n.nombre}
                                </Option>
                            ))}
                        </Select>
                    </>
                )}

                {tipoBusqueda === "negocio" && (
                    <Select
                        style={{ minWidth: 200 }}
                        placeholder="Selecciona negocio"
                        onChange={setNegocioSeleccionado}
                        value={negocioSeleccionado}
                    >
                        {negocios.map((n) => (
                            <Option key={n.id} value={n.id}>
                                {n.nombre}
                            </Option>
                        ))}
                    </Select>
                )}


                <RangePicker onChange={(dates) => setFechas(dates)} />

                <Button type="primary" onClick={handleBuscarVentas}>
                    Buscar Ventas
                </Button>
            </div>

            <Table
                dataSource={ventas}
                columns={columnas}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </div>
    );
};

export default Resumenes;
