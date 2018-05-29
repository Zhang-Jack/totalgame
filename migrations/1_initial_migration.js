var ItemToken = artifacts.require("../contracts/ItemToken.sol");

module.exports = function(deployer) {
  deployer.deploy(ItemToken, {overwrite: false});
};