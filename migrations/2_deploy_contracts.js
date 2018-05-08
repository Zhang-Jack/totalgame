var ItemRegistry = artifacts.require("./ItemRegistry.sol");

module.exports = function(deployer) {  
  deployer.deploy(ItemRegistry);
};