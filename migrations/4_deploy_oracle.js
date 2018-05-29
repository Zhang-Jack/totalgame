var TTGOracle = artifacts.require("./TTGOracle.sol");

module.exports = function(deployer) {  
  deployer.deploy(TTGOracle, {overwrite: true, gas: 8512388});
};