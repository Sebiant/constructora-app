-- Script to add NIT to provedores table
ALTER TABLE `provedores` ADD `nit` VARCHAR(20) NULL AFTER `id_provedor`;
