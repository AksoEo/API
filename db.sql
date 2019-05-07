-- MySQL dump 10.13  Distrib 5.7.26, for Linux (x86_64)
--
-- Host: localhost    Database: akso
-- ------------------------------------------------------
-- Server version	5.7.26-0ubuntu0.18.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `akso`
--

/*!40000 DROP DATABASE IF EXISTS `akso`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `akso` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `akso`;

--
-- Table structure for table `admin_groups`
--

DROP TABLE IF EXISTS `admin_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_groups`
--

LOCK TABLES `admin_groups` WRITE;
/*!40000 ALTER TABLE `admin_groups` DISABLE KEYS */;
INSERT INTO `admin_groups` VALUES (1,'Testgrupo (administranto)');
/*!40000 ALTER TABLE `admin_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_groups_members_clients`
--

DROP TABLE IF EXISTS `admin_groups_members_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_groups_members_clients` (
  `adminGroupId` int(10) unsigned NOT NULL,
  `apiKey` binary(16) NOT NULL,
  PRIMARY KEY (`adminGroupId`,`apiKey`),
  KEY `apiKey` (`apiKey`),
  CONSTRAINT `admin_groups_members_clients_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_groups_members_clients_ibfk_2` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_groups_members_clients`
--

LOCK TABLES `admin_groups_members_clients` WRITE;
/*!40000 ALTER TABLE `admin_groups_members_clients` DISABLE KEYS */;
INSERT INTO `admin_groups_members_clients` VALUES (1,_binary 'T��\��f|\�m\�%0\�');
/*!40000 ALTER TABLE `admin_groups_members_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_groups_members_codeholders`
--

DROP TABLE IF EXISTS `admin_groups_members_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_groups_members_codeholders` (
  `adminGroupId` int(10) unsigned NOT NULL,
  `codeholderId` int(10) unsigned NOT NULL,
  PRIMARY KEY (`adminGroupId`,`codeholderId`),
  KEY `admin_groups_members_ibfk_2` (`codeholderId`),
  CONSTRAINT `admin_groups_members_codeholders_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_groups_members_codeholders_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_groups_members_codeholders`
--

LOCK TABLES `admin_groups_members_codeholders` WRITE;
/*!40000 ALTER TABLE `admin_groups_members_codeholders` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_groups_members_codeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_clients`
--

DROP TABLE IF EXISTS `admin_permissions_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_clients` (
  `apiKey` binary(16) NOT NULL,
  `permission` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`apiKey`,`permission`),
  CONSTRAINT `admin_permissions_clients_ibfk_1` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_clients`
--

LOCK TABLES `admin_permissions_clients` WRITE;
/*!40000 ALTER TABLE `admin_permissions_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_permissions_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_codeholders`
--

DROP TABLE IF EXISTS `admin_permissions_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_codeholders` (
  `codeholderId` int(10) unsigned NOT NULL,
  `permission` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`,`permission`),
  CONSTRAINT `admin_permissions_codeholders_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_codeholders`
--

LOCK TABLES `admin_permissions_codeholders` WRITE;
/*!40000 ALTER TABLE `admin_permissions_codeholders` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_permissions_codeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_groups`
--

DROP TABLE IF EXISTS `admin_permissions_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_groups` (
  `adminGroupId` int(10) unsigned NOT NULL,
  `permission` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`adminGroupId`,`permission`),
  CONSTRAINT `admin_permissions_groups_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_groups`
--

LOCK TABLES `admin_permissions_groups` WRITE;
/*!40000 ALTER TABLE `admin_permissions_groups` DISABLE KEYS */;
INSERT INTO `admin_permissions_groups` VALUES (1,'*');
/*!40000 ALTER TABLE `admin_permissions_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_memberRestrictions_clients`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_memberRestrictions_clients` (
  `apiKey` binary(16) NOT NULL,
  `filter` json NOT NULL,
  `fields` json NOT NULL,
  PRIMARY KEY (`apiKey`),
  CONSTRAINT `admin_permissions_memberRestrictions_clients_ibfk_1` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_memberRestrictions_clients`
--

LOCK TABLES `admin_permissions_memberRestrictions_clients` WRITE;
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_memberRestrictions_codeholders`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_memberRestrictions_codeholders` (
  `codeholderId` int(11) unsigned NOT NULL,
  `filter` json NOT NULL,
  `fields` json DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  CONSTRAINT `admin_permissions_memberRestrictions_codeholders_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_memberRestrictions_codeholders`
--

LOCK TABLES `admin_permissions_memberRestrictions_codeholders` WRITE;
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_codeholders` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_codeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_permissions_memberRestrictions_groups`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_permissions_memberRestrictions_groups` (
  `adminGroupId` int(11) unsigned NOT NULL,
  `filter` json NOT NULL,
  `fields` json DEFAULT NULL,
  PRIMARY KEY (`adminGroupId`),
  CONSTRAINT `admin_permissions_memberRestrictions_groups_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_permissions_memberRestrictions_groups`
--

LOCK TABLES `admin_permissions_memberRestrictions_groups` WRITE;
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_groups` DISABLE KEYS */;
INSERT INTO `admin_permissions_memberRestrictions_groups` VALUES (1,'{}',NULL);
/*!40000 ALTER TABLE `admin_permissions_memberRestrictions_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `apiKey` binary(16) NOT NULL,
  `apiSecret` binary(32) NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerName` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerEmail` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`apiKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (_binary 'T��\��f|\�m\�%0\�',_binary '��Ё�L}e�/\�\�Z\���O+�,\�]l��\n','random app (p: test)','TEJO','mia@tejo.org');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders`
--

DROP TABLE IF EXISTS `codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderType` enum('human','org') CHARACTER SET ascii NOT NULL,
  `oldCode` char(4) CHARACTER SET ascii DEFAULT NULL,
  `newCode` char(6) CHARACTER SET ascii NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createPasswordTime` bigint(20) unsigned DEFAULT NULL,
  `createPasswordKey` binary(16) DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `feeCountry` char(2) CHARACTER SET ascii DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_esperanto_ci,
  `officePhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDead` tinyint(1) NOT NULL DEFAULT '0',
  `deathdate` date DEFAULT NULL,
  `hasProfilePicture` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `newCode` (`newCode`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `oldCode` (`oldCode`) USING BTREE,
  KEY `feeCountry` (`feeCountry`),
  KEY `isDead` (`isDead`),
  KEY `enabled` (`enabled`),
  KEY `createPasswordTime` (`createPasswordTime`),
  KEY `deathdate` (`deathdate`),
  KEY `hasProfilePicture` (`hasProfilePicture`),
  FULLTEXT KEY `email_2` (`email`),
  FULLTEXT KEY `notes` (`notes`),
  FULLTEXT KEY `officePhone` (`officePhone`),
  CONSTRAINT `codeholders_ibfk_1` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders`
--

LOCK TABLES `codeholders` WRITE;
/*!40000 ALTER TABLE `codeholders` DISABLE KEYS */;
INSERT INTO `codeholders` VALUES (2,'human','test','teeest','$2b$12$dEvwKG4oznSwcmu9kWzws.61JyzlLTrYkR9ojbeRlmweIgHI9lCBG',NULL,NULL,'mia@tejo.org',1,NULL,NULL,NULL,0,NULL,0),(3,'org','tejo','xxtejo',NULL,NULL,NULL,'admin@akso.org',1,NULL,NULL,'+31104361044',0,NULL,0);
/*!40000 ALTER TABLE `codeholders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_address`
--

DROP TABLE IF EXISTS `codeholders_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_address` (
  `codeholderId` int(10) unsigned NOT NULL,
  `country` char(2) CHARACTER SET ascii NOT NULL,
  `countryArea` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryArea_latin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_latin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityArea` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityArea_latin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress_latin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode_latin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortingCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortingCode_latin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`),
  KEY `country` (`country`),
  FULLTEXT KEY `city_latin` (`city_latin`),
  FULLTEXT KEY `countryArea_latin` (`countryArea_latin`),
  FULLTEXT KEY `streetAddress_latin` (`streetAddress_latin`),
  FULLTEXT KEY `postalCode_latin` (`postalCode_latin`),
  FULLTEXT KEY `cityArea_latin` (`cityArea_latin`),
  FULLTEXT KEY `sortingCode_latin` (`sortingCode_latin`),
  FULLTEXT KEY `search` (`search`),
  CONSTRAINT `codeholders_address_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_address_ibfk_2` FOREIGN KEY (`country`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_address`
--

LOCK TABLES `codeholders_address` WRITE;
/*!40000 ALTER TABLE `codeholders_address` DISABLE KEYS */;
INSERT INTO `codeholders_address` VALUES (2,'us','NY','New York','Brooklyn','Brooklyn',NULL,NULL,'1 Union St.','1 Union St.','11231','11231',NULL,NULL,'1 Union Street\r\nBrooklyn 11231\r\nNew York\r\nUSONO'),(3,'nl',NULL,NULL,'Rotterdam','Rotterdam',NULL,NULL,'Nieuwe Binnenweg 176','Nieuwe Binnenweg 176','3015BJ','3015BJ',NULL,NULL,'Nieuwe Binnenweg 176, 3015BJ Rotterdam, Nederlando');
/*!40000 ALTER TABLE `codeholders_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_files`
--

DROP TABLE IF EXISTS `codeholders_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_files` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `time` bigint(20) unsigned NOT NULL,
  `codeholderId` int(10) unsigned NOT NULL,
  `addedBy` int(10) unsigned DEFAULT NULL,
  `name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `codeholderId` (`codeholderId`),
  KEY `addedBy` (`addedBy`),
  KEY `time` (`time`),
  FULLTEXT KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  CONSTRAINT `codeholders_files_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_files_ibfk_2` FOREIGN KEY (`addedBy`) REFERENCES `codeholders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_files`
--

LOCK TABLES `codeholders_files` WRITE;
/*!40000 ALTER TABLE `codeholders_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_address`
--

DROP TABLE IF EXISTS `codeholders_hist_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_address` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(20) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `country` char(2) CHARACTER SET ascii NOT NULL,
  `countryArea` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryArea_latin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_latin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress_latin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode_latin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`),
  KEY `country` (`country`),
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `countryArea` (`countryArea`),
  FULLTEXT KEY `city` (`city`),
  FULLTEXT KEY `streetAddress` (`streetAddress`),
  FULLTEXT KEY `postalCode` (`postalCode`),
  FULLTEXT KEY `countryArea_latin` (`countryArea_latin`),
  FULLTEXT KEY `city_latin` (`city_latin`),
  FULLTEXT KEY `streetAddress_latin` (`streetAddress_latin`),
  FULLTEXT KEY `postalCode_latin` (`postalCode_latin`),
  CONSTRAINT `codeholders_hist_address_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_hist_address_ibfk_2` FOREIGN KEY (`country`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_address`
--

LOCK TABLES `codeholders_hist_address` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_address` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_email`
--

DROP TABLE IF EXISTS `codeholders_hist_email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_email` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `email` (`email`) USING BTREE,
  FULLTEXT KEY `email_2` (`email`),
  CONSTRAINT `codeholders_hist_email_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_email`
--

LOCK TABLES `codeholders_hist_email` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_email` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_email` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_enabled`
--

DROP TABLE IF EXISTS `codeholders_hist_enabled`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_enabled` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `enabled` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `enabled` (`enabled`),
  CONSTRAINT `codeholders_hist_enabled_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_enabled`
--

LOCK TABLES `codeholders_hist_enabled` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_enabled` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_enabled` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_feeCountry`
--

DROP TABLE IF EXISTS `codeholders_hist_feeCountry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_feeCountry` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `feeCountry` char(2) CHARACTER SET ascii DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `feeCountry` (`feeCountry`),
  CONSTRAINT `codeholders_hist_feeCountry_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_hist_feeCountry_ibfk_2` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_feeCountry`
--

LOCK TABLES `codeholders_hist_feeCountry` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_feeCountry` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_feeCountry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_isDead`
--

DROP TABLE IF EXISTS `codeholders_hist_isDead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_isDead` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `isDead` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `isDead` (`isDead`),
  CONSTRAINT `codeholders_hist_isDead_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_isDead`
--

LOCK TABLES `codeholders_hist_isDead` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_isDead` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_isDead` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_newCode`
--

DROP TABLE IF EXISTS `codeholders_hist_newCode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_newCode` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `newCode` char(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `newCode` (`newCode`),
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_newCode_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_newCode`
--

LOCK TABLES `codeholders_hist_newCode` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_newCode` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_newCode` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_notes`
--

DROP TABLE IF EXISTS `codeholders_hist_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_notes` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_esperanto_ci,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `notes` (`notes`),
  CONSTRAINT `codeholders_hist_notes_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_notes`
--

LOCK TABLES `codeholders_hist_notes` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_officePhone`
--

DROP TABLE IF EXISTS `codeholders_hist_officePhone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_officePhone` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `officePhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `officePhone` (`officePhone`),
  CONSTRAINT `codeholders_hist_officePhone_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_officePhone`
--

LOCK TABLES `codeholders_hist_officePhone` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_officePhone` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_officePhone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_password`
--

DROP TABLE IF EXISTS `codeholders_hist_password`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_password` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_password_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_password`
--

LOCK TABLES `codeholders_hist_password` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_password` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_password` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_hist_profilePicture`
--

DROP TABLE IF EXISTS `codeholders_hist_profilePicture`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_hist_profilePicture` (
  `modId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int(10) unsigned NOT NULL,
  `modTime` bigint(10) unsigned NOT NULL,
  `modBy` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text COLLATE utf8mb4_unicode_ci,
  `hasProfilePicture` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `hasProfilePicture` (`hasProfilePicture`) USING BTREE,
  CONSTRAINT `codeholders_hist_profilePicture_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_hist_profilePicture`
--

LOCK TABLES `codeholders_hist_profilePicture` WRITE;
/*!40000 ALTER TABLE `codeholders_hist_profilePicture` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_hist_profilePicture` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_human`
--

DROP TABLE IF EXISTS `codeholders_human`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_human` (
  `codeholderId` int(10) unsigned NOT NULL,
  `firstName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstNameLegal` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastNameLegal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `honorific` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_esperanto_ci DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `profession` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landlinePhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellphone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  KEY `birthdate` (`birthdate`),
  FULLTEXT KEY `firstName` (`firstName`),
  FULLTEXT KEY `firstNameLegal` (`firstNameLegal`),
  FULLTEXT KEY `lastName` (`lastName`),
  FULLTEXT KEY `lastNameLegal` (`lastNameLegal`),
  FULLTEXT KEY `name_any` (`firstName`,`firstNameLegal`,`lastName`,`lastNameLegal`),
  FULLTEXT KEY `landlinePhone` (`landlinePhone`),
  FULLTEXT KEY `cellphone` (`cellphone`),
  CONSTRAINT `codeholders_human_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_human`
--

LOCK TABLES `codeholders_human` WRITE;
/*!40000 ALTER TABLE `codeholders_human` DISABLE KEYS */;
INSERT INTO `codeholders_human` VALUES (2,NULL,'Test',NULL,'McTest','D-ro','1998-03-01',NULL,NULL,NULL);
/*!40000 ALTER TABLE `codeholders_human` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_notif_accounts`
--

DROP TABLE IF EXISTS `codeholders_notif_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_notif_accounts` (
  `codeholderId` int(10) unsigned NOT NULL,
  `telegram_chatId` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_deepLink` binary(16) DEFAULT NULL,
  `telegram_deepLink_time` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  UNIQUE KEY `telegram_deepLink` (`telegram_deepLink`),
  UNIQUE KEY `telegram_chatId` (`telegram_chatId`),
  KEY `telegram_deepLink_time` (`telegram_deepLink_time`),
  CONSTRAINT `codeholders_notif_accounts_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_notif_accounts`
--

LOCK TABLES `codeholders_notif_accounts` WRITE;
/*!40000 ALTER TABLE `codeholders_notif_accounts` DISABLE KEYS */;
INSERT INTO `codeholders_notif_accounts` VALUES (2,'172252715',NULL,NULL);
/*!40000 ALTER TABLE `codeholders_notif_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_notif_pref`
--

DROP TABLE IF EXISTS `codeholders_notif_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_notif_pref` (
  `codeholderId` int(11) unsigned NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pref` set('email','telegram') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`,`category`),
  CONSTRAINT `codeholders_notif_pref_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_notif_pref`
--

LOCK TABLES `codeholders_notif_pref` WRITE;
/*!40000 ALTER TABLE `codeholders_notif_pref` DISABLE KEYS */;
INSERT INTO `codeholders_notif_pref` VALUES (2,'account','telegram');
/*!40000 ALTER TABLE `codeholders_notif_pref` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_org`
--

DROP TABLE IF EXISTS `codeholders_org`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_org` (
  `codeholderId` int(10) unsigned NOT NULL,
  `fullName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullNameLocal` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `careOf` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nameAbbrev` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  FULLTEXT KEY `careOf` (`careOf`),
  FULLTEXT KEY `fullName` (`fullName`,`fullNameLocal`,`nameAbbrev`),
  CONSTRAINT `codeholders_org_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_org`
--

LOCK TABLES `codeholders_org` WRITE;
/*!40000 ALTER TABLE `codeholders_org` DISABLE KEYS */;
INSERT INTO `codeholders_org` VALUES (3,'Tutmonda Esperantista Junulara Organizo','Wereld Esperanto-Jongeren Organisatie',NULL,'TEJO');
/*!40000 ALTER TABLE `codeholders_org` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `codeholders_totp`
--

DROP TABLE IF EXISTS `codeholders_totp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `codeholders_totp` (
  `codeholderId` int(10) unsigned NOT NULL,
  `secret` tinyblob NOT NULL,
  `iv` binary(16) NOT NULL,
  PRIMARY KEY (`codeholderId`),
  CONSTRAINT `codeholders_totp_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_totp`
--

LOCK TABLES `codeholders_totp` WRITE;
/*!40000 ALTER TABLE `codeholders_totp` DISABLE KEYS */;
INSERT INTO `codeholders_totp` VALUES (2,_binary '�`��Q*f>2?�2	y�\��\�M\�?3L\�\�\�\�4',_binary '�\�}F(�y�P�#���y');
/*!40000 ALTER TABLE `codeholders_totp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries` (
  `code` char(2) CHARACTER SET ascii NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `name_eo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_esperanto_ci NOT NULL,
  `name_en` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_fr` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_es` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NOT NULL,
  `name_nl` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_pt` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_sk` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_slovak_ci NOT NULL,
  `name_zh` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_de` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_german2_ci NOT NULL,
  PRIMARY KEY (`code`),
  KEY `enabled` (`enabled`),
  FULLTEXT KEY `name` (`name_eo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES ('ad',1,'Andoro','Andorra','Andorre','Andorra','Andorra','Andorra','Andorra','安道尔','Andorra'),('ae',1,'Un. Arabaj Emirlandoj','United Arab Emirates','Émirats arabes unis','Emiratos Árabes Unidos','Verenigde Arabische Emiraten','Emirados Árabes Unidos','Spojené arabské emiráty','阿拉伯联合酋长国','Vereinigte Arabische Emirate'),('af',1,'Afganio','Afghanistan','Afghanistan','Afganistán','Afghanistan','Afeganistão','Afganistan','阿富汗','Afghanistan'),('ag',1,'Antigvo kaj Barbudo','Antigua & Barbuda','Antigua-et-Barbuda','Antigua y Barbuda','Antigua en Barbuda','Antígua e Barbuda','Antigua a Barbuda','安提瓜和巴布达','Antigua und Barbuda'),('ai',1,'Angvilo (Brit.)','Anguilla','Anguilla','Anguila','Anguilla','Anguilla','Anguilla','安圭拉','Anguilla'),('al',1,'Albanio','Albania','Albanie','Albania','Albanië','Albânia','Albánsko','阿尔巴尼亚','Albanien'),('am',1,'Armenio','Armenia','Arménie','Armenia','Armenië','Armênia','Arménsko','亚美尼亚','Armenien'),('ao',1,'Angolo','Angola','Angola','Angola','Angola','Angola','Angola','安哥拉','Angola'),('ar',1,'Argentino','Argentina','Argentine','Argentina','Argentinië','Argentina','Argentína','阿根廷','Argentinien'),('at',1,'Aŭstrio','Austria','Autriche','Austria','Oostenrijk','Áustria','Rakúsko','奥地利','Österreich'),('au',1,'Aŭstralio','Australia','Australie','Australia','Australië','Austrália','Austrália','澳大利亚','Australien'),('aw',1,'Arubo (NL)','Aruba','Aruba','Aruba','Aruba','Aruba','Aruba','阿鲁巴','Aruba'),('az',1,'Azerbajĝano','Azerbaijan','Azerbaïdjan','Azerbaiyán','Azerbeidzjan','Azerbaijão','Azerbajdžan','阿塞拜疆','Aserbaidschan'),('ba',1,'Bosnio-Hercegovino','Bosnia & Herzegovina','Bosnie-Herzégovine','Bosnia-Herzegovina','Bosnië en Herzegovina','Bósnia e Herzegovina','Bosna a Hercegovina','波斯尼亚和黑塞哥维那','Bosnien und Herzegowina'),('bb',1,'Barbado','Barbados','Barbade','Barbados','Barbados','Barbados','Barbados','巴巴多斯','Barbados'),('bd',1,'Bangladeŝo','Bangladesh','Bangladesh','Bangladés','Bangladesh','Bangladesh','Bangladéš','孟加拉国','Bangladesch'),('be',1,'Belgio','Belgium','Belgique','Bélgica','België','Bélgica','Belgicko','比利时','Belgien'),('bf',1,'Burkina-Faso','Burkina Faso','Burkina Faso','Burkina Faso','Burkina Faso','Burquina Faso','Burkina Faso','布基纳法索','Burkina Faso'),('bg',1,'Bulgario','Bulgaria','Bulgarie','Bulgaria','Bulgarije','Bulgária','Bulharsko','保加利亚','Bulgarien'),('bh',1,'Barejno','Bahrain','Bahreïn','Baréin','Bahrein','Bahrein','Bahrajn','巴林','Bahrain'),('bi',1,'Burundo','Burundi','Burundi','Burundi','Burundi','Burundi','Burundi','布隆迪','Burundi'),('bj',1,'Benino','Benin','Bénin','Benín','Benin','Benin','Benin','贝宁','Benin'),('bm',1,'Bermudo','Bermuda','Bermudes','Bermudas','Bermuda','Bermudas','Bermudy','百慕大','Bermuda'),('bn',1,'Brunejo','Brunei','Brunéi Darussalam','Brunéi','Brunei','Brunei','Brunej','文莱','Brunei Darussalam'),('bo',1,'Bolivio','Bolivia','Bolivie','Bolivia','Bolivia','Bolívia','Bolívia','玻利维亚','Bolivien'),('br',1,'Brazilo','Brazil','Brésil','Brasil','Brazilië','Brasil','Brazília','巴西','Brasilien'),('bs',1,'Bahamoj','Bahamas','Bahamas','Bahamas','Bahama’s','Bahamas','Bahamy','巴哈马','Bahamas'),('bt',1,'Butano','Bhutan','Bhoutan','Bután','Bhutan','Butão','Bhután','不丹','Bhutan'),('bw',1,'Bocvano','Botswana','Botswana','Botsuana','Botswana','Botsuana','Botswana','博茨瓦纳','Botsuana'),('by',1,'Belarusio','Belarus','Biélorussie','Bielorrusia','Belarus','Bielorrússia','Bielorusko','白俄罗斯','Belarus'),('bz',1,'Belizo','Belize','Belize','Belice','Belize','Belize','Belize','伯利兹','Belize'),('ca',1,'Kanado','Canada','Canada','Canadá','Canada','Canadá','Kanada','加拿大','Kanada'),('cd',1,'Kongo, DR','Congo - Kinshasa','Congo-Kinshasa','República Democrática del Congo','Congo-Kinshasa','Congo - Kinshasa','Konžská demokratická republika','刚果（金）','Kongo-Kinshasa'),('cf',1,'Centr-Afrika Resp.','Central African Republic','République centrafricaine','República Centroafricana','Centraal-Afrikaanse Republiek','República Centro-Africana','Stredoafrická republika','中非共和国','Zentralafrikanische Republik'),('cg',1,'Kongo, PR','Congo - Brazzaville','Congo-Brazzaville','República del Congo','Congo-Brazzaville','Congo - Brazzaville','Konžská republika','刚果（布）','Kongo-Brazzaville'),('ch',1,'Svislando','Switzerland','Suisse','Suiza','Zwitserland','Suíça','Švajčiarsko','瑞士','Schweiz'),('ci',1,'Ebur-Bordo','Côte d’Ivoire','Côte d’Ivoire','Côte d’Ivoire','Ivoorkust','Costa do Marfim','Pobrežie Slonoviny','科特迪瓦','Côte d’Ivoire'),('ck',1,'Kukinsuloj','Cook Islands','Îles Cook','Islas Cook','Cookeilanden','Ilhas Cook','Cookove ostrovy','库克群岛','Cookinseln'),('cl',1,'Ĉilio','Chile','Chili','Chile','Chili','Chile','Čile','智利','Chile'),('cm',1,'Kameruno','Cameroon','Cameroun','Camerún','Kameroen','República dos Camarões','Kamerun','喀麦隆','Kamerun'),('cn',1,'Ĉinio','China','Chine','China','China','China','Čína','中国','China'),('co',1,'Kolombio','Colombia','Colombie','Colombia','Colombia','Colômbia','Kolumbia','哥伦比亚','Kolumbien'),('cr',1,'Kostariko','Costa Rica','Costa Rica','Costa Rica','Costa Rica','Costa Rica','Kostarika','哥斯达黎加','Costa Rica'),('cu',1,'Kubo','Cuba','Cuba','Cuba','Cuba','Cuba','Kuba','古巴','Kuba'),('cv',1,'Kaboverdo','Cape Verde','Cap-Vert','Cabo Verde','Kaapverdië','Cabo Verde','Kapverdy','佛得角','Cabo Verde'),('cw',1,'Kuracao (NL)','Curaçao','Curaçao','Curazao','Curaçao','Curaçao','Curaçao','库拉索','Curaçao'),('cy',1,'Kipro','Cyprus','Chypre','Chipre','Cyprus','Chipre','Cyprus','塞浦路斯','Zypern'),('cz',1,'Ĉeĥio','Czechia','Tchéquie','Chequia','Tsjechische Republiek','Tchéquia','Česko','捷克','Tschechien'),('de',1,'Germanio','Germany','Allemagne','Alemania','Duitsland','Alemanha','Nemecko','德国','Deutschland'),('dj',1,'Ĝibutio','Djibouti','Djibouti','Yibuti','Djibouti','Djibuti','Džibutsko','吉布提','Dschibuti'),('dk',1,'Danio','Denmark','Danemark','Dinamarca','Denemarken','Dinamarca','Dánsko','丹麦','Dänemark'),('dm',1,'Dominiko','Dominica','Dominique','Dominica','Dominica','Dominica','Dominika','多米尼克','Dominica'),('do',1,'Dominika Resp.','Dominican Republic','République dominicaine','República Dominicana','Dominicaanse Republiek','República Dominicana','Dominikánska republika','多米尼加共和国','Dominikanische Republik'),('dz',1,'Alĝerio','Algeria','Algérie','Argelia','Algerije','Argélia','Alžírsko','阿尔及利亚','Algerien'),('ec',1,'Ekvadoro','Ecuador','Équateur','Ecuador','Ecuador','Equador','Ekvádor','厄瓜多尔','Ecuador'),('ee',1,'Estonio','Estonia','Estonie','Estonia','Estland','Estônia','Estónsko','爱沙尼亚','Estland'),('eg',1,'Egiptio','Egypt','Égypte','Egipto','Egypte','Egito','Egypt','埃及','Ägypten'),('er',1,'Eritreo','Eritrea','Érythrée','Eritrea','Eritrea','Eritreia','Eritrea','厄立特里亚','Eritrea'),('es',1,'Hispanio','Spain','Espagne','España','Spanje','Espanha','Španielsko','西班牙','Spanien'),('et',1,'Etiopio','Ethiopia','Éthiopie','Etiopía','Ethiopië','Etiópia','Etiópia','埃塞俄比亚','Äthiopien'),('fi',1,'Finnlando','Finland','Finlande','Finlandia','Finland','Finlândia','Fínsko','芬兰','Finnland'),('fj',1,'Fiĝioj','Fiji','Fidji','Fiyi','Fiji','Fiji','Fidži','斐济','Fidschi'),('fm',1,'Mikronezio','Micronesia','États fédérés de Micronésie','Micronesia','Micronesia','Micronésia','Mikronézia','密克罗尼西亚','Mikronesien'),('fr',1,'Francio','France','France','Francia','Frankrijk','França','Francúzsko','法国','Frankreich'),('ga',1,'Gabono','Gabon','Gabon','Gabón','Gabon','Gabão','Gabon','加蓬','Gabun'),('gb',1,'Britio','United Kingdom','Royaume-Uni','Reino Unido','Verenigd Koninkrijk','Reino Unido','Spojené kráľovstvo','英国','Vereinigtes Königreich'),('gd',1,'Grenado','Grenada','Grenade','Granada','Grenada','Granada','Grenada','格林纳达','Grenada'),('ge',1,'Kartvelio','Georgia','Géorgie','Georgia','Georgië','Geórgia','Gruzínsko','格鲁吉亚','Georgien'),('gh',1,'Ganao','Ghana','Ghana','Ghana','Ghana','Gana','Ghana','加纳','Ghana'),('gi',1,'Ĝibraltaro (Brit.)','Gibraltar','Gibraltar','Gibraltar','Gibraltar','Gibraltar','Gibraltár','直布罗陀','Gibraltar'),('gl',1,'Gronlando (Dan.)','Greenland','Groenland','Groenlandia','Groenland','Groenlândia','Grónsko','格陵兰','Grönland'),('gm',1,'Gambio','Gambia','Gambie','Gambia','Gambia','Gâmbia','Gambia','冈比亚','Gambia'),('gn',1,'Gvineo','Guinea','Guinée','Guinea','Guinee','Guiné','Guinea','几内亚','Guinea'),('gp',1,'Gvadelupo','Guadeloupe','Guadeloupe','Guadalupe','Guadeloupe','Guadalupe','Guadeloupe','瓜德罗普','Guadeloupe'),('gq',1,'Ekvatora Gvineo','Equatorial Guinea','Guinée équatoriale','Guinea Ecuatorial','Equatoriaal-Guinea','Guiné Equatorial','Rovníková Guinea','赤道几内亚','Äquatorialguinea'),('gr',1,'Grekio','Greece','Grèce','Grecia','Griekenland','Grécia','Grécko','希腊','Griechenland'),('gt',1,'Gvatemalo','Guatemala','Guatemala','Guatemala','Guatemala','Guatemala','Guatemala','危地马拉','Guatemala'),('gw',1,'Gvineo-Bisaŭo','Guinea-Bissau','Guinée-Bissau','Guinea-Bisáu','Guinee-Bissau','Guiné-Bissau','Guinea-Bissau','几内亚比绍','Guinea-Bissau'),('gy',1,'Gvajano','Guyana','Guyana','Guyana','Guyana','Guiana','Guayana','圭亚那','Guyana'),('hk',1,'Honkongo (Ĉin.)','Hong Kong SAR China','R.A.S. chinoise de Hong Kong','RAE de Hong Kong (China)','Hongkong SAR van China','Hong Kong, RAE da China','Hongkong – OAO Číny','中国香港特别行政区','Sonderverwaltungszone Hongkong'),('hn',1,'Honduro','Honduras','Honduras','Honduras','Honduras','Honduras','Honduras','洪都拉斯','Honduras'),('hr',1,'Kroatio','Croatia','Croatie','Croacia','Kroatië','Croácia','Chorvátsko','克罗地亚','Kroatien'),('ht',1,'Haitio','Haiti','Haïti','Haití','Haïti','Haiti','Haiti','海地','Haiti'),('hu',1,'Hungario','Hungary','Hongrie','Hungría','Hongarije','Hungria','Maďarsko','匈牙利','Ungarn'),('id',1,'Indonezio','Indonesia','Indonésie','Indonesia','Indonesië','Indonésia','Indonézia','印度尼西亚','Indonesien'),('ie',1,'Irlando','Ireland','Irlande','Irlanda','Ierland','Irlanda','Írsko','爱尔兰','Irland'),('il',1,'Israelo','Israel','Israël','Israel','Israël','Israel','Izrael','以色列','Israel'),('in',1,'Hinda Unio (Barato)','India','Inde','India','India','Índia','India','印度','Indien'),('iq',1,'Irako','Iraq','Irak','Irak','Irak','Iraque','Irak','伊拉克','Irak'),('ir',1,'Irano','Iran','Iran','Irán','Iran','Irã','Irán','伊朗','Iran'),('is',1,'Islando','Iceland','Islande','Islandia','IJsland','Islândia','Island','冰岛','Island'),('it',1,'Italio','Italy','Italie','Italia','Italië','Itália','Taliansko','意大利','Italien'),('jm',1,'Jamajko','Jamaica','Jamaïque','Jamaica','Jamaica','Jamaica','Jamajka','牙买加','Jamaika'),('jo',1,'Jordanio','Jordan','Jordanie','Jordania','Jordanië','Jordânia','Jordánsko','约旦','Jordanien'),('jp',1,'Japanio','Japan','Japon','Japón','Japan','Japão','Japonsko','日本','Japan'),('ke',1,'Kenjo','Kenya','Kenya','Kenia','Kenia','Quênia','Keňa','肯尼亚','Kenia'),('kg',1,'Kirgizio','Kyrgyzstan','Kirghizistan','Kirguistán','Kirgizië','Quirguistão','Kirgizsko','吉尔吉斯斯坦','Kirgisistan'),('kh',1,'Kamboĝo','Cambodia','Cambodge','Camboya','Cambodja','Camboja','Kambodža','柬埔寨','Kambodscha'),('ki',1,'Kiribato','Kiribati','Kiribati','Kiribati','Kiribati','Quiribati','Kiribati','基里巴斯','Kiribati'),('km',1,'Komoroj','Comoros','Comores','Comoras','Comoren','Comores','Komory','科摩罗','Komoren'),('kn',1,'Sankta Kristoforo kaj Neviso','St. Kitts & Nevis','Saint-Christophe-et-Niévès','San Cristóbal y Nieves','Saint Kitts en Nevis','São Cristóvão e Nevis','Svätý Krištof a Nevis','圣基茨和尼维斯','St. Kitts und Nevis'),('kp',1,'Korea Popola DR','North Korea','Corée du Nord','Corea del Norte','Noord-Korea','Coreia do Norte','Severná Kórea','朝鲜','Nordkorea'),('kr',1,'Korea Resp.','South Korea','Corée du Sud','Corea del Sur','Zuid-Korea','Coreia do Sul','Južná Kórea','韩国','Südkorea'),('kw',1,'Kuvajto','Kuwait','Koweït','Kuwait','Koeweit','Kuwait','Kuvajt','科威特','Kuwait'),('ky',1,'Kajmana Insularo (Brit.)','Cayman Islands','Îles Caïmans','Islas Caimán','Kaaimaneilanden','Ilhas Cayman','Kajmanie ostrovy','开曼群岛','Kaimaninseln'),('kz',1,'Kazaĥio','Kazakhstan','Kazakhstan','Kazajistán','Kazachstan','Cazaquistão','Kazachstan','哈萨克斯坦','Kasachstan'),('la',1,'Laoso','Laos','Laos','Laos','Laos','Laos','Laos','老挝','Laos'),('lb',1,'Libano','Lebanon','Liban','Líbano','Libanon','Líbano','Libanon','黎巴嫩','Libanon'),('lc',1,'Sankta Lucio','St. Lucia','Sainte-Lucie','Santa Lucía','Saint Lucia','Santa Lúcia','Svätá Lucia','圣卢西亚','St. Lucia'),('li',1,'Liĥtenŝtejno','Liechtenstein','Liechtenstein','Liechtenstein','Liechtenstein','Liechtenstein','Lichtenštajnsko','列支敦士登','Liechtenstein'),('lk',1,'Srilanko','Sri Lanka','Sri Lanka','Sri Lanka','Sri Lanka','Sri Lanka','Srí Lanka','斯里兰卡','Sri Lanka'),('lr',1,'Liberio','Liberia','Libéria','Liberia','Liberia','Libéria','Libéria','利比里亚','Liberia'),('ls',1,'Lesoto','Lesotho','Lesotho','Lesoto','Lesotho','Lesoto','Lesotho','莱索托','Lesotho'),('lt',1,'Litovio','Lithuania','Lituanie','Lituania','Litouwen','Lituânia','Litva','立陶宛','Litauen'),('lu',1,'Luksemburgo','Luxembourg','Luxembourg','Luxemburgo','Luxemburg','Luxemburgo','Luxembursko','卢森堡','Luxemburg'),('lv',1,'Latvio','Latvia','Lettonie','Letonia','Letland','Letônia','Lotyšsko','拉脱维亚','Lettland'),('ly',1,'Libio','Libya','Libye','Libia','Libië','Líbia','Líbya','利比亚','Libyen'),('ma',1,'Maroko','Morocco','Maroc','Marruecos','Marokko','Marrocos','Maroko','摩洛哥','Marokko'),('mc',1,'Monako','Monaco','Monaco','Mónaco','Monaco','Mônaco','Monako','摩纳哥','Monaco'),('md',1,'Moldavio','Moldova','Moldavie','Moldavia','Moldavië','Moldávia','Moldavsko','摩尔多瓦','Republik Moldau'),('me',1,'Montenegro','Montenegro','Monténégro','Montenegro','Montenegro','Montenegro','Čierna Hora','黑山','Montenegro'),('mg',1,'Madagaskaro','Madagascar','Madagascar','Madagascar','Madagaskar','Madagascar','Madagaskar','马达加斯加','Madagaskar'),('mh',1,'Marŝaloj','Marshall Islands','Îles Marshall','Islas Marshall','Marshalleilanden','Ilhas Marshall','Marshallove ostrovy','马绍尔群岛','Marshallinseln'),('mk',1,'Nord-Makedonio','North Macedonia','Macédoine du Nord','Macedonia del Norte','Noord-Macedonië','Macedônia do Norte','Severné Macedónsko','北馬其頓','Nordmazedonien'),('ml',1,'Malio','Mali','Mali','Mali','Mali','Mali','Mali','马里','Mali'),('mm',1,'Birmo','Myanmar (Burma)','Myanmar (Birmanie)','Myanmar (Birmania)','Myanmar (Birma)','Mianmar (Birmânia)','Mjanmarsko','缅甸','Myanmar'),('mn',1,'Mongolio','Mongolia','Mongolie','Mongolia','Mongolië','Mongólia','Mongolsko','蒙古','Mongolei'),('mo',1,'Makao (Ĉin.)','Macau SAR China','R.A.S. chinoise de Macao','RAE de Macao (China)','Macau SAR van China','Macau, RAE da China','Macao – OAO Číny','中国澳门特别行政区','Sonderverwaltungsregion Macau'),('mq',1,'Martiniko','Martinique','Martinique','Martinica','Martinique','Martinica','Martinik','马提尼克','Martinique'),('mr',1,'Maŭritanio','Mauritania','Mauritanie','Mauritania','Mauritanië','Mauritânia','Mauritánia','毛里塔尼亚','Mauretanien'),('ms',1,'Moncerato (Brit.)','Montserrat','Montserrat','Montserrat','Montserrat','Montserrat','Montserrat','蒙特塞拉特','Montserrat'),('mt',1,'Malto','Malta','Malte','Malta','Malta','Malta','Malta','马耳他','Malta'),('mu',1,'Maŭricio','Mauritius','Maurice','Mauricio','Mauritius','Maurício','Maurícius','毛里求斯','Mauritius'),('mv',1,'Maldivoj','Maldives','Maldives','Maldivas','Maldiven','Maldivas','Maldivy','马尔代夫','Malediven'),('mw',1,'Malavio','Malawi','Malawi','Malaui','Malawi','Malawi','Malawi','马拉维','Malawi'),('mx',1,'Meksiko','Mexico','Mexique','México','Mexico','México','Mexiko','墨西哥','Mexiko'),('my',1,'Malajzio','Malaysia','Malaisie','Malasia','Maleisië','Malásia','Malajzia','马来西亚','Malaysia'),('mz',1,'Mozambiko','Mozambique','Mozambique','Mozambique','Mozambique','Moçambique','Mozambik','莫桑比克','Mosambik'),('na',1,'Namibio','Namibia','Namibie','Namibia','Namibië','Namíbia','Namíbia','纳米比亚','Namibia'),('nc',1,'Nov-Kaledonio (Fr.)','New Caledonia','Nouvelle-Calédonie','Nueva Caledonia','Nieuw-Caledonië','Nova Caledônia','Nová Kaledónia','新喀里多尼亚','Neukaledonien'),('ne',1,'Niĝero','Niger','Niger','Níger','Niger','Níger','Niger','尼日尔','Niger'),('ng',1,'Niĝerio','Nigeria','Nigéria','Nigeria','Nigeria','Nigéria','Nigéria','尼日利亚','Nigeria'),('ni',1,'Nikaragvo','Nicaragua','Nicaragua','Nicaragua','Nicaragua','Nicarágua','Nikaragua','尼加拉瓜','Nicaragua'),('nl',1,'Nederlando','Netherlands','Pays-Bas','Países Bajos','Nederland','Holanda','Holandsko','荷兰','Niederlande'),('no',1,'Norvegio','Norway','Norvège','Noruega','Noorwegen','Noruega','Nórsko','挪威','Norwegen'),('np',1,'Nepalo','Nepal','Népal','Nepal','Nepal','Nepal','Nepál','尼泊尔','Nepal'),('nr',1,'Nauro','Nauru','Nauru','Nauru','Nauru','Nauru','Nauru','瑙鲁','Nauru'),('nz',1,'Nov-Zelando','New Zealand','Nouvelle-Zélande','Nueva Zelanda','Nieuw-Zeeland','Nova Zelândia','Nový Zéland','新西兰','Neuseeland'),('om',1,'Omano','Oman','Oman','Omán','Oman','Omã','Omán','阿曼','Oman'),('pa',1,'Panamo','Panama','Panama','Panamá','Panama','Panamá','Panama','巴拿马','Panama'),('pe',1,'Peruo','Peru','Pérou','Perú','Peru','Peru','Peru','秘鲁','Peru'),('pf',1,'Franca Polinezio (Fr.)','French Polynesia','Polynésie française','Polinesia Francesa','Frans-Polynesië','Polinésia Francesa','Francúzska Polynézia','法属波利尼西亚','Französisch-Polynesien'),('pg',1,'Papuo-Nov-Gvineo','Papua New Guinea','Papouasie-Nouvelle-Guinée','Papúa Nueva Guinea','Papoea-Nieuw-Guinea','Papua-Nova Guiné','Papua Nová Guinea','巴布亚新几内亚','Papua-Neuguinea'),('ph',1,'Filipinoj','Philippines','Philippines','Filipinas','Filipijnen','Filipinas','Filipíny','菲律宾','Philippinen'),('pk',1,'Pakistano','Pakistan','Pakistan','Pakistán','Pakistan','Paquistão','Pakistan','巴基斯坦','Pakistan'),('pl',1,'Pollando','Poland','Pologne','Polonia','Polen','Polônia','Poľsko','波兰','Polen'),('pr',1,'Portoriko','Puerto Rico','Porto Rico','Puerto Rico','Puerto Rico','Porto Rico','Portoriko','波多黎各','Puerto Rico'),('ps',1,'Palestino','Palestinian Territories','Territoires palestiniens','Territorios Palestinos','Palestijnse gebieden','Territórios palestinos','Palestínske územia','巴勒斯坦领土','Palästinensische Autonomiegebiete'),('pt',1,'Portugalio','Portugal','Portugal','Portugal','Portugal','Portugal','Portugalsko','葡萄牙','Portugal'),('pw',1,'Palaŭo','Palau','Palaos','Palaos','Palau','Palau','Palau','帕劳','Palau'),('py',1,'Paragvajo','Paraguay','Paraguay','Paraguay','Paraguay','Paraguai','Paraguaj','巴拉圭','Paraguay'),('qa',1,'Kataro','Qatar','Qatar','Catar','Qatar','Catar','Katar','卡塔尔','Katar'),('re',1,'Reunio (Fr.)','Réunion','La Réunion','Reunión','Réunion','Reunião','Réunion','留尼汪','Réunion'),('ro',1,'Rumanio','Romania','Roumanie','Rumanía','Roemenië','Romênia','Rumunsko','罗马尼亚','Rumänien'),('rs',1,'Serbio','Serbia','Serbie','Serbia','Servië','Sérvia','Srbsko','塞尔维亚','Serbien'),('ru',1,'Rusio','Russia','Russie','Rusia','Rusland','Rússia','Rusko','俄罗斯','Russland'),('rw',1,'Ruando','Rwanda','Rwanda','Ruanda','Rwanda','Ruanda','Rwanda','卢旺达','Ruanda'),('sa',1,'Sauda Arabio','Saudi Arabia','Arabie saoudite','Arabia Saudí','Saoedi-Arabië','Arábia Saudita','Saudská Arábia','沙特阿拉伯','Saudi-Arabien'),('sb',1,'Salomonoj','Solomon Islands','Îles Salomon','Islas Salomón','Salomonseilanden','Ilhas Salomão','Šalamúnove ostrovy','所罗门群岛','Salomonen'),('sc',1,'Sejŝeloj','Seychelles','Seychelles','Seychelles','Seychellen','Seicheles','Seychely','塞舌尔','Seychellen'),('sd',1,'Sudano','Sudan','Soudan','Sudán','Soedan','Sudão','Sudán','苏丹','Sudan'),('se',1,'Svedio','Sweden','Suède','Suecia','Zweden','Suécia','Švédsko','瑞典','Schweden'),('sg',1,'Singapuro','Singapore','Singapour','Singapur','Singapore','Cingapura','Singapur','新加坡','Singapur'),('si',1,'Slovenio','Slovenia','Slovénie','Eslovenia','Slovenië','Eslovênia','Slovinsko','斯洛文尼亚','Slowenien'),('sk',1,'Slovakio','Slovakia','Slovaquie','Eslovaquia','Slowakije','Eslováquia','Slovensko','斯洛伐克','Slowakei'),('sl',1,'Sieraleono','Sierra Leone','Sierra Leone','Sierra Leona','Sierra Leone','Serra Leoa','Sierra Leone','塞拉利昂','Sierra Leone'),('sm',1,'San-Marino','San Marino','Saint-Marin','San Marino','San Marino','San Marino','San Maríno','圣马力诺','San Marino'),('sn',1,'Senegalo','Senegal','Sénégal','Senegal','Senegal','Senegal','Senegal','塞内加尔','Senegal'),('so',1,'Somalio','Somalia','Somalie','Somalia','Somalië','Somália','Somálsko','索马里','Somalia'),('sr',1,'Surinamo','Suriname','Suriname','Surinam','Suriname','Suriname','Surinam','苏里南','Suriname'),('ss',1,'Sud-Sudano','South Sudan','Soudan du Sud','Sudán del Sur','Zuid-Soedan','Sudão do Sul','Južný Sudán','南苏丹','Südsudan'),('st',1,'Santomeo kaj Principeo','São Tomé & Príncipe','Sao Tomé-et-Principe','Santo Tomé y Príncipe','Sao Tomé en Principe','São Tomé e Príncipe','Svätý Tomáš a Princov ostrov','圣多美和普林西比','São Tomé und Príncipe'),('sv',1,'Salvadoro','El Salvador','El Salvador','El Salvador','El Salvador','El Salvador','Salvádor','萨尔瓦多','El Salvador'),('sy',1,'Sirio','Syria','Syrie','Siria','Syrië','Síria','Sýria','叙利亚','Syrien'),('sz',1,'Svazilando','Swaziland','Swaziland','Suazilandia','Swaziland','Suazilândia','Svazijsko','斯威士兰','Swasiland'),('tc',1,'Turkoj kaj Kajkoj (Brit.)','Turks & Caicos Islands','Îles Turques-et-Caïques','Islas Turcas y Caicos','Turks- en Caicoseilanden','Ilhas Turks e Caicos','Turks a Caicos','特克斯和凯科斯群岛','Turks- und Caicosinseln'),('td',1,'Ĉado','Chad','Tchad','Chad','Tsjaad','Chade','Čad','乍得','Tschad'),('tg',1,'Togolando','Togo','Togo','Togo','Togo','Togo','Togo','多哥','Togo'),('th',1,'Tajlando','Thailand','Thaïlande','Tailandia','Thailand','Tailândia','Thajsko','泰国','Thailand'),('tj',1,'Taĝikio','Tajikistan','Tadjikistan','Tayikistán','Tadzjikistan','Tajiquistão','Tadžikistan','塔吉克斯坦','Tadschikistan'),('tl',1,'Orienta Timoro','Timor-Leste','Timor oriental','Timor-Leste','Oost-Timor','Timor-Leste','Východný Timor','东帝汶','Osttimor'),('tm',1,'Turkmenio','Turkmenistan','Turkménistan','Turkmenistán','Turkmenistan','Turcomenistão','Turkménsko','土库曼斯坦','Turkmenistan'),('tn',1,'Tunizio','Tunisia','Tunisie','Túnez','Tunesië','Tunísia','Tunisko','突尼斯','Tunesien'),('to',1,'Tongo','Tonga','Tonga','Tonga','Tonga','Tonga','Tonga','汤加','Tonga'),('tr',1,'Turkio','Turkey','Turquie','Turquía','Turkije','Turquia','Turecko','土耳其','Türkei'),('tt',1,'Trinidado kaj Tobago','Trinidad & Tobago','Trinité-et-Tobago','Trinidad y Tobago','Trinidad en Tobago','Trinidad e Tobago','Trinidad a Tobago','特立尼达和多巴哥','Trinidad und Tobago'),('tv',1,'Tuvalo','Tuvalu','Tuvalu','Tuvalu','Tuvalu','Tuvalu','Tuvalu','图瓦卢','Tuvalu'),('tw',1,'Tajvano','Taiwan','Taïwan','Taiwán','Taiwan','Taiwan','Taiwan','台湾','Taiwan'),('tz',1,'Tanzanio','Tanzania','Tanzanie','Tanzania','Tanzania','Tanzânia','Tanzánia','坦桑尼亚','Tansania'),('ua',1,'Ukrainio','Ukraine','Ukraine','Ucrania','Oekraïne','Ucrânia','Ukrajina','乌克兰','Ukraine'),('ug',1,'Ugando','Uganda','Ouganda','Uganda','Oeganda','Uganda','Uganda','乌干达','Uganda'),('us',1,'Usono','United States','États-Unis','Estados Unidos','Verenigde Staten','Estados Unidos','Spojené štáty','美国','Vereinigte Staaten'),('uy',1,'Urugvajo','Uruguay','Uruguay','Uruguay','Uruguay','Uruguai','Uruguaj','乌拉圭','Uruguay'),('uz',1,'Uzbekio','Uzbekistan','Ouzbékistan','Uzbekistán','Oezbekistan','Uzbequistão','Uzbekistan','乌兹别克斯坦','Usbekistan'),('va',1,'Vatikano','Vatican City','État de la Cité du Vatican','Ciudad del Vaticano','Vaticaanstad','Cidade do Vaticano','Vatikán','梵蒂冈','Vatikanstadt'),('vc',1,'Sankta Vincento kaj Grenadinoj','St. Vincent & Grenadines','Saint-Vincent-et-les-Grenadines','San Vicente y las Granadinas','Saint Vincent en de Grenadines','São Vicente e Granadinas','Svätý Vincent a Grenadíny','圣文森特和格林纳丁斯','St. Vincent und die Grenadinen'),('ve',1,'Venezuelo','Venezuela','Venezuela','Venezuela','Venezuela','Venezuela','Venezuela','委内瑞拉','Venezuela'),('vn',1,'Vjetnamio','Vietnam','Vietnam','Vietnam','Vietnam','Vietnã','Vietnam','越南','Vietnam'),('vu',1,'Vanuatuo','Vanuatu','Vanuatu','Vanuatu','Vanuatu','Vanuatu','Vanuatu','瓦努阿图','Vanuatu'),('ws',1,'Samoo','Samoa','Samoa','Samoa','Samoa','Samoa','Samoa','萨摩亚','Samoa'),('ye',1,'Jemeno','Yemen','Yémen','Yemen','Jemen','Iêmen','Jemen','也门','Jemen'),('za',1,'Sud-Afriko','South Africa','Afrique du Sud','Sudáfrica','Zuid-Afrika','África do Sul','Južná Afrika','南非','Südafrika'),('zm',1,'Zambio','Zambia','Zambie','Zambia','Zambia','Zâmbia','Zambia','赞比亚','Sambia'),('zw',1,'Zimbabvo','Zimbabwe','Zimbabwe','Zimbabue','Zimbabwe','Zimbábue','Zimbabwe','津巴布韦','Simbabwe');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries_groups`
--

DROP TABLE IF EXISTS `countries_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries_groups` (
  `code` char(3) CHARACTER SET ascii NOT NULL,
  `name` varchar(150) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (`code`),
  FULLTEXT KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries_groups`
--

LOCK TABLES `countries_groups` WRITE;
/*!40000 ALTER TABLE `countries_groups` DISABLE KEYS */;
INSERT INTO `countries_groups` VALUES ('x01','Landaro 1'),('x02','Landaro 2'),('x03','Landaro 3'),('x04','Landaro 4'),('x05','Landaro 5');
/*!40000 ALTER TABLE `countries_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries_groups_members`
--

DROP TABLE IF EXISTS `countries_groups_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries_groups_members` (
  `group_code` char(3) CHARACTER SET ascii NOT NULL,
  `country_code` char(2) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (`group_code`,`country_code`),
  KEY `country_code` (`country_code`),
  CONSTRAINT `countries_groups_members_ibfk_1` FOREIGN KEY (`group_code`) REFERENCES `countries_groups` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `countries_groups_members_ibfk_2` FOREIGN KEY (`country_code`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries_groups_members`
--

LOCK TABLES `countries_groups_members` WRITE;
/*!40000 ALTER TABLE `countries_groups_members` DISABLE KEYS */;
INSERT INTO `countries_groups_members` VALUES ('x05','ad'),('x05','ae'),('x01','af'),('x03','ag'),('x04','ai'),('x02','al'),('x02','am'),('x02','ao'),('x03','ar'),('x05','at'),('x05','au'),('x04','aw'),('x02','az'),('x02','ba'),('x04','bb'),('x01','bd'),('x05','be'),('x02','bf'),('x02','bg'),('x04','bh'),('x01','bi'),('x01','bj'),('x05','bm'),('x04','bn'),('x02','bo'),('x03','br'),('x04','bs'),('x02','bt'),('x02','bw'),('x02','by'),('x02','bz'),('x05','ca'),('x01','cd'),('x01','cf'),('x01','cg'),('x05','ch'),('x01','ci'),('x04','ck'),('x03','cl'),('x01','cm'),('x03','cn'),('x02','co'),('x03','cr'),('x02','cu'),('x02','cv'),('x04','cw'),('x04','cy'),('x04','cz'),('x05','de'),('x01','dj'),('x05','dk'),('x02','dm'),('x02','do'),('x02','dz'),('x02','ec'),('x04','ee'),('x02','eg'),('x01','er'),('x04','es'),('x01','et'),('x05','fi'),('x02','fj'),('x02','fm'),('x05','fr'),('x02','ga'),('x05','gb'),('x03','gd'),('x02','ge'),('x01','gh'),('x05','gi'),('x05','gl'),('x01','gm'),('x01','gn'),('x04','gp'),('x03','gq'),('x04','gr'),('x02','gt'),('x01','gw'),('x02','gy'),('x05','hk'),('x02','hn'),('x03','hr'),('x01','ht'),('x03','hu'),('x02','id'),('x05','ie'),('x05','il'),('x01','in'),('x02','iq'),('x02','ir'),('x05','is'),('x05','it'),('x02','jm'),('x02','jo'),('x05','jp'),('x02','ke'),('x01','kg'),('x01','kh'),('x01','ki'),('x01','km'),('x04','kn'),('x01','kp'),('x04','kr'),('x04','kw'),('x05','ky'),('x02','kz'),('x02','la'),('x03','lb'),('x03','lc'),('x05','li'),('x02','lk'),('x01','lr'),('x01','ls'),('x03','lt'),('x05','lu'),('x03','lv'),('x02','ly'),('x02','ma'),('x05','mc'),('x01','md'),('x02','me'),('x01','mg'),('x02','mh'),('x02','mk'),('x01','ml'),('x01','mm'),('x02','mn'),('x05','mo'),('x04','mq'),('x01','mr'),('x03','ms'),('x04','mt'),('x03','mu'),('x03','mv'),('x01','mw'),('x03','mx'),('x03','my'),('x01','mz'),('x02','na'),('x05','nc'),('x01','ne'),('x01','ng'),('x01','ni'),('x05','nl'),('x05','no'),('x01','np'),('x03','nr'),('x05','nz'),('x03','om'),('x03','pa'),('x02','pe'),('x04','pf'),('x02','pg'),('x02','ph'),('x01','pk'),('x03','pl'),('x04','pr'),('x02','ps'),('x04','pt'),('x03','pw'),('x02','py'),('x05','qa'),('x04','re'),('x03','ro'),('x02','rs'),('x03','ru'),('x01','rw'),('x04','sa'),('x01','sb'),('x04','sc'),('x01','sd'),('x05','se'),('x04','sg'),('x04','si'),('x04','sk'),('x01','sl'),('x05','sm'),('x01','sn'),('x01','so'),('x02','sr'),('x01','ss'),('x01','st'),('x02','sv'),('x01','sy'),('x02','sz'),('x04','tc'),('x01','td'),('x01','tg'),('x02','th'),('x01','tj'),('x01','tl'),('x02','tm'),('x02','tn'),('x02','to'),('x03','tr'),('x04','tt'),('x02','tv'),('x04','tw'),('x01','tz'),('x01','ua'),('x01','ug'),('x05','us'),('x04','uy'),('x01','uz'),('x05','va'),('x02','vc'),('x03','ve'),('x01','vn'),('x02','vu'),('x02','ws'),('x01','ye'),('x02','za'),('x01','zm'),('x01','zw');
/*!40000 ALTER TABLE `countries_groups_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `httpLog`
--

DROP TABLE IF EXISTS `httpLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `httpLog` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `time` bigint(20) unsigned NOT NULL,
  `codeholderId` int(10) unsigned DEFAULT NULL,
  `apiKey` binary(16) DEFAULT NULL,
  `ip` binary(16) NOT NULL,
  `origin` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(300) COLLATE utf8mb4_unicode_ci NOT NULL,
  `query` json NOT NULL,
  `resStatus` smallint(6) NOT NULL,
  `resTime` decimal(9,3) NOT NULL,
  `resLocation` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `codeholderId` (`codeholderId`),
  KEY `apiKey` (`apiKey`),
  KEY `time` (`time`),
  KEY `ip` (`ip`),
  KEY `origin` (`origin`),
  KEY `path` (`path`),
  KEY `resStatus` (`resStatus`),
  KEY `method` (`method`),
  KEY `resTime` (`resTime`),
  FULLTEXT KEY `userAgent` (`userAgent`),
  CONSTRAINT `httpLog_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `httpLog_ibfk_2` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `httpLog`
--

LOCK TABLES `httpLog` WRITE;
/*!40000 ALTER TABLE `httpLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `httpLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `savedQueries`
--

DROP TABLE IF EXISTS `savedQueries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `savedQueries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `query` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `savedQueries`
--

LOCK TABLES `savedQueries` WRITE;
/*!40000 ALTER TABLE `savedQueries` DISABLE KEYS */;
/*!40000 ALTER TABLE `savedQueries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `view_codeholders`
--

DROP TABLE IF EXISTS `view_codeholders`;
/*!50001 DROP VIEW IF EXISTS `view_codeholders`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `view_codeholders` AS SELECT 
 1 AS `id`,
 1 AS `codeholderType`,
 1 AS `oldCode`,
 1 AS `newCode`,
 1 AS `password`,
 1 AS `email`,
 1 AS `enabled`,
 1 AS `feeCountry`,
 1 AS `address_country`,
 1 AS `address_countryArea`,
 1 AS `address_countryArea_latin`,
 1 AS `address_city`,
 1 AS `address_city_latin`,
 1 AS `address_cityArea`,
 1 AS `address_cityArea_latin`,
 1 AS `address_streetAddress`,
 1 AS `address_streetAddress_latin`,
 1 AS `address_postalCode`,
 1 AS `address_postalCode_latin`,
 1 AS `address_sortingCode`,
 1 AS `address_sortingCode_latin`,
 1 AS `address_search`,
 1 AS `notes`,
 1 AS `officePhone`,
 1 AS `isDead`,
 1 AS `deathdate`,
 1 AS `hasProfilePicture`,
 1 AS `firstName`,
 1 AS `firstNameLegal`,
 1 AS `lastName`,
 1 AS `lastNameLegal`,
 1 AS `honorific`,
 1 AS `birthdate`,
 1 AS `age`,
 1 AS `agePrimo`,
 1 AS `profession`,
 1 AS `landlinePhone`,
 1 AS `cellphone`,
 1 AS `fullName`,
 1 AS `fullNameLocal`,
 1 AS `careOf`,
 1 AS `nameAbbrev`*/;
SET character_set_client = @saved_cs_client;

--
-- Dumping events for database 'akso'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `remove_expired_codeholders_createPassword` */;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_expired_codeholders_createPassword` ON SCHEDULE EVERY 1 HOUR STARTS '2019-04-11 16:04:18' ON COMPLETION PRESERVE ENABLE DO begin

set @time_delta = 86400; # 1 day

update codeholders set createPasswordTime = null, createPasswordKey = null where createPasswordTime < UNIX_TIMESTAMP() - @time_delta;

end */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `remove_expired_codeholders_notif_accounts` */;;
DELIMITER ;;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;;
/*!50003 SET character_set_client  = utf8mb4 */ ;;
/*!50003 SET character_set_results = utf8mb4 */ ;;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;;
/*!50003 SET @saved_time_zone      = @@time_zone */ ;;
/*!50003 SET time_zone             = 'SYSTEM' */ ;;
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_expired_codeholders_notif_accounts` ON SCHEDULE EVERY 1 HOUR STARTS '2019-04-09 13:09:46' ON COMPLETION PRESERVE ENABLE COMMENT 'Removes expired codeholder notif account setup keys' DO begin

set @telegram_deepLink_time_delta = 3600; # 1 hour

update codeholders_notif_accounts set telegram_deepLink = null, telegram_deepLink_time = null where telegram_deepLink_time < UNIX_TIMESTAMP() - @telegram_deepLink_time_delta;

end */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Current Database: `akso`
--

USE `akso`;

--
-- Final view structure for view `view_codeholders`
--

/*!50001 DROP VIEW IF EXISTS `view_codeholders`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_codeholders` AS select `codeholders`.`id` AS `id`,`codeholders`.`codeholderType` AS `codeholderType`,`codeholders`.`oldCode` AS `oldCode`,`codeholders`.`newCode` AS `newCode`,`codeholders`.`password` AS `password`,`codeholders`.`email` AS `email`,`codeholders`.`enabled` AS `enabled`,`codeholders`.`feeCountry` AS `feeCountry`,`codeholders_address`.`country` AS `address_country`,`codeholders_address`.`countryArea` AS `address_countryArea`,`codeholders_address`.`countryArea_latin` AS `address_countryArea_latin`,`codeholders_address`.`city` AS `address_city`,`codeholders_address`.`city_latin` AS `address_city_latin`,`codeholders_address`.`cityArea` AS `address_cityArea`,`codeholders_address`.`cityArea_latin` AS `address_cityArea_latin`,`codeholders_address`.`streetAddress` AS `address_streetAddress`,`codeholders_address`.`streetAddress_latin` AS `address_streetAddress_latin`,`codeholders_address`.`postalCode` AS `address_postalCode`,`codeholders_address`.`postalCode_latin` AS `address_postalCode_latin`,`codeholders_address`.`sortingCode` AS `address_sortingCode`,`codeholders_address`.`sortingCode_latin` AS `address_sortingCode_latin`,`codeholders_address`.`search` AS `address_search`,`codeholders`.`notes` AS `notes`,`codeholders`.`officePhone` AS `officePhone`,`codeholders`.`isDead` AS `isDead`,`codeholders`.`deathdate` AS `deathdate`,`codeholders`.`hasProfilePicture` AS `hasProfilePicture`,`codeholders_human`.`firstName` AS `firstName`,`codeholders_human`.`firstNameLegal` AS `firstNameLegal`,`codeholders_human`.`lastName` AS `lastName`,`codeholders_human`.`lastNameLegal` AS `lastNameLegal`,`codeholders_human`.`honorific` AS `honorific`,`codeholders_human`.`birthdate` AS `birthdate`,if(`codeholders`.`isDead`,NULL,timestampdiff(YEAR,`codeholders_human`.`birthdate`,curdate())) AS `age`,if(`codeholders`.`isDead`,NULL,timestampdiff(YEAR,`codeholders_human`.`birthdate`,makedate(year(now()),1))) AS `agePrimo`,`codeholders_human`.`profession` AS `profession`,`codeholders_human`.`landlinePhone` AS `landlinePhone`,`codeholders_human`.`cellphone` AS `cellphone`,`codeholders_org`.`fullName` AS `fullName`,`codeholders_org`.`fullNameLocal` AS `fullNameLocal`,`codeholders_org`.`careOf` AS `careOf`,`codeholders_org`.`nameAbbrev` AS `nameAbbrev` from (((`codeholders` left join `codeholders_human` on((`codeholders`.`id` = `codeholders_human`.`codeholderId`))) left join `codeholders_org` on((`codeholders`.`id` = `codeholders_org`.`codeholderId`))) left join `codeholders_address` on((`codeholders`.`id` = `codeholders_address`.`codeholderId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-05-07 14:34:11
