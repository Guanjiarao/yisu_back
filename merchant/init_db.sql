CREATE DATABASE IF NOT EXISTS hotel_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hotel_db;

CREATE TABLE IF NOT EXISTS `hotels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL COMMENT '关联的商家ID',
  `name` varchar(255) NOT NULL COMMENT '酒店名称',
  `english_name` varchar(255) DEFAULT '' COMMENT '英文名称',
  `address` varchar(255) NOT NULL COMMENT '地址',
  `longitude` varchar(50) DEFAULT NULL COMMENT '经度',
  `latitude` varchar(50) DEFAULT NULL COMMENT '纬度',
  `city` varchar(100) DEFAULT '' COMMENT '城市',
  `star` int(11) NOT NULL DEFAULT 0 COMMENT '星级',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '最低价格',
  `status` enum('published','pending','offline','rejected') DEFAULT 'pending' COMMENT '状态',
  `score` decimal(3,1) DEFAULT 0.0 COMMENT '评分',
  `description` text COMMENT '描述',
  `cover_image` varchar(1000) DEFAULT '' COMMENT '封面图',
  `detail_images` json DEFAULT NULL COMMENT '详情图JSON',
  `open_date` varchar(50) DEFAULT '' COMMENT '开业时间',
  `tags` json DEFAULT NULL COMMENT '标签JSON',
  `reject_reason` varchar(255) DEFAULT NULL COMMENT '驳回原因',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='酒店表';

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` int(11) NOT NULL COMMENT '关联的酒店ID',
  `name` varchar(255) NOT NULL COMMENT '房型名称',
  `area` int(11) DEFAULT 0 COMMENT '面积',
  `bed_info` varchar(255) DEFAULT '' COMMENT '床型信息',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
  `stock` int(11) NOT NULL DEFAULT 0 COMMENT '库存',
  `image` varchar(1000) DEFAULT '' COMMENT '房间图',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='酒店房间表';
