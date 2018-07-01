var TTGOracle = artifacts.require("./TTGOracle.sol");

module.exports = function(deployer) {  
  deployer.deploy(TTGOracle, {overwrite: false, gas: 8512388});
};