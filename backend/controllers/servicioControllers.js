const Servicio = require('../models/Servicio');

exports.getServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find({ activo: true });
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener servicios.' });
  }
};

exports.getAllServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find().sort({ createdAt: -1 });
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener todos los servicios.' });
  }
};

exports.createServicio = async (req, res) => {
  try {
    const { nombre, precio, duracionMin, descripcion, activo } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ message: 'Nombre y precio son requeridos.' });
    }
    const nuevoServicio = new Servicio({
      nombre,
      precio,
      duracionMin,
      descripcion,
      activo
    });
    await nuevoServicio.save();
    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al crear servicio o nombre ya registrado.' });
  }
};

exports.updateServicio = async (req, res) => {
  try {
    const { nombre, precio, duracionMin, descripcion, activo } = req.body;
    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { nombre, precio, duracionMin, descripcion, activo },
      { new: true, runValidators: true }
    );
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al actualizar servicio.' });
  }
};

exports.deleteServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findById(req.params.id);
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    await servicio.deleteOne();
    res.json({ message: 'Servicio eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar servicio.' });
  }
};
