const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioControllers');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

router.get('/', verificarToken, servicioController.getServicios);
router.get('/all', verificarToken, soloAdmin, servicioController.getAllServicios);
router.post('/', verificarToken, soloAdmin, servicioController.createServicio);
router.put('/:id', verificarToken, soloAdmin, servicioController.updateServicio);
router.delete('/:id', verificarToken, soloAdmin, servicioController.deleteServicio);

module.exports = router;
