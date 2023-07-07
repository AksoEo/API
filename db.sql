-- MySQL dump 10.13  Distrib 8.0.33, for Linux (x86_64)
--
-- Host: localhost    Database: akso
-- ------------------------------------------------------
-- Server version	8.0.33-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
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

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `akso` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `akso`;

--
-- Table structure for table `addressLabelTemplates`
--

DROP TABLE IF EXISTS `addressLabelTemplates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addressLabelTemplates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `paper` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'A4',
  `margins` json NOT NULL,
  `cols` tinyint unsigned NOT NULL,
  `rows` tinyint unsigned NOT NULL,
  `colGap` smallint unsigned NOT NULL,
  `rowGap` smallint unsigned NOT NULL,
  `cellPadding` smallint unsigned NOT NULL DEFAULT '8',
  `fontSize` tinyint unsigned NOT NULL DEFAULT '12',
  `drawOutline` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_groups`
--

DROP TABLE IF EXISTS `admin_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_groups_members_clients`
--

DROP TABLE IF EXISTS `admin_groups_members_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_groups_members_clients` (
  `adminGroupId` int unsigned NOT NULL,
  `apiKey` binary(16) NOT NULL,
  PRIMARY KEY (`adminGroupId`,`apiKey`),
  KEY `apiKey` (`apiKey`),
  CONSTRAINT `admin_groups_members_clients_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_groups_members_clients_ibfk_2` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_groups_members_codeholders`
--

DROP TABLE IF EXISTS `admin_groups_members_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_groups_members_codeholders` (
  `adminGroupId` int unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  PRIMARY KEY (`adminGroupId`,`codeholderId`),
  KEY `admin_groups_members_ibfk_2` (`codeholderId`),
  CONSTRAINT `admin_groups_members_codeholders_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_groups_members_codeholders_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_clients`
--

DROP TABLE IF EXISTS `admin_permissions_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_clients` (
  `apiKey` binary(16) NOT NULL,
  `permission` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`apiKey`,`permission`),
  CONSTRAINT `admin_permissions_clients_ibfk_1` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_codeholders`
--

DROP TABLE IF EXISTS `admin_permissions_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_codeholders` (
  `codeholderId` int unsigned NOT NULL,
  `permission` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`,`permission`),
  CONSTRAINT `admin_permissions_codeholders_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_groups`
--

DROP TABLE IF EXISTS `admin_permissions_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_groups` (
  `adminGroupId` int unsigned NOT NULL,
  `permission` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`adminGroupId`,`permission`),
  CONSTRAINT `admin_permissions_groups_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_memberRestrictions_clients`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_memberRestrictions_clients` (
  `apiKey` binary(16) NOT NULL,
  `filter` json NOT NULL,
  `fields` json DEFAULT NULL,
  PRIMARY KEY (`apiKey`),
  CONSTRAINT `admin_permissions_memberRestrictions_clients_ibfk_1` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_memberRestrictions_codeholders`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_memberRestrictions_codeholders` (
  `codeholderId` int unsigned NOT NULL,
  `filter` json NOT NULL,
  `fields` json DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  CONSTRAINT `admin_permissions_memberRestrictions_codeholders_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_permissions_memberRestrictions_groups`
--

DROP TABLE IF EXISTS `admin_permissions_memberRestrictions_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_permissions_memberRestrictions_groups` (
  `adminGroupId` int unsigned NOT NULL,
  `filter` json NOT NULL,
  `fields` json DEFAULT NULL,
  PRIMARY KEY (`adminGroupId`),
  CONSTRAINT `admin_permissions_memberRestrictions_groups_ibfk_1` FOREIGN KEY (`adminGroupId`) REFERENCES `admin_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `apiKey` binary(16) NOT NULL,
  `apiSecret` binary(32) NOT NULL COMMENT 'SHA-256',
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerEmail` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`apiKey`),
  KEY `name_2` (`name`),
  KEY `ownerName_2` (`ownerName`),
  KEY `ownerEmail_2` (`ownerEmail`),
  FULLTEXT KEY `name` (`name`),
  FULLTEXT KEY `ownerName` (`ownerName`),
  FULLTEXT KEY `ownerEmail` (`ownerEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholderRoles`
--

DROP TABLE IF EXISTS `codeholderRoles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholderRoles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `public` (`public`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholderRoles_codeholders`
--

DROP TABLE IF EXISTS `codeholderRoles_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholderRoles_codeholders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `durationFrom` bigint unsigned DEFAULT NULL,
  `durationTo` bigint unsigned DEFAULT NULL,
  `roleId` int unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `dataCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dataOrg` int unsigned DEFAULT NULL,
  `dataString` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `durationFrom` (`durationFrom`),
  KEY `durationTo` (`durationTo`),
  KEY `roleId` (`roleId`),
  KEY `codeholderId` (`codeholderId`),
  KEY `dataCountry` (`dataCountry`),
  KEY `dataOrg` (`dataOrg`),
  CONSTRAINT `codeholderRoles_codeholders_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `codeholderRoles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholderRoles_codeholders_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholderRoles_codeholders_ibfk_3` FOREIGN KEY (`dataCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `codeholderRoles_codeholders_ibfk_4` FOREIGN KEY (`dataOrg`) REFERENCES `codeholders_org` (`codeholderId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders`
--

DROP TABLE IF EXISTS `codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderType` enum('human','org') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creationTime` bigint unsigned NOT NULL,
  `oldCode` char(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `newCode` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'bcrypt',
  `createPasswordTime` bigint unsigned DEFAULT NULL,
  `createPasswordKey` binary(16) DEFAULT NULL,
  `email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publicEmail` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `feeCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publicCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `officePhone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDead` tinyint(1) NOT NULL DEFAULT '0',
  `deathdate` date DEFAULT NULL,
  `profilePictureHash` binary(20) DEFAULT NULL,
  `addressPublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `addressInvalid` tinyint(1) NOT NULL DEFAULT '0',
  `emailPublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `officePhonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `profilePicturePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `website` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biography` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `newCode` (`newCode`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `oldCode` (`oldCode`) USING BTREE,
  KEY `feeCountry` (`feeCountry`),
  KEY `isDead` (`isDead`),
  KEY `enabled` (`enabled`),
  KEY `createPasswordTime` (`createPasswordTime`),
  KEY `deathdate` (`deathdate`),
  KEY `password` (`password`),
  KEY `creationTime` (`creationTime`),
  KEY `profilePictureHash` (`profilePictureHash`) USING BTREE,
  KEY `publicCountry` (`publicCountry`),
  KEY `publicEmail` (`publicEmail`),
  KEY `addressInvalid` (`addressInvalid`),
  FULLTEXT KEY `email_2` (`email`),
  FULLTEXT KEY `notes` (`notes`),
  FULLTEXT KEY `officePhone` (`officePhone`),
  FULLTEXT KEY `publicEmail_2` (`publicEmail`),
  CONSTRAINT `codeholders_ibfk_1` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `codeholders_ibfk_2` FOREIGN KEY (`publicCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_address`
--

DROP TABLE IF EXISTS `codeholders_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_address` (
  `codeholderId` int unsigned NOT NULL,
  `country` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `countryArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryArea_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityArea_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streetAddress_latin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postalCode_latin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortingCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sortingCode_latin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
-- Table structure for table `codeholders_changeRequests`
--

DROP TABLE IF EXISTS `codeholders_changeRequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_changeRequests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `time` bigint unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `data` json NOT NULL,
  `codeholderDescription` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `internalNotes` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `time` (`time`),
  KEY `codeholderId` (`codeholderId`),
  KEY `status` (`status`),
  FULLTEXT KEY `codeholderDescription` (`codeholderDescription`),
  FULLTEXT KEY `internalNotes` (`internalNotes`),
  CONSTRAINT `codeholders_changeRequests_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_delegations`
--

DROP TABLE IF EXISTS `codeholders_delegations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_delegations` (
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approvedBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approvedTime` bigint unsigned NOT NULL,
  `tos_docDataProtectionUEA` tinyint(1) NOT NULL,
  `tos_docDataProtectionUEA_time` bigint unsigned NOT NULL,
  `tos_docDelegatesUEA` tinyint(1) NOT NULL,
  `tos_docDelegatesUEA_time` bigint unsigned NOT NULL,
  `tos_docDelegatesDataProtectionUEA` tinyint(1) NOT NULL,
  `tos_docDelegatesDataProtectionUEA_time` bigint unsigned NOT NULL,
  `tos_paperAnnualBook` tinyint(1) NOT NULL,
  `tos_paperAnnualBook_time` bigint unsigned NOT NULL,
  PRIMARY KEY (`codeholderId`,`org`),
  KEY `tos_docDataProtectionUEA_time` (`tos_docDataProtectionUEA_time`),
  KEY `tos_docDataProtectionUEA` (`tos_docDataProtectionUEA`),
  KEY `tos_docDelegatesUEA` (`tos_docDelegatesUEA`),
  KEY `tos_docDelegatesUEA_time` (`tos_docDelegatesUEA_time`),
  KEY `tos_docDelegatesDataProtectionUEA` (`tos_docDelegatesDataProtectionUEA`),
  KEY `tos_paperAnnualBook` (`tos_paperAnnualBook`),
  KEY `tos_docDelegatesDataProtectionUEA_time` (`tos_docDelegatesDataProtectionUEA_time`),
  KEY `tos_paperAnnualBook_time` (`tos_paperAnnualBook_time`),
  KEY `org` (`org`),
  KEY `approvedBy` (`approvedBy`),
  KEY `approvedTime` (`approvedTime`),
  CONSTRAINT `codeholders_delegations_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_delegations_cities`
--

DROP TABLE IF EXISTS `codeholders_delegations_cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_delegations_cities` (
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` bigint unsigned NOT NULL,
  PRIMARY KEY (`codeholderId`,`org`,`city`),
  KEY `org` (`org`),
  KEY `city` (`city`),
  CONSTRAINT `codeholders_delegations_cities_ibfk_1` FOREIGN KEY (`codeholderId`, `org`) REFERENCES `codeholders_delegations` (`codeholderId`, `org`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_delegations_countries`
--

DROP TABLE IF EXISTS `codeholders_delegations_countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_delegations_countries` (
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` tinyint NOT NULL,
  PRIMARY KEY (`codeholderId`,`org`,`country`),
  KEY `level` (`level`),
  KEY `org` (`org`),
  KEY `country` (`country`),
  CONSTRAINT `codeholders_delegations_countries_ibfk_1` FOREIGN KEY (`codeholderId`, `org`) REFERENCES `codeholders_delegations` (`codeholderId`, `org`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_delegations_countries_ibfk_2` FOREIGN KEY (`country`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_delegations_hosting`
--

DROP TABLE IF EXISTS `codeholders_delegations_hosting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_delegations_hosting` (
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `maxDays` tinyint unsigned DEFAULT NULL,
  `maxPersons` tinyint unsigned DEFAULT NULL,
  `description` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `psProfileURL` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`codeholderId`,`org`),
  KEY `maxDays` (`maxDays`),
  KEY `maxPersons` (`maxPersons`),
  KEY `psProfileURL` (`psProfileURL`),
  KEY `org` (`org`),
  FULLTEXT KEY `description` (`description`),
  CONSTRAINT `codeholders_delegations_hosting_ibfk_1` FOREIGN KEY (`codeholderId`, `org`) REFERENCES `codeholders_delegations` (`codeholderId`, `org`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_delegations_subjects`
--

DROP TABLE IF EXISTS `codeholders_delegations_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_delegations_subjects` (
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjectId` int unsigned NOT NULL,
  PRIMARY KEY (`codeholderId`,`org`,`subjectId`),
  KEY `subjectId` (`subjectId`),
  KEY `org` (`org`),
  CONSTRAINT `codeholders_delegations_subjects_ibfk_1` FOREIGN KEY (`codeholderId`, `org`) REFERENCES `codeholders_delegations` (`codeholderId`, `org`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_delegations_subjects_ibfk_2` FOREIGN KEY (`subjectId`) REFERENCES `delegations_subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_files`
--

DROP TABLE IF EXISTS `codeholders_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_files` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `time` bigint unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `addedBy` int unsigned DEFAULT NULL,
  `name` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
-- Table structure for table `codeholders_hist_address`
--

DROP TABLE IF EXISTS `codeholders_hist_address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_address` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `address_country` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_countryArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_countryArea_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_city_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_cityArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_cityArea_latin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_streetAddress` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_streetAddress_latin` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_postalCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_postalCode_latin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_sortingCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_sortingCode_latin` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_search` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`modId`),
  KEY `country` (`address_country`),
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `countryArea` (`address_countryArea`),
  FULLTEXT KEY `city` (`address_city`),
  FULLTEXT KEY `streetAddress` (`address_streetAddress`),
  FULLTEXT KEY `postalCode` (`address_postalCode`),
  FULLTEXT KEY `countryArea_latin` (`address_countryArea_latin`),
  FULLTEXT KEY `city_latin` (`address_city_latin`),
  FULLTEXT KEY `streetAddress_latin` (`address_streetAddress_latin`),
  FULLTEXT KEY `postalCode_latin` (`address_postalCode_latin`),
  CONSTRAINT `codeholders_hist_address_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_hist_address_ibfk_2` FOREIGN KEY (`address_country`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_addressInvalid`
--

DROP TABLE IF EXISTS `codeholders_hist_addressInvalid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_addressInvalid` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `addressInvalid` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `addressInvalid` (`addressInvalid`) USING BTREE,
  CONSTRAINT `codeholders_hist_addressInvalid_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_addressPublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_addressPublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_addressPublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `addressPublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_addressPublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_biography`
--

DROP TABLE IF EXISTS `codeholders_hist_biography`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_biography` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `biography` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_biography_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_birthdate`
--

DROP TABLE IF EXISTS `codeholders_hist_birthdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_birthdate` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `birthdate` date DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `birthdate` (`birthdate`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_careOf`
--

DROP TABLE IF EXISTS `codeholders_hist_careOf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_careOf` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `careOf` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `careOf` (`careOf`),
  CONSTRAINT `codeholders_hist_careOf_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_cellphone`
--

DROP TABLE IF EXISTS `codeholders_hist_cellphone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_cellphone` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cellphone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `cellphone` (`cellphone`),
  CONSTRAINT `codeholders_hist_cellphone_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_cellphonePublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_cellphonePublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_cellphonePublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cellphonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_cellphonePublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_deathdate`
--

DROP TABLE IF EXISTS `codeholders_hist_deathdate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_deathdate` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `deathdate` date DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `deathdate` (`deathdate`) USING BTREE,
  CONSTRAINT `codeholders_hist_deathdate_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_email`
--

DROP TABLE IF EXISTS `codeholders_hist_email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_email` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `email` (`email`) USING BTREE,
  FULLTEXT KEY `email_2` (`email`),
  CONSTRAINT `codeholders_hist_email_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_emailPublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_emailPublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_emailPublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `emailPublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_emailPublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_enabled`
--

DROP TABLE IF EXISTS `codeholders_hist_enabled`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_enabled` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `enabled` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `enabled` (`enabled`),
  CONSTRAINT `codeholders_hist_enabled_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_factoids`
--

DROP TABLE IF EXISTS `codeholders_hist_factoids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_factoids` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `factoids` json DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_factoids_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_feeCountry`
--

DROP TABLE IF EXISTS `codeholders_hist_feeCountry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_feeCountry` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `feeCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `feeCountry` (`feeCountry`),
  CONSTRAINT `codeholders_hist_feeCountry_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `codeholders_hist_feeCountry_ibfk_2` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_firstName`
--

DROP TABLE IF EXISTS `codeholders_hist_firstName`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_firstName` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `firstName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `firstName` (`firstName`),
  CONSTRAINT `codeholders_hist_firstName_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_firstNameLegal`
--

DROP TABLE IF EXISTS `codeholders_hist_firstNameLegal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_firstNameLegal` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `firstNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `firstNameLegal` (`firstNameLegal`),
  CONSTRAINT `codeholders_hist_firstNameLegal_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_fullName`
--

DROP TABLE IF EXISTS `codeholders_hist_fullName`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_fullName` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fullName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `fullName` (`fullName`),
  CONSTRAINT `codeholders_hist_fullName_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_fullNameLocal`
--

DROP TABLE IF EXISTS `codeholders_hist_fullNameLocal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_fullNameLocal` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fullNameLocal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `fullNameLocal` (`fullNameLocal`),
  CONSTRAINT `codeholders_hist_fullNameLocal_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_honorific`
--

DROP TABLE IF EXISTS `codeholders_hist_honorific`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_honorific` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `honorific` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_honorific_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_isDead`
--

DROP TABLE IF EXISTS `codeholders_hist_isDead`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_isDead` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `isDead` tinyint(1) NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `isDead` (`isDead`),
  CONSTRAINT `codeholders_hist_isDead_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_landlinePhone`
--

DROP TABLE IF EXISTS `codeholders_hist_landlinePhone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_landlinePhone` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `landlinePhone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `landlinePhone` (`landlinePhone`),
  CONSTRAINT `codeholders_hist_landlinePhone_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_landlinePhonePublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_landlinePhonePublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_landlinePhonePublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `landlinePhonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_landlinePhonePublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_lastName`
--

DROP TABLE IF EXISTS `codeholders_hist_lastName`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_lastName` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lastName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `lastName` (`lastName`),
  CONSTRAINT `codeholders_hist_lastName_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_lastNameLegal`
--

DROP TABLE IF EXISTS `codeholders_hist_lastNameLegal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_lastNameLegal` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lastNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `lastNameLegal` (`lastNameLegal`),
  CONSTRAINT `codeholders_hist_lastNameLegal_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_lastNamePublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_lastNamePublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_lastNamePublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `lastNamePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_lastNamePublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_mainDescriptor`
--

DROP TABLE IF EXISTS `codeholders_hist_mainDescriptor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_mainDescriptor` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `mainDescriptor` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `mainDescriptor` (`mainDescriptor`),
  CONSTRAINT `codeholders_hist_mainDescriptor_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_nameAbbrev`
--

DROP TABLE IF EXISTS `codeholders_hist_nameAbbrev`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_nameAbbrev` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `nameAbbrev` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `nameAbbrev` (`nameAbbrev`),
  CONSTRAINT `codeholders_hist_nameAbbrev_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_newCode`
--

DROP TABLE IF EXISTS `codeholders_hist_newCode`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_newCode` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `newCode` char(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `newCode` (`newCode`),
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_newCode_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_notes`
--

DROP TABLE IF EXISTS `codeholders_hist_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_notes` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `notes` (`notes`),
  CONSTRAINT `codeholders_hist_notes_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_officePhone`
--

DROP TABLE IF EXISTS `codeholders_hist_officePhone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_officePhone` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `officePhone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  FULLTEXT KEY `officePhone` (`officePhone`),
  CONSTRAINT `codeholders_hist_officePhone_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_officePhonePublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_officePhonePublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_officePhonePublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `officePhonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_officePhonePublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_password`
--

DROP TABLE IF EXISTS `codeholders_hist_password`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_password` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_password_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_profession`
--

DROP TABLE IF EXISTS `codeholders_hist_profession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_profession` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `profession` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_profession_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_profilePictureHash`
--

DROP TABLE IF EXISTS `codeholders_hist_profilePictureHash`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_profilePictureHash` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `profilePictureHash` binary(20) DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `profilePictureHash` (`profilePictureHash`) USING BTREE,
  CONSTRAINT `codeholders_hist_profilePictureHash_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_profilePicturePublicity`
--

DROP TABLE IF EXISTS `codeholders_hist_profilePicturePublicity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_profilePicturePublicity` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `profilePicturePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_profilePicturePublicity_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_publicCountry`
--

DROP TABLE IF EXISTS `codeholders_hist_publicCountry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_publicCountry` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `publicCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `feeCountry` (`publicCountry`),
  CONSTRAINT `codeholders_hist_publicCountry_ibfk_1` FOREIGN KEY (`publicCountry`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `codeholders_hist_publicCountry_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_publicEmail`
--

DROP TABLE IF EXISTS `codeholders_hist_publicEmail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_publicEmail` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `publicEmail` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  KEY `email` (`publicEmail`) USING BTREE,
  FULLTEXT KEY `email_2` (`publicEmail`),
  CONSTRAINT `codeholders_hist_publicEmail_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_hist_website`
--

DROP TABLE IF EXISTS `codeholders_hist_website`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_hist_website` (
  `modId` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `modTime` bigint unsigned NOT NULL,
  `modBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modCmt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `website` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`modId`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `codeholders_hist_website_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_human`
--

DROP TABLE IF EXISTS `codeholders_human`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_human` (
  `codeholderId` int unsigned NOT NULL,
  `firstName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `searchName` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `honorific` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `profession` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landlinePhone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellphone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastNamePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'public',
  `landlinePhonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  `cellphonePublicity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private',
  PRIMARY KEY (`codeholderId`),
  KEY `birthdate` (`birthdate`),
  KEY `searchName_2` (`searchName`),
  FULLTEXT KEY `firstName` (`firstName`),
  FULLTEXT KEY `firstNameLegal` (`firstNameLegal`),
  FULLTEXT KEY `lastName` (`lastName`),
  FULLTEXT KEY `lastNameLegal` (`lastNameLegal`),
  FULLTEXT KEY `landlinePhone` (`landlinePhone`),
  FULLTEXT KEY `cellphone` (`cellphone`),
  FULLTEXT KEY `searchName` (`searchName`),
  CONSTRAINT `codeholders_human_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `insert_human_searchName` BEFORE INSERT ON `codeholders_human` FOR EACH ROW BEGIN

	SET NEW.searchName = CONCAT_WS(' ', NEW.firstName, new.lastName, NEW.firstNameLegal, new.lastNameLegal);

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_human_searchName` BEFORE UPDATE ON `codeholders_human` FOR EACH ROW BEGIN

	SET NEW.searchName = CONCAT_WS(' ', NEW.firstName, new.lastName, NEW.firstNameLegal, new.lastNameLegal);

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `codeholders_logins`
--

DROP TABLE IF EXISTS `codeholders_logins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_logins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `time` bigint unsigned NOT NULL,
  `timezone` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varbinary(16) NOT NULL,
  `userAgent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgentParsed` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ll` point NOT NULL,
  `area` smallint NOT NULL,
  `country` varchar(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `codeholderId` (`codeholderId`),
  SPATIAL KEY `ll` (`ll`),
  KEY `country` (`country`),
  KEY `region` (`region`),
  KEY `time` (`time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_notifAccounts_telegram`
--

DROP TABLE IF EXISTS `codeholders_notifAccounts_telegram`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_notifAccounts_telegram` (
  `codeholderId` int unsigned NOT NULL,
  `telegram_chatId` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telegram_deepLink` binary(16) DEFAULT NULL,
  `telegram_deepLink_time` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  UNIQUE KEY `telegram_deepLink` (`telegram_deepLink`),
  UNIQUE KEY `telegram_chatId` (`telegram_chatId`),
  KEY `telegram_deepLink_time` (`telegram_deepLink_time`),
  CONSTRAINT `codeholders_notifAccounts_telegram_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_notif_pref`
--

DROP TABLE IF EXISTS `codeholders_notif_pref`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_notif_pref` (
  `codeholderId` int unsigned NOT NULL,
  `category` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pref` set('email','telegram') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`,`category`),
  CONSTRAINT `codeholders_notif_pref_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_notif_pref_global`
--

DROP TABLE IF EXISTS `codeholders_notif_pref_global`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_notif_pref_global` (
  `codeholderId` int unsigned NOT NULL,
  `pref` set('email','telegram') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`codeholderId`),
  CONSTRAINT `codeholders_notif_pref_global_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_org`
--

DROP TABLE IF EXISTS `codeholders_org`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_org` (
  `codeholderId` int unsigned NOT NULL,
  `fullName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fullNameLocal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `careOf` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nameAbbrev` varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `searchName` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mainDescriptor` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `factoids` json DEFAULT NULL,
  PRIMARY KEY (`codeholderId`),
  KEY `searchName_2` (`searchName`),
  FULLTEXT KEY `careOf` (`careOf`),
  FULLTEXT KEY `searchName` (`searchName`),
  FULLTEXT KEY `fullName` (`fullName`),
  FULLTEXT KEY `fullNameLocal` (`fullNameLocal`),
  FULLTEXT KEY `nameAbbrev` (`nameAbbrev`),
  FULLTEXT KEY `mainDescriptor` (`mainDescriptor`),
  CONSTRAINT `codeholders_org_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `insert_org_searchName` BEFORE INSERT ON `codeholders_org` FOR EACH ROW BEGIN

	SET NEW.searchName = CONCAT_WS(' ', NEW.fullName, NEW.nameAbbrev, NEW.fullNameLocal);

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `update_org_searchName` BEFORE UPDATE ON `codeholders_org` FOR EACH ROW BEGIN

	SET NEW.searchName = CONCAT_WS(' ', NEW.fullName, NEW.nameAbbrev, NEW.fullNameLocal);

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `codeholders_totp`
--

DROP TABLE IF EXISTS `codeholders_totp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_totp` (
  `codeholderId` int unsigned NOT NULL,
  `secret` tinyblob NOT NULL,
  `iv` binary(16) NOT NULL,
  PRIMARY KEY (`codeholderId`),
  CONSTRAINT `codeholders_totp_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `codeholders_totp_remember`
--

DROP TABLE IF EXISTS `codeholders_totp_remember`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codeholders_totp_remember` (
  `rememberKey` binary(32) NOT NULL COMMENT 'SHA-256',
  `codeholderId` int unsigned NOT NULL,
  `time` bigint unsigned NOT NULL,
  PRIMARY KEY (`rememberKey`),
  KEY `codeholderId` (`codeholderId`),
  KEY `time` (`time`),
  CONSTRAINT `codeholders_totp_remember_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders_totp` (`codeholderId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses`
--

DROP TABLE IF EXISTS `congresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbrev` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `abbrev` (`abbrev`),
  KEY `org` (`org`),
  FULLTEXT KEY `name_2` (`name`),
  FULLTEXT KEY `abbrev_2` (`abbrev`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances`
--

DROP TABLE IF EXISTS `congresses_instances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `congressId` int unsigned NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `humanId` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateFrom` date NOT NULL,
  `dateTo` date NOT NULL,
  `locationName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locationNameLocal` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locationCoords` point DEFAULT NULL,
  `locationAddress` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tz` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `congressId` (`congressId`),
  KEY `name` (`name`),
  KEY `humanId` (`humanId`),
  KEY `dateFrom` (`dateFrom`),
  KEY `dateTo` (`dateTo`),
  FULLTEXT KEY `locationName` (`locationName`),
  FULLTEXT KEY `locationNameLocal` (`locationNameLocal`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `congresses_instances_ibfk_1` FOREIGN KEY (`congressId`) REFERENCES `congresses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locationTags`
--

DROP TABLE IF EXISTS `congresses_instances_locationTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locationTags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `congressInstanceId` int unsigned NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `congressInstanceId` (`congressInstanceId`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `congresses_instances_locationTags_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations`
--

DROP TABLE IF EXISTS `congresses_instances_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `congressInstanceId` int unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `congressInstanceId` (`congressInstanceId`),
  KEY `type` (`type`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `congresses_instances_locations_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations_external`
--

DROP TABLE IF EXISTS `congresses_instances_locations_external`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations_external` (
  `congressInstanceLocationId` int unsigned NOT NULL AUTO_INCREMENT,
  `address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ll` point NOT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERIC',
  PRIMARY KEY (`congressInstanceLocationId`),
  SPATIAL KEY `ll` (`ll`),
  CONSTRAINT `congresses_instances_locations_external_ibfk_1` FOREIGN KEY (`congressInstanceLocationId`) REFERENCES `congresses_instances_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations_external_rating`
--

DROP TABLE IF EXISTS `congresses_instances_locations_external_rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations_external_rating` (
  `congressInstanceLocationId` int unsigned NOT NULL,
  `rating` decimal(4,2) NOT NULL,
  `rating_max` tinyint unsigned NOT NULL,
  `rating_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`congressInstanceLocationId`),
  CONSTRAINT `congresses_instances_locations_external_rating_ibfk_1` FOREIGN KEY (`congressInstanceLocationId`) REFERENCES `congresses_instances_locations_external` (`congressInstanceLocationId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations_internal`
--

DROP TABLE IF EXISTS `congresses_instances_locations_internal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations_internal` (
  `congressInstanceLocationId` int unsigned NOT NULL,
  `externalLoc` int unsigned DEFAULT NULL,
  PRIMARY KEY (`congressInstanceLocationId`),
  KEY `externalLoc` (`externalLoc`),
  CONSTRAINT `congresses_instances_locations_internal_ibfk_1` FOREIGN KEY (`congressInstanceLocationId`) REFERENCES `congresses_instances_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_locations_internal_ibfk_2` FOREIGN KEY (`externalLoc`) REFERENCES `congresses_instances_locations_external` (`congressInstanceLocationId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations_openHours`
--

DROP TABLE IF EXISTS `congresses_instances_locations_openHours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations_openHours` (
  `congressInstanceLocationId` int unsigned NOT NULL,
  `date` date NOT NULL,
  `openTime` time NOT NULL,
  `closeTime` time NOT NULL,
  PRIMARY KEY (`congressInstanceLocationId`,`date`,`openTime`),
  KEY `closeTime` (`closeTime`),
  KEY `openTime` (`openTime`),
  KEY `date` (`date`),
  CONSTRAINT `congresses_instances_locations_openHours_ibfk_1` FOREIGN KEY (`congressInstanceLocationId`) REFERENCES `congresses_instances_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_locations_tags`
--

DROP TABLE IF EXISTS `congresses_instances_locations_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_locations_tags` (
  `congressInstanceLocationId` int unsigned NOT NULL,
  `congressInstanceLocationTagId` int unsigned NOT NULL,
  PRIMARY KEY (`congressInstanceLocationId`,`congressInstanceLocationTagId`),
  KEY `congressInstanceLocationTagId` (`congressInstanceLocationTagId`),
  CONSTRAINT `congresses_instances_locations_tags_ibfk_1` FOREIGN KEY (`congressInstanceLocationId`) REFERENCES `congresses_instances_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_locations_tags_ibfk_2` FOREIGN KEY (`congressInstanceLocationTagId`) REFERENCES `congresses_instances_locationTags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_participants`
--

DROP TABLE IF EXISTS `congresses_instances_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_participants` (
  `congressInstanceId` int unsigned NOT NULL,
  `dataId` binary(12) NOT NULL,
  `codeholderId` int unsigned DEFAULT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT '0',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sequenceId` int DEFAULT NULL,
  `price` int unsigned DEFAULT NULL,
  `cancelledTime` bigint unsigned DEFAULT NULL,
  `checkInTime` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`congressInstanceId`,`dataId`) USING BTREE,
  UNIQUE KEY `congressInstanceId` (`congressInstanceId`,`sequenceId`),
  UNIQUE KEY `congressInstanceId_2` (`congressInstanceId`,`codeholderId`),
  KEY `dataId` (`dataId`),
  KEY `approved` (`approved`),
  KEY `price` (`price`),
  KEY `cancelledTime` (`cancelledTime`),
  KEY `codeholderId` (`codeholderId`) USING BTREE,
  KEY `checkInTime` (`checkInTime`),
  FULLTEXT KEY `notes` (`notes`),
  CONSTRAINT `congresses_instances_participants_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_participants_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_participants_ibfk_3` FOREIGN KEY (`dataId`) REFERENCES `forms_data` (`dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `delete_forms_data` AFTER DELETE ON `congresses_instances_participants` FOR EACH ROW DELETE FROM `forms_data` WHERE `dataId` = OLD.`dataId` */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `congresses_instances_participants_customFormVars`
--

DROP TABLE IF EXISTS `congresses_instances_participants_customFormVars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_participants_customFormVars` (
  `congressInstanceId` int unsigned NOT NULL,
  `dataId` binary(12) NOT NULL,
  `name` varchar(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` json DEFAULT NULL,
  PRIMARY KEY (`dataId`,`name`) USING BTREE,
  KEY `congressInstanceId` (`congressInstanceId`,`name`),
  CONSTRAINT `congresses_instances_participants_customFormVars_ibfk_2` FOREIGN KEY (`congressInstanceId`, `name`) REFERENCES `congresses_instances_registrationForm_customFormVars` (`congressInstanceId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_participants_customFormVars_ibfk_3` FOREIGN KEY (`dataId`) REFERENCES `congresses_instances_participants` (`dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_programTags`
--

DROP TABLE IF EXISTS `congresses_instances_programTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_programTags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `congressInstanceId` int unsigned NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `congressInstanceId` (`congressInstanceId`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `congresses_instances_programTags_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_programs`
--

DROP TABLE IF EXISTS `congresses_instances_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_programs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `congressInstanceId` int unsigned NOT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timeFrom` bigint unsigned NOT NULL,
  `timeTo` bigint unsigned NOT NULL,
  `location` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `congressInstanceId` (`congressInstanceId`),
  KEY `title` (`title`),
  KEY `timeFrom` (`timeFrom`),
  KEY `timeTo` (`timeTo`),
  KEY `location` (`location`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `title_2` (`title`),
  CONSTRAINT `congresses_instances_programs_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_programs_ibfk_2` FOREIGN KEY (`location`) REFERENCES `congresses_instances_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_programs_tags`
--

DROP TABLE IF EXISTS `congresses_instances_programs_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_programs_tags` (
  `congressInstanceProgramId` int unsigned NOT NULL,
  `congressInstanceProgramTagId` int unsigned NOT NULL,
  PRIMARY KEY (`congressInstanceProgramId`,`congressInstanceProgramTagId`),
  KEY `congressInstanceProgramTagId` (`congressInstanceProgramTagId`),
  CONSTRAINT `congresses_instances_programs_tags_ibfk_1` FOREIGN KEY (`congressInstanceProgramTagId`) REFERENCES `congresses_instances_programTags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_programs_tags_ibfk_2` FOREIGN KEY (`congressInstanceProgramId`) REFERENCES `congresses_instances_programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `congresses_instances_registrationForm`
--

DROP TABLE IF EXISTS `congresses_instances_registrationForm`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_registrationForm` (
  `congressInstanceId` int unsigned NOT NULL,
  `allowUse` tinyint(1) NOT NULL DEFAULT '1',
  `allowGuests` tinyint(1) NOT NULL DEFAULT '0',
  `editable` tinyint(1) NOT NULL DEFAULT '1',
  `cancellable` tinyint(1) NOT NULL DEFAULT '1',
  `manualApproval` tinyint(1) NOT NULL DEFAULT '0',
  `sequenceIds_startAt` int DEFAULT NULL,
  `sequenceIds_requireValid` tinyint(1) DEFAULT NULL,
  `price_currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_var` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_minUpfront` int unsigned DEFAULT NULL,
  `confirmationNotifTemplateId` int unsigned DEFAULT NULL,
  `formId` int unsigned NOT NULL,
  `form` json NOT NULL,
  `identifierName` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifierEmail` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifierCountryCode` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`congressInstanceId`),
  UNIQUE KEY `formId` (`formId`),
  KEY `confirmationNotifTemplateId` (`confirmationNotifTemplateId`),
  CONSTRAINT `congresses_instances_registrationForm_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_registrationForm_ibfk_2` FOREIGN KEY (`formId`) REFERENCES `forms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `congresses_instances_registrationForm_ibfk_3` FOREIGN KEY (`confirmationNotifTemplateId`) REFERENCES `notif_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `delete_form` AFTER DELETE ON `congresses_instances_registrationForm` FOR EACH ROW DELETE FROM `forms` WHERE `id` = OLD.formId */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `congresses_instances_registrationForm_customFormVars`
--

DROP TABLE IF EXISTS `congresses_instances_registrationForm_customFormVars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `congresses_instances_registrationForm_customFormVars` (
  `congressInstanceId` int unsigned NOT NULL,
  `name` varchar(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `default` json DEFAULT NULL,
  PRIMARY KEY (`congressInstanceId`,`name`),
  CONSTRAINT `congresses_instances_registrationForm_customFormVars_ibfk_1` FOREIGN KEY (`congressInstanceId`) REFERENCES `congresses_instances_registrationForm` (`congressInstanceId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `name_eo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_fr` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_es` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_nl` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_pt` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_sk` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_zh` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_de` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`),
  KEY `enabled` (`enabled`),
  FULLTEXT KEY `name` (`name_eo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `countries_groups`
--

DROP TABLE IF EXISTS `countries_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries_groups` (
  `code` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`code`),
  FULLTEXT KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `countries_groups_members`
--

DROP TABLE IF EXISTS `countries_groups_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries_groups_members` (
  `group_code` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `country_code` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`group_code`,`country_code`),
  KEY `country_code` (`country_code`),
  CONSTRAINT `countries_groups_members_ibfk_1` FOREIGN KEY (`group_code`) REFERENCES `countries_groups` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `countries_groups_members_ibfk_2` FOREIGN KEY (`country_code`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delegations_applications`
--

DROP TABLE IF EXISTS `delegations_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegations_applications` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `codeholderId` int unsigned NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `subjects` json NOT NULL,
  `hosting` json DEFAULT NULL,
  `tos_docDataProtectionUEA` tinyint(1) NOT NULL,
  `tos_docDelegatesUEA` tinyint(1) NOT NULL,
  `tos_docDelegatesDataProtectionUEA` tinyint(1) NOT NULL,
  `tos_paperAnnualBook` tinyint(1) NOT NULL,
  `applicantNotes` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `internalNotes` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` bigint unsigned NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `statusTime` bigint unsigned DEFAULT NULL,
  `statusBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `time` (`time`),
  KEY `status` (`status`),
  KEY `codeholderId` (`codeholderId`),
  KEY `statusBy` (`statusBy`),
  KEY `statusTime` (`statusTime`),
  FULLTEXT KEY `internalNotes` (`internalNotes`),
  CONSTRAINT `delegations_applications_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delegations_applications_cities`
--

DROP TABLE IF EXISTS `delegations_applications_cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegations_applications_cities` (
  `id` int unsigned NOT NULL,
  `city` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`,`city`),
  CONSTRAINT `delegations_applications_cities_ibfk_1` FOREIGN KEY (`id`) REFERENCES `delegations_applications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delegations_subjects`
--

DROP TABLE IF EXISTS `delegations_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delegations_subjects` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  FULLTEXT KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms`
--

DROP TABLE IF EXISTS `forms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data`
--

DROP TABLE IF EXISTS `forms_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data` (
  `formId` int unsigned NOT NULL,
  `dataId` binary(12) NOT NULL,
  `createdTime` bigint unsigned NOT NULL,
  `editedTime` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`formId`,`dataId`),
  KEY `createdTime` (`createdTime`),
  KEY `editedTime` (`editedTime`),
  KEY `dataId` (`dataId`),
  CONSTRAINT `forms_data_ibfk_1` FOREIGN KEY (`formId`) REFERENCES `forms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_boolean`
--

DROP TABLE IF EXISTS `forms_data_fields_boolean`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_boolean` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_boolean_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_boolean_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_boolean_table`
--

DROP TABLE IF EXISTS `forms_data_fields_boolean_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_boolean_table` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` json DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_boolean_table_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_boolean_table_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_country`
--

DROP TABLE IF EXISTS `forms_data_fields_country`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_country` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_country_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_country_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_date`
--

DROP TABLE IF EXISTS `forms_data_fields_date`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_date` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` date DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_date_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_date_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_datetime`
--

DROP TABLE IF EXISTS `forms_data_fields_datetime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_datetime` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_datetime_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_datetime_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_enum`
--

DROP TABLE IF EXISTS `forms_data_fields_enum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_enum` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_enum_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_enum_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_money`
--

DROP TABLE IF EXISTS `forms_data_fields_money`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_money` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` int unsigned DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_money_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_money_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_number`
--

DROP TABLE IF EXISTS `forms_data_fields_number`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_number` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` float DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_number_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_number_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_text`
--

DROP TABLE IF EXISTS `forms_data_fields_text`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_text` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` varchar(8192) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `formId` (`formId`,`dataId`),
  FULLTEXT KEY `value` (`value`),
  CONSTRAINT `forms_data_fields_text_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_text_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_data_fields_time`
--

DROP TABLE IF EXISTS `forms_data_fields_time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_data_fields_time` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataId` binary(12) NOT NULL,
  `value` time DEFAULT NULL,
  PRIMARY KEY (`formId`,`name`,`dataId`),
  KEY `value` (`value`),
  KEY `formId` (`formId`,`dataId`),
  CONSTRAINT `forms_data_fields_time_ibfk_1` FOREIGN KEY (`formId`, `name`) REFERENCES `forms_fields` (`formId`, `name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `forms_data_fields_time_ibfk_2` FOREIGN KEY (`formId`, `dataId`) REFERENCES `forms_data` (`formId`, `dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `forms_fields`
--

DROP TABLE IF EXISTS `forms_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forms_fields` (
  `formId` int unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`formId`,`name`),
  KEY `type` (`type`),
  CONSTRAINT `forms_fields_ibfk_1` FOREIGN KEY (`formId`) REFERENCES `forms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `httpLog`
--

DROP TABLE IF EXISTS `httpLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `httpLog` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `time` bigint unsigned NOT NULL,
  `codeholderId` int unsigned DEFAULT NULL,
  `apiKey` binary(16) DEFAULT NULL,
  `ip` varbinary(16) NOT NULL,
  `origin` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgentParsed` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `query` json NOT NULL,
  `resStatus` smallint NOT NULL,
  `resTime` decimal(9,3) NOT NULL,
  `resLocation` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
  FULLTEXT KEY `userAgentParsed` (`userAgentParsed`),
  CONSTRAINT `httpLog_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `httpLog_ibfk_2` FOREIGN KEY (`apiKey`) REFERENCES `clients` (`apiKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `intermediaries`
--

DROP TABLE IF EXISTS `intermediaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intermediaries` (
  `countryCode` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `arrIndex` tinyint NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `paymentDescription` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`countryCode`,`arrIndex`) USING BTREE,
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `intermediaries_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `intermediaries_ibfk_2` FOREIGN KEY (`countryCode`) REFERENCES `countries` (`code`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lists`
--

DROP TABLE IF EXISTS `lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lists` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filters` json NOT NULL,
  `memberFilter` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines`
--

DROP TABLE IF EXISTS `magazines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issn` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscribers` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_editions`
--

DROP TABLE IF EXISTS `magazines_editions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_editions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `magazineId` int unsigned NOT NULL,
  `idHuman` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `subscribers` json DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `date` (`date`),
  KEY `magazineId` (`magazineId`),
  KEY `published` (`published`),
  FULLTEXT KEY `idHuman` (`idHuman`),
  FULLTEXT KEY `description` (`description`),
  CONSTRAINT `magazines_editions_ibfk_1` FOREIGN KEY (`magazineId`) REFERENCES `magazines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_editions_files`
--

DROP TABLE IF EXISTS `magazines_editions_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_editions_files` (
  `magazineId` int unsigned NOT NULL,
  `editionId` int unsigned NOT NULL,
  `format` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `downloads` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`magazineId`,`editionId`,`format`),
  KEY `downloads` (`downloads`),
  CONSTRAINT `magazines_editions_files_ibfk_1` FOREIGN KEY (`magazineId`, `editionId`) REFERENCES `magazines_editions` (`magazineId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_editions_toc`
--

DROP TABLE IF EXISTS `magazines_editions_toc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_editions_toc` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `magazineId` int unsigned NOT NULL,
  `editionId` int unsigned NOT NULL,
  `page` int unsigned NOT NULL,
  `title` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recitationAuthor` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `highlighted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `page` (`page`),
  KEY `author` (`author`),
  KEY `highlighted` (`highlighted`),
  KEY `magazineId` (`magazineId`,`editionId`),
  KEY `title` (`title`),
  KEY `recitationAuthor` (`recitationAuthor`),
  FULLTEXT KEY `text` (`text`),
  FULLTEXT KEY `title_2` (`title`),
  FULLTEXT KEY `author_2` (`author`),
  FULLTEXT KEY `recitationAuthor_2` (`recitationAuthor`),
  CONSTRAINT `magazines_editions_toc_ibfk_1` FOREIGN KEY (`magazineId`, `editionId`) REFERENCES `magazines_editions` (`magazineId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_editions_toc_recitations`
--

DROP TABLE IF EXISTS `magazines_editions_toc_recitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_editions_toc_recitations` (
  `tocEntryId` int unsigned NOT NULL,
  `format` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `downloads` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`tocEntryId`,`format`),
  KEY `downloads` (`downloads`),
  CONSTRAINT `magazines_editions_toc_recitations_ibfk_1` FOREIGN KEY (`tocEntryId`) REFERENCES `magazines_editions_toc` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_paperAccessSnapshots`
--

DROP TABLE IF EXISTS `magazines_paperAccessSnapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_paperAccessSnapshots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `magazineId` int unsigned NOT NULL,
  `editionId` int unsigned NOT NULL,
  `time` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `magazineId` (`magazineId`,`editionId`),
  CONSTRAINT `magazines_paperAccessSnapshots_ibfk_1` FOREIGN KEY (`magazineId`, `editionId`) REFERENCES `magazines_editions` (`magazineId`, `id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_paperAccessSnapshots_codeholders`
--

DROP TABLE IF EXISTS `magazines_paperAccessSnapshots_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_paperAccessSnapshots_codeholders` (
  `snapshotId` bigint unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  PRIMARY KEY (`snapshotId`,`codeholderId`),
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `magazines_paperAccessSnapshots_codeholders_ibfk_1` FOREIGN KEY (`snapshotId`) REFERENCES `magazines_paperAccessSnapshots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `magazines_paperAccessSnapshots_codeholders_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `magazines_subscriptions`
--

DROP TABLE IF EXISTS `magazines_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `magazines_subscriptions` (
  `id` binary(15) NOT NULL,
  `magazineId` int unsigned NOT NULL,
  `year` year DEFAULT NULL,
  `codeholderId` int unsigned NOT NULL,
  `createdTime` bigint unsigned NOT NULL,
  `paperVersion` tinyint(1) NOT NULL DEFAULT '0',
  `internalNotes` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `magazineId` (`magazineId`,`year`,`codeholderId`,`paperVersion`) USING BTREE,
  KEY `createdTime` (`createdTime`),
  KEY `year` (`year`),
  KEY `codeholderId` (`codeholderId`),
  KEY `paperVersion` (`paperVersion`),
  FULLTEXT KEY `internalNotes` (`internalNotes`),
  CONSTRAINT `magazines_subscriptions_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `magazines_subscriptions_ibfk_2` FOREIGN KEY (`magazineId`) REFERENCES `magazines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membershipCategories`
--

DROP TABLE IF EXISTS `membershipCategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membershipCategories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nameAbbrev` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `givesMembership` tinyint(1) NOT NULL DEFAULT '1',
  `lifetime` tinyint(1) NOT NULL DEFAULT '0',
  `availableFrom` year DEFAULT NULL,
  `availableTo` year DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `name` (`name`),
  KEY `nameAbbrev` (`nameAbbrev`) USING BTREE,
  KEY `givesMembership` (`givesMembership`),
  KEY `lifetime` (`lifetime`),
  KEY `availableFrom` (`availableFrom`),
  KEY `availableTo` (`availableTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membershipCategories_codeholders`
--

DROP TABLE IF EXISTS `membershipCategories_codeholders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membershipCategories_codeholders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `categoryId` int unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `year` year NOT NULL COMMENT 'For lifetime validity, this is the year it started being valid',
  `canuto` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `categoryId` (`categoryId`,`codeholderId`,`year`),
  KEY `codeholderId` (`codeholderId`),
  KEY `canuto` (`canuto`),
  CONSTRAINT `membershipCategories_codeholders_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `membershipCategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `membershipCategories_codeholders_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newsletters`
--

DROP TABLE IF EXISTS `newsletters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `name` (`name`),
  KEY `public` (`public`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newsletters_subscribers`
--

DROP TABLE IF EXISTS `newsletters_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletters_subscribers` (
  `newsletterId` int unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `time` bigint unsigned NOT NULL,
  PRIMARY KEY (`newsletterId`,`codeholderId`),
  KEY `time` (`time`),
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `newsletters_subscribers_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `newsletters_subscribers_ibfk_2` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `newsletters_unsubscriptions`
--

DROP TABLE IF EXISTS `newsletters_unsubscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletters_unsubscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `newsletterId` int unsigned NOT NULL,
  `time` bigint unsigned NOT NULL,
  `reason` tinyint unsigned DEFAULT '0',
  `description` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscriberCount` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reason` (`reason`),
  KEY `newsletterId` (`newsletterId`),
  KEY `time` (`time`),
  CONSTRAINT `newsletters_unsubscriptions_ibfk_1` FOREIGN KEY (`newsletterId`) REFERENCES `newsletters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notif_templates`
--

DROP TABLE IF EXISTS `notif_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notif_templates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `base` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intent` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `script` json DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `from` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fromName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `replyTo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `html` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `modules` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `base` (`base`),
  KEY `org` (`org`),
  KEY `name` (`name`),
  KEY `intent` (`intent`),
  KEY `subject` (`subject`),
  KEY `from` (`from`),
  KEY `fromName` (`fromName`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`),
  FULLTEXT KEY `subject_2` (`subject`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_addons`
--

DROP TABLE IF EXISTS `pay_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_addons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `paymentOrgId` smallint unsigned NOT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orgId` (`paymentOrgId`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `pay_addons_ibfk_1` FOREIGN KEY (`paymentOrgId`) REFERENCES `pay_orgs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents`
--

DROP TABLE IF EXISTS `pay_intents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents` (
  `id` binary(15) NOT NULL,
  `codeholderId` int unsigned DEFAULT NULL,
  `customer_email` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentOrgId` smallint unsigned DEFAULT NULL,
  `paymentMethodId` int unsigned DEFAULT NULL,
  `paymentMethod` json NOT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `timeCreated` bigint unsigned NOT NULL,
  `createdBy` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `statusTime` bigint unsigned NOT NULL,
  `succeededTime` bigint unsigned DEFAULT NULL,
  `refundedTime` bigint unsigned DEFAULT NULL,
  `internalNotes` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customerNotes` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foreignId` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripePaymentIntentId` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripeClientSecret` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripeSecretKey` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amountRefunded` int unsigned NOT NULL DEFAULT '0',
  `intermediaryCountryCode` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intermediaryIdentifier_year` year DEFAULT NULL,
  `intermediaryIdentifier_number` smallint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stripePaymentIntentId` (`stripePaymentIntentId`),
  KEY `codeholderId` (`codeholderId`),
  KEY `customer_email` (`customer_email`),
  KEY `customer_name` (`customer_name`),
  KEY `paymentMethodId` (`paymentMethodId`),
  KEY `currency` (`currency`),
  KEY `status` (`status`),
  KEY `timeCreated` (`timeCreated`),
  KEY `foreignId` (`foreignId`),
  KEY `org` (`org`),
  KEY `amountRefunded` (`amountRefunded`),
  KEY `statusTime` (`statusTime`),
  KEY `paymentOrgId` (`paymentOrgId`),
  KEY `succeededTime` (`succeededTime`),
  KEY `refundedTime` (`refundedTime`),
  KEY `createdBy` (`createdBy`),
  KEY `intermediaryCountryCode` (`intermediaryCountryCode`),
  KEY `intermediaryIdentifier_year` (`intermediaryIdentifier_year`),
  KEY `intermediaryIdentifier_number` (`intermediaryIdentifier_number`),
  FULLTEXT KEY `internalNotes` (`internalNotes`),
  FULLTEXT KEY `customerNotes` (`customerNotes`),
  FULLTEXT KEY `customer_email_2` (`customer_email`),
  FULLTEXT KEY `customer_name_2` (`customer_name`),
  CONSTRAINT `pay_intents_ibfk_1` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_ibfk_2` FOREIGN KEY (`paymentMethodId`) REFERENCES `pay_methods` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_ibfk_3` FOREIGN KEY (`paymentOrgId`) REFERENCES `pay_orgs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_ibfk_4` FOREIGN KEY (`intermediaryCountryCode`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_events`
--

DROP TABLE IF EXISTS `pay_intents_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `paymentIntentId` binary(15) NOT NULL,
  `time` bigint unsigned NOT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `paymentIntentId` (`paymentIntentId`),
  CONSTRAINT `pay_intents_events_ibfk_1` FOREIGN KEY (`paymentIntentId`) REFERENCES `pay_intents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes`
--

DROP TABLE IF EXISTS `pay_intents_purposes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invalid` tinyint(1) NOT NULL DEFAULT '0',
  `amount` bigint NOT NULL,
  `originalAmount` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `type` (`type`),
  KEY `amount` (`amount`),
  KEY `originalAmount` (`originalAmount`),
  KEY `invalid` (`invalid`),
  CONSTRAINT `pay_intents_purposes_ibfk_1` FOREIGN KEY (`paymentIntentId`) REFERENCES `pay_intents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes_addon`
--

DROP TABLE IF EXISTS `pay_intents_purposes_addon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes_addon` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `paymentAddonId` int unsigned DEFAULT NULL,
  `paymentAddon` json NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `paymentAddonId` (`paymentAddonId`),
  CONSTRAINT `pay_intents_purposes_addon_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_purposes_addon_ibfk_2` FOREIGN KEY (`paymentAddonId`) REFERENCES `pay_addons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes_manual`
--

DROP TABLE IF EXISTS `pay_intents_purposes_manual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes_manual` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  CONSTRAINT `pay_intents_purposes_manual_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes_trigger`
--

DROP TABLE IF EXISTS `pay_intents_purposes_trigger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes_trigger` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `triggers` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `triggerAmount_amount` int unsigned DEFAULT NULL,
  `triggerAmount_currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `triggers` (`triggers`),
  KEY `triggerAmount_amount` (`triggerAmount_amount`),
  KEY `triggerAmount_currency` (`triggerAmount_currency`),
  CONSTRAINT `pay_intents_purposes_trigger_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes_trigger_congress_registration`
--

DROP TABLE IF EXISTS `pay_intents_purposes_trigger_congress_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes_trigger_congress_registration` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `dataId` binary(12) NOT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `dataId` (`dataId`),
  CONSTRAINT `pay_intents_purposes_trigger_congress_registration_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes_trigger` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_purposes_trigger_congress_registration_ibfk_2` FOREIGN KEY (`dataId`) REFERENCES `forms_data` (`dataId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_intents_purposes_trigger_registration_entry`
--

DROP TABLE IF EXISTS `pay_intents_purposes_trigger_registration_entry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_intents_purposes_trigger_registration_entry` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `registrationEntryId` binary(15) NOT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `registrationEntryId` (`registrationEntryId`),
  CONSTRAINT `pay_intents_purposes_trigger_registration_entry_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes_trigger` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pay_intents_purposes_trigger_registration_entry_ibfk_2` FOREIGN KEY (`registrationEntryId`) REFERENCES `registration_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_methods`
--

DROP TABLE IF EXISTS `pay_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_methods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `paymentOrgId` smallint unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripeMethods` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `internalDescription` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(5000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descriptionPreview` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `internal` tinyint(1) NOT NULL DEFAULT '0',
  `currencies` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentValidity` int unsigned DEFAULT NULL,
  `maxAmount` int unsigned DEFAULT NULL,
  `isRecommended` tinyint(1) NOT NULL DEFAULT '0',
  `feePercent` float DEFAULT NULL,
  `feeFixed_val` smallint unsigned DEFAULT NULL,
  `feeFixed_cur` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripeSecretKey` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripePublishableKey` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prices` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orgId` (`paymentOrgId`),
  KEY `type` (`type`),
  KEY `paymentValidity` (`paymentValidity`),
  KEY `isRecommended` (`isRecommended`),
  KEY `internal` (`internal`),
  FULLTEXT KEY `internalDescription` (`internalDescription`),
  FULLTEXT KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `descriptionPreview` (`descriptionPreview`),
  CONSTRAINT `pay_methods_ibfk_1` FOREIGN KEY (`paymentOrgId`) REFERENCES `pay_orgs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_orgs`
--

DROP TABLE IF EXISTS `pay_orgs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_orgs` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `name` (`name`) USING BTREE,
  FULLTEXT KEY `description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_stripe_webhooks`
--

DROP TABLE IF EXISTS `pay_stripe_webhooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_stripe_webhooks` (
  `stripeSecretKey` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripeId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apiVersion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabledEvents` varchar(3072) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`stripeSecretKey`),
  UNIQUE KEY `stripeId` (`stripeId`),
  KEY `apiVersion` (`apiVersion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pay_triggerHist`
--

DROP TABLE IF EXISTS `pay_triggerHist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_triggerHist` (
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  `amountTriggered` int unsigned NOT NULL,
  `currencyTriggered` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `time` bigint unsigned NOT NULL,
  PRIMARY KEY (`paymentIntentId`,`pos`),
  KEY `time` (`time`),
  KEY `amountTriggered` (`amountTriggered`),
  KEY `currencyTriggered` (`currencyTriggered`),
  CONSTRAINT `pay_triggerHist_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes_trigger` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_entries`
--

DROP TABLE IF EXISTS `registration_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_entries` (
  `id` binary(15) NOT NULL,
  `year` year DEFAULT NULL,
  `intermediary` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'submitted',
  `pendingIssue_what` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pendingIssue_where` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fishyIsOkay` tinyint(1) NOT NULL DEFAULT '0',
  `newCodeholderId` int unsigned DEFAULT NULL,
  `timeSubmitted` bigint unsigned NOT NULL,
  `timeStatus` bigint unsigned DEFAULT NULL,
  `internalNotes` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `year` (`year`),
  KEY `status` (`status`),
  KEY `newCodeholderId` (`newCodeholderId`),
  KEY `timeSubmitted` (`timeSubmitted`),
  KEY `timeStatus` (`timeStatus`),
  KEY `currency` (`currency`),
  KEY `intermediary` (`intermediary`),
  FULLTEXT KEY `internalNotes` (`internalNotes`),
  CONSTRAINT `registration_entries_ibfk_1` FOREIGN KEY (`newCodeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_ibfk_2` FOREIGN KEY (`year`) REFERENCES `registration_options` (`year`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_ibfk_3` FOREIGN KEY (`intermediary`) REFERENCES `countries` (`code`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_entries_codeholderData_id`
--

DROP TABLE IF EXISTS `registration_entries_codeholderData_id`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_entries_codeholderData_id` (
  `registrationEntryId` binary(15) NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  PRIMARY KEY (`registrationEntryId`),
  KEY `codeholderId` (`codeholderId`),
  CONSTRAINT `registration_entries_codeholderData_id_ibfk_1` FOREIGN KEY (`registrationEntryId`) REFERENCES `registration_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_codeholderData_id_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_entries_codeholderData_obj`
--

DROP TABLE IF EXISTS `registration_entries_codeholderData_obj`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_entries_codeholderData_obj` (
  `registrationEntryId` binary(15) NOT NULL,
  `address_country` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_countryArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_city` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_cityArea` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_streetAddress` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_postalCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_sortingCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feeCountry` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firstNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `lastName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastNameLegal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `honorific` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birthdate` date NOT NULL,
  `cellphone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`registrationEntryId`),
  KEY `address_country` (`address_country`),
  KEY `feeCountry` (`feeCountry`),
  KEY `email` (`email`),
  KEY `birthdate` (`birthdate`),
  CONSTRAINT `registration_entries_codeholderData_obj_ibfk_1` FOREIGN KEY (`address_country`) REFERENCES `countries` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_codeholderData_obj_ibfk_2` FOREIGN KEY (`feeCountry`) REFERENCES `countries` (`code`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_codeholderData_obj_ibfk_3` FOREIGN KEY (`registrationEntryId`) REFERENCES `registration_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_entries_offers`
--

DROP TABLE IF EXISTS `registration_entries_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_entries_offers` (
  `registrationEntryId` binary(15) NOT NULL,
  `arrayId` tinyint unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` int unsigned NOT NULL,
  `membershipCategoryId` int unsigned DEFAULT NULL,
  `membershipCategory` json DEFAULT NULL,
  `magazineId` int unsigned DEFAULT NULL,
  `magazine` json DEFAULT NULL,
  `paperVersion` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`registrationEntryId`,`arrayId`),
  KEY `membershipCategoryId` (`membershipCategoryId`),
  KEY `magazineId` (`magazineId`),
  KEY `paperVersion` (`paperVersion`),
  CONSTRAINT `registration_entries_offers_ibfk_1` FOREIGN KEY (`registrationEntryId`) REFERENCES `registration_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_offers_ibfk_2` FOREIGN KEY (`membershipCategoryId`) REFERENCES `membershipCategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_offers_ibfk_3` FOREIGN KEY (`magazineId`) REFERENCES `magazines` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_entries_triggerHist_processed`
--

DROP TABLE IF EXISTS `registration_entries_triggerHist_processed`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_entries_triggerHist_processed` (
  `registrationEntryId` binary(15) NOT NULL,
  `paymentIntentId` binary(15) NOT NULL,
  `pos` smallint unsigned NOT NULL,
  PRIMARY KEY (`registrationEntryId`,`paymentIntentId`,`pos`),
  KEY `paymentIntentId` (`paymentIntentId`,`pos`),
  CONSTRAINT `registration_entries_triggerHist_processed_ibfk_1` FOREIGN KEY (`paymentIntentId`, `pos`) REFERENCES `pay_intents_purposes_trigger` (`paymentIntentId`, `pos`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_entries_triggerHist_processed_ibfk_2` FOREIGN KEY (`registrationEntryId`) REFERENCES `registration_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_options`
--

DROP TABLE IF EXISTS `registration_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_options` (
  `year` year NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '0',
  `paymentOrgId` smallint unsigned NOT NULL,
  `currency` char(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`year`),
  KEY `paymentOrgId` (`paymentOrgId`),
  KEY `currency` (`currency`),
  KEY `enabled` (`enabled`),
  CONSTRAINT `registration_options_ibfk_1` FOREIGN KEY (`paymentOrgId`) REFERENCES `pay_orgs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_options_offerGroups`
--

DROP TABLE IF EXISTS `registration_options_offerGroups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_options_offerGroups` (
  `year` year NOT NULL,
  `id` smallint unsigned NOT NULL,
  `title` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(4000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`year`,`id`),
  CONSTRAINT `registration_options_offerGroups_ibfk_1` FOREIGN KEY (`year`) REFERENCES `registration_options` (`year`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registration_options_offerGroups_offers`
--

DROP TABLE IF EXISTS `registration_options_offerGroups_offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_options_offerGroups_offers` (
  `year` year NOT NULL,
  `offerGroupId` smallint unsigned NOT NULL,
  `id` tinyint unsigned NOT NULL,
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `paymentAddonId` int unsigned DEFAULT NULL,
  `membershipCategoryId` int unsigned DEFAULT NULL,
  `magazineId` int unsigned DEFAULT NULL,
  `price_script` json DEFAULT NULL,
  `price_var` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price_description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paperVersion` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`year`,`offerGroupId`,`id`),
  KEY `paymentAddonId` (`paymentAddonId`),
  KEY `membershipCategoryId` (`membershipCategoryId`),
  KEY `magazineId` (`magazineId`),
  KEY `paperVersion` (`paperVersion`),
  CONSTRAINT `registration_options_offerGroups_offers_ibfk_1` FOREIGN KEY (`year`, `offerGroupId`) REFERENCES `registration_options_offerGroups` (`year`, `id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_options_offerGroups_offers_ibfk_2` FOREIGN KEY (`membershipCategoryId`) REFERENCES `membershipCategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_options_offerGroups_offers_ibfk_3` FOREIGN KEY (`paymentAddonId`) REFERENCES `pay_addons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `registration_options_offerGroups_offers_ibfk_4` FOREIGN KEY (`magazineId`) REFERENCES `magazines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `savedQueries`
--

DROP TABLE IF EXISTS `savedQueries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `savedQueries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category` varchar(63) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `query` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `view_codeholders`
--

DROP TABLE IF EXISTS `view_codeholders`;
/*!50001 DROP VIEW IF EXISTS `view_codeholders`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_codeholders` AS SELECT 
 1 AS `id`,
 1 AS `codeholderType`,
 1 AS `creationTime`,
 1 AS `oldCode`,
 1 AS `newCode`,
 1 AS `password`,
 1 AS `email`,
 1 AS `publicEmail`,
 1 AS `emailPublicity`,
 1 AS `enabled`,
 1 AS `feeCountry`,
 1 AS `publicCountry`,
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
 1 AS `addressPublicity`,
 1 AS `addressInvalid`,
 1 AS `notes`,
 1 AS `officePhone`,
 1 AS `officePhonePublicity`,
 1 AS `isDead`,
 1 AS `deathdate`,
 1 AS `profilePictureHash`,
 1 AS `firstName`,
 1 AS `firstNameLegal`,
 1 AS `lastName`,
 1 AS `lastNameLegal`,
 1 AS `lastNamePublicity`,
 1 AS `honorific`,
 1 AS `birthdate`,
 1 AS `age`,
 1 AS `agePrimo`,
 1 AS `profession`,
 1 AS `profilePicturePublicity`,
 1 AS `website`,
 1 AS `biography`,
 1 AS `landlinePhone`,
 1 AS `landlinePhonePublicity`,
 1 AS `cellphone`,
 1 AS `cellphonePublicity`,
 1 AS `fullName`,
 1 AS `fullNameLocal`,
 1 AS `careOf`,
 1 AS `nameAbbrev`,
 1 AS `mainDescriptor`,
 1 AS `factoids`,
 1 AS `searchNameHuman`,
 1 AS `searchNameOrg`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_congresses_instances_participants`
--

DROP TABLE IF EXISTS `view_congresses_instances_participants`;
/*!50001 DROP VIEW IF EXISTS `view_congresses_instances_participants`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_congresses_instances_participants` AS SELECT 
 1 AS `congressInstanceId`,
 1 AS `dataId`,
 1 AS `codeholderId`,
 1 AS `approved`,
 1 AS `notes`,
 1 AS `sequenceId`,
 1 AS `price`,
 1 AS `cancelledTime`,
 1 AS `checkInTime`,
 1 AS `amountPaid`,
 1 AS `hasPaidMinimum`,
 1 AS `isValid`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_congresses_instances_participants_metadata`
--

DROP TABLE IF EXISTS `view_congresses_instances_participants_metadata`;
/*!50001 DROP VIEW IF EXISTS `view_congresses_instances_participants_metadata`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_congresses_instances_participants_metadata` AS SELECT 
 1 AS `dataId`,
 1 AS `amountPaid`,
 1 AS `hasPaidMinimum`,
 1 AS `isValid`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_pay_intents_purposes`
--

DROP TABLE IF EXISTS `view_pay_intents_purposes`;
/*!50001 DROP VIEW IF EXISTS `view_pay_intents_purposes`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_pay_intents_purposes` AS SELECT 
 1 AS `paymentIntentId`,
 1 AS `pos`,
 1 AS `type`,
 1 AS `amount`,
 1 AS `originalAmount`,
 1 AS `invalid`,
 1 AS `paymentAddonId`,
 1 AS `paymentAddon`,
 1 AS `title`,
 1 AS `description`,
 1 AS `triggers`,
 1 AS `triggerAmount_amount`,
 1 AS `triggerAmount_currency`,
 1 AS `triggerStatus`,
 1 AS `trigger_congress_registration_dataId`,
 1 AS `trigger_registration_entry_registrationEntryId`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_pay_triggerable`
--

DROP TABLE IF EXISTS `view_pay_triggerable`;
/*!50001 DROP VIEW IF EXISTS `view_pay_triggerable`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_pay_triggerable` AS SELECT 
 1 AS `paymentIntentId`,
 1 AS `pos`,
 1 AS `amount`,
 1 AS `currency`,
 1 AS `triggers`,
 1 AS `triggerAmount_amount`,
 1 AS `triggerAmount_currency`,
 1 AS `targetCurrency`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_registration_entries_amountProcessed`
--

DROP TABLE IF EXISTS `view_registration_entries_amountProcessed`;
/*!50001 DROP VIEW IF EXISTS `view_registration_entries_amountProcessed`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_registration_entries_amountProcessed` AS SELECT 
 1 AS `registrationEntryId`,
 1 AS `amountProcessed`,
 1 AS `currency`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `view_registration_entries_processable`
--

DROP TABLE IF EXISTS `view_registration_entries_processable`;
/*!50001 DROP VIEW IF EXISTS `view_registration_entries_processable`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `view_registration_entries_processable` AS SELECT 
 1 AS `registrationEntryId`,
 1 AS `paymentIntentId`,
 1 AS `pos`,
 1 AS `amountTriggered`,
 1 AS `currencyTriggered`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `votes`
--

DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `results` json DEFAULT NULL,
  `hasResults` tinyint(1) GENERATED ALWAYS AS ((`results` is not null)) STORED,
  `tieBreakerBallot` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(10000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voterCodeholders` json NOT NULL,
  `voterCodeholdersMemberFilter` json NOT NULL,
  `viewerCodeholders` json DEFAULT NULL,
  `viewerCodeholdersMemberFilter` json DEFAULT NULL,
  `codeholdersSet` tinyint(1) NOT NULL DEFAULT '0',
  `timeStart` bigint unsigned NOT NULL,
  `timeEnd` bigint unsigned NOT NULL,
  `ballotsSecret` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `blankBallotsLimit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  `blankBallotsLimitInclusive` tinyint(1) NOT NULL DEFAULT '1',
  `quorum` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `quorumInclusive` tinyint(1) NOT NULL DEFAULT '1',
  `majorityBallots` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `majorityBallotsInclusive` tinyint(1) NOT NULL DEFAULT '1',
  `majorityVoters` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `majorityVotersInclusive` tinyint(1) NOT NULL DEFAULT '1',
  `majorityMustReachBoth` tinyint(1) NOT NULL DEFAULT '1',
  `numChosenOptions` tinyint unsigned NOT NULL DEFAULT '1',
  `mentionThreshold` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0',
  `mentionThresholdInclusive` tinyint(1) NOT NULL DEFAULT '1',
  `maxOptionsPerBallot` tinyint unsigned DEFAULT NULL,
  `tieBreakerCodeholder` int unsigned DEFAULT NULL,
  `publishVoters` tinyint(1) NOT NULL DEFAULT '0',
  `publishVotersPercentage` tinyint(1) NOT NULL DEFAULT '1',
  `publishResults` tinyint(1) NOT NULL DEFAULT '0',
  `options` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `name` (`name`),
  KEY `timeEnd` (`timeEnd`),
  KEY `timeStart` (`timeStart`),
  KEY `type` (`type`),
  KEY `votes_ibfk_1` (`tieBreakerCodeholder`),
  KEY `codeholdersSet` (`codeholdersSet`),
  KEY `hasResults` (`hasResults`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`),
  CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`tieBreakerCodeholder`) REFERENCES `codeholders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `votes_ballots`
--

DROP TABLE IF EXISTS `votes_ballots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes_ballots` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `voteId` int unsigned NOT NULL,
  `ballot` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `voteId` (`voteId`),
  CONSTRAINT `votes_ballots_ibfk_1` FOREIGN KEY (`voteId`) REFERENCES `votes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `votes_templates`
--

DROP TABLE IF EXISTS `votes_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes_templates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `org` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(2000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vote` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `org` (`org`),
  KEY `name` (`name`),
  FULLTEXT KEY `description` (`description`),
  FULLTEXT KEY `name_2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `votes_voters`
--

DROP TABLE IF EXISTS `votes_voters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `votes_voters` (
  `voteId` int unsigned NOT NULL,
  `codeholderId` int unsigned NOT NULL,
  `mayVote` tinyint(1) NOT NULL,
  `timeVoted` bigint unsigned DEFAULT NULL,
  `ballotId` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`voteId`,`codeholderId`),
  UNIQUE KEY `ballotId` (`ballotId`),
  KEY `time` (`timeVoted`),
  KEY `mayVote` (`mayVote`),
  KEY `votes_voters_ibfk_2` (`codeholderId`),
  CONSTRAINT `votes_voters_ibfk_1` FOREIGN KEY (`voteId`) REFERENCES `votes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `votes_voters_ibfk_2` FOREIGN KEY (`codeholderId`) REFERENCES `codeholders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `votes_voters_ibfk_3` FOREIGN KEY (`ballotId`) REFERENCES `votes_ballots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_expired_codeholders_createPassword` ON SCHEDULE EVERY 1 HOUR STARTS '2019-04-11 22:04:18' ON COMPLETION PRESERVE ENABLE COMMENT 'Removes older than 24 hours' DO begin

set @time_delta = 86400;

update codeholders set createPasswordTime = null, createPasswordKey = null where createPasswordTime < UNIX_TIMESTAMP() - @time_delta;

end */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `remove_expired_codeholders_notifAccounts_telegram` */;;
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
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_expired_codeholders_notifAccounts_telegram` ON SCHEDULE EVERY 1 HOUR STARTS '2022-08-05 11:17:11' ON COMPLETION PRESERVE ENABLE DO begin

set @time_delta = 3600; 

DELETE FROM codeholders_notifAccounts_telegram WHERE
telegram_chatId IS NULL
AND telegram_deepLink_time + @time_delta < UNIX_TIMESTAMP();

end */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `remove_expired_codeholders_totp_remember` */;;
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
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_expired_codeholders_totp_remember` ON SCHEDULE EVERY 12 HOUR STARTS '2019-05-10 19:46:20' ON COMPLETION PRESERVE ENABLE COMMENT 'Removes older than 60 days' DO begin

set @time_delta = 5184000;

delete from codeholders_totp_remember where time < UNIX_TIMESTAMP() - @time_delta;

end */ ;;
/*!50003 SET time_zone             = @saved_time_zone */ ;;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;;
/*!50003 SET character_set_client  = @saved_cs_client */ ;;
/*!50003 SET character_set_results = @saved_cs_results */ ;;
/*!50003 SET collation_connection  = @saved_col_connection */ ;;
/*!50106 DROP EVENT IF EXISTS `remove_old_codeholders_logins` */;;
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
/*!50106 CREATE*/ /*!50117 DEFINER=`root`@`localhost`*/ /*!50106 EVENT `remove_old_codeholders_logins` ON SCHEDULE EVERY 1 DAY STARTS '2019-05-09 20:46:51' ON COMPLETION PRESERVE ENABLE COMMENT 'Removes older than 60 days' DO begin

set @time_delta = 5184000; 

delete from codeholders_logins where time < UNIX_TIMESTAMP() - @time_delta;

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
/*!50001 VIEW `view_codeholders` AS select `codeholders`.`id` AS `id`,`codeholders`.`codeholderType` AS `codeholderType`,`codeholders`.`creationTime` AS `creationTime`,`codeholders`.`oldCode` AS `oldCode`,`codeholders`.`newCode` AS `newCode`,`codeholders`.`password` AS `password`,`codeholders`.`email` AS `email`,`codeholders`.`publicEmail` AS `publicEmail`,`codeholders`.`emailPublicity` AS `emailPublicity`,`codeholders`.`enabled` AS `enabled`,`codeholders`.`feeCountry` AS `feeCountry`,`codeholders`.`publicCountry` AS `publicCountry`,`codeholders_address`.`country` AS `address_country`,`codeholders_address`.`countryArea` AS `address_countryArea`,`codeholders_address`.`countryArea_latin` AS `address_countryArea_latin`,`codeholders_address`.`city` AS `address_city`,`codeholders_address`.`city_latin` AS `address_city_latin`,`codeholders_address`.`cityArea` AS `address_cityArea`,`codeholders_address`.`cityArea_latin` AS `address_cityArea_latin`,`codeholders_address`.`streetAddress` AS `address_streetAddress`,`codeholders_address`.`streetAddress_latin` AS `address_streetAddress_latin`,`codeholders_address`.`postalCode` AS `address_postalCode`,`codeholders_address`.`postalCode_latin` AS `address_postalCode_latin`,`codeholders_address`.`sortingCode` AS `address_sortingCode`,`codeholders_address`.`sortingCode_latin` AS `address_sortingCode_latin`,`codeholders_address`.`search` AS `address_search`,`codeholders`.`addressPublicity` AS `addressPublicity`,`codeholders`.`addressInvalid` AS `addressInvalid`,`codeholders`.`notes` AS `notes`,`codeholders`.`officePhone` AS `officePhone`,`codeholders`.`officePhonePublicity` AS `officePhonePublicity`,`codeholders`.`isDead` AS `isDead`,`codeholders`.`deathdate` AS `deathdate`,`codeholders`.`profilePictureHash` AS `profilePictureHash`,`codeholders_human`.`firstName` AS `firstName`,`codeholders_human`.`firstNameLegal` AS `firstNameLegal`,`codeholders_human`.`lastName` AS `lastName`,`codeholders_human`.`lastNameLegal` AS `lastNameLegal`,`codeholders_human`.`lastNamePublicity` AS `lastNamePublicity`,`codeholders_human`.`honorific` AS `honorific`,`codeholders_human`.`birthdate` AS `birthdate`,if(((0 <> `codeholders`.`isDead`) and (0 = `codeholders`.`deathdate`)),NULL,timestampdiff(YEAR,`codeholders_human`.`birthdate`,if(`codeholders`.`deathdate`,`codeholders`.`deathdate`,now()))) AS `age`,if(((0 <> `codeholders`.`isDead`) and (0 = `codeholders`.`deathdate`)),NULL,timestampdiff(YEAR,`codeholders_human`.`birthdate`,makedate(year(if(`codeholders`.`deathdate`,`codeholders`.`deathdate`,now())),1))) AS `agePrimo`,`codeholders_human`.`profession` AS `profession`,`codeholders`.`profilePicturePublicity` AS `profilePicturePublicity`,`codeholders`.`website` AS `website`,`codeholders`.`biography` AS `biography`,`codeholders_human`.`landlinePhone` AS `landlinePhone`,`codeholders_human`.`landlinePhonePublicity` AS `landlinePhonePublicity`,`codeholders_human`.`cellphone` AS `cellphone`,`codeholders_human`.`cellphonePublicity` AS `cellphonePublicity`,`codeholders_org`.`fullName` AS `fullName`,`codeholders_org`.`fullNameLocal` AS `fullNameLocal`,`codeholders_org`.`careOf` AS `careOf`,`codeholders_org`.`nameAbbrev` AS `nameAbbrev`,`codeholders_org`.`mainDescriptor` AS `mainDescriptor`,`codeholders_org`.`factoids` AS `factoids`,`codeholders_human`.`searchName` AS `searchNameHuman`,`codeholders_org`.`searchName` AS `searchNameOrg` from (((`codeholders` left join `codeholders_human` on((`codeholders`.`id` = `codeholders_human`.`codeholderId`))) left join `codeholders_org` on((`codeholders`.`id` = `codeholders_org`.`codeholderId`))) left join `codeholders_address` on((`codeholders`.`id` = `codeholders_address`.`codeholderId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_congresses_instances_participants`
--

/*!50001 DROP VIEW IF EXISTS `view_congresses_instances_participants`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_congresses_instances_participants` AS select `p`.`congressInstanceId` AS `congressInstanceId`,`p`.`dataId` AS `dataId`,`p`.`codeholderId` AS `codeholderId`,`p`.`approved` AS `approved`,`p`.`notes` AS `notes`,`p`.`sequenceId` AS `sequenceId`,`p`.`price` AS `price`,`p`.`cancelledTime` AS `cancelledTime`,`p`.`checkInTime` AS `checkInTime`,`meta`.`amountPaid` AS `amountPaid`,`meta`.`hasPaidMinimum` AS `hasPaidMinimum`,`meta`.`isValid` AS `isValid` from (`congresses_instances_participants` `p` join `view_congresses_instances_participants_metadata` `meta` on((`meta`.`dataId` = `p`.`dataId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_congresses_instances_participants_metadata`
--

/*!50001 DROP VIEW IF EXISTS `view_congresses_instances_participants_metadata`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_congresses_instances_participants_metadata` AS select `congresses_instances_participants`.`dataId` AS `dataId`,(select coalesce((sum(`pay_triggerHist`.`amountTriggered`) - sum(`pay_intents`.`amountRefunded`)),0) from ((`pay_triggerHist` join `view_pay_intents_purposes` on(((`pay_triggerHist`.`paymentIntentId` = `view_pay_intents_purposes`.`paymentIntentId`) and (`pay_triggerHist`.`pos` = `view_pay_intents_purposes`.`pos`)))) join `pay_intents` on((`pay_triggerHist`.`paymentIntentId` = `pay_intents`.`id`))) where ((`view_pay_intents_purposes`.`trigger_congress_registration_dataId` = `congresses_instances_participants`.`dataId`) and (0 = `view_pay_intents_purposes`.`invalid`))) AS `amountPaid`,if((`congresses_instances_registrationForm`.`price_var` = NULL),NULL,((select `amountPaid`) >= least(`congresses_instances_participants`.`price`,coalesce(`congresses_instances_registrationForm`.`price_minUpfront`,`congresses_instances_participants`.`price`)))) AS `hasPaidMinimum`,if((`congresses_instances_participants`.`cancelledTime` <> NULL),false,if(`congresses_instances_registrationForm`.`manualApproval`,`congresses_instances_participants`.`approved`,((0 <> `congresses_instances_participants`.`approved`) or (0 <> (select coalesce(`hasPaidMinimum`,true)))))) AS `isValid` from (`congresses_instances_participants` join `congresses_instances_registrationForm` on((`congresses_instances_participants`.`congressInstanceId` = `congresses_instances_registrationForm`.`congressInstanceId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_pay_intents_purposes`
--

/*!50001 DROP VIEW IF EXISTS `view_pay_intents_purposes`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_pay_intents_purposes` AS select `pay_intents_purposes`.`paymentIntentId` AS `paymentIntentId`,`pay_intents_purposes`.`pos` AS `pos`,`pay_intents_purposes`.`type` AS `type`,`pay_intents_purposes`.`amount` AS `amount`,`pay_intents_purposes`.`originalAmount` AS `originalAmount`,`pay_intents_purposes`.`invalid` AS `invalid`,`pay_intents_purposes_addon`.`paymentAddonId` AS `paymentAddonId`,`pay_intents_purposes_addon`.`paymentAddon` AS `paymentAddon`,coalesce(`pay_intents_purposes_manual`.`title`,`pay_intents_purposes_trigger`.`title`) AS `title`,coalesce(`pay_intents_purposes_manual`.`description`,`pay_intents_purposes_trigger`.`description`,`pay_intents_purposes_addon`.`description`) AS `description`,`pay_intents_purposes_trigger`.`triggers` AS `triggers`,`pay_intents_purposes_trigger`.`triggerAmount_amount` AS `triggerAmount_amount`,`pay_intents_purposes_trigger`.`triggerAmount_currency` AS `triggerAmount_currency`,if((`pay_intents_purposes`.`type` = 'trigger'),if((`pay_intents`.`succeededTime` is null),'awaiting',if(exists(select 1 from `pay_triggerHist` where ((`pay_triggerHist`.`paymentIntentId` = `pay_intents_purposes`.`paymentIntentId`) and (`pay_triggerHist`.`pos` = `pay_intents_purposes`.`pos`))),'triggered','processing')),NULL) AS `triggerStatus`,`pay_intents_purposes_trigger_congress_registration`.`dataId` AS `trigger_congress_registration_dataId`,`pay_intents_purposes_trigger_registration_entry`.`registrationEntryId` AS `trigger_registration_entry_registrationEntryId` from ((((((`pay_intents_purposes` join `pay_intents` on((`pay_intents`.`id` = `pay_intents_purposes`.`paymentIntentId`))) left join `pay_intents_purposes_addon` on(((`pay_intents_purposes`.`type` = 'addon') and (`pay_intents_purposes`.`paymentIntentId` = `pay_intents_purposes_addon`.`paymentIntentId`) and (`pay_intents_purposes`.`pos` = `pay_intents_purposes_addon`.`pos`)))) left join `pay_intents_purposes_manual` on(((`pay_intents_purposes`.`type` = 'manual') and (`pay_intents_purposes`.`paymentIntentId` = `pay_intents_purposes_manual`.`paymentIntentId`) and (`pay_intents_purposes`.`pos` = `pay_intents_purposes_manual`.`pos`)))) left join `pay_intents_purposes_trigger` on(((`pay_intents_purposes`.`type` = 'trigger') and (`pay_intents_purposes`.`paymentIntentId` = `pay_intents_purposes_trigger`.`paymentIntentId`) and (`pay_intents_purposes`.`pos` = `pay_intents_purposes_trigger`.`pos`)))) left join `pay_intents_purposes_trigger_congress_registration` on(((`pay_intents_purposes`.`type` = 'trigger') and (`pay_intents_purposes_trigger`.`paymentIntentId` = `pay_intents_purposes_trigger_congress_registration`.`paymentIntentId`) and (`pay_intents_purposes_trigger`.`pos` = `pay_intents_purposes_trigger_congress_registration`.`pos`) and (`pay_intents_purposes_trigger`.`triggers` = 'congress_registration')))) left join `pay_intents_purposes_trigger_registration_entry` on(((`pay_intents_purposes`.`type` = 'trigger') and (`pay_intents_purposes_trigger`.`paymentIntentId` = `pay_intents_purposes_trigger_registration_entry`.`paymentIntentId`) and (`pay_intents_purposes_trigger`.`pos` = `pay_intents_purposes_trigger_registration_entry`.`pos`) and (`pay_intents_purposes_trigger`.`triggers` = 'registration_entry')))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_pay_triggerable`
--

/*!50001 DROP VIEW IF EXISTS `view_pay_triggerable`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_pay_triggerable` AS select `view_pay_intents_purposes`.`paymentIntentId` AS `paymentIntentId`,`view_pay_intents_purposes`.`pos` AS `pos`,`view_pay_intents_purposes`.`amount` AS `amount`,`pay_intents`.`currency` AS `currency`,`view_pay_intents_purposes`.`triggers` AS `triggers`,`view_pay_intents_purposes`.`triggerAmount_amount` AS `triggerAmount_amount`,`view_pay_intents_purposes`.`triggerAmount_currency` AS `triggerAmount_currency`,coalesce(`congresses_instances_registrationForm`.`price_currency`,`registration_entries`.`currency`) AS `targetCurrency` from ((((`view_pay_intents_purposes` join `pay_intents` on((`pay_intents`.`id` = `view_pay_intents_purposes`.`paymentIntentId`))) left join `forms_data` on((`forms_data`.`dataId` = `view_pay_intents_purposes`.`trigger_congress_registration_dataId`))) left join `congresses_instances_registrationForm` on((`congresses_instances_registrationForm`.`formId` = `forms_data`.`formId`))) left join `registration_entries` on((`registration_entries`.`id` = `view_pay_intents_purposes`.`trigger_registration_entry_registrationEntryId`))) where ((`view_pay_intents_purposes`.`type` = 'trigger') and (`pay_intents`.`succeededTime` is not null) and exists(select 1 from `pay_triggerHist` where ((`pay_triggerHist`.`paymentIntentId` = `view_pay_intents_purposes`.`paymentIntentId`) and (`pay_triggerHist`.`pos` = `view_pay_intents_purposes`.`pos`))) is false and (coalesce(`view_pay_intents_purposes`.`trigger_congress_registration_dataId`,`view_pay_intents_purposes`.`trigger_registration_entry_registrationEntryId`) is not null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_registration_entries_amountProcessed`
--

/*!50001 DROP VIEW IF EXISTS `view_registration_entries_amountProcessed`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_registration_entries_amountProcessed` AS select `registration_entries_triggerHist_processed`.`registrationEntryId` AS `registrationEntryId`,sum(`pay_triggerHist`.`amountTriggered`) AS `amountProcessed`,`pay_triggerHist`.`currencyTriggered` AS `currency` from (`registration_entries_triggerHist_processed` join `pay_triggerHist` on(((`registration_entries_triggerHist_processed`.`paymentIntentId` = `pay_triggerHist`.`paymentIntentId`) and (`registration_entries_triggerHist_processed`.`pos` = `pay_triggerHist`.`pos`)))) group by `registration_entries_triggerHist_processed`.`registrationEntryId`,`currency` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `view_registration_entries_processable`
--

/*!50001 DROP VIEW IF EXISTS `view_registration_entries_processable`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `view_registration_entries_processable` AS select `pay_intents_purposes_trigger_registration_entry`.`registrationEntryId` AS `registrationEntryId`,`pay_triggerHist`.`paymentIntentId` AS `paymentIntentId`,`pay_triggerHist`.`pos` AS `pos`,`pay_triggerHist`.`amountTriggered` AS `amountTriggered`,`pay_triggerHist`.`currencyTriggered` AS `currencyTriggered` from ((`pay_triggerHist` join `view_pay_intents_purposes` on(((`view_pay_intents_purposes`.`paymentIntentId` = `pay_triggerHist`.`paymentIntentId`) and (`view_pay_intents_purposes`.`pos` = `pay_triggerHist`.`pos`)))) join `pay_intents_purposes_trigger_registration_entry` on(((`pay_intents_purposes_trigger_registration_entry`.`paymentIntentId` = `pay_triggerHist`.`paymentIntentId`) and (`pay_intents_purposes_trigger_registration_entry`.`pos` = `pay_triggerHist`.`pos`)))) where exists(select 1 from `registration_entries_triggerHist_processed` where ((`registration_entries_triggerHist_processed`.`paymentIntentId` = `pay_triggerHist`.`paymentIntentId`) and (`registration_entries_triggerHist_processed`.`pos` = `pay_triggerHist`.`pos`))) is false */;
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

-- Dump completed on 2023-05-16 16:39:02
