SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

CREATE SCHEMA IF NOT EXISTS `aspen` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci ;
USE `aspen` ;

-- -----------------------------------------------------
-- Table `aspen`.`user`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `aspen`.`user` ;

CREATE TABLE IF NOT EXISTS `aspen`.`user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `hash` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `aspen`.`project`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `aspen`.`project` ;

CREATE TABLE IF NOT EXISTS `aspen`.`project` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_project_user1_idx` (`user_id` ASC),
  CONSTRAINT `fk_project_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `aspen`.`user` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `aspen`.`source_file`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `aspen`.`source_file` ;

CREATE TABLE IF NOT EXISTS `aspen`.`source_file` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `delete_flag` TINYINT(1) NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_source_file_project_idx` (`project_id` ASC),
  CONSTRAINT `fk_source_file_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `aspen`.`project` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `aspen`.`compile_result`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `aspen`.`compile_result` ;

CREATE TABLE IF NOT EXISTS `aspen`.`compile_result` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `source_code` MEDIUMTEXT NULL,
  `is_sucess` TINYINT(1) NULL,
  `source_file_id` INT NOT NULL,
  `error_log` MEDIUMTEXT NULL,
  `compiled_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_compile_result_source_file1_idx` (`source_file_id` ASC),
  CONSTRAINT `fk_compile_result_source_file1`
    FOREIGN KEY (`source_file_id`)
    REFERENCES `aspen`.`source_file` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
