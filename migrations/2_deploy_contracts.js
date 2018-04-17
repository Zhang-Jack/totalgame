var Adoption = artifacts.require("../contracts/Adoption.sol");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
};