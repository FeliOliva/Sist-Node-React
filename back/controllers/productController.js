const productsModel = require("../models/productModel");
const { redisClient } = require("../db");


const getAllProducts = async (req, res) => {
    try {
        const cacheKey = `AllProductos`;

        //Verificar si los datos están en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData)); // Retorna la caché
        }

        //Consultar la base de datos con Prisma
        const productsData = await productsModel.getAllProducts();

        //Guardar en Redis con expiración de 10 minutos
        await redisClient.setEx(cacheKey, 600, JSON.stringify(productsData));

        res.status(200).json(productsData);
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).json({ error: "Error al obtener los productos" });
    }
}
const getProducts = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Los parámetros de paginación no son válidos" });
        }

        const cacheKey = `Productos:${limitNumber}:${pageNumber}`;

        //Verificar si los datos están en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData)); // Retorna la caché
        }

        //Consultar la base de datos con Prisma
        const productsData = await productsModel.getProducts(limitNumber, pageNumber);

        //Guardar en Redis con expiración de 10 minutos
        await redisClient.setEx(cacheKey, 600, JSON.stringify(productsData));

        res.status(200).json(productsData);
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).json({ error: "Error al obtener los productos" });
    }
}
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                error: "El id es obligatorio"
            })
        }
        const product = await productsModel.getProductById(id)
        res.json(product)
    } catch (error) {
        console.error("Error al obtener el producto", error)
        res.status(500).json({
            error: "Error al obtener el cliente"
        })
    }

}
const addProduct = async (req, res) => {
    try {
        const { nombre, precio, medicion, precioInicial, tipoUnidadId, rol_usuario } = req.body
        console.log("data desde el back", req.body)
        if (rol_usuario !== 0) {
            return res.status(401).json({ error: "No tiene permiso para realizar esta accion" })
        }
        if (!nombre || !precio || !precioInicial || !tipoUnidadId || !medicion) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" })
        }
        const keys = await redisClient.keys("Productos:*");
        const keys2 = await redisClient.keys("AllProductos:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
            await redisClient.del(keys2)
        }
        const newProduct = await productsModel.addProduct({ nombre: nombre.toUpperCase(), precio, precioInicial, tipoUnidadId, medicion });
        res.json(newProduct)
    } catch (error) {
        console.error("Error al agregar el producto", error);
        res.status(500).json({ error: "Error al agregar el producto" })
    }
}
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, tipoUnidadId } = req.body;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" })
        }
        const product = await productsModel.getProductById(id);
        console.log("producto", product);
        await redisClient.del(`Productos:${id}`);
        const keys = await redisClient.keys("Productos:*");
        const keys2 = await redisClient.keys("AllProductos:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
            await redisClient.del(keys2)
        }
        if (product.precio !== precio) {
            const precioAntiguo = product.precio;
            await productsModel.updatePrecio(id, { precioAntiguo, precioNuevo: precio });
        }
        const updatedProduct = await productsModel.updateProduct(id, { nombre: nombre.toUpperCase(), precio, tipoUnidadId });
        res.json(updatedProduct);
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).json({ error: "Error al actualizar el producto" });
    }
}
const dropProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" })
        }
        const keys = await redisClient.keys("Productos:*");
        const keys2 = await redisClient.keys("AllProductos:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
            await redisClient.del(keys2)
        }
        const deletedProduct = await productsModel.updateProductStatus(id, 0);
        res.json(deletedProduct);
    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).json({ error: "Error al eliminar el producto" });
    }
}
const upProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" })
        }
        const keys = await redisClient.keys("Productos:*");
        const keys2 = await redisClient.keys("AllProductos:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
            await redisClient.del(keys2)
        }
        const upProduct = await productsModel.updateProductStatus(id, 1);
        res.json(upProduct);
    } catch (error) {
        console.error("Error al activar el producto:", error);
        res.status(500).json({ error: "Error al activar el producto" });
    }
}
module.exports = { getAllProducts, getProducts, getProductById, addProduct, dropProduct, updateProduct, upProduct }