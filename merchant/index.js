const express = require('express');
const router = express.Router();

const getHotelsRouter = require('./getHotels');
const getHotelDetailRouter = require('./getHotelDetail');
const createHotelRouter = require('./createHotel');
const updateHotelRouter = require('./updateHotel');
const deleteHotelRouter = require('./deleteHotel');
const uploadRouter = require('./upload');

// 统一在这里汇聚 merchant 模块下的所有路由逻辑
router.use('/', getHotelsRouter);
router.use('/', getHotelDetailRouter);
router.use('/', createHotelRouter);
router.use('/', updateHotelRouter);
router.use('/', deleteHotelRouter);
router.use('/', uploadRouter);

module.exports = router;
