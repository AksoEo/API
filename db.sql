-- MySQL dump 10.13  Distrib 5.7.25, for Linux (x86_64)
--
-- Host: localhost    Database: akso
-- ------------------------------------------------------
-- Server version	5.7.25-0ubuntu0.18.04.2

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

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `akso` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `akso`;

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
  `password` varbinary(255) DEFAULT NULL,
  `email` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `feeCountry` char(2) CHARACTER SET ascii DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_esperanto_ci,
  `officePhone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDead` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `newCode` (`newCode`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `oldCode` (`oldCode`) USING BTREE,
  KEY `feeCountry` (`feeCountry`),
  KEY `isDead` (`isDead`),
  KEY `enabled` (`enabled`),
  FULLTEXT KEY `email_2` (`email`),
  FULLTEXT KEY `notes` (`notes`),
  FULLTEXT KEY `officePhone` (`officePhone`),
  CONSTRAINT `codeholders_ibfk_1` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders`
--

LOCK TABLES `codeholders` WRITE;
/*!40000 ALTER TABLE `codeholders` DISABLE KEYS */;
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
  `streetAddress` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress_latin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode_latin` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  KEY `country` (`country`),
  FULLTEXT KEY `city_latin` (`city_latin`),
  FULLTEXT KEY `countryArea_latin` (`countryArea_latin`),
  FULLTEXT KEY `streetAddress_latin` (`streetAddress_latin`),
  FULLTEXT KEY `postalCode_latin` (`postalCode_latin`),
  CONSTRAINT `codeholders_address_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_address_ibfk_2` FOREIGN KEY (`country`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_address`
--

LOCK TABLES `codeholders_address` WRITE;
/*!40000 ALTER TABLE `codeholders_address` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_address` ENABLE KEYS */;
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
  PRIMARY KEY (`codeholderId`),
  KEY `birthdate` (`birthdate`),
  FULLTEXT KEY `firstName` (`firstName`),
  FULLTEXT KEY `firstNameLegal` (`firstNameLegal`),
  FULLTEXT KEY `lastName` (`lastName`),
  FULLTEXT KEY `lastNameLegal` (`lastNameLegal`),
  FULLTEXT KEY `name_any` (`firstName`,`firstNameLegal`,`lastName`,`lastNameLegal`),
  CONSTRAINT `codeholders_human_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codeholders_human`
--

LOCK TABLES `codeholders_human` WRITE;
/*!40000 ALTER TABLE `codeholders_human` DISABLE KEYS */;
/*!40000 ALTER TABLE `codeholders_human` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `countries` (
  `code` char(2) CHARACTER SET ascii NOT NULL,
  `currency` char(3) CHARACTER SET ascii NOT NULL DEFAULT 'EUR',
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
  FULLTEXT KEY `name` (`name_eo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES ('ad','EUR','Andoro','Andorra','Andorre','Andorra','Andorra','Andorra','Andorra','安道尔','Andorra'),('ae','EUR','Un. Arabaj Emirlandoj','United Arab Emirates','Émirats arabes unis','Emiratos Árabes Unidos','Verenigde Arabische Emiraten','Emirados Árabes Unidos','Spojené arabské emiráty','阿拉伯联合酋长国','Vereinigte Arabische Emirate'),('af','EUR','Afganio','Afghanistan','Afghanistan','Afganistán','Afghanistan','Afeganistão','Afganistan','阿富汗','Afghanistan'),('ag','EUR','Antigvo kaj Barbudo','Antigua & Barbuda','Antigua-et-Barbuda','Antigua y Barbuda','Antigua en Barbuda','Antígua e Barbuda','Antigua a Barbuda','安提瓜和巴布达','Antigua und Barbuda'),('ai','EUR','Angvilo (Brit.)','Anguilla','Anguilla','Anguila','Anguilla','Anguilla','Anguilla','安圭拉','Anguilla'),('al','EUR','Albanio','Albania','Albanie','Albania','Albanië','Albânia','Albánsko','阿尔巴尼亚','Albanien'),('am','EUR','Armenio','Armenia','Arménie','Armenia','Armenië','Armênia','Arménsko','亚美尼亚','Armenien'),('ao','EUR','Angolo','Angola','Angola','Angola','Angola','Angola','Angola','安哥拉','Angola'),('ar','EUR','Argentino','Argentina','Argentine','Argentina','Argentinië','Argentina','Argentína','阿根廷','Argentinien'),('at','EUR','Aŭstrio','Austria','Autriche','Austria','Oostenrijk','Áustria','Rakúsko','奥地利','Österreich'),('au','AUD','Aŭstralio','Australia','Australie','Australia','Australië','Austrália','Austrália','澳大利亚','Australien'),('aw','EUR','Arubo (NL)','Aruba','Aruba','Aruba','Aruba','Aruba','Aruba','阿鲁巴','Aruba'),('az','EUR','Azerbajĝano','Azerbaijan','Azerbaïdjan','Azerbaiyán','Azerbeidzjan','Azerbaijão','Azerbajdžan','阿塞拜疆','Aserbaidschan'),('ba','EUR','Bosnio-Hercegovino','Bosnia & Herzegovina','Bosnie-Herzégovine','Bosnia-Herzegovina','Bosnië en Herzegovina','Bósnia e Herzegovina','Bosna a Hercegovina','波斯尼亚和黑塞哥维那','Bosnien und Herzegowina'),('bb','EUR','Barbado','Barbados','Barbade','Barbados','Barbados','Barbados','Barbados','巴巴多斯','Barbados'),('bd','EUR','Bangladeŝo','Bangladesh','Bangladesh','Bangladés','Bangladesh','Bangladesh','Bangladéš','孟加拉国','Bangladesch'),('be','EUR','Belgio','Belgium','Belgique','Bélgica','België','Bélgica','Belgicko','比利时','Belgien'),('bf','EUR','Burkina-Faso','Burkina Faso','Burkina Faso','Burkina Faso','Burkina Faso','Burquina Faso','Burkina Faso','布基纳法索','Burkina Faso'),('bg','EUR','Bulgario','Bulgaria','Bulgarie','Bulgaria','Bulgarije','Bulgária','Bulharsko','保加利亚','Bulgarien'),('bh','EUR','Barejno','Bahrain','Bahreïn','Baréin','Bahrein','Bahrein','Bahrajn','巴林','Bahrain'),('bi','EUR','Burundo','Burundi','Burundi','Burundi','Burundi','Burundi','Burundi','布隆迪','Burundi'),('bj','EUR','Benino','Benin','Bénin','Benín','Benin','Benin','Benin','贝宁','Benin'),('bm','EUR','Bermudo','Bermuda','Bermudes','Bermudas','Bermuda','Bermudas','Bermudy','百慕大','Bermuda'),('bn','EUR','Brunejo','Brunei','Brunéi Darussalam','Brunéi','Brunei','Brunei','Brunej','文莱','Brunei Darussalam'),('bo','EUR','Bolivio','Bolivia','Bolivie','Bolivia','Bolivia','Bolívia','Bolívia','玻利维亚','Bolivien'),('br','EUR','Brazilo','Brazil','Brésil','Brasil','Brazilië','Brasil','Brazília','巴西','Brasilien'),('bs','EUR','Bahamoj','Bahamas','Bahamas','Bahamas','Bahama’s','Bahamas','Bahamy','巴哈马','Bahamas'),('bt','EUR','Butano','Bhutan','Bhoutan','Bután','Bhutan','Butão','Bhután','不丹','Bhutan'),('bw','EUR','Bocvano','Botswana','Botswana','Botsuana','Botswana','Botsuana','Botswana','博茨瓦纳','Botsuana'),('by','EUR','Belorusio','Belarus','Biélorussie','Bielorrusia','Belarus','Bielorrússia','Bielorusko','白俄罗斯','Belarus'),('bz','EUR','Belizo','Belize','Belize','Belice','Belize','Belize','Belize','伯利兹','Belize'),('ca','CAD','Kanado','Canada','Canada','Canadá','Canada','Canadá','Kanada','加拿大','Kanada'),('cd','EUR','Kongo, DR','Congo - Kinshasa','Congo-Kinshasa','República Democrática del Congo','Congo-Kinshasa','Congo - Kinshasa','Konžská demokratická republika','刚果（金）','Kongo-Kinshasa'),('cf','EUR','Centr-Afrika Resp.','Central African Republic','République centrafricaine','República Centroafricana','Centraal-Afrikaanse Republiek','República Centro-Africana','Stredoafrická republika','中非共和国','Zentralafrikanische Republik'),('cg','EUR','Kongo, PR','Congo - Brazzaville','Congo-Brazzaville','República del Congo','Congo-Brazzaville','Congo - Brazzaville','Konžská republika','刚果（布）','Kongo-Brazzaville'),('ch','CHF','Svislando','Switzerland','Suisse','Suiza','Zwitserland','Suíça','Švajčiarsko','瑞士','Schweiz'),('ci','EUR','Ebur-Bordo','Côte d’Ivoire','Côte d’Ivoire','Côte d’Ivoire','Ivoorkust','Costa do Marfim','Pobrežie Slonoviny','科特迪瓦','Côte d’Ivoire'),('ck','EUR','Kukinsuloj','Cook Islands','Îles Cook','Islas Cook','Cookeilanden','Ilhas Cook','Cookove ostrovy','库克群岛','Cookinseln'),('cl','EUR','Ĉilio','Chile','Chili','Chile','Chili','Chile','Čile','智利','Chile'),('cm','EUR','Kameruno','Cameroon','Cameroun','Camerún','Kameroen','República dos Camarões','Kamerun','喀麦隆','Kamerun'),('cn','EUR','Ĉinio','China','Chine','China','China','China','Čína','中国','China'),('co','EUR','Kolombio','Colombia','Colombie','Colombia','Colombia','Colômbia','Kolumbia','哥伦比亚','Kolumbien'),('cr','EUR','Kostariko','Costa Rica','Costa Rica','Costa Rica','Costa Rica','Costa Rica','Kostarika','哥斯达黎加','Costa Rica'),('cu','EUR','Kubo','Cuba','Cuba','Cuba','Cuba','Cuba','Kuba','古巴','Kuba'),('cv','EUR','Verdkabaj Insuloj','Cape Verde','Cap-Vert','Cabo Verde','Kaapverdië','Cabo Verde','Kapverdy','佛得角','Cabo Verde'),('cw','EUR','Kuracao (NL)','Curaçao','Curaçao','Curazao','Curaçao','Curaçao','Curaçao','库拉索','Curaçao'),('cy','EUR','Kipro','Cyprus','Chypre','Chipre','Cyprus','Chipre','Cyprus','塞浦路斯','Zypern'),('cz','EUR','Ĉeĥio','Czechia','Tchéquie','Chequia','Tsjechische Republiek','Tchéquia','Česko','捷克','Tschechien'),('de','EUR','Germanio','Germany','Allemagne','Alemania','Duitsland','Alemanha','Nemecko','德国','Deutschland'),('dj','EUR','Ĝibutio','Djibouti','Djibouti','Yibuti','Djibouti','Djibuti','Džibutsko','吉布提','Dschibuti'),('dk','DKK','Danio','Denmark','Danemark','Dinamarca','Denemarken','Dinamarca','Dánsko','丹麦','Dänemark'),('dm','EUR','Dominiko','Dominica','Dominique','Dominica','Dominica','Dominica','Dominika','多米尼克','Dominica'),('do','EUR','Dominika Resp.','Dominican Republic','République dominicaine','República Dominicana','Dominicaanse Republiek','República Dominicana','Dominikánska republika','多米尼加共和国','Dominikanische Republik'),('dz','EUR','Alĝerio','Algeria','Algérie','Argelia','Algerije','Argélia','Alžírsko','阿尔及利亚','Algerien'),('ec','EUR','Ekvadoro','Ecuador','Équateur','Ecuador','Ecuador','Equador','Ekvádor','厄瓜多尔','Ecuador'),('ee','EUR','Estonio','Estonia','Estonie','Estonia','Estland','Estônia','Estónsko','爱沙尼亚','Estland'),('eg','EUR','Egiptio','Egypt','Égypte','Egipto','Egypte','Egito','Egypt','埃及','Ägypten'),('er','EUR','Eritreo','Eritrea','Érythrée','Eritrea','Eritrea','Eritreia','Eritrea','厄立特里亚','Eritrea'),('es','EUR','Hispanio','Spain','Espagne','España','Spanje','Espanha','Španielsko','西班牙','Spanien'),('et','EUR','Etiopio','Ethiopia','Éthiopie','Etiopía','Ethiopië','Etiópia','Etiópia','埃塞俄比亚','Äthiopien'),('fi','EUR','Finnlando','Finland','Finlande','Finlandia','Finland','Finlândia','Fínsko','芬兰','Finnland'),('fj','EUR','Fiĝioj','Fiji','Fidji','Fiyi','Fiji','Fiji','Fidži','斐济','Fidschi'),('fm','EUR','Mikronezio','Micronesia','États fédérés de Micronésie','Micronesia','Micronesia','Micronésia','Mikronézia','密克罗尼西亚','Mikronesien'),('fr','EUR','Francio','France','France','Francia','Frankrijk','França','Francúzsko','法国','Frankreich'),('ga','EUR','Gabono','Gabon','Gabon','Gabón','Gabon','Gabão','Gabon','加蓬','Gabun'),('gb','GBP','Britio','United Kingdom','Royaume-Uni','Reino Unido','Verenigd Koninkrijk','Reino Unido','Spojené kráľovstvo','英国','Vereinigtes Königreich'),('gd','EUR','Grenado','Grenada','Grenade','Granada','Grenada','Granada','Grenada','格林纳达','Grenada'),('ge','EUR','Kartvelio','Georgia','Géorgie','Georgia','Georgië','Geórgia','Gruzínsko','格鲁吉亚','Georgien'),('gh','EUR','Ganao','Ghana','Ghana','Ghana','Ghana','Gana','Ghana','加纳','Ghana'),('gi','DKK','Ĝibraltaro (Brit.)','Gibraltar','Gibraltar','Gibraltar','Gibraltar','Gibraltar','Gibraltár','直布罗陀','Gibraltar'),('gl','DKK','Groenlando (Dan.)','Greenland','Groenland','Groenlandia','Groenland','Groenlândia','Grónsko','格陵兰','Grönland'),('gm','EUR','Gambio','Gambia','Gambie','Gambia','Gambia','Gâmbia','Gambia','冈比亚','Gambia'),('gn','EUR','Gvineo','Guinea','Guinée','Guinea','Guinee','Guiné','Guinea','几内亚','Guinea'),('gp','EUR','Gvadelupo','Guadeloupe','Guadeloupe','Guadalupe','Guadeloupe','Guadalupe','Guadeloupe','瓜德罗普','Guadeloupe'),('gq','EUR','Ekvatora Gvineo','Equatorial Guinea','Guinée équatoriale','Guinea Ecuatorial','Equatoriaal-Guinea','Guiné Equatorial','Rovníková Guinea','赤道几内亚','Äquatorialguinea'),('gr','EUR','Grekio','Greece','Grèce','Grecia','Griekenland','Grécia','Grécko','希腊','Griechenland'),('gt','EUR','Gvatemalo','Guatemala','Guatemala','Guatemala','Guatemala','Guatemala','Guatemala','危地马拉','Guatemala'),('gw','EUR','Gvineo-Bisaŭo','Guinea-Bissau','Guinée-Bissau','Guinea-Bisáu','Guinee-Bissau','Guiné-Bissau','Guinea-Bissau','几内亚比绍','Guinea-Bissau'),('gy','EUR','Gvajano','Guyana','Guyana','Guyana','Guyana','Guiana','Guayana','圭亚那','Guyana'),('hk','EUR','Honkongo (Ĉin.)','Hong Kong SAR China','R.A.S. chinoise de Hong Kong','RAE de Hong Kong (China)','Hongkong SAR van China','Hong Kong, RAE da China','Hongkong – OAO Číny','中国香港特别行政区','Sonderverwaltungszone Hongkong'),('hn','EUR','Honduro','Honduras','Honduras','Honduras','Honduras','Honduras','Honduras','洪都拉斯','Honduras'),('hr','HRK','Kroatio','Croatia','Croatie','Croacia','Kroatië','Croácia','Chorvátsko','克罗地亚','Kroatien'),('ht','EUR','Haitio','Haiti','Haïti','Haití','Haïti','Haiti','Haiti','海地','Haiti'),('hu','HUF','Hungario','Hungary','Hongrie','Hungría','Hongarije','Hungria','Maďarsko','匈牙利','Ungarn'),('id','EUR','Indonezio','Indonesia','Indonésie','Indonesia','Indonesië','Indonésia','Indonézia','印度尼西亚','Indonesien'),('ie','EUR','Irlando','Ireland','Irlande','Irlanda','Ierland','Irlanda','Írsko','爱尔兰','Irland'),('il','EUR','Israelo','Israel','Israël','Israel','Israël','Israel','Izrael','以色列','Israel'),('in','EUR','Hinda Unio (Barato)','India','Inde','India','India','Índia','India','印度','Indien'),('iq','EUR','Irako','Iraq','Irak','Irak','Irak','Iraque','Irak','伊拉克','Irak'),('ir','EUR','Irano','Iran','Iran','Irán','Iran','Irã','Irán','伊朗','Iran'),('is','EUR','Islando','Iceland','Islande','Islandia','IJsland','Islândia','Island','冰岛','Island'),('it','EUR','Italio','Italy','Italie','Italia','Italië','Itália','Taliansko','意大利','Italien'),('jm','EUR','Jamajko','Jamaica','Jamaïque','Jamaica','Jamaica','Jamaica','Jamajka','牙买加','Jamaika'),('jo','EUR','Jordanio','Jordan','Jordanie','Jordania','Jordanië','Jordânia','Jordánsko','约旦','Jordanien'),('jp','JPY','Japanio','Japan','Japon','Japón','Japan','Japão','Japonsko','日本','Japan'),('ke','EUR','Kenjo','Kenya','Kenya','Kenia','Kenia','Quênia','Keňa','肯尼亚','Kenia'),('kg','EUR','Kirgizio','Kyrgyzstan','Kirghizistan','Kirguistán','Kirgizië','Quirguistão','Kirgizsko','吉尔吉斯斯坦','Kirgisistan'),('kh','EUR','Kamboĝo','Cambodia','Cambodge','Camboya','Cambodja','Camboja','Kambodža','柬埔寨','Kambodscha'),('ki','EUR','Kiribato','Kiribati','Kiribati','Kiribati','Kiribati','Quiribati','Kiribati','基里巴斯','Kiribati'),('km','EUR','Komoroj','Comoros','Comores','Comoras','Comoren','Comores','Komory','科摩罗','Komoren'),('kn','EUR','Sankta Kristoforo kaj Neviso','St. Kitts & Nevis','Saint-Christophe-et-Niévès','San Cristóbal y Nieves','Saint Kitts en Nevis','São Cristóvão e Nevis','Svätý Krištof a Nevis','圣基茨和尼维斯','St. Kitts und Nevis'),('kp','EUR','Korea Popola DR','North Korea','Corée du Nord','Corea del Norte','Noord-Korea','Coreia do Norte','Severná Kórea','朝鲜','Nordkorea'),('kr','EUR','Korea Resp.','South Korea','Corée du Sud','Corea del Sur','Zuid-Korea','Coreia do Sul','Južná Kórea','韩国','Südkorea'),('kw','EUR','Kuvajto','Kuwait','Koweït','Kuwait','Koeweit','Kuwait','Kuvajt','科威特','Kuwait'),('ky','EUR','Kajmana Insularo (Brit.)','Cayman Islands','Îles Caïmans','Islas Caimán','Kaaimaneilanden','Ilhas Cayman','Kajmanie ostrovy','开曼群岛','Kaimaninseln'),('kz','EUR','Kazaĥio','Kazakhstan','Kazakhstan','Kazajistán','Kazachstan','Cazaquistão','Kazachstan','哈萨克斯坦','Kasachstan'),('la','EUR','Laoso','Laos','Laos','Laos','Laos','Laos','Laos','老挝','Laos'),('lb','EUR','Libano','Lebanon','Liban','Líbano','Libanon','Líbano','Libanon','黎巴嫩','Libanon'),('lc','EUR','Sankta Lucio','St. Lucia','Sainte-Lucie','Santa Lucía','Saint Lucia','Santa Lúcia','Svätá Lucia','圣卢西亚','St. Lucia'),('li','CHF','Liĥtenŝtejno','Liechtenstein','Liechtenstein','Liechtenstein','Liechtenstein','Liechtenstein','Lichtenštajnsko','列支敦士登','Liechtenstein'),('lk','EUR','Srilanko','Sri Lanka','Sri Lanka','Sri Lanka','Sri Lanka','Sri Lanka','Srí Lanka','斯里兰卡','Sri Lanka'),('lr','EUR','Liberio','Liberia','Libéria','Liberia','Liberia','Libéria','Libéria','利比里亚','Liberia'),('ls','EUR','Lesoto','Lesotho','Lesotho','Lesoto','Lesotho','Lesoto','Lesotho','莱索托','Lesotho'),('lt','EUR','Litovio','Lithuania','Lituanie','Lituania','Litouwen','Lituânia','Litva','立陶宛','Litauen'),('lu','EUR','Luksemburgo','Luxembourg','Luxembourg','Luxemburgo','Luxemburg','Luxemburgo','Luxembursko','卢森堡','Luxemburg'),('lv','EUR','Latvio','Latvia','Lettonie','Letonia','Letland','Letônia','Lotyšsko','拉脱维亚','Lettland'),('ly','EUR','Libio','Libya','Libye','Libia','Libië','Líbia','Líbya','利比亚','Libyen'),('ma','EUR','Maroko','Morocco','Maroc','Marruecos','Marokko','Marrocos','Maroko','摩洛哥','Marokko'),('mc','EUR','Monako','Monaco','Monaco','Mónaco','Monaco','Mônaco','Monako','摩纳哥','Monaco'),('md','EUR','Moldavio','Moldova','Moldavie','Moldavia','Moldavië','Moldávia','Moldavsko','摩尔多瓦','Republik Moldau'),('me','EUR','Montenegro','Montenegro','Monténégro','Montenegro','Montenegro','Montenegro','Čierna Hora','黑山','Montenegro'),('mg','EUR','Madagaskaro','Madagascar','Madagascar','Madagascar','Madagaskar','Madagascar','Madagaskar','马达加斯加','Madagaskar'),('mh','EUR','Marŝaloj','Marshall Islands','Îles Marshall','Islas Marshall','Marshalleilanden','Ilhas Marshall','Marshallove ostrovy','马绍尔群岛','Marshallinseln'),('mk','EUR','Nord-Makedonio','North Macedonia','Macédoine du Nord','Macedonia del Norte','Noord-Macedonië','Macedônia do Norte','Severné Macedónsko','北馬其頓','Nordmazedonien'),('ml','EUR','Malio','Mali','Mali','Mali','Mali','Mali','Mali','马里','Mali'),('mm','EUR','Birmo','Myanmar (Burma)','Myanmar (Birmanie)','Myanmar (Birmania)','Myanmar (Birma)','Mianmar (Birmânia)','Mjanmarsko','缅甸','Myanmar'),('mn','EUR','Mongolio','Mongolia','Mongolie','Mongolia','Mongolië','Mongólia','Mongolsko','蒙古','Mongolei'),('mo','EUR','Makao (Ĉin.)','Macau SAR China','R.A.S. chinoise de Macao','RAE de Macao (China)','Macau SAR van China','Macau, RAE da China','Macao – OAO Číny','中国澳门特别行政区','Sonderverwaltungsregion Macau'),('mq','EUR','Martiniko','Martinique','Martinique','Martinica','Martinique','Martinica','Martinik','马提尼克','Martinique'),('mr','EUR','Maŭritanio','Mauritania','Mauritanie','Mauritania','Mauritanië','Mauritânia','Mauritánia','毛里塔尼亚','Mauretanien'),('ms','EUR','Moncerato (Brit.)','Montserrat','Montserrat','Montserrat','Montserrat','Montserrat','Montserrat','蒙特塞拉特','Montserrat'),('mt','EUR','Malto','Malta','Malte','Malta','Malta','Malta','Malta','马耳他','Malta'),('mu','EUR','Maŭricio','Mauritius','Maurice','Mauricio','Mauritius','Maurício','Maurícius','毛里求斯','Mauritius'),('mv','EUR','Maldivoj','Maldives','Maldives','Maldivas','Maldiven','Maldivas','Maldivy','马尔代夫','Malediven'),('mw','EUR','Malavio','Malawi','Malawi','Malaui','Malawi','Malawi','Malawi','马拉维','Malawi'),('mx','EUR','Meksiko','Mexico','Mexique','México','Mexico','México','Mexiko','墨西哥','Mexiko'),('my','EUR','Malajzio','Malaysia','Malaisie','Malasia','Maleisië','Malásia','Malajzia','马来西亚','Malaysia'),('mz','EUR','Mozambiko','Mozambique','Mozambique','Mozambique','Mozambique','Moçambique','Mozambik','莫桑比克','Mosambik'),('na','EUR','Namibio','Namibia','Namibie','Namibia','Namibië','Namíbia','Namíbia','纳米比亚','Namibia'),('nc','EUR','Nov-Kaledonio (Fr.)','New Caledonia','Nouvelle-Calédonie','Nueva Caledonia','Nieuw-Caledonië','Nova Caledônia','Nová Kaledónia','新喀里多尼亚','Neukaledonien'),('ne','EUR','Niĝero','Niger','Niger','Níger','Niger','Níger','Niger','尼日尔','Niger'),('ng','EUR','Niĝerio','Nigeria','Nigéria','Nigeria','Nigeria','Nigéria','Nigéria','尼日利亚','Nigeria'),('ni','EUR','Nikaragvo','Nicaragua','Nicaragua','Nicaragua','Nicaragua','Nicarágua','Nikaragua','尼加拉瓜','Nicaragua'),('nl','EUR','Nederlando','Netherlands','Pays-Bas','Países Bajos','Nederland','Holanda','Holandsko','荷兰','Niederlande'),('no','NOK','Norvegio','Norway','Norvège','Noruega','Noorwegen','Noruega','Nórsko','挪威','Norwegen'),('np','EUR','Nepalo','Nepal','Népal','Nepal','Nepal','Nepal','Nepál','尼泊尔','Nepal'),('nr','EUR','Nauro','Nauru','Nauru','Nauru','Nauru','Nauru','Nauru','瑙鲁','Nauru'),('nz','NZD','Nov-Zelando','New Zealand','Nouvelle-Zélande','Nueva Zelanda','Nieuw-Zeeland','Nova Zelândia','Nový Zéland','新西兰','Neuseeland'),('om','EUR','Omano','Oman','Oman','Omán','Oman','Omã','Omán','阿曼','Oman'),('pa','EUR','Panamo','Panama','Panama','Panamá','Panama','Panamá','Panama','巴拿马','Panama'),('pe','EUR','Peruo','Peru','Pérou','Perú','Peru','Peru','Peru','秘鲁','Peru'),('pf','EUR','Franca Polinezio (Fr.)','French Polynesia','Polynésie française','Polinesia Francesa','Frans-Polynesië','Polinésia Francesa','Francúzska Polynézia','法属波利尼西亚','Französisch-Polynesien'),('pg','EUR','Papuo-Nov-Gvineo','Papua New Guinea','Papouasie-Nouvelle-Guinée','Papúa Nueva Guinea','Papoea-Nieuw-Guinea','Papua-Nova Guiné','Papua Nová Guinea','巴布亚新几内亚','Papua-Neuguinea'),('ph','EUR','Filipinoj','Philippines','Philippines','Filipinas','Filipijnen','Filipinas','Filipíny','菲律宾','Philippinen'),('pk','EUR','Pakistano','Pakistan','Pakistan','Pakistán','Pakistan','Paquistão','Pakistan','巴基斯坦','Pakistan'),('pl','EUR','Pollando','Poland','Pologne','Polonia','Polen','Polônia','Poľsko','波兰','Polen'),('pr','USD','Portoriko','Puerto Rico','Porto Rico','Puerto Rico','Puerto Rico','Porto Rico','Portoriko','波多黎各','Puerto Rico'),('ps','EUR','Palestino','Palestinian Territories','Territoires palestiniens','Territorios Palestinos','Palestijnse gebieden','Territórios palestinos','Palestínske územia','巴勒斯坦领土','Palästinensische Autonomiegebiete'),('pt','EUR','Portugalio','Portugal','Portugal','Portugal','Portugal','Portugal','Portugalsko','葡萄牙','Portugal'),('pw','EUR','Palaŭo','Palau','Palaos','Palaos','Palau','Palau','Palau','帕劳','Palau'),('py','EUR','Paragvajo','Paraguay','Paraguay','Paraguay','Paraguay','Paraguai','Paraguaj','巴拉圭','Paraguay'),('qa','EUR','Kataro','Qatar','Qatar','Catar','Qatar','Catar','Katar','卡塔尔','Katar'),('re','EUR','Reunio (Fr.)','Réunion','La Réunion','Reunión','Réunion','Reunião','Réunion','留尼汪','Réunion'),('ro','EUR','Rumanio','Romania','Roumanie','Rumanía','Roemenië','Romênia','Rumunsko','罗马尼亚','Rumänien'),('rs','EUR','Serbio','Serbia','Serbie','Serbia','Servië','Sérvia','Srbsko','塞尔维亚','Serbien'),('ru','EUR','Rusio','Russia','Russie','Rusia','Rusland','Rússia','Rusko','俄罗斯','Russland'),('rw','EUR','Ruando','Rwanda','Rwanda','Ruanda','Rwanda','Ruanda','Rwanda','卢旺达','Ruanda'),('sa','EUR','Sauda Arabio','Saudi Arabia','Arabie saoudite','Arabia Saudí','Saoedi-Arabië','Arábia Saudita','Saudská Arábia','沙特阿拉伯','Saudi-Arabien'),('sb','EUR','Salomonoj','Solomon Islands','Îles Salomon','Islas Salomón','Salomonseilanden','Ilhas Salomão','Šalamúnove ostrovy','所罗门群岛','Salomonen'),('sc','EUR','Sejŝeloj','Seychelles','Seychelles','Seychelles','Seychellen','Seicheles','Seychely','塞舌尔','Seychellen'),('sd','EUR','Sudano','Sudan','Soudan','Sudán','Soedan','Sudão','Sudán','苏丹','Sudan'),('se','SEK','Svedio','Sweden','Suède','Suecia','Zweden','Suécia','Švédsko','瑞典','Schweden'),('sg','EUR','Singapuro','Singapore','Singapour','Singapur','Singapore','Cingapura','Singapur','新加坡','Singapur'),('si','EUR','Slovenio','Slovenia','Slovénie','Eslovenia','Slovenië','Eslovênia','Slovinsko','斯洛文尼亚','Slowenien'),('sk','EUR','Slovakio','Slovakia','Slovaquie','Eslovaquia','Slowakije','Eslováquia','Slovensko','斯洛伐克','Slowakei'),('sl','EUR','Sieraleono','Sierra Leone','Sierra Leone','Sierra Leona','Sierra Leone','Serra Leoa','Sierra Leone','塞拉利昂','Sierra Leone'),('sm','EUR','Sanmarino','San Marino','Saint-Marin','San Marino','San Marino','San Marino','San Maríno','圣马力诺','San Marino'),('sn','EUR','Senegalo','Senegal','Sénégal','Senegal','Senegal','Senegal','Senegal','塞内加尔','Senegal'),('so','EUR','Somalio','Somalia','Somalie','Somalia','Somalië','Somália','Somálsko','索马里','Somalia'),('sr','EUR','Surinamo','Suriname','Suriname','Surinam','Suriname','Suriname','Surinam','苏里南','Suriname'),('ss','EUR','Sud-Sudano','South Sudan','Soudan du Sud','Sudán del Sur','Zuid-Soedan','Sudão do Sul','Južný Sudán','南苏丹','Südsudan'),('st','EUR','Santomeo kaj Principeo','São Tomé & Príncipe','Sao Tomé-et-Principe','Santo Tomé y Príncipe','Sao Tomé en Principe','São Tomé e Príncipe','Svätý Tomáš a Princov ostrov','圣多美和普林西比','São Tomé und Príncipe'),('sv','EUR','Salvadoro','El Salvador','El Salvador','El Salvador','El Salvador','El Salvador','Salvádor','萨尔瓦多','El Salvador'),('sy','EUR','Sirio','Syria','Syrie','Siria','Syrië','Síria','Sýria','叙利亚','Syrien'),('sz','EUR','Svazilando','Swaziland','Swaziland','Suazilandia','Swaziland','Suazilândia','Svazijsko','斯威士兰','Swasiland'),('tc','EUR','Turkoj kaj Kajkoj (Brit.)','Turks & Caicos Islands','Îles Turques-et-Caïques','Islas Turcas y Caicos','Turks- en Caicoseilanden','Ilhas Turks e Caicos','Turks a Caicos','特克斯和凯科斯群岛','Turks- und Caicosinseln'),('td','EUR','Ĉado','Chad','Tchad','Chad','Tsjaad','Chade','Čad','乍得','Tschad'),('tg','EUR','Togolando','Togo','Togo','Togo','Togo','Togo','Togo','多哥','Togo'),('th','EUR','Tajlando','Thailand','Thaïlande','Tailandia','Thailand','Tailândia','Thajsko','泰国','Thailand'),('tj','EUR','Taĝikio','Tajikistan','Tadjikistan','Tayikistán','Tadzjikistan','Tajiquistão','Tadžikistan','塔吉克斯坦','Tadschikistan'),('tl','EUR','Orienta Timoro','Timor-Leste','Timor oriental','Timor-Leste','Oost-Timor','Timor-Leste','Východný Timor','东帝汶','Osttimor'),('tm','EUR','Turkmenio','Turkmenistan','Turkménistan','Turkmenistán','Turkmenistan','Turcomenistão','Turkménsko','土库曼斯坦','Turkmenistan'),('tn','EUR','Tunizio','Tunisia','Tunisie','Túnez','Tunesië','Tunísia','Tunisko','突尼斯','Tunesien'),('to','EUR','Tongo','Tonga','Tonga','Tonga','Tonga','Tonga','Tonga','汤加','Tonga'),('tr','EUR','Turkio','Turkey','Turquie','Turquía','Turkije','Turquia','Turecko','土耳其','Türkei'),('tt','EUR','Trinidado','Trinidad & Tobago','Trinité-et-Tobago','Trinidad y Tobago','Trinidad en Tobago','Trinidad e Tobago','Trinidad a Tobago','特立尼达和多巴哥','Trinidad und Tobago'),('tv','EUR','Tuvalo','Tuvalu','Tuvalu','Tuvalu','Tuvalu','Tuvalu','Tuvalu','图瓦卢','Tuvalu'),('tw','EUR','Tajvano','Taiwan','Taïwan','Taiwán','Taiwan','Taiwan','Taiwan','台湾','Taiwan'),('tz','EUR','Tanzanio','Tanzania','Tanzanie','Tanzania','Tanzania','Tanzânia','Tanzánia','坦桑尼亚','Tansania'),('ua','EUR','Ukrainio','Ukraine','Ukraine','Ucrania','Oekraïne','Ucrânia','Ukrajina','乌克兰','Ukraine'),('ug','EUR','Ugando','Uganda','Ouganda','Uganda','Oeganda','Uganda','Uganda','乌干达','Uganda'),('us','USD','Usono','United States','États-Unis','Estados Unidos','Verenigde Staten','Estados Unidos','Spojené štáty','美国','Vereinigte Staaten'),('uy','EUR','Urugvajo','Uruguay','Uruguay','Uruguay','Uruguay','Uruguai','Uruguaj','乌拉圭','Uruguay'),('uz','EUR','Uzbekio','Uzbekistan','Ouzbékistan','Uzbekistán','Oezbekistan','Uzbequistão','Uzbekistan','乌兹别克斯坦','Usbekistan'),('va','EUR','Vatikano','Vatican City','État de la Cité du Vatican','Ciudad del Vaticano','Vaticaanstad','Cidade do Vaticano','Vatikán','梵蒂冈','Vatikanstadt'),('vc','EUR','Sankta Vincento kaj Grenadinoj','St. Vincent & Grenadines','Saint-Vincent-et-les-Grenadines','San Vicente y las Granadinas','Saint Vincent en de Grenadines','São Vicente e Granadinas','Svätý Vincent a Grenadíny','圣文森特和格林纳丁斯','St. Vincent und die Grenadinen'),('ve','EUR','Venezuelo','Venezuela','Venezuela','Venezuela','Venezuela','Venezuela','Venezuela','委内瑞拉','Venezuela'),('vn','EUR','Vjetnamio','Vietnam','Vietnam','Vietnam','Vietnam','Vietnã','Vietnam','越南','Vietnam'),('vu','EUR','Vanuatuo','Vanuatu','Vanuatu','Vanuatu','Vanuatu','Vanuatu','Vanuatu','瓦努阿图','Vanuatu'),('ws','EUR','Samoo','Samoa','Samoa','Samoa','Samoa','Samoa','Samoa','萨摩亚','Samoa'),('ye','EUR','Jemeno','Yemen','Yémen','Yemen','Jemen','Iêmen','Jemen','也门','Jemen'),('za','EUR','Sud-Afriko','South Africa','Afrique du Sud','Sudáfrica','Zuid-Afrika','África do Sul','Južná Afrika','南非','Südafrika'),('zm','EUR','Zambio','Zambia','Zambie','Zambia','Zambia','Zâmbia','Zambia','赞比亚','Sambia'),('zw','EUR','Zimbabvo','Zimbabwe','Zimbabwe','Zimbabue','Zimbabwe','Zimbábue','Zimbabwe','津巴布韦','Simbabwe');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-03-25 12:16:41
