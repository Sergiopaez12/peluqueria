const express = require('express');
const router = express.Router();
const resenaController = require('../controllers/resenaControllers');
const { verificarToken } = require('../middleware/authMiddleware');

router.get('/', verificarToken, resenaController.getResenas);
router.post('/', verificarToken, resenaController.createResena);
router.delete('/:id', verificarToken, resenaController.deleteResena);

module.exports = router;
